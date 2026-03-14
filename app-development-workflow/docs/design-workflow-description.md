# 设计流程说明

本文档用于解释 `app-development-workflow` 这套 skill 为什么这样设计。

它不是运行时权威来源。
真正生效的运行规则仅定义在以下文件中：
- `SKILL.md`
- `references/protocols.md`
- `references/phase-playbook.md`
- `references/stack/STACK-SKILL-MAP.md`

## 为什么采用六阶段

六阶段结构把需求澄清、方案设计、代码实现、验证测试、发布交付和后续迭代拆开处理。
这样可以让每个阶段的目标更清楚，也能避免在上一个阶段尚未确认前就提前进入下一个阶段。

## 为什么需要人工签核

人工签核让整个流程具备可审计性。
它可以避免阶段无声切换，并在范围、设计、发布等关键决策继续向后传递前，强制形成明确确认。

## 为什么区分 Method Skills 和 Stack Skills

Method Skills 决定“工作怎么做”。
Stack Skills 决定“具体技术怎么用”。
把两者分开后，可以减少上下文噪音，也能让任务级加载更精确。

## 为什么采用 plans / complete 配对

`docs/plans/*.md` 用来记录已经批准的执行计划。
`docs/complete/*.md` 用来记录实际做了什么、验证了什么、以及是否偏离原计划。
这样可以形成从计划到执行的清晰审计链路。

这里还需要进一步明确职责边界：
- `docs/plans/*.md` 是开发文档，不承担“已完成任务记录”的职责。
- `docs/complete/*.md` 是完成文档，只记录已经完成的任务、验证证据、提交记录和偏差说明。

## 为什么需要继续口令

项目开发经常不会在一次会话内完成。
如果只有 `新建` 和 `优化` 两个入口，就无法清晰区分“已交付后优化”和“未开发完继续做”这两种完全不同的场景。

增加 `继续` 口令后，workflow 可以把未完成项目的恢复动作独立出来，优先读取最少量的结构化索引，再定位到真正需要展开的任务内容。

## 为什么要加 Resume Index 和开发文档索引

TOC 适合给人看，但并不稳定到足以承担唯一的机器恢复入口。
因此这里采用双层定位：

- 每个 `docs/plans/*.md` 保留 TOC，并额外提供本文件的 `Resume Index`，用于暴露该文档内的任务框架。
- 每个 `docs/complete/*.md` 保留 TOC，并在 `Resume Index` 中逐条追加已经完成的任务。
- 只有当存在多个开发文档时，才创建 `docs/development-index.md`，用统一的 `任务序号 / 任务名称 / 任务所在文档名称` 三列完成跨文件定位。

这样在 `继续` 场景下，系统只需要：
1. 从 `docs/complete/*.md` 中读出最近已完成任务序号。
2. 如有多开发文档，再用 `docs/development-index.md` 找到目标计划文件。
3. 再通过目标 `docs/plans/*.md` 的 `Resume Index` 跳到对应任务章节。

这样既能降低 token 消耗，也能降低因全文重扫带来的定位漂移。

## 为什么区分 baseline discovery 和 gap-fill discovery

baseline discovery 放在需求签核之后，是为了让架构设计阶段能基于正确的 stack guidance 做决策。
gap-fill discovery 放在任务拆解阶段，是因为有些缺失能力只有拆成具体任务后才会暴露出来。

## 为什么 Phase 3 总是从 Initialize Project 开始

项目架构应在 Phase 2 完成定义，但在功能开发开始前，仍然需要把批准后的项目骨架真正创建出来、完成配置并验证可运行性。
把项目初始化固定为第一个实现任务，可以确保每个项目都从一个已批准、可复现的基础状态开始。
