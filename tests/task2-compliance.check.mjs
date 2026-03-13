import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { promises as fs } from "node:fs";
import path from "node:path";
import process from "node:process";
import { setTimeout as delay } from "node:timers/promises";
import { createServer } from "../backend/server.mjs";
import { loadSourcePolicies, evaluateSourcePolicy } from "../backend/app/modules/retrieval/source-policy-service.mjs";
import { createRateLimiter } from "../backend/app/modules/retrieval/rate-limit-service.mjs";
import { withRetry } from "../backend/app/modules/retrieval/retry-service.mjs";

const root = process.cwd();
const logPath = path.join(root, "logs", "source-access.log");

const requiredPaths = [
  "backend/config/source-policy.json",
  "backend/app/modules/retrieval/source-policy-service.mjs",
  "backend/app/modules/retrieval/rate-limit-service.mjs",
  "backend/app/modules/retrieval/retry-service.mjs",
  "backend/app/infrastructure/logging/source-access-log.mjs",
];

for (const item of requiredPaths) {
  assert.ok(existsSync(path.join(root, item)), `missing required path: ${item}`);
}

const policies = await loadSourcePolicies({ rootDir: root });
const wenshuPolicy = evaluateSourcePolicy({
  policies,
  targetUrl: "https://wenshu.court.gov.cn/",
  mode: "auto",
});

assert.equal(wenshuPolicy.allowed, false);
assert.equal(wenshuPolicy.rule.mode, "manual-only");

const limiter = createRateLimiter({ limit: 2, windowMs: 60_000 });
assert.equal(limiter.tryConsume("wenshu.court.gov.cn").allowed, true);
assert.equal(limiter.tryConsume("wenshu.court.gov.cn").allowed, true);
assert.equal(limiter.tryConsume("wenshu.court.gov.cn").allowed, false);

let retryAttempts = 0;
const retryResult = await withRetry(
  async () => {
    retryAttempts += 1;
    if (retryAttempts < 3) throw new Error("transient");
    return "ok";
  },
  { retries: 2, delayMs: 5 },
);
assert.equal(retryResult, "ok");
assert.equal(retryAttempts, 3);

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

async function waitForUrl(url, timeoutMs = 8_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok || response.status >= 400) return response;
    } catch {
      // retry
    }
    await delay(200);
  }
  throw new Error(`request timeout: ${url}`);
}

await fs.rm(logPath, { force: true });

const server = createServer({ rootDir: root });
await listen(server);

try {
  const deniedResponse = await waitForUrl(
    `${baseUrl(server)}/api/source-access-check?url=${encodeURIComponent("https://wenshu.court.gov.cn/")}&mode=auto`,
  );
  assert.equal(deniedResponse.status, 403);
  const deniedPayload = await deniedResponse.json();
  assert.equal(deniedPayload.status, "blocked");
  assert.equal(deniedPayload.rule.mode, "manual-only");

  const allowedResponse = await waitForUrl(
    `${baseUrl(server)}/api/source-access-check?url=${encodeURIComponent("https://www.gov.cn/")}&mode=auto`,
  );
  assert.equal(allowedResponse.status, 200);
  const allowedPayload = await allowedResponse.json();
  assert.equal(allowedPayload.status, "allowed");
} finally {
  await close(server);
}

assert.ok(existsSync(logPath), "access log file not found");
const logText = readFileSync(logPath, "utf8");
assert.match(logText, /wenshu\.court\.gov\.cn/);
assert.match(logText, /www\.gov\.cn/);

console.log("task2 compliance checks passed");
