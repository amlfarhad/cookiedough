import { useId } from "react";
import type { ReportCase } from "../data/report-cases";
import { getScoreForLens, scoreLenses } from "../lib/report-view";
import type { ScoreLensId } from "../lib/report-view";

interface AuditOverviewProps {
  readonly report: ReportCase["report"];
  readonly selectedLens: ScoreLensId;
}

function formatRunDate(startedAt: string): string {
  const date = new Date(startedAt);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(date);
}

export function AuditOverview({ report, selectedLens }: AuditOverviewProps) {
  const headingId = useId();
  const selectedLensMetadata = scoreLenses.find((lens) => lens.id === selectedLens)!;
  const target = report.target.url ?? report.target.repoUrl ?? "No target recorded";
  const selectedScore = getScoreForLens(report.scores, selectedLens);

  return (
    <section className="audit-overview" aria-labelledby={headingId}>
      <p className="audit-overview__eyebrow">Audit report</p>
      <h2 id={headingId}>{target}</h2>
      <dl className="audit-overview__metadata">
        <div>
          <dt>Audit mode</dt>
          <dd>{report.run.mode}</dd>
        </div>
        <div>
          <dt>Support level</dt>
          <dd>{report.run.supportLevel}</dd>
        </div>
        {report.target.commitSha ? (
          <div>
            <dt>Commit</dt>
            <dd>{report.target.commitSha}</dd>
          </div>
        ) : null}
        <div>
          <dt>Run date</dt>
          <dd>{formatRunDate(report.run.startedAt)}</dd>
        </div>
      </dl>
      <div className="audit-overview__selected-score">
        <p>{selectedLensMetadata.label}</p>
        <output data-testid="selected-score">{selectedScore}</output>
        <p>{selectedLensMetadata.description}</p>
        <p>{report.scores.verdict}</p>
      </div>
    </section>
  );
}
