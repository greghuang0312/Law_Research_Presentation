# Stack Skill Map

This file stores only the active stack-skill mappings for the current project.
Do not keep illustrative sample rows here.

## Usage Rules

1. Keep task field values as canonical stack-skill names.
2. Use `Resolution=global` by default.
3. Use `Resolution=local-mirror` only when customization, version pinning, audit reproducibility, or offline execution is required.
4. Use `Load Hint=task-only` by default.
5. Keep only the active baseline stack skills required by the current project.

| Stack Skill | Resolution | Global Path | Local Path | Version/Source | Load Hint | Notes |
|---|---|---|---|---|---|---|
| `web-dev` | `global` | `GLOBAL_SKILLS_ROOT/web-dev` | `SKILL_ROOT/references/stack/web-dev` | xpnobug/ai-agent-cli@web-dev (installed 2026-03-13) | `task-only` | 网页端开发通用能力（已安装） |
| `playwright` | `global` | `GLOBAL_SKILLS_ROOT/playwright` | `SKILL_ROOT/references/stack/playwright` | secondsky/claude-skills@playwright (installed 2026-03-13) | `task-only` | 浏览器自动化与E2E能力（已安装） |
| `legal-source-search` | `global` | `GLOBAL_SKILLS_ROOT/legal-source-search` | `SKILL_ROOT/references/stack/legal-source-search` | requirements-baseline-2026-03-13 | `task-only` | 裁判文书网与政府来源检索 |
| `content-extraction-and-summarization` | `global` | `GLOBAL_SKILLS_ROOT/content-extraction-and-summarization` | `SKILL_ROOT/references/stack/content-extraction-and-summarization` | requirements-baseline-2026-03-13 | `task-only` | 法律内容结构化归纳 |
| `citation-traceability` | `global` | `GLOBAL_SKILLS_ROOT/citation-traceability` | `SKILL_ROOT/references/stack/citation-traceability` | requirements-baseline-2026-03-13 | `task-only` | 引用与来源追溯 |
| `ppt-generation` | `global` | `GLOBAL_SKILLS_ROOT/ppt-generation` | `SKILL_ROOT/references/stack/ppt-generation` | requirements-baseline-2026-03-13 | `task-only` | PPT 模板与导出能力 |
| `llm-integration-legalone-r1` | `global` | `GLOBAL_SKILLS_ROOT/llm-integration-legalone-r1` | `SKILL_ROOT/references/stack/llm-integration-legalone-r1` | requirements-baseline-2026-03-13 | `task-only` | LegalOne-R1 集成 |
| `prompt-parameterization` | `global` | `GLOBAL_SKILLS_ROOT/prompt-parameterization` | `SKILL_ROOT/references/stack/prompt-parameterization` | requirements-baseline-2026-03-13 | `task-only` | 生成参数与导语控制 |
