# Market Ops Console — Design

Status: approved by the owner · 2026-11-03 · Release `0.1.0` · Plan 1 (foundation) built from it in `0.2.0`

Sources: brief (`Frontend Engineer - Assignment v1.docx`, summarised in `docs/STARTER_PACK.md`), contract `docs/CONTRACT.md`, data `data/data.json`, fixtures `data/fixtures.json`, decisions `docs/decisions/0001–0015`.

Marking: **[owner]** = decided by the owner in conversation. **[call]** = Claude's call, open to owner correction. Unmarked = required by the brief or already in an ADR.

---

## 0. Brief requirements → where they are covered

The brief (`.docx`) is kept outside the repo on purpose. Its "What your build must demonstrate" list and chat/dashboard requirements, paraphrased:

| Brief requirement | Spec |
| --- | --- |
| React 18+, TypeScript, Next.js App Router, typed data contract and stream events, no `any` | §3, ADR 0002 |
| Token-by-token streaming, in-progress states, stop | §7 Streaming |
| Citations to markets/products/periods | §7.3 |
| Honest confidence; abstain when data can't answer | §7.2, §7.5 |
| AI vs authoritative content distinct | §7.1, §7.4 |
| Drill-down portfolio → region → market → product without losing context | §6 URL state, §8 |
| Health at a glance: totals, trend, top movers, markets at risk | §8 widgets |
| Choropleth map by KPI, click to drill | §8 |
| Radar comparing markets/regions | §8 |
| Time series actual vs forecast vs prior year | §8 |
| One advanced chart: heat map (chosen) | §8, ADR 0004 |
| Executive vs analyst modes | §8 Modes |
| Coordinated views; URL reflects drill path, selection, filters; back/forward | §6, §8 Coordinated views |
| Accessible alternatives for every chart, keyboard, ARIA, not colour-only | §8, §11 |
| Multi-market formatting | §11 |
| Non-trivial schema-validated form, optimistic update + rollback | §9 |
| Component/integration tests + one E2E happy path | §12 |
| Deployed link, README sections a–k, screenshots | outside this spec |

Owner additions beyond the brief: four locales with translated UI, dark mode, phone tab bar, cookie-backed alert API, currency picker (0.12.0), error monitoring with Sentry (0.14.0, ADR 0019).

## 1. Intent

A commercial operations team tracks a portfolio of products across 13 country markets, compares performance with forecast and decides where to focus. The console has two connected surfaces over one dataset:

1. a **streaming assistant** that answers questions in natural language, cites its evidence, states its confidence honestly and refuses when the data cannot answer;
2. an **analytical dashboard** with drill-down from portfolio to product, a map, radar, time series and heat map, in two modes for two audiences.

The product promise is **trust**: users must be able to verify what the AI says against source-of-truth data, and never confuse the two.

The submission is assessed on engineering quality, taste and the reasoning in the README, not on AI backend sophistication.

## 2. Goals, non-goals, anti-goals

**Goals**
- Every requirement in the brief's "What your build must demonstrate" list works end to end.
- AI output and authoritative data are visually and structurally distinct everywhere.
- Static pages per locale, fast, accessible (WCAG 2.1 AA), typed end to end, no `any`.
- Works on desktop, tablet and phone.

**Non-goals**
- Real LLM, RAG, real backend, database, auth. Fixtures and mock routes only.
- Stretch goals (live mode, virtualised table, context-aware assistant, cmd-K, Storybook) **[owner]**: deferred; revisit only if all required work is done. Listed in README "what I'd do next".

**Anti-goals** (would be a failure even if it technically works)
- The UI rewrites, hides or "corrects" AI text. AI text is shown as received; data is shown next to it.
- A status or KPI is invented where the data does not provide it.
- Colour is the only signal anywhere.
- A shared link opens a different view than the sender saw (apart from locale-specific formatting).

## 3. Constraints

- Due 2026-11-09. Stack, architecture, git flow and tooling are fixed by ADRs 0001–0015 and `CLAUDE.md`.
- FSD v2.1; `src/pages` composes only (may read URL params and choose layout).
- Static rendering per locale: `app/[locale]/…`, `generateStaticParams`, `next/root-params` (ADR 0010).
- No string literals in markup; all formatting through next-intl global formats.

## 4. Data facts the design depends on

Verified by script on 2026-11-03.

