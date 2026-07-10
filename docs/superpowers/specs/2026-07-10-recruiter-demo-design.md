# CookieDough Recruiter Demo Design

Date: 2026-07-10
Status: Approved

## Objective

Ship a public, recruiter-ready CookieDough web experience on Vercel that makes the real CLI product understandable and inspectable in under one minute. The site must demonstrate authentic CookieDough output, provide useful interaction, and describe the engineering choices without pretending that Vercel executes arbitrary repositories.

## Audience And Success Criteria

The primary audience is a technical recruiter or hiring manager evaluating Amal Farhad's product judgment and engineering depth. A visitor should be able to answer these questions quickly:

- What problem does CookieDough solve?
- What evidence does it collect?
- How does its readiness scoring work?
- What did Amal build beyond a visual shell?
- Where can the source code and CLI usage be inspected?

The demo succeeds when a first-time visitor can explore a real audit, understand the repo and browser evidence model, import another CookieDough report, and reach the public GitHub repository without encountering a dead control or misleading claim.

## Product Decision

The chosen design is an evidence cockpit, not a marketing landing page and not a limited serverless scanner.

Three approaches were considered:

1. Evidence cockpit with verified artifacts and local JSON import.
2. Narrative portfolio page with the report below the fold.
3. Live URL scanner implemented as a constrained Vercel function.

The evidence cockpit wins because it puts the product itself in the first viewport, demonstrates the CLI's actual output, and avoids the security and fidelity problems of claiming that a serverless deployment can reproduce CookieDough's Docker and Playwright execution model.

## Scope

### Included

- A React and TypeScript web app isolated under `web/`.
- A first-viewport audit cockpit with CookieDough branding and recruiter context.
- Bundled, clearly labeled artifacts produced by the real CookieDough CLI.
- Case switching between available verified artifacts.
- CookieDough score and demo, customer launch, and engineering handoff lenses.
- Severity filtering and expandable finding details.
- Evidence references and recommendations for each finding.
- Client-side import of a CookieDough `findings.json` file.
- A copyable CLI command and direct links to source code.
- Concise architecture, safety, and verification context below the working report.
- Responsive desktop and mobile layouts.
- Accessible focus, keyboard, contrast, and reduced-motion behavior.
- Social metadata and a recruiter-ready preview image.
- A Vercel preview deployment.

### Excluded

- Executing repositories on Vercel.
- Live Playwright audits from the hosted page.
- Uploading imported reports to a server.
- Accounts, persistence, analytics, payments, or credential collection.
- Editing an audited application.
- Fabricated audit findings or sample results presented as real runs.

## Information Architecture

The page is a usable report explorer from the first viewport.

1. **Product bar**
   - CookieDough wordmark and readiness descriptor.
   - `Built by Amal Farhad` attribution.
   - GitHub link and report-import action.

2. **Audit header**
   - Case selector with an explicit provenance label.
   - Target, audit mode, support level, commit when available, and run date.
   - Primary CookieDough score and verdict.

3. **Readiness lenses**
   - Segmented control for overall, demo, customer launch, and engineering handoff scores.
   - Selected lens changes the emphasized score and supporting explanation without changing the underlying report.

4. **Findings workspace**
   - Severity counts and filter controls.
   - Expandable finding rows with category, description, evidence, and recommendation.
   - A purposeful baked state when the report has no findings.

5. **Execution proof**
   - Copyable CLI command.
   - Compact pipeline explanation: repo intake, isolated execution, browser evidence, deterministic scoring, portable reports.
   - Safety boundaries and support labels.

6. **Recruiter context**
   - Concrete engineering highlights and verification status.
   - Public repository link.
   - No resume-style biography or generic feature grid.

## Visual Direction

The interface combines playful product language with technical severity. It uses a warm paper base, dark ink, and one restrained baked-red accent, with status colors reserved for evidence and verdicts. Typography pairs a characterful sans display face with a compact monospace evidence face. The layout is asymmetric on desktop and collapses to a strict single column on mobile.

The product should feel like an inspection sheet from a serious QA bench, not a bakery illustration and not a generic dark SaaS dashboard. Real audit data, score marks, evidence paths, and command output provide the visual material. Cards are used only for interactive report objects; sections rely on spacing, rules, and hierarchy.

