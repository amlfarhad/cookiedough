import sanitizeHtml from "sanitize-html";
import type { AuditResult } from "../core/types.js";
import { renderMarkdownReport } from "./markdown.js";

function escape(value: string): string {
  return sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} });
}

export function renderHtmlReport(result: AuditResult): string {
  const findingItems = result.findings.map((finding) => `
    <section class="finding severity-${escape(finding.severity)}">
      <h2>${escape(finding.id)}: ${escape(finding.title)}</h2>
      <p><strong>${escape(finding.severity)}</strong> · ${escape(finding.category)}</p>
      <p>${escape(finding.description)}</p>
      <h3>Evidence</h3>
      <ul>${finding.evidence.map((item) => `<li>${escape(item.type)}: ${escape(item.message)}${item.path ? ` <code>${escape(item.path)}</code>` : ""}</li>`).join("")}</ul>
      <h3>Recommendation</h3>
      <p>${escape(finding.recommendation)}</p>
    </section>
  `).join("");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>CookieDough Audit Report</title>
  <style>
    body { font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 0; background: #fffaf2; color: #231f20; }
    main { max-width: 1040px; margin: 0 auto; padding: 32px; }
    header { border-bottom: 2px solid #231f20; padding-bottom: 24px; margin-bottom: 24px; }
    .score { font-size: 56px; font-weight: 800; line-height: 1; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin: 20px 0; }
    .metric, .finding { border: 1px solid #d8c7a3; background: #fff; padding: 16px; border-radius: 8px; }
    .finding { margin: 16px 0; }
    .severity-blocker, .severity-high { border-color: #b3261e; }
    code, pre { background: #231f20; color: #fffaf2; border-radius: 6px; }
    code { padding: 2px 5px; }
    pre { white-space: pre-wrap; padding: 16px; overflow: auto; }
  </style>
</head>
<body>
  <main>
    <header>
      <h1>CookieDough Audit Report</h1>
      <div class="score">${result.scores.cookieDough}</div>
      <p>${escape(result.scores.verdict)} · ${escape(result.run.supportLevel)}</p>
    </header>
    <section class="grid">
      <div class="metric"><strong>Demo</strong><br />${result.scores.demoReadiness}</div>
      <div class="metric"><strong>Customer Launch</strong><br />${result.scores.customerLaunchReadiness}</div>
      <div class="metric"><strong>Engineering Handoff</strong><br />${result.scores.engineeringHandoffReadiness}</div>
    </section>
    <section>
      <h2>Target</h2>
      <ul>
        <li>Repo: ${escape(result.target.repoUrl ?? "not provided")}</li>
        <li>URL: ${escape(result.target.url ?? "not provided")}</li>
        <li>Commit: ${escape(result.target.commitSha ?? "not available")}</li>
      </ul>
    </section>
    <section>
      <h2>Notes</h2>
      <ul>${result.notes.map((note) => `<li>${escape(note)}</li>`).join("") || "<li>No notes.</li>"}</ul>
    </section>
    <section>
      <h2>Findings</h2>
      ${findingItems || "<p>No findings. This batch looks baked.</p>"}
    </section>
    <details>
      <summary>Markdown Source</summary>
      <pre>${escape(renderMarkdownReport(result))}</pre>
    </details>
  </main>
</body>
</html>`;
}
