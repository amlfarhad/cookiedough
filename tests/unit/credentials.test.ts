import { describe, expect, it } from "vitest";
import { credentialValuesFromObject, loadCredentialBundle } from "../../src/safety/credential-store.js";
import fs from "fs-extra";
import path from "node:path";
import { tmpdir } from "node:os";

describe("credentialValuesFromObject", () => {
  it("extracts nested string credential values", () => {
    expect(credentialValuesFromObject({
      login: { email: "founder@example.com", password: "secret-password" }
    })).toEqual(["founder@example.com", "secret-password"]);
  });

  it("extracts credential hints for browser form filling", async () => {
    const filePath = path.join(tmpdir(), `cookiedough-credentials-${Date.now()}.json`);
    await fs.writeJson(filePath, {
      login: { email: "founder@example.com", password: "secret-password" }
    });
    const bundle = await loadCredentialBundle(filePath);
    expect(bundle.hints).toEqual({
      email: "founder@example.com",
      password: "secret-password"
    });
    expect(bundle.values).toContain("founder@example.com");
    expect(bundle.values).toContain("secret-password");
  });
});
