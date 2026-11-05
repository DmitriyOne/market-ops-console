# Market Ops Console

A console for a commercial operations team: a **streaming AI assistant** that answers questions with citations and honest confidence, and an **analytical dashboard** (map, radar, time series, heat map) with drill-down from portfolio to product. Both read the same dataset.

Take-home assignment for the Frontend Engineer role at NewPage Solutions.

> Status: `0.12.0` currency picker and logo (amounts in USD, EUR or GBP at fixed ECB rates; the M logo in both themes), built, waiting for the owner's check. Done: foundation (0.2.0), design direction and tokens (0.3.0), assistant (0.4.0), dashboard shell (0.5.0), market map (0.6.0), Analyst markets table (0.7.0), heat map and radar (0.8.0), alerts (0.9.0), end-to-end tests (0.10.0), accessibility pass (0.11.0), polish (0.11.1). Next: deploy, favicon and preview (0.13.0). Full list: `CHANGELOG.md`.

## What works now

- **Assistant** in a right panel on desktop (collapsible, remembered without a flash) and an Assistant tab on phones.
- **Streamed answers** with Stop, Retry, confidence and the label "AI answer · may be incomplete". Answers without matching data say "I can't answer this from the data".
- **Sources**: one button per citation. Hover, focus or tap shows an evidence card with the real numbers and a 12-month trend; a click focuses the dashboard through the URL.
- **"What the data shows"** under each answer: the portfolio row, the cited rows and markets the answer did not mention, found by fixed rules (no AI). "Show on dashboard" selects them on the map and in the table.
- **Answer actions**: Copy, 👍 / 👎 with a reason (once per answer), New chat.
- **History** survives a reload of the same tab (`sessionStorage`) and ends with the tab.
- **Dashboard, Executive view**: drill-down path `Portfolio › Region › Market › Product`, a month picker with a 1 / 3 / 12-month window, KPI cards (revenue, forecast attainment, growth, markets at risk), market status as a world map, tiles by region or a table (map coloured by status; in Analyst also by attainment, growth, share or revenue), top risks, top movers and the revenue trend (actual vs forecast vs prior year) with a table alternative. Every view is in the URL: links can be shared, Back and Forward work (mode included), a broken link is corrected in place; the app name returns to the clean view (phone: also ⚙︎ › Reset view). A source click in the assistant moves the whole dashboard and scrolls it to the top. The chosen view (map, tiles, table; chart or table) is remembered per browser.
- **Dashboard, Analyst view**: everything above plus the map metric picker, a markets table with every KPI (gap to forecast included) calculated from monthly data, so each row adds up and the total is their sum, a total row and sortable headers, a markets filter fed by the map (Shift+click) and the tiles, "Export" of the rows as shown (Excel with formats and filters, or CSV), units in the revenue trend, a comparison radar next to the map (the selected markets, else the open market and its neighbours, else the regions, against the portfolio average) and a heat map of markets × 24 months in the map's metric (Germany's March 2026 dip shows as growth), both with table alternatives. Selection and sort are in the URL too. The page title says which view is on ("Executive view" / "Analyst view").
- **Alerts**: threshold rules ("attainment below 95 %", for all markets, a region or chosen ones; warning or critical) in a form that checks what the server checks (it runs the server's rule schema for the threshold range of each metric; the name length, unique names, ten rules and "at least one market" use the same shared limits), with a live preview of the markets a rule flags now. The panel opens on what fires now (each flagged market with its figure and a way to open it). Saved optimistically and rolled back with a message and Retry when the save fails (a demo switch makes the next save fail). Flagged markets get a bell in the header count, Top risks, the markets table and the map's tooltip and table. A right sheet on desktop, a tab on phones, both `tab=alerts`. `/api/v1/alerts` is a demo store in a cookie, not a backend: it checks each rule's shape but does not cap the request size, the number of market ids or how often it is called. A production API over live data needs those limits and rate limiting (per user or IP, in middleware or the platform firewall, e.g. Vercel WAF).
- **Currency**: amounts in US dollars, euros or British pounds (header menu; phone: ⚙︎), remembered in this browser. The data is USD; the rates are the ECB's of 5 November 2026 (1 USD = 0.89095 EUR = 0.74299 GBP), **fixed in the code for this demo**: a real app would get them from the backend API. One rate for every month, so percentages never change. Every amount converts (KPIs, charts, tables, map steps, alerts, evidence cards, Excel); CSV stays raw USD, and the assistant's own text is shown as received (ADR 0017).
- 4 locales (en-GB, en-US, de-DE, ru-RU), light and dark themes (the logo inverts with them), an offline screen, error boundaries per widget.

Try it: run `pnpm dev`, switch the currency to EUR in the header (every amount converts, the percentages stay), open the bell in the header (Alerts): add a rule "Growth below 0%" and watch the preview, then tick "Fail the next save (demo)" and switch a rule off to see the rollback. Switch to Analyst and Shift+click Germany and Spain on the map to narrow the markets table, look at the heat map for Germany's March 2026 dip and press Enter on it, click Europe › Germany in the path or Germany on the map, then open the assistant and pick a suggested question, or ask "Why did Germany dip in March?", "What will sales be next year?" (can't answer) or "force error" (error and Retry).

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
pnpm exec playwright install chromium   # once, for the E2E tests
pnpm e2e                     # Playwright: builds, starts on :3100 (dev on :3000 can keep running)
pnpm e2e:ui                  # the same in Playwright's UI mode
pnpm e2e --project=phone     # one project (desktop | phone); --headed shows the browser
```

## Testing

- **Unit and component** (Vitest + Testing Library + MSW, next to the code): parsing the stream, schemas, selectors, formatters; streaming, stop, abstain / low confidence / error, citations, drill-down into the URL, alert validation and optimistic rollback, the charts' table alternatives.
- **End-to-end** (Playwright, `e2e/`): the brief's happy path, Back and Forward in a real browser, the phone tab bar, the alert form's optimistic save and rollback on the real API, the assistant's error, "can't answer" and Stop states, a shared link opening the same view, Excel/CSV downloads, offline and a failing API, the map and the alerts panel with a keyboard, and axe accessibility scans (WCAG 2.1 A/AA) on desktop and a phone emulation. They run locally (`pnpm e2e`) and on every PR into `develop`; `BASE_URL=https://… pnpm e2e` tests a deployed copy (an unprotected one; protected Vercel previews come with the deploy). `E2E_REUSE=1` reuses a server already on :3100 instead of building.
- **Skipped on purpose:** visual regression, a cross-browser matrix, Storybook (ADR 0008).

