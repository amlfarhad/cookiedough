import type { EvidenceRef, Finding } from "../core/types.js";

export interface BrowserConsoleEvent {
  type: string;
  text: string;
  url: string;
}

export interface BrowserNetworkEvent {
  url: string;
  status?: number;
  failureText?: string;
}

export interface BrowserRouteEvidence {
  url: string;
  title: string;
  visibleTextSample: string;
  screenshotPath?: string;
}

export interface BrowserAuditEvidence {
  startUrl: string;
  visited: BrowserRouteEvidence[];
  consoleEvents: BrowserConsoleEvent[];
  networkEvents: BrowserNetworkEvent[];
  inertControls: EvidenceRef[];
  blockedActions: EvidenceRef[];
  submittedForms: EvidenceRef[];
}

export function findingsFromBrowserEvidence(evidence: BrowserAuditEvidence): Finding[] {
  const findings: Finding[] = [];

  const failedNetwork = evidence.networkEvents.filter((event) => event.failureText || (event.status !== undefined && event.status >= 400));
  if (failedNetwork.length > 0) {
    findings.push({
      id: "CD-BROWSER-NETWORK-001",
      severity: failedNetwork.some((event) => event.status !== undefined && event.status >= 500) ? "high" : "medium",
      category: "console-network-errors",
      title: "Browser audit captured failed network requests",
      description: `${failedNetwork.length} request(s) failed while CookieDough clicked through the app.`,
      evidence: failedNetwork.slice(0, 5).map((event) => ({
        type: "network",
        message: `${event.status ?? "failed"} ${event.url} ${event.failureText ?? ""}`.trim()
      })),
      recommendation: "Fix failed requests or remove broken calls from the audited user paths."
    });
  }

  const errors = evidence.consoleEvents.filter((event) => ["error", "pageerror"].includes(event.type));
  if (errors.length > 0) {
    findings.push({
      id: "CD-BROWSER-CONSOLE-001",
      severity: "medium",
      category: "console-network-errors",
      title: "Browser audit captured console errors",
      description: `${errors.length} console error(s) appeared during the browser audit.`,
      evidence: errors.slice(0, 5).map((event) => ({
        type: "console",
        message: `${event.url}: ${event.text}`
      })),
      recommendation: "Resolve runtime console errors on audited paths before demo or launch."
    });
  }

  if (evidence.inertControls.length > 0) {
    findings.push({
      id: "CD-BROWSER-INERT-001",
      severity: "high",
      category: "dead-navigation",
      title: "Clickable controls did not produce visible navigation or UI changes",
      description: `${evidence.inertControls.length} clicked control(s) appeared inert.`,
      evidence: evidence.inertControls.slice(0, 5),
      recommendation: "Wire the controls to real behavior or remove them from the shipped surface."
    });
  }

  const fakeRoutes = evidence.visited.filter((route) => {
    const sample = route.visibleTextSample.toLowerCase();
    return /\b(lorem ipsum|coming soon|placeholder|todo|under construction)\b/.test(sample);
  });
  if (fakeRoutes.length > 0) {
    findings.push({
      id: "CD-BROWSER-FAKE-001",
      severity: "high",
      category: "fake-product-surface",
      title: "Audited pages contain placeholder or unfinished product signals",
      description: `${fakeRoutes.length} route(s) included visible fake-product language.`,
      evidence: fakeRoutes.slice(0, 5).map((route) => ({
        type: "dom",
        path: route.screenshotPath,
        message: `${route.url}: ${route.visibleTextSample.slice(0, 180)}`
      })),
      recommendation: "Replace placeholder content with working product states before demos or launch."
    });
  }

  return findings;
}
