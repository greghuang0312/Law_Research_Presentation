import { readFile } from "node:fs/promises";
import path from "node:path";

export async function loadFixtureSources({ rootDir = process.cwd(), topic }) {
  const filePath = path.join(rootDir, "tests", "fixtures", "retrieval", "gov-cn-search.json");
  const raw = await readFile(filePath, "utf8");
  const parsed = JSON.parse(raw);
  const allItems = Array.isArray(parsed.items) ? parsed.items : [];

  return allItems.filter((item) => {
    if (parsed.topic && topic) return parsed.topic === topic;
    return true;
  });
}
