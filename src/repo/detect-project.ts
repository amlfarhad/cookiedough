import fs from "fs-extra";
import path from "node:path";
import { detectPackageManager, type PackageManager } from "./package-manager.js";
import { planNodeCommands, type CommandPlan } from "./commands.js";

export interface ProjectDetection {
  kind: "node-web" | "unknown";
  packageManager?: PackageManager;
  commandPlan?: CommandPlan;
  supportNotes: string[];
}

export async function detectProject(repoDir: string): Promise<ProjectDetection> {
  const files = await fs.readdir(repoDir);
  if (!files.includes("package.json")) {
    return {
      kind: "unknown",
      supportNotes: ["No package.json found. CookieDough V1 marks this repo as partial support."]
    };
  }
  const pkg = await fs.readJson(path.join(repoDir, "package.json")) as { scripts?: Record<string, string> };
  const packageManager = detectPackageManager(files);
  return {
    kind: "node-web",
    packageManager,
    commandPlan: planNodeCommands(packageManager, pkg),
    supportNotes: [`Detected Node web project using ${packageManager}.`]
  };
}
