# Market Ops Console

A console for a commercial operations team: a **streaming AI assistant** that answers questions with citations and honest confidence, and an **analytical dashboard** (map, radar, time series, heat map) with drill-down from portfolio to product. Both read the same dataset.

Take-home assignment for the Frontend Engineer role at NewPage Solutions.

> Status: `0.15.0` in progress: Node pinned to 24.x and a share-link button. Deployed: https://df-market-ops-console.vercel.app. Done: foundation (0.2.0), design direction and tokens (0.3.0), assistant (0.4.0), dashboard shell (0.5.0), market map (0.6.0), Analyst markets table (0.7.0), heat map and radar (0.8.0), alerts (0.9.0), end-to-end tests (0.10.0), accessibility pass (0.11.0), polish (0.11.1), currency picker and logo (0.12.0), page metadata, favicon, preview image, `robots.txt` and designed 404 / 500 pages (0.13.0), a lint rule for dataset reads (0.13.1), error monitoring with Sentry (0.14.0). Next: E2E on Vercel previews. Full list: `CHANGELOG.md`.

## What works now

- **Assistant** in a right panel on desktop (collapsible, remembered without a flash) and an Assistant tab on phones.
- **Streamed answers** with Stop, Retry, confidence and the label "AI answer · may be incomplete". Answers without matching data say "I can't answer this from the data".
- **Sources**: one button per citation. Hover, focus or tap shows an evidence card with the real numbers and a 12-month trend; a click focuses the dashboard through the URL.
- **"What the data shows"** under each answer: the portfolio row, the cited rows and markets the answer did not mention, found by fixed rules (no AI). "Show on dashboard" selects them on the map and in the table.
- **Answer actions**: Copy, 👍 / 👎 with a reason (once per answer), New chat.
- **History** survives a reload of the same tab (`sessionStorage`) and ends with the tab.
- **Dashboard, Executive view**: drill-down path `Portfolio › Region › Market › Product`, a month picker with a 1 / 3 / 12-month window, KPI cards (revenue, forecast attainment, growth, markets at risk), market status as a world map, tiles by region or a table (map coloured by status; in Analyst also by attainment, growth, share or revenue), top risks, top movers and the revenue trend (actual vs forecast vs prior year) with a table alternative. Every view is in the URL: links can be shared (**Share link** next to the title copies it; a share icon on phones; the currency is in the URL and the language in the address prefix), Back and Forward work (mode included), a broken link is corrected in place; the app name returns to the clean view (phone: also ⚙︎ › Reset view). A source click in the assistant moves the whole dashboard and scrolls it to the top. The chosen view (map, tiles, table; chart or table) is remembered per browser.
- **Dashboard, Analyst view**: everything above plus the map metric picker, a markets table with every KPI (gap to forecast included) calculated from monthly data, so each row adds up and the total is their sum, a total row and sortable headers, a markets filter fed by the map (Shift+click) and the tiles, "Export" of the rows as shown (Excel with formats and filters, or CSV), units in the revenue trend, a comparison radar next to the map (the selected markets, else the open market and its neighbours, else the regions, against the portfolio average) and a heat map of markets × 24 months in the map's metric (Germany's March 2026 dip shows as growth), both with table alternatives. Selection and sort are in the URL too. The page title says which view is on ("Executive view" / "Analyst view").
- **Alerts**: threshold rules ("attainment below 95 %", for all markets, a region or chosen ones; warning or critical) in a form that checks what the server checks (it runs the server's rule schema for the threshold range of each metric; the name length, unique names, ten rules and "at least one market" use the same shared limits), with a live preview of the markets a rule flags now. The panel opens on what fires now (each flagged market with its figure and a way to open it). Saved optimistically and rolled back with a message and Retry when the save fails (a demo switch makes the next save fail). Flagged markets get a bell in the header count, Top risks, the markets table and the map's tooltip and table. A right sheet on desktop, a tab on phones, both `tab=alerts`. `/api/v1/alerts` is a demo store in a cookie, not a backend: it checks each rule's shape but does not cap the request size, the number of market ids or how often it is called. A production API over live data needs those limits and rate limiting (per user or IP, in middleware or the platform firewall, e.g. Vercel WAF).
- **Currency**: amounts in US dollars, euros or British pounds (header menu; phone: ⚙︎), in the URL (`?currency=EUR`), so a shared link opens in the same currency. The data is USD; the rates are the ECB's of 5 November 2026 (1 USD = 0.89095 EUR = 0.74299 GBP), **fixed in the code for this demo**: a real app would get them from the backend API. One rate for every month, so percentages never change. Every amount converts (KPIs, charts, tables, map steps, alerts, evidence cards, Excel); CSV stays raw USD, and the assistant's own text is shown as received (ADR 0017).
- 4 locales (en-GB, en-US, de-DE, ru-RU), light and dark themes (the logo inverts with them), an offline screen, error boundaries per widget. Every visible word comes from the dictionaries, separators and page titles included; lint checks it (ADR 0011).
- **Page metadata**: a title per page and a description in the page language, a favicon that follows the browser's light or dark scheme, and one link preview image per language. The console is closed to search engines: `robots.txt` disallows everything, pages carry `noindex`, so there is no sitemap. Previews resolve after the deploy (ADR 0018).
- **Error monitoring** (Sentry, ADR 0019): every error the app logs, the browser's uncaught ones and the server's, with the screen's language, mode, currency and tab; the chat answer and the Excel export are timed. Off without a DSN, and on your machine unless `NEXT_PUBLIC_SENTRY_LOCAL=true`. See [Error monitoring and personal data](#error-monitoring-and-personal-data).
- **404 and 500 pages** in the app's look, in every language and theme: the address not found, the error ID, Try again and Back to dashboard. When the whole app fails, the last-resort page still speaks the address's language.

Try it: run `pnpm dev`, switch the currency to EUR in the header (every amount converts, the percentages stay), open the bell in the header (Alerts): add a rule "Growth below 0%" and watch the preview, then tick "Fail the next save (demo)" and switch a rule off to see the rollback. Switch to Analyst and Shift+click Germany and Spain on the map to narrow the markets table, look at the heat map for Germany's March 2026 dip and press Enter on it, click Europe › Germany in the path or Germany on the map, then open the assistant and pick a suggested question, or ask "Why did Germany dip in March?", "What will sales be next year?" (can't answer) or "force error" (error and Retry).

