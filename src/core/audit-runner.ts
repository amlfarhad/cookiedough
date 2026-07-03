import fs from "fs-extra";
import path from "node:path";
import { nanoid } from "nanoid";
import type { AuditArgs } from "../cli/args.js";
import type { AuditMode, AuditResult, CommandEvidence, Finding } from "./types.js";
import { createRedactor } from "./redaction.js";
import { scoreAudit } from "./scoring.js";
import { deriveSupportLevel } from "./support.js";
import { runBrowserAudit } from "../browser/playwright-runner.js";
import { findingsFromBrowserEvidence } from "../browser/evidence.js";
import { writeJsonReport } from "../report/json.js";
import { renderMarkdownReport } from "../report/markdown.js";
import { renderHtmlReport } from "../report/html.js";
import { renderFixQueue } from "../report/fix-queue.js";
import { loadCredentialBundle } from "../safety/credential-store.js";
import { scanTextForSecrets } from "../safety/secrets-scan.js";
import { cloneRepo } from "../repo/clone.js";
import { detectProject } from "../repo/detect-project.js";
import { runHostCommand } from "../repo/host-executor.js";
import { findingsFromCommands } from "../repo/executor.js";
import { dockerAvailable, runDockerCommand } from "../repo/docker-executor.js";

function modeFromArgs(args: AuditArgs): AuditMode {
  if (args.repo && args.url) return "repo-url";
  if (args.repo) return "repo";
  return "url";
}

function commandEvidenceText(commands: CommandEvidence[]): string {
  return commands.map((command) => `${command.name}\n${command.stdout}\n${command.stderr}`).join("\n");
}

async function runRepoAudit(args: AuditArgs, outDir: string, findings: Finding[], notes: string[], redactor: ReturnType<typeof createRedactor>): Promise<{ commitSha?: string; ranRepo: boolean; localAppStarted?: boolean }> {
  if (!args.repo) return { ranRepo: false };

  const workspaceDir = path.join(outDir, "workspace");
  const cloned = await cloneRepo(args.repo, workspaceDir);
  const detection = await detectProject(cloned.repoDir);
  notes.push(...detection.supportNotes);

  const commandEvidence: CommandEvidence[] = [];
  const canUseDocker = args.docker !== "off" && await dockerAvailable();
  if (args.docker === "required" && !canUseDocker) {
    notes.push("Docker was required but unavailable. Repo command execution was blocked.");
    findings.push({
      id: "CD-REPO-DOCKER-001",
      severity: "blocker",
      category: "execution-failure",
      title: "Docker was required but unavailable",
      description: "CookieDough could not execute repo commands because --docker required was set and Docker was unavailable.",
      evidence: [{ type: "coverage", message: "Repo execution blocked by Docker availability." }],
      recommendation: "Start Docker or rerun with --docker auto/off only for trusted repositories."
    });
    return { commitSha: cloned.commitSha, ranRepo: false };
  }

  if (!canUseDocker) {
    notes.push("Docker was unavailable. Host execution ran repo commands on this machine. Use --docker required for stricter isolation.");
  } else {
    notes.push("Docker execution was used for repo commands.");
  }

  const commandRunner = canUseDocker ? runDockerCommand : runHostCommand;
  if (detection.commandPlan) {
    commandEvidence.push(await commandRunner("install", detection.commandPlan.install, cloned.repoDir, redactor, args.timeoutMs));
    if (detection.commandPlan.lint) commandEvidence.push(await commandRunner("lint", detection.commandPlan.lint, cloned.repoDir, redactor, args.timeoutMs));
    if (detection.commandPlan.test) commandEvidence.push(await commandRunner("test", detection.commandPlan.test, cloned.repoDir, redactor, args.timeoutMs));
    if (detection.commandPlan.build) commandEvidence.push(await commandRunner("build", detection.commandPlan.build, cloned.repoDir, redactor, args.timeoutMs));
  } else {
    findings.push({
      id: "CD-REPO-UNSUPPORTED-001",
      severity: "info",
      category: "unsupported-partial-coverage",
      title: "Repo stack has partial support",
      description: "CookieDough did not find a package.json-based Node web project.",
      evidence: [{ type: "coverage", message: detection.supportNotes.join(" ") }],
      recommendation: "Add documented build/test commands or audit with a deployed URL for browser coverage."
    });
  }

  await fs.writeJson(path.join(outDir, "command-evidence.json"), redactor.redactObject(commandEvidence), { spaces: 2 });
  findings.push(...findingsFromCommands(commandEvidence));
  findings.push(...scanTextForSecrets(commandEvidenceText(commandEvidence)));

  return {
    commitSha: cloned.commitSha,
    ranRepo: commandEvidence.length > 0,
    localAppStarted: undefined
  };
}

export async function runAudit(args: AuditArgs): Promise<AuditResult> {
  const startedAt = new Date().toISOString();
  const runId = `run_${startedAt.replace(/[-:.TZ]/g, "").slice(0, 14)}_${nanoid(6)}`;
  await fs.ensureDir(args.out);

  const credentialBundle = await loadCredentialBundle(args.credentials);
  const redactor = createRedactor(credentialBundle.values);
  const findings: Finding[] = [];
  const notes: string[] = [];

  if (args.credentials) {
    notes.push("Credentials were supplied for this run and redacted from artifacts.");
  } else {
    notes.push("Credentials were not supplied.");
  }
  if (args.llm !== "off") {
    notes.push("LLM summary mode is not active in V1; deterministic evidence was used for all findings.");
  }

  const repoAudit = await runRepoAudit(args, args.out, findings, notes, redactor);
  let ranBrowser = false;

  if (args.url) {
    const browserEvidence = await runBrowserAudit({
      url: args.url,
      outDir: args.out,
      maxPages: args.maxPages,
      redactor,
      credentials: credentialBundle.hints
    });
    await fs.writeJson(path.join(args.out, "browser-evidence.json"), redactor.redactObject(browserEvidence), { spaces: 2 });
    findings.push(...findingsFromBrowserEvidence(browserEvidence));
    ranBrowser = browserEvidence.visited.length > 0;
  } else {
    notes.push("URL audit was not requested.");
  }

  const mode = modeFromArgs(args);
  const supportLevel = deriveSupportLevel(mode, findings, ranBrowser, repoAudit.ranRepo);
  const scores = scoreAudit(findings, {
    urlAuditWorked: ranBrowser,
    localAppStarted: repoAudit.localAppStarted
  });
  const result: AuditResult = {
    run: {
      id: runId,
      startedAt,
      completedAt: new Date().toISOString(),
      mode,
      supportLevel
    },
    target: {
      repoUrl: args.repo,
      url: args.url,
      commitSha: repoAudit.commitSha
    },
    scores,
    findings: redactor.redactObject(findings),
    notes: notes.map((note) => redactor.redact(note))
  };

  const redactedResult = redactor.redactObject(result);
  await writeJsonReport(redactedResult, args.out);
  await fs.writeFile(path.join(args.out, "report.md"), renderMarkdownReport(redactedResult));
  await fs.writeFile(path.join(args.out, "report.html"), renderHtmlReport(redactedResult));
  await fs.writeFile(path.join(args.out, "fix-queue.md"), renderFixQueue(redactedResult));
  return redactedResult;
}
