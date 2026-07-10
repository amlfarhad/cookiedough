import type { ReportCase } from "../data/report-cases";
import { filterFindings, getSeverityCounts, severityOrder } from "../lib/report-view";
import type { FindingSeverity } from "../types/audit";

interface FindingsPanelProps {
  readonly findings: ReportCase["report"]["findings"];
  readonly selectedSeverities: ReadonlySet<FindingSeverity>;
  readonly onToggleSeverity: (severity: FindingSeverity) => void;
  readonly onResetFilters: () => void;
}

export function FindingsPanel({
  findings,
  selectedSeverities,
  onToggleSeverity,
  onResetFilters,
}: FindingsPanelProps) {
  const severityCounts = getSeverityCounts(findings);
  const filteredFindings = filterFindings(findings, selectedSeverities);
  const hasOriginalFindings = findings.length > 0;

  return (
    <section className="findings-panel" aria-labelledby="findings-heading">
      <header className="findings-panel__header">
        <p className="findings-panel__eyebrow">Audit evidence</p>
        <h2 id="findings-heading">Findings</h2>
      </header>

      <div className="findings-panel__filters" role="group" aria-label="Severity filters">
        {severityOrder.map((severity) => {
          const count = severityCounts[severity];
          const selected = selectedSeverities.has(severity);

          return (
            <button
              className="findings-panel__filter"
              type="button"
              key={severity}
              aria-label={`${severity}: ${count} findings`}
              aria-pressed={selected}
              onClick={() => onToggleSeverity(severity)}
            >
              <span>{severity}</span>
              <span>{count}</span>
            </button>
          );
        })}
      </div>

      {!hasOriginalFindings ? (
        <p className="findings-panel__empty">No findings were recorded in this audit. The report is baked.</p>
      ) : filteredFindings.length === 0 ? (
        <div className="findings-panel__empty" role="status">
          <p>No findings match the selected severities.</p>
          <button type="button" onClick={onResetFilters}>
            Reset filters
          </button>
        </div>
      ) : (
        <div className="findings-panel__list">
          {filteredFindings.map((finding) => (
            <details className="findings-panel__finding" key={finding.id}>
              <summary>
                <span>{finding.id}</span>
                <span>{finding.severity}</span>
                <span>{finding.category}</span>
                <strong>{finding.title}</strong>
              </summary>
              <div className="findings-panel__finding-body">
                <p>{finding.description}</p>
                {finding.evidence.length > 0 ? (
                  <ul aria-label={`Evidence for ${finding.id}`}>
                    {finding.evidence.map((evidence, index) => (
                      <li key={`${evidence.type}-${index}`}>
                        <span>{evidence.type}</span>
                        <span>{evidence.message}</span>
                        {evidence.path ? <span>{evidence.path}</span> : null}
                      </li>
                    ))}
                  </ul>
                ) : null}
                <p>
                  <strong>Recommendation</strong>: {finding.recommendation}
                </p>
              </div>
            </details>
          ))}
        </div>
      )}
    </section>
  );
}
