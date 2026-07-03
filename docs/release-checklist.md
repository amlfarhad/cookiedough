# CookieDough Release Checklist

- [ ] `npm run typecheck` passes.
- [ ] `npm run lint` passes.
- [ ] `npm test` passes.
- [ ] `npm run build` passes.
- [ ] URL-only audit writes `report.html`, `report.md`, `findings.json`, `fix-queue.md`, and screenshots.
- [ ] Repo audit runs with Docker or clearly states host execution.
- [ ] Combined repo + URL audit runs.
- [ ] Generated artifacts contain no supplied credentials.
- [ ] Generated artifacts contain no `.env` values.
- [ ] README contains no private local paths.
- [ ] Public repo description is accurate.
