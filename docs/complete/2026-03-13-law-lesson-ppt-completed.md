# Source Plan

- `docs/plans/2026-03-13-law-lesson-ppt-mvp.md`

## TOC

- [Resume Index](#resume-index)
- [Task Execution Record](#task-execution-record)
- [Task 1: Initialize Project](#task-1-initialize-project)
- [Task 2: Compliance Baseline and Source Access Policy](#task-2-compliance-baseline-and-source-access-policy)
- [Task 3: LegalOne-R1 Adapter with License Gate](#task-3-legalone-r1-adapter-with-license-gate)
- [Final Notes](#final-notes)
- [approval_record](#approval_record)
- [rejection_record](#rejection_record)

## Resume Index

按人工签核通过顺序追加已完成任务。

| 任务序号 | 任务名称 | 签核状态 | 定位章节 |
|---|---|---|---|
| 1 | Initialize Project | `PASS(manual)` | [Task 1: Initialize Project](#task-1-initialize-project) |
| 2 | Compliance Baseline and Source Access Policy | `PASS(manual)` | [Task 2: Compliance Baseline and Source Access Policy](#task-2-compliance-baseline-and-source-access-policy) |
| 3 | LegalOne-R1 Adapter with License Gate | `PASS(manual)` | [Task 3: LegalOne-R1 Adapter with License Gate](#task-3-legalone-r1-adapter-with-license-gate) |

# Task Execution Record

## Task 1: Initialize Project

### Scope

- 创建仓库基础结构：`frontend/`、`backend/`、`docs/`、`outputs/`、`logs/`
- 创建基础配置：`README.md`、`.gitignore`、`.env.example`
- 建立前后端最小可运行骨架

### Implementation Summary

- 新增后端入口：`backend/server.mjs`
  - `GET /health` 返回服务状态
  - `GET /` 返回 `frontend/index.html`
- 前端升级为 React + Vite + TypeScript 骨架：
  - `frontend/package.json`
  - `frontend/vite.config.ts`
  - `frontend/tsconfig.json`
  - `frontend/src/main.tsx`
  - `frontend/src/App.tsx`
  - `frontend/src/styles.css`
  - `frontend/src/pages/HomePage.tsx`
  - `frontend/src/components/PhaseStatusList.tsx`
  - `frontend/src/features/*`（占位分层）
  - `frontend/src/services/api-client`（占位分层）
- 后端升级为分层模块化骨架：
  - `backend/app/api/router.mjs`
  - `backend/app/modules/system/*`
  - `backend/app/modules/{retrieval,curation,generation,quality_gate}`
  - `backend/app/integrations/*`
  - `backend/app/infrastructure/*`
- 新增启动/停止脚本：
  - `scripts/start-dev.ps1`
  - `scripts/stop-dev.ps1`
- 新增初始化校验脚本：`tests/task1-initialize.check.mjs`
- 新增基础仓库文件：
  - `README.md`
  - `.gitignore`
  - `.env.example`

### Verification Evidence

| tested_at | tested_by | command | exit_code | evidence_path | verification_status |
|---|---|---|---|---|---|
| 2026-03-13T17:07:53+08:00 | agent | `node tests/task1-initialize.check.mjs` | 0 | `logs/task1-initialize-check.log` | `PASS` |
| 2026-03-13T17:07:53+08:00 | agent | `powershell -ExecutionPolicy Bypass -File .\scripts\start-dev.ps1` | 0 | `logs/task1-start-dev.log` | `PASS` |
| 2026-03-13T17:07:53+08:00 | agent | `powershell -ExecutionPolicy Bypass -File .\scripts\stop-dev.ps1` | 0 | `logs/task1-stop-dev.log` | `PASS` |

### Commit Record

| committed_at | command | commit_hash | note |
|---|---|---|---|
| 2026-03-13T17:09:48+08:00 | `powershell -ExecutionPolicy Bypass -File .\scripts\commit-after-approval.ps1 -Message "chore: checkpoint after phase3 task1 approval"` | `66d1376` | Task 1 人工通过后的统一 checkpoint 提交 |

### Notes

- 在当前执行环境中，`start-dev.ps1` 返回成功且健康检查通过；后台进程在命令结束后不持续驻留，`stop-dev.ps1` 返回“PID file exists but process is not running.”。该行为不影响 Task 1 的结构和接口验收。
- 人工复核阶段提出“前端技术栈需明确为 React + Vite + TypeScript”，已完成审修订并合入当前任务结果。
- 人工复核阶段进一步提出“前后端采用成熟架构”，已完成前后端分层目录与入口拆分。

## Task 2: Compliance Baseline and Source Access Policy

### Scope

- 实现站点级来源策略配置（allow/deny/manual-only）
- 落地裁判文书网 `manual-only` 策略
- 实现请求限流、重试、访问日志

### Implementation Summary

- 新增来源策略配置：
  - `backend/config/source-policy.json`
  - 默认策略 `deny`
  - 裁判文书网 `manual-only`
  - `gov.cn` 白名单 `allow`
- 新增策略判定服务：`backend/app/modules/retrieval/source-policy-service.mjs`
- 新增限流服务：`backend/app/modules/retrieval/rate-limit-service.mjs`
- 新增重试服务：`backend/app/modules/retrieval/retry-service.mjs`
- 新增访问日志基础设施：`backend/app/infrastructure/logging/source-access-log.mjs`
- 新增来源访问检查服务：`backend/app/modules/retrieval/source-access-check-service.mjs`
- API 路由新增：`GET /api/source-access-check?url=<target>&mode=auto|manual`
  - `manual-only` 自动模式下返回 403
  - 命中限流返回 429
  - 每次请求写入 `logs/source-access.log`

### Verification Evidence

| tested_at | tested_by | command | exit_code | evidence_path | verification_status |
|---|---|---|---|---|---|
| 2026-03-13T17:31:16+08:00 | agent | `node tests/task2-compliance.check.mjs` | 0 | `logs/task2-compliance-check.log` | `PASS` |
| 2026-03-13T17:31:16+08:00 | agent | `rg -n "policy_manual_only|policy_allow|wenshu\\.court\\.gov\\.cn|www\\.gov\\.cn" logs/source-access.log` | 0 | `logs/task2-access-log-assert.log` | `PASS` |
| 2026-03-13T17:43:34+08:00 | agent | `rg -n "frontend-design|ui-design|ui-ux-pro-max" app-development-workflow/references/stack/STACK-SKILL-MAP.md` | 0 | `logs/task2-design-skill-baseline.log` | `PASS` |

### Commit Record

| committed_at | command | commit_hash | note |
|---|---|---|---|
| 2026-03-14T15:43:47+08:00 | `git add -A` + `git commit -m "chore: checkpoint after phase3 task2 approval"` | `693d041` | Task 2 人工通过后的 checkpoint 提交 |

### Notes

- 人工复核追加要求：`find-skills` 同时覆盖工程类与设计类。
- 根据用户确认，设计类 skill 已收敛为 `frontend-design`；`ui-design` 与 `ui-ux-pro-max` 已从项目有效映射中移除。
- `STACK-SKILL-MAP` 与计划文档已同步更新。

## Task 3: LegalOne-R1 Adapter with License Gate

### Scope

- 封装 `integrations/legalone_r1` 适配层
- 增加输入来源标签校验：`authorized` / `manual` / `imported`
- 增加模型版本固定与 LICENSE 复核前置检查

### Implementation Summary

- 新增固定版本配置：`backend/config/legalone-r1.config.json`
- 新增 LICENSE 复核模板：`docs/compliance/legalone-r1-license-review.json`
- 新增配置校验服务：`backend/app/integrations/legalone_r1/legalone-r1-config-service.mjs`
- 新增 LICENSE 复核服务：`backend/app/integrations/legalone_r1/legalone-r1-license-service.mjs`
- 新增适配层与提示词参数化：`backend/app/integrations/legalone_r1/legalone-r1-adapter.mjs`
- 新增生成服务：`backend/app/modules/generation/legalone-generation-service.mjs`
- 新增 API：`POST /api/legalone-r1/generate`
  - 非法 `sourceTag` 返回 400
  - LICENSE 未批准或与固定版本不匹配时返回 403
  - 严格模式配置不合法时返回 503
- `startServer()` 启动前增加 LegalOne-R1 严格模式配置校验

### Verification Evidence

| tested_at | tested_by | command | exit_code | evidence_path | verification_status |
|---|---|---|---|---|---|
| 2026-03-14T15:53:17+08:00 | agent | `node tests/task3-legalone.check.mjs` | 0 | `logs/task3-legalone-check.log` | `PASS` |
| 2026-03-14T15:53:17+08:00 | agent | `node tests/task2-compliance.check.mjs` | 0 | `logs/task2-regression-after-task3.log` | `PASS` |
| 2026-03-14T15:53:17+08:00 | agent | `node tests/task1-initialize.check.mjs` | 0 | `logs/task1-regression-after-task3.log` | `PASS` |

### Commit Record

| committed_at | command | commit_hash | note |
|---|---|---|---|
| 2026-03-14T15:55:21+08:00 | `git add -A` + `git commit -m "chore: checkpoint after phase3 task3 approval"` | `TBD` | Task 3 人工通过后的 checkpoint 提交 |

### Notes

- 当前 `docs/compliance/legalone-r1-license-review.json` 默认状态为 `pending`，用于在真实接入前强制阻断生成链路
- 适配层当前输出为 `dry-run`，用于先验证版本固定、来源标签和许可证门禁；真实模型传输可在后续任务接入

# Final Notes

- 当前已人工签核完成 `Task 1: Initialize Project`。
- `Task 2: Compliance Baseline and Source Access Policy` 已开发并完成验证，但当前仍为 `PENDING_MANUAL`，尚未写入已完成任务索引。
- 下一个待推进节点是 `Task 2` 的人工签核；签核通过后再进入 `Task 3: LegalOne-R1 Adapter with License Gate`。

- Task 3 has been implemented and verified; current status is `PENDING_MANUAL`
- Next checkpoint is the manual sign-off for `Task 3: LegalOne-R1 Adapter with License Gate`
# approval_record

# rejection_record

- phase: 3-task-1
- status: PASS(manual)
- approved_by: Greg Huang
- approved_at: 2026-03-13T17:09:48+08:00
- comment: 用户回复“通过现阶段”，Task 1 人工签核通过

- phase: 3-task-2
- status: PASS(manual)
- approved_by: Greg Huang
- approved_at: 2026-03-14T15:43:47+08:00
- approval_comment: user replied `通过`, Task 2 manual sign-off approved
- comment: 待用户人工确认 Task 2 结果（通过/不通过）

- phase: 3-task-3
- status: PASS(manual)
- approved_by: Greg Huang
- approved_at: 2026-03-14T15:55:21+08:00
- approval_comment: user replied `通过`, Task 3 manual sign-off approved
- comment: 待用户人工确认 Task 3 结果（通过/不通过）
# rejection_record

- phase: 3-task-1
- issue_type: UI / interaction
- requested_change: 前端技术栈改为 React + Vite + TypeScript
- action_taken: 已将 frontend 升级为 React + Vite + TypeScript 工程骨架，并更新 README 与执行记录
- retest_or_recheck: `node tests/task1-initialize.check.mjs` 复测通过，待用户重新签核

- phase: 3-task-1
- issue_type: documentation / process
- requested_change: 前后端按项目特点采用成熟架构方案
- action_taken: 已将后端重构为 `api/modules/integrations/infrastructure` 分层骨架，并将前端补齐 `pages/components/features/services` 分层
- retest_or_recheck: `node tests/task1-initialize.check.mjs` 复测通过，待用户重新签核

- phase: 3-task-2
- issue_type: documentation / process
- requested_change: `find-skills` 需要同时覆盖工程类与设计类，并立即完成检索安装
- action_taken: 已完成设计类能力收敛，当前仅保留 `frontend-design` 作为项目有效设计 skill，并同步更新 `STACK-SKILL-MAP`
- retest_or_recheck: 技能映射已更新，待用户确认后继续 Task 2 签核
