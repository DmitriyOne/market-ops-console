# 0007. Git flow and CI

**Context.** GitHub Free, private repo: 2,000 Actions minutes/month, each job rounded up to a minute; branch protection/rulesets unavailable (403). Owner does not want husky.

**Decision.**
- Flow: `feature/*` → `release/X.Y.Z` → `develop` → `master`. First release `0.1.0` (architecture/planning); submission is `1.0.0`.
- No direct commits to `release/*`, `develop` or `master`. Work happens on `feature/*` branched from the current release; release branches only receive merges from them.
- PR → `develop`: one job: head must be `release/*` (else comment + auto-close), version check (`package.json` = top of `CHANGELOG.md` = branch number), typecheck + lint + unit tests (pnpm cache). ~2 min.
- PR → `master`: one job: head must be `develop` (else auto-close), version check. No install. ~15 s.
- No workflows on push or feature branches. `concurrency` cancels superseded runs. Vercel builds previews on its own quota.

**Alternatives.** Full CI on every PR (burns minutes); husky hooks (rejected by owner); making the repo public (unlimited minutes + real branch protection) — possible later.

**Consequences.** Auto-close is the only enforcement; the owner can still push directly to `master`/`develop`.
