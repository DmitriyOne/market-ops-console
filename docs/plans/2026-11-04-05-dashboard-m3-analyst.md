# Plan 5 · M3 — Analyst: markets table, selection, CSV (0.7.0)

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans (owner's usual flow: build → owner check → review → owner check). Steps use `- [ ]`.

**Status:** built on `feature/0.7.0/analyst-table` (2026-11-04); three owner checks and an independent branch review done (see Owner decisions); waiting for the owner's last look and push.

**Goal.** Analyst mode gets the brief's "dense tables": a markets table with
every KPI, sort, a markets filter fed by the map ("brush … and the table
narrows"), totals, a gap-to-forecast column and a CSV export of exactly
what is shown. The time series shows units in Analyst.

**Architecture.** One pure selector in `entities/performance` builds the
rows, totals and order from the URL state. `markets` becomes one
"selected markets" list for the assistant, the map, the tiles and the
filter. A new `sort` param keeps the order in shared links. New slices:
`features/select-markets`, `features/export-markets`,
`widgets/markets-table`.

**Tech stack.** Existing only: nuqs, next-intl, shadcn `Table` /
`DropdownMenu` / `Button`, Vitest + RTL + MSW. **No new dependencies**
(13 rows: no TanStack Table, no CSV library). Superseded at the owner
check: ExcelJS for the Excel export (spec §13, ADR 0002).

**Spec:** `docs/specs/2026-11-03-market-ops-console-design.md` §5, §6, §8
(Markets table, Coordinated views), §11, §14. ADR 0006, 0008, 0014.

## Owner decisions (2026-11-04)

1. **Selection = filter + map.** Above the table: a `Markets ▾` menu with
   a checkbox per market of the scope (grouped by region) and chips of the
   chosen markets with ×, plus `Clear`. On the map and the tiles,
   Shift+click and Shift+Enter add or remove a market. On touch, the map
   tooltip gets a second button next to `Open`: `Add to filter` /
   `Remove from filter`. No long-press.
2. **One selection.** `markets` always means "selected markets". The
   assistant's "Show on dashboard", the map, the tiles and the filter
   change the same list. The label "highlighted from the assistant"
   becomes "selected". A drill still clears it (as today).
3. **Sort in the URL:** `sort=growth` / `sort=-growth`, replace history.
4. **Extras:** a totals row and a "Gap to forecast" column (actual −
   forecast, $).

## My calls (open to correction)

- **Selection works in Analyst only** (Shift+click, the touch button and
  the filter). Executive shows a selection that came from the assistant
  as rings, as today. Reason: Executive has no table and no way to clear a
  hand-made selection.
- **The table follows the scope** like the tiles: portfolio = 13 markets,
  region = its markets, market = its region with that row marked
  (`aria-current`), product = that product in each market.
- **The filter intersects with the scope.** Selected markets outside the
  scope are kept in the URL but not shown. If nothing is left, the table
  shows an empty state; the way back is `Clear all` in the filter menu.
- **Default order** = the map's Tab order (region in data order, then
  name); no `sort` in the URL. Header click: first click descending for
  numbers, ascending for text; second click flips. Missing values always
  go last. Status orders off track → at risk → on track.
- **Columns:** Market (sticky on small screens), Region, Revenue, Gap to
  forecast, Attainment, Growth, Share, Units, Status. Share or status that
  the data does not have shows "—" with the existing "latest only" / "not
  per product" wording (§5). Values computed from series carry the
  "Calculated" mark in the header tooltip, as on the KPI cards.
- **Gap to forecast** = Σ actual − Σ forecast from series for the window.
  It is always calculated. Negative values carry a minus sign and the
  status colour is not reused (text stays in text tokens).
- **Totals row** over the rows shown: revenue, gap and units summed;
  attainment and growth = Σ/Σ from series; share = revenue-weighted (latest
  month, no product), else "—". Marked "Calculated". Not in the CSV.
- **CSV (decides the backlog item):** raw USD. Header in English
  snake_case: `market_id,market,region,revenue_usd,gap_to_forecast_usd,attainment_pct,growth_pct,share_pct,units,status`.
  Numbers unformatted (pct to 2 decimals, money to whole dollars), missing
  = empty cell, status as in data (`off_track`). UTF-8 with BOM (Excel),
  CRLF, quotes escaped, a leading `= + - @` in text gets a `'` (formula
  injection). File `markets-<period>-<range>[-<product>].csv`. Rows in
  the shown order; no totals row.
- **Layout (Analyst):** KPI strip → map row → **markets table, full
  width** → trend row. The table sits next to the map, so a Shift+click
  visibly narrows it. Phone: the table scrolls sideways inside the card.
- **Market status "Table" view stays**: it is the map's accessible
  alternative and Executive's only table.
- **Hint under the map in Analyst:** "Shift+click adds a market to the
  table filter" (touch: "Tap a market, then Add to filter").
- **History:** selection changes push (spec §6); sort replaces.
- **Map flight (found while building):** a pick on the map keeps the map still (it would fly away from the pointer); a selection from the assistant or the table filter still flies the map to it.
- **Owner check (2026-11-04):** CSV opened as one column in Excel with Russian regional settings and has no filters → `Export ▾` with Excel (.xlsx, ExcelJS, lazy) and CSV; filter row = button, "N of M selected", Clear, chips below; a selection bar on the Market status card in both modes.
- **Owner check 2 (2026-11-04):** table gets forecast, prior year, country code and the anomaly from the data; Excel gets an Excel table, colours, a total that follows the filter, a months sheet and an About sheet; the filter menu gets "At risk or off track", region lines and "Clear all" (out of the row). ExcelJS drops custom table totals formulas, so the total is a hand-written row under the table. Radar = selection decided for M4.
- **Empty state** uses the filter menu's own `Clear all` above it (two buttons with one name would confuse a screen reader).
- **Branch review + owner check 3 (2026-11-04):** popups in the dashboard stay within its scroll area (a menu slid over the header on scroll; `PopperBoundary`); every export failure is logged and shown, "Preparing…" while the workbook is made; an empty workbook keeps a data row and ratio totals are blank instead of `#DIV/0!`; CSV guard covers tab and CR; repeated markets in the URL are dropped; focus stays in the chips on removal. **Table rows: every figure from series** (a row adds up; share and status stored; tiles keep stored KPIs). **Analyst-shaped skeletons** before paint (`data-mode`, ADR 0015) so the table and the map card's controls do not jump in. Deferred findings in the backlog.
- **Plan numbering:** this file is Plan 5. The backlog's "Plan 5"
  (hardening, a11y pass) is renamed **"Hardening plan"** in Task 6.

## Global constraints

- Branch `feature/0.7.0/analyst-table` from local `release/0.7.0`, which
  is made from `develop` **after PR #20 (release/0.6.0 → develop) is
  merged**. Never push, merge or commit to `release/*`, `develop`,
  `master`. `package.json` → `0.7.0`, CHANGELOG `0.7.0`.
- Skills: `next-best-practices`, `vercel-react-best-practices`,
  `vercel-composition-patterns`, `accessibility`, TDD.
- No string literals in UI; numbers only via next-intl formats
  (`useKpiFormat`); tokens only; no `as` casts; FSD imports down only;
  lint rules never relaxed.
- Before each commit: `pnpm format && pnpm lint && pnpm typecheck && pnpm test`.
- Do not commit the owner's `next.config.ts` change.
- Browser checks on the owner's dev server (port 3000), Playwright files
  in `.playwright-mcp/` only.

## Review focus

1. **Selection outside the scope** (select DE, ES, then drill into APAC
   through the URL or Back): the table shows the empty state with
   `Clear`, never a silently empty body. → test in Task 3.
2. **Sort on a column with missing values** (share off the latest month,
   status on a 3-month window): rows with "—" go last in both directions,
   the order is stable. → test in Task 1.
3. **Broken `sort` in a link** (`sort=foo`, `sort=--growth`): falls back
   to the default and the URL is corrected in place. A sort on a column
   the view has no values for (status on 3 months) is kept: rows stay in
   the default order and the sort comes back with the latest month. →
   test in Task 1.
4. **CSV opened in German Excel**: numbers must not be formatted with a
   locale (no `1.234,5`), umlauts survive (BOM), a market name with a
   comma or a quote stays one cell. → test in Task 4.
5. **Shift+click on a market of another region during a region drill**:
   the market is out of the scope, so it drills as a normal click (no
   invisible selection). → test in Task 2.

---

> The tasks below are kept as first built. Later changes are listed under
> *Owner decisions*: `ExportMarketsButton` became the `Export ▾` menu
> (`ExportMenu`, Excel + CSV), the empty state's way back is `Clear all`
> in the filter menu, and row figures come from series, not `computeKpis`.

### Task 1: `marketsTable` selector and the `sort` param

**Files:**
- Create: `src/entities/performance/model/markets-table.ts`, `markets-table.test.ts`
- Modify: `model/search-params.ts` (`sort: parseAsString`), `model/dashboard-state.ts` (+ test), `model/market-status.ts`, `model/market-map.ts` (rename `highlighted` → `selected` input; the map's own drill flag `selected` becomes `current`), `index.ts`

**Interfaces (produces):**
```ts
export const TABLE_COLUMNS = ['market','region','revenue','gap','attainment','growth','share','units','status'] as const;
export type TableColumn = (typeof TABLE_COLUMNS)[number];
export type TableSort = { column: TableColumn; dir: 'asc' | 'desc' } | null; // null = default order
export type TableRow = { id: string; name: string; regionId: string; regionName: string;
  revenue: KpiValue; gap: KpiValue; attainmentPct: KpiValue; growthPct: KpiValue;
  sharePct: KpiValue; units: KpiValue; status: MarketStatus | null; current: boolean };
export type MarketsTableView = { rows: TableRow[]; totals: Omit<TableRow,'id'|'name'|'regionId'|'regionName'|'status'|'current'>;
  inScope: number; /** rows before the selection filter */ filtered: boolean };
export function marketsTable(ds: Dataset, scope: Scope, period: Period, range: Range,
  selected: readonly string[], sort: TableSort): MarketsTableView;
export function parseSort(raw: string): TableSort | undefined; // undefined = invalid
export function sortParam(sort: TableSort): string | null;     // inverse, null = default
```
`DashboardState` gains `sort: TableSort` and renames `highlighted` → `selected`; `RawDashboardParams` gains `sort`.

- [x] **Step 1: failing tests** in `markets-table.test.ts`:
  - portfolio, latest 1m → 13 rows in map Tab order; DE row revenue/growth/attainment/share `source: 'data'`, gap `source: 'calculated'`, `status: 'off_track'`.
  - region `eu` → 5 rows; market `de` → 5 rows, only DE `current`.
  - product `veltrix` under `de` → 5 EU rows, share `unavailable` for all, units = that product's units.
  - `range: '3m'` → every `status` null, share `unavailable`.
  - selected `['de','es']` → 2 rows, `filtered: true`, `inScope: 13`; selected `['jp']` under region `eu` → 0 rows, `inScope: 5`.
  - sort `{column:'growth',dir:'asc'}` → first row DE; `desc` → CN first.
  - sort share on `3m` → order equals default order (all missing, stable); sort status asc → off_track rows first, then at_risk.
  - totals for portfolio latest: revenue = Σ rows, attainment = Σactual/Σforecast from series (within 0.05 of spec's 100.4).
  - `parseSort('-growth')` → desc growth; `'growth'` → asc; `'foo'`, `'--growth'`, `''` → `undefined`; `sortParam(null)` → `null`.
- [x] **Step 2:** `pnpm vitest run src/entities/performance/model/markets-table.test.ts` → FAIL (module missing).
- [x] **Step 3:** implement. Per-market KPIs through `computeKpis(ds, {regionId, marketId, productId?}, period, range)`; gap and totals from `rowsInScope` + `sumRows` over the shown market ids; default order reuses the map's ordering (extract it from `market-map.ts` into a shared helper rather than copying). Comparator: missing last regardless of `dir`, ties keep default order.
- [x] **Step 4:** `dashboard-state.test.ts`: invalid `sort` → `fix.sort = null`; valid kept; `markets` → `state.selected`. Update every caller of `highlighted` (map, tiles, `MarketStatus`) — behaviour unchanged.
- [x] **Step 5:** all tests green; commit `feat(table): marketsTable selector, sort param, one selection list`.

### Task 2: `features/select-markets` — filter, map and tiles

**Files:**
- Create: `src/features/select-markets/{index.ts, model/use-market-selection.ts(+test), ui/MarketFilter.tsx(+test)}`
- Modify: `widgets/market-status/ui/{MarketStatus.tsx, MarketMap.tsx, MapTooltip.tsx, StatusTile.tsx}` (+ `MarketStatus.test.tsx`), i18n en/de/ru

**Interfaces (produces):**
```ts
export function useMarketSelection(): { selected: readonly string[]; toggle(id: string): void;
  set(ids: readonly string[]): void; clear(): void }; // push history; ids in the order chosen
export function MarketFilter(): JSX.Element; // menu + chips + Clear; scope markets only
```
Map/tiles get an optional `onToggle?: (id: string) => void`; present only in Analyst. A click with `shiftKey` (or Shift+Enter) on an **in-scope** market calls `onToggle`; otherwise `onOpen` as today. Touch tooltip shows the second button when `onToggle` is set.

- [x] **Step 1: failing tests**
  - hook: `toggle('de')` twice → `markets` gone; `set(['de','es'])` → `?markets=de&markets=es`; pushes history (nuqs test adapter `onUrlUpdate` options).
  - `MarketFilter`: menu lists scope markets as checkbox items grouped by region; checking two keeps the menu open and shows two chips; chip × removes one; `Clear` removes all and returns focus to the menu button.
  - `MarketStatus` (Analyst, map view): Shift+click on DE → URL `markets=de`, no drill; plain click drills; Shift+Enter on focused ES toggles; under region `eu`, Shift+click on JP drills (Review focus 5); touch tooltip shows `Add to filter`, after it `Remove from filter`; Executive: no hint, Shift+click drills.
  - tiles: Shift+click toggles in Analyst; selected tile accessible name contains "selected".
- [x] **Step 2:** run → FAIL.
- [x] **Step 3:** implement; i18n keys `marketFilter.{button,clear,remove,empty,count}`, `marketStatus.{addToFilter,removeFromFilter,hintPointer,hintTouch}`, rename `marketStatus.highlighted` → `selected` text ("selected" / "ausgewählt" / "выбран").
- [x] **Step 4:** tests green; commit `feat(select-markets): one selection from filter, map and tiles`.

### Task 3: `widgets/markets-table`

**Files:**
- Create: `src/widgets/markets-table/{index.ts, ui/MarketsTable.tsx, ui/MarketsTable.test.tsx, ui/SortHeader.tsx}`
- Modify: `src/pages/dashboard/ui/Overview.tsx` (+ test), i18n en/de/ru (`marketsTable.*`)

**Interfaces:** consumes `marketsTable`, `parseSort`/`sortParam`, `useMarketSelection`, `MarketFilter`, `ExportMarketsButton` (Task 4 — leave a slot, wired in Task 4), `useKpiFormat`, `StatusChip`, `useDrillDown`. Produces `MarketsTable`, `MarketsTableSkeleton`.

- [x] **Step 1: failing tests**
  - Analyst: card "Markets" with 13 body rows + a totals row; Executive: card absent (`Overview.test.tsx`).
  - header button "Growth" → URL `sort=-growth`, header `aria-sort="descending"`, first row China; again → `sort=growth`, Germany first; history replaced.
  - `markets=de&markets=es` → 2 rows, filter chips visible, totals = those two.
  - Review focus 1: `region=apac&markets=de` → empty state text + `Clear selection` → URL `markets` gone, 4 APAC rows.
  - `range=3m` → status cells "—" and the "latest only" note once under the table.
  - market name is a button that drills (`toMarket`), current market row `aria-current="true"`.
  - caption (`sr-only`) names scope, period and window; numbers rendered through `useKpiFormat` (check one `en-GB` value).
- [x] **Step 2:** run → FAIL.
- [x] **Step 3:** implement. Sort headers are `<button>` inside `<th>` with `aria-sort` on the `th`; first column `sticky left-0 bg-card`; card body `overflow-x-auto`; totals in `<tfoot>`; skeleton in the card's real shape. Overview: Analyst inserts the table after the map row inside its own `Slot`.
- [x] **Step 4:** tests green; commit `feat(markets-table): Analyst markets table with sort, filter and totals`.

### Task 4: CSV export

**Files:**
- Create: `src/shared/lib/csv/{to-csv.ts, to-csv.test.ts, download.ts, index.ts}`, `src/features/export-markets/{index.ts, model/markets-csv.ts(+test), ui/ExportMarketsButton.tsx(+test)}`
- Modify: `src/shared/lib/index.ts`, `MarketsTable.tsx`, i18n

**Interfaces:**
```ts
export function toCsv(header: readonly string[], rows: readonly (readonly (string | number | null)[])[]): string; // BOM + CRLF
export function downloadText(fileName: string, text: string, mime: string): void; // Blob + <a download>, revokes URL
export function marketsCsv(view: MarketsTableView): string;
export function marketsCsvName(period: Period, range: Range, productId?: string): string;
```
- [x] **Step 1: failing tests**
  - `toCsv`: starts with `﻿`, lines end `\r\n`; `Côte, "d"` → `"Côte, ""d"""`; `=SUM(A1)` → `'=SUM(A1)`; `null` → empty; `1234.5` stays `1234.5` (no locale).
  - `marketsCsv` on portfolio latest: header exactly as in "My calls"; 13 lines; DE line has `off_track` and growth `-9.70`; order follows `view.rows`; no totals line.
  - `marketsCsvName('2026-05','1m')` → `markets-2026-05-1m.csv`; with product → `markets-2026-05-1m-veltrix.csv`.
  - button: click calls `downloadText` (spy) with that name and `text/csv;charset=utf-8`; disabled when no rows.
- [x] **Step 2:** run → FAIL. **Step 3:** implement. **Step 4:** green; commit `feat(export-markets): CSV of the rows as shown`.

### Task 5: Units in the time series (Analyst)

**Files:** Modify `src/widgets/revenue-trend/ui/{RevenueTrend.tsx, TrendChart.tsx, RevenueTrend.test.tsx}`, `entities/performance/model/trend.ts` only if `TrendPoint` lacks `units`, i18n.

- [x] **Step 1: failing test:** Analyst table view has a "Units" column with the selected month's units; Executive has none.
- [x] **Step 2:** FAIL. **Step 3:** add the column and a units row in the chart tooltip (Analyst only; a prop from the widget's own `state.mode`, no new chart line — units have another scale, one axis only). **Step 4:** green; commit `feat(trend): units in Analyst`.

### Task 6: Docs, version, browser pass, review

- [x] `package.json` 0.7.0; CHANGELOG 0.7.0; README status + "What works now"; spec §6 (`markets` = selection, `sort` row, history), §8 (markets table row, coordinated views, layout); ADR 0006 URL example with `sort`; DESIGN.md (table, filter chips, sticky column); backlog: CSV currency decided (raw USD), "Plan 5" → "Hardening plan", remove items this plan closes.
- [x] Browser on :3000 — desktop 1440, phone 375, dark theme, keyboard only: Shift+click narrows the table; filter menu; sort; empty state; CSV opens with right columns; Back after a selection change.
- [x] Full checks; commit `docs: 0.7.0 analyst table`.
- [x] Code review of the branch (code-review skill + a fresh reviewer subagent), fixes or backlog entries, report to the owner.

## Not in this plan

Radar and `compare` (+ Compare buttons), heat map and its multi-select (M4); alerts and 🔔 column; E2E; currency picker; virtualised table (stretch).
