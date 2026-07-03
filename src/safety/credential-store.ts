import fs from "fs-extra";

export function credentialValuesFromObject(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(credentialValuesFromObject);
  if (value && typeof value === "object") {
    return Object.values(value).flatMap(credentialValuesFromObject);
  }
  return [];
}

export async function loadCredentialValues(filePath?: string): Promise<string[]> {
  if (!filePath) return [];
  const value = await fs.readJson(filePath);
  return credentialValuesFromObject(value).filter((item) => item.trim().length > 0);
}
