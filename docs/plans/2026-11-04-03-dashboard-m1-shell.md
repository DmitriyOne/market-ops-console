# Plan 3 · M1 — Dashboard shell and Executive view (0.5.0)

**Goal.** The dashboard stops being a placeholder. A user can move through
portfolio → region → market → product and through months, every move lives
in the URL (back/forward and shared links work), and Executive mode shows
the four KPI cards, market status, top risks and the revenue trend for
whatever is selected. Assistant source clicks now visibly move the dashboard.

**Status:** approved by the owner, 2026-11-04.

**Spec:** `docs/specs/2026-11-03-market-ops-console-design.md` §5, §6, §8,
§11, §11a. Decisions: ADR 0004, 0006, 0010, 0014 (checkpoint: variant A),
0015. Look: canvas boards "A · Desktop · Executive · light", "A · Phone ·
Overview and Assistant", "D + A · States".

**Plan series (owner, 2026-11-04):** one release per milestone.
**M1 shell + Executive (this, 0.5.0)** → M2 map (0.6.0) → M3 Analyst: full
time series, markets table with CSV export, top movers, metric picker
(0.7.0) → M4 heat map + radar + compare (0.8.0) → alerts → E2E, README.

## What the owner will see

Desktop, top to bottom (A Executive board):

1. **Header:** logo · breadcrumbs `Portfolio › Region ▾ › Market ▾ ›
   Product ▾` (each step opens a list of its children; the product step
   appears only once a market is chosen) · period button `May 2026 · 1 month`
   · `Executive | Analyst` switch · language · theme.
2. **Title:** the scope name (`Portfolio`, `Europe`, `Germany`,
   `Veltrix · Germany`) and a line `13 markets · 5 products · latest period
   May 2026`.
3. **Four KPI cards:** Revenue, Forecast attainment, Growth YoY, Markets at
   risk. Each with the value, one supporting line, a 12-month sparkline and a
   `Calculated` badge (tooltip with the formula) when the number is computed
   from series.
4. **Market status** (A tiles, not the map): markets grouped by region, each
   tile shows code, status glyph and attainment; off-track tiles are hatched;
   legend with counts; `Show as table`. Click a tile = drill into that market.
5. **Top risks:** non-on-track markets, off-track first then by attainment,
   with the reason (`92.0% · −9.7% YoY`) and a status chip. Click = drill in.
6. **Revenue trend:** actual vs forecast vs prior year over 24 months for
   the current scope, anomalies marked, the selected window shaded, `Table`
   toggle.

Phone: the same cards in one column, header with breadcrumbs and ⚙︎
(language and theme in a sheet), period button full width. Tab bar as
today (Alerts tab comes with the alerts milestone).

Analyst mode in M1 shows the same widgets; its own widgets arrive in M3.

## Decisions taken for M1

Owner (2026-11-04):
- Dashboard layout = variant A. Market status uses A tiles in M1; the
  choropleth map stays (brief requirement) and arrives in M2 as an A-style
  card. Whether tiles and map live side by side or behind a switch is asked
  before M2.
- Period picker = own `MonthPicker` in `shared/ui` built from `Popover` +
  `Button` (no `react-day-picker`): year switch, 12 months, months without
  data disabled; range `1 month / 3 months / 12 months` below it.
- Product step lives in the breadcrumbs.
- Backlog items assigned to Plan 3 are done here (Task 1 and Task 7).
- CSV export: M3, markets table, raw numbers, file `markets-<period>-<range>.csv`.

My calls (open to correction):
- **URL rules.** `market` always brings its `region`; a market outside the
  given region is corrected to its own region; a product without a market is
  dropped; unknown ids and periods fall back to defaults silently; drill and
  period moves push history, `mode` replaces it.
- **Status off the latest month** (past period or range 3m/12m): tiles show
  attainment only, Top risks and "Markets at risk" show "Status is
  available for the latest month only" with a link back to it (spec §5).
- **Sparklines** are plain SVG (`aria-hidden`; the card text carries the
  number). Only the trend uses Recharts (shadcn `chart`, ADR 0004).
