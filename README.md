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
