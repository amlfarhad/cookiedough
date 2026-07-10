import type { AuditResult } from "../types/audit";
import { parseAuditResult } from "../lib/report-schema";
import dockerRequiredReport from "./reports/docker-required.json";
import selfAuditReport from "./reports/self-audit.json";
import urlAuditReport from "./reports/url-audit.json";

export interface ReportCase {
  id: string;
  label: string;
  eyebrow: string;
  description: string;
  sourceLabel: string;
  command: string;
  report: AuditResult;
}

const selfAudit = parseAuditResult(selfAuditReport);
const urlAudit = parseAuditResult(urlAuditReport);
const dockerRequired = parseAuditResult(dockerRequiredReport);

export const reportCases: ReportCase[] = [
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
];

export const defaultReportCaseId: ReportCase["id"] = "self-audit";
