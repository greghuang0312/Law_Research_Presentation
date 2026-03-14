---
name: app-development-workflow
description: Use when user input is `你好`, then route to internal branches `新建`, `优化`, or `继续`; also use when guiding end-to-end app delivery through a gated six-phase workflow that requires human approval, test evidence, phase-specific method skills, and project-specific stack-skill coordination.
---

# App Development Workflow

## Overview

This workflow guides app delivery through 6 gated phases:
1. Requirements
2. Architecture
3. Implementation
4. Testing
5. Release
6. Iteration

Write user-facing explanations in Chinese by default.
Keep canonical literals exactly as defined in `SKILL_ROOT/references/protocols.md`.

## Canonical Sources

Use these files as the only runtime authorities:
- `SKILL_ROOT/references/protocols.md`: literals, prompts, review modes, verification flow, rejection and rollback protocols
- `SKILL_ROOT/references/phase-playbook.md`: phase goals, phase skills, entry gates, deliverables, exemptions
- `SKILL_ROOT/references/stack/STACK-SKILL-MAP.md`: active stack-skill mappings for the current project

Do not redefine those rules elsewhere.

## Global Rules

1. Never skip a phase.
2. Never simulate sign-off.
3. Never claim success without evidence.
4. Never enter the next phase without explicit user reply `通过`.
5. Treat any non-`通过` response as not approved.
6. Retain only the minimal approved input set required by the next phase.
7. Record `approval_record` at phase completion.
8. Append one optimization entry after each approved phase.

## Method Skill Mirrors

Local method skill mirrors live under:
`SKILL_ROOT/references/method/<skill-name>/`

Phase-to-skill assignment is defined by `SKILL_ROOT/references/phase-playbook.md`, not by folder naming.

## Phase Skill Loading Rule

Load method skills by phase according to `references/phase-playbook.md`.
Load stack skills according to:
- baseline project skills from `STACK-SKILL-MAP.md`
- task-specific stack skills from `PROJECT_ROOT/docs/plans/*.md`

Only keep relevant stack skills loaded for the current task sequence.

## Startup

When normalized user input is exactly `你好`:
1. Follow `Init Welcome` in `references/protocols.md`
2. Wait for route selection

When normalized user input is exactly `新建`:
1. Enter Phase 1
2. Execute it strictly according to `references/phase-playbook.md` and `references/protocols.md`

When normalized user input is exactly `优化`:
1. Follow `Optimization Mode Welcome` in `references/protocols.md`
2. Start the post-delivery optimization path defined by `references/phase-playbook.md`

When normalized user input is exactly `继续`:
1. Follow `Continue Mode Welcome` in `references/protocols.md`
2. Start the in-progress continuation path defined by `references/phase-playbook.md` and `references/protocols.md`

## Phase Workflow

For each phase:
1. Read the current phase definition from `references/phase-playbook.md`
2. Load required method skills
3. Load required stack skills if applicable
4. Execute the phase deliverables
5. Use the prompts from `references/protocols.md`
6. Stop and wait for sign-off

Use `Adjustment Routing SOP` from `references/protocols.md` for any human feedback that requires modification.

Phase-specific method skills, stack-skill loading, deliverables, entry gates, review mode trigger points,
discovery timing, execution record rules, and post-delivery optimization routing are defined only in:
- `references/phase-playbook.md`
- `references/protocols.md`
