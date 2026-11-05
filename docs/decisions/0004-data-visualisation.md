# 0004. Data visualisation

| Chart | Choice | Why |
| --- | --- | --- |
| Time series (actual / forecast / prior year) | shadcn charts (Recharts 3) | Ready component, themed by our CSS tokens, `accessibilityLayer` for keyboard |
| Radar | shadcn charts (Recharts `RadarChart`) | Same |
| Choropleth map | react-simple-maps 5 (React 19 support, Aug 2026) | 13 countries; each is an SVG path we can make focusable with ARIA |
| Heat map (markets × periods) | CSS grid of buttons, no library | 13 × 24 cells; arrow-key navigation is simple; shows the Germany March 2026 dip |

Diverging scale validated for contrast (`dataviz` skill); the heat map reuses the map's attainment steps and `--scale-div-*` tones, so a value has one colour on both (owner, 2026-11-04). Heat map chosen over scatter as the "advanced" chart.

**Rejected.** ECharts (≈190 KB gz modular, option-object theming), Nivo (one package per chart, theme object, client-only), Highcharts (paid licence), own d3-geo map (react-simple-maps is a thin wrapper and is maintained again).

**Consequences.** Every chart has a table alternative, keyboard access and a non-colour signal (pattern/label/icon).

**Map, as built (0.6.0, plan 2026-11-04-04).** react-simple-maps 5.0.5 with `world-atlas` 2.0.2 (`countries-110m`) imported inside the map's own lazy chunk (≈71 KB gz with d3-geo/d3-zoom; not in the first load). Stepped classes, not a gradient: a reader names a step ("1–5 %") and the legend counts markets per step; growth has six steps because a symmetric five put half of all cases in one class. Touch has no hover, so a tap opens the tooltip with an explicit "Open" button instead of a double tap. Gestures are filtered so the page keeps scrolling: plain wheel and one finger never zoom. SVG fills read the source tokens (`--scale-*`), as Tailwind drops unused `--color-*` aliases. The first fit is set in a layout effect and the library's `ZoomableGroup` is mounted only then: it applies later `center`/`zoom` changes in a passive effect, a frame late, so mounted earlier it painted the whole world before the jump (0.7.0).
