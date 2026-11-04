# Plan 4 · M2 — Market map (0.6.0)

**Goal.** The brief's choropleth map joins the Market status card. A user
sees where the portfolio is off plan at a glance, colours the map by a KPI
in Analyst mode, opens a market from the map with mouse, touch or keyboard,
and gets the same facts from tiles or the table.

**Status:** built on `feature/0.6.0/market-map` (2026-11-04), in review.

**Spec:** `docs/specs/2026-11-03-market-ops-console-design.md` §4 (ISO join),
§5, §6 (`kpi`), §8 (Market map, Market status), §11, §13. Decisions: ADR
0004 (react-simple-maps), 0006, 0009, 0014, 0015.

## Owner decisions (2026-11-04)

1. Map, tiles and table live in one card behind a switch `Map / Tiles /
   Table`, remembered per browser. Default: map from the `md` breakpoint,
   tiles on a phone.
2. Whole world (Antarctica dropped) with zoom: `+`, `−`, `Whole world`
   buttons; pinch on touch; Ctrl/⌘ + wheel on desktop (plain wheel scrolls
   the page); drag only once zoomed in. A region drill flies to that
   region; a market drill flies to its region and outlines the market.
3. Metric picker (`kpi`) ships now, Analyst only. Executive is always
   `status`.
4. Pointer: hover or keyboard focus shows a tooltip (name, value, status);
   click drills in. Touch: a tap opens the tooltip with an `Open market`
   button; tapping elsewhere or Esc closes it. Enter on a focused country
   drills in.
5. Multi-select (Shift+click → `markets`) moves to M3 with the markets
   table.
6. Colour scale = stepped classes with labels, not a gradient (artifact
   "Шкала карты рынков"). Growth gets six steps, the other metrics five.
7. Countries without a market: not focusable, no tooltip, drawn as plain
   land.
8. Version stays 0.6.0 (CI is already in it, not yet in `master`).
9. **Product selected:** the map colours markets by that product's values
   (compare one product across markets); status stays market level; share
   is not available per product. Moving to another market **keeps the
   product** everywhere (map, tiles, top movers, top risks, breadcrumbs):
   every product is sold in all 13 markets. The product is cleared only in
   the breadcrumbs.
10. **"Show on dashboard"** from the assistant zooms the map to fit the
    highlighted markets.

## Scale (checked on all 24 months × 1/3/12-month windows × 13 markets)

| Metric | Kind | Breaks | Cases per step (1m) |
| --- | --- | --- | --- |
| Attainment | diverging, neutral = on plan | `<94 · 94–98 · 98–102 · 102–105 · ≥105 %` | 56 / 64 / 69 / 93 / 30 |
| Growth | diverging, neutral = flat | `<−5 · −5…−1 · −1…+1 · 1–5 · 5–10 · ≥10 %` | 7 / 52 / 39 / 58 / 81 / 75 |
| Share | sequential | `<10 · 10–15 · 15–20 · 20–30 · ≥30 %` | latest only: 3 / 1 / 3 / 5 / 1 |
| Revenue | sequential | `<1 · 1–1.5 · 1.5–2 · 2–3 · ≥3 M$` per month | 77 / 75 / 66 / 63 / 31 |

- Every view (month × window) shows 4–6 distinct growth colours, mostly 5;
  the latest month uses all six (DE deep orange, ES light orange, IT grey,
  AU/BR/MX, GB/JP/IN, US/CA/FR/CN blues). Five symmetric growth steps were
  rejected: half of all cases fell into "≥5 %", so CN +18 % and US +10 %
  looked the same. A 106 % top attainment break was rejected: 3–8 cases.
- **Step = the displayed value**, rounded to one decimal, so a market shown
  as "98.0 %" is never painted as "94–98 %". Edges belong to the upper
  step (94.0 → second step).
- **Revenue breaks × the months actually in the window.** Windows are
  clipped at the first period (`periodsInRange`): "12 months to Aug 2024"
  has 3 months.
- **Colours** (validator: all pairs incl. the land, normal vision ΔE ≥ 15,
  CVD pass; ramps monotone, light end ≥ 2:1). Diverging, light: land
  `#ffffff`, `#802204 #cc572a #c0c5c9 #64a3f9 #2369c6 #033a7c`; dark: land
  card, `#fa7956 #ae4113 #424549 #1c63bf #64a3f9 #c2d9fa` (dark poles are
  lighter). Attainment uses the outer pairs and the neutral (equal arms,
  equal lightness per side); growth uses all six. Sequential, light
  `#95b8e9 #5c93e1 #296fcc #014ea5 #02336f`; dark `#21579f #3878cf
  #659deb #9ec3f8 #d6e6fc`. Written as OKLCH tokens; `tokens.test.ts`
  re-checks the numbers.
- **Land vs neutral.** The ocean is the muted surface, land without a
  market is the card colour with a hairline; markets carry an outline.
  So "on plan" grey and "no market" never look alike.
- Orange/blue match the status meaning (worse / better than plan), so the
  map never says the opposite of the tiles.

## Behaviour (my calls, open to correction)

