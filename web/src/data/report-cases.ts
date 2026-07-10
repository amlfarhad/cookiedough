import type { AuditResult } from "../types/audit";
import { parseAuditResult } from "../lib/report-schema";
import dockerRequiredReport from "./reports/docker-required.json";
import selfAuditReport from "./reports/self-audit.json";
import urlAuditReport from "./reports/url-audit.json";

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

export type ReportCaseId = "self-audit" | "url-audit" | "docker-required";

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
const urlAudit = parseAuditResult(urlAuditReport);
const dockerRequired = parseAuditResult(dockerRequiredReport);

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
    id: "url-audit",
    label: "Deployed URL audit",
    eyebrow: "Browser evidence",
    description: "Verified browser audit of https://example.com with one recorded console error.",
    sourceLabel: "Verified CLI artifact",
    command: "node dist/src/cli/index.js audit --url https://example.com --out .cookiedough-runs/example --json",
    report: urlAudit,
  },
  {
    id: "docker-required",
    label: "Isolation blocked safely",
    eyebrow: "Execution evidence",
    description: "Verified repository audit with Docker required; execution was blocked because Docker was unavailable.",
    sourceLabel: "Verified CLI artifact",
    command: "node dist/src/cli/index.js audit --repo . --docker required --out .cookiedough-runs/docker-required --json",
    report: dockerRequired,
  },
] satisfies readonly ReportCase[]);

export const defaultReportCaseId: ReportCaseId = "self-audit";
