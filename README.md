# CookieDough

CookieDough is an evidence-first readiness auditor for founder-built and AI-built web apps.

It checks whether an app is baked enough to demo, launch to customers, or hand to an engineer.

## Current V1 Capabilities

- URL audits with Playwright.
- Repo audits for Node web apps.
- Docker-preferred command execution.
- Build, test, lint, and install evidence.
- Screenshot, console, network, command, and DOM evidence.
- CookieDough score plus demo, launch, and engineering handoff subscores.
- HTML, Markdown, JSON, and fix queue artifacts.
- Credential redaction for single-run test credentials.
- Clear support labels when stack support or execution is partial.

## Usage

```bash
npm install
npm run build
node dist/src/cli/index.js audit --url https://example.com --out .cookiedough-runs/example
node dist/src/cli/index.js audit --repo https://github.com/example/app --docker required --out .cookiedough-runs/repo
node dist/src/cli/index.js audit --repo https://github.com/example/app --url https://example.com --out .cookiedough-runs/full
```

For trusted local self-audits:

```bash
node dist/src/cli/index.js audit --repo . --docker off --out .cookiedough-runs/self-local
```

## Safety

Repo execution can be risky. Use `--docker required` when auditing untrusted code. If Docker is unavailable and required, CookieDough blocks repo command execution instead of silently falling back.

Credentials supplied through `--credentials` are loaded for one run and redacted from artifacts.

CookieDough does not submit payment flows and avoids controls labeled as destructive.

## Hosted Report Viewer

The Vercel release preview serves a static report viewer whose first screen is the
working evidence cockpit: a verified CookieDough report, score and readiness
lenses, target provenance, findings, evidence references, and the CLI command
that produced the artifact. The deployment URL is intentionally not documented
until a release preview exists.

The browser viewer renders verified artifacts bundled from the CLI and accepts
private in-memory JSON imports. It does not execute audits. Audits, including
repository isolation, Docker decisions, Playwright collection, and report
generation, execute through the CLI. Vercel only serves the built static app.

Imported reports are validated as JSON in the browser and rejected above 2 MB.
They are not persisted, uploaded, or sent over the network. The viewer has no
accounts, analytics, credentials, or server-side import endpoint.

## Local Web Viewer

```bash
npm --prefix web ci
npm --prefix web run dev
```

For the same checks used by CI:

```bash
npm --prefix web run typecheck
npm --prefix web run lint
npm --prefix web test
npm --prefix web run build
npm --prefix web run test:e2e
```

`npm run test:e2e` builds the production bundle before starting the preview server and running browser checks.

## Engineering References

- [Architecture](docs/architecture.md)
- [Safety boundaries](docs/safety.md)
- [Recruiter demo design spec](docs/superpowers/specs/2026-07-10-recruiter-demo-design.md)
- [Release checklist](docs/release-checklist.md)
