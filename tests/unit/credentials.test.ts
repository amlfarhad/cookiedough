import { describe, expect, it } from "vitest";
import { credentialValuesFromObject } from "../../src/safety/credential-store.js";

describe("credentialValuesFromObject", () => {
  it("extracts nested string credential values", () => {
    expect(credentialValuesFromObject({
      login: { email: "founder@example.com", password: "secret-password" }
    })).toEqual(["founder@example.com", "secret-password"]);
  });
});
