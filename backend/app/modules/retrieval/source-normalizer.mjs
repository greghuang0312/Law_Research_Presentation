import { randomUUID } from "node:crypto";

function normalizeHost(url) {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return "";
  }
}

function mapConfidence(sourceType) {
  if (sourceType === "official_gov") return 0.95;
  if (sourceType === "manual_import") return 0.9;
  return 0.75;
}

export function normalizeSourceItems({
  topic,
  traceId,
  retrievalMode,
  retrievedAt,
  rawItems,
}) {
  return rawItems.map((item) => ({
    id: randomUUID(),
    trace_id: traceId,
    topic,
    title: String(item.title ?? "").trim(),
    url: String(item.url ?? "").trim(),
    published_at: String(item.published_at ?? "").trim() || retrievedAt.slice(0, 10),
    source_type: String(item.source_type ?? "unknown").trim(),
    source_host: normalizeHost(item.url),
    confidence: mapConfidence(String(item.source_type ?? "unknown").trim()),
    retrieved_at: retrievedAt,
    retrieval_mode: retrievalMode,
  }));
}
