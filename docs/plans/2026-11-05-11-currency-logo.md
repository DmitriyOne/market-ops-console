# 0.12.0 Currency picker and logo

**Goal:** show every amount in USD, EUR or GBP at a fixed demo rate, and put
the "M" logo in the header for both themes. The deploy, favicon, title and
preview move to 0.13.0.

## Owner decisions (2026-11-05)

1. **Currencies USD, EUR, GBP.** Money shows a bare symbol: `$`, `€`, `£`
   (`currencyDisplay: 'narrowSymbol'`), never `US$`. The picker writes the
   code and name: `$ USD · US dollar`.
2. **Static rates**, one rate for every month, written in the code with the
   date they were checked. The picker and the README say: fixed for the demo;
   a real app would get them from the backend API.
3. **Rates checked 2026-11-05**, ECB reference rates (Frankfurter API),
   cross-checked with open.er-api.com:
   1 USD = **0.89095 EUR** (er-api 0.88991), **0.74299 GBP** (er-api 0.74232).
   ECB figures are used.
4. **Where:** desktop header next to language and theme; phone, the ⚙︎
   settings sheet. Remembered per browser (`localStorage`), not in the URL,
   like the theme.
5. **Excel in the chosen currency**: amounts multiplied by the rate, `€`/`£`
   number formats, the About sheet names the currency, the rate, its date and
   that the source data is USD. **CSV stays raw USD** (`*_usd` columns, 0.7.0).
6. **Alert revenue thresholds are typed in the chosen currency**, stored in
   USD (the API and its rule schema are unchanged), shown back in the chosen
   currency.
7. **Logo:** the rounded square with an "M" from the design, inverted in dark
   mode (light: dark square, white M; dark: light square, dark M), drawn from
   the `foreground`/`background` tokens. Later reused for the favicon (0.13.0).
8. **Version 0.12.0**: currency + logo. The deploy moves to 0.13.0.
9. **Map revenue steps stay round in the chosen currency** (`€1M`, `€1.5M`,
   …, owner): the legend reads cleanly and a market's step matches the figure
   the user reads; a market near a break may change colour with the currency.

## How the conversion works

- `shared/config/currency`: `CURRENCIES = ['USD','EUR','GBP']`, `USD_RATES`
  (USD = 1, EUR 0.89095, GBP 0.74299), `RATES_DATE = '2026-11-05'`.
- The choice: `useCurrency()` on `useStoredChoice('mo:currency')`; unknown or
  missing value = USD.
- **Converted once, at the data:** the dataset readers get a copy with every
  money field (`kpis.revenue`, series `actual`, `forecast`, `priorYear`) times
  the rate, memoised per dataset and rate. Everything derived (KPIs, charts,
  table, heat map, radar, map, Top risks, "What the data shows", alert
  preview and flags) converts with it, so nothing can be missed by a
  formatter. Ratios (growth, attainment, share) do not change: one rate.
- **Formats:** the client `NextIntlClientProvider` gets the formats with the
  chosen `currency` and `narrowSymbol`, so every `{value, number, compactCurrency}`
  and `format.number(v, 'currency')` prints the right symbol.
- **Alerts:** a revenue threshold is multiplied by the rate when read for
  display and evaluation (unrounded), divided by it and rounded to whole USD
  when saved.
- **Exports:** Excel from the converted view with the currency's number
  format; CSV from the USD view.
- **Assistant:** evidence card figures convert (they are numbers). The answer
  text is shown as received (spec anti-goal) and quotes USD; with EUR or GBP
  chosen, a line under the answer says "Figures in the answer are in USD."

## Tasks

1. Currency config, `useCurrency`, conversion of the dataset, formats with
   the chosen currency and `narrowSymbol`; tests (rates, round trip, ratios
   unchanged, `$`/`€`/`£` in en-GB, de, ru).
2. `CurrencySwitch` (header menu) and `CurrencySwitchRow` (phone sheet), with
   the rate date and the demo note; tests.
3. Alerts: threshold field label and value in the chosen currency, saved in
   USD; rule text and firing reasons converted; tests.
4. Excel in the chosen currency (number formats, About rows), CSV still USD;
   tests.
5. Assistant: evidence cards converted, the USD note; tests.
6. Logo component in the header (and its skeleton), both themes; test.
7. Map revenue steps round in the chosen currency (decision 9); tests.
8. Browser check on :3000 in en/de/ru × USD/EUR/GBP, light/dark, phone:
   every widget, Excel file opened in Excel, a stored EUR after reload (no
   USD flash), alerts round trip. E2E: pick EUR, see `€` in a KPI, reload
   keeps it.
9. Docs: ADR 0017 (currency), DESIGN.md (picker, logo), README, CHANGELOG
   0.12.0, backlog (currency item closed, deploy → 0.13.0), version 0.12.0.

## Risks

- A remembered EUR could show USD for a moment on load if a part renders
  from static HTML before the browser is read. Checked in task 8; if it
  happens, the money parts wait like the other browser-read parts.
- German compact currency does not shorten thousands (backlog, 0.6.0); the
  same holds for `€` and `£`.

## Found during the release

- **The USD flash is a `next dev` effect only.** With EUR stored, `:3000`
  showed `$22.9m` for ~150 ms; a production build (static HTML = skeletons)
  showed no `$` at any frame in en-GB, de-DE, ru-RU, Executive and Analyst.
  The owner suggested skeletons: that is what production already does. No
  change; backlog note.
- **axe: the header trigger's name lacked its visible text** ("USD" vs
  "Currency: US dollar"). Named "Currency: USD, US dollar" now.
- The settings button's name listed language, theme, reset; currency added.
- The mock assistant never quotes an amount, so the USD note does not show
  with it (unit-tested on a made-up answer).
- **Checked by hand:** Excel (EUR file opened in Microsoft Excel: Germany
  €1,493,754 = 1,676,586 × 0.89095, total €20,358,580, share 21.9 % and
  attainment 100.4 % unchanged, the Germany + Spain filter recomputes the
  totals); no `$` text node or attribute left in Analyst with EUR; the phone
  sheet and menu (ru); the logo in light and dark.

## Owner check (2026-11-05)

- A dropdown kept its focus ring after a mouse or touch pick (every menu,
  not only the currency's): focus returns without the ring now
  (`focusVisible: false`), the keyboard keeps it.
- Phone sheet: the currency menu was 288 px (`w-72`), now as wide as its row
  (`min-w-72`); a pick in any of its menus closes the sheet.

## Independent review (2026-11-05)

Fixed:
- **Critical:** the heat map's note said "Revenue in US dollars." under €
  cells; it follows the currency now.
- The Excel About sheet's source row said "amounts in USD" in a € file; the
  Currency row already says the data is USD.
- A currency change in another tab while the rule form was open read the
  typed number in the new currency (a threshold ~20 % off, saved silently):
  the form starts again in the new currency.
- A market exactly on a revenue threshold could flag in EUR/GBP but not in
  USD (the threshold was rounded, revenue not): thresholds are compared
  unrounded; only the form shows whole units.
- The highest threshold could pass the form in £ and fail on the server: the
  form checks the range on the USD it will send.
- The assistant's USD note also catches "dollars"; the header skeleton's
  currency block is `min-w-16` like the button.

To the backlog: six decimals for a USD rule edited in EUR/GBP; no guard
against a new raw dataset reader (owner's calls).

