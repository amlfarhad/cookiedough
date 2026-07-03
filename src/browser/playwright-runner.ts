import { chromium } from "@playwright/test";
import fs from "fs-extra";
import path from "node:path";
import type { Redactor } from "../core/redaction.js";
import type { CredentialHints } from "../safety/credential-store.js";
import { sameOrigin, normalizeUrl } from "./crawl.js";
import { fillSafeForms, safeClickableLocators } from "./interactions.js";
import type { BrowserAuditEvidence } from "./evidence.js";

export interface BrowserAuditOptions {
  url: string;
  outDir: string;
  maxPages: number;
  redactor: Redactor;
  credentials?: CredentialHints;
}

export async function runBrowserAudit(options: BrowserAuditOptions): Promise<BrowserAuditEvidence> {
  const screenshotDir = path.join(options.outDir, "screenshots");
  await fs.ensureDir(screenshotDir);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const evidence: BrowserAuditEvidence = {
    startUrl: options.url,
    visited: [],
    consoleEvents: [],
    networkEvents: [],
    inertControls: [],
    blockedActions: [],
    submittedForms: []
  };

  page.on("console", (message) => {
    evidence.consoleEvents.push({
      type: message.type(),
      text: options.redactor.redact(message.text()),
      url: options.redactor.redact(page.url())
    });
  });
  page.on("pageerror", (error) => {
    evidence.consoleEvents.push({
      type: "pageerror",
      text: options.redactor.redact(error.message),
      url: options.redactor.redact(page.url())
    });
  });
  page.on("response", (response) => {
    if (response.status() >= 400) {
      evidence.networkEvents.push({
        url: options.redactor.redact(response.url()),
        status: response.status()
      });
    }
  });
  page.on("requestfailed", (request) => {
    evidence.networkEvents.push({
      url: options.redactor.redact(request.url()),
      failureText: options.redactor.redact(request.failure()?.errorText ?? "request failed")
    });
  });

  const queue = [options.url];
  const visited = new Set<string>();

  try {
    while (queue.length > 0 && visited.size < options.maxPages) {
      const nextUrl = queue.shift();
      if (!nextUrl) break;
      const normalized = normalizeUrl(nextUrl);
      if (visited.has(normalized)) continue;
      visited.add(normalized);

      await page.goto(normalized, { waitUntil: "domcontentloaded", timeout: 30000 }).catch(() => undefined);
      await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => undefined);

      const screenshotName = `page-${visited.size}.png`;
      const screenshotPath = path.join(screenshotDir, screenshotName);
      await page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => undefined);

      evidence.visited.push({
        url: options.redactor.redact(page.url()),
        title: options.redactor.redact(await page.title().catch(() => "")),
        visibleTextSample: options.redactor.redact((await page.locator("body").innerText().catch(() => "")).slice(0, 1200)),
        screenshotPath
      });

      const hrefs = await page.locator("a[href]").evaluateAll((links) =>
        links.map((link) => (link as HTMLAnchorElement).href).filter(Boolean)
      ).catch(() => []);
      for (const href of hrefs) {
        if (sameOrigin(options.url, href) && visited.size + queue.length < options.maxPages) {
          queue.push(href);
        }
      }

      evidence.submittedForms.push(...await fillSafeForms(page, options.credentials));

      const clickables = await safeClickableLocators(page);
      for (const clickable of clickables.slice(0, 20)) {
        const beforeUrl = page.url();
        const beforeText = await page.locator("body").innerText().catch(() => "");
        const label = await clickable.innerText().catch(() => "unlabeled control");
        await clickable.click({ timeout: 1500 }).catch(() => undefined);
        await page.waitForTimeout(300);
        const afterUrl = page.url();
        const afterText = await page.locator("body").innerText().catch(() => "");
        const changed = beforeUrl !== afterUrl || beforeText !== afterText;
        if (!changed) {
          evidence.inertControls.push({
            type: "dom",
            message: options.redactor.redact(`Clicked "${label.slice(0, 80)}" on ${beforeUrl} with no visible change`)
          });
        }
        if (afterUrl !== beforeUrl && sameOrigin(options.url, afterUrl)) {
          queue.push(afterUrl);
        }
        await page.goto(normalized, { waitUntil: "domcontentloaded", timeout: 10000 }).catch(() => undefined);
      }
    }
  } finally {
    await browser.close();
  }

  return evidence;
}
