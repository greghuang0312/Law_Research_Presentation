import { assertLegalOneLicenseApproved } from "./legalone-r1-license-service.mjs";
import { ensureLegalOneRuntimeReady } from "./legalone-r1-config-service.mjs";

const VALID_SOURCE_TAGS = new Set(["authorized", "manual", "imported"]);

export function validateLegalOneSourceTag(sourceTag) {
  if (!VALID_SOURCE_TAGS.has(sourceTag)) {
    const error = new Error("Invalid LegalOne-R1 source tag.");
    error.code = "invalid_source_tag";
    error.allowedTags = [...VALID_SOURCE_TAGS];
    throw error;
  }

  return sourceTag;
}

export function buildLegalOnePrompt({ text, promptOptions = {}, config }) {
  const audience = promptOptions.audience ?? "general";
  const outputFormat = promptOptions.outputFormat ?? "structured-summary";
  const tone = promptOptions.tone ?? "professional";

  return [
    `template_version=${config.prompt_template_version}`,
    `audience=${audience}`,
    `output_format=${outputFormat}`,
    `tone=${tone}`,
    "instruction=Summarize the provided legal teaching material using only the supplied lawful text.",
    `source_text=${text}`,
  ].join("\n");
}

export async function generateLegalOneDraft({ rootDir, sourceTag, text, promptOptions }) {
  const trimmedText = String(text ?? "").trim();
  if (!trimmedText) {
    const error = new Error("LegalOne-R1 generation requires non-empty text.");
    error.code = "missing_generation_text";
    throw error;
  }

  validateLegalOneSourceTag(String(sourceTag ?? "").trim());

  const config = await ensureLegalOneRuntimeReady({ rootDir });
  const licenseReview = await assertLegalOneLicenseApproved({ rootDir, config });
  const prompt = buildLegalOnePrompt({ text: trimmedText, promptOptions, config });

  return {
    provider: config.provider,
    model: {
      name: config.model_name,
      version: config.model_version,
      commit: config.model_commit,
    },
    source_tag: sourceTag,
    prompt,
    output: `DRY_RUN:${trimmedText.slice(0, 120)}`,
    review: {
      status: licenseReview.review_status,
      reviewed_at: licenseReview.reviewed_at,
      reviewer: licenseReview.reviewer,
    },
  };
}
