import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

const vercelPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../vercel.json",
);

type VercelConfig = {
  headers: Array<{
    source: string;
    headers: Array<{ key: string; value: string }>;
  }>;
};

const config = JSON.parse(fs.readFileSync(vercelPath, "utf8")) as VercelConfig;

function securityPolicy() {
  const catchAll = config.headers.find((entry) => entry.source === "/(.*)");
  return catchAll?.headers.find((header) => header.key === "Content-Security-Policy")
    ?.value;
}

describe("Vercel security policy", () => {
  test("allows Vite-inlined fonts without weakening the policy", () => {
    const policy = securityPolicy();

    expect(policy).toContain("font-src 'self' data:");
    expect(policy).not.toContain("unsafe-inline");
    expect(policy).toContain("script-src 'self'");
    expect(policy).toContain("connect-src 'self'");
  });
});
