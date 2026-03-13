# Protocols

## Canonical Terms

Use these literals exactly:
- Trigger word: `你好`
- New-project route word: `新建`
- Optimization route word: `优化`
- Sign-off words: `通过`, `不通过`
- Task start word: `开始`
- Required fields: `Required Skills (Method)`, `Required Skills (Stack)`, `verification_status`
- Status values: `PASS`, `FAIL`, `PENDING_MANUAL`, `PASS(manual)`

All sign-off checkpoints, including Phase 2 Step 1 architecture approval, must use only `通过` or `不通过`.

## Path Scope

- `SKILL_ROOT` = this skill directory
- `PROJECT_ROOT` = the active user project root

## Init Welcome

Trigger: normalized user input is exactly `你好`

Output plain text only. Do not use ANSI color escape sequences or block-art banners.
Use this exact welcome text:

```text
欢迎使用 App Development Workflow, Design by Greg Huang。

这套流程一共分为 6 个阶段：
需求、架构、开发、测试、发布、迭代。
每个关键阶段完成后，我都会停下来，等你确认再继续。

你现在可以这样开始：
- 回复“新建”：开始一个新项目
- 回复“优化”：对一个已完成项目继续修改或优化
```

## Entry Commands

- `你好`: show the welcome text and route options
- `新建`: enter the new-project workflow and start from Phase 1
- `优化`: enter the post-delivery optimization workflow

## Optimization Mode Welcome

```text
已进入优化模式。

我会先帮你判断这次修改属于哪一类问题，再优先检查当前已有的 Method Skills、Stack Skills 和 STACK-SKILL-MAP 里有没有可直接复用的能力。
如果现有 skill 不够，我会继续查找可用 skill；如果仍然找不到，再按通用方式处理。

请先告诉我三件事：
1. 当前项目是做什么的
2. 你现在遇到的具体问题是什么
3. 你希望最终改成什么样
```

## Review Modes

Default mode: `standard`

- `strict`: manual review after every TDD step
- `standard`: manual review after every task
- `light`: manual review only at phase checkpoints

A single high-risk task may be upgraded to `strict`.

### Review Mode Selection Prompt

```text
进入开发阶段前，我们先确定一下审核节奏。

你可以选择：
1. strict：每个 TDD 步骤都暂停给你确认，最稳，但会最慢
2. standard：每个任务完成后再给你确认，推荐默认
3. light：每个阶段结束后再集中确认，最快，但风险也最高

如果你没有特别偏好，我会默认使用 standard。
```

## Sign-off Literal Hint

```text
你只需要回复“通过”或“不通过”。

“通过”表示你认可当前结果，可以继续下一步；
“不通过”表示我需要根据你的反馈先修改，再重新提交。
```

## Phase Transition Template

Use this as the only phase-transition prompt template.

```markdown
# 进入阶段 {{N}} 前，先做一次确认

我们即将进入【阶段 {{N}}：{{phase_name}}】。请先确认以下事项：
- 这一阶段应交付的内容是否齐全
- 测试证据是否可追溯，且状态为 `PASS` 或 `PASS(manual)`
- 风险点和回滚办法是否已记录
- 下一阶段所需输入是否都已准备完成

# 阶段 {{N}} 完成，等待签核

【阶段 {{N}}：{{phase_name}}】已完成，当前交付如下：
{{deliverables}}

请确认是否通过本阶段签核。
请仅回复：**通过** 或 **不通过**

# 签核通过后

收到，你已确认通过【阶段 {{N}}】。
接下来进入【阶段 {{N+1}}：{{next_phase_name}}】。
我会基于以下输入继续推进：
{{inputs}}
```

## Task Pause Template

```text
接下来要开始的任务是：【{{task_name}}】

来源计划：{{source_plan}}
任务范围：{{scope_summary}}
前置依赖：{{dependencies}}
预期产出：{{expected_output}}

如果你准备好了，请回复：开始
```

## Step Review Stop Message

Use only in `strict` mode.

```text
这一步已经完成，请你先看一下。

建议重点关注：{{step_review_focus}}

如果没有问题，请回复“通过”，我继续下一步。
```

## Manual Review Stop Message

Use primarily in `standard` mode.

```text
这个任务的开发和测试已经完成，接下来请你做一次人工确认。

建议重点关注：{{review_focus_points}}

如果确认没有问题，请回复“通过”，我再继续后续动作。
```

