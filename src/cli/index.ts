#!/usr/bin/env node
import { Command } from "commander";
import { auditArgsSchema } from "./args.js";

const program = new Command();

program
  .name("cookiedough")
  .description("Evidence-first readiness auditor for founder-built web apps")
  .version("0.1.0");

program
  .command("audit")
  .description("Audit a repo URL, deployed URL, or both")
  .option("--repo <repo>", "Git repository URL or local repository path")
  .option("--url <url>", "Deployed app URL")
  .option("--out <path>", "Output directory", ".cookiedough-runs/latest")
  .option("--docker <mode>", "Docker mode: auto|required|off", "auto")
  .option("--credentials <path>", "Single-run test credentials JSON file")
  .option("--profile <profile>", "Report profile: founder|engineer|investor", "founder")
  .option("--max-pages <number>", "Maximum browser pages/routes to inspect", "40")
  .option("--timeout-ms <number>", "Overall audit timeout in milliseconds", "120000")
  .option("--llm <mode>", "LLM mode: off|summary", "off")
  .option("--json", "Print JSON summary to stdout", false)
  .action(async (options: unknown) => {
    const parsed = auditArgsSchema.safeParse(options);
    if (!parsed.success) {
      console.error(parsed.error.issues.map((issue) => issue.message).join("\n"));
      process.exitCode = 1;
      return;
    }

    const { runAudit } = await import("../core/audit-runner.js");
    const result = await runAudit(parsed.data);
    if (parsed.data.json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log(`CookieDough score: ${result.scores.cookieDough} (${result.scores.verdict})`);
      console.log(`Report written to ${parsed.data.out}`);
    }
  });

await program.parseAsync(process.argv);
