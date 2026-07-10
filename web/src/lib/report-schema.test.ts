import { describe, expect, it, vi } from "vitest";
import {
  MAX_REPORT_BYTES,
  ReportImportError,
  parseAuditFile,
  parseAuditResult,
} from "./report-schema";

const validReport = {
  run: {
    id: "run_test",
    startedAt: "2026-07-10T00:00:00.000Z",
    completedAt: "2026-07-10T00:01:00.000Z",
    mode: "url",
    supportLevel: "strong support",
  },
  target: { url: "https://example.com", futureTargetField: true },
  scores: {
    cookieDough: 72,
    demoReadiness: 80,
    customerLaunchReadiness: 65,
    engineeringHandoffReadiness: 75,
    verdict: "almost baked",
  },
  findings: [
    {
      id: "CD-BROWSER-001",
      severity: "high",
      category: "dead-navigation",
      title: "Dead button",
      description: "A clicked button did not change the UI.",
      evidence: [{ type: "dom", message: "Clicked button with no visible change" }],
      recommendation: "Wire the button or remove it.",
      futureFindingField: "preserved",
    },
  ],
  notes: ["Credentials were not supplied."],
};

function makeFile(text: string, size = new TextEncoder().encode(text).byteLength): File {
  return { size, text: vi.fn(async () => text) } as unknown as File;
}

describe("parseAuditResult", () => {
  it("accepts a valid CLI audit report", () => {
    expect(parseAuditResult(validReport)).toEqual(validReport);
  });

  it("rejects scores above 100", () => {
    expect(() =>
      parseAuditResult({
        ...validReport,
        scores: { ...validReport.scores, cookieDough: 101 },
      }),
    ).toThrow();
  });

  it("rejects a report missing run.id", () => {
    expect(() =>
      parseAuditResult({ ...validReport, run: { ...validReport.run, id: undefined } }),
    ).toThrow();
  });

  it("rejects unknown finding severity values", () => {
    expect(() =>
      parseAuditResult({
        ...validReport,
        findings: [{ ...validReport.findings[0], severity: "urgent" }],
      }),
    ).toThrow();
  });

  it("preserves extra fields at object and entity boundaries", () => {
    const result = parseAuditResult(validReport);

    expect(result.target).toHaveProperty("futureTargetField", true);
    expect(result.findings[0]).toHaveProperty("futureFindingField", "preserved");
  });
});

describe("parseAuditFile", () => {
  it("maps malformed JSON to invalid-json", async () => {
    await expect(parseAuditFile(makeFile("{not-json"))).rejects.toMatchObject({
      code: "invalid-json",
    });
  });

  it("maps shape-invalid JSON to invalid-report", async () => {
    await expect(parseAuditFile(makeFile(JSON.stringify({ nope: true })))).rejects.toMatchObject({
      code: "invalid-report",
    });
  });

  it("checks oversized files before calling file.text", async () => {
    const text = vi.fn(async () => "{}");
    const file = { size: MAX_REPORT_BYTES + 1, text } as unknown as File;

    await expect(parseAuditFile(file)).rejects.toMatchObject({
      code: "file-too-large",
    });
    expect(text).not.toHaveBeenCalled();
  });

  it("exposes the documented import error shape", () => {
    const error = new ReportImportError("invalid-json", "Could not parse report JSON.");

    expect(error).toBeInstanceOf(Error);
    expect(error.code).toBe("invalid-json");
  });
});
