import { randomUUID } from "node:crypto";
import { loadFixtureSources } from "../../integrations/sources/local-fixture-adapter.mjs";
import { retrieveGovSources } from "../../integrations/sources/gov-source-adapter.mjs";
import { normalizeSourceItems } from "./source-normalizer.mjs";
import { persistRetrievalRun } from "../../infrastructure/storage/retrieval-repository.mjs";

const VALID_MODES = new Set(["fixture", "live", "hybrid"]);

export function validateRetrievalMode(mode) {
  if (!VALID_MODES.has(mode)) {
    const error = new Error("invalid retrieval mode");
    error.code = "invalid_retrieval_mode";
    throw error;
  }
}

function createBlockedOnlineError() {
  return {
    id: randomUUID(),
    classification: "policy_blocked",
    target_url: "",
    message: "online retrieval is disabled for this request",
    created_at: new Date().toISOString(),
  };
}

export async function runRetrieval({
  rootDir = process.cwd(),
  topic,
  mode = "fixture",
  allowOnlineSources = false,
}) {
  const normalizedMode = String(mode ?? "fixture").trim().toLowerCase();
  validateRetrievalMode(normalizedMode);

  const traceId = randomUUID();
  const createdAt = new Date().toISOString();
  const rawItems = [];
  const errors = [];

  if (normalizedMode === "fixture" || normalizedMode === "hybrid") {
    rawItems.push(
      ...(await loadFixtureSources({
        rootDir,
        topic,
      })),
    );
  }

  if (normalizedMode === "live" || normalizedMode === "hybrid") {
    if (!allowOnlineSources) {
      errors.push(createBlockedOnlineError());
    } else {
      const govResult = await retrieveGovSources({
        rootDir,
        topic,
      });
      rawItems.push(...govResult.items);
      errors.push(...govResult.errors);
    }
  }

  const items = normalizeSourceItems({
    topic,
    traceId,
    retrievalMode: normalizedMode,
    retrievedAt: createdAt,
    rawItems,
  });

  persistRetrievalRun({
    rootDir,
    traceId,
    topic,
    mode: normalizedMode,
    allowOnlineSources,
    createdAt,
    items,
    errors,
  });

  return {
    trace_id: traceId,
    items,
    errors,
    summary: {
      item_count: items.length,
      error_count: errors.length,
      retrieval_mode: normalizedMode,
    },
  };
}
