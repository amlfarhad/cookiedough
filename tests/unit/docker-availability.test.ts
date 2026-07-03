import { describe, expect, it, vi } from "vitest";

vi.mock("execa", () => ({
  execa: vi.fn()
}));

describe("dockerAvailable", () => {
  it("requires docker daemon availability, not only a docker client binary", async () => {
    const { execa } = await import("execa");
    vi.mocked(execa).mockResolvedValueOnce({ exitCode: 1 } as never);
    const { dockerAvailable } = await import("../../src/repo/docker-executor.js");
    await expect(dockerAvailable()).resolves.toBe(false);
    expect(execa).toHaveBeenCalledWith("docker", ["info"], { reject: false });
  });
});