- **Status on the map:** status colours plus a pattern — on track plain,
  at risk dotted, off track hatched (the tiles' hatch). Legend with counts.
- **Fallbacks, each with a notice:** `status` or `share` outside the
  latest 1-month view → attainment. Share with a product → attainment.
- **Calculated values** carry the "Calculated" mark in the tooltip, as in
  the KPI cards; stored values at the latest month do not.
- **Region drill:** markets of other regions are drawn as plain land with
  an outline, still clickable with a tooltip; the legend counts the
  region only, so map, tiles and table agree.
- **Zoom** set by hand survives a month, window or metric change; a drill,
  Back/Forward or "Show on dashboard" moves it. Instant with
  `prefers-reduced-motion`.
- A missing value (none in this data) is plain land with "No data" in the
  tooltip.
- **Tab order** follows regions, then market names (not SVG order).
- **Picker** = existing `DropdownMenu` with radio items in the card header
  (five options do not fit a toggle group on a phone). Changing `kpi`
  replaces history (spec §6).
- **No labels on the map**; tooltip, legend, tiles and table carry numbers.
- **Geometry** `world-atlas/countries-110m.json` is imported inside the
  lazily loaded map chunk (no CDN, no extra request). The chunk loads only
  when the map view is shown.

## Reuse

`computeKpis`, `statusFor`, `periodsInRange`, `ISO3_TO_NUMERIC`,
`marketTiles` grouping, `StatusIcon`/`StatusChip`/`useStatusLabel`,
`useKpiFormat`, `useDrillDown`, `LatestOnlyNotice`, `useStoredFlag`
storage (generalised to a choice), `highlighted`, the existing table,
`Popover`, `DropdownMenu`, `ToggleGroup`, `WidgetBoundary`, the lazy-chart
pattern of `TrendChart`. New: the map component, scale tokens, one
selector.

## Global constraints

- Branch `feature/0.6.0/market-map` from local `release/0.6.0` (= `develop`
  `50f5fa8`). Never push, merge, or commit to `release/*`, `develop`,
  `master`. Version already 0.6.0; CHANGELOG gets a map entry.
- Skills: `next-best-practices`, `vercel-react-best-practices`,
  `vercel-composition-patterns`, `react-query`, `feature-sliced-design`,
  `superpowers:test-driven-development`, `accessibility`, `dataviz`.
- New deps (spec §13, approved): `react-simple-maps@5.0.5`,
  `world-atlas@2.0.2`, exact versions.
- Strings in `en/de/ru.json`; numbers via `formats.ts`; tokens only;
  touch targets ≥ 44px; no colour-only signal; lint rules never relaxed.
- Before each commit: `pnpm format && pnpm lint && pnpm typecheck && pnpm
  test`; `pnpm build` at the end, with the map chunk size reported.

## Tasks

### 1. Selector `marketMap` (entities/performance)

`marketMap(ds, scope, period, range, kpi, highlighted)` →
`{ metric, notice: 'statusLatestOnly' | 'shareLatestOnly' |
'sharePerProduct' | null, steps: { label, count }[], items: { id, name,
numericIso, regionId, inScope, value: KpiValue, status, step, highlighted,
selected }[] }`, items in Tab order. Breaks in `map-scale.ts`. Tests
first: every fallback; edges (94.0, 97.96 shown as 98.0, −1.0, 10.0);
clipped 12m window revenue; product values per market; Spain off track at
104.5 %; region drill sets `inScope` and counts.

### 2. `kpi` in the URL; drill keeps the product (entities + features)

Parser in `dashboardSearchParams`; `normalizeDashboardState` drops an
unknown value and the default; Executive reads `status` whatever the URL
says. `useSelectMetric` replaces history. `toMarket` keeps `product`.
Tests: bad value corrected without a history entry; Executive ignores
`kpi`; locale switch keeps it; tile, mover and breadcrumb moves keep the
product; breadcrumb clears it.

### 3. Scale tokens (app/styles)

`--scale-div-1…6`, `--scale-seq-1…5`, `--map-land`, `--map-ocean`, light
and dark, values above. `tokens.test.ts`: diverging steps and land ΔE ≥ 15
(all pairs); sequential ramp monotone with ΔL ≥ 0.06 per step (the skill's
ordinal rule); sequential light end ≥ 2:1. The
diverging set is reused by the heat map in M4.

### 4. Map view (widgets/market-status)

`MarketMap` (lazy, `ssr: false`, skeleton of the same size): Equal Earth,
`ZoomableGroup`, status patterns, outline for the selected market, dashed
ring for highlighted ones, legend, zoom buttons, fly-to on drill and on
"Show on dashboard". `MapTooltip`: one `Popover` anchored to the pointer or
the country's centre; the button only when opened by touch
(`pointerType`). Countries are `role="button"` with names like "Germany,
attainment 92.0 %, off track". Tests: Tab order, Enter drills, touch tap
opens the tooltip and its button drills, mouse click drills, Esc closes,
non-market countries are not focusable, notice on a past month, highlight
zooms.

### 5. Card switch and table column (widgets/market-status)

`Map / Tiles / Table` toggle group, stored per browser (`useStoredChoice`,
from `useStoredFlag`; the old `mo:market-status-table` value still read).
The table gets the chosen metric's column. Analyst header shows the
picker. Tests: switch remembered, table follows `kpi`, Executive has no
picker, SSR renders the skeleton.

### 6. Docs, review, checks

Spec §6/§8 (product kept on market change, map rows, scale), ADR 0004
note (touch tooltip, stepped scale), CHANGELOG, README status, backlog.
Independent review agent; then my browser pass: light/dark, phone 375 px,
tablet, keyboard only, reduced motion; then the owner's checklist.

## Review focus

1. **Phone scrolling over the map** → the page scrolls; only pinch zooms;
   a tap never leaves the page without the button.
2. **Small countries** (UK, Italy, Spain at world zoom) → reachable by Tab
   and after zoom; the tooltip names the right one.
3. **Status leaking off the latest month** → no status colours, patterns
   or counts on a past month or a 3m/12m window.
4. **Static HTML** → skeleton at the card's real size; no layout jump when
   the stored view or the map chunk arrives.
5. **Product kept on a market change** → title, KPI cards, trend and map
   all show the product in the new market; Back returns to the old one.

## Out of scope

Multi-select and `markets` filtering (M3), markets table, radar, heat map,
alerts 🔔 on the map, map labels.
