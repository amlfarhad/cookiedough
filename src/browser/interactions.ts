import type { Locator, Page } from "@playwright/test";
import type { EvidenceRef } from "../core/types.js";

const DESTRUCTIVE_PATTERN = /\b(delete|remove|cancel subscription|purchase|buy|checkout|pay|send money|transfer|log out|logout)\b/i;
const SENSITIVE_FIELD_PATTERN = /\b(card|cc-|cvc|cvv|ssn|social|routing|account number)\b/i;

export async function isDestructive(locator: Locator): Promise<boolean> {
  const text = `${await locator.innerText().catch(() => "")} ${await locator.getAttribute("aria-label").catch(() => "") ?? ""}`;
  return DESTRUCTIVE_PATTERN.test(text);
}

export async function safeClickableLocators(page: Page): Promise<Locator[]> {
  const locators = await page.locator("a, button, [role='button'], input[type='submit']").all();
  const safe: Locator[] = [];
  for (const locator of locators.slice(0, 80)) {
    if (!(await locator.isVisible().catch(() => false))) continue;
    if (await isDestructive(locator)) continue;
    safe.push(locator);
  }
  return safe;
}

export async function fillSafeForms(page: Page): Promise<EvidenceRef[]> {
  const submitted: EvidenceRef[] = [];
  const forms = await page.locator("form").all();
  for (const form of forms.slice(0, 5)) {
    const text = await form.innerText().catch(() => "");
    const html = await form.evaluate((node) => node.outerHTML).catch(() => "");
    if (DESTRUCTIVE_PATTERN.test(text) || SENSITIVE_FIELD_PATTERN.test(html)) continue;

    const inputs = await form.locator("input, textarea, select").all();
    for (const input of inputs) {
      const type = (await input.getAttribute("type").catch(() => "")) ?? "";
      const name = `${await input.getAttribute("name").catch(() => "") ?? ""} ${await input.getAttribute("aria-label").catch(() => "") ?? ""}`;
      if (["hidden", "file", "checkbox", "radio", "submit", "button"].includes(type)) continue;
      if (SENSITIVE_FIELD_PATTERN.test(name)) continue;
      if (type === "email" || /email/i.test(name)) {
        await input.fill("cookiedough@example.test").catch(() => undefined);
      } else if (type === "password" || /password/i.test(name)) {
        await input.fill("CookieDough-Test-Password-123").catch(() => undefined);
      } else {
        await input.fill("CookieDough test input").catch(() => undefined);
      }
    }

    const submit = form.locator("button[type='submit'], input[type='submit'], button").first();
    if (await submit.isVisible().catch(() => false)) {
      await submit.click({ timeout: 1500 }).catch(() => undefined);
      submitted.push({ type: "dom", message: `Submitted safe non-payment form on ${page.url()}` });
      await page.waitForTimeout(300);
    }
  }
  return submitted;
}