Motion is restrained and functional: staged first-load disclosure, score transitions, finding expansion, copy feedback, and filter state changes. All animation uses transforms and opacity, respects `prefers-reduced-motion`, and must not shift layout unexpectedly.

## Architecture

The existing CLI remains the root Node package. The web demo is a separate Vite React TypeScript package under `web/` with its own dependencies and lockfile.

Core web boundaries:

- `src/data`: bundled report manifests and verified JSON artifacts.
- `src/lib`: schema validation, parsing, formatting, filtering, and score metadata.
- `src/components`: focused presentational and interaction components.
- `src/app`: page composition and report selection state.
- `tests`: parser, interaction, and browser-flow coverage.

The site is a static build. Imported files are read with browser file APIs, validated in memory, and never transmitted. The initial view loads a bundled verified report so the page is immediately useful.

## Data Contract

The web app consumes the existing `AuditResult` shape:

- `run`: id, timestamps, mode, and support level.
- `target`: repo URL, deployed URL, and commit SHA when available.
- `scores`: CookieDough score, three readiness subscores, and verdict.
- `findings`: stable id, severity, category, title, description, evidence, and recommendation.
- `notes`: audit coverage and execution notes.

The browser validates imported files before replacing current state. Extra fields are tolerated. Missing required fields, invalid score ranges, unsupported enum values, and files larger than 2 MB produce inline errors and leave the current report intact.

## States And Error Handling

- **Initial:** a verified bundled report is selected.
- **Baked:** no findings renders a deliberate success state with coverage notes still visible.
- **Filtered empty:** explains that no findings match the selected severities and offers a reset action.
- **Import loading:** the import control exposes progress text without a layout-shifting spinner.
- **Import error:** malformed, oversized, or incompatible files produce a specific inline message.
- **Unknown evidence path:** evidence remains readable without assuming the referenced file is publicly available.
- **Copy feedback:** success and failure are announced accessibly.
- **Long content:** URLs, commands, evidence paths, and descriptions wrap or scroll within stable bounds.

## Accessibility And Responsiveness

- Semantic landmarks, headings, buttons, and disclosure controls.
- Full keyboard operation and visible focus treatment.
- Status is not communicated by color alone.
- Live regions for import and copy feedback.
- WCAG AA contrast for text and controls.
- Touch targets of at least 44 by 44 CSS pixels where appropriate.
- Desktop audit workspace adapts to a one-column mobile flow below 768 pixels.
- No horizontal page scrolling at 320 pixels width.
- Reduced-motion mode removes nonessential transitions.

## Security And Privacy

- No runtime secrets or environment variables are required.
- Imported report files remain in browser memory and are not persisted.
- No analytics or third-party tracking is added.
- External links use safe rel attributes.
- A restrictive static-site Content Security Policy is configured where compatible with the build.
- Bundled artifacts are scanned for usernames, home paths, credentials, tokens, private URLs, and unnecessary machine-specific metadata before commit and deployment.
- The page states that hosted repo execution is unavailable and directs users to the CLI for real audits.

## Verification Plan

Local verification must include:

- Existing CLI typecheck, lint, tests, and build.
- Web typecheck, lint, unit/component tests, and production build.
- Parser tests for valid, malformed, oversized, and partially extended reports.
- Interaction tests for case selection, readiness lenses, filters, disclosures, import, and copy feedback.
- Browser checks at desktop and mobile widths.
- Browser checks for baked, finding-heavy, malformed-import, and filtered-empty states.
- Console-error and broken-link checks.
- Metadata, favicon, and social preview validation.
- Privacy and secret-pattern scans over committed and generated public files.

Deployment verification must include:

- Successful Vercel preview build.
- Browser inspection of the deployed URL.
- Primary interactions on the live deployment.
- Responsive screenshots and a final taste-gate review.

## Acceptance Checks

- The first viewport presents the working audit explorer, CookieDough name, score, verdict, and target context.
- Every bundled case is traceable to a real local CookieDough artifact and labeled with truthful provenance.
- A valid `findings.json` import changes the report without a network request.
- Invalid import leaves the current report intact and explains the error.
- All visible controls perform a real action.
- The GitHub and author links are correct.
- The page contains no secret, local home path, private URL, or fabricated capability claim.
- The production build and all automated checks pass.
- Desktop and mobile browser QA pass with no overlap, clipping, horizontal scrolling, or console errors.
- A shareable Vercel preview URL is available for recruiter presentation.
