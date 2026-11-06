# 0017. Currency display: fixed rates over USD data, converted once at the data

**Context.** The data is USD (`meta.currency`). The owner asked (2026-11-05) for amounts in USD, EUR or GBP, a bare symbol everywhere (`$`, not `US$`), rates fixed in the code with the day they were checked, and a note that a real app would get them from the backend API.

**Decision.**
- **Rates:** `shared/config/currency.ts`, ECB reference rates of 2026-11-05 (Frankfurter API; open.er-api.com within 0.15 %): 1 USD = 0.89095 EUR = 0.74299 GBP. One rate for every month, so growth, attainment and share do not change; only amounts do. No network request.
- **Choice:** per browser in `localStorage` (`mo:currency`), like the theme, not in the URL: a shared link shows the receiver's own currency. A header menu on desktop, a row in the ⚙︎ sheet on phones; the menu names the rates' date and source and says they are fixed for the demo.
- **Converted once, at the data.** The query cache keeps the API's USD dataset; every reader (`useDashboard`, `useDataset`) gets a copy in the chosen currency through React Query's `select` (`inCurrency`, memoised per dataset and currency). Every derived figure (KPIs, charts, table, heat map, radar, map, Top risks, evidence cards, Excel) converts with it, so a widget cannot be missed.
- **Formats:** `formatsFor(currency)` with `currencyDisplay: 'narrowSymbol'`; `CurrencyFormats` re-provides next-intl's client provider with them. The server's HTML uses USD (it has only skeletons for the dashboard, which reads the URL).
- **Map revenue steps** stay round in the chosen currency (`€1M`, `€1.5M`): a market's step matches the figure the user reads; a market near a break may change colour with the currency (owner).
- **Alerts:** `useAlertRules` gives revenue thresholds in the chosen currency, unrounded, so flags and previews compare like with like (a market exactly on a threshold flags in every currency); only the form shows whole units. Writes send whole USD, and the form checks the allowed range on that USD. An unchanged threshold keeps its stored dollars: a round trip can land a dollar off, and editing only a rule's name must not move it. The form starts again when the currency changes (another tab), so a typed number is never read in the wrong currency.
- **Exports:** Excel in the chosen currency (`"€"#,##0`), with the currency, rate and date on the About sheet. CSV stays raw USD (`*_usd` headers, 0.7.0), built from the cached dataset.
- **Assistant text** is shown as received (spec anti-goal); when it quotes dollars and another currency is chosen, a line says its amounts are in USD.

**Considered.**
- Converting in each formatter: every call site would need the rate; one forgotten call shows dollars with a euro sign.
- A cookie read on the server, so the first HTML has the right currency: the dashboard pages would stop being static. Not needed: their static HTML has no amounts (skeletons), and the client render reads the choice before any amount shows (checked on a production build, 2026-11-05: no `$` at any frame with EUR stored). `next dev` renders amounts on the server and shows USD for a moment; production does not.
- Live rates from a public API: a network dependency and a moving number in a demo; the owner chose fixed rates.

**Consequences.** A real backend would send rates (and their date) with the data, or the amounts in the user's currency. To change the rates, edit `USD_RATES` and `RATES_DATE` (the menu and the Excel About sheet read them) and the figures in the README and here.
