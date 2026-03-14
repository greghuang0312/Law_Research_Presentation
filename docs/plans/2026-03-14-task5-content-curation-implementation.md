# Task 5 Content Curation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build deterministic content curation and teaching-outline generation that converts Task 4 retrieval results into `CaseMaterial[]`, `LawReference[]`, and chapter-plus-slide level `SummaryBlock[]`.

**Architecture:** Keep Task 5 inside backend curation modules. Read retrieval results by `trace_id`, derive structured case and law objects, then build chapter-level teaching blocks with embedded slide suggestions. Expose the result through a minimal curation API for later frontend preview and PPT composition.

**Tech Stack:** Node.js, existing backend HTTP API, SQLite-backed retrieval storage, deterministic fixture-driven curation logic

---

### Task 1: Add failing curation tests

**Files:**
- Create: `tests/task5-content-curation.check.mjs`
- Create: `tests/fixtures/curation/source-items.json`

**Step 1: Write the failing test**

- Assert curation module files exist.
- Assert a known `trace_id` produces `case_materials`, `law_references`, and `summary_blocks`.
- Assert different `difficulty` values change output density.
- Assert all output objects contain source traceability fields.

**Step 2: Run test to verify it fails**

Run: `node tests/task5-content-curation.check.mjs`
Expected: `FAIL` because curation modules and API are not implemented yet.

### Task 2: Implement source-to-material extraction

**Files:**
- Create: `backend/app/modules/curation/case-material-extractor.mjs`
- Create: `backend/app/modules/curation/law-reference-extractor.mjs`
- Modify: `backend/app/modules/curation/README.md`

**Step 1: Implement case extraction**

- Build `CaseMaterial[]` from retrieval result records.

**Step 2: Implement law reference extraction**

- Build `LawReference[]` from retrieval result records.

**Step 3: Re-run targeted test**

Run: `node tests/task5-content-curation.check.mjs`
Expected: still `FAIL`, but only for missing summary block construction or API wiring.

### Task 3: Implement summary block builder

**Files:**
- Create: `backend/app/modules/curation/summary-block-builder.mjs`
- Create: `backend/app/modules/curation/slide-plan-builder.mjs`

**Step 1: Implement chapter-level summary block generation**

- Use fixed section types.
- Support `difficulty`, `lesson_style`, `slide_density`, and `focus_points[]`.

**Step 2: Implement slide planning**

- Generate `slide_plan[]` per summary block.

**Step 3: Re-run targeted test**

Run: `node tests/task5-content-curation.check.mjs`
Expected: still `FAIL`, but now only for missing orchestration or API shape.

### Task 4: Implement curation orchestration and API

**Files:**
- Create: `backend/app/modules/curation/curation-service.mjs`
- Modify: `backend/app/api/router.mjs`

**Step 1: Implement orchestration service**

- Load retrieval results by `trace_id`.
- Produce `case_materials`, `law_references`, and `summary_blocks`.

**Step 2: Add HTTP endpoint**

- Add `POST /api/curation/build-outline`.
- Validate request fields and return structured output.

**Step 3: Re-run targeted test**

Run: `node tests/task5-content-curation.check.mjs`
Expected: `PASS`.

### Task 5: Run regressions and document Task 5

**Files:**
- Modify: `docs/complete/2026-03-13-law-lesson-ppt-completed.md`

**Step 1: Run verification**

Run:
- `node tests/task5-content-curation.check.mjs`
- `node tests/task4-source-retrieval.check.mjs`
- `node tests/task3-legalone.check.mjs`

Expected: all `PASS`.

**Step 2: Save evidence**

- Write command output into `logs/`.
- Append Task 5 implementation summary and verification evidence into the completion record.

**Step 3: Stop for manual sign-off**

- Mark Task 5 as `PENDING_MANUAL`.
- Present review focus points and wait for user approval.
