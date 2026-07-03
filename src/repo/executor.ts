import type { CommandEvidence, Finding } from "../core/types.js";

export function findingsFromCommands(commands: CommandEvidence[]): Finding[] {
  return commands
    .filter((command) => command.exitCode !== 0)
    .map((command, index) => ({
      id: `CD-REPO-COMMAND-${String(index + 1).padStart(3, "0")}`,
      severity: command.name === "build" || command.name === "install" ? "blocker" : "high",
      category: command.name === "build" || command.name === "install" ? "build-failure" : "maintainability-handoff-risk",
      title: `${command.name} command failed`,
      description: `CookieDough ran ${command.command.join(" ")} and it exited with ${command.exitCode ?? "no exit code"}.`,
      evidence: [{
        type: "command",
        message: [command.stderr, command.stdout].filter(Boolean).join("\n").slice(0, 1200)
      }],
      recommendation: `Fix the ${command.name} command so another engineer can run the project reliably.`
    }));
}
