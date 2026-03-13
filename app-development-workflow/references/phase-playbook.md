# Phase Playbook

## Phase Skill Matrix

| Phase | Name | Required Skills (Method) | Required Skills (Stack) | Core Deliverables |
|---|---|---|---|---|
| 1 | Requirements | `brainstorming`, `requirements-analysis` | discovery only | `PROJECT_ROOT/docs/requirements.md` |
| 2 | Architecture and Planning | `modular-architecture`, `writing-plans` | baseline stack skills | `PROJECT_ROOT/docs/architecture.md` + `PROJECT_ROOT/docs/plans/*.md` |
| 3 | Implementation | `test-driven-development` | baseline + task-specific stack skills | runnable implementation + completion record |
| 4 | Testing | `qa-testing-strategy`, `systematic-debugging` | same as Phase 3 when relevant | `PROJECT_ROOT/docs/testing-report.md` |
| 5 | Release | `finishing-a-development-branch`, `github-release-management` | release-related stack skills | release checklist + rollback steps |
| 6 | Iteration | `brainstorming` | optional | prioritized iteration backlog |

## Method Skill Mirrors

Keep method skill mirrors under:
`SKILL_ROOT/references/method/<skill-name>/`

These mirrors are local references for required method skills.
Phase-to-skill assignment is defined by the phase matrix, not by folder naming.

## Phase 1

### Goal

Turn user intent into explicit, testable requirements.

### Deliverable

`PROJECT_ROOT/docs/requirements.md`

### Required Output

- target users
- core scenarios
- MVP scope
- high-level data model
- non-functional requirements
- technical constraints

### Optional Method Skill

`development-pipeline`
Use only if the user needs extra guidance on development order or phase structure.

### Entry Gate to Phase 2

- `requirements.md` approved
- baseline stack keywords extracted
- baseline stack discovery completed or explicitly waived

## Phase 2

### Goal

Define the target project architecture and produce executable implementation plans.

### Step 1 Deliverable

`PROJECT_ROOT/docs/architecture.md`

### `architecture.md` must include

- `System Overview`
- `Architecture Diagram`
- `Module Boundaries`
- `Repository Structure`
- `Key Decisions`
- `Stack Skills Baseline`

### Step 1 also includes

- baseline stack-skill discovery
- update `STACK-SKILL-MAP.md`

### Step 2 Deliverable

`PROJECT_ROOT/docs/plans/YYYY-MM-DD-<feature>.md`

### Step 2 also includes

- task decomposition
- task-level `Required Skills (Method)`
- task-level `Required Skills (Stack)`
- gap-fill stack-skill discovery when needed
- update `STACK-SKILL-MAP.md` again if gaps are found

### Entry Gate to Phase 3

- `architecture.md` approved
- `docs/plans/*.md` approved
- required baseline stack skills recorded in `STACK-SKILL-MAP.md`

## Phase 3

### Goal

Implement the approved plan with test-backed execution.

### Fixed First Task

`Task 1: Initialize Project`

This task must:
- create the approved project scaffold
- create base files
- install required dependencies
- prepare base configuration files
- verify the environment is ready

### Execution Rule

All Phase 3 work must follow approved `PROJECT_ROOT/docs/plans/*.md`.

### Completion Record

Each plan must have a paired:
`PROJECT_ROOT/docs/complete/YYYY-MM-DD-<feature>.md`

## Phase 4

### Goal

Validate the system from a broader testing perspective.

### Deliverable

`PROJECT_ROOT/docs/testing-report.md`

## Phase 5

### Goal

Prepare controlled release and rollback readiness.

### Exemption

Release may be exempted only when at least one of these is true:
- the runtime environment is local or single-machine only
- the project has no external users and is only an internal tool or POC

When exempted, still output:
- a one-line exemption statement
- three smoke test results

## Phase 6

### Goal

Turn feedback into bounded iteration work.

### Output

A short prioritized iteration list.

### Exemption

Iteration may be exempted only when at least one of these is true:
- the project lifecycle is one month or less
- there is no ongoing user feedback channel

When exempted, still output:
- three to five project lessons learned

## Post-Delivery Optimization Path

Use this path when a delivered project receives later change requests during actual usage.

### Optimization Size Classification

The AI makes the initial size judgment and explains why.
The user may override that judgment.

- `S`: localized and deterministic, usually handled directly
- `M`: cross-file but not architecture-changing, requires a new plan/complete pair
- `L`: architecture-impacting, scope-unclear, or requires tradeoff discussion

### Routing Rule

- `S`: execute as a bounded optimization task
- `M`: create:
  - `PROJECT_ROOT/docs/plans/YYYY-MM-DD-optimization-<topic>.md`
  - `PROJECT_ROOT/docs/complete/YYYY-MM-DD-optimization-<topic>.md`
- `L`: trigger `brainstorming`, and if needed supplement `architecture.md` before implementation

## Recommended Project Layout

```text
PROJECT_ROOT/
├─ README.md
├─ .gitignore
├─ .env.example
├─ docs/
│  ├─ requirements.md
│  ├─ architecture.md
│  ├─ plans/
│  │  └─ YYYY-MM-DD-<feature>.md
│  ├─ complete/
│  │  └─ YYYY-MM-DD-<feature>.md
│  └─ testing-report.md
├─ logs/
└─ ...
```

## Repository Hygiene

- Keep both `README.md` and `logs/`.
- `README.md` is for project overview, startup guidance, and repository navigation.
- `logs/` is for test evidence, execution traces, and troubleshooting artifacts.
- Do not replace one with the other.

### `.gitignore`

Project `.gitignore` should ignore at least:
- `.env`
- `logs/`
- local cache directories
- private keys
- certificates
- exported secret files
- local-only security documentation

### `.env.example`

Project `.env.example` should contain:
- variable names
- safe placeholder values

Do not store real secrets in `.env.example`.

## Recommended Project Document Sections

### `docs/requirements.md`

- `Project Summary`
- `Target Users`
- `Core Scenarios`
- `MVP Scope`
- `Data Model Overview`
- `Non-Functional Requirements`
- `Technical Constraints`
- `approval_record`

### `docs/architecture.md`

- `System Overview`
- `Architecture Diagram`
- `Module Boundaries`
- `Repository Structure`
- `Key Decisions`
- `Stack Skills Baseline`
- `approval_record`

### `docs/plans/YYYY-MM-DD-<feature>.md`

- `Goal`
- `Architecture Context`
- `Tech Stack`
- `Task 1: Initialize Project`
- subsequent feature tasks

### `docs/complete/YYYY-MM-DD-<feature>.md`

- `Source Plan`
- task-by-task execution record
- verification evidence
- final notes
- `approval_record`