- `series`: 1560 rows = 13 markets × 5 products × 24 months (`2024-06` … `2026-05`), no duplicates, no nulls. Fields: `actual`, `forecast`, `units`, `priorYear`.
- `markets[].kpis` (revenue, growthPct, sharePct, forecastAttainmentPct, status, anomalies) exist **only per market and only for the latest period** (`2026-05`).
- No status rule is documented. Spain is `off_track` at 104.5% attainment (growth −4.6%).
- Recomputed attainment differs from precomputed by up to ~1.1 pp (India 104.2 vs 103.1). Revenue differs by ±2 (rounding).
- Latest-period aggregates: portfolio $22.85M, 100.4% attainment, +7.3% YoY. APAC 104.9%, EU 95.4%, LATAM 98.0%, NA 101.0%.
- Non-on-track markets (latest): DE, ES `off_track`; GB, FR, IT, BR `at_risk` (6 of 13).
- One anomaly in the data: Germany, `2026-03`, dip. It shows as growth YoY (−31 % against −4…−10 % around it), not as attainment: the forecast fell in the same month, so attainment stays at 92 % (checked 2026-11-05).
- Fixture claims that contradict data: `at-risk` names 3 markets (data: 6); `summary-long` calls UK/France/Spain "close to plan" (data: at risk / off track); `forecast-miss` describes a portfolio miss (data: ~100% over 1–24 months).
- The map library (world-atlas `countries-110m`) identifies countries by **numeric ISO 3166 codes** (`276` = Germany); the data has `iso2`/`iso3`. All 13 markets exist in the atlas.
- Calendar Q2 2026 is incomplete (no June).

## 5. KPI and status rules [owner + call]

- **Status is shown only where the data has it**: markets, latest period, `range=1m` **[owner]**. With `range=3m/12m` status, the status map, "markets at risk" and the status part of Top risks are hidden with the same notice, because the stored status describes one month **[call]**. Regions, portfolio, products and earlier periods show "Status is available for the latest period only". No derived status rule.
- **Market KPIs at the latest period come from `markets[].kpis`** (source of truth) **[call]**. Exception: the Analyst markets table calculates every figure from `series`, so a row adds up (gap = revenue − forecast, attainment = revenue ÷ forecast) and its total is the sum of its rows; only share and status, which series do not hold, are the stored ones. The tiles, map and KPI cards keep the stored KPIs; the table's note says they can differ by about 1 point **[owner, 2026-11-04]**.
- **Everything else is computed from `series`** and labelled "Calculated" with a tooltip describing the formula **[call]**:
  - revenue = Σ actual; growth % = Σ actual / Σ priorYear − 1; attainment % = Σ actual / Σ forecast; units = Σ units.
  - Market share at region/portfolio level = revenue-weighted average of market `sharePct` (latest only); not available for past periods or products.
- The ~1 pp difference between precomputed and recomputed attainment is explained in the tooltip and README.
- "How many markets at risk" counts `at_risk` + `off_track` at the latest period; on past periods the tile shows "n/a" with the same explanation.

## 6. Information architecture

### Routes

| Route | Content |
| --- | --- |
| `/[locale]/` | redirects to `/[locale]/dashboard` [call] |
| `/[locale]/dashboard` | the console (dashboard + assistant + alerts) |
| `/api/v1/chat` | mock SSE (reference route, fixed to stop on client abort) **[owner: versioned]** |
| `/api/v1/data` | serves validated `data.json` [call] |
| `/api/v1/alerts` | mock alert rules API (cookie-backed) |
| `not-found`, `error`, `global-error` | localised 404 and error pages (see §11a) |
| `/[locale]/sentry-test`, `/api/v1/sentry-test` | Sentry test page and its API, a 404 unless `ENABLE_SENTRY_TEST_PAGE` is set (local only; ADR 0019) **[owner, 2026-11-06]** |

Locale prefix `as-needed`: `/dashboard` is `en-GB`; `/de-DE/dashboard`, `/en-US/dashboard`, `/ru-RU/dashboard` (ADR 0010).

### URL state (nuqs)

| Param | Values | Default |
| --- | --- | --- |
| `region` | `na` `eu` `apac` `latam` | none (portfolio) |
| `market` | market id | none |
| `product` | product id | none |
| `period` | `YYYY-MM` | `2026-05` |
| `range` | `1m` `3m` `12m` | `1m` [call] |
| `mode` | `executive` `analyst` | `executive` |
| `kpi` | map/heat-map metric: `status` `growth` `attainment` `share` `revenue`; the heat map has no months for status or share and shows growth YoY then **[owner, 2026-11-05]** | `status` |
| ~~`compare`~~ | dropped: the radar compares the selected markets (`markets`, first 4), else the open market and its neighbours or the open region's markets, else the regions **[owner, 2026-11-04 and 2026-11-05; 0.8.0]** | — |
| `markets` | selected markets: one list for the assistant ("Show on dashboard"), the map, the tiles and the table filter; rings on the map, narrows the Analyst table; repeated keys (`markets=de&markets=es`) **[owner, 2026-11-04]** | none |
| `sort` | markets table order: a column, `-` for descending (`sort=-growth`) **[owner, 2026-11-04]** | none (region, then name) |
| `tab` | `overview` `assistant` `alerts`: the phone's tabs; `alerts` also opens the desktop sheet, so a link opens the same panel everywhere; closing the sheet goes Back when the app opened it and replaces the entry when a link opened on it, so Back afterwards neither reopens it nor stays put **[owner, 2026-11-05; 0.9.0]** | `overview` |

