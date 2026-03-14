import assert from "node:assert/strict";
import { existsSync, promises as fs } from "node:fs";
import path from "node:path";
import process from "node:process";
import { setTimeout as delay } from "node:timers/promises";
import { createServer } from "../backend/server.mjs";

const root = process.cwd();

const requiredPaths = [
  "tests/fixtures/retrieval/gov-cn-search.json",
  "backend/app/infrastructure/storage/retrieval-repository.mjs",
  "backend/app/modules/retrieval/source-normalizer.mjs",
  "backend/app/integrations/sources/gov-source-adapter.mjs",
  "backend/app/integrations/sources/local-fixture-adapter.mjs",
  "backend/app/modules/retrieval/retrieval-orchestrator.mjs",
];

for (const item of requiredPaths) {
  assert.ok(existsSync(path.join(root, item)), `missing required path: ${item}`);
}

const { getDatabasePath, getSourceItemsByTraceId } = await import("../backend/app/infrastructure/storage/retrieval-repository.mjs");
const { retrieveGovSources } = await import("../backend/app/integrations/sources/gov-source-adapter.mjs");

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

const dbPath = getDatabasePath({ rootDir: root });
await fs.rm(dbPath, { force: true });

const server = createServer({ rootDir: root });
await listen(server);

try {
  const fixtureResponse = await waitForResponse(`${baseUrl(server)}/api/retrieval/search`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      topic: "行政处罚法",
      mode: "fixture",
      allowOnlineSources: false,
    }),
  });

  assert.equal(fixtureResponse.status, 200);
  const fixturePayload = await fixtureResponse.json();
  assert.equal(fixturePayload.status, "ok");
  assert.ok(Array.isArray(fixturePayload.items));
  assert.ok(fixturePayload.items.length >= 2);
  assert.equal(fixturePayload.summary.error_count, 0);

  const firstItem = fixturePayload.items[0];
  assert.equal(firstItem.topic, "行政处罚法");
  assert.equal(firstItem.source_type, "official_gov");
  assert.equal(firstItem.source_host, "www.gov.cn");
  assert.equal(firstItem.retrieval_mode, "fixture");
  assert.ok(firstItem.trace_id);
  assert.ok(firstItem.title);
  assert.ok(firstItem.url);
  assert.ok(firstItem.published_at);
  assert.ok(typeof firstItem.confidence === "number");

  assert.ok(existsSync(dbPath), "retrieval sqlite file was not created");
  const storedItems = getSourceItemsByTraceId({
    rootDir: root,
    traceId: fixturePayload.trace_id,
  });
  assert.equal(storedItems.length, fixturePayload.items.length);

  const invalidModeResponse = await waitForResponse(`${baseUrl(server)}/api/retrieval/search`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      topic: "行政处罚法",
      mode: "unknown",
      allowOnlineSources: false,
    }),
  });

  assert.equal(invalidModeResponse.status, 400);
  const invalidModePayload = await invalidModeResponse.json();
  assert.equal(invalidModePayload.reason, "invalid_retrieval_mode");
} finally {
  await close(server);
}

const blockedResult = await retrieveGovSources({
  rootDir: root,
  topic: "行政处罚法",
  searchUrl: "https://example.com/not-allowed",
  fetchImpl: async () => {
    throw new Error("fetch should not be called for blocked sources");
  },
});

assert.equal(blockedResult.items.length, 0);
assert.equal(blockedResult.errors[0].classification, "policy_blocked");

const liveResult = await retrieveGovSources({
  rootDir: root,
  topic: "行政处罚法",
  searchUrl: "https://www.gov.cn/search",
  fetchImpl: async () =>
    new Response(
      JSON.stringify({
        items: [
          {
            title: "国务院关于加强行政执法协调监督的意见",
            url: "https://www.gov.cn/zhengce/2024-02/01/content_777777.htm",
            published_at: "2024-02-01",
            source_type: "official_gov",
          },
        ],
      }),
      {
        status: 200,
        headers: {
          "content-type": "application/json",
        },
      },
    ),
});

assert.equal(liveResult.errors.length, 0);
assert.equal(liveResult.items.length, 1);
assert.equal(liveResult.items[0].title, "国务院关于加强行政执法协调监督的意见");

console.log("task4 source retrieval checks passed");
