import { defineConfig } from "@playwright/test";

export default defineConfig({
  timeout: 30000,
  use: {
    headless: true,
    viewport: { width: 1366, height: 900 },
    ignoreHTTPSErrors: true
  }
});
