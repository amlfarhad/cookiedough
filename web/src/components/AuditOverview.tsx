import { Fragment, useId } from "react";
import type { ReportCase } from "../data/report-cases";
import { getScoreForLens, scoreLenses } from "../lib/report-view";
import type { ScoreLensId } from "../lib/report-view";

interface AuditOverviewProps {
  readonly report: ReportCase["report"];
  readonly selectedLens: ScoreLensId;
}

function BreakableTarget({ value }: { readonly value: string }) {
  const parts = value.split(/([/:?&#=])/g);

  return parts.map((part, index) => (
    <Fragment key={`${part}-${index}`}>
      {part}
      {/[/:?&#=]/.test(part) ? <wbr /> : null}
    </Fragment>
  ));
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
      <p className="audit-overview__eyebrow">Selected audit / evidence record</p>
      <h2 id={headingId} aria-label={target}><BreakableTarget value={target} /></h2>
      <div className="audit-overview__selected-score" data-verdict={report.scores.verdict}>
        <p className="audit-score__label">{selectedLensMetadata.label}</p>
        <output data-testid="selected-score">{selectedScore}</output>
        <p className="audit-score__description">{selectedLensMetadata.description}</p>
        <p className="audit-score__verdict" data-testid="overall-verdict">
          <span>Overall verdict</span>
          {report.scores.verdict}
        </p>
      </div>
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
    </section>
  );
}
