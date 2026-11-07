# 0014. Design direction: dashboard D, assistant A, fallback to dashboard A

**Context.** The design pass (spec §15) produced four directions on a Claude Design canvas (A soft cards, B ruled ledger, C attention queue, D map console), each in light and dark. The canvas is in the author's own account and is private; what it decided is written down here and in `DESIGN.md`. The owner compared them on 2026-11-03.

**Decision** (owner decision, 2026-11-03):
- **Assistant: variant A.** Chat panel on the right; AI answers on a separate violet "AI surface", user messages and source data on neutral surfaces; the six message states from the A "Assistant" board (empty, streaming, done, error, stopped, discrepancy) are the reference.
- **Dashboard: variant D (map console).** Top to bottom: four KPI cards (Revenue, Forecast attainment, Growth YoY, Markets at risk), a real world map (world-atlas `countries-110m`) where the 13 markets are filled by plan attainment and off-track markets are hatched, Top risks next to the selected-market card, then the period line. European markets are labelled with callouts; zoom is a World / Europe / APAC switch, no inset.
- **Fallback: dashboard A.** If the assistant takes longer than planned and there is not enough time left for D before the deadline (2026-11-09), the dashboard is built as variant A instead. A and D read the same data and the same entities, so the switch changes only `widgets/` layout and styling, not `entities/` or `shared/api`.

**Alternatives.** B (ruled ledger) and C (attention queue, bridge chart) were rejected by the owner. A for both surfaces was the safe option; D for both was rejected because the owner prefers the minimal A chat.

**Consequences.**
- One token set must serve both A's assistant and D's dashboard (colours, type, status, AI surface) in light and dark; it goes into `src/app/styles/globals.css` per ADR 0009, each pair contrast-checked.
- D puts the map at the centre of Executive mode. ADR 0004 already includes the map; the spec's Executive layout is updated to D's order.
- The heat map (ADR 0004) stays, in Analyst mode only.
- The fallback decision point is recorded in `docs/plans/backlog.md` so it is checked, not forgotten.

**Fonts** (owner decision, 2026-11-03): Space Grotesk for text, JetBrains Mono for numbers (KPIs, tables, axes). Both are SIL Open Font License 1.1 (checked in `google/fonts` `OFL.txt`, 2026-11-03): free for commercial use, self-hosted through `next/font/google`, no attribution in the UI required.

**Cyrillic** (owner decision, 2026-11-03): Space Grotesk has no Cyrillic (subsets: latin, latin-ext, vietnamese). No extra Cyrillic font is added: in `ru-RU` the browser renders Cyrillic glyphs with the system sans-serif from the font stack (`'Space Grotesk', system-ui, sans-serif`), Latin glyphs and numbers keep Space Grotesk and JetBrains Mono. Rejected: a Cyrillic companion font (Manrope) and one Cyrillic font for the whole app (Manrope / Onest / Golos Text). Cost: the Russian UI looks less consistent than English and German; only the `cyrillic` subset of JetBrains Mono is loaded in addition to `latin`.

**Checkpoint, 2026-11-04** (owner decision): after Plan 2, five days were left before the deadline, so the dashboard is built as **variant A**. The assistant stays variant A. Only the Executive layout changes against D; map, radar, time series, heat map, URL state, alerts and the Analyst mode are the same in both. The D canvas boards remain the reference for the shared widgets.
