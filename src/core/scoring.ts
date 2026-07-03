import type { Finding, Scores } from "./types.js";

export interface ScoreContext {
  urlAuditWorked: boolean;
  localAppStarted?: boolean;
}

const severityPenalty = {
  blocker: 35,
  high: 20,
  medium: 10,
  low: 4,
  info: 0
} as const;

function clamp(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function verdict(score: number): Scores["verdict"] {
  if (score >= 85) return "baked";
  if (score >= 70) return "almost baked";
  if (score >= 50) return "soft center";
  if (score >= 25) return "raw dough";
  return "flour on the counter";
}

export function scoreAudit(findings: Finding[], context: ScoreContext): Scores {
  let demoReadiness = 100;
  let customerLaunchReadiness = 100;
  let engineeringHandoffReadiness = 100;

  for (const finding of findings) {
    const penalty = severityPenalty[finding.severity];
    if (["dead-navigation", "form-auth-onboarding", "fake-product-surface", "console-network-errors"].includes(finding.category)) {
      demoReadiness -= penalty;
      customerLaunchReadiness -= penalty;
    }
    if (["build-failure", "execution-failure", "environment-config-risk", "maintainability-handoff-risk"].includes(finding.category)) {
      engineeringHandoffReadiness -= penalty;
      customerLaunchReadiness -= Math.ceil(penalty / 2);
    }
    if (["secret-exposure", "trust-safety-risk"].includes(finding.category)) {
      customerLaunchReadiness -= penalty;
      engineeringHandoffReadiness -= Math.ceil(penalty / 2);
    }
  }

  if (findings.some((item) => item.category === "build-failure") && !context.urlAuditWorked) {
    customerLaunchReadiness = Math.min(customerLaunchReadiness, 45);
  }
  if (context.localAppStarted === false) {
    engineeringHandoffReadiness = Math.min(engineeringHandoffReadiness, 55);
  }
  if (findings.some((item) => item.category === "dead-navigation" || item.category === "form-auth-onboarding")) {
    customerLaunchReadiness = Math.min(customerLaunchReadiness, 50);
  }
  if (findings.some((item) => item.category === "secret-exposure" || item.category === "trust-safety-risk")) {
    demoReadiness = Math.min(demoReadiness, 65);
  }
  if (findings.some((item) => item.category === "fake-product-surface")) {
    demoReadiness = Math.min(demoReadiness, 60);
    customerLaunchReadiness = Math.min(customerLaunchReadiness, 35);
  }

  demoReadiness = clamp(demoReadiness);
  customerLaunchReadiness = clamp(customerLaunchReadiness);
  engineeringHandoffReadiness = clamp(engineeringHandoffReadiness);

  let cookieDough = clamp((demoReadiness * 0.35) + (customerLaunchReadiness * 0.4) + (engineeringHandoffReadiness * 0.25));
  if (findings.some((item) => item.category === "secret-exposure" || item.category === "trust-safety-risk")) {
    cookieDough = Math.min(cookieDough, 40);
  }

  return {
    cookieDough,
    demoReadiness,
    customerLaunchReadiness,
    engineeringHandoffReadiness,
    verdict: verdict(cookieDough)
  };
}
