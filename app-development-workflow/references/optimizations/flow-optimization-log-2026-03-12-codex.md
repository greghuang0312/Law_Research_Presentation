# 2026-03-12 流程优化日志（Codex 汇总）

## 文档目的

本文档用于记录 2026-03-12 这一次由 Codex 主导完成的 `app-development-workflow` skill 结构优化结果。

保留旧的优化日志，不覆盖它们。
旧日志负责说明“为什么会开始这一轮优化”。
本文档负责说明“这次最终决定怎么改，以及为什么这样改”。

## 本轮优化范围

本轮重构主要聚焦以下问题：
- 运行规则来源重复
- 阶段边界不清晰
- 不同阶段的 method skills / stack skills 不清晰
- 设计说明与运行规则混在一起
- 计划文档与完成文档职责不清

## 本轮最终决策汇总

| 优化领域 | 原问题 | 最终决策 | 调整原因 |
|---|---|---|---|
| 运行时权威来源 | 同一条规则散落在多个文档中，容易前后漂移 | 运行时权威来源收敛为 `SKILL.md`、`references/protocols.md`、`references/phase-playbook.md`、`references/stack/STACK-SKILL-MAP.md` | 这样可以减少冲突，明确“去哪里看规则” |
| 设计说明 | 旧设计说明容易被误认为仍然是运行规则 | 将设计说明收敛到 `docs/design-workflow-description.md` | 设计原因应该保留，但不能继续干扰运行规则 |
| 旧资产文档 | `assets/app-dev-workflow.md` 持续制造二义性 | 删除该文件 | 该文件已经失去运行价值，保留只会继续造成双源冲突 |
| Phase 1 技能边界 | Phase 1 是否加载哪些 skill 之前不明确 | Phase 1 固定使用 `brainstorming` 与 `requirements-analysis`，`development-pipeline` 改为条件触发 | 当前 workflow 自身已经定义了六阶段，因此 `development-pipeline` 不应常驻 |
| Phase 2 技能边界 | 架构设计和实施计划写作混在一起 | Phase 2 固定使用 `modular-architecture` 与 `writing-plans` | 架构设计与执行计划是两类不同职责，必须分别明确 |
| Phase 2 产出边界 | `architecture.md` 与 `docs/plans/*.md` 之前容易混淆 | Phase 2 明确拆分为 Step 1 和 Step 2 | 拆分后更利于签核，也更利于 Phase 3 严格执行 |
| Stack Skill 发现时机 | baseline discovery 与 gap-fill discovery 时机不清 | baseline discovery 放在 Phase 1 签核后，gap-fill discovery 放在 Phase 2 Step 2 | 有些 stack 缺口只有任务拆解后才会暴露 |
| Stack Map 示例污染 | 示例内容与真实项目映射写在同一个文件中 | 真实映射保存在 `references/stack/STACK-SKILL-MAP.md`，示例移到 `assets/STACK-SKILL-MAP.example.md` | 运行时配置文件不应混入示例内容 |
| 架构归属 | 项目整体架构到底写在哪里不明确 | `docs/architecture.md` 成为系统架构与仓库结构的唯一权威来源 | 计划应基于架构执行，而不是重新定义架构 |
| 项目初始化 | 项目初始化没有被固定为正式执行步骤 | 所有项目都要求 Phase 3 从 `Task 1: Initialize Project` 开始 | 目录骨架、依赖安装、基础配置、环境验证都必须先完成 |
| plans 与 complete | 计划文档与执行记录职责不清楚 | 采用 `docs/plans/*.md` 与 `docs/complete/*.md` 一一配对 | 这样可以形成从批准计划到实际执行的清晰审计链 |
| task 技能声明 | skills 到底应该写在 phase、task 还是 step 上不清楚 | 统一要求 task 级写 `Required Skills (Method)` 与 `Required Skills (Stack)`，step 仅在必要时使用 `Step Skill Override` | task 粒度足够精确，同时不会让每一步都变得过于冗长 |
| 审核节奏 | 审核粒度过于死板，不够灵活 | 增加 `strict`、`standard`、`light` 三种 review mode | 在保留质量门禁的同时，降低不必要的流程阻力 |
| Canonical Literals | 签核口令、启动词等容易漂移 | 统一收口到 `references/protocols.md` | 人工签核依赖精确字面量，一旦漂移就容易误触发 |
| 项目卫生规则 | README、logs、ignore、安全文件、环境变量示例缺少统一约束 | 在 `references/phase-playbook.md` 中补充 repository hygiene 要求 | 新项目初始化必须具备基本的安全和工程约束 |
| 优化日志保留策略 | 历史日志是否需要保留不明确 | 保留旧日志，并新增 Codex 汇总日志，而不是覆盖历史内容 | 旧日志解释问题来源，新日志解释最终决策，二者缺一不可 |

## 本轮涉及的核心文件调整

本轮重构重写或新增了以下关键文件：
- `SKILL.md`
- `references/protocols.md`
- `references/phase-playbook.md`
- `references/stack/STACK-SKILL-MAP.md`
- `assets/STACK-SKILL-MAP.example.md`
- `assets/task-template.md`
- `assets/flow-optimization-log-template.md`
- `docs/design-workflow-description.md`

本轮删除的文件：
- `assets/app-dev-workflow.md`

## 为什么要保留旧优化日志

保留旧日志的原因是：
- 它们记录了最早暴露出来的问题现象
- 它们保留了当时发现的混乱点和歧义点
- 它们能提醒后续维护者，这次结构重构并不是凭空发生，而是从真实问题中倒逼出来的

因此：
- 旧日志负责保留“问题背景”
- 本日志负责保留“最终决策”

两者是互补关系，不应互相替代。

## 本轮调整采纳状态

| 项目 | 状态 |
|---|---|
| 权威来源收敛 | 已采纳 |
| Phase Skill Matrix | 已采纳 |
| Phase 2 两步交付 | 已采纳 |
| Phase 3 固定初始化任务 | 已采纳 |
| plans / complete 配对 | 已采纳 |
| Stack Map 示例拆分 | 已采纳 |
| Review Modes | 已采纳 |
| 设计说明与运行规则分离 | 已采纳 |
| 历史优化日志保留 | 已采纳 |

## 后续说明

如果未来再次调整这套 workflow：
- 不要覆盖本文档
- 应新增新的日期汇总日志
- 保持“问题背景日志 + 最终决策日志”的链路连续
