import type { AuditResult, Finding } from "../core/types.js";

function findingMarkdown(finding: Finding): string {
  const evidence = finding.evidence.map((item) => `  - ${item.type}: ${item.message}${item.path ? ` (${item.path})` : ""}`).join("\n");
  return [
    `## ${finding.id}: ${finding.title}`,
    "",
    `Severity: ${finding.severity}`,
    `Category: ${finding.category}`,
    "",
    finding.description,
    "",
    "Evidence:",
    evidence || "  - No evidence recorded.",
    "",
    `Recommendation: ${finding.recommendation}`
  ].join("\n");
}

export function renderMarkdownReport(result: AuditResult): string {
  return [
    "# CookieDough Audit Report",
    "",
    `CookieDough Score: ${result.scores.cookieDough}`,
    `Verdict: ${result.scores.verdict}`,
    `Demo Readiness: ${result.scores.demoReadiness}`,
    `Customer Launch Readiness: ${result.scores.customerLaunchReadiness}`,
    `Engineering Handoff Readiness: ${result.scores.engineeringHandoffReadiness}`,
    `Support Level: ${result.run.supportLevel}`,
    "",
    "## Target",
    "",
    `- Repo: ${result.target.repoUrl ?? "not provided"}`,
    `- URL: ${result.target.url ?? "not provided"}`,
    `- Commit: ${result.target.commitSha ?? "not available"}`,
    "",
    "## Notes",
    "",
    ...(result.notes.length > 0 ? result.notes.map((note) => `- ${note}`) : ["- No notes."]),
    "",
    "## Findings",
    "",
    result.findings.length === 0 ? "No findings. This batch looks baked." : result.findings.map(findingMarkdown).join("\n\n")
  ].join("\n");
}