- **New registry components:** shadcn `breadcrumb`, `chart`, `sheet`,
  `toggle-group`, `table` (lookup order step 2, no new component of ours
  except `MonthPicker`).
- Widgets: `dashboard-header`, `kpi-strip`, `market-status`, `top-risks`,
  `revenue-trend`; selectors stay in `entities/performance`; URL actions in
  `features/drill-down`, `features/select-period`, `features/switch-mode`.

## Out of scope for M1

Map, metric picker (`kpi`), radar, heat map, markets table, top movers,
compare, CSV, alerts and the 🔔 marks, tablet-specific layout.

## Global constraints

- Branch `feature/0.5.0/dashboard-shell` from `release/0.5.0` (both local,
  from `develop` at `938dd70`). Never push, merge or commit to `release/*`,
  `develop`, `master`. `package.json` and `CHANGELOG.md` → `0.5.0`.
- Skills loaded for every task and for the reviewer: `next-best-practices`,
  `vercel-react-best-practices`, `vercel-composition-patterns`,
  `react-query`, `feature-sliced-design`, `superpowers:test-driven-development`.
- Static pages stay static: URL state is read on the client inside
  `Suspense` with a skeleton of the real shape (ADR 0010). No `matchMedia`
  for first-paint layout (DESIGN.md §7).
- Strings in `en/de/ru.json`; numbers and months only through `formats.ts`;
  tokens only, no raw colours or arbitrary values; targets ≥ 44px on touch;
  no colour-only signals (glyph + word + colour, hatching for off-track).
- Every aggregate comes from a selector in `entities/performance/model`; no
  component computes a KPI. Status only through `statusFor` /
  `nonOnTrackMarkets`.
- Each widget sits in `WidgetBoundary` with its own name in the retry button.
- Lint rules are never relaxed. Before each commit: `pnpm format && pnpm
  lint && pnpm typecheck && pnpm test` green, plus `pnpm build` at the end.
  Conventional Commits with the Co-Authored-By line.

## Review focus (failure modes no task names directly)

1. **Hand-edited or stale URL** (`?market=de&region=apac`, `?product=x`,
   `?period=2019-01`, `?range=7m`, repeated keys) → a valid view, no crash,
   no 404, the corrected URL replaces the bad one without a history entry.
2. **Back/forward after a chain of moves** (drill → change month → switch
   mode → back) → each step restores exactly what was seen; mode is not a step.
3. **Status leaking into a past month** → no status glyph, chip or count
   anywhere off the latest 1-month view.
4. **Static HTML before hydration** → header, title and card skeletons are
   in the HTML at the right size; nothing jumps when the URL is read; the
   phone `?tab=assistant` link does not flash Overview.
5. **Locale switch with a deep link** (`?market=de&period=2026-03&markets=de&markets=es`)
   → same view in the new locale, repeated keys and `#hash` kept.

---

## Tasks

Each task: tests first (watch them fail), then code, then the full checks,
then one commit.

### Task 1 — Release setup and URL state

- `0.5.0` in `package.json` and `CHANGELOG.md`.
- Extend `dashboardSearchParams` with `mode` (`executive` | `analyst`,
  default `executive`); `period` validated against `meta.periods`.
- `normalizeDashboardState(ds, raw)` in `entities/performance/model`: the
  hierarchy and fallback rules above, pure, returns the clean state and
  whether the URL must be rewritten.
- `useDashboardState()` hook: reads the URL, normalises, rewrites a bad URL
  with `history: 'replace'`.
- Backlog: region → market hierarchy enforced; locale switch keeps repeated
  keys and `#hash` (`useSwitchLocale`).
- **Tests:** every case of review focus 1; locale switch keeps
  `markets=de&markets=es` and `#x`.

### Task 2 — Drill-down, period and mode actions

- `features/drill-down`: `useDrillDown()` → `toPortfolio`, `toRegion(id)`,
  `toMarket(id)` (sets its region), `toProduct(id)`; push history; clears
  `markets` highlight on a new drill.
- `features/select-period`: `MonthPicker` (new in `shared/ui`, Popover +
  Button grid, keyboard arrows inside the grid, months outside the data
  disabled, `aria-label` "Period: May 2026, 1 month. Change period") plus a
  range toggle group; push history.