Product drill-down **[call]**: `product` is always the last step under a `market` (brief hierarchy: portfolio → region → market → product). Selecting a product narrows series-based views to that product: KPI strip, time series and evidence use the market × product rows; map, market tiles and table, heat map and markets table show that product across the markets (so the user can compare one product across markets); status stays market level; share shows "not available per product" (the map falls back to attainment with a notice); radar stays market/region level. Moving to another market (map, tiles, top risks, top movers, breadcrumbs) **keeps the product**: every product is sold in every market; only picking the current market again in the breadcrumbs goes back up from the product **[owner, 2026-11-04]**.

Rules: drill-down params are hierarchical (setting `market` sets its `region`; clearing `region` clears `market`/`product`). Drill-down, selection and `mode` changes push history (Analyst is another screen to the user, so Back returns to the previous mode **[owner, 2026-11-04]**); cosmetic changes (`kpi`, `sort`) replace [call]. A drill clears the selection. `kpi` is read in Analyst only; Executive always shows `status` but keeps a valid `kpi` in the URL for the way back **[owner, 2026-11-04]**. The app name links to the clean dashboard: one history step that resets every param (phone: "Reset view" in the ⚙︎ sheet) **[owner, 2026-11-04]**. **Share link** at the end of the title row (every level, both modes) puts the page's address on the clipboard: an outline button with a share icon and its name from `sm` up, a 44 px icon below; "Link copied" is read out and the icon turns into a check for 2 s; a blocked clipboard shows a toast pointing to the address bar. The language is in the address (a prefix; English, the default, has none, so a viewer who chose another language gets theirs). **[owner, 2026-11-06]**. Invalid params (including a market listed twice in `markets`) fall back to defaults silently, and the URL is corrected in place (no history entry) so a link has one spelling; defaults (`period` = latest, `range=1m`, `mode=executive`, no `sort`) are not written (`normalizeDashboardState`, 0.5.0).

`range` label is "1 month / 3 months / 12 months", ending at `period`; never "quarter" (calendar Q2 2026 is incomplete) **[owner approved]**.

### Layout

- **Desktop** **[owner]**: header + dashboard; assistant is a **persistent right panel, collapsible**. Collapsed state is a per-browser preference (not in URL) [call]. A badge shows a new answer while collapsed [call]. Alerts open as a right-side sheet from the header's bell (`tab=alerts`, 0.9.0) **[owner, 2026-11-05]**.
- **Tablet** [call]: same as desktop, assistant panel overlays when opened; navigation rail optional if needed.
- **Phone** **[owner]**: bottom tab bar: **Overview · Assistant · Alerts** (labels always shown, 44×44 targets, badge on Assistant). Assistant is full screen (the header hides on that tab). Locale, theme and "Reset view" sit behind a ⚙︎ button in the header and open as a sheet. Period and filters open as short sheets with a Close button and back-gesture support. Default mode on phone is Executive [call].
- **Header** (all sizes): drill-down breadcrumbs (each step lists its siblings; the product step appears under a market **[owner]**), period + range (a month grid with a year switch built from `Popover` + `Button`, no day grid **[owner, 2026-11-04]**), Executive/Analyst switch, alerts button with the number of flagged markets (desktop; phones have the Alerts tab with the same number), locale, theme. Phone: the app name and ⚙︎ on the first row, the path below, period and mode full width under it **[owner, 2026-11-04]**.

## 7. Assistant

### Streaming

- `POST /api/v1/chat {question}` → SSE per `docs/CONTRACT.md`. Parsed with `eventsource-parser`, each event validated by a zod discriminated union (`token` | `done` | `error`). State in `useChatStream` (`useReducer`). Stop = `AbortController` (ADR 0003).
- Message states: `streaming` → `done` | `stopped` | `error`. Stopped messages keep their partial text and show "Stopped — answer incomplete"; no citations/confidence are shown for them [call].
- Input is disabled while streaming; the Send button becomes Stop. Esc also stops [call].
- Auto-scroll only while the user is at the bottom; otherwise show "↓ New content" [call].
- History is kept in `sessionStorage` **[owner, 2026-11-04]**: it survives a reload of the same tab and ends with the tab; a new tab starts empty. Versioned and validated on read (`mo:chat:v1`), last 50 messages, written when a message starts or ends (not per token), an answer cut by the reload comes back as stopped; restored answers do not count as unread. localStorage was rejected (shared computers, races between tabs). "New chat" in the header clears it (disabled when empty) and puts focus in the composer, except on touch screens, where that would open the keyboard. Each question is independent (fixtures are stateless).
- The reference route is fixed so it stops enqueuing when the client aborts (otherwise it throws on a closed controller).

