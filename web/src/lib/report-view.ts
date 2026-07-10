import type { Finding, FindingSeverity, Scores } from "../types/audit";

export type ScoreLensId = "overall" | "demo" | "launch" | "handoff";

type ScoreKey = keyof Pick<
  Scores,
  "cookieDough" | "demoReadiness" | "customerLaunchReadiness" | "engineeringHandoffReadiness"
>;

type ReadonlyScores = Readonly<Pick<Scores, ScoreKey>>;

type ReadonlyFinding = Readonly<Pick<Finding, "severity">>;

export interface ScoreLens {
  readonly id: ScoreLensId;
  readonly scoreKey: ScoreKey;
  readonly label: string;
  readonly description: string;
}

export interface ScoreBand {
  readonly verdict: Scores["verdict"];
  readonly minimum: number;
  readonly maximum: number;
  readonly label: string;
  readonly description: string;
}

export const scoreLenses = [
  {
    id: "overall",
    scoreKey: "cookieDough",
    label: "Overall",
    description: "Combined readiness across demo, customer launch, and engineering handoff.",
  },
  {
    id: "demo",
    scoreKey: "demoReadiness",
    label: "Demo",
    description: "Readiness for a credible, working product demonstration.",
  },
  {
    id: "launch",
    scoreKey: "customerLaunchReadiness",
    label: "Customer launch",
    description: "Readiness for a customer-facing launch experience.",
  },
  {
    id: "handoff",
    scoreKey: "engineeringHandoffReadiness",
    label: "Engineering handoff",
    description: "Readiness for engineers to run, maintain, and extend the project.",
  },
] as const satisfies readonly ScoreLens[];

const scoreBands = [
  { verdict: "baked", minimum: 85, maximum: 100, label: "Baked", description: "Ready to serve." },
  { verdict: "almost baked", minimum: 70, maximum: 84, label: "Almost baked", description: "Close, with a few items to finish." },
  { verdict: "soft center", minimum: 50, maximum: 69, label: "Soft center", description: "Usable, but material work remains." },
  { verdict: "raw dough", minimum: 25, maximum: 49, label: "Raw dough", description: "Not ready for the intended audience." },
  { verdict: "flour on the counter", minimum: 0, maximum: 24, label: "Flour on the counter", description: "Fundamental readiness work is required." },
] as const satisfies readonly ScoreBand[];

export const severityOrder = ["blocker", "high", "medium", "low", "info"] as const satisfies readonly FindingSeverity[];

export function getScoreForLens(scores: ReadonlyScores, lensId: ScoreLensId): number {
  const lens = scoreLenses.find((candidate) => candidate.id === lensId);

  if (!lens) {
    throw new Error(`Unknown score lens: ${lensId}`);
  }

  return scores[lens.scoreKey];
}

export function getScoreBand(score: number): ScoreBand {
  if (!Number.isFinite(score) || score < 0 || score > 100) {
    throw new RangeError("Score must be a finite number between 0 and 100.");
  }

  return scoreBands.find((band) => score >= band.minimum)!;
}

export function getSeverityCounts(findings: readonly ReadonlyFinding[]): Record<FindingSeverity, number> {
  const counts: Record<FindingSeverity, number> = {
    blocker: 0,
    high: 0,
    medium: 0,
    low: 0,
    info: 0,
  };

  for (const finding of findings) {
    counts[finding.severity] += 1;
  }

  return counts;
}

export function filterFindings<T extends ReadonlyFinding>(
  findings: readonly T[],
  selectedSeverities: ReadonlySet<FindingSeverity>,
): readonly T[] {
  return findings.filter((finding) => selectedSeverities.has(finding.severity));
}
