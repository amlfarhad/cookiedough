export type AuditMode = "repo" | "url" | "repo-url";
export type SupportLevel = "strong support" | "partial support" | "could not execute";
export type FindingSeverity = "blocker" | "high" | "medium" | "low" | "info";
export type EvidenceType = "screenshot" | "console" | "network" | "command" | "dom" | "security" | "coverage";

export interface AuditTarget {
  repoUrl?: string;
  url?: string;
  commitSha?: string;
  [key: string]: unknown;
}

export interface AuditRun {
  id: string;
  startedAt: string;
  completedAt?: string;
  mode: AuditMode;
  supportLevel: SupportLevel;
  [key: string]: unknown;
}

export interface EvidenceRef {
  type: EvidenceType;
  path?: string;
  message: string;
  [key: string]: unknown;
}

export interface Finding {
  id: string;
  severity: FindingSeverity;
  category: string;
  title: string;
  description: string;
  evidence: EvidenceRef[];
  recommendation: string;
  [key: string]: unknown;
}

export interface Scores {
  cookieDough: number;
  demoReadiness: number;
  customerLaunchReadiness: number;
  engineeringHandoffReadiness: number;
  verdict: "baked" | "almost baked" | "soft center" | "raw dough" | "flour on the counter";
  [key: string]: unknown;
}

export interface AuditResult {
  run: AuditRun;
  target: AuditTarget;
  scores: Scores;
  findings: Finding[];
  notes: string[];
  [key: string]: unknown;
}
