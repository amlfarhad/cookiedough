import { describe, expect, it } from "vitest";
import { buildDockerRunArgs } from "../../src/repo/docker-executor.js";

describe("buildDockerRunArgs", () => {
  it("mounts repo inside an isolated workspace", () => {
    const args = buildDockerRunArgs("/tmp/repo", ["npm", "test"]);
    expect(args).toContain("node:20-bookworm");
    expect(args).toContain("/workspace");
    expect(args).toContain("npm");
    expect(args).toContain("test");
  });
});
