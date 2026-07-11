import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const sourceDirectory = dirname(fileURLToPath(import.meta.url));
const vercelConfig = JSON.parse(readFileSync(join(sourceDirectory, "..", "vercel.json"), "utf8")) as {
  headers: Array<{ source: string; headers: Array<{ key: string; value: string }> }>;
};
const playwrightConfig = readFileSync(join(sourceDirectory, "..", "playwright.config.ts"), "utf8");

describe("hosted cache and acceptance policy", () => {
  it("revalidates the HTML entry while caching immutable assets for one year", () => {
    const cacheControl = (source: string) =>
      vercelConfig.headers
        .find((rule) => rule.source === source)
        ?.headers.find((header) => header.key === "Cache-Control")?.value;

    expect(cacheControl("/")).toBe("public, max-age=0, must-revalidate");
    expect(cacheControl("/index.html")).toBe("public, max-age=0, must-revalidate");
    expect(cacheControl("/assets/(.*)")).toBe("public, max-age=31536000, immutable");
  });

  it("always starts a fresh server for production browser acceptance", () => {
    expect(playwrightConfig).toMatch(/reuseExistingServer:\s*false/);
  });
});
