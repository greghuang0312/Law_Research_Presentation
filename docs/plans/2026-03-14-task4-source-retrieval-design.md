# Task 4 Source Retrieval Design

**Date:** 2026-03-14
**Status:** Approved
**Scope:** Source Retrieval and Normalization

## Goal

Implement a retrieval flow that supports local/manual import plus `gov.cn` whitelist live retrieval, normalizes all results into `SourceItem[]`, persists them in SQLite, and preserves traceability fields for later curation and citation steps.

## Constraints

- Keep the current compliance baseline from Task 2.
- Only allow online retrieval through approved whitelist sources.
- Keep tests deterministic even when network access is unavailable.
- Avoid overbuilding plugin systems beyond Task 4 needs.

## Approved Decisions

### Retrieval Scope

- Support two source families in this task:
  - local/manual imported sources
  - live retrieval through `gov.cn` whitelist sources

### Persistence

- Use SQLite as the primary storage engine.
- Store retrieval batches, normalized source items, and retrieval errors in SQLite.

### Online Retrieval Depth

- Support both live retrieval and fixture-backed testing.
- Production path may use live retrieval.
- Tests must remain able to pass using local fixtures only.

## Module Boundaries

- `retrieval-orchestrator`
  - accepts the retrieval request
  - allocates `trace_id`
  - invokes fixture/manual and live adapters
  - returns normalized items plus summary
- `gov-source-adapter`
  - handles only approved `gov.cn` live retrieval
  - produces raw source records
- `source-normalizer`
  - transforms raw records into `SourceItem[]`
  - fills traceability and confidence fields
- `source-repository`
  - persists retrieval batches and normalized items into SQLite
- `retrieval-fixtures`
  - provides deterministic offline fixture input for tests

## SourceItem Fields

Each normalized item should contain at least:

- `id`
- `trace_id`
- `topic`
- `title`
- `url`
- `published_at`
- `source_type`
- `source_host`
- `confidence`
- `retrieved_at`
- `retrieval_mode`

## Data Flow

1. Receive retrieval request with `topic`, mode, and online allowance.
2. Create `trace_id`.
3. Run the configured retrieval adapters.
4. Normalize all raw results into `SourceItem[]`.
5. Persist the retrieval batch, items, and errors into SQLite.
6. Return normalized items and retrieval summary to the caller.

## Error Classification

Errors are normalized into these classes:

- `policy_blocked`
- `network_failure`
- `parse_failure`
- `storage_failure`

## API Shape

Add a minimal backend endpoint:

- `POST /api/retrieval/search`

Request body:

- `topic`
- `mode`: `fixture` | `live` | `hybrid`
- `allowOnlineSources`: boolean

Response body:

- `trace_id`
- `items: SourceItem[]`
- `summary`

## Testing Strategy

- Unit tests for normalization, confidence mapping, and error classification.
- Integration tests for SQLite schema and repository writes.
- Fixture-driven end-to-end retrieval test.
- Live retrieval path tested through adapter behavior without making the suite depend on external network availability.

## Recommended Implementation Order

1. Write failing tests for `SourceItem` normalization, SQLite persistence, and retrieval API behavior.
2. Add SQLite repository and schema bootstrap.
3. Implement fixture/manual retrieval path.
4. Implement `gov.cn` whitelist adapter and orchestrator.
5. Add final API wiring and regression checks.
