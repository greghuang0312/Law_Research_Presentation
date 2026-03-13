# 设计流程说明

本文档用于解释 app-development-workflow 这套 skill 为什么这样设计。

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

## 为什么区分 baseline discovery 和 gap-fill discovery

baseline discovery 放在需求签核之后，是为了让架构设计阶段能基于正确的 stack guidance 做决策。
gap-fill discovery 放在任务拆解阶段，是因为有些缺失能力只有拆成具体任务后才会暴露出来。

## 为什么 Phase 3 总是从 Initialize Project 开始

项目架构应在 Phase 2 完成定义，但在功能开发开始前，仍然需要把批准后的项目骨架真正创建出来、完成配置并验证可运行性。
把项目初始化固定为第一个实现任务，可以确保每个项目都从一个已批准、可复现的基础状态开始。
