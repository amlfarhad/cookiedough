import { describe, expect, it } from "vitest";
import { createRedactor } from "../../src/core/redaction.js";

describe("createRedactor", () => {
  it("redacts supplied credential values", () => {
    const redactor = createRedactor(["amal@example.com", "super-secret-password"]);
    const output = redactor.redact("login amal@example.com with super-secret-password");
    expect(output).toBe("login [REDACTED] with [REDACTED]");
  });

  it("redacts common token and authorization formats", () => {
    const redactor = createRedactor([]);
    const output = redactor.redact("Authorization: Bearer sk-live-abc1234567890 token=ghp_abcdefghijklmnopqrstuvwxyz123456");
    expect(output).toContain("Authorization: Bearer [REDACTED]");
    expect(output).toContain("token=[REDACTED]");
  });

  it("redacts connection strings", () => {
    const redactor = createRedactor([]);
    const output = redactor.redact("DATABASE_URL=postgres://user:pass@example.com:5432/app");
    expect(output).toBe("DATABASE_URL=[REDACTED]");
  });
});
