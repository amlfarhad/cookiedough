import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { parseAuditResult } from "../lib/report-schema";
import { defaultReportCaseId, reportCases } from "./report-cases";

describe("verified report cases", () => {
  it("contains three cases with unique ids", () => {
    expect(reportCases).toHaveLength(3);
    expect(new Set(reportCases.map((reportCase) => reportCase.id)).size).toBe(3);
  });

  it("contains schema-valid reports with verified provenance", () => {
    for (const reportCase of reportCases) {
      expect(parseAuditResult(reportCase.report)).toEqual(reportCase.report);
      expect(reportCase.sourceLabel).toBe("Verified CLI artifact");
    }
  });

  it("keeps the expected manifest order and scores", () => {
    expect(reportCases.map((reportCase) => reportCase.report.scores.cookieDough)).toEqual([100, 93, 45]);
  });

  it("identifies the self audit as the default", () => {
    expect(defaultReportCaseId).toBe("self-audit");
  });

  it("uses the public CookieDough repository URL for the self audit", () => {
    expect(reportCases[0]?.report.target.repoUrl).toBe("https://github.com/amlfarhad/cookiedough");
  });

  it("preserves real artifact provenance and findings", () => {
    expect(reportCases.map((reportCase) => reportCase.report.run.id)).toEqual([
      "run_20260703233601_6mrB8r",
      "run_20260703233025_HPo37s",
      "run_20260703233620_2DZZGN",
    ]);
    expect(reportCases.map((reportCase) => reportCase.report.run.startedAt)).toEqual([
      "2026-07-03T23:36:01.090Z",
      "2026-07-03T23:30:25.633Z",
      "2026-07-03T23:36:20.684Z",
    ]);
    expect(reportCases.map((reportCase) => reportCase.report.target.commitSha)).toEqual([
      "dad5907a7e29dfee3f646a0037dddaf738614917",
      undefined,
      "dad5907a7e29dfee3f646a0037dddaf738614917",
    ]);
    expect(reportCases.map((reportCase) => reportCase.report.findings.length)).toEqual([0, 1, 1]);
  });

  it("deeply freezes bundled reports at runtime", () => {
    const selfAudit = reportCases[0]?.report;

    expect(selfAudit).toBeDefined();
    expect(() => {
      (selfAudit!.scores as { cookieDough: number }).cookieDough = 0;
    }).toThrow(TypeError);
    expect(selfAudit!.scores.cookieDough).toBe(100);
  });

  it("locks the stable fingerprint of every bundled report", () => {
    const fingerprints = reportCases.map((reportCase) =>
      createHash("sha256").update(JSON.stringify(reportCase.report)).digest("hex"),
    );

    expect(fingerprints).toEqual([
      "58830dde38092a85be2a46685b8e56f61a92cfa52bab737ce86df85f634bd285",
      "c0fd30b4e5cfa528a86252a02ff87678d5febaa1510992e9466eabea8464a589",
      "961efa010b1dc7260a63bd10a4d9b12d062c603da12ff35943e30ae813a05613",
    ]);
  });
});
