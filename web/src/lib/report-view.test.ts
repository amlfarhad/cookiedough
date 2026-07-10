import { describe, expect, it } from "vitest";
import { reportCases } from "../data/report-cases";
import type { Finding } from "../types/audit";
import {
  filterFindings,
  getScoreBand,
  getScoreForLens,
  getSeverityCounts,
  scoreLenses,
  severityOrder,
} from "./report-view";

const report = reportCases[1]!.report;
type TestFinding = Readonly<Pick<Finding, "id" | "severity">>;

describe("report view helpers", () => {
  it("defines the four readiness lenses with their score keys and audience labels", () => {
    expect(scoreLenses).toEqual([
      {
        id: "overall",
        scoreKey: "cookieDough",
        label: "Overall",
        description: "Combined readiness across demo, customer launch, and engineering handoff.",
      },
      {
        id: "demo",
        scoreKey: "demoReadiness",
        label: "Demo",
        description: "Readiness for a credible, working product demonstration.",
      },
      {
        id: "launch",
        scoreKey: "customerLaunchReadiness",
        label: "Customer launch",
        description: "Readiness for a customer-facing launch experience.",
      },
      {
        id: "handoff",
        scoreKey: "engineeringHandoffReadiness",
        label: "Engineering handoff",
        description: "Readiness for engineers to run, maintain, and extend the project.",
      },
    ]);
  });

  it("selects each score from Scores", () => {
    expect(getScoreForLens(report.scores, "overall")).toBe(report.scores.cookieDough);
    expect(getScoreForLens(report.scores, "demo")).toBe(report.scores.demoReadiness);
    expect(getScoreForLens(report.scores, "launch")).toBe(report.scores.customerLaunchReadiness);
    expect(getScoreForLens(report.scores, "handoff")).toBe(report.scores.engineeringHandoffReadiness);
  });

  it.each([
    [0, "flour on the counter"],
    [24, "flour on the counter"],
    [25, "raw dough"],
    [49, "raw dough"],
    [50, "soft center"],
    [69, "soft center"],
    [70, "almost baked"],
    [84, "almost baked"],
    [85, "baked"],
    [100, "baked"],
  ])("maps score %i to the %s band", (score, verdict) => {
    expect(getScoreBand(score)).toMatchObject({ verdict });
  });

  it.each([Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, -1, 101])(
    "rejects invalid score %p",
    (score) => {
      expect(() => getScoreBand(score)).toThrow(RangeError);
    },
  );

  it("keeps severity order from blocker through info", () => {
    expect(severityOrder).toEqual(["blocker", "high", "medium", "low", "info"]);
  });

  it("counts every severity including zero values", () => {
    const findings: readonly TestFinding[] = [
      { ...report.findings[0]!, severity: "high" },
      { ...report.findings[0]!, id: "second", severity: "high" },
      { ...report.findings[0]!, id: "third", severity: "info" },
    ];

    expect(getSeverityCounts(findings)).toEqual({ blocker: 0, high: 2, medium: 0, low: 0, info: 1 });
  });

  it("filters findings in their report order", () => {
    const findings: readonly TestFinding[] = [
      { ...report.findings[0]!, id: "first", severity: "low" },
      { ...report.findings[0]!, id: "second", severity: "high" },
      { ...report.findings[0]!, id: "third", severity: "low" },
    ];

    expect(filterFindings(findings, new Set(["low"])).map((finding) => finding.id)).toEqual(["first", "third"]);
  });

  it("returns no findings for an empty report", () => {
    expect(filterFindings([], new Set(["blocker"]))).toEqual([]);
  });

  it("returns no findings when no severities are selected", () => {
    expect(filterFindings(report.findings, new Set())).toEqual([]);
  });
});
