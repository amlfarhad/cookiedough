import { describe, expect, it } from "vitest";
import { auditArgsSchema } from "../../src/cli/args.js";

describe("auditArgsSchema", () => {
  it("rejects an audit without repo or url", () => {
    const result = auditArgsSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("accepts a URL-only audit", () => {
    const result = auditArgsSchema.safeParse({ url: "https://example.com" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.docker).toBe("auto");
      expect(result.data.maxPages).toBe(40);
    }
  });

  it("accepts a combined audit", () => {
    const result = auditArgsSchema.safeParse({
      repo: "https://github.com/example/app",
      url: "https://example.com",
      docker: "required"
    });
    expect(result.success).toBe(true);
  });

  it("accepts a local repo path for self-audits", () => {
    const result = auditArgsSchema.safeParse({ repo: "." });
    expect(result.success).toBe(true);
  });
});
