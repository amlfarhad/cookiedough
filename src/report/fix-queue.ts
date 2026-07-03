import type { AuditResult } from "../core/types.js";

const severityRank = { blocker: 0, high: 1, medium: 2, low: 3, info: 4 } as const;

export function renderFixQueue(result: AuditResult): string {
  const sorted = [...result.findings].sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);
  return [
    "# CookieDough Developer Fix Queue",
    "",
    ...(sorted.length === 0 ? ["No fixes queued. Keep the batch warm."] : sorted.map((finding, index) => [
      `## ${index + 1}. ${finding.title}`,
      "",
      `Severity: ${finding.severity}`,
      `Finding: ${finding.id}`,
      "",
      finding.recommendation,
      "",
      "Evidence:",
      ...finding.evidence.map((item) => `- ${item.type}: ${item.message}`)
    ].join("\n")))
  ].join("\n\n");
}