- `features/switch-mode`: `Executive | Analyst` toggle group, replace history.
- **Tests:** each action writes the expected URL and history mode; the
  picker cannot select a month without data; keyboard moves and selects.

### Task 3 — Header and page frame

- `widgets/dashboard-header`: shadcn `breadcrumb`, each step a dropdown of
  its children (`aria-current` on the last), period button, mode switch,
  language, theme; phone: breadcrumbs + ⚙︎ that opens a `sheet` with
  language and theme, period button full width under the header.
- Page title block (scope name + counts + latest period) and the A grid in
  `pages/dashboard`; header skeleton in the static HTML.
- Backlog: 404 page gets `id="main"` and the skip link.
- **Tests:** choosing a crumb item drills (URL); product step only with a
  market; ⚙︎ sheet opens, closes with Esc, returns focus; title follows scope.

### Task 4 — KPI cards

- Selectors: `kpiCards(ds, state)` (values, supporting line, source) and
  `sparklineSeries(ds, scope, period)` (12 months ending at `period`).
- `widgets/kpi-strip`: four cards, `Calculated` badge with formula tooltip,
  SVG sparkline, "Markets at risk" = "6 of 13" or the latest-only notice.
- **Tests:** portfolio May 2026 shows $22.85M, 100.4%, +7.3%, 6 of 13;
  Germany May 2026 uses stored KPIs (no badge); March 2026 shows the notice
  instead of a count; product scope shows share/status as not available.

### Task 5 — Market status and Top risks

- Selector `marketTiles(ds, state)`: region groups, attainment, status or
  null, highlighted (from `markets`).
- `widgets/market-status`: A tiles (glyph + code + attainment, hatched
  off-track, ring on highlighted markets), legend with counts, `Show as
  table` (a real `<table>`), tile click = `toMarket`.
- `widgets/top-risks`: list from `nonOnTrackMarkets` with reason line and
  chip, click = `toMarket`, empty state "No markets at risk in this scope",
  latest-only notice off the latest month.
- **Tests:** 6 risks in the right order (DE, ES, then IT, GB, BR, FR by
  attainment); Europe scope shows 5; tile click → `?region=eu&market=de`;
  "Show on dashboard" from the assistant rings the listed tiles; past month
  → no glyphs, notice shown; table alternative has the same numbers.

### Task 6 — Revenue trend

- shadcn `chart` (Recharts 3): actual (solid), forecast (dashed), prior year
  (dotted) for the scope, 24 months; anomalies in scope as labelled points;
  the selected window shaded; legend with line patterns; accessible summary
  label; `Table` toggle with the same rows.
- Recharts loaded only for this widget (`next/dynamic`, skeleton of the same
  height) so the first paint does not wait for it.
- **Tests:** table alternative rows for portfolio and Germany; Germany
  March 2026 anomaly listed; scope change updates the series.

### Task 7 — States, phone, wiring and docs

- Skeletons for every widget in the static HTML; `WidgetBoundary` button
  says which widget failed ("Try again: KPI cards"); one page-level
  announcement instead of one alert per widget (backlog).
- Phone `?tab=assistant` set before first paint with the ADR 0015 pattern
  (backlog).
- Assistant source click and "Show on dashboard" verified end to end with
  the new widgets (backlog item "nothing reads it yet" closed).
- Docs in the same commit: spec §8 (A layout, tiles, month picker, CSV in
  M3), DESIGN.md inventory, CHANGELOG 0.5.0, README status, backlog cleaned.
- **Tests:** a throwing widget leaves the others working; source click
  moves KPI cards and title; skeleton present in server-rendered HTML.

## Done when

- All tasks committed on `feature/0.5.0/dashboard-shell`, checks and
  `pnpm build` green.
- Independent review by a fresh agent (most capable model, same skills),
  Critical/Important findings fixed with RED→GREEN tests, minor ones in
  `backlog.md`.
- I have clicked through it on the owner's dev server (`:3000`): desktop and
  phone width, light and dark, `en-GB` and `ru-RU`, keyboard only, back/forward.
- The owner gets a short list of what to check by hand.
