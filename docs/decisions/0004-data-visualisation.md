# 0004. Data visualisation

| Chart | Choice | Why |
| --- | --- | --- |
| Time series (actual / forecast / prior year) | shadcn charts (Recharts 3) | Ready component, themed by our CSS tokens, `accessibilityLayer` for keyboard |
| Radar | shadcn charts (Recharts `RadarChart`) | Same |
| Choropleth map | react-simple-maps 5 (React 19 support, Aug 2026) | 13 countries; each is an SVG path we can make focusable with ARIA |
| Heat map (markets × periods) | CSS grid of buttons, no library | 13 × 24 cells; arrow-key navigation is simple; shows the Germany March 2026 dip |

Diverging scale for the heat map validated for contrast (`dataviz` skill). Heat map chosen over scatter as the "advanced" chart.

**Rejected.** ECharts (≈190 KB gz modular, option-object theming), Nivo (one package per chart, theme object, client-only), Highcharts (paid licence), own d3-geo map (react-simple-maps is a thin wrapper and is maintained again).

**Consequences.** Every chart has a table alternative, keyboard access and a non-colour signal (pattern/label/icon).
