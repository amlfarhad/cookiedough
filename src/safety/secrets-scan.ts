import type { Finding } from "../core/types.js";

const SECRET_SCAN_PATTERNS = [
  /\b[A-Z0-9_]*(API_KEY|SECRET|TOKEN|PASSWORD)\s*=\s*[^\s"']+/i,
  /\bsk-(live|test|proj)-[A-Za-z0-9_-]{8,}/,
  /\bghp_[A-Za-z0-9_]{20,}/
];

export function scanTextForSecrets(text: string): Finding[] {
  const matched = SECRET_SCAN_PATTERNS.some((pattern) => pattern.test(text));
  if (!matched) return [];
  return [{
    id: "CD-SAFETY-SECRETS-001",
    severity: "blocker",
    category: "secret-exposure",
    title: "Possible secret detected in audit evidence",
    description: "CookieDough found text that looks like a token, API key, password, or secret assignment.",
    evidence: [{ type: "security", message: "Secret-like pattern detected and redacted from report output." }],
    recommendation: "Rotate the exposed value if it is real, move it to a private environment variable, and confirm it is not present in public artifacts."
  }];
}