### Message anatomy [owner + call]

1. **AI answer** on its own surface token, with ✦ icon and the label "AI answer · may be incomplete". Text rendered as plain paragraphs (split on blank lines), never as HTML.
2. **Confidence** from `done.confidence`: icon + word (High / Medium / Low). Low adds "Treat as directional".
3. **Sources** (answer level, not per claim **[owner, 2026-11-04]**: the contract carries no positions in the text, and guessing them would mean parsing AI text; the README explains this): one button per citation, labelled from `citation.label` (fallback: resolved names + formatted period). Hover/focus/tap shows an evidence card with the real numbers for that entity and period (revenue, attainment, growth, units, status if available, mini trend). Click focuses the dashboard on that entity and period (phone: switches to Overview; back returns to Assistant).
4. **"What the data shows"** block (authoritative surface, ▣ icon), header: "Market performance · latest period: May 2026 · updated 9 June 2026" (from `meta.latestPeriod`, `meta.generatedAt`, formatted per locale) **[owner]**. Contents:
   - always: a portfolio row for the latest period (revenue, attainment, growth) — this surfaces the `forecast-miss` contradiction **[owner approved]**;
   - one row per cited market/region/product with real KPIs and status where available;
   - **discrepancy rule** (deterministic, no AI; "mentioned" = present in citations, answer text is never parsed) **[owner]**:
     - *market list*: if **two or more** markets are cited and all are non-on-track, list every non-on-track market from the data and mark the uncited ones "Not mentioned";
     - *region gaps*: for every cited region, its row lists the region's non-on-track markets that are not cited;
     - a market found by both rules is listed once (under "Not mentioned");
     - verified against fixtures: `at-risk` and `forecast-miss` find gaps (+ ES, FR, GB); `apac-vs-europe` (all 5 EU markets non-on-track); `summary-long` (ES, FR, GB, IT); `germany-dip` finds none; `next-year`, `error`, `default` have no block;
   - Spain-type rows show the reason next to the status (e.g. "Growth −4.6% YoY") [call];
   - button "Show on dashboard" highlights the listed markets on the map and table **[owner]**.
   - Collapsed by default, also when a rule finds a gap; the header then shows "N markets not mentioned" **[owner, revised 2026-11-03]**. Hidden when the answer has no citations (e.g. `default`). "Show on dashboard" resets the scope to the portfolio and the latest month, then sets `markets` **[owner, 2026-11-04]**.
