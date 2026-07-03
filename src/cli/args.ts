import { z } from "zod";

export const auditArgsSchema = z.object({
  repo: z.string().min(1).optional(),
  url: z.string().url().optional(),
  out: z.string().default(".cookiedough-runs/latest"),
  docker: z.enum(["auto", "required", "off"]).default("auto"),
  credentials: z.string().optional(),
  profile: z.enum(["founder", "engineer", "investor"]).default("founder"),
  maxPages: z.coerce.number().int().positive().max(200).default(40),
  timeoutMs: z.coerce.number().int().positive().max(600000).default(120000),
  llm: z.enum(["off", "summary"]).default("off"),
  json: z.boolean().default(false)
}).refine((args) => args.repo || args.url, {
  message: "Provide at least one target: --repo or --url"
});

export type AuditArgs = z.infer<typeof auditArgsSchema>;
