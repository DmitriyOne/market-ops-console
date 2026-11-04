---
paths:
  - ".github/**"
---

# CI rules (GitHub Free, private repo: 2,000 min/month, no branch protection)

- Workflows run only on PRs into `release/*`, `develop` and `master`. Nothing on push.
- One job per workflow (each job is billed rounded up to a minute). `timeout-minutes` set. `concurrency` with `cancel-in-progress`.
- PR → `release/*`: format:check, lint (ESLint + Steiger), typecheck with pnpm cache. No tests, no version check.
- PR → `develop`: head must match `release/*` (else comment + auto-close); versions must match (`package.json` = top of `CHANGELOG.md` = branch number); format:check, lint (ESLint + Steiger), typecheck, unit tests with pnpm cache.
- PR → `master`: head must be `develop` (else comment + auto-close); version check only, no dependency install.
- Use the `github-actions-efficiency` skill before adding or changing a workflow.
