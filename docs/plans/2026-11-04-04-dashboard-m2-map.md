# Plan 4 · M2 — Market map (0.6.0)

**Goal.** The brief's choropleth map joins the Market status card. A user
sees where the portfolio is off plan at a glance, colours the map by a KPI
in Analyst mode, opens a market from the map with mouse, touch or keyboard,
and gets the same facts from tiles or the table.

**Status:** plan, waiting for owner approval (2026-11-04).

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
6. Colour scale = variant A: five labelled steps, not a gradient
   (artifact "Шкала карты рынков").
7. Countries without a market: grey, not focusable, no tooltip.
8. Version stays 0.6.0 (CI is already in it, not yet in `master`).

## My calls (open to correction)

- **Steps.** Diverging around the plan: attainment `<94 · 94–98 · 98–102 ·
  102–105 · ≥105 %`; growth `<−5 · −5–0 · 0–5 · 5–10 · ≥10 %`. Sequential:
  share `<10 · 10–15 · 15–20 · 20–30 · ≥30 %`; revenue per month `<1 ·
  1–1.5 · 1.5–2 · 2–3 · ≥3 M$`, multiplied by the months in the window
  (3m, 12m) so a longer window does not paint everything dark.
- **Status on the map:** three status colours plus a pattern — on track
  plain, at risk dotted, off track hatched (the tiles' hatch). Legend with
  counts, as on the tiles.
- **Fallbacks, each with a notice:** `status` off the latest 1-month view →
  attainment; `share` off the latest month → attainment. A product drill
  keeps market-level values and shows the tiles' "per market" note.
- **Geometry** `world-atlas/countries-110m.json` is imported inside the
  lazily loaded map chunk (no CDN, no extra request, no second loading
  state). The map chunk loads only when the map view is shown.
- **Tab order** follows regions, then market names (not SVG order); markets
  outside a drilled region stay coloured and clickable.
- **Picker** = existing `DropdownMenu` with radio items in the card header
  (five options do not fit a toggle group on a phone). Changing `kpi`
  replaces history (spec §6).
- **No labels on the map**; the tooltip, legend, tiles and table carry the
  numbers (design pass note for phones).

## Reuse

`computeKpis`, `statusFor`, `ISO3_TO_NUMERIC`, `marketTiles` grouping,
`StatusIcon`/`StatusChip`/`useStatusLabel`, `useKpiFormat`, `useDrillDown`,
`LatestOnlyNotice`, `useStoredFlag` storage (generalised to a choice),
`highlighted` from "Show on dashboard", the existing table, `Popover`,
`DropdownMenu`, `ToggleGroup`, `WidgetBoundary`, the lazy-chart pattern of
`TrendChart`. New: the map component, scale tokens, one selector.

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
`{ metric, notice: 'statusLatestOnly' | 'shareLatestOnly' | null, perMarket,
steps: { label, count }[], items: { id, name, numericIso, regionId, value:
KpiValue, status, step: 0–4, highlighted, selected }[] }`, items in Tab
order. Steps and breaks live next to it (`map-scale.ts`). Tests first:
fallbacks, breaks at the edges (94.0 → second step), 3m/12m revenue,
product drill, Spain off-track at 104.5 %.

### 2. `kpi` in the URL (entities + features/select-metric)

Parser in `dashboardSearchParams`, `normalizeDashboardState` drops an
unknown value and the default; Executive reads `status` whatever the URL
says. `useSelectMetric` replaces history. Tests: bad value corrected
without a history entry; Executive ignores `kpi`; locale switch keeps it.

### 3. Scale tokens (app/styles)

`--scale-div-1…5` (oranges → neutral → blues) and `--scale-seq-1…5`,
light and dark, plus `--map-land`. `tokens.test.ts` checks 3:1 between
neighbouring steps' borders and the card, and that every token has both
themes. The diverging set is the one the heat map uses in M4.

### 4. Map view (widgets/market-status)

`MarketMap` (lazy, `ssr: false`, skeleton of the same size): Equal Earth,
`ZoomableGroup`, status patterns, outline for the selected market, dashed
ring for highlighted ones, legend, zoom buttons, fly-to on drill (instant
with `prefers-reduced-motion`). `MapTooltip`: one `Popover` anchored to the
pointer or the country's centre; button only when opened by touch
(`pointerType`). Countries are `role="button"` with names like "Germany,
attainment 92.0 %, off track". Tests: Tab order, Enter drills, touch tap
opens the tooltip and the button drills, mouse click drills, Esc closes,
non-market countries are not focusable, notice on a past month.

### 5. Card switch and table column (widgets/market-status)

`Map / Tiles / Table` toggle group, stored per browser (`useStoredChoice`,
from `useStoredFlag`; old `mo:market-status-table` value still read). The
table gets the chosen metric's column. Analyst header shows the picker.
Tests: switch remembered, table follows `kpi`, Executive has no picker,
SSR renders the skeleton.

### 6. Docs, review, checks

Spec §8 rows (Market status, Market map), ADR 0004 note (tooltip on touch,
stepped scale), CHANGELOG, README status, backlog. Independent review
agent; then my browser pass: light/dark, phone 375 px, tablet, keyboard
only, reduced motion; then the owner's checklist.

## Review focus

1. **Phone scrolling over the map** → the page scrolls; only pinch zooms;
   a tap never leaves the page without the button.
2. **Small countries** (UK, Italy, Spain at world zoom) → reachable by Tab
   and after zoom; tooltip names the right one.
3. **Status leaking off the latest month** → no status colours, patterns
   or counts on a past month or a 3m/12m window.
4. **Static HTML** → skeleton at the card's real size; no layout jump when
   the stored view or the map chunk arrives.
5. **Dark theme** → steps stay distinct and the land stays visible on the
   card.

## Out of scope

Multi-select and `markets` filtering (M3), markets table, radar, heat map,
alerts 🔔 on the map, map labels.
