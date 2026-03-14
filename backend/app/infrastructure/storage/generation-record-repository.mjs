import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

function toPortablePath(value) {
  return value.split(path.sep).join("/");
}

export function getGenerationRecordDirectory({ rootDir = process.cwd() } = {}) {
  const directory = path.join(rootDir, "backend", "data", "generation-records");
  mkdirSync(directory, { recursive: true });
  return directory;
}

export function persistGenerationRecord({
  rootDir = process.cwd(),
  recordId,
  record,
}) {
  const directory = getGenerationRecordDirectory({ rootDir });
  const filePath = path.join(directory, `${recordId}.json`);
  writeFileSync(filePath, `${JSON.stringify(record, null, 2)}\n`, "utf8");

  return {
    filePath,
    relativePath: toPortablePath(path.relative(rootDir, filePath)),
  };
}
