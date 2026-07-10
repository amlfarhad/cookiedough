import type { ReportCase } from "../data/report-cases";
import { getScoreForLens, scoreLenses } from "../lib/report-view";
import type { ScoreLensId } from "../lib/report-view";

interface ReadinessLensesProps {
  readonly selectedLens: ScoreLensId;
  readonly scores: ReportCase["report"]["scores"];
  readonly onSelect: (lens: ScoreLensId) => void;
}

export function ReadinessLenses({ selectedLens, scores, onSelect }: ReadinessLensesProps) {
  return (
    <div className="readiness-lenses" role="group" aria-label="Readiness lens">
      {scoreLenses.map((lens) => {
        const score = getScoreForLens(scores, lens.id);

        return (
          <button
            className="readiness-lenses__button"
            type="button"
            key={lens.id}
            aria-pressed={selectedLens === lens.id}
            onClick={() => onSelect(lens.id)}
          >
            <span>{lens.label}</span>
            <strong>{score}</strong>
          </button>
        );
      })}
    </div>
  );
}
