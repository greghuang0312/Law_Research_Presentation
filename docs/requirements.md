# Project Summary

本项目目标是解决大专法律专业教师备课效率与质量稳定性问题。
MVP 以个人备课为目标，围绕民法/刑法课程，支持从知识点输入到接近最终版 PPT 的自动化产出。

当前确认的核心流程：
1. 选择本节课知识点
2. 联网检索权威与可信来源中的相关案例、法条与教学素材
3. 自动总结归纳并生成接近最终版的教学 PPT

# Target Users

- 当前用户：单一法律专业教师（个人使用）
- 课程方向：民法、刑法
- 后续扩展：可演进为多院校教师可用的通用产品

# Core Scenarios

1. 教师输入知识点并选择难度档位（低/中/高），可在生成前后调整导语提示和参数。
2. 系统按来源优先级检索案例与相关材料，并保留来源信息。
3. 系统提炼可授课内容（事实摘要、法律要点、教学重点、课堂结构建议）。
4. 系统生成接近最终版的完整 PPT，教师仅做少量微调后可使用。

# MVP Scope

## In Scope (V1)

- 本地网页应用形态（单机使用）
- 面向民法/刑法知识点的备课流程闭环
- 难度分档默认规则（用户可调整）：
  - 低难度：12-18 页，案例 2-3 个
  - 中难度：18-28 页，案例 3-5 个
  - 高难度：28-40 页，案例 5-8 个
- 来源优先级规则：
  1. 中国裁判文书网（https://wenshu.court.gov.cn/）
  2. 相关法律条款、权威法律解释、官方发布的相关介绍
  3. 相关政府网站
  4. 法律类大模型（LegalOne-R1）
  5. 高校/律所等可信站点补充
- 输出目标：接近最终版完整 PPT
- 人工修改工作量上限：不超过 20%

## Out of Scope (V1)

- 多用户协作与权限体系
- 公网部署与商业化交付流程
- 非民法/刑法领域的广泛课程覆盖
- 自动零修改直接发布（不经教师审校）

# Data Model Overview

建议在架构阶段细化，当前需求层数据对象如下：

- `LessonTopic`：课程知识点、所属学科（民法/刑法）、难度档位、目标页数与案例数量参数
- `SourceItem`：检索来源信息（站点类型、URL、标题、发布日期/裁判日期、可信度等级）
- `CaseMaterial`：案例事实、争议焦点、裁判要旨、教学价值标签
- `LawReference`：法条、条文内容、适用解释、关联案例
- `SummaryBlock`：可直接用于课件的知识总结、课堂讲解要点、讨论题
- `PPTDeck`：课件结构、页级内容、图文元素、引用清单
- `GenerationRecord`：生成参数、模型与来源使用记录、版本与修改记录

# Non-Functional Requirements

- 可用性：流程应覆盖“选题-检索-归纳-成稿”完整链路，支持教师按提示调整输出参数
- 质量目标：生成结果可直接用于授课准备，教师手工修改量 <= 20%
- 可追溯性：课件中的案例/法条内容应可追溯到来源
- 可维护性：规则（难度分档、来源优先级）应可配置，便于后续产品化
- 合规性：优先使用权威来源，避免无出处内容直接进入课件

# Technical Constraints

- 交付形态：本地网页应用（浏览器访问，单机运行）
- 运行前提：需要联网检索外部来源
- 内容语言：中文为主
- 外部依赖约束：
  - 需支持中国裁判文书网等来源的稳定检索能力
  - 需支持法律类模型 LegalOne-R1 的内容辅助能力（用于总结/补全，不替代权威来源）
- 结果约束：
  - 页数与案例数默认遵循难度分档
  - 用户可通过导语提示调整具体输出参数

# Baseline Stack Keywords (for Phase 2 Discovery)

- local-web-app
- legal-source-search
- content-extraction-and-summarization
- citation-traceability
- ppt-generation
- llm-integration-legalone-r1
- prompt-parameterization

Phase 1 仅完成关键词提取；详细 stack-skill discovery 在 Phase 2 基于架构与计划进一步落实。
Baseline stack discovery status: WAIVED_IN_PHASE1 (to be completed in Phase 2 Step 1).

# approval_record

- phase: 1
- status: PASS(manual)
- approved_by: Greg Huang
- approved_at: 2026-03-13T16:26:49+08:00
- comment: 用户回复“通过”，阶段 1 签核完成

# rejection_record

- phase: 1
- issue_type: documentation / process
- requested_change: 调整来源优先级的排序项
- action_taken: 已移除该来源项并更新来源规则
- retest_or_recheck: requirements.md 已更新，待用户重新签核

- phase: 1
- issue_type: documentation / process
- requested_change: 删除该来源项
- action_taken: 已从需求文档全部移除相关表述
- retest_or_recheck: requirements.md 已更新，待用户重新签核