## Start here (5 minutes)

1. **What we build:** `docs/STARTER_PACK.md` (starter pack) and `docs/CONTRACT.md` (data + streaming contract).
2. **Why it is built this way:** `docs/decisions/` (one short file per decision).
3. **How the code is organised:** [Project structure](#project-structure) below.
4. **How it looks:** `DESIGN.md` (tokens, type, spacing, components).
5. **Working with an AI agent:** `AGENTS.md`, `CLAUDE.md` + `.claude/rules/`.
6. **What changed:** `CHANGELOG.md`.

## Quick start

Requires Node 24 (`.nvmrc`, `engines`: `24.x`) and pnpm 10.

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

## Error monitoring and personal data

Sentry gets errors and 10 % of traces (ADR 0019). It is **off unless `NEXT_PUBLIC_SENTRY_DSN` is set**. Unit tests run without it; E2E runs it on with a DSN on a local port nothing listens on, catches every event in the browser and checks what would be sent (`e2e/sentry.spec.ts`), so nothing leaves the machine.

- **One place decides what is sent:** `logError`, `logWarning`, `logEvent` and the monitoring helpers in `src/shared/lib`; lint stops a direct Sentry import. Answers the user caused (a name already taken, a 4xx) stay a breadcrumb; offline and timeouts are warnings; faults are errors. Data lost without an exception (an unreadable alerts cookie, a stored chat that no longer fits its schema, a full storage) and an answer citing what the dataset lacks are warnings.
- **What Sentry gets:** the error and its stack, the page URL with its query (the dashboard state), the release, the environment, tags for language, mode, currency and tab, the browser's language and time zone, breadcrumbs (clicks, navigations, `fetch` calls without bodies, console lines, product events), a release-health session per page view, and **Sentry Logs: every `console.log`, `console.warn` and `console.error` line**, ours and libraries' (so nothing personal is ever printed to the console); from the server, the request's method, URL and query only. **What it does not get:** the IP address, a user id, cookies, request headers (so no browser or OS breakdown), request or response bodies, the question text. Events go through our own path (`/monitoring`, rewritten to `app/sentry-tunnel/route.ts`), which forwards only the event body (Sentry's own handler would add the visitor's IP and user agent; the route leaves them out, and a test checks it), so Sentry never sees the visitor's IP, and the browser never calls sentry.io (a neutral path, which ad blockers are less likely to drop). For production, also turn on "Prevent Storing of IP Addresses" in the Sentry project.
- **Stored on the device:** the `NEXT_LOCALE` cookie (language), the `mo-alerts` cookie (the demo alert rules), `localStorage` (theme, map or tiles, chart or table per widget, the collapsed assistant) and `sessionStorage` (the chat, until the tab closes). Sentry sets no cookie (no Session Replay).
- **Test page:** `/sentry-test` fires each kind of error (client, render, handled, unhandled promise, warning, API 500, server render, a trace). It exists only where `ENABLE_SENTRY_TEST_PAGE=true` is set, which is only `.env.local`; everywhere else it and its API are a 404. To try it: put `NEXT_PUBLIC_SENTRY_DSN` and `ENABLE_SENTRY_TEST_PAGE=true` in `.env.local`, `pnpm build && pnpm start`, open `/sentry-test`.

**If this went to production for UK or EU users,** these would be required, not optional (UK GDPR and PECR, EU GDPR and the ePrivacy Directive):

1. **A cookie / consent banner** that says what is stored on the device and why, with anything not strictly necessary off until the user agrees. Launching without it breaks the law.
2. **A privacy notice** naming Sentry, the purpose (finding and fixing faults), the lawful basis (legitimate interests, with the balancing test written down) and how long events are kept.
3. **Sentry's Data Processing Agreement** in place.
4. **An EU data region.** This demo uses a Sentry organisation in the US (data in Iowa), a transfer to a third country; production would use an organisation in the EU region (Frankfurt) or the transfer safeguards (standard contractual clauses, the UK addendum, the EU-US Data Privacy Framework).

This is a summary, not legal advice; a real launch gets a data protection officer's or lawyer's review.

## Testing

- **Unit and component** (Vitest + Testing Library + MSW, next to the code): parsing the stream, schemas, selectors, formatters; streaming, stop, abstain / low confidence / error, citations, drill-down into the URL, alert validation and optimistic rollback, the charts' table alternatives.
- **End-to-end** (Playwright, `e2e/`): the brief's happy path, Back and Forward in a real browser, the phone tab bar, the alert form's optimistic save and rollback on the real API, the assistant's error, "can't answer" and Stop states, a shared link opening the same view and Share link putting it on the clipboard, Excel/CSV downloads, offline and a failing API, the map and the alerts panel with a keyboard, axe accessibility scans (WCAG 2.1 A/AA) on desktop and a phone emulation, and what the real Sentry SDK would send (Sentry runs on with a DSN that points nowhere; the browser's events are caught and checked for tags and for no personal data). They run locally (`pnpm e2e`) and on every PR into `develop`; `BASE_URL=https://… pnpm e2e` tests a deployed copy (an unprotected one; protected Vercel previews come with the deploy). `E2E_REUSE=1` reuses a server already on :3100 instead of building.
- **Skipped on purpose:** visual regression, a cross-browser matrix, Storybook (ADR 0008).

## Project structure

Feature-Sliced Design v2.1. Layers import only downward. Slices that exist today are listed by name; the rest are planned.

```
app/                 Next.js routing only (page.tsx re-exports from src/pages); sentry-tunnel (Sentry's body-only tunnel, served at /monitoring)
pages/               empty on purpose (see pages/README.md)
src/
  app/               providers, global styles, design tokens
  pages/             page composition, no logic (dashboard, not-found, route-error, sentry-test)
  widgets/           screen blocks: app-shell, assistant-panel, dashboard-header, alerts-panel (what fires now + the rules), kpi-strip, market-status (tiles, table and map), markets-table, heat-map, comparison-radar, top-risks, top-movers, revenue-trend
  features/          user actions: ask-question (chat stream, composer, history), drill-down, reset-view, select-period, select-metric, select-markets, export-markets, switch-mode, switch-section, switch-locale, switch-currency, switch-theme, network-status, configure-alerts (rule form, list, optimistic saves)
  entities/          alert-rule (rules query and requests, which markets a rule flags, the bell), performance (dataset, dashboard URL state, KPI and status selectors, map scales and the map selector, the markets table, heat map and radar selectors, citations, status chip)
  shared/            ui (shadcn, error boundaries, toasts, status screen), lib (cn, csv, dom, errors, events, i18n, media, monitoring, storage), api (HTTP client, SSE, contracts, dataset, alert rule schema and mock store), config (env, API routes, i18n, Sentry options)
instrumentation*.ts, sentry.*.config.ts   Sentry start-up per runtime (ADR 0019)
data/                data.json, fixtures.json (source of truth)
docs/
  decisions/         architecture decision records
  specs/             what we build
  plans/             how we build it, step by step; backlog.md = deferred review findings
reference/           reference mock SSE route from the starter pack
scripts/             version check (CI), icon rendering (render-icons.sh)
```

## Git flow

`feature/X.Y.Z/NAME` (or `fix/X.Y.Z/NAME`) → `release/X.Y.Z` → `develop` → `master`. Work happens on `feature/X.Y.Z/NAME` branched from `release/X.Y.Z`, so the branch name says which release it belongs to; nobody commits to `release/*`, `develop` or `master` directly. Only `release/*` merges into `develop`, only `develop` into `master`. The version in `package.json`, the top of `CHANGELOG.md` and the release branch must match. CI runs on pull requests only, each check its own job (and its own line in the PR): into `release/*` format, lint and types; into `develop` the branch and version check first, then the same plus unit tests and the E2E suite in parallel; into `master` the version check. Details: `docs/decisions/0007-git-flow-and-ci.md`.

## Working with AI agents

- `CLAUDE.md`: working agreement, architecture, code rules. Loaded every session.
- `.claude/rules/*.md`: scoped rules (FSD, UI, testing, CI) that load only when the agent touches matching files.
- `docs/decisions`, `docs/specs`, `docs/plans`: the context an agent (or a new developer) needs, kept in the repo and updated with the code.

---

*Sections required by the brief (architecture, productionising, approach and decisions, accessibility, testing, AI workflow, what I'd do differently) will be written by the author as the project progresses.*
