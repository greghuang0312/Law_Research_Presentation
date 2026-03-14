import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

function ensureDatabaseDirectory(rootDir) {
  const directory = path.join(rootDir, "backend", "data");
  mkdirSync(directory, { recursive: true });
  return directory;
}

export function getDatabasePath({ rootDir = process.cwd() } = {}) {
  ensureDatabaseDirectory(rootDir);
  return path.join(rootDir, "backend", "data", "retrieval.sqlite");
}

function openDatabase({ rootDir = process.cwd() } = {}) {
  const databasePath = getDatabasePath({ rootDir });
  const db = new DatabaseSync(databasePath);

  db.exec(`
    CREATE TABLE IF NOT EXISTS retrieval_batches (
      trace_id TEXT PRIMARY KEY,
      topic TEXT NOT NULL,
      mode TEXT NOT NULL,
      allow_online_sources INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      item_count INTEGER NOT NULL,
      error_count INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS source_items (
      id TEXT PRIMARY KEY,
      trace_id TEXT NOT NULL,
      topic TEXT NOT NULL,
      title TEXT NOT NULL,
      url TEXT NOT NULL,
      published_at TEXT NOT NULL,
      source_type TEXT NOT NULL,
      source_host TEXT NOT NULL,
      confidence REAL NOT NULL,
      retrieved_at TEXT NOT NULL,
      retrieval_mode TEXT NOT NULL,
      FOREIGN KEY(trace_id) REFERENCES retrieval_batches(trace_id)
    );

    CREATE TABLE IF NOT EXISTS retrieval_errors (
      id TEXT PRIMARY KEY,
      trace_id TEXT NOT NULL,
      classification TEXT NOT NULL,
      target_url TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(trace_id) REFERENCES retrieval_batches(trace_id)
    );
  `);

  return db;
}

export function persistRetrievalRun({
  rootDir = process.cwd(),
  traceId,
  topic,
  mode,
  allowOnlineSources,
  createdAt,
  items,
  errors,
}) {
  const db = openDatabase({ rootDir });

  try {
    const insertBatch = db.prepare(`
      INSERT OR REPLACE INTO retrieval_batches (
        trace_id, topic, mode, allow_online_sources, created_at, item_count, error_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const insertItem = db.prepare(`
      INSERT OR REPLACE INTO source_items (
        id, trace_id, topic, title, url, published_at, source_type, source_host, confidence, retrieved_at, retrieval_mode
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertError = db.prepare(`
      INSERT OR REPLACE INTO retrieval_errors (
        id, trace_id, classification, target_url, message, created_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `);

    insertBatch.run(
      traceId,
      topic,
      mode,
      allowOnlineSources ? 1 : 0,
      createdAt,
      items.length,
      errors.length,
    );

    const deleteItems = db.prepare("DELETE FROM source_items WHERE trace_id = ?");
    const deleteErrors = db.prepare("DELETE FROM retrieval_errors WHERE trace_id = ?");
    deleteItems.run(traceId);
    deleteErrors.run(traceId);

    for (const item of items) {
      insertItem.run(
        item.id,
        item.trace_id,
        item.topic,
        item.title,
        item.url,
        item.published_at,
        item.source_type,
        item.source_host,
        item.confidence,
        item.retrieved_at,
        item.retrieval_mode,
      );
    }

    for (const error of errors) {
      insertError.run(
        error.id,
        traceId,
        error.classification,
        error.target_url,
        error.message,
        error.created_at,
      );
    }
  } finally {
    db.close();
  }
}

export function getSourceItemsByTraceId({ rootDir = process.cwd(), traceId }) {
  const db = openDatabase({ rootDir });
  try {
    const query = db.prepare(`
      SELECT id, trace_id, topic, title, url, published_at, source_type, source_host, confidence, retrieved_at, retrieval_mode
      FROM source_items
      WHERE trace_id = ?
      ORDER BY published_at DESC, title ASC
    `);
    return query.all(traceId);
  } finally {
    db.close();
  }
}
