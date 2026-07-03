import { execa } from "execa";
import type { CommandEvidence } from "../core/types.js";
import type { Redactor } from "../core/redaction.js";

export function buildDockerRunArgs(repoDir: string, command: string[]): string[] {
  return [
    "run",
    "--rm",
    "--network",
    "bridge",
    "-v",
    `${repoDir}:/workspace`,
    "-w",
    "/workspace",
    "node:20-bookworm",
    ...command
  ];
}

export async function dockerAvailable(): Promise<boolean> {
  const result = await execa("docker", ["--version"], { reject: false }).catch(() => undefined);
  return Boolean(result && result.exitCode === 0);
}

export async function runDockerCommand(name: string, command: string[], repoDir: string, redactor: Redactor, timeoutMs = 120000): Promise<CommandEvidence> {
  const started = Date.now();
  const dockerArgs = buildDockerRunArgs(repoDir, command);
  const result = await execa("docker", dockerArgs, {
    timeout: timeoutMs,
    reject: false
  }).catch((error: unknown) => ({
    exitCode: null,
    stdout: "",
    stderr: error instanceof Error ? error.message : String(error)
  }));

  return {
    name,
    command: ["docker", ...dockerArgs],
    exitCode: result.exitCode ?? null,
    durationMs: Date.now() - started,
    stdout: redactor.redact(result.stdout.slice(-4000)),
    stderr: redactor.redact(result.stderr.slice(-4000))
  };
}
