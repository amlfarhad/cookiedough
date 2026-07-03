import { describe, expect, it } from "vitest";
import { deriveSupportLevel } from "../../src/core/support.js";

describe("deriveSupportLevel", () => {
  it("marks successful URL-only audits as strong support", () => {
    expect(deriveSupportLevel("url", [], true, false)).toBe("strong support");
  });

  it("marks successful repo-only audits as strong support", () => {
    expect(deriveSupportLevel("repo", [], false, true)).toBe("strong support");
  });

  it("marks blocked execution as could not execute", () => {
    expect(deriveSupportLevel("repo", [{
      id: "CD-REPO-DOCKER-001",
      severity: "blocker",
      category: "execution-failure",
      title: "Docker unavailable",
      description: "Docker was required but unavailable.",
      evidence: [{ type: "coverage", message: "Blocked." }],
      recommendation: "Start Docker."
    }], false, false)).toBe("could not execute");
  });
});
