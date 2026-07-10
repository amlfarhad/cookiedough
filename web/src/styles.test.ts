import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const sourceDirectory = dirname(fileURLToPath(import.meta.url));
const entryPath = join(sourceDirectory, "styles.css");

function readStyleSystem(): string {
  const moduleDirectory = join(sourceDirectory, "styles");
  const modules = (existsSync(moduleDirectory) ? readdirSync(moduleDirectory) : [])
    .filter((file) => file.endsWith(".css"))
    .sort()
    .map((file) => readFileSync(join(moduleDirectory, file), "utf8"));

  return [readFileSync(entryPath, "utf8"), ...modules].join("\n");
}

describe("CSS architecture", () => {
  it("keeps the stylesheet entry focused on module imports", () => {
    const entry = readFileSync(entryPath, "utf8");
    const substantiveLines = entry.split("\n").filter((line) => line.trim() && !line.trim().startsWith("/*"));

    expect(substantiveLines.length).toBeLessThanOrEqual(10);
    expect(substantiveLines.every((line) => line.trim().startsWith("@import"))).toBe(true);
  });

  it("bridges hidden input focus to the visible import surface", () => {
    expect(readStyleSystem()).toMatch(/\.import-report-button:focus-within\s+label/);
  });

  it("forces closed finding detail bodies to print", () => {
    const styles = readStyleSystem();
    expect(styles).toMatch(/@media print[\s\S]*\.findings-panel__finding-body\s*\{[\s\S]*display:\s*block\s*!important/);
  });
});
