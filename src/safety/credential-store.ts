import fs from "fs-extra";

export interface CredentialHints {
  email?: string;
  username?: string;
  password?: string;
}

export interface CredentialBundle {
  values: string[];
  hints: CredentialHints;
}

export function credentialValuesFromObject(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(credentialValuesFromObject);
  if (value && typeof value === "object") {
    return Object.values(value).flatMap(credentialValuesFromObject);
  }
  return [];
}

function credentialHintsFromObject(value: unknown, keyPath: string[] = []): CredentialHints {
  const hints: CredentialHints = {};
  if (Array.isArray(value)) {
    for (const item of value) {
      Object.assign(hints, credentialHintsFromObject(item, keyPath));
    }
    return hints;
  }
  if (!value || typeof value !== "object") return hints;

  for (const [key, nestedValue] of Object.entries(value)) {
    const normalizedKey = [...keyPath, key].join(".").toLowerCase();
    if (typeof nestedValue === "string") {
      if (!hints.email && /email/.test(normalizedKey)) hints.email = nestedValue;
      if (!hints.username && /(user|username)/.test(normalizedKey)) hints.username = nestedValue;
      if (!hints.password && /pass/.test(normalizedKey)) hints.password = nestedValue;
    }
    Object.assign(hints, credentialHintsFromObject(nestedValue, [...keyPath, key]));
  }
  return hints;
}

export async function loadCredentialValues(filePath?: string): Promise<string[]> {
  if (!filePath) return [];
  const value = await fs.readJson(filePath);
  return credentialValuesFromObject(value).filter((item) => item.trim().length > 0);
}

export async function loadCredentialBundle(filePath?: string): Promise<CredentialBundle> {
  if (!filePath) return { values: [], hints: {} };
  const value = await fs.readJson(filePath);
  return {
    values: credentialValuesFromObject(value).filter((item) => item.trim().length > 0),
    hints: credentialHintsFromObject(value)
  };
}
