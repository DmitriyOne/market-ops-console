# 0007. Git flow and CI

**Context.** GitHub Free, private repo: 2,000 Actions minutes/month, each job rounded up to a minute; branch protection/rulesets unavailable (403). Owner does not want husky.

**Decision.**
- Flow: `feature/X.Y.Z/NAME` (or `fix/X.Y.Z/NAME`) → `release/X.Y.Z` → `develop` → `master`. First release `0.1.0` (architecture/planning); submission is `1.0.0`.
- No direct commits to `release/*`, `develop` or `master`. Work happens on `feature/X.Y.Z/NAME` branched from `release/X.Y.Z`, so every branch shows its release (not `release/X.Y.Z/NAME`: git ref conflict, and it would pass the `release/*` CI check); release branches only receive merges from them.
- PR → `release/*`: one job: format check + lint + typecheck (pnpm cache), no tests. ~1 min. Catches a broken feature before the release PR.
- PR → `develop`: one job: head must be `release/*` (else comment + auto-close), version check (`package.json` = top of `CHANGELOG.md` = branch number), format check + lint + typecheck + unit tests (pnpm cache), then the Playwright E2E suite, which builds the app (0.10.0, ADR 0008; Chromium only, browsers cached, report on failure). ~7–8 min: the unit tests alone take ~5 min on the 2-core runner (jsdom set up per file).
- PR → `master`: one job: head must be `develop` (else auto-close), version check. No install. ~15 s.
- No workflows on push. `concurrency` cancels superseded runs. Vercel builds previews on its own quota.

**Alternatives.** Full CI on every PR (burns minutes); husky hooks (rejected by owner); making the repo public (unlimited minutes + real branch protection) — possible later.

**Consequences.** Auto-close is the only enforcement; a red check does not block the Merge button (no required checks on this plan); the owner can still push directly to `master`/`develop`.
