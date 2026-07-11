import { expect, test, type Page } from "@playwright/test";

const malformedReport = Buffer.from("{not-json");
const browserFailures = new WeakMap<Page, string[]>();
const previewImageUrl = "https://raw.githubusercontent.com/amlfarhad/cookiedough/a7749f0c671aa249f666b4ecb9e602bd412bb9c7/web/public/cookiedough-preview.png";
const previewImageAlt = "CookieDough recruiter demo showing a 93 readiness score and audit finding workspace.";

test.describe("CookieDough recruiter demo", () => {
  test.beforeEach(async ({ page }) => {
    const failures: string[] = [];
    page.on("pageerror", (error) => failures.push(`pageerror: ${error.message}`));
    page.on("console", (message) => {
      if (message.type() === "error") failures.push(`console: ${message.text()}`);
    });
    page.on("requestfailed", (request) => {
      failures.push(`requestfailed: ${request.url()} (${request.failure()?.errorText ?? "unknown failure"})`);
    });
    await page.addInitScript(() => {
      window.sessionStorage.setItem("recruiter-demo-e2e", "true");
    });
    browserFailures.set(page, failures);
  });

  test.afterEach(async ({ page }) => {
    const failures = browserFailures.get(page) ?? [];
    expect(failures, failures.join("\n")).toEqual([]);
  });

  test("supports the recruiter evidence workflow at desktop width", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: "http://127.0.0.1:4179" });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");

    await expect(page.getByRole("heading", { name: "CookieDough", exact: true })).toBeVisible();
    await expect(page.getByLabel("Audit case")).toHaveValue("self-audit");
    await expect(page.getByTestId("selected-score")).toHaveText("100");
    await expect(page.getByLabel("Audit case").locator("option:checked")).toHaveText("CookieDough self-audit");

    await page.getByLabel("Audit case").selectOption("docker-required");
    await expect(page.getByTestId("selected-score")).toHaveText("45");
    await expect(page.getByText("Docker was required but unavailable")).toBeVisible();

    await page.getByLabel("Audit case").selectOption("url-audit");
    await expect(page.getByTestId("selected-score")).toHaveText("93");
    await expect(page.getByRole("button", { name: "medium: 1 findings" })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByText("1 finding shown")).toBeVisible();

    const finding = page.locator(".findings-panel__finding");
    await expect(finding).not.toHaveAttribute("open", "");
    await finding.locator("summary").click();
    await expect(finding).toHaveAttribute("open", "");
    await expect(page.getByLabel("Evidence for CD-BROWSER-CONSOLE-001")).toBeVisible();
    await expect(page.getByText("Resolve runtime console errors on audited paths before demo or launch.")).toBeVisible();
    await finding.locator("summary").click();
    await expect(finding).not.toHaveAttribute("open", "");

    await page.getByLabel("Audit case").selectOption("docker-required");
    await page.getByLabel("Import report").setInputFiles({
      name: "malformed-report.json",
      mimeType: "application/json",
      buffer: malformedReport,
    });
    await expect(page.getByRole("alert")).toHaveText("The selected file is not valid JSON.");
    await expect(page.getByLabel("Audit case")).toHaveValue("docker-required");
    await expect(page.getByTestId("selected-score")).toHaveText("45");

    await page.getByLabel("Import report").setInputFiles("e2e/fixtures/import-report.json");
    await expect(page.getByLabel("Audit case")).toHaveValue("imported");
    await expect(page.getByText("Imported finding")).toBeVisible();
    await expect(page.getByText("https://imported.example.com")).toBeVisible();

    await expect(page.getByRole("link", { name: "Built by Amal Farhad" })).toHaveAttribute("href", "https://github.com/amlfarhad");
    await expect(page.getByRole("link", { name: "View CookieDough on GitHub" })).toHaveAttribute("href", "https://github.com/amlfarhad/cookiedough");
    for (const link of await page.locator('a[href^="https://github.com/"]').all()) {
      await expect(link).toHaveAttribute("rel", expect.stringContaining("noreferrer"));
    }

    await page.getByRole("button", { name: "Copy command" }).click();
    await expect(page.getByLabel("Copy feedback")).toHaveText("Command copied");
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(await page.getByLabel("CookieDough command").textContent());
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });

  test("selects the command when browser clipboard writes are rejected", async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: {
          writeText: async () => Promise.reject(new Error("Clipboard write denied")),
        },
      });
    });
    await page.goto("/");

    const command = await page.getByLabel("CookieDough command").textContent();
    await page.getByRole("button", { name: "Copy command" }).click();

    await expect(page.getByLabel("Copy feedback")).toHaveText("Select the command and copy it manually");
    await expect.poll(() => page.evaluate(() => window.getSelection()?.toString())).toBe(command);
  });

  for (const viewport of [
    { width: 390, height: 844 },
    { width: 320, height: 700 },
  ]) {
    test(`keeps primary controls reachable at ${viewport.width}x${viewport.height}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto("/");

      await expect(page.locator(".product-bar")).toBeVisible();
      await expect(page.getByLabel("Audit case")).toBeVisible();
      await expect(page.getByTestId("selected-score")).toBeVisible();
      await expect(page.getByText("Readiness lens")).toBeVisible();
      await expect(page.getByRole("heading", { name: "Findings", exact: true })).toBeVisible();

      await page.getByLabel("Audit case").selectOption("url-audit");
      await expect(page.getByRole("heading", { name: "https://example.com", exact: true })).toBeVisible();
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

      const importInput = page.getByLabel("Import report");
      await importInput.focus();
      await expect(importInput).toBeFocused();
      await expect(page.locator(".import-report-button label")).toHaveCSS("outline-style", "solid");

      const finding = page.locator(".findings-panel__finding");
      await finding.locator("summary").scrollIntoViewIfNeeded();
      await expect(finding.locator("summary")).toBeVisible();
      await finding.locator("summary").click();
      await expect(finding).toHaveAttribute("open", "");
    });
  }

  test("publishes complete, locally served social metadata", async ({ page, request }) => {
    await page.goto("/");

    await expect(page).toHaveTitle("CookieDough | Readiness evidence cockpit");
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      "content",
      "Inspect verified CookieDough audit reports, execution evidence, readiness scores, and safety boundaries.",
    );
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", "CookieDough | Readiness evidence cockpit");
    await expect(page.locator('meta[property="og:description"]')).toHaveAttribute(
      "content",
      "Inspect verified CookieDough audit reports, execution evidence, readiness scores, and safety boundaries.",
    );
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", previewImageUrl);
    await expect(page.locator('meta[property="og:image:alt"]')).toHaveAttribute(
      "content",
      previewImageAlt,
    );
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute("content", "summary_large_image");
    await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute("content", previewImageUrl);
    await expect(page.locator('meta[name="twitter:image:alt"]')).toHaveAttribute("content", previewImageAlt);
    await expect(page.locator('link[rel="icon"]')).toHaveAttribute("href", "/favicon.svg");
    await expect((await request.get("/cookiedough-preview.png")).ok()).toBeTruthy();
    await expect((await request.get("/favicon.svg")).ok()).toBeTruthy();
  });
});
