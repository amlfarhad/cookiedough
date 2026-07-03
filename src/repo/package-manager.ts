export type PackageManager = "npm" | "pnpm" | "yarn" | "bun";

export function detectPackageManager(files: string[]): PackageManager {
  const set = new Set(files);
  if (set.has("pnpm-lock.yaml")) return "pnpm";
  if (set.has("yarn.lock")) return "yarn";
  if (set.has("bun.lockb") || set.has("bun.lock")) return "bun";
  return "npm";
}
