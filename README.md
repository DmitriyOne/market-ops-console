# Market Ops Console

A console for a commercial operations team: a **streaming AI assistant** that answers questions with citations and honest confidence, and an **analytical dashboard** (map, radar, time series, heat map) with drill-down from portfolio to product. Both read the same dataset.

Take-home assignment for the Frontend Engineer role at NewPage Solutions.

> Status: `0.6.0` market map in review. Done: foundation (0.2.0), design direction and tokens (0.3.0), assistant (0.4.0), dashboard shell (0.5.0). Next, one release each: Analyst view with the markets table and CSV export (0.7.0), heat map and radar (0.8.0), then alerts, end-to-end test and deploy. Full list: `CHANGELOG.md`.

## What works now

- **Assistant** in a right panel on desktop (collapsible, remembered without a flash) and an Assistant tab on phones.
- **Streamed answers** with Stop, Retry, confidence and the label "AI answer · may be incomplete". Answers without matching data say "I can't answer this from the data".
- **Sources**: one button per citation. Hover, focus or tap shows an evidence card with the real numbers and a 12-month trend; a click focuses the dashboard through the URL.
- **"What the data shows"** under each answer: the portfolio row, the cited rows and markets the answer did not mention, found by fixed rules (no AI). "Show on dashboard" highlights them.
- **Answer actions**: Copy, 👍 / 👎 with a reason (once per answer), New chat.
- **History** survives a reload of the same tab (`sessionStorage`) and ends with the tab.
- **Dashboard, Executive view**: drill-down path `Portfolio › Region › Market › Product`, a month picker with a 1 / 3 / 12-month window, KPI cards (revenue, forecast attainment, growth, markets at risk), market status as a world map, tiles by region or a table (map coloured by status; in Analyst also by attainment, growth, share or revenue), top risks, top movers and the revenue trend (actual vs forecast vs prior year) with a table alternative. Every view is in the URL: links can be shared, Back and Forward work (mode included), a broken link is corrected in place; the app name returns to the clean view (phone: also ⚙︎ › Reset view). A source click in the assistant moves the whole dashboard and scrolls it to the top. The chosen view (map, tiles, table; chart or table) is remembered per browser.
- 4 locales (en-GB, en-US, de-DE, ru-RU), light and dark themes, an offline screen, error boundaries per widget.

Try it: run `pnpm dev`, click Europe › Germany in the path or Germany on the map, pick March 2026 to see the dip, then open the assistant and pick a suggested question, or ask "Why did Germany dip in March?", "What will sales be next year?" (can't answer) or "force error" (error and Retry).

## Start here (5 minutes)

1. **What we build:** `docs/STARTER_PACK.md` (starter pack) and `docs/CONTRACT.md` (data + streaming contract).
2. **Why it is built this way:** `docs/decisions/` (one short file per decision).
3. **How the code is organised:** [Project structure](#project-structure) below.
4. **How it looks:** `DESIGN.md` (tokens, type, spacing, components).
5. **Working with an AI agent:** `AGENTS.md`, `CLAUDE.md` + `.claude/rules/`.
6. **What changed:** `CHANGELOG.md`.

## Quick start

Requires Node 24 (`.nvmrc`) and pnpm 10.

```bash
pnpm install
cp .env.example .env.local   # optional; defaults work
pnpm dev                     # http://localhost:3000 → /dashboard
pnpm build && pnpm start     # production build; pages are static per locale
pnpm format                  # Prettier (code only)
pnpm format:check
pnpm lint                    # ESLint + Steiger (FSD boundaries)
pnpm typecheck
pnpm test                    # Vitest
```

## Project structure

Feature-Sliced Design v2.1. Layers import only downward. Slices that exist today are listed by name; the rest are planned.

```
app/                 Next.js routing only (page.tsx re-exports from src/pages)
pages/               empty on purpose (see pages/README.md)
src/
  app/               providers, global styles, design tokens
  pages/             page composition, no logic (dashboard)
  widgets/           screen blocks: app-shell, assistant-panel, dashboard-header, kpi-strip, market-status (tiles, table and map), top-risks, top-movers, revenue-trend; planned: radar, heat map, markets table
  features/          user actions: ask-question (chat stream, composer, history), drill-down, reset-view, select-period, switch-mode, switch-section, switch-locale, switch-theme, network-status; planned: alerts
  entities/          performance (dataset, dashboard URL state, KPI and status selectors, citations, status chip)
  shared/            ui (shadcn, error boundaries, toasts), lib (cn, dom, errors, events, media, storage), api (HTTP client, SSE, contracts, dataset), config (env, API routes, i18n)
data/                data.json, fixtures.json (source of truth)
docs/
  decisions/         architecture decision records
  specs/             what we build
  plans/             how we build it, step by step; backlog.md = deferred review findings
reference/           reference mock SSE route from the starter pack
```

## Git flow

`feature/X.Y.Z/NAME` (or `fix/X.Y.Z/NAME`) → `release/X.Y.Z` → `develop` → `master`. Work happens on `feature/X.Y.Z/NAME` branched from `release/X.Y.Z`, so the branch name says which release it belongs to; nobody commits to `release/*`, `develop` or `master` directly. Only `release/*` merges into `develop`, only `develop` into `master`. The version in `package.json`, the top of `CHANGELOG.md` and the release branch must match. CI runs on pull requests only: into `release/*` format, lint and types; into `develop` the same plus unit tests and the version check; into `master` the version check. Details: `docs/decisions/0007-git-flow-and-ci.md`.

## Working with AI agents

- `CLAUDE.md`: working agreement, architecture, code rules. Loaded every session.
- `.claude/rules/*.md`: scoped rules (FSD, UI, testing, CI) that load only when the agent touches matching files.
- `docs/decisions`, `docs/specs`, `docs/plans`: the context an agent (or a new developer) needs, kept in the repo and updated with the code.

---

*Sections required by the brief (architecture, productionising, approach and decisions, accessibility, testing, AI workflow, what I'd do differently) will be written by the author as the project progresses.*
