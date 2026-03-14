# Flow Optimization Log

Path base:
1. This file lives under `SKILL_ROOT/references/optimizations/`.
2. Append one row after each approved phase and before entering the next phase.

| 阶段 | 问题现象 | 建议改进 | 优先级 | 是否采纳 | 来源 |
|---|---|---|---|---|---|
| 3 | 新建项目早期开发阶段被默认要求先切换到 worktree，增加了启动成本，也与单人连续实现场景不匹配 | 补充规则：`新建` 项目在早期连续开发阶段默认可直接在当前仓库执行；`优化` 路由或后期高风险改动、并行改动时再要求使用 `using-git-worktrees` 建立隔离工作区 | 中 | 待定 | user suggestion |
