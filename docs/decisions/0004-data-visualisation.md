# 0004. Data visualisation

| Chart | Choice | Why |
| --- | --- | --- |
| Time series (actual / forecast / prior year) | shadcn charts (Recharts 3) | Ready component, themed by our CSS tokens, `accessibilityLayer` for keyboard |
| Radar | shadcn charts (Recharts `RadarChart`) | Same |
| Choropleth map | react-simple-maps 5 (React 19 support, Aug 2026) | 13 countries; each is an SVG path we can make focusable with ARIA |
| Heat map (markets × periods) | HTML table as an ARIA grid of buttons, no library | 13 × 24 cells; arrow-key navigation is simple; shows the Germany March 2026 dip as growth YoY (as attainment it is invisible: the forecast fell too) |

Diverging scale validated for contrast (`dataviz` skill); the heat map reuses the map's attainment steps and `--scale-div-*` tones, so a value has one colour on both (owner, 2026-11-04). Heat map chosen over scatter as the "advanced" chart.

**Rejected.** ECharts (≈190 KB gz modular, option-object theming), Nivo (one package per chart, theme object, client-only), Highcharts (paid licence), own d3-geo map (react-simple-maps is a thin wrapper and is maintained again).

**Consequences.** Every chart has a table alternative, keyboard access and a non-colour signal (pattern/label/icon).

**Map, as built (0.6.0, plan 2026-11-04-04).** react-simple-maps 5.0.5 with `world-atlas` 2.0.2 (`countries-110m`) imported inside the map's own lazy chunk (≈71 KB gz with d3-geo/d3-zoom; not in the first load). Stepped classes, not a gradient: a reader names a step ("1–5 %") and the legend counts markets per step; growth has six steps because a symmetric five put half of all cases in one class. Touch has no hover, so a tap opens the tooltip with an explicit "Open" button instead of a double tap. Gestures are filtered so the page keeps scrolling: plain wheel and one finger never zoom. SVG fills read the source tokens (`--scale-*`), as Tailwind drops unused `--color-*` aliases. The first fit is set in a layout effect and the library's `ZoomableGroup` is mounted only then: it applies later `center`/`zoom` changes in a passive effect, a frame late, so mounted earlier it painted the whole world before the jump (0.7.0).

**Heat map and radar, as built (0.8.0, plan 2026-11-05-06).** The heat map follows the map's metric (`kpi`), because the data's story (Germany, March 2026) only shows as growth: status and share have no months, so it shows growth then. Cells take the map's steps per month and a text token per step (black or white, ≥ 4.5:1, `tokens.test.ts`). It is a `<table role="grid">` of buttons with a roving tabindex rather than a CSS grid: row and column headers come with the table, and sticky columns work on a phone. The radar is Recharts through the lazy shadcn chart frame, like the trend; every axis is "higher is better", scaled between the compared kind's worst and best peer, and an axis without data is removed rather than drawn at the centre, where it would read as the worst. Its four series colours (`series-1…4`) are new: the `chart-*` tokens are mostly greys and the orange and blue would read as statuses; they pass the dataviz validator (CVD ΔE ≥ 9 in both themes) and each also has a dash pattern and a marker shape.
