type Item = {
  name: string;
  status: "done" | "next" | "pending";
};

function statusLabel(status: Item["status"]) {
  if (status === "done") return "已完成";
  if (status === "next") return "下一步";
  return "待处理";
}

type Props = {
  items: Item[];
};

export function PhaseStatusList({ items }: Props) {
  return (
    <ul>
      {items.map((item) => (
        <li key={item.name} className={`status-${item.status}`}>
          <span>{item.name}</span>
          <em>{statusLabel(item.status)}</em>
        </li>
      ))}
    </ul>
  );
}
