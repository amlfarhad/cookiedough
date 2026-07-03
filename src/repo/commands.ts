import type { PackageManager } from "./package-manager.js";

export interface PackageJsonLike {
  scripts?: Record<string, string>;
}

export interface CommandPlan {
  install: string[];
  build?: string[];
  test?: string[];
  lint?: string[];
  dev?: string[];
}

function run(pm: PackageManager, script: string): string[] {
  if (pm === "npm") return script === "test" ? ["npm", "test"] : ["npm", "run", script];
  if (pm === "pnpm") return ["pnpm", script];
  if (pm === "yarn") return ["yarn", script];
  return ["bun", "run", script];
}

export function planNodeCommands(pm: PackageManager, pkg: PackageJsonLike): CommandPlan {
  const scripts = pkg.scripts ?? {};
  const install = pm === "npm" ? ["npm", "ci"] : [pm, "install", "--frozen-lockfile"];
  return {
    install,
    build: scripts.build ? run(pm, "build") : undefined,
    test: scripts.test ? run(pm, "test") : undefined,
    lint: scripts.lint ? run(pm, "lint") : undefined,
    dev: scripts.dev ? run(pm, "dev") : scripts.start ? run(pm, "start") : undefined
  };
}
