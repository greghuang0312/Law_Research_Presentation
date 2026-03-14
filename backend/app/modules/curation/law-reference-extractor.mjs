const LAW_KEYWORDS = ["法", "条", "规定", "解读", "程序", "申辩"];

function isLawSource(item) {
  const sourceType = String(item.source_type ?? "");
  if (sourceType.includes("law") || sourceType.includes("policy")) {
    return true;
  }

  const title = String(item.title ?? "");
  return LAW_KEYWORDS.some((keyword) => title.includes(keyword));
}

function parseArticleLabel(title) {
  const match = title.match(/第[一二三四五六七八九十百千0-9]+条/);
  return match ? match[0] : "重点条文";
}

function parseLawTitle(title, topic) {
  const lawTitle = title.match(/^[^第\s]+法/);
  return lawTitle ? lawTitle[0] : topic;
}

function buildApplicationNote(title) {
  if (title.includes("申辩")) {
    return "适合衔接程序保障、告知义务与当事人权利救济。";
  }

  if (title.includes("程序")) {
    return "适合结合案例梳理处罚步骤、听取意见与文书送达要求。";
  }

  return "适合提炼课堂中的法条适用条件与裁量边界。";
}

export function extractLawReferences({ traceId, items, topic }) {
  return items.filter(isLawSource).map((item, index) => ({
    id: `law-reference-${index + 1}`,
    trace_id: traceId,
    source_item_id: item.id,
    law_title: parseLawTitle(item.title, topic),
    article_label: parseArticleLabel(item.title),
    rule_summary: `根据“${item.title}”提炼${topic}授课中需要强调的规范要求与适用条件。`,
    application_note: buildApplicationNote(item.title),
    citation: `${item.title}｜${item.url}`,
  }));
}
