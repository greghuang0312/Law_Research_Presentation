import path from "node:path";
import { readFile } from "node:fs/promises";

export async function renderHomePage({ rootDir }) {
  const filePath = path.join(rootDir, "frontend", "index.html");
  return readFile(filePath, "utf8");
}
