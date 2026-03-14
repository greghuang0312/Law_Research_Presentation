# Flow Optimization Log

Path base:
1. This file lives under `SKILL_ROOT/references/optimizations/`.
2. Append one row after each approved phase and before entering the next phase.

| 阶段 | 问题现象 | 建议改进 | 优先级 | 是否采纳 | 来源 |
|---|---|---|---|---|---|
| 1 | 需求签核阶段对来源优先级发生连续两次调整（先取消权威排序、再完全删除），导致二次返工 | 在 Phase 1 的来源治理提问中固定加入“是否完全排除某类来源”的显式确认项，签核前做一次来源清单复述确认 | 中 | 待定 | user suggestion |
| 2 | 阶段 2 评审后发现网页端开发 skill 缺口，导致计划二次修订 | 在 Phase 2 Step 2 完成后增加“已安装 skill 清单核对”关卡，未覆盖前端/测试关键能力时不得进入阶段签核 | 高 | 待定 | phase gate |
| 3 | Task 1 初版骨架在前后端架构成熟度上不够明确，评审后发生架构补强 | 在 Phase 3 Task 1 固化“架构成熟度基线检查”：前端必须明确框架与分层；后端必须明确模块边界与集成层，不满足则不得提交人工验收 | 高 | 待定 | user suggestion |
| 3 | 人工确认通过后缺少统一的提交动作约束，可能导致阶段产物与代码状态不一致 | 固化规则：每次人工确认“通过”后必须立即执行 `git add` + `git commit`，并在执行记录中附提交哈希 | 高 | 是 | user suggestion |
| 3 | `find-skills` 只覆盖工程类能力，未同步覆盖设计类能力，导致前端体验能力加载不完整 | 固化规则：每次前端任务的 skill discovery 必须同时执行“工程类 + 设计类”双通道检索，并在设计类仅保留一个主 skill（当前固定 frontend-design），结果记录到 STACK-SKILL-MAP | 高 | 是 | user suggestion |
| 3 | 未完成项目缺少专用续做入口，且 plans / complete / 多文档恢复索引规则不完整，导致继续开发时需要重复扫全文 | 新增 `继续` 口令；明确 `docs/plans/*.md` 仅作开发文档、`docs/complete/*.md` 仅作完成文档；为 plans 与 complete 增加 `Resume Index`；仅在多开发文档时增加 `docs/development-index.md`，用 `任务序号 / 任务名称 / 任务所在文档名称` 完成跨文件定位 | 高 | 是 | user suggestion |

