import { generateLegalOneDraft } from "../../integrations/legalone_r1/legalone-r1-adapter.mjs";

export async function generateLessonDraft({
  rootDir,
  sourceTag,
  text,
  promptOptions,
}) {
  return generateLegalOneDraft({
    rootDir,
    sourceTag,
    text,
    promptOptions,
  });
}
