import type { AuditResult } from "../types/audit";
import { parseAuditResult } from "../lib/report-schema";
import northstarReport from "./reports/northstar-fairlight-advisor.json";
import projectFmReport from "./reports/project-fm-demo.json";
import selfAuditReport from "./reports/self-audit.json";

type DeepReadonly<T> = T extends (...args: never[]) => unknown
  ? T
  : T extends object
    ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
    : T;

function deepFreeze<T>(value: T): DeepReadonly<T> {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child);
    }
  }

  return value as DeepReadonly<T>;
}

export type ReportCaseId = "self-audit" | "project-fm" | "northstar";

export interface ReportCase {
  readonly id: ReportCaseId;
  readonly label: string;
  readonly eyebrow: string;
  readonly description: string;
  readonly sourceLabel: string;
  readonly command: string;
  readonly report: DeepReadonly<AuditResult>;
}

const selfAudit = parseAuditResult(selfAuditReport);
const projectFm = parseAuditResult(projectFmReport);
const northstar = parseAuditResult(northstarReport);

export const reportCases = deepFreeze([
  {
    id: "self-audit",
    label: "CookieDough self-audit",
    eyebrow: "Repository evidence",
    description: "Verified repository self-audit run with Docker disabled and full readiness scores.",
    sourceLabel: "Verified CLI artifact",
    command: "node dist/src/cli/index.js audit --repo . --docker off --out .cookiedough-runs/self-local --json",
    report: selfAudit,
  },
  {
    id: "project-fm",
    label: "Project FM",
    eyebrow: "Project evidence",
    description: "Verified URL audit of the deployed tactical reconstruction replay; no findings were captured.",
    sourceLabel: "Verified CLI URL artifact",
    command: "node dist/src/cli/index.js audit --url https://project-fm-demo.vercel.app --out .cookiedough-runs/project-fm-demo --json",
    report: projectFm,
  },
  {
    id: "northstar",
    label: "Northstar",
    eyebrow: "Portfolio evidence",
    description: "Verified URL audit of the nonprofit financial intelligence workspace; two browser-path findings remain in this captured report.",
    sourceLabel: "Verified CLI URL artifact",
    command: "node dist/src/cli/index.js audit --url https://northstar-fairlight-advisor.vercel.app --out .cookiedough-runs/northstar-fairlight-advisor --json",
    report: northstar,
  },
] satisfies readonly ReportCase[]);

export const defaultReportCaseId: ReportCaseId = "self-audit";
