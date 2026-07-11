# CookieDough Recruiter Demo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and deploy a recruiter-ready CookieDough report explorer that presents verified CLI output, supports private client-side report import, and proves the product's architecture and safety boundaries.

**Architecture:** Keep the existing CLI package unchanged and add a separate Vite React TypeScript package in `web/`. The site statically bundles three real audit artifacts, validates imported reports with Zod entirely in browser memory, and composes the result through focused report-view components. Vercel serves only static assets with security headers; arbitrary repository execution remains a documented CLI capability.

**Tech Stack:** React, TypeScript, Vite, Tailwind CSS, Zod, Lucide React, Vitest, Testing Library, Playwright, ESLint, Vercel static hosting.

---

## File Map

- `web/package.json`: isolated web scripts and dependencies.
- `web/vite.config.ts`: Vite, Tailwind, and Vitest configuration.
- `web/eslint.config.js`: TypeScript and React lint rules.
- `web/tsconfig*.json`: browser and toolchain TypeScript boundaries.
- `web/index.html`: metadata, favicon, and application root.
- `web/vercel.json`: static output and security headers.
- `web/src/types/audit.ts`: UI-facing audit contract.
- `web/src/lib/report-schema.ts`: Zod validation and 2 MB file-size boundary.
- `web/src/lib/report-view.ts`: score-lens metadata, severity filtering, and formatting.
- `web/src/data/reports/*.json`: privacy-reviewed CLI artifacts.
- `web/src/data/report-cases.ts`: truthful case labels and provenance.
- `web/src/components/*.tsx`: product bar, overview, lenses, findings, import, and proof sections.
- `web/src/App.tsx`: report selection, import state, and page composition.
- `web/src/styles.css`: design tokens, Tailwind import, component styling, responsiveness, and reduced motion.
- `web/src/**/*.test.tsx`: parser and interaction tests.
- `web/e2e/recruiter-demo.spec.ts`: desktop and mobile browser acceptance checks.
- `.github/workflows/ci.yml`: CLI and web verification.
- `README.md`: hosted demo, web architecture, and local commands.

### Task 1: Scaffold The Isolated Web Package

**Files:**
- Create: `web/package.json`
- Create: `web/tsconfig.json`
- Create: `web/tsconfig.app.json`
- Create: `web/tsconfig.node.json`
- Create: `web/vite.config.ts`
- Create: `web/eslint.config.js`
- Create: `web/index.html`
- Create: `web/src/main.tsx`
- Create: `web/src/App.tsx`
- Create: `web/src/test/setup.ts`
- Create: `web/src/styles.css`

- [x] **Step 1: Create package and toolchain files**

Use a private ESM package with these scripts:

```json
{
  "name": "cookiedough-web",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "typecheck": "tsc -b --pretty false",
    "lint": "eslint .",
    "test": "vitest run",
    "test:e2e": "playwright test"
  }
}
```

Configure Vite with React, `@tailwindcss/vite`, and Vitest using `jsdom`, `src/test/setup.ts`, restored mocks, and CSS enabled. Configure TypeScript with strict mode, `noUncheckedIndexedAccess`, `noFallthroughCasesInSwitch`, and `verbatimModuleSyntax`.

- [x] **Step 2: Install exact dependency categories**

Run:

```bash
npm install --prefix web react react-dom zod lucide-react
npm install --prefix web --save-dev typescript vite @vitejs/plugin-react tailwindcss @tailwindcss/vite eslint @eslint/js typescript-eslint eslint-plugin-react-hooks eslint-plugin-react-refresh vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event @types/react @types/react-dom @playwright/test
```

Expected: `web/package-lock.json` is created and `npm audit` reports no unresolved high or critical vulnerabilities.

- [x] **Step 3: Add a smoke entry point**

Create `main.tsx` that mounts `<App />` inside `StrictMode`. The initial `App.tsx` exports a semantic `<main>` containing the `CookieDough` heading and `Evidence-first readiness auditor` copy, giving the first build a complete render path before feature components arrive. Create `styles.css` with `@import "tailwindcss";`, base design tokens, `box-sizing`, body defaults, focus-visible treatment, and reduced-motion overrides.

- [x] **Step 4: Verify the package boundary**

Run:

```bash
npm --prefix web run typecheck
npm --prefix web run lint
npm --prefix web run build
```

Expected: all commands exit 0 and `web/dist/index.html` exists without changing root `tsconfig.json` includes.

- [x] **Step 5: Commit**

```bash
git add web
git commit -m "chore: scaffold CookieDough web demo"
```

### Task 2: Validate CookieDough Reports Test-First

**Files:**
- Create: `web/src/types/audit.ts`
- Create: `web/src/lib/report-schema.ts`
- Create: `web/src/lib/report-schema.test.ts`

