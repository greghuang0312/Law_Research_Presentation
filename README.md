# Law Lesson PPT MVP

本项目用于支持法律课程（民法/刑法）备课自动化，目标是形成“知识点输入 -> 案例与法条检索 -> 内容归纳 -> 课件生成”的本地化流程。

## 当前状态

- 已完成 Phase 3 / Task 1 初始化骨架
- 前端技术栈已固定：React + Vite + TypeScript
- 本地服务包含：
  - `GET /health` 健康检查
  - `GET /` MVP 首页
  - `GET /api/source-access-check` 来源策略与合规校验接口

## 项目结构

```text
backend/            # 后端分层模块化骨架（api/modules/integrations/infrastructure）
frontend/           # React + Vite + TypeScript 前端分层骨架（pages/components/features/services）
scripts/            # 启停脚本
docs/               # 需求/架构/计划/完成记录
outputs/            # 生成产物
logs/               # 测试与运行日志
tests/              # 初始化与后续测试脚本
```

## 本地运行

启动：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-dev.ps1
```

停止：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\stop-dev.ps1
```

## 校验命令

```powershell
node .\tests\task1-initialize.check.mjs
node .\tests\task2-compliance.check.mjs
```

## 人工通过后的统一提交

每个阶段/任务在你回复“通过”后，统一执行：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\commit-after-approval.ps1 -Message "chore: <checkpoint>"
```

提交哈希会写入终端输出，并需同步记录到 `docs/complete/*.md`。

## 前端开发

首次安装依赖：

```powershell
cd .\frontend
npm install
```

启动 Vite 开发服务器：

```powershell
npm run dev
```
