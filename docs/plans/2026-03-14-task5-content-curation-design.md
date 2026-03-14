# Task 5 Content Curation Design

**Date:** 2026-03-14
**Status:** Approved
**Scope:** Content Curation and Teaching Outline

## Goal

Transform retrieved `SourceItem[]` into structured teaching content that supports both chapter-level teaching design and slide-level PPT planning.

## Constraints

- Keep Task 5 focused on structured curation and teaching organization only.
- Do not generate `.pptx` files in this task.
- Do not move quality-gate checks from Task 7 into this task.
- Keep outputs traceable back to source retrieval results.

## Approved Decisions

### Output Shape

Task 5 outputs three object families:

- `CaseMaterial`
- `LawReference`
- `SummaryBlock`

`SummaryBlock` must support two layers:

- chapter-level teaching structure
- slide-level suggested breakdown via `slide_plan[]`

### SummaryBlock Section Types

Use these fixed section types:

- `intro`
- `case_facts`
- `issue_analysis`
- `law_application`
- `teaching_takeaway`

### Parameter Model

Support these task parameters:

- `difficulty`: `high-school` | `college` | `exam-prep`
- `lesson_style`: `case-first` | `law-first`
- `slide_density`: `light` | `standard` | `dense`
- `focus_points[]`

Default rules:

- default `difficulty` is `college`
- `slide_density` changes page granularity, not chapter structure
- `focus_points[]` overrides automatic emphasis priorities

### Difficulty Rules

- `high-school`
  - simpler terms
  - shorter bullet lists
  - fact-and-conclusion emphasis
- `college`
  - balanced factual and legal reasoning
  - moderate density
- `exam-prep`
  - denser reasoning
  - stronger rule extraction
  - answer-oriented phrasing

## Data Model

### CaseMaterial

Suggested minimum fields:

- `id`
- `trace_id`
- `source_item_id`
- `case_title`
- `fact_summary`
- `issues[]`
- `holding`
- `citation`

### LawReference

Suggested minimum fields:

- `id`
- `trace_id`
- `source_item_id`
- `law_title`
- `article_label`
- `rule_summary`
- `application_note`
- `citation`

### SummaryBlock

Suggested minimum fields:

- `id`
- `trace_id`
- `section_type`
- `section_title`
- `learning_goal`
- `key_points[]`
- `teacher_notes`
- `source_refs[]`
- `slide_plan[]`

### slide_plan Item

Suggested minimum fields:

- `slide_title`
- `bullets[]`
- `speaker_note`
- `source_refs[]`

## Generation Flow

1. Read stored `SourceItem[]` from Task 4 by `trace_id`.
2. Split sources into case-oriented and law/policy-oriented groups.
3. Produce `CaseMaterial[]`.
4. Produce `LawReference[]`.
5. Build chapter-level `SummaryBlock[]`.
6. Attach `slide_plan[]` suggestions to each block.

## API Shape

Add:

- `POST /api/curation/build-outline`

Request body:

- `topic`
- `trace_id`
- `difficulty`
- `lesson_style`
- `slide_density`
- `focus_points[]`

Response body:

- `case_materials`
- `law_references`
- `summary_blocks`

## Testing Strategy

- fixture-based deterministic tests first
- verify difficulty changes output granularity
- verify required fields are complete
- verify every generated output keeps source traceability

## Recommended Implementation Order

1. Write a failing Task 5 test with fixture-backed `SourceItem[]`.
2. Add extractors for `CaseMaterial` and `LawReference`.
3. Add `SummaryBlock` builder and slide planner.
4. Add curation API endpoint.
5. Run regressions and record execution evidence.
