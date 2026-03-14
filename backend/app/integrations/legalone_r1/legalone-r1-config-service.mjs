import { readFile } from "node:fs/promises";
import path from "node:path";

function getConfigPath(rootDir) {
  return path.join(rootDir, "backend", "config", "legalone-r1.config.json");
}

export async function loadLegalOneConfig({ rootDir }) {
  const filePath = getConfigPath(rootDir);
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw);
}

export function validateLegalOneConfig(config) {
  const errors = [];

  if (!config || typeof config !== "object") {
    return ["LegalOne-R1 config must be an object."];
  }

  if (!config.model_name) {
    errors.push("LegalOne-R1 config requires model_name.");
  }

  if (config.strict_mode) {
    if (!config.model_version) {
      errors.push("LegalOne-R1 strict mode requires a pinned model version.");
    }

    if (!config.model_commit) {
      errors.push("LegalOne-R1 strict mode requires a pinned model commit.");
    }
  }

  if (!config.prompt_template_version) {
    errors.push("LegalOne-R1 config requires prompt_template_version.");
  }

  return errors;
}

export async function ensureLegalOneRuntimeReady({ rootDir }) {
  const config = await loadLegalOneConfig({ rootDir });
  const errors = validateLegalOneConfig(config);

  if (errors.length > 0) {
    const error = new Error(errors.join(" "));
    error.code = "legalone_config_invalid";
    throw error;
  }

  return config;
}