## Project structure

Feature-Sliced Design v2.1. Layers import only downward. Slices that exist today are listed by name; the rest are planned.

```
app/                 Next.js routing only (page.tsx re-exports from src/pages)
pages/               empty on purpose (see pages/README.md)
src/
  app/               providers, global styles, design tokens
  pages/             page composition, no logic (dashboard)
  widgets/           screen blocks: app-shell, assistant-panel, dashboard-header, alerts-panel (what fires now + the rules), kpi-strip, market-status (tiles, table and map), markets-table, heat-map, comparison-radar, top-risks, top-movers, revenue-trend
  features/          user actions: ask-question (chat stream, composer, history), drill-down, reset-view, select-period, select-metric, select-markets, export-markets, switch-mode, switch-section, switch-locale, switch-currency, switch-theme, network-status, configure-alerts (rule form, list, optimistic saves)
  entities/          alert-rule (rules query and requests, which markets a rule flags, the bell), performance (dataset, dashboard URL state, KPI and status selectors, map scales and the map selector, the markets table, heat map and radar selectors, citations, status chip)
  shared/            ui (shadcn, error boundaries, toasts), lib (cn, csv, dom, errors, events, media, storage), api (HTTP client, SSE, contracts, dataset, alert rule schema and mock store), config (env, API routes, i18n)
data/                data.json, fixtures.json (source of truth)
docs/
  decisions/         architecture decision records
  specs/             what we build
  plans/             how we build it, step by step; backlog.md = deferred review findings
reference/           reference mock SSE route from the starter pack
```

## Git flow

`feature/X.Y.Z/NAME` (or `fix/X.Y.Z/NAME`) → `release/X.Y.Z` → `develop` → `master`. Work happens on `feature/X.Y.Z/NAME` branched from `release/X.Y.Z`, so the branch name says which release it belongs to; nobody commits to `release/*`, `develop` or `master` directly. Only `release/*` merges into `develop`, only `develop` into `master`. The version in `package.json`, the top of `CHANGELOG.md` and the release branch must match. CI runs on pull requests only, each check its own job (and its own line in the PR): into `release/*` format, lint and types; into `develop` the branch and version check first, then the same plus unit tests and the E2E suite in parallel; into `master` the version check. Details: `docs/decisions/0007-git-flow-and-ci.md`.

## Working with AI agents

- `CLAUDE.md`: working agreement, architecture, code rules. Loaded every session.
- `.claude/rules/*.md`: scoped rules (FSD, UI, testing, CI) that load only when the agent touches matching files.
- `docs/decisions`, `docs/specs`, `docs/plans`: the context an agent (or a new developer) needs, kept in the repo and updated with the code.

---

*Sections required by the brief (architecture, productionising, approach and decisions, accessibility, testing, AI workflow, what I'd do differently) will be written by the author as the project progresses.*