- [x] **Step 1: Write failing schema tests**

Cover a valid report, a score above 100, a missing run id, an unknown severity, tolerated extra fields, and a file larger than `2 * 1024 * 1024` bytes. The public API is:

```ts
export const MAX_REPORT_BYTES = 2 * 1024 * 1024;
export function parseAuditResult(input: unknown): AuditResult;
export async function parseAuditFile(file: File): Promise<AuditResult>;
```

The oversized-file test must expect `ReportImportError` with code `file-too-large`; malformed content must use `invalid-json`; shape failures must use `invalid-report`.

- [x] **Step 2: Run the test and verify red**

Run:

```bash
npm --prefix web test -- src/lib/report-schema.test.ts
```

Expected: failure because `report-schema.ts` does not exist.

- [x] **Step 3: Implement the typed schema**

Define literal unions matching the CLI contract and Zod schemas with scores constrained to integers from 0 through 100. Keep `.passthrough()` at entity boundaries so future CLI fields remain compatible. `parseAuditFile` checks `file.size` before calling `file.text()`, parses JSON in a dedicated `try/catch`, then delegates to `parseAuditResult`.

- [x] **Step 4: Run the focused and complete web tests**

```bash
npm --prefix web test -- src/lib/report-schema.test.ts
npm --prefix web test
```

Expected: all schema tests pass with no unhandled errors.

- [x] **Step 5: Commit**

```bash
git add web/src/types web/src/lib
git commit -m "feat: validate imported audit reports"
```

### Task 3: Add Verified Report Cases And Provenance

**Files:**
- Create: `web/src/data/reports/self-audit.json`
- Create: `web/src/data/reports/project-fm-demo.json`
- Create: `web/src/data/reports/northstar-fairlight-advisor.json`
- Create: `web/src/data/report-cases.ts`
- Create: `web/src/data/report-cases.test.ts`

- [x] **Step 1: Copy real CLI artifacts**

Copy the exact `findings.json` files from these ignored local run directories:

```text
.cookiedough-runs/self-local/findings.json
.cookiedough-runs/project-fm-demo/findings.json
.cookiedough-runs/northstar-fairlight-advisor/findings.json
```

Replace only the self-target repo URL `.` with `https://github.com/amlfarhad/cookiedough` so the public artifact has useful target context. Preserve run ids, timestamps, commit SHA, scores, findings, and notes.

- [x] **Step 2: Write a failing provenance test**

Define `ReportCase` with `id`, `label`, `eyebrow`, `description`, `sourceLabel`, `command`, and validated `report`. Assert that all case ids are unique, every report parses, the self-audit and two supplied Vercel URL artifacts have truthful provenance, and the expected scores are 100, 100, and 70.

- [x] **Step 3: Implement the case manifest**

Export `reportCases` and `defaultReportCaseId`. Use labels `CookieDough self-audit`, `Project FM`, and `Northstar`. Use exact runnable commands that correspond to each report mode and never describe the artifacts as live scans.

- [x] **Step 4: Run provenance and privacy checks**

```bash
npm --prefix web test -- src/data/report-cases.test.ts
rg -n "/Users/|amlfarhad@|sk-[A-Za-z0-9]|gh[pousr]_[A-Za-z0-9]|BEGIN (RSA|OPENSSH|EC) PRIVATE KEY" web/src/data
```

Expected: tests pass and the scan produces no matches.

- [x] **Step 5: Commit**

```bash
git add web/src/data
git commit -m "feat: add verified audit case files"
```

### Task 4: Build Report View Logic And Accessible Core Components

**Files:**
- Create: `web/src/lib/report-view.ts`
- Create: `web/src/lib/report-view.test.ts`
- Create: `web/src/components/AuditOverview.tsx`
- Create: `web/src/components/ReadinessLenses.tsx`
- Create: `web/src/components/FindingsPanel.tsx`
- Create: `web/src/components/FindingsPanel.test.tsx`

- [x] **Step 1: Write failing view-model tests**

Define four score lenses (`overall`, `demo`, `launch`, `handoff`), severity ordering (`blocker`, `high`, `medium`, `low`, `info`), score-band metadata, severity counts, and filtering. Assert that a report with no findings yields an empty list, an empty severity set yields no findings, and selected severities preserve report order.

- [x] **Step 2: Run tests and verify red**

```bash
npm --prefix web test -- src/lib/report-view.test.ts
```

Expected: failure because the view helpers are not implemented.

- [x] **Step 3: Implement view helpers and components**

`AuditOverview` renders target, mode, support, commit, run date, selected score, and verdict. `ReadinessLenses` uses an ARIA-labeled segmented control with real buttons. `FindingsPanel` renders severity-toggle buttons, `<details>` disclosures, evidence lists, recommendations, a baked state, and a filtered-empty reset action.

