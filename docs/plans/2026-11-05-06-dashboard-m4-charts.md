# Plan 6 · M4 — Analyst: heat map and comparison radar (0.8.0)

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans (owner's usual flow: build → owner check → review → owner check). Steps use `- [ ]`.

**Status:** draft, waiting for the owner's approval (2026-11-05).

**Goal.** Analyst mode gets the brief's two remaining charts: the
**heat map** (markets × 24 months, the "advanced" chart, ADR 0004) and the
**comparison radar** (the selected markets, or regions). Both follow the
same URL state as the map and the table, so one selection and one metric
move every view.

**Architecture.** Two pure selectors in `entities/performance`
(`heatMap`, `comparisonRadar`) compute every value from series and the
URL state. Two new widgets: `widgets/heat-map` (CSS grid of buttons, no
library) and `widgets/comparison-radar` (Recharts `RadarChart` through the
shadcn chart, lazy like the trend). The heat map reuses the map's scales
and tones; each step gets a text token checked for contrast.

**Tech stack.** Existing only: Recharts 3 (shadcn chart), nuqs,
next-intl, Vitest + RTL + MSW. **No new dependencies.**

**Spec:** `docs/specs/2026-11-03-market-ops-console-design.md` §5, §6
(`kpi`, `markets`), §8 (Comparison radar, Heat map, Coordinated views,
States), §11, §14. ADR 0004, 0006, 0014, 0015.

## Data facts found while planning (script, 2026-11-05)

- Attainment per market hardly moves over the 24 months (DE 91–93 %, CN
  105–107 %). **Germany's March 2026 dip is not visible as attainment**:
  its forecast fell in the same month (1.31 M$), so attainment stays at
  92 %. As growth YoY it is −31 % against −4…−10 % around it. ADR 0004's
  "shows the Germany March 2026 dip" holds for growth only.
- Monthly attainment cells by the map's steps (`<94 · 94–98 · 98–102 ·
  102–105 · ≥105`): 56 · 64 · 69 · 93 · 30 of 312, so every step is used.
- The spec contradicted itself: `kpi` is "map/heat-map metric" (§6), the
  heat-map row said "attainment centred on 100 %" (§8).

## Owner decisions (2026-11-05)

1. **Heat map metric = the map's metric** (`kpi`, one picker for both).
   Growth, attainment and revenue per month. Status and share do not exist
   per month: then the heat map shows **growth YoY** with a notice, so the
   default Analyst view (`kpi=status`) shows the Germany dip.
2. **Selection on the heat map marks rows** (like the rings on the map):
   every market of the scope stays; selected rows are marked and named
   "selected". Shift+click / Shift+Enter on a row's cell adds or removes it.
3. **Radar always has a portfolio reference**: a grey dashed "Portfolio
   average" outline next to the compared markets or regions (it does not
   take one of the four colours).
4. **Momentum = growth acceleration**: growth YoY over the 3 months ending
   at `period` minus growth YoY over the 3 months before them, in pp
   (YoY removes the season). Germany at May 2026 ≈ −11.8 pp (−15.9 % after −4.1 %).
5. **Layout (Analyst, wide):** the radar sits in the right column under
   Top risks, next to the map (a Shift+click on the map changes the radar
   beside it); the heat map is full width under the markets table; trend
   and Top movers stay at the bottom. Executive is unchanged.
6. **Phone:** the heat map scrolls sideways inside its card, the market
   column is sticky, and it opens scrolled to the selected month.
7. **Full M4**, cut line (§14 items 3–4) only if time runs out, and said
   so.

## My calls (open to correction)

- **Heat-map click = open the market at that month** (`market` + its
  region + `period`, range kept, one history entry), like a click on the
  map or the table; Shift+click selects. A drill clears the selection, as
  everywhere.
- **Heat-map rows follow the scope like the tiles**: portfolio 13, region
  its markets, market its region with that row marked "open now"; a
  product narrows each market to it. The window (`period`, `range`) is a
  labelled band over its columns; the selected month's header is marked.
- **Cells:** whole percent (revenue compact, "1.2M"); the focused or
  hovered cell is spelled out in a line under the grid with one decimal
  and the anomaly note ("Germany · Mar 2026 · Growth −30.6 % · ⚠ Revenue
  fell 27 % versus the prior month"). This line is also the touch path (a
  tap shows it, a second tap opens). Anomaly cells carry a ⚠ corner mark
  (not colour only). Values are calculated from series and the card says
  they can differ from stored KPIs by about a point.
- **Keyboard:** one Tab stop (roving tabindex), arrows move, Home/End
  jump within a row, Ctrl+Home/End to the corners, Enter opens, Shift+Enter
  selects. `role="grid"` with row headers; each cell's name carries market,
  month, value, step words and the anomaly.
- **Table alternative** for both charts, a `Chart / Table` button
  remembered per browser like the trend's (`useStoredFlag`).
- **Radar axes:** growth, attainment, share, revenue, momentum. Each axis
  is scaled worst → best across the compared group's peers (the 13 markets
  when markets are compared, the 4 regions when regions are), so 0 = worst
  and 1 = best of the peers; equal values sit in the middle. The reference
  uses portfolio ratios (Σ/Σ) and, for revenue, the peers' mean. Tooltip
  and table show real values, never the 0–1 numbers.
- **An axis without data is removed, not drawn at 0** (a point at the
  centre would read as "worst"), with the existing notice wording: share
  off the latest 1-month view; momentum before Nov 2024 (needs 6 months).
  Fewer than 3 axes cannot make a radar: the table shows instead. The radar
  ignores the product (spec §6: it stays market/region level) and says so
  when one is open.
- **More than 4 selected:** the first 4 in selection order, and "Showing 4
  of N selected" (the rest stay in the table and on the map).
- **Selection outside the scope** (only possible through a typed URL):
  the radar still compares them; they are what the user selected.
- **Radar colours:** four categorical series tokens (`--series-1…4`, new,
  light and dark) checked with the `dataviz` validator, each with its own
  dash pattern and marker shape, so the legend and the lines read without
  colour. The existing `chart-*` tokens are greys plus one orange and one
  blue: not four distinct series.
- **Skeletons:** both are Analyst-only and use `mode-analyst:` (ADR 0015),
  so the static page holds their space; the radar skeleton sits under the
  Top risks skeleton.
- **Releases:** `package.json` → `0.8.0`, CHANGELOG `0.8.0`. Spec §6/§8,
  ADR 0004 and DESIGN.md are updated to what is built.

## Global constraints

- Branch `feature/0.8.0/charts` from local `release/0.8.0` (= `develop`
  b62bbcb, after PR #22). Never push, merge or commit to `release/*`,
  `develop`, `master`.
- Skills: `next-best-practices`, `vercel-react-best-practices`,
  `vercel-composition-patterns`, `accessibility`, `dataviz`, TDD.
- No string literals in UI; numbers only via next-intl formats
  (`useKpiFormat`); tokens only; no `as` casts; FSD imports down only;
  lint rules never relaxed.
- Before each commit: `pnpm format && pnpm lint && pnpm typecheck && pnpm test`.
- Do not commit the owner's `next.config.ts` change.
- Browser checks only when the owner allows Playwright, on his dev server
  (port 3000), files in `.playwright-mcp/` only.

## Review focus

1. **Default Analyst link** (`?mode=analyst`, `kpi=status`): the heat map
   shows growth with its notice and DE · Mar 2026 sits in the lowest step
   with a ⚠ mark. → test in Task 1 and Task 4.
2. **Radar on an early month** (`period=2024-08`): momentum is removed,
   share too; three axes are left and the chart still draws; on
   `2024-06` with `3m` the window is clipped and nothing breaks. → Task 2.
3. **Five markets selected**: radar shows the first four and "4 of 5";
   the heat map marks all five. → Task 2, Task 5.
4. **Arrow keys at the grid's edges and after the scope changes** (focus
   on row 13, then drill into a 3-market region): focus stays on a cell
   that exists, never lost to `<body>`. → Task 4.
5. **Shift+Enter on the heat map during a region drill** for a market of
   that region selects it; a plain Enter opens the market at that month
   and keeps the range. → Task 4.

---

### Task 1: `heatMap` selector

**Files:**
- Create: `src/entities/performance/model/heat-map.ts`, `heat-map.test.ts`
- Modify: `model/market-map.ts` (export `resolveMetric` for reuse, or move it to `map-scale.ts`), `index.ts`

**Interfaces (produces):**
```ts
export type HeatNotice = 'statusPerMonth' | 'sharePerMonth';
export type HeatCell = { period: Period; value: number | null; step: number | null;
  anomaly: Anomaly | null; inWindow: boolean };
export type HeatRow = { id: string; name: string; regionId: string;
  cells: HeatCell[]; selected: boolean; current: boolean };
export type HeatMapView = { metric: Exclude<ScaleMetric, 'share'>; notice: HeatNotice | null;
  periods: Period[]; window: Period[]; rows: HeatRow[] };
export function heatMap(ds: Dataset, scope: Scope, period: Period, range: Range,
  kpi: MapMetric, selected: readonly string[]): HeatMapView;
```

- [ ] **Step 1: failing tests**:
  - portfolio, `kpi: 'status'` → `metric: 'growth'`, `notice: 'statusPerMonth'`, 13 rows × 24 cells in map Tab order.
  - DE · `2026-03` growth within 0.5 of −31, `step: 0`, `anomaly.type: 'dip'`; DE · `2026-02` has no anomaly.
  - `kpi: 'share'` → growth with `sharePerMonth`; `kpi: 'attainment'` → DE · `2026-03` ≈ 92, step 0; `kpi: 'revenue'` steps use 1 month (CN cells in the top two steps).
  - region `eu` → 5 rows; market `de` → 5 rows, only DE `current`; product `veltrix` → values from that product only.
  - `period: '2026-05', range: '3m'` → `window` = Mar–May and exactly those cells `inWindow`.
  - selected `['de','jp']` under `eu` → DE `selected`, JP absent (not in scope).
- [ ] **Step 2:** run → FAIL.
- [ ] **Step 3:** implement over `rowsInScope` per market and month (one pass grouping series by market and period, not 312 `computeKpis` calls); steps via `stepFor(metric, value, 1)`; anomalies from `markets[].kpis.anomalies`.
- [ ] **Step 4:** green; commit `feat(heat-map): heatMap selector`.

### Task 2: `comparisonRadar` selector

**Files:**
- Create: `src/entities/performance/model/radar.ts`, `radar.test.ts`
- Modify: `index.ts`

**Interfaces (produces):**
```ts
export const RADAR_AXES = ['growth', 'attainment', 'share', 'revenue', 'momentum'] as const;
export type RadarAxis = (typeof RADAR_AXES)[number];
export type RadarAxisNotice = 'shareLatestOnly' | 'momentumTooEarly';
export type RadarSeries = { id: string; name: string; kind: 'market' | 'region' | 'portfolio';
  /** Real values (%, pp, $) and 0–1 positions, per shown axis. */
  values: Partial<Record<RadarAxis, { raw: number; scaled: number }>> };
