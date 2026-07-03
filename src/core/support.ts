import type { AuditMode, Finding, SupportLevel } from "./types.js";

export function deriveSupportLevel(mode: AuditMode, findings: Finding[], ranBrowser: boolean, ranRepo: boolean): SupportLevel {
  if (findings.some((finding) => finding.category === "execution-failure" && finding.severity === "blocker")) {
    return "could not execute";
  }
  if (mode === "url" && ranBrowser) return "strong support";
  if (mode === "repo" && ranRepo) return "strong support";
  if (ranBrowser && ranRepo) return "strong support";
  if (ranBrowser || ranRepo) return "partial support";
  return "could not execute";
}
