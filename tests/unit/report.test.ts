import { describe, expect, it } from "vitest";
import type { AuditResult } from "../../src/core/types.js";
import { renderMarkdownReport } from "../../src/report/markdown.js";
import { renderHtmlReport } from "../../src/report/html.js";

const result: AuditResult = {
  run: {
    id: "run_test",
    startedAt: "2026-07-03T00:00:00.000Z",
    completedAt: "2026-07-03T00:01:00.000Z",
    mode: "url",
    supportLevel: "strong support"
  },
  target: { url: "https://example.com" },
  scores: {
    cookieDough: 72,
    demoReadiness: 80,
    customerLaunchReadiness: 65,
    engineeringHandoffReadiness: 75,
    verdict: "almost baked"
  },
  findings: [{
    id: "CD-BROWSER-001",
    severity: "high",
    category: "dead-navigation",
    title: "Dead button",
    description: "A clicked button did not change the UI.",
    evidence: [{ type: "dom", message: "Clicked button with no visible change" }],
    recommendation: "Wire the button or remove it."
  }],
  notes: ["Credentials were not supplied."]
};

describe("reports", () => {
  it("renders Markdown with score, findings, and recommendations", () => {
    const markdown = renderMarkdownReport(result);
    expect(markdown).toContain("# CookieDough Audit Report");
    expect(markdown).toContain("CookieDough Score: 72");
    expect(markdown).toContain("Dead button");
    expect(markdown).toContain("Wire the button");
  });

  it("renders HTML without raw script tags from findings", () => {
    const html = renderHtmlReport({
      ...result,
      findings: [{ ...result.findings[0]!, title: "<script>alert(1)</script>Dead button" }]
    });
    expect(html).toContain("Dead button");
    expect(html).not.toContain("<script>alert(1)</script>");
  });
});