- [x] **Step 4: Write interaction tests**

Verify keyboard-clickable lens buttons, severity filtering, finding disclosure content, the baked state, and reset behavior. Query by role and accessible name rather than CSS selectors.

- [x] **Step 5: Run tests and accessibility assertions**

```bash
npm --prefix web test -- src/lib/report-view.test.ts src/components/FindingsPanel.test.tsx
```

Expected: all tests pass; no React `act` warnings appear.

- [x] **Step 6: Commit**

```bash
git add web/src/lib/report-view* web/src/components
git commit -m "feat: add interactive audit report workspace"
```

### Task 5: Add Private Import, Copy Feedback, And Case Switching

**Files:**
- Create: `web/src/components/ImportReportButton.tsx`
- Create: `web/src/components/CopyCommandButton.tsx`
- Create: `web/src/components/ProductBar.tsx`
- Create: `web/src/components/CaseSelector.tsx`
- Modify: `web/src/App.tsx`
- Create: `web/src/App.test.tsx`

- [x] **Step 1: Write failing application tests**

Test the initial self-audit, case switch to the blocker report, valid JSON import, malformed JSON error, oversized-file error, preservation of the current report after an import error, and copy success feedback. Stub only `navigator.clipboard`; do not mock report parsing.

- [x] **Step 2: Run tests and verify red**

```bash
npm --prefix web test -- src/App.test.tsx
```

Expected: failure because the application components do not exist.

- [x] **Step 3: Implement application state and controls**

Keep selected case, active report, selected lens, severity set, import state, and feedback in `App`. A successful import creates a temporary case labeled `Imported report`; switching back to a bundled case discards only the current view, not browser storage because no persistence exists. File input accepts `.json,application/json` and announces progress/errors through `role="status"` or `role="alert"`.

- [x] **Step 4: Implement clipboard fallback**

Use `navigator.clipboard.writeText` when available. If unavailable or rejected, select the visible command text and expose `Select the command and copy it manually` without throwing.

- [x] **Step 5: Run application and complete web tests**

```bash
npm --prefix web test -- src/App.test.tsx
npm --prefix web test
```

Expected: all tests pass and imported report data is not written to local storage, session storage, cookies, or network APIs.

- [x] **Step 6: Commit**

```bash
git add web/src/App* web/src/components
git commit -m "feat: add private report import and case controls"
```

### Task 6: Apply The Recruiter-Ready Visual System And Product Narrative

**Files:**
- Create: `web/src/components/ExecutionProof.tsx`
- Create: `web/src/components/RecruiterContext.tsx`
- Modify: `web/src/App.tsx`
- Modify: `web/src/styles.css`
- Modify: `web/index.html`

- [x] **Step 1: Add concrete product proof content**

Render the five-stage execution pipeline, deterministic evidence rule, Docker boundary, redaction behavior, current Node/React/Next/Vite support, and the exact automated verification counts. Include links to the GitHub repository, architecture document, safety document, and Amal's GitHub profile. Every link must have a real destination and external links must use `rel="noreferrer"`.

- [x] **Step 2: Implement the visual system**

Use warm paper `#f4efe5`, ink `#20201d`, surface `#fffdf8`, rule `#c9c0b1`, and baked-red `#b44a32` tokens. Use one sans display/body family and a monospace evidence family loaded through reliable font files or a robust local stack. Build an asymmetric desktop score/workspace grid, strict mobile single column, 8 px maximum interactive-card radius, stable score dimensions, and no decorative gradient/orb effects.

- [x] **Step 3: Add restrained motion**

Use CSS transform/opacity entrance sequencing, score value transitions, disclosure affordances, and tactile button feedback. Add a complete `prefers-reduced-motion: reduce` override and avoid infinite animation.

- [x] **Step 4: Harden long and narrow content**

Add `overflow-wrap: anywhere` for URLs and paths, bounded horizontal scrolling for commands, stable grid tracks, 44 px touch targets, visible focus, print-friendly colors, and no page-level horizontal overflow at 320 px.

- [x] **Step 5: Verify static quality**

```bash
npm --prefix web run typecheck
npm --prefix web run lint
npm --prefix web test
npm --prefix web run build
```

Expected: all commands exit 0.

- [x] **Step 6: Commit**

```bash
git add web/src web/index.html
git commit -m "feat: craft recruiter-ready CookieDough experience"
```

### Task 7: Add Browser Acceptance Coverage And Social Assets

**Files:**
- Create: `web/playwright.config.ts`
- Create: `web/e2e/recruiter-demo.spec.ts`
- Create: `web/e2e/fixtures/import-report.json`
- Create: `web/public/favicon.svg`
- Create after browser capture: `web/public/cookiedough-preview.png`
- Modify: `web/index.html`

