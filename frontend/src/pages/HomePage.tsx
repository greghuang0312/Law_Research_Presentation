import { PhaseStatusList } from "../components/PhaseStatusList";

type PhaseItem = {
  name: string;
  status: "done" | "next" | "pending";
};

const phaseItems: PhaseItem[] = [
  { name: "需求确认", status: "done" },
  { name: "架构规划", status: "done" },
  { name: "初始化骨架", status: "done" },
  { name: "来源合规与抓取策略", status: "next" },
  { name: "课件生成链路", status: "pending" },
];

export function HomePage() {
  return (
    <div className="app-shell">
      <header className="hero">
        <p className="kicker">React + Vite + TypeScript</p>
        <h1>法律课程备课自动化 MVP</h1>
        <p>
          前后端均已切换到可扩展的分层骨架。后续将在现有结构上逐步实现检索、归纳与课件生成。
        </p>
      </header>
      <section className="panel">
        <h2>阶段追踪</h2>
        <PhaseStatusList items={phaseItems} />
      </section>
    </div>
  );
}
