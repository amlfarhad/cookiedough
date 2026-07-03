import { execa } from "execa";
import type { CommandEvidence } from "../core/types.js";
import type { Redactor } from "../core/redaction.js";

export async function runHostCommand(name: string, command: string[], cwd: string, redactor: Redactor, timeoutMs = 120000): Promise<CommandEvidence> {
  const started = Date.now();
  try {
    const result = await execa(command[0] ?? "", command.slice(1), {
      cwd,
      timeout: timeoutMs,
      reject: false,
      all: false
    });
    return {
      name,
      command,
      exitCode: result.exitCode ?? null,
      durationMs: Date.now() - started,
      stdout: redactor.redact(result.stdout.slice(-4000)),
      stderr: redactor.redact(result.stderr.slice(-4000))
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      name,
      command,
      exitCode: null,
      durationMs: Date.now() - started,
      stdout: "",
      stderr: redactor.redact(message)
    };
  }
}
