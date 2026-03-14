import { buildSlidePlan } from "./slide-plan-builder.mjs";

const SECTION_TYPES = ["intro", "case_facts", "issue_analysis", "law_application", "teaching_takeaway"];

function sectionOrder(lessonStyle) {
  if (lessonStyle === "law-first") {
    return ["intro", "law_application", "case_facts", "issue_analysis", "teaching_takeaway"];
  }

  return SECTION_TYPES;
}

function difficultyPointCount(difficulty) {
  if (difficulty === "high-school") return 2;
  if (difficulty === "exam-prep") return 4;
  return 3;
}

function createKeyPoints({ sectionType, pointCount, caseMaterials, lawReferences, focusPoints }) {
  const seed = [];

  if (sectionType === "intro") {
    seed.push("明确本节课围绕行政处罚法的程序控制与权利保障展开。");
    seed.push("先建立案例背景，再连接法条规则与课堂问题。");
  }

  if (sectionType === "case_facts") {
    seed.push(...caseMaterials.map((item) => `案例：${item.case_title}`));
  }

  if (sectionType === "issue_analysis") {
    seed.push(...caseMaterials.flatMap((item) => item.issues.map((issue) => `争点：${issue}`)));
  }

  if (sectionType === "law_application") {
    seed.push(...lawReferences.map((item) => `${item.article_label}：${item.application_note}`));
  }

  if (sectionType === "teaching_takeaway") {
    seed.push("比较程序瑕疵与实体违法在课堂分析中的不同位置。");
    seed.push("引导学生总结行政机关裁量与相对人救济的连接点。");
  }

  if (focusPoints.length > 0) {
    seed.unshift(...focusPoints.map((item) => `重点：${item}`));
  }

  return seed.slice(0, pointCount);
}

function sectionTitle(sectionType) {
  const labels = {
    intro: "课程导入",
    case_facts: "案例事实梳理",
    issue_analysis: "争点分析",
    law_application: "法条适用",
    teaching_takeaway: "教学总结",
  };

  return labels[sectionType] ?? sectionType;
}

export function buildSummaryBlocks({
  traceId,
  difficulty = "college",
  lessonStyle = "case-first",
  slideDensity = "standard",
  focusPoints = [],
  caseMaterials = [],
  lawReferences = [],
}) {
  const pointCount = difficultyPointCount(difficulty);
  const sharedRefs = [...new Set([
    ...caseMaterials.map((item) => item.source_item_id),
    ...lawReferences.map((item) => item.source_item_id),
  ])];

  return sectionOrder(lessonStyle).map((sectionType, index) => {
    const keyPoints = createKeyPoints({
      sectionType,
      pointCount,
      caseMaterials,
      lawReferences,
      focusPoints,
    });
    const title = sectionTitle(sectionType);

    return {
      id: `summary-block-${index + 1}`,
      trace_id: traceId,
      section_type: sectionType,
      section_title: title,
      learning_goal: `完成“${title}”讲解并保持与${difficulty}难度匹配。`,
      key_points: keyPoints,
      teacher_notes: `${title}部分围绕固定教学结构输出，便于后续 PPT 组装。`,
      source_refs: sharedRefs.length > 0 ? sharedRefs : focusPoints,
      slide_plan: buildSlidePlan({
        sectionType,
        sectionTitle: title,
        keyPoints,
        sourceRefs: sharedRefs.length > 0 ? sharedRefs : focusPoints,
        difficulty,
        slideDensity,
        lessonStyle,
      }),
    };
  });
}
