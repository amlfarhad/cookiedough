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
    }

    expect(reportCases.map((reportCase) => reportCase.sourceLabel)).toEqual([
      "Verified CLI artifact",
      "Verified CLI URL artifact",
      "Verified CLI URL artifact",
    ]);
  });

  it("keeps the expected manifest order and scores", () => {
    expect(reportCases.map((reportCase) => reportCase.label)).toEqual([
      "CookieDough self-audit",
      "Project FM",
      "Northstar",
    ]);
    expect(reportCases.map((reportCase) => reportCase.report.scores.cookieDough)).toEqual([100, 100, 70]);
  });

  it("identifies the self audit as the default", () => {
    expect(defaultReportCaseId).toBe("self-audit");
  });

  it("uses the public CookieDough repository URL for the self audit", () => {
    expect(reportCases[0]?.report.target.repoUrl).toBe("https://github.com/amlfarhad/cookiedough");
  });

  it("uses the supplied Vercel URLs for the project cases", () => {
    expect(reportCases.slice(1).map((reportCase) => reportCase.report.target.url)).toEqual([
      "https://project-fm-demo.vercel.app",
      "https://northstar-fairlight-advisor.vercel.app",
    ]);
  });

  it("preserves real artifact provenance and findings", () => {
    expect(reportCases.map((reportCase) => reportCase.report.run.id)).toEqual([
      "run_20260703233601_6mrB8r",
      "run_20260711023912_kvR3kF",
      "run_20260711023924_N5TRr7",
    ]);
    expect(reportCases.map((reportCase) => reportCase.report.run.startedAt)).toEqual([
      "2026-07-03T23:36:01.090Z",
      "2026-07-11T02:39:12.287Z",
      "2026-07-11T02:39:24.103Z",
    ]);
    expect(reportCases.map((reportCase) => reportCase.report.target.commitSha)).toEqual([
      "dad5907a7e29dfee3f646a0037dddaf738614917",
      undefined,
      undefined,
    ]);
    expect(reportCases.map((reportCase) => reportCase.report.findings.length)).toEqual([0, 0, 2]);
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
      "664da1acf170f9b1bffa06c3545a9aa54d676f43284d97043b3b777f8d99ecd9",
      "aeaf1ab309198836d7c8eb613819a054308f3d42c79779be46f7bccf1d4a8e9c",
    ]);
  });
});
