export interface Redactor {
  redact(value: string): string;
  redactObject<T>(value: T): T;
}

const SECRET_PATTERNS: RegExp[] = [
  /Authorization:\s*Bearer\s+[A-Za-z0-9._~+/=-]+/gi,
  /\bsk-(?:live|test|proj)-[A-Za-z0-9_-]{8,}\b/g,
  /\bghp_[A-Za-z0-9_]{20,}\b/g,
  /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g,
  /\bDATABASE_URL\s*=\s*\S+/gi,
  /\bpostgres(?:ql)?:\/\/[^\s"']+/gi,
  /\bmongodb(?:\+srv)?:\/\/[^\s"']+/gi,
  /\b[A-Z0-9_]*(?:API_KEY|SECRET|TOKEN|PASSWORD)\s*=\s*[^\s"']+/gi
];

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function createRedactor(secretValues: string[]): Redactor {
  const literalPatterns = secretValues
    .filter((value) => value.trim().length >= 3)
    .map((value) => new RegExp(escapeRegExp(value), "g"));

  function redact(value: string): string {
    let output = value;
    for (const pattern of literalPatterns) {
      output = output.replace(pattern, "[REDACTED]");
    }
    for (const pattern of SECRET_PATTERNS) {
      output = output.replace(pattern, (match) => {
        if (/^Authorization:/i.test(match)) return "Authorization: Bearer [REDACTED]";
        const key = match.match(/^([A-Z0-9_]+)\s*=/i)?.[1];
        return key ? `${key}=[REDACTED]` : "[REDACTED]";
      });
    }
    return output;
  }

  function redactObject<T>(value: T): T {
    return JSON.parse(redact(JSON.stringify(value))) as T;
  }

  return { redact, redactObject };
}
