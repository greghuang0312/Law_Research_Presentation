import assert from "node:assert/strict";
import { existsSync, promises as fs } from "node:fs";
import path from "node:path";
import process from "node:process";
import { setTimeout as delay } from "node:timers/promises";
import { createServer } from "../backend/server.mjs";

const root = process.cwd();

const requiredPaths = [
  "tests/fixtures/curation/source-items.json",
  "backend/app/modules/curation/case-material-extractor.mjs",
  "backend/app/modules/curation/law-reference-extractor.mjs",
  "backend/app/modules/curation/summary-block-builder.mjs",
  "backend/app/modules/curation/slide-plan-builder.mjs",
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

function countDensity(summaryBlocks) {
  return summaryBlocks.reduce((total, block) => {
    const keyPointCount = Array.isArray(block.key_points) ? block.key_points.length : 0;
    const slideCount = Array.isArray(block.slide_plan) ? block.slide_plan.length : 0;
    const slideBulletCount = Array.isArray(block.slide_plan)
      ? block.slide_plan.reduce((sum, slide) => sum + (Array.isArray(slide.bullets) ? slide.bullets.length : 0), 0)
      : 0;
    return total + keyPointCount + slideCount + slideBulletCount;
  }, 0);
}

function assertTraceability(payload) {
  for (const item of payload.case_materials) {
    assert.equal(item.trace_id, "trace-task5-fixture");
    assert.ok(item.source_item_id);
    assert.ok(item.citation);
  }

  for (const item of payload.law_references) {
    assert.equal(item.trace_id, "trace-task5-fixture");
    assert.ok(item.source_item_id);
    assert.ok(item.citation);
  }

  for (const block of payload.summary_blocks) {
    assert.equal(block.trace_id, "trace-task5-fixture");
    assert.ok(Array.isArray(block.source_refs));
    assert.ok(block.source_refs.length > 0);
    assert.ok(Array.isArray(block.slide_plan));
    for (const slide of block.slide_plan) {
      assert.ok(Array.isArray(slide.source_refs));
      assert.ok(slide.source_refs.length > 0);
    }
  }
}

const dbPath = getDatabasePath({ rootDir: root });
await fs.rm(dbPath, { force: true });

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
  const highSchoolResponse = await waitForResponse(`${baseUrl(server)}/api/curation/build-outline`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      topic: fixture.topic,
      trace_id: fixture.trace_id,
      difficulty: "high-school",
      lesson_style: "case-first",
      slide_density: "light",
      focus_points: ["程序正当性", "陈述申辩权"],
    }),
  });

  assert.equal(highSchoolResponse.status, 200);
  const highSchoolPayload = await highSchoolResponse.json();
  assert.ok(Array.isArray(highSchoolPayload.case_materials));
  assert.ok(highSchoolPayload.case_materials.length >= 2);
  assert.ok(Array.isArray(highSchoolPayload.law_references));
  assert.ok(highSchoolPayload.law_references.length >= 2);
  assert.ok(Array.isArray(highSchoolPayload.summary_blocks));
  assert.equal(highSchoolPayload.summary_blocks.length, 5);

  const examPrepResponse = await waitForResponse(`${baseUrl(server)}/api/curation/build-outline`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      topic: fixture.topic,
      trace_id: fixture.trace_id,
      difficulty: "exam-prep",
      lesson_style: "law-first",
      slide_density: "dense",
      focus_points: ["程序正当性", "陈述申辩权"],
    }),
  });

  assert.equal(examPrepResponse.status, 200);
  const examPrepPayload = await examPrepResponse.json();
  assert.ok(countDensity(examPrepPayload.summary_blocks) > countDensity(highSchoolPayload.summary_blocks));
  assertTraceability(examPrepPayload);
} finally {
  await close(server);
}

console.log("task5 content curation checks passed");