- [x] **Step 1: Write Playwright acceptance tests**

Run Vite preview on a deterministic local port. At 1440 by 900 and 390 by 844, assert the product name, initial 100 score, case switching to the Project FM and Northstar URLs, Northstar finding filters, expanded evidence, valid import, malformed import error, GitHub link target, Open Graph title/image metadata, and absence of horizontal document overflow. Collect page errors and console errors and fail after each test if either list is nonempty.

- [x] **Step 2: Install the browser and run red**

```bash
npm --prefix web exec playwright install chromium
npm --prefix web run test:e2e
```

Expected: FAIL on the Open Graph metadata assertion because the preview asset and metadata are introduced in Step 4.

- [x] **Step 3: Complete selectors and interaction behavior**

Add stable accessible names or `data-testid` only where role-based selectors cannot uniquely identify score output. Do not weaken assertions to make the test pass.

- [x] **Step 4: Capture the real product preview**

Capture the first viewport at 1200 by 630 after loading the verified URL-audit case. Save it as `web/public/cookiedough-preview.png`, set it as `og:image` and `twitter:image`, and provide accurate title and description metadata.

- [x] **Step 5: Run desktop and mobile browser coverage**

```bash
npm --prefix web run build
npm --prefix web run test:e2e
```

Expected: all browser tests pass with zero page or console errors and zero horizontal overflow.

- [x] **Step 6: Commit**

```bash
git add web/e2e web/playwright.config.ts web/public web/index.html
git commit -m "test: cover recruiter demo browser flows"
```

### Task 8: Integrate CI, Vercel Security Headers, And Documentation

**Files:**
- Create: `web/vercel.json`
- Modify: `.github/workflows/ci.yml`
- Modify: `README.md`
- Modify: `.gitignore`

- [x] **Step 1: Configure Vercel**

Set `framework` to `vite`, `buildCommand` to `npm run build`, and `outputDirectory` to `dist`. Add headers for `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`, and a CSP limited to self-hosted scripts/styles/images plus necessary data images.

- [x] **Step 2: Extend CI**

Keep the existing CLI job and add a separate `web` job that runs checkout, Node setup with `web/package-lock.json` cache, `npm ci --prefix web`, browser install, typecheck, lint, tests, build, and Playwright acceptance tests.

- [x] **Step 3: Document the demo truthfully**

Add the hosted-demo section, local web commands, artifact-import behavior, privacy boundary, and explicit statement that audits execute through the CLI rather than Vercel. Link the design spec and retain existing CLI usage and safety instructions.

- [x] **Step 4: Run all repository checks**

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm --prefix web run typecheck
npm --prefix web run lint
npm --prefix web test
npm --prefix web run build
npm --prefix web run test:e2e
npm audit --audit-level=high
npm audit --prefix web --audit-level=high
```

Expected: all commands exit 0, 25 existing CLI tests still pass, all web tests pass, and both audit commands report zero high or critical vulnerabilities.

- [x] **Step 5: Commit**

```bash
git add .github/workflows/ci.yml .gitignore README.md web/vercel.json
git commit -m "ci: verify and document hosted demo"
```

### Task 9: Review, Privacy Scan, And Vercel Preview Deployment

**Files:**
- Modify only files required by review findings.

- [x] **Step 1: Request independent code review**

Review the feature diff from `077cc46` through the feature head against the approved design spec. Fix every critical or important finding, rerun the relevant focused tests, and commit fixes separately.

- [x] **Step 2: Run the public-artifact privacy gate**

Scan tracked files and built output for home paths, email addresses, common token prefixes, private-key markers, `.env` values, localhost URLs outside test/config contexts, and credentials. Inspect every match and classify the gate as `CLEAN`, `CONFIRM`, or `BLOCK`.

- [x] **Step 3: Run fresh full verification**

Repeat all Task 8 checks from a clean working tree, then run `git diff --check` and confirm the built page in a real browser at desktop and mobile widths.

- [x] **Step 4: Deploy a Vercel preview**

```bash
vercel deploy web -y
```

Expected: Vercel returns a public HTTPS preview URL and the build status is ready.

- [x] **Step 5: Inspect the deployed page in a real browser**

Open the preview URL with Playwright, switch cases, expand evidence, exercise a malformed import, verify GitHub links, capture desktop/mobile screenshots, and confirm no console errors or layout overflow. Do not send report contents to any endpoint.

- [x] **Step 6: Push the verified feature branch**

```bash
git push -u origin feat/recruiter-demo
```

Expected: the remote branch contains the verified deployment source and GitHub Actions starts for the pushed head.