export type RadarView = { compared: 'markets' | 'regions'; axes: RadarAxis[];
  removed: { axis: RadarAxis; notice: RadarAxisNotice }[];
  series: RadarSeries[]; reference: RadarSeries; hiddenSelected: number; productIgnored: boolean };
export function comparisonRadar(ds: Dataset, scope: Scope, period: Period, range: Range,
  selected: readonly string[]): RadarView;
```

- [ ] **Step 1: failing tests**:
  - nothing selected → `compared: 'regions'`, 4 series in data order, reference `kind: 'portfolio'`.
  - selected `['de','es']`, latest 1m → 2 market series; DE growth raw = stored −10.0 (computeKpis, `data`); DE momentum raw within 0.1 of −11.8; every `scaled` in [0, 1]; the best of the 13 on growth (CN) would scale to 1.
  - 5 selected → 4 series, `hiddenSelected: 1`, order kept.
  - `range: '3m'` → share removed with `shareLatestOnly`; `period: '2024-08'` → momentum removed with `momentumTooEarly`, 3 axes left.
  - regions compared: revenue scaled across the 4 regions (EU not clamped to 1 because a market is smaller); reference revenue = mean of the 4.
  - all peers equal on an axis → `scaled: 0.5`.
  - `scope.productId` set → values as without it, `productIgnored: true`.
- [ ] **Step 2:** run → FAIL.
- [ ] **Step 3:** implement with `computeKpis` per entity; momentum from two 3-month `sumRows` windows (growth YoY each, difference in pp).
- [ ] **Step 4:** green; commit `feat(radar): comparisonRadar selector`.

### Task 3: tokens — step text colours and radar series

**Files:**
- Modify: `src/app/styles/globals.css`, `src/app/styles/tokens.test.ts`, `DESIGN.md` (tokens table)

- [ ] **Step 1: failing tests** in `tokens.test.ts`, for `:root` and `.dark`:
  - every `--scale-div-N` (1–6) and `--scale-seq-N` (1–5) has a `-foreground` token with contrast ≥ 4.5:1 against it.
  - `--series-1…4` each ≥ 3:1 against `--card`, and pairwise ΔE ≥ 15 (the existing ΔE helper).
- [ ] **Step 2:** run → FAIL.
- [ ] **Step 3:** pick the series hues, then run `node <dataviz>/scripts/validate_palette.js "<hex×4>" --mode light` and `--mode dark` against the card surfaces; fix every FAIL. Foregrounds: the darkest or lightest neutral ink that passes, per step.
- [ ] **Step 4:** green; commit `feat(tokens): heat-map step text and radar series colours`.

### Task 4: `widgets/heat-map`

**Files:**
- Create: `src/widgets/heat-map/{index.ts, ui/HeatMap.tsx, ui/HeatGrid.tsx, ui/HeatMap.test.tsx, ui/HeatMapSkeleton.tsx, ui/use-grid-focus.ts(+test)}`
- Modify: `features/drill-down/model/use-drill-down.ts` (+ test): `toMarket(marketId, options?: { period?: Period })`; i18n en/de/ru (`heatMap.*`)

**Interfaces:**
- Consumes: `heatMap` (Task 1), `useDrillDown().toMarket`, `useMarketSelection().toggle`, `MAP_SCALES`, `toneFill`-like helper (move `toneFill` to `shared/lib` or duplicate in the widget — prefer moving it to `entities/performance/ui` so map and heat map share it), `useStoredFlag`.
- Produces: `HeatMap`, `HeatMapSkeleton`.

- [ ] **Step 1: failing tests** (RTL + nuqs test adapter):
  - default Analyst state → title names growth, the notice text, a `grid` with 13 row headers; the DE · Mar 2026 cell's name includes "Germany", "March 2026", "−31%" and the anomaly note.
  - ArrowRight/ArrowDown/Home/End move focus (one cell has `tabIndex=0`); at the last column ArrowRight stays.
  - Enter on DE · Mar 2026 → URL `region=eu&market=de&period=2026-03`, range kept, `markets` cleared.
  - Shift+Enter → `markets=de`, no drill; the row is named "selected".
  - focus on row 13, then rerender with region `latam` (3 rows) → a cell of the grid has focus.
  - `Table` button → a table with 24 month columns; the choice survives a remount (stored flag).
  - the window band: 3 header cells labelled as in the window for `range=3m`.
- [ ] **Step 2:** run → FAIL.
- [ ] **Step 3:** implement. Grid = `role="grid"`, rows of `<button>` cells (44px tall), sticky row header, `overflow-x-auto` wrapper; on mount scroll the selected month into view (`scrollIntoView({ inline: 'center', block: 'nearest' })`, instant under reduced motion). Cell fill = step tone, text = step foreground token. The detail line under the grid is `aria-live="polite"` only for pointer/touch changes, not for every arrow key (the cell name already says it).
- [ ] **Step 4:** green; commit `feat(heat-map): markets × months heat map with keyboard and table`.

### Task 5: `widgets/comparison-radar`

**Files:**
- Create: `src/widgets/comparison-radar/{index.ts, ui/ComparisonRadar.tsx, ui/RadarChart.tsx (lazy), ui/ComparisonRadar.test.tsx, ui/ComparisonRadarSkeleton.tsx}`
- Modify: i18n en/de/ru (`radar.*`)

- [ ] **Step 1: failing tests**:
  - nothing selected → title "Regions compared", a legend with 4 regions + "Portfolio average", each legend item draws its dash pattern (an element per pattern, not colour only).
  - `markets=de&markets=es` → legend Germany, Spain + portfolio; the table view lists real values (DE growth "−10.0%").
  - 5 selected → "Showing 4 of 5 selected".
  - `range=3m` → share notice; `product=veltrix` → "Compares markets, not products" notice.
  - fewer than 3 axes → the table shows without the chart toggle.
- [ ] **Step 2:** run → FAIL.
- [ ] **Step 3:** implement with the shadcn `ChartContainer` + Recharts `RadarChart` via `next/dynamic` (as `TrendChart`); `PolarAngleAxis` labels translated; tooltip shows raw values formatted by `useKpiFormat`; reference drawn first, dashed, `--muted-foreground`.
- [ ] **Step 4:** green; commit `feat(radar): comparison radar with table alternative`.

### Task 6: layout, skeletons, docs, release

**Files:**
- Modify: `src/pages/dashboard/ui/Overview.tsx` (+ `Overview.test.tsx`), spec §6 (`kpi` row) and §8 (Heat map, Comparison radar rows, Coordinated views), ADR 0004, DESIGN.md (inventory, chart rules), README (if it lists widgets), CHANGELOG `0.8.0`, `package.json` `0.8.0`, `docs/plans/backlog.md` (close the M4 items; move the radar decision into the spec), this plan's status.

- [ ] **Step 1: failing tests** in `Overview.test.tsx`: Analyst → radar after Top risks in the same column and the heat map after the markets table; Executive → neither; the static skeleton holds both behind `mode-analyst:`.
- [ ] **Step 2:** implement the right column as a stack (`TopRisks` + `AnalystOnly(ComparisonRadar)`, each in its own `Slot`); heat map `Slot` after the table.
- [ ] **Step 3:** docs synced with what is built; `pnpm build` static for the four locales.
- [ ] **Step 4:** commit `feat(dashboard): heat map and radar in Analyst` and `docs: 0.8.0`.

### Task 7: review and owner check

- [ ] Independent branch review by an agent (correctness, a11y, FSD, tests); fix or record each finding in the backlog.
- [ ] Owner check on his dev server; fixes; plan status → built.

## Not in this plan

Alerts and the 🔔 column, E2E happy path, deploy, README, currency picker
(their own plans).
