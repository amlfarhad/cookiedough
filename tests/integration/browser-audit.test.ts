import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createServer, type Server } from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";
import { createRedactor } from "../../src/core/redaction.js";
import { runBrowserAudit } from "../../src/browser/playwright-runner.js";
import { findingsFromBrowserEvidence } from "../../src/browser/evidence.js";

let server: Server;
let baseUrl: string;

beforeAll(async () => {
  server = createServer(async (req, res) => {
    if (req.url === "/dashboard") {
      res.writeHead(200, { "content-type": "text/html" });
      res.end("<h1>Dashboard</h1>");
      return;
    }
    const html = await fs.readFile(path.join(process.cwd(), "tests/fixtures/static-app/index.html"), "utf8");
    res.writeHead(200, { "content-type": "text/html" });
    res.end(html);
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Expected TCP server address");
  baseUrl = `http://127.0.0.1:${address.port}`;
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

describe("runBrowserAudit", () => {
  it("captures visited pages, screenshots, console errors, safe form submissions, and inert controls", async () => {
    const evidence = await runBrowserAudit({
      url: baseUrl,
      outDir: path.join(tmpdir(), "cookiedough-browser-test"),
      maxPages: 5,
      redactor: createRedactor([])
    });
    expect(evidence.visited.length).toBeGreaterThanOrEqual(1);
    expect(evidence.consoleEvents.some((event) => event.text.includes("fixture runtime error"))).toBe(true);
    expect(evidence.inertControls.length).toBeGreaterThanOrEqual(1);
    expect(evidence.submittedForms.length).toBeGreaterThanOrEqual(1);
    const findings = findingsFromBrowserEvidence(evidence);
    expect(findings.some((finding) => finding.category === "dead-navigation")).toBe(true);
  });
});