5. **Can't answer** (`kind: abstain`, an answer with `low_confidence` and no citations, or a non-English question answered on the client with "I only understand English"): distinct style with the ⊘ icon, "I can't answer this from the data"; the suggested questions appear after two such replies in a row **[owner, revised 2026-11-03]**. The kind is known only at `done`, so while streaming the answer sits in a neutral frame (no AI colour yet) with "Sources and confidence appear when the answer is complete" **[owner, revised 2026-11-03]**.
5a. **Answer actions** under a finished answer **[owner, 2026-11-04]**: Copy (text, sources, confidence with "Treat as directional" for Low, and the AI label as plain text), 👍 Helpful / 👎 Not helpful with a reason (wrong numbers, didn't answer, missing markets or periods, something else); one rating per answer, locked once logged (👎 can still become 👍 before a reason is picked); "Thanks" and a failed copy are toasts at the top centre, "Copied" shows for 2 s; feedback is logged through `logEvent` without the question text.
6. **Error** (`error` event or network failure): error style, a translated message for the cause (server, network, timeout, invalid data), Retry. The server's own text goes to the console log, not to the user.

### Empty state [call]

Four suggested questions (buttons) taken from the brief: risks this quarter, Germany's dip, APAC vs Europe, the forecast miss. Verified to route to the intended fixtures.

## 8. Dashboard

### Modes **[owner]**

- **Executive**: KPI strip (revenue, forecast attainment, growth, markets at risk), market status, top risks, revenue trend (one chart). Minimal numbers. Layout = variant A (ADR 0014 checkpoint): title, KPI cards, market status (two thirds) next to top risks, trend (two thirds) next to top movers **[owner, 2026-11-04]**. Top movers are in Executive because the brief lists them under "health at a glance" **[owner, 2026-11-04]**.
- Both: the page title carries the view's name as a badge ("Executive view" / "Analyst view") and a line of what it shows (Analyst: what it adds below), read out when it changes, so a switch shows at the top on every screen **[owner, 2026-11-05]**.
- **Analyst**: everything above plus metric picker on the map, radar, time series with units (table column and tooltip, 0.7.0), heat map, dense markets table with all KPIs, sort and filter.

### Widgets [call unless noted]

| Widget | Behaviour |
| --- | --- |
| KPI strip | values for current scope and period/range; 12-month sparkline; "Calculated" badge where applicable (its name carries the formula); off the latest month "Markets at risk" says why and offers the latest month |
| Market status (0.5.0, map 0.6.0) | one card with a `Map / Tiles / Table` switch, remembered per browser (map from the md width, tiles on a phone). Tiles (variant A): code, status shape, attainment, off-track hatched. Selected markets (`markets`: assistant, map, tiles, filter) ringed and named "selected", the open market outlined and named "open now"; click = drill into market; a drill shows its region only (the map keeps every market, other regions as plain land with an outline); off the latest month attainment only with a notice; the table adds the map metric's column (the Analyst picker shows with the map and the table) **[owner: A tiles in M1, the map joins in M2]** |
| Top movers | up to 3 highest and 3 lowest by YoY growth in the window, markets of the scope's region (a chosen market is marked among its neighbours; a product narrows each market to it); small regions are split so no market appears twice; labelled "highest / lowest growth" (a market can be lowest and still grow), red bar only for a decline; a row drills in (0.5.0) |
| Top risks | non-on-track markets, sorted off-track first, then by attainment; then on-track markets the alert rules flag, critical first; every flagged row shows the bell and names its rules (0.9.0). Latest 1-month view only, like the status list **[owner, 2026-11-05]** |
| Market map (0.6.0) | choropleth by `kpi` (Analyst picker; Executive = `status`), Equal Earth without Antarctica, no labels. Stepped scales judged by the shown value (one decimal; an edge belongs to the upper step): attainment `<94 · 94–98 · 98–102 · 102–105 · ≥105 %`, growth `<−5 · −5…−1 · −1…+1 · 1–5 · 5–10 · ≥10 %`, share `<10 · 10–15 · 15–20 · 20–30 · ≥30 %`, revenue `<1 · 1–1.5 · 1.5–2 · 2–3 · ≥3 M$` per month × the months in the window; diverging orange · grey · blue, sequential blue (`--scale-div-*`, `--scale-seq-*`). Status: colour + pattern (at risk dotted, off track hatched); legend with counts for the scope. `status` or `share` off the latest 1-month view, or share with a product → attainment with a notice. Mouse: hover tooltip, click drills; touch: tap opens the tooltip with an "Open" button, one finger scrolls the page, pinch zooms; Ctrl/⌘ + wheel zooms; `+ / − / Whole world` buttons. A drill or the assistant's markets fly the map to fit; a page opened with one starts on the fit, never on the whole world first **[owner, 2026-11-05]**; a hand-set zoom survives month, window and metric changes. Keyboard: markets in Tab order by region then name, accessible name with value and status, Enter drills, Esc hides the tooltip; countries without a market are not focusable **[owner, 2026-11-04]** |
| Comparison radar (0.8.0) | up to 4 lines, first match wins: the selected markets (`markets`, "Showing the first 4 of N"), so one selection moves the map, the table, the radar and the heat map **[owner, 2026-11-04]**; else the open market and its region's neighbours (it first); else the open region's markets; else the four regions **[owner, 2026-11-05]**; always against a grey dashed portfolio average **[owner, 2026-11-05]**; axes: growth, attainment, share, revenue, momentum (growth YoY over the 3 months to `period` minus the 3 months before, in pp **[owner, 2026-11-05]**); each axis scaled worst → best across the compared kind's peers (13 markets or 4 regions), the portfolio's revenue as the peers' mean; follows `period`/`range`, ignores a product (says so); an axis without data (share off the latest 1-month view, momentum before the sixth month) is removed with a note, never drawn at the centre; four `series-*` colours with a dash and marker each; tooltip and table with real values; under Top risks next to the map **[owner, 2026-11-05]** |
| Time series | actual vs forecast vs prior year for the current scope; anomalies from data marked with a labelled point (handles a list, not just one); the selected month a dashed labelled line, a 3/12-month window a labelled band **[owner, 2026-11-04]**; tooltip rows carry each line's sample; units in tooltip (M3); table alternative. Executive shows it as the revenue trend (0.5.0) |
| Heat map (0.8.0) | Analyst, full width under the markets table **[owner, 2026-11-05]**. The scope's markets (like the tiles; the open market marked "open now", a product narrows each market) × 24 months, coloured by the map's metric and steps per month (`kpi`; status and share → growth YoY with a notice) **[owner, 2026-11-05]**; text colour per step (`scale-*-foreground`); whole numbers in cells, one decimal and the anomaly note in a line under the grid; ⚠ on anomaly cells; the window marked on its headers and cells; selected markets marked in their row, never filtered out **[owner, 2026-11-05]**. HTML table as an ARIA grid: one Tab stop, arrows, Home/End, Ctrl+Home/End; Enter or click opens the market at that month (range kept), Shift+click / Shift+Enter selects; touch: a tap shows the cell, the line under the grid has Open and Select. Phone: scrolls sideways, market column sticky, opens at the selected month **[owner, 2026-11-05]**. Calculated from series (says it can differ from stored KPIs by about a point); the data's anomaly notes are per market, so a product view calls them the whole market's; table alternative with the ⚠ marks, the anomaly notes, "selected" and "open now" |
| Markets table (0.7.0) | Analyst only, full width under the map row. The scope's markets like the tiles (a market drill shows its region, that row marked current; a product narrows each market to it). Columns: market (code + name, a button that drills in, sticky on small screens; an anomaly from the data in the window shows as a ⚠ button with its note), region, revenue, forecast, gap to forecast, attainment, prior year, growth, share, units, status; every figure is calculated from series (§5 exception), share and status are stored; share/status "—" where the data has none, with a note. Headers sort through `sort` (numbers high to low first, names A–Z, status worst first; missing values last). Filter: `Markets ▾` menu with "At risk or off track" (latest month only), a line per region (all / none, a dash when part of it), a checkbox per market of the scope and "Clear all"; "N of M selected" next to it; removable chips on the row below; selected markets outside the scope leave an empty state. A total row over the rows shown (sums; attainment and growth Σ/Σ from series; share revenue-weighted), calculated. `Export ▾` of the rows as shown (filter, sort, period, range): **Excel (.xlsx)** for people — sheet *Markets*: a title row, an Excel table (banded, filter buttons) with the header frozen and the market column frozen and shaded, $ and % formats, status and negative gap/growth coloured (words stay), a total row under it with SUBTOTAL so it follows the Excel filter; sheet *By month*: market × month of the window (dated, actual, forecast, prior year, units) for pivots; sheet *About*: source and date, view, product, selection, order, how values are made, a link back — and **CSV** for tools (raw USD and percent numbers, English snake_case headers incl. iso2, forecast, prior year and anomaly, UTF-8 BOM, CRLF, formula-injection guard); no total; file `markets-<period>-<range>[-<product>].xlsx/.csv`. While the workbook is made the button says "Preparing…" and a second click waits; any failure (ExcelJS chunk, workbook, download refused) is logged and shown as a toast, the dashboard stays (ADR 0013). A plain CSV opened as one column in Excel with Russian regional settings (they expect `;` and a decimal comma), hence Excel **[owner, 2026-11-04]** |

### Coordinated views

- Map/table/heat-map click → drill into market (URL `market`).
- Heat-map cell → also sets `period`; radar and time series follow `period`/`range`.
- Multi-select markets (Analyst): Shift+click or Shift+Enter on a market of the scope on the map or the tiles, the touch tooltip's "Add to filter", or the table's `Markets ▾` filter → `markets` param → table narrows (0.7.0 **[owner, 2026-11-04]**; the heat map's Shift+click / Shift+Enter in 0.8.0). The Market status card shows the selection as a bar ("Selected", chips, Clear) in both modes, so a selection from the assistant can be removed in Executive too. A pick on the map keeps the map still; a selection from the assistant or the filter flies the map to it. Replaces the brief's "brush the scatter" example (heat map chosen over scatter, ADR 0004).
- Citation click and "Show on dashboard" → same URL mechanisms.

### States

- Skeletons while loading; widgets that depend on URL state render inside `Suspense` with a skeleton (static HTML has no search params; ADR 0010). An Analyst link marks `<html>` before the first paint (`data-mode`, ADR 0015), so the static skeletons already hold the markets table, the map card's Analyst controls, the radar and the heat map (0.8.0) and the page does not grow on load (0.7.0 **[owner, 2026-11-04]**). What depends on the alert rules (loaded after the page) waits for them without moving: the status table's Alerts column keeps a set width with a placeholder instead of "None", Top risks shows its skeleton (its order and bells depend on the rules), the Analyst table keeps the bell's place (0.14.0 **[owner, 2026-11-06]**).
- Popups (menus, popovers, tooltips) opened in the dashboard stay within its scroll area and hide when their trigger scrolls under the header (0.7.0).
- Each widget has its own error boundary with Retry naming the widget; one failing widget does not break the page. A failed dataset (every widget would fail together) is one page message with one Retry (0.5.0).
- Empty states (e.g. no markets match filter) with a reset action.

## 9. Alerts **[owner approved; built in 0.9.0, owner decisions 2026-11-05]**

- Opened from the header's bell (desktop: right sheet) or the Alerts tab (phone), both `tab=alerts`. The phone tab hides the header like the Assistant tab.
- Two tabs, **Firing · N** (opened by the bell) and **Rules · N**, with **New rule** always next to them; the form takes the whole panel with Back, and a save lands on Rules **[owner, 2026-11-05]**. Firing: one row per flagged market, critical first, each rule with the market's figure and the threshold ("Share 8.9% · below 10%") and Open, which opens the market and leaves the panel. There are no notifications in time: the data never changes, so a rule can only flag.
- Rule fields: name; metric (growth %, attainment %, share %, revenue); operator (below / above, strict); threshold (revenue typed in M$, a comma or a dot); scope (all markets / one region / chosen markets, a list with checkboxes by region that starts with the dashboard's `markets`); severity (warning / critical); enabled.
- Validation: one zod schema in `shared/api/alerts` for the form and the route: threshold range per metric (growth −100…100, attainment 0…200, share 0…100, revenue ≥ 0); at least one market when scope is "markets"; a name of 1–60 characters, unique ignoring case and outer spaces; max 10 rules. Messages translated, next to their field (`aria-invalid`, `aria-describedby`), after a field is left or on save; the first wrong field takes focus.
- Rules judge **the latest month** (stored `markets[].kpis`, spec §5), whatever month the dashboard shows; market level only (a product does not change them).
- Live preview: "Would flag N markets now (May 2026): …", or why there is none.
- First visit (no cookie): two example rules, "Attainment below 95%" (critical) and "Share below 10%" (warning), named in the page's language; stored on the first write.
- Save: `/api/v1/alerts` (GET/POST/PATCH ?id/DELETE ?id) keeps the list in one deflated httpOnly cookie (Vercel has no shared memory between requests). ~1200 ms latency on writes (`MOCK_ALERTS_DELAY_MS`, so "Saving…" can be seen) **[owner, 2026-11-05]**; reads answer at once, and widgets show a placeholder, not "None", until the rules arrive (0.14.0, owner: no layout shift). Writes must be same-origin and JSON; errors `400 invalid_request`, `403 forbidden`, `404 not_found`, `409 duplicate_name` / `too_many`, mapped to messages.
- Optimistic update via TanStack Query (not Server Actions + `useOptimistic`, ADR 0016): a new rule appears at once with a spinner and "Saving…" (the row dimmed, `aria-busy`), a toggle or an edit changes at once, a delete (after a confirmation) goes at once; on failure exactly that write is undone (a write made meanwhile stays) and a toast says "Couldn't save — restored previous state" with the reason and Retry; the same Retry (and Dismiss) shows in the rule's row, where the keyboard can reach it inside the modal sheet; the two Retry buttons are one action and the row's close the toast **[owner, 2026-11-05, 0.11.0]**. When the server confirms a new or edited rule, a toast says how many markets it flags now, with "Show" (focus to the firing list) **[owner, 2026-11-05]**. A "Fail the next save (demo)" switch makes the next write answer 503 once. Writes reach the server one at a time (the mock keeps the whole list in one cookie) and name the page's locale, so the first write keeps the examples in its language **[agent review, 2026-11-05]**.
- Effects: flagged markets get a bell (ringing = critical) with the rule names as text in Top risks (on-track markets added), the markets table and the map's tooltip and table view (no icon drawn on the map); the header and the Alerts tab count them. Not on the tiles or the heat map **[owner, 2026-11-05]**.

## 10. Data loading and state [call]

- Dataset: `/api/v1/data` returns `data.json` validated by zod; fetched with TanStack Query; prefetched in the server component at build time and hydrated, so static HTML already contains the data. `staleTime: Infinity` (static data).
- Alert rules: TanStack Query against `/api/v1/alerts` (`entities/alert-rule`, never suspends: while it loads `useAlertFlags` says `pending` and widgets show placeholders; a failed list hides only the bells); writes in `features/configure-alerts`.
- Selectors (pure functions in `entities/*/model`) compute every aggregate from the validated dataset; no component computes KPIs inline.
- Market ↔ map join: `iso3 → numeric ISO` table in `entities/performance` (`ISO3_TO_NUMERIC`).

## 11. Cross-cutting

- **i18n** (ADR 0010): `en-GB` default, `en-US`, `de-DE`, `ru-RU`; `en.json` shared by both English locales. Assistant answers and market/product names stay English; the AI surface says so.
- **Theme** (ADR 0009): light/dark/system; every token has both values; heat-map scale contrast-checked in both.
- **Accessibility**: keyboard reachable everything (inside a modal sheet too: a toast's action is repeated in the panel), visible focus (on the map drawn above every layer), focus returned after an overlay or a removed control, skip link, landmarks, live region announcing "Answer complete"/"Stopped"/errors (not every token) [call], `prefers-reduced-motion` respected, chart table alternatives, no colour-only signals.
- **Formatting**: ~~currency USD always (no conversion)~~ amounts in USD, EUR or GBP at fixed demo rates, bare symbols (ADR 0017) **[owner, 2026-11-05]**, compact numbers, signed percentages, months per locale.

## 11a. Resilience **[owner]**

**API versioning.** All routes live under `/api/v1/*`. Paths are defined once in `src/shared/config/api-routes.ts`; no hard-coded URLs elsewhere.

**Timeouts.** One shared client in `src/shared/api` wraps `fetch`, combining the caller's `AbortSignal` with a timeout (`AbortSignal.any` + `AbortSignal.timeout`). Errors are typed: `TimeoutError`, `NetworkError`, `HttpError(status)`, `ParseError` (zod), each mapped to a translated message. Values [call]:
- `/api/v1/data` and `/api/v1/alerts`: 8 s total.
- `/api/v1/chat` (stream): 10 s to the first event, then 15 s maximum gap between events (idle timeout); no total limit, so long answers are not cut. A timed-out stream ends in the error state with Retry; partial text is kept and labelled incomplete.
- TanStack Query: queries retry once on network/timeout errors, never on 4xx or parse errors; mutations never retry (rollback instead).

**Error monitoring** (0.14.0, owner, ADR 0019). Every error the app logs goes to Sentry through `logError` / `logWarning` / `logEvent`; expected failures stay breadcrumbs; no IP, cookies, headers, bodies or question text; events go through our own `/monitoring` path. Every `console.log` / `warn` / `error` line goes to Sentry Logs (owner), so nothing personal is printed.

**Offline guard.** `features/network-status`: `navigator.onLine` + `online`/`offline` events via `useSyncExternalStore`. When offline, a full-screen guard ("You're offline — we'll reconnect automatically", Retry button) covers the app; the app stays mounted underneath so chat history, form drafts and URL state survive [call: overlay, not unmount]. It disappears on the `online` event. Caveat noted in README: `navigator.onLine` only reports the network interface, so a request can still fail while "online"; that case is handled by the timeouts/errors above.

**Error and status pages** (all localised, same visual system):
- `app/[locale]/not-found.tsx` — 404 (unknown route, invalid locale via `hasLocale` → `notFound()`, unknown market/region/product ids in URL fall back to defaults instead of 404 [call]).
- `app/[locale]/error.tsx` — 500-style page for render errors in a route, with Retry (`reset()`) and a link home.
- `app/global-error.tsx` — last resort when the root layout fails; providers are not available there, so it imports the dictionaries directly and speaks the address's language (0.13.0, ADR 0018; until then English only).
- Per-widget error boundaries (§8 States) so one widget failing does not trigger the page.
- API routes return JSON errors `{ error: { code, message } }` with proper status (400 invalid body, 404, 500); the mock chat route keeps the SSE `error` event from the contract.

## 12. Testing (ADR 0008)

Unit: SSE parsing, schemas, selectors, formatters, chat reducer, discrepancy rule, alert validation, fetch client timeouts and error mapping, online-status hook. Component/integration (MSW): streaming, stop, abstain/low/error, citations and data block, drill-down → URL, optimistic rollback, chart table alternatives. Playwright (0.10.0, ADR 0008): the happy path; Back/Forward and a shared link; the alert form's optimistic save and rollback on the real route; the assistant's error, can't-answer and Stop; Excel/CSV downloads; offline and a failing alerts API; the phone tab bar; axe scans on desktop and phone; the map with a keyboard when zoomed in and with a tap, Retry by keyboard inside the alerts sheet, focus kept across the offline notice (0.11.0). Locally (`pnpm e2e`) and on PRs into `develop`.

## 13. Dependencies beyond ADR 0002 **[owner approved]**

- `world-atlas` (`countries-110m.json`, served locally, no CDN) for map shapes; `topojson-client` comes with `react-simple-maps`.
- `exceljs` (0.7.0) for the Excel export of the markets table, loaded only when a file is made (its own ~256 KB gzip chunk, not in the first load) **[owner, 2026-11-04]**.
- `sonner` (shadcn toast) for the rollback message, answer-feedback thanks and a failed copy **[2026-11-04]**.
- `@sentry/nextjs` (0.14.0) for error monitoring, traces and logs (every console line), off without a DSN, no personal data (ADR 0019) **[owner, 2026-11-06]**.

## 14. Cut line if time runs short **[owner]**

Drop in this order: (1) German and Russian **translations** (formatting for all four locales stays; copy English only); (2) tablet-specific layout; (3) radar following `period`/`range` (latest month only); (4) multi-select on the heat map (map and table keep it). Items 3 and 4 were built in 0.8.0, so the line now ends at 2.

Never cut: streaming + trust surfaces, drill-down + URL state, the four charts with accessible alternatives, both modes, the alerts form with rollback, tests, deployment, README.

## 15. Left to the builder

- Exact visual design, spacing, typography. The design is a **planned step, not an existing input**: ui-ux-pro-max direction → Claude Design artifact → owner review. The plan front-loads non-UI work (schemas, selectors, SSE hook, API routes, tests) and starts UI work only after the design is approved.
- Component breakdown inside slices, file names, test file layout within the rules.
- Copy wording (within the meanings above), skeleton shapes, animation details.
- Normalisation method for the radar's revenue axis (0.8.0: every axis worst → best across the compared kind's peers, see §8).
