import { describe, expect, it } from "vitest";
import { findingsFromCommands } from "../../src/repo/executor.js";

describe("findingsFromCommands", () => {
  it("turns failed build command into blocker finding", () => {
    const findings = findingsFromCommands([{
      name: "build",
      command: ["npm", "run", "build"],
      exitCode: 1,
      durationMs: 100,
      stdout: "",
      stderr: "Build failed"
    }]);
    expect(findings[0]?.severity).toBe("blocker");
    expect(findings[0]?.category).toBe("build-failure");
  });
});
