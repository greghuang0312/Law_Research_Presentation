import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { setTimeout as delay } from "node:timers/promises";
import { createServer, startServer } from "../backend/server.mjs";

const root = process.cwd();

const requiredPaths = [
  "backend/config/legalone-r1.config.json",
  "backend/app/integrations/legalone_r1/legalone-r1-config-service.mjs",
  "backend/app/integrations/legalone_r1/legalone-r1-license-service.mjs",
  "backend/app/integrations/legalone_r1/legalone-r1-adapter.mjs",
  "backend/app/modules/generation/legalone-generation-service.mjs",
  "docs/compliance/legalone-r1-license-review.json",
];

for (const item of requiredPaths) {
  assert.ok(existsSync(path.join(root, item)), `missing required path: ${item}`);
}

const licenseTemplate = JSON.parse(
  readFileSync(path.join(root, "docs/compliance/legalone-r1-license-review.json"), "utf8"),
);
assert.equal(typeof licenseTemplate.review_status, "string");
assert.ok(["approved", "pending", "rejected"].includes(licenseTemplate.review_status));

const tempRoot = mkdtempSync(path.join(os.tmpdir(), "law-research-task3-"));

function writeJson(relativePath, payload) {
  const filePath = path.join(tempRoot, relativePath);
  const directory = path.dirname(filePath);
  mkdirSync(directory, { recursive: true });
  writeFileSync(filePath, JSON.stringify(payload, null, 2));
}

writeJson("backend/config/legalone-r1.config.json", {
  strict_mode: true,
  provider: "legalone-r1",
  model_name: "LegalOne-R1",
  model_version: "",
  model_commit: "",
  prompt_template_version: "2026-03-14",
});

let startupError = null;
try {
  await startServer({ rootDir: tempRoot, port: 0 });
} catch (error) {
  startupError = error;
}

assert.ok(startupError, "strict mode startup should fail without pinned model version");
assert.match(String(startupError?.message), /pinned model version/i);

rmSync(tempRoot, { recursive: true, force: true });

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

const server = createServer({ rootDir: root });
await listen(server);

try {
  const rejectedLicense = await waitForResponse(`${baseUrl(server)}/api/legalone-r1/generate`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      sourceTag: "authorized",
      text: "请总结这份已授权教学案例的争议焦点。",
      promptOptions: {
        audience: "high-school",
        outputFormat: "bullet-summary",
      },
    }),
  });

  assert.equal(rejectedLicense.status, 403);
  const rejectedLicensePayload = await rejectedLicense.json();
  assert.equal(rejectedLicensePayload.status, "error");
  assert.equal(rejectedLicensePayload.reason, "license_review_pending");

  const invalidSourceTag = await waitForResponse(`${baseUrl(server)}/api/legalone-r1/generate`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      sourceTag: "scraped",
      text: "无效来源标签测试",
    }),
  });

  assert.equal(invalidSourceTag.status, 400);
  const invalidSourceTagPayload = await invalidSourceTag.json();
  assert.equal(invalidSourceTagPayload.status, "error");
  assert.equal(invalidSourceTagPayload.reason, "invalid_source_tag");
} finally {
  await close(server);
}

console.log("task3 legalone checks passed");