## Task Transition Template

```markdown
当前任务【{{task_name}}】已经完成并通过测试。

接下来我会开始下一个任务：【{{next_task_name}}】。
开始前，我会先检查它的输入、依赖和验收标准是否齐全。
```

## Task Evidence Fill Rules

Fill the verification evidence section directly after testing.

| Field | Rule |
|---|---|
| `tested_at` | ISO 8601 timestamp |
| `tested_by` | `agent` |
| `command` | actual command |
| `exit_code` | actual exit code |
| `evidence_path` | actual log path |
| `verification_status` | `PASS` / `FAIL` / `PENDING_MANUAL` / `PASS(manual)` |

Hard rules:
1. Never fabricate evidence
2. `PENDING_MANUAL` requires explicit user review
3. `PASS(manual)` may be used only after explicit user sign-off

## Post-Approval Commit Rule

Hard rule for this project:
1. After every explicit human sign-off `通过` (phase/task checkpoint), immediately run `git add` + `git commit`.
2. If repository is not initialized, initialize git first, then commit.
3. Record commit hash in the current execution artifact (`docs/complete/*.md` or phase artifact).
4. If there is no file change, record `no-change` with timestamp instead of fabricating a commit hash.

## Verification Status Flow

1. `FAIL` -> trigger debugging and retest
2. `PENDING_MANUAL` -> wait for manual review
3. `PASS(manual)` -> approved after explicit manual sign-off
4. `PASS` -> approved from executable tests

Progression rule:
Only proceed when final status is `PASS` or `PASS(manual)`.

## Adjustment Routing SOP

Use this SOP for all human feedback that requires modification, whether it happens:
- during an in-phase review or sign-off
- after delivery during later project usage

### A. In-Phase Adjustment

Applicable when the current phase or task is under active review and the user replies `不通过` or gives explicit change requests.

1. Ask for concrete modification reasons and requested changes if they are not already clear.
2. Classify the issue type:
   - UI / interaction
   - data layer
   - backend integration
   - algorithm / rules
   - test regression
   - documentation / process
3. Check whether the current phase `Required Skills (Method)` are applicable.
4. Check whether the current task or project baseline `Required Skills (Stack)` are applicable.
5. If applicable skills exist, follow those skills to perform the modification.
6. If not, use `find-skills` to search for an appropriate skill.
7. If no suitable skill is found, fall back to general LLM capability.
8. Record the issue under `rejection_record` in the current phase or task artifact.
9. Re-test and re-submit the current sign-off.

Stop rule:
1. Allow maximum 3 review loops for the same unresolved issue cluster.
2. If still rejected in loop 3, propose pause and re-scope.

### B. Post-Delivery Optimization

Applicable when the project has already been delivered and later usage produces new change requests.

1. Ask for the project background, current problem, and desired result if they are not already clear.
2. Classify the issue type:
   - UI / interaction
   - data layer
   - backend integration
   - algorithm / rules
   - test regression
   - documentation / process
3. Let the AI make an initial size judgment and explain why:
   - `S`: localized and deterministic
   - `M`: cross-file but not architecture-changing
   - `L`: architecture-impacting, scope-unclear, or multi-option tradeoff
4. The user may override the AI size judgment.
5. Check whether existing `Required Skills (Method)`, `Required Skills (Stack)`, or `STACK-SKILL-MAP.md` already provide the needed capability.
6. If applicable skills exist, follow those skills to perform the modification.
7. If not, use `find-skills` to search for an appropriate skill.
8. If no suitable skill is found, fall back to general LLM capability.
9. Route by size:
   - `S`: handle directly as a bounded optimization task
   - `M`: create a new pair of documents under `docs/plans/` and `docs/complete/`
   - `L`: trigger `brainstorming`, and if needed return to architecture supplementation before execution

## Rollback SOP

When rollback is needed:
1. State the issue and proposed rollback target phase
2. Ask for user confirmation
3. Roll back only after explicit user agreement
4. Log the rollback record to `SKILL_ROOT/references/optimizations/flow-optimization-log-YYYY-MM-DD.md`

Hard rule:
Never rollback a phase without user confirmation.

## Approval and Optimization Records

Append `approval_record` to the phase artifact.

Append optimization suggestions to:
`SKILL_ROOT/references/optimizations/flow-optimization-log-YYYY-MM-DD.md`

If the file for today already exists, append to it instead of creating a new one.
