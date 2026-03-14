import { getSourceItemsByTraceId } from "../../infrastructure/storage/retrieval-repository.mjs";
import { extractCaseMaterials } from "./case-material-extractor.mjs";
import { extractLawReferences } from "./law-reference-extractor.mjs";
import { buildSummaryBlocks } from "./summary-block-builder.mjs";

const VALID_DIFFICULTIES = new Set(["high-school", "college", "exam-prep"]);
const VALID_LESSON_STYLES = new Set(["case-first", "law-first"]);
const VALID_SLIDE_DENSITIES = new Set(["light", "standard", "dense"]);

function normalizeFocusPoints(focusPoints) {
  if (!Array.isArray(focusPoints)) {
    return [];
  }

  return focusPoints
    .map((item) => String(item ?? "").trim())
    .filter(Boolean);
}

function assertOption(value, validSet, code, message) {
  if (!validSet.has(value)) {
    const error = new Error(message);
    error.code = code;
    throw error;
  }
}

export function buildOutline({
  rootDir = process.cwd(),
  topic,
  traceId,
  difficulty = "college",
  lessonStyle = "case-first",
  slideDensity = "standard",
  focusPoints = [],
}) {
  const normalizedTopic = String(topic ?? "").trim();
  const normalizedTraceId = String(traceId ?? "").trim();
  const normalizedDifficulty = String(difficulty ?? "college").trim().toLowerCase();
  const normalizedLessonStyle = String(lessonStyle ?? "case-first").trim().toLowerCase();
  const normalizedSlideDensity = String(slideDensity ?? "standard").trim().toLowerCase();
  const normalizedFocusPoints = normalizeFocusPoints(focusPoints);

  if (!normalizedTopic) {
    const error = new Error("topic is required");
    error.code = "missing_topic";
    throw error;
  }

  if (!normalizedTraceId) {
    const error = new Error("trace_id is required");
    error.code = "missing_trace_id";
    throw error;
  }

  assertOption(normalizedDifficulty, VALID_DIFFICULTIES, "invalid_difficulty", "invalid difficulty");
  assertOption(normalizedLessonStyle, VALID_LESSON_STYLES, "invalid_lesson_style", "invalid lesson_style");
  assertOption(normalizedSlideDensity, VALID_SLIDE_DENSITIES, "invalid_slide_density", "invalid slide_density");

  const sourceItems = getSourceItemsByTraceId({
    rootDir,
    traceId: normalizedTraceId,
  });

  if (sourceItems.length === 0) {
    const error = new Error("trace_id not found");
    error.code = "trace_id_not_found";
    throw error;
  }

  const sourceTopic = String(sourceItems[0].topic ?? "").trim();
  if (sourceTopic && sourceTopic !== normalizedTopic) {
    const error = new Error("topic does not match trace_id");
    error.code = "trace_topic_mismatch";
    throw error;
  }

  const caseMaterials = extractCaseMaterials({
    traceId: normalizedTraceId,
    items: sourceItems,
    topic: normalizedTopic,
  });

  const lawReferences = extractLawReferences({
    traceId: normalizedTraceId,
    items: sourceItems,
    topic: normalizedTopic,
  });

  const summaryBlocks = buildSummaryBlocks({
    traceId: normalizedTraceId,
    difficulty: normalizedDifficulty,
    lessonStyle: normalizedLessonStyle,
    slideDensity: normalizedSlideDensity,
    focusPoints: normalizedFocusPoints,
    caseMaterials,
    lawReferences,
  });

  return {
    trace_id: normalizedTraceId,
    topic: normalizedTopic,
    difficulty: normalizedDifficulty,
    lesson_style: normalizedLessonStyle,
    slide_density: normalizedSlideDensity,
    focus_points: normalizedFocusPoints,
    case_materials: caseMaterials,
    law_references: lawReferences,
    summary_blocks: summaryBlocks,
  };
}
