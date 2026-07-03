import { describe, expect, it } from "vitest";
import { scanTextForSecrets } from "../../src/safety/secrets-scan.js";

describe("scanTextForSecrets", () => {
  it("flags common secret assignments", () => {
    const findings = scanTextForSecrets("OPENAI_API_KEY=sk-live-abc123456789");
    expect(findings.length).toBe(1);
    expect(findings[0]?.category).toBe("secret-exposure");
  });
});
