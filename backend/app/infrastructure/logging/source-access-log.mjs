import path from "node:path";
import { mkdir, appendFile } from "node:fs/promises";

function toLine(payload) {
  return `${JSON.stringify(payload)}\n`;
}

export async function appendSourceAccessLog({
  rootDir = process.cwd(),
  entry,
}) {
  const logsDir = path.join(rootDir, "logs");
  const filePath = path.join(logsDir, "source-access.log");

  await mkdir(logsDir, { recursive: true });

  const payload = {
    logged_at: new Date().toISOString(),
    ...entry,
  };

  await appendFile(filePath, toLine(payload), "utf8");
  return filePath;
}
