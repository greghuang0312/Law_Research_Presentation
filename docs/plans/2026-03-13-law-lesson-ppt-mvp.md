# 法律课程备课自动化 MVP Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

## TOC

- [Resume Index](#resume-index)
- [Architecture Context](#architecture-context)
- [Milestones](#milestones)
- [Commit Governance](#commit-governance)
- [Task List](#task-list)
- [Task 1: Initialize Project](#task-1-initialize-project)
- [Task 2: Compliance Baseline and Source Access Policy](#task-2-compliance-baseline-and-source-access-policy)
- [Task 3: LegalOne-R1 Adapter with License Gate](#task-3-legalone-r1-adapter-with-license-gate)
- [Task 4: Source Retrieval and Normalization](#task-4-source-retrieval-and-normalization)
- [Task 5: Content Curation and Teaching Outline](#task-5-content-curation-and-teaching-outline)
- [Task 6: PPT Composition Pipeline](#task-6-ppt-composition-pipeline)
- [Task 7: Citation and Quality Gate](#task-7-citation-and-quality-gate)
- [Task 8: End-to-End Validation and Handoff](#task-8-end-to-end-validation-and-handoff)
- [Risks and Rollback Notes](#risks-and-rollback-notes)
- [Skill Discovery Update (Phase 2 Revision)](#skill-discovery-update-phase-2-revision)
- [Skill Discovery Update (Phase 3 Revision)](#skill-discovery-update-phase-3-revision)
- [Post-Phase TODO (User Confirmed)](#post-phase-todo-user-confirmed)
- [approval_record](#approval_record)
- [rejection_record](#rejection_record)

## Resume Index

| 任务序号 | 任务名称 | 定位章节 |
|---|---|---|
| 1 | Initialize Project | [Task 1: Initialize Project](#task-1-initialize-project) |
| 2 | Compliance Baseline and Source Access Policy | [Task 2: Compliance Baseline and Source Access Policy](#task-2-compliance-baseline-and-source-access-policy) |
| 3 | LegalOne-R1 Adapter with License Gate | [Task 3: LegalOne-R1 Adapter with License Gate](#task-3-legalone-r1-adapter-with-license-gate) |
| 4 | Source Retrieval and Normalization | [Task 4: Source Retrieval and Normalization](#task-4-source-retrieval-and-normalization) |
| 5 | Content Curation and Teaching Outline | [Task 5: Content Curation and Teaching Outline](#task-5-content-curation-and-teaching-outline) |
| 6 | PPT Composition Pipeline | [Task 6: PPT Composition Pipeline](#task-6-ppt-composition-pipeline) |
| 7 | Citation and Quality Gate | [Task 7: Citation and Quality Gate](#task-7-citation-and-quality-gate) |
| 8 | End-to-End Validation and Handoff | [Task 8: End-to-End Validation and Handoff](#task-8-end-to-end-validation-and-handoff) |

**Goal:** 交付一个本地网页应用 MVP，完成“知识点输入 -> 合规检索 -> 内容归纳 -> 接近最终版 PPT 生成”闭环，并满足教师手工修改量不超过 20%。

**Architecture:** 采用前后端分层与流水线模块化。前端负责参数输入与结果预览，后端负责任务编排、来源检索、内容归纳与 PPT 生成，导出前由引用与质量闸门做合规和可追溯校验。

**Tech Stack:** web-dev, frontend-design, playwright, legal-source-search, content-extraction-and-summarization, citation-traceability, ppt-generation, llm-integration-legalone-r1, prompt-parameterization

---

## Architecture Context

- Source of truth:
  - `docs/requirements.md`
  - `docs/architecture.md`
  - `app-development-workflow/references/stack/STACK-SKILL-MAP.md`
- 合规基线：
  - 中国裁判文书网不做批量自动化抓取
  - 政府站点逐站白名单评估后接入
  - LegalOne-R1 仅处理合法取得文本

## Milestones

1. 项目骨架与本地运行环境可用
2. 来源检索与结构化归纳可用（含合规日志）
3. PPT 生成链路可用并可回溯引用
4. 端到端流程达成 MVP 验收

## Commit Governance

- 每个“人工确认通过（`通过`）”节点后，立即执行：
  - `git add -A`
  - `git commit -m "<checkpoint message>"`
- 提交命令统一使用：`scripts/commit-after-approval.ps1`
- 每次提交后的短哈希必须记录到 `docs/complete/2026-03-13-law-lesson-ppt-mvp.md`

## Task List

### Task 1: Initialize Project

**Required Skills (Method):** `test-driven-development`

**Required Skills (Stack):** `web-dev`

**Scope**
- 创建仓库基础结构：`frontend/`、`backend/`、`docs/`、`outputs/`、`logs/`
- 创建基础配置：`README.md`、`.gitignore`、`.env.example`
- 建立前后端最小可运行骨架

**Expected Deliverables**
- 本地一键启动脚本（或等价命令）
- 健康检查接口与首页可访问
- 初始化完成记录写入 `docs/complete/2026-03-13-law-lesson-ppt-mvp.md`

**Verification**
- 启动命令返回成功（exit code 0）
- 健康检查返回 200
- `verification_status` 目标：`PASS`

### Task 2: Compliance Baseline and Source Access Policy

**Required Skills (Method):** `test-driven-development`

**Required Skills (Stack):** `legal-source-search`, `citation-traceability`, `playwright`

**Scope**
- 实现站点级来源策略配置（allow/deny/manual-only）
- 落地裁判文书网 `manual-only` 策略
- 实现请求限流、重试、访问日志

**Expected Deliverables**
- 来源策略配置文件与加载逻辑
- 检索模块策略校验中间件
- 合规日志样例落盘到 `logs/`

**Verification**
- 对 `manual-only` 站点的自动抓取请求会被拒绝并记录日志
- 对白名单站点请求可正常执行
- `verification_status` 目标：`PASS`

### Task 3: LegalOne-R1 Adapter with License Gate

**Required Skills (Method):** `test-driven-development`

**Required Skills (Stack):** `llm-integration-legalone-r1`, `prompt-parameterization`

**Scope**
- 封装 `integrations/legalone_r1` 适配层
- 增加“输入来源标签”校验（authorized/manual/imported）
- 增加模型版本固定与 LICENSE 复核前置检查

**Expected Deliverables**
- 版本固定配置（模型名 + 版本/commit）
- LICENSE 复核记录模板
- 当未完成复核时阻断上线模式

**Verification**
- 未配置固定版本时，服务在严格模式下拒绝启动
- 未通过 LICENSE 复核时，生成链路返回明确错误
- `verification_status` 目标：`PASS`

### Task 4: Source Retrieval and Normalization

**Required Skills (Method):** `test-driven-development`

**Required Skills (Stack):** `legal-source-search`, `citation-traceability`

**Scope**
- 实现检索请求编排与结果标准化
- 输出 `SourceItem[]`（含 URL、标题、日期、来源类型、可信度）

**Expected Deliverables**
- 检索服务接口
- 标准化数据结构与持久化
- 检索失败重试与错误分类

**Verification**
- 给定知识点能返回可用来源集合
- 每条来源都具备可追溯字段
- `verification_status` 目标：`PASS`

### Task 5: Content Curation and Teaching Outline

**Required Skills (Method):** `test-driven-development`

**Required Skills (Stack):** `content-extraction-and-summarization`, `prompt-parameterization`

**Scope**
- 从来源文本抽取案例事实、争议焦点、裁判要旨
- 生成课堂结构化内容（SummaryBlock）
- 支持难度分档与用户参数覆盖

**Expected Deliverables**
- `CaseMaterial`、`LawReference`、`SummaryBlock` 生成逻辑
- 参数化提示词模板

**Verification**
- 低/中/高三档均能输出不同粒度的课程结构
- 输出字段完整且可用于后续 PPT 组装
- `verification_status` 目标：`PASS`

### Task 6: PPT Composition Pipeline

**Required Skills (Method):** `test-driven-development`

**Required Skills (Stack):** `ppt-generation`, `citation-traceability`

**Scope**
- 按结构化内容生成 `.pptx`
- 插入引用页或页内引用标注
- 输出生成记录（参数、来源、版本）

**Expected Deliverables**
- PPT 模板与导出服务
- 导出结果写入 `outputs/`
- 生成记录写入本地存储

**Verification**
- 样例知识点可生成可打开的 `.pptx`
- 引用信息在课件中可定位
- `verification_status` 目标：`PASS`

### Task 7: Citation and Quality Gate

**Required Skills (Method):** `test-driven-development`

**Required Skills (Stack):** `citation-traceability`, `web-dev`, `playwright`

**Scope**
- 导出前执行引用完整性校验
- 生成质量检查（页数范围、案例数量范围）
- 不通过时给出可操作修复提示

**Expected Deliverables**
- 质量闸门规则引擎
- 前端可视化告警面板

**Verification**
- 缺失引用时可阻断导出或进入人工确认流程
- 页数/案例数量越界时能给出告警
- `verification_status` 目标：`PASS`

### Task 8: End-to-End Validation and Handoff

**Required Skills (Method):** `qa-testing-strategy`, `systematic-debugging`

**Required Skills (Stack):** `web-dev`, `playwright`, `ppt-generation`

**Scope**
- 完成端到端场景测试（民法、刑法各至少一个）
- 记录人工评审与修改量评估
- 整理发布前文档与回滚说明

**Expected Deliverables**
- `docs/testing-report.md`
- `docs/complete/2026-03-13-law-lesson-ppt-mvp.md`
- MVP 操作手册与回滚步骤

**Verification**
- 至少两条 E2E 流程 `PASS`
- 人工修改量目标 <= 20%（人工核验）
- `verification_status` 目标：`PASS` 或 `PASS(manual)`

## Risks and Rollback Notes

- 风险：外部来源策略收紧导致数据覆盖不足
- 回滚：回退到“人工导入 + 模型整理 + PPT 生成”最小闭环
- 风险：模型版本变更导致结果漂移
- 回滚：锁定上一个已验证模型版本与提示词模板

## Skill Discovery Update (Phase 2 Revision)

- `find-skills` 搜索已执行，已安装：
  - `xpnobug/ai-agent-cli@web-dev`
  - `secondsky/claude-skills@playwright`
- 上述技能已同步写入 `STACK-SKILL-MAP.md`，用于 Phase 3 任务加载。
- 注意：安装输出提示 `playwright` 有安全风险告警，Phase 3 使用前需先审查 skill 内容与权限边界。

## Skill Discovery Update (Phase 3 Revision)

- 已按“工程类 + 设计类”双通道完成前端能力核对：
  - 工程类：`web-dev`、`playwright`
  - 设计类：`frontend-design`（唯一启用）
- 根据用户确认，`ui-design` 与 `ui-ux-pro-max` 已从本项目有效 skill 映射中移除。
- `STACK-SKILL-MAP.md` 已同步更新。

## Post-Phase TODO (User Confirmed)

- [ ] Phase 3 开始前固定 LegalOne-R1 具体版本，并以对应仓库 LICENSE 完成一次合规复核后再进入生成链路开发。

## approval_record

- phase: 2-step-2
- status: PASS(manual)
- approved_by: Greg Huang
- approved_at: 2026-03-13T16:51:36+08:00
- comment: 用户回复“通过”，阶段 2 步骤 2 签核完成

## rejection_record

- phase: 2-step-2
- issue_type: documentation / process
- requested_change: 人工签批用户名改为 Greg Huang；网页端开发缺少相应 skills
- action_taken: 审批用户名已统一为 Greg Huang；已通过 find-skills 检索并安装 `web-dev` 与 `playwright`，并更新任务技能映射
- retest_or_recheck: 计划与 STACK-SKILL-MAP 已更新，待用户重新签核
