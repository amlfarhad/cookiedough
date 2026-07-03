import { describe, expect, it } from "vitest";
import { detectPackageManager } from "../../src/repo/package-manager.js";
import { planNodeCommands } from "../../src/repo/commands.js";

describe("repo detection", () => {
  it("prefers pnpm when pnpm-lock.yaml exists", () => {
    expect(detectPackageManager(["package.json", "pnpm-lock.yaml"])).toBe("pnpm");
  });

  it("plans npm install/build/test/lint/dev commands from scripts", () => {
    const commands = planNodeCommands("npm", {
      scripts: {
        build: "vite build",
        test: "vitest run",
        lint: "eslint .",
        dev: "vite"
      }
    });
    expect(commands.install.join(" ")).toBe("npm ci");
    expect(commands.build?.join(" ")).toBe("npm run build");
    expect(commands.test?.join(" ")).toBe("npm test");
    expect(commands.lint?.join(" ")).toBe("npm run lint");
    expect(commands.dev?.join(" ")).toBe("npm run dev");
  });
});
