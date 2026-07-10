import { z } from "zod";
import type {
  AuditResult,
  AuditMode,
  EvidenceType,
  FindingSeverity,
  SupportLevel,
} from "../types/audit";

export const MAX_REPORT_BYTES = 2 * 1024 * 1024;

export type ReportImportErrorCode = "file-too-large" | "invalid-json" | "invalid-report";

export class ReportImportError extends Error {
  readonly code: ReportImportErrorCode;

  constructor(code: ReportImportErrorCode, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "ReportImportError";
    this.code = code;
  }
}

const auditModeSchema: z.ZodType<AuditMode> = z.enum(["repo", "url", "repo-url"]);
const supportLevelSchema: z.ZodType<SupportLevel> = z.enum([
  "strong support",
  "partial support",
  "could not execute",
]);
const findingSeveritySchema: z.ZodType<FindingSeverity> = z.enum(["blocker", "high", "medium", "low", "info"]);
const evidenceTypeSchema: z.ZodType<EvidenceType> = z.enum([
  "screenshot",
  "console",
  "network",
  "command",
  "dom",
  "security",
  "coverage",
]);
const scoreSchema = z.number().int().min(0).max(100);

const evidenceSchema = z
  .object({
    type: evidenceTypeSchema,
    path: z.string().optional(),
    message: z.string(),
  })
  .passthrough();

const findingSchema = z
  .object({
    id: z.string(),
    severity: findingSeveritySchema,
    category: z.string(),
    title: z.string(),
    description: z.string(),
    evidence: z.array(evidenceSchema),
    recommendation: z.string(),
  })
  .passthrough();

const auditResultSchema = z
  .object({
    run: z
      .object({
        id: z.string(),
        startedAt: z.string(),
        completedAt: z.string().optional(),
        mode: auditModeSchema,
        supportLevel: supportLevelSchema,
      })
      .passthrough(),
    target: z
      .object({
        repoUrl: z.string().optional(),
        url: z.string().optional(),
        commitSha: z.string().optional(),
      })
      .passthrough(),
    scores: z
      .object({
        cookieDough: scoreSchema,
        demoReadiness: scoreSchema,
        customerLaunchReadiness: scoreSchema,
        engineeringHandoffReadiness: scoreSchema,
        verdict: z.enum(["baked", "almost baked", "soft center", "raw dough", "flour on the counter"]),
      })
      .passthrough(),
    findings: z.array(findingSchema),
    notes: z.array(z.string()),
  })
  .passthrough();

export function parseAuditResult(input: unknown): AuditResult {
  return auditResultSchema.parse(input) as AuditResult;
}

export async function parseAuditFile(file: File): Promise<AuditResult> {
  if (file.size > MAX_REPORT_BYTES) {
    throw new ReportImportError("file-too-large", `Report exceeds the ${MAX_REPORT_BYTES}-byte limit.`);
  }

  const text = await file.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text) as unknown;
  } catch (cause) {
    throw new ReportImportError("invalid-json", "Report is not valid JSON.", { cause });
  }

  try {
    return parseAuditResult(parsed);
  } catch (cause) {
    if (cause instanceof ReportImportError) {
      throw cause;
    }
    throw new ReportImportError("invalid-report", "Report does not match the audit report schema.", { cause });
  }
}
