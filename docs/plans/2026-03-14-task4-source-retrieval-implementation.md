# Task 4 Source Retrieval Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build source retrieval orchestration with SQLite persistence, normalized `SourceItem[]`, and dual live/fixture retrieval support for approved `gov.cn` sources.

**Architecture:** Keep retrieval logic in backend modules and integrations. Use a SQLite-backed repository for retrieval batches and items, a normalizer for stable output shape, and a minimal HTTP API for callers. Reuse the Task 2 policy, retry, and logging baseline instead of introducing a new compliance path.

**Tech Stack:** Node.js, built-in HTTP server, SQLite via local file, legal-source-search patterns, citation traceability rules

---

### Task 1: Add failing retrieval tests

**Files:**
- Create: `tests/task4-source-retrieval.check.mjs`
- Create: `tests/fixtures/retrieval/gov-cn-search.json`

**Step 1: Write the failing test**

- Assert required files for retrieval modules and SQLite storage exist.
- Assert fixture mode returns normalized `SourceItem[]`.
- Assert retrieval results are written to SQLite-backed storage.
- Assert blocked or invalid live retrieval cases return classified errors.

**Step 2: Run test to verify it fails**

Run: `node tests/task4-source-retrieval.check.mjs`
Expected: `FAIL` because retrieval modules and storage are not implemented yet.

**Step 3: Commit**

Commit after the test is red only if requested later by the workflow.

### Task 2: Add retrieval storage and normalization

**Files:**
- Create: `backend/app/infrastructure/storage/retrieval-repository.mjs`
- Create: `backend/app/modules/retrieval/source-normalizer.mjs`
- Create: `backend/data/.gitkeep`

**Step 1: Implement minimal SQLite-backed repository**

- Initialize database file location under `backend/data/`.
- Support writing retrieval batches, items, and errors.
- Support reading stored items by `trace_id`.

**Step 2: Implement source normalizer**

- Convert raw adapter output to `SourceItem[]`.
- Fill traceability fields and confidence score.

**Step 3: Run targeted test**

Run: `node tests/task4-source-retrieval.check.mjs`
Expected: still `FAIL`, but now for missing orchestration or API behavior.

### Task 3: Add fixture and live retrieval adapters

**Files:**
- Create: `backend/app/integrations/sources/gov-source-adapter.mjs`
- Create: `backend/app/integrations/sources/local-fixture-adapter.mjs`
- Modify: `backend/app/integrations/sources/README.md`

**Step 1: Implement fixture adapter**

- Load deterministic retrieval records from `tests/fixtures/retrieval/gov-cn-search.json`.

**Step 2: Implement live `gov.cn` adapter**

- Enforce whitelist host checks.
- Reuse retry and policy checks from Task 2.
- Return classified errors instead of throwing opaque failures.

**Step 3: Run targeted test**

Run: `node tests/task4-source-retrieval.check.mjs`
Expected: still `FAIL`, but now only for missing orchestrator/API wiring.

### Task 4: Add retrieval orchestrator and API

**Files:**
- Create: `backend/app/modules/retrieval/retrieval-orchestrator.mjs`
- Modify: `backend/app/api/router.mjs`
- Modify: `backend/server.mjs` if startup initialization is needed

**Step 1: Implement orchestrator**

- Accept `topic`, `mode`, and `allowOnlineSources`.
- Create `trace_id`.
- Call fixture or live adapters based on mode.
- Normalize and persist results.
- Return summary plus items.

**Step 2: Add HTTP endpoint**

- Add `POST /api/retrieval/search`.
- Return 200 for successful retrieval.
- Return classified error responses for blocked or invalid requests.

**Step 3: Run targeted test**

Run: `node tests/task4-source-retrieval.check.mjs`
Expected: `PASS`.

### Task 5: Run regressions and document Task 4

**Files:**
- Modify: `docs/complete/2026-03-13-law-lesson-ppt-completed.md`
- Modify: `backend/app/modules/retrieval/README.md`

**Step 1: Run regression checks**

Run:
- `node tests/task4-source-retrieval.check.mjs`
- `node tests/task3-legalone.check.mjs`
- `node tests/task2-compliance.check.mjs`

Expected: all `PASS`.

**Step 2: Record evidence**

- Save command output to `logs/`.
- Append Task 4 implementation summary and verification evidence to the completion record.

**Step 3: Stop for manual sign-off**

- Mark Task 4 as `PENDING_MANUAL`.
- Present review focus points and wait for the user reply.
