---
paths:
  - ".github/**"
---

# CI rules (GitHub Free, private repo: 2,000 min/month, no branch protection)

- Workflows run only on PRs into `release/*`, `develop` and `master`. Nothing on push.
- One job per check (owner, 2026-11-05, 0.11.1): each is its own line and log in the PR, and they run in parallel. Each job is billed rounded up to a minute and installs on its own (`.github/actions/setup`: pnpm, Node from `.nvmrc`, pnpm cache, frozen install), so a run costs more minutes than one job did; keep the list short. Every job has `timeout-minutes`; `concurrency` with `cancel-in-progress` per workflow.
- PR → `release/*`: jobs Format (`format:check`), Lint (ESLint + Steiger), Types (`typecheck`). No tests, no version check. ~1 min to wait, ~4 billed (one job was ~2).
- PR → `develop`: job Branch & version first (head must match `release/*`, else comment + auto-close; versions must match: `package.json` = top of `CHANGELOG.md` = branch number; no install). Then, `needs` it, in parallel: Format, Lint, Types, Unit tests, E2E (`pnpm e2e` builds the app; Chromium only, browsers cached by the Playwright version; `.next/cache` cached; the step has `timeout-minutes: 10` so a hang still uploads the report, the job 15). ~4.5 min to wait, ~13 billed (one job: 7.5 min, 8 billed, on 0.11.0); the 0.11.1 run took 12.5 min because Chromium missed its cache (9.5 min download).
- PR → `master`: head must be `develop` (else comment + auto-close); version check only, no dependency install.
- Use the `github-actions-efficiency` skill (source in `docs/agent-skills.md`) before adding or changing a workflow.
