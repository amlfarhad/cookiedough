# CookieDough Architecture

CookieDough uses TypeScript for the V1 execution path.

The CLI parses inputs and calls the audit runner. The audit runner coordinates repo evidence, browser evidence, finding generation, scoring, and report rendering.

The core rule is evidence first: reports and scores are derived from captured evidence. LLM-generated findings are not allowed in V1.

## Boundaries

- `src/browser` collects Playwright evidence and maps browser evidence to findings.
- `src/repo` clones or copies repos, detects Node web projects, and runs commands through Docker or host execution.
- `src/core` owns audit orchestration, scoring, shared types, support labels, and redaction.
- `src/report` renders portable local artifacts from normalized audit results.
- `src/safety` owns credentials and secret-pattern scanning.

## Scoring

The top-level CookieDough score is capped by blocker classes. A clean URL audit can score as baked, while build failures, secret exposure, fake product surfaces, and broken core navigation force lower readiness bands.
