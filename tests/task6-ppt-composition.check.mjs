import assert from "node:assert/strict";
import { existsSync, promises as fs } from "node:fs";
import path from "node:path";
import process from "node:process";
import { setTimeout as delay } from "node:timers/promises";
import { createServer } from "../backend/server.mjs";

const root = process.cwd();

const requiredPaths = [
  "tests/fixtures/curation/source-items.json",
  "backend/app/modules/curation/curation-service.mjs",
  "backend/app/api/router.mjs",
];

for (const item of requiredPaths) {
  assert.ok(existsSync(path.join(root, item)), `missing required path: ${item}`);
}

const {
  getDatabasePath,
  persistRetrievalRun,
} = await import("../backend/app/infrastructure/storage/retrieval-repository.mjs");

async function listen(server) {
  await new Promise((resolve, reject) => {
    server.listen(0, "127.0.0.1", (error) => {
      if (error) reject(error);
      else resolve();
    });
  });
}

async function close(server) {
  await new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) reject(error);
      else resolve();
    });
  });
}

function baseUrl(server) {
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("invalid server address");
  return `http://127.0.0.1:${address.port}`;
}

async function waitForResponse(url, init, timeoutMs = 8_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url, init);
      if (response.status > 0) return response;
    } catch {
      // retry
    }
    await delay(150);
  }

  throw new Error(`request timeout: ${url}`);
}

function findEndOfCentralDirectory(buffer) {
  for (let index = buffer.length - 22; index >= 0; index -= 1) {
    if (buffer.readUInt32LE(index) === 0x06054b50) {
      return index;
    }
  }

  throw new Error("zip end of central directory not found");
}

function readZipEntries(buffer) {
  const eocdOffset = findEndOfCentralDirectory(buffer);
  const totalEntries = buffer.readUInt16LE(eocdOffset + 10);
  const centralDirectoryOffset = buffer.readUInt32LE(eocdOffset + 16);
  const entries = new Map();

  let offset = centralDirectoryOffset;
  for (let index = 0; index < totalEntries; index += 1) {
    assert.equal(buffer.readUInt32LE(offset), 0x02014b50, "invalid central directory header");
    const compressionMethod = buffer.readUInt16LE(offset + 10);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const fileNameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const localHeaderOffset = buffer.readUInt32LE(offset + 42);
    const name = buffer.toString("utf8", offset + 46, offset + 46 + fileNameLength);

    entries.set(name, {
      compressionMethod,
      compressedSize,
      localHeaderOffset,
    });

    offset += 46 + fileNameLength + extraLength + commentLength;
  }

  return entries;
}

function readStoredZipEntry(buffer, entries, name) {
  const entry = entries.get(name);
  assert.ok(entry, `missing zip entry: ${name}`);
  assert.equal(entry.compressionMethod, 0, `zip entry must use store method: ${name}`);

  const localOffset = entry.localHeaderOffset;
  assert.equal(buffer.readUInt32LE(localOffset), 0x04034b50, "invalid local file header");
  const fileNameLength = buffer.readUInt16LE(localOffset + 26);
  const extraLength = buffer.readUInt16LE(localOffset + 28);
  const start = localOffset + 30 + fileNameLength + extraLength;
  const end = start + entry.compressedSize;
  return buffer.subarray(start, end);
}

const dbPath = getDatabasePath({ rootDir: root });
await fs.rm(dbPath, { force: true });
await fs.rm(path.join(root, "outputs", "ppt"), { recursive: true, force: true });
await fs.rm(path.join(root, "backend", "data", "generation-records"), { recursive: true, force: true });

const fixturePath = path.join(root, "tests", "fixtures", "curation", "source-items.json");
const fixture = JSON.parse(await fs.readFile(fixturePath, "utf8"));

persistRetrievalRun({
  rootDir: root,
  traceId: fixture.trace_id,
  topic: fixture.topic,
  mode: "fixture",
  allowOnlineSources: false,
  createdAt: fixture.created_at,
  items: fixture.items,
  errors: [],
});

const server = createServer({ rootDir: root });
await listen(server);

try {
  const response = await waitForResponse(`${baseUrl(server)}/api/ppt/export`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      topic: fixture.topic,
      trace_id: fixture.trace_id,
      difficulty: "college",
      lesson_style: "case-first",
      slide_density: "standard",
      focus_points: ["focus-a", "focus-b"],
      template: "default-classroom",
    }),
  });

  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.equal(payload.status, "ok");
  assert.equal(payload.deck.trace_id, fixture.trace_id);
  assert.equal(payload.deck.template, "default-classroom");
  assert.ok(Array.isArray(payload.deck.slides));
  assert.equal(payload.deck.slides.length, 6);
  assert.ok(payload.deck.slides.every((slide) => Array.isArray(slide.citations) && slide.citations.length > 0));

  const pptxPath = path.join(root, payload.export.pptx_path);
  const recordPath = path.join(root, payload.export.record_path);
  assert.ok(existsSync(pptxPath), `pptx not found: ${pptxPath}`);
  assert.ok(existsSync(recordPath), `record not found: ${recordPath}`);
  assert.match(pptxPath, /outputs[\\/]+ppt[\\/].+\.pptx$/);

  const zipBuffer = await fs.readFile(pptxPath);
  const entries = readZipEntries(zipBuffer);
  assert.ok(entries.has("[Content_Types].xml"));
  assert.ok(entries.has("_rels/.rels"));
  assert.ok(entries.has("ppt/presentation.xml"));
  assert.ok(entries.has("ppt/slides/slide1.xml"));
  assert.ok(entries.has("ppt/slides/slide6.xml"));

  const firstSlideXml = readStoredZipEntry(zipBuffer, entries, "ppt/slides/slide1.xml").toString("utf8");
  const lastSlideXml = readStoredZipEntry(zipBuffer, entries, "ppt/slides/slide6.xml").toString("utf8");
  assert.match(firstSlideXml, /Sources:/);
  assert.match(lastSlideXml, /Source Index/);
  assert.match(lastSlideXml, /example\.test/);

  const record = JSON.parse(await fs.readFile(recordPath, "utf8"));
  assert.equal(record.trace_id, fixture.trace_id);
  assert.equal(record.topic, fixture.topic);
  assert.equal(record.template, "default-classroom");
  assert.equal(record.slide_count, 6);
  assert.equal(record.source_count, fixture.items.length);
  assert.ok(Array.isArray(record.source_items));
  assert.equal(record.source_items.length, fixture.items.length);
  assert.ok(record.pipeline_version);
  assert.equal(record.output.pptx_path, payload.export.pptx_path);
} finally {
  await close(server);
}

console.log("task6 ppt composition checks passed");
