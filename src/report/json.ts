import fs from "fs-extra";
import path from "node:path";
import type { AuditResult } from "../core/types.js";

export async function writeJsonReport(result: AuditResult, outDir: string): Promise<string> {
  await fs.ensureDir(outDir);
  const filePath = path.join(outDir, "findings.json");
  await fs.writeJson(filePath, result, { spaces: 2 });
  return filePath;
}
