import { describe, expect, it } from "vitest";
import type { Finding } from "../../src/core/types.js";
import { scoreAudit } from "../../src/core/scoring.js";

function finding(overrides: Partial<Finding>): Finding {
  return {
    id: "CD-TEST-001",
    severity: "medium",
    category: "console-network-errors",
    title: "Example finding",
    description: "Example description",
    evidence: [{ type: "console", message: "Example evidence" }],
    recommendation: "Fix the issue.",
    ...overrides
  };
}

describe("scoreAudit", () => {
  it("caps launch readiness when build cannot run", () => {
    const scores = scoreAudit([finding({ severity: "blocker", category: "build-failure" })], { urlAuditWorked: false });
    expect(scores.customerLaunchReadiness).toBeLessThanOrEqual(45);
  });

  it("caps top-level score on secret exposure", () => {
    const scores = scoreAudit([finding({ severity: "blocker", category: "secret-exposure" })], { urlAuditWorked: true });
    expect(scores.cookieDough).toBeLessThanOrEqual(40);
  });

  it("caps top-level score on blocker execution failure", () => {
    const scores = scoreAudit([finding({ severity: "blocker", category: "execution-failure" })], { urlAuditWorked: false });
    expect(scores.cookieDough).toBeLessThanOrEqual(45);
    expect(scores.engineeringHandoffReadiness).toBeLessThanOrEqual(35);
  });

  it("returns baked verdict for clean audits", () => {
    const scores = scoreAudit([], { urlAuditWorked: true });
    expect(scores.verdict).toBe("baked");
    expect(scores.cookieDough).toBeGreaterThanOrEqual(85);
  });
});
