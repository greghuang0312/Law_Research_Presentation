import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { setTimeout as delay } from "node:timers/promises";

const root = process.cwd();

const requiredPaths = [
  "frontend",
  "frontend/src/pages",
  "frontend/src/components",
  "frontend/src/features/topic-config",
  "frontend/src/features/preview-editor",
  "frontend/src/services/api-client",
  "backend",
  "backend/app/api",
  "backend/app/modules/system",
  "backend/app/modules/retrieval",
  "backend/app/modules/curation",
  "backend/app/modules/generation",
  "backend/app/modules/quality_gate",
  "backend/app/integrations/legalone_r1",
  "backend/app/integrations/sources",
  "backend/app/infrastructure/storage",
  "backend/app/infrastructure/logging",
  "outputs",
  "logs",
  "README.md",
  ".gitignore",
  ".env.example",
  "backend/server.mjs",
  "frontend/index.html",
  "scripts/start-dev.ps1",
];

async function waitForUrl(url, timeoutMs = 8000) {
  const deadline = Date.now() + timeoutMs;
  let lastError = new Error("endpoint not ready");

  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return response;
      lastError = new Error(`unexpected status: ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await delay(250);
  }

  throw lastError;
}

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
  if (!address || typeof address === "string") {
    throw new Error("invalid server address");
  }
  return `http://127.0.0.1:${address.port}`;
}

for (const item of requiredPaths) {
  assert.ok(existsSync(path.join(root, item)), `missing required path: ${item}`);
}

const { createServer } = await import("../backend/server.mjs");

const server = createServer({ rootDir: root });
await listen(server);

try {
  const healthResponse = await waitForUrl(`${baseUrl(server)}/health`);
  const healthPayload = await healthResponse.json();
  assert.equal(healthPayload.status, "ok");

  const homeResponse = await waitForUrl(`${baseUrl(server)}/`);
  const html = await homeResponse.text();
  assert.match(html, /法律课程备课自动化 MVP/);
} finally {
  await close(server);
}

console.log("task1 initialize checks passed");
