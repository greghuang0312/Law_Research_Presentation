import { readFile } from "node:fs/promises";
import path from "node:path";

function getLicenseReviewPath(rootDir) {
  return path.join(rootDir, "docs", "compliance", "legalone-r1-license-review.json");
}

export async function loadLegalOneLicenseReview({ rootDir }) {
  const filePath = getLicenseReviewPath(rootDir);
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw);
}

export async function assertLegalOneLicenseApproved({ rootDir, config }) {
  const review = await loadLegalOneLicenseReview({ rootDir });

  if (review.review_status !== "approved") {
    const error = new Error("LegalOne-R1 license review is pending approval.");
    error.code = "license_review_pending";
    error.review = review;
    throw error;
  }

  if (config?.strict_mode) {
    if (review.approved_model_version !== config.model_version || review.approved_model_commit !== config.model_commit) {
      const error = new Error("LegalOne-R1 approved license record does not match the pinned model version.");
      error.code = "license_review_mismatch";
      error.review = review;
      throw error;
    }
  }

  return review;
}
