function bulletTargetByDensity(slideDensity) {
  if (slideDensity === "dense") return 4;
  if (slideDensity === "light") return 2;
  return 3;
}

function slideCountByDifficulty(difficulty) {
  if (difficulty === "exam-prep") return 2;
  return 1;
}

function buildSpeakerNote({ sectionType, difficulty, lessonStyle }) {
  return `${sectionType} section for ${difficulty} learners using ${lessonStyle} sequencing.`;
}

export function buildSlidePlan({
  sectionType,
  sectionTitle,
  keyPoints,
  sourceRefs,
  difficulty,
  slideDensity,
  lessonStyle,
}) {
  const slideCount = slideCountByDifficulty(difficulty);
  const bulletTarget = bulletTargetByDensity(slideDensity);
  const slides = [];

  for (let index = 0; index < slideCount; index += 1) {
    const start = index * bulletTarget;
    const bullets = keyPoints.slice(start, start + bulletTarget);
    if (bullets.length === 0) {
      bullets.push(keyPoints[keyPoints.length - 1] ?? sectionTitle);
    }

    slides.push({
      slide_title: slideCount === 1 ? sectionTitle : `${sectionTitle}（${index + 1}）`,
      bullets,
      speaker_note: buildSpeakerNote({ sectionType, difficulty, lessonStyle }),
      source_refs: sourceRefs,
    });
  }

  return slides;
}
