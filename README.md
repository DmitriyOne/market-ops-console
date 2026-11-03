# Market Ops Console

A console for a commercial operations team: a **streaming AI assistant** that answers questions with citations and honest confidence, and an **analytical dashboard** (map, radar, time series, heat map) with drill-down from portfolio to product. Both read the same dataset.

Take-home assignment for the Frontend Engineer role at NewPage Solutions.

> Status: `0.1.0`, architecture and planning. No app code yet.

## Start here (5 minutes)

1. **What we build:** `docs/STARTER_PACK.md` (starter pack) and `docs/CONTRACT.md` (data + streaming contract).
2. **Why it is built this way:** `docs/decisions/` (one short file per decision).
3. **How the code is organised:** [Project structure](#project-structure) below.
4. **Working with an AI agent:** `CLAUDE.md` + `.claude/rules/`.

## Quick start

To be added after scaffolding. Planned:

```bash
pnpm install
pnpm dev          # http://localhost:3000
pnpm test         # unit + component tests
pnpm e2e          # one Playwright happy path (local only)
```

## Project structure

Feature-Sliced Design v2.1. Layers import only downward.

```
app/                 Next.js routing only (page.tsx re-exports from src/pages)
pages/               empty on purpose (see pages/README.md)
src/
  app/               providers, global styles, design tokens
  pages/             page composition, no logic
  widgets/           screen blocks: map, radar, time series, heat map, chat panel
  features/          user actions: drill-down, select period, ask, stop, alerts
  entities/          market, region, product, citation, chat message
  shared/            ui (shadcn), lib (format, sse), api, config (env)
data/                data.json, fixtures.json (source of truth)
docs/
  decisions/         architecture decision records
  specs/             what we build
  plans/             how we build it, step by step
reference/           reference mock SSE route from the starter pack
```

## Git flow

`feature/*` → `release/X.Y.Z` → `develop` → `master`. Work happens on `feature/*` branched from the current release; nobody commits to `release/*`, `develop` or `master` directly. Only `release/*` merges into `develop`, only `develop` into `master`. The version in `package.json`, the top of `CHANGELOG.md` and the release branch must match. Details: `docs/decisions/0007-git-flow-and-ci.md`.

## Working with AI agents

- `CLAUDE.md`: working agreement, architecture, code rules. Loaded every session.
- `.claude/rules/*.md`: scoped rules (FSD, UI, testing, CI) that load only when the agent touches matching files.
- `docs/decisions`, `docs/specs`, `docs/plans`: the context an agent (or a new developer) needs, kept in the repo and updated with the code.

---

*Sections required by the brief (architecture, productionising, approach and decisions, accessibility, testing, AI workflow, what I'd do differently) will be written by the author as the project progresses.*
