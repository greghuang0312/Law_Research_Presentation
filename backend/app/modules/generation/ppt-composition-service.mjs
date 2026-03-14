import { randomUUID } from "node:crypto";
import { getSourceItemsByTraceId } from "../../infrastructure/storage/retrieval-repository.mjs";
import { persistGenerationRecord } from "../../infrastructure/storage/generation-record-repository.mjs";
import { buildOutline } from "../curation/curation-service.mjs";
import { writePptxFile } from "./pptx-writer.mjs";

const VALID_TEMPLATES = new Set(["default-classroom"]);
const PIPELINE_VERSION = "ppt-composer-v1";

function normalizeFocusPoints(focusPoints) {
  if (!Array.isArray(focusPoints)) {
    return [];
  }

  return focusPoints
    .map((item) => String(item ?? "").trim())
    .filter(Boolean);
}

function assertTemplate(template) {
  if (!VALID_TEMPLATES.has(template)) {
    const error = new Error("invalid template");
    error.code = "invalid_template";
    throw error;
  }
}

function citationText(sourceItem) {
  return `${sourceItem.title} | ${sourceItem.url}`;
}

function buildDeck({
  traceId,
  topic,
  template,
  outline,
  sourceItems,
}) {
  const citationById = new Map(sourceItems.map((item) => [item.id, citationText(item)]));
  const sourceIndex = [...new Set(sourceItems.map((item) => citationText(item)))];

  const slides = outline.summary_blocks.flatMap((block, blockIndex) =>
    block.slide_plan.map((slidePlan, slideIndex) => ({
      slide_id: `slide-${blockIndex + 1}-${slideIndex + 1}`,
      section_type: block.section_type,
      title: slidePlan.slide_title,
      bullets: slidePlan.bullets,
      speaker_note: slidePlan.speaker_note,
      source_refs: slidePlan.source_refs,
      citations: slidePlan.source_refs.map((sourceId) => citationById.get(sourceId)).filter(Boolean),
    })),
  );

  slides.push({
    slide_id: `slide-source-index-${slides.length + 1}`,
    section_type: "source_index",
    title: "Source Index",
    bullets: sourceIndex,
    speaker_note: "Reference slide for manual review.",
    source_refs: sourceItems.map((item) => item.id),
    citations: sourceIndex,
  });

  return {
    trace_id: traceId,
    topic,
    template,
    generated_at: new Date().toISOString(),
    pipeline_version: PIPELINE_VERSION,
    slides,
  };
}

function buildFileStem({ traceId }) {
  const compactStamp = new Date().toISOString().replaceAll(":", "").replaceAll(".", "").replaceAll("-", "");
  return `${traceId}-${compactStamp}`;
}

export function exportPptDeck({
  rootDir = process.cwd(),
  topic,
  traceId,
  difficulty = "college",
  lessonStyle = "case-first",
  slideDensity = "standard",
  focusPoints = [],
  template = "default-classroom",
}) {
  const normalizedTemplate = String(template ?? "default-classroom").trim().toLowerCase();
  const normalizedFocusPoints = normalizeFocusPoints(focusPoints);
  assertTemplate(normalizedTemplate);

  const outline = buildOutline({
    rootDir,
    topic,
    traceId,
    difficulty,
    lessonStyle,
    slideDensity,
    focusPoints: normalizedFocusPoints,
  });

  const sourceItems = getSourceItemsByTraceId({
    rootDir,
    traceId: outline.trace_id,
  });

  const deck = buildDeck({
    traceId: outline.trace_id,
    topic: outline.topic,
    template: normalizedTemplate,
    outline,
    sourceItems,
  });

  const recordId = randomUUID();
  const exportResult = writePptxFile({
    rootDir,
    deck,
    fileName: `${buildFileStem({ traceId: outline.trace_id })}.pptx`,
  });

  const record = {
    id: recordId,
    trace_id: outline.trace_id,
    topic: outline.topic,
    template: normalizedTemplate,
    difficulty: outline.difficulty,
    lesson_style: outline.lesson_style,
    slide_density: outline.slide_density,
    focus_points: outline.focus_points,
    slide_count: deck.slides.length,
    source_count: sourceItems.length,
    source_items: sourceItems.map((item) => ({
      id: item.id,
      title: item.title,
      url: item.url,
      published_at: item.published_at,
      source_type: item.source_type,
    })),
    pipeline_version: deck.pipeline_version,
    generated_at: deck.generated_at,
    output: {
      pptx_path: exportResult.relativePath,
    },
  };

  const recordResult = persistGenerationRecord({
    rootDir,
    recordId,
    record,
  });
  record.output.record_path = recordResult.relativePath;

  return {
    deck,
    export: {
      pptx_path: exportResult.relativePath,
      record_path: recordResult.relativePath,
    },
    record,
  };
}
