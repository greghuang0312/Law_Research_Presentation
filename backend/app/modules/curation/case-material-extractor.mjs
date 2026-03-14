const CASE_KEYWORDS = ["案", "诉", "纠纷"];

function isCaseSource(item) {
  if (String(item.source_type ?? "").includes("case")) {
    return true;
  }

  const title = String(item.title ?? "");
  return CASE_KEYWORDS.some((keyword) => title.includes(keyword));
}

function buildIssues(title, topic) {
  const issues = [];

  if (title.includes("处罚")) {
    issues.push("行政处罚决定是否合法");
  }

  if (title.includes("程序")) {
    issues.push("行政处罚程序是否完备");
  }

  if (issues.length === 0) {
    issues.push(`${topic}相关规范在个案中的适用边界`);
  }

  return issues;
}

function buildHolding(title) {
  if (title.includes("市场监督")) {
    return "聚焦市场监管机关作出处罚决定时的事实认定与程序说明义务。";
  }

  if (title.includes("城市管理")) {
    return "强调罚款决定应与违法事实、裁量基准和告知程序相匹配。";
  }

  return "用于说明行政处罚案件中事实、程序与裁量控制的结合判断。";
}

export function extractCaseMaterials({ traceId, items, topic }) {
  return items.filter(isCaseSource).map((item, index) => ({
    id: `case-material-${index + 1}`,
    trace_id: traceId,
    source_item_id: item.id,
    case_title: item.title,
    fact_summary: `围绕“${item.title}”整理${topic}教学中的事实背景、执法行为与相对人争议。`,
    issues: buildIssues(item.title, topic),
    holding: buildHolding(item.title),
    citation: `${item.title}｜${item.url}`,
  }));
}
