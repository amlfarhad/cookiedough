import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const sourceDirectory = dirname(fileURLToPath(import.meta.url));
const entryPath = join(sourceDirectory, "styles.css");
const importComponentPath = join(sourceDirectory, "components", "ImportReportButton.tsx");
const vercelConfigPath = join(sourceDirectory, "..", "vercel.json");

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
    const styles = readStyleSystem();

    expect(styles).toMatch(/\.import-report-button__input\s*\{[\s\S]*position:\s*absolute/);
    expect(styles).toMatch(/\.import-report-button__input\s*\{[\s\S]*clip:\s*rect\(0, 0, 0, 0\)/);
    expect(styles).toMatch(/\.import-report-button:focus-within\s+label/);
  });

  it("keeps import input presentation in CSS instead of a style attribute", () => {
    const component = readFileSync(importComponentPath, "utf8");

    expect(component).not.toMatch(/<input[\s\S]*style=/);
    expect(component).not.toContain("visuallyHiddenInputStyle");
  });

  it("keeps the hosted policy self-contained", () => {
    const config = JSON.parse(readFileSync(vercelConfigPath, "utf8")) as {
      headers: Array<{ headers: Array<{ key: string; value: string }> }>;
    };
    const csp = config.headers
      .flatMap((rule) => rule.headers)
      .find((header) => header.key === "Content-Security-Policy")?.value ?? "";
    const directives = Object.fromEntries(
      csp.split(";").map((directive) => {
        const [name, ...values] = directive.trim().split(/\s+/);
        return [name, values.join(" ")];
      }),
    );

    expect(csp).not.toContain("unsafe-inline");
    expect(directives["font-src"]).toBe("'self' data:");
    expect(directives["script-src"]).not.toContain("data:");
    expect(directives["style-src"]).not.toContain("data:");
    expect(directives["connect-src"]).not.toContain("data:");
    expect(directives["img-src"]).not.toContain("data:");
    expect(csp).toContain("style-src 'self'");
    expect(csp).toContain("img-src 'self'");
  });

  it("forces closed finding detail bodies to print", () => {
    const styles = readStyleSystem();
    expect(styles).toMatch(/@media print[\s\S]*\.findings-panel__finding-body\s*\{[\s\S]*display:\s*block\s*!important/);
  });
});
