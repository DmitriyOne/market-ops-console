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

Owner additions beyond the brief: four locales with translated UI, dark mode, phone tab bar, cookie-backed alert API.

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
- One anomaly in the data: Germany, `2026-03`, dip.
- Fixture claims that contradict data: `at-risk` names 3 markets (data: 6); `summary-long` calls UK/France/Spain "close to plan" (data: at risk / off track); `forecast-miss` describes a portfolio miss (data: ~100% over 1–24 months).
- The map library (world-atlas `countries-110m`) identifies countries by **numeric ISO 3166 codes** (`276` = Germany); the data has `iso2`/`iso3`. All 13 markets exist in the atlas.
- Calendar Q2 2026 is incomplete (no June).

## 5. KPI and status rules [owner + call]

- **Status is shown only where the data has it**: markets, latest period, `range=1m` **[owner]**. With `range=3m/12m` status, the status map, "markets at risk" and the status part of Top risks are hidden with the same notice, because the stored status describes one month **[call]**. Regions, portfolio, products and earlier periods show "Status is available for the latest period only". No derived status rule.
- **Market KPIs at the latest period come from `markets[].kpis`** (source of truth) **[call]**.
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
| `kpi` | map/heat-map metric: `status` `growth` `attainment` `share` `revenue` | `status` |
| `compare` | up to 4 market or region ids | none |
| `markets` | multi-selection filter for the analyst table; repeated keys (`markets=de&markets=es`) | none |
| `tab` | `overview` `assistant` `alerts` (phones only) [call] | `overview` |

Product drill-down **[call]**: `product` is always the last step under a `market` (brief hierarchy: portfolio → region → market → product). Selecting a product narrows series-based views to that product: KPI strip, time series and evidence use the market × product rows; map, market tiles and table, heat map and markets table show that product across the markets (so the user can compare one product across markets); status stays market level; share shows "not available per product" (the map falls back to attainment with a notice); radar stays market/region level. Moving to another market (map, tiles, top risks, top movers, breadcrumbs) **keeps the product**: every product is sold in every market; only picking the current market again in the breadcrumbs goes back up from the product **[owner, 2026-11-04]**.

Rules: drill-down params are hierarchical (setting `market` sets its `region`; clearing `region` clears `market`/`product`). Drill-down, selection and `mode` changes push history (Analyst is another screen to the user, so Back returns to the previous mode **[owner, 2026-11-04]**); cosmetic changes (`kpi`) replace [call]. `kpi` is read in Analyst only; Executive always shows `status` but keeps a valid `kpi` in the URL for the way back **[owner, 2026-11-04]**. The app name links to the clean dashboard: one history step that resets every param (phone: "Reset view" in the ⚙︎ sheet) **[owner, 2026-11-04]**. Invalid params fall back to defaults silently, and the URL is corrected in place (no history entry) so a link has one spelling; defaults (`period` = latest, `range=1m`, `mode=executive`) are not written (`normalizeDashboardState`, 0.5.0).

`range` label is "1 month / 3 months / 12 months", ending at `period`; never "quarter" (calendar Q2 2026 is incomplete) **[owner approved]**.

### Layout

- **Desktop** **[owner]**: header + dashboard; assistant is a **persistent right panel, collapsible**. Collapsed state is a per-browser preference (not in URL) [call]. A badge shows a new answer while collapsed [call]. Alerts open as a right-side sheet from the header [call].
- **Tablet** [call]: same as desktop, assistant panel overlays when opened; navigation rail optional if needed.
- **Phone** **[owner]**: bottom tab bar: **Overview · Assistant · Alerts** (labels always shown, 44×44 targets, badge on Assistant). Assistant is full screen (the header hides on that tab). Locale, theme and "Reset view" sit behind a ⚙︎ button in the header and open as a sheet. Period and filters open as short sheets with a Close button and back-gesture support. Default mode on phone is Executive [call].
- **Header** (all sizes): drill-down breadcrumbs (each step lists its siblings; the product step appears under a market **[owner]**), period + range (a month grid with a year switch built from `Popover` + `Button`, no day grid **[owner, 2026-11-04]**), Executive/Analyst switch, alerts button with count, locale, theme. Phone: the app name and ⚙︎ on the first row, the path below, period and mode full width under it **[owner, 2026-11-04]**.

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
- **Analyst**: everything above plus metric picker on the map, radar, time series with units, heat map, dense markets table with all KPIs, sort and filter.

### Widgets [call unless noted]

| Widget | Behaviour |
| --- | --- |
| KPI strip | values for current scope and period/range; 12-month sparkline; "Calculated" badge where applicable (its name carries the formula); off the latest month "Markets at risk" says why and offers the latest month |
| Market status (0.5.0, map 0.6.0) | one card with a `Map / Tiles / Table` switch, remembered per browser (map from the md width, tiles on a phone). Tiles (variant A): code, status shape, attainment, off-track hatched. Markets from "Show on dashboard" ringed and named as highlighted; click = drill into market; a drill shows its region only (the map keeps every market, other regions as plain land with an outline); off the latest month attainment only with a notice; the table adds the map metric's column (the Analyst picker shows with the map and the table) **[owner: A tiles in M1, the map joins in M2]** |
| Top movers | up to 3 highest and 3 lowest by YoY growth in the window, markets of the scope's region (a chosen market is marked among its neighbours; a product narrows each market to it); small regions are split so no market appears twice; labelled "highest / lowest growth" (a market can be lowest and still grow), red bar only for a decline; a row drills in (0.5.0) |
| Top risks | non-on-track markets, sorted off-track first, then by attainment; markets flagged by alert rules included with 🔔 |
| Market map (0.6.0) | choropleth by `kpi` (Analyst picker; Executive = `status`), Equal Earth without Antarctica, no labels. Stepped scales judged by the shown value (one decimal; an edge belongs to the upper step): attainment `<94 · 94–98 · 98–102 · 102–105 · ≥105 %`, growth `<−5 · −5…−1 · −1…+1 · 1–5 · 5–10 · ≥10 %`, share `<10 · 10–15 · 15–20 · 20–30 · ≥30 %`, revenue `<1 · 1–1.5 · 1.5–2 · 2–3 · ≥3 M$` per month × the months in the window; diverging orange · grey · blue, sequential blue (`--scale-div-*`, `--scale-seq-*`). Status: colour + pattern (at risk dotted, off track hatched); legend with counts for the scope. `status` or `share` off the latest 1-month view, or share with a product → attainment with a notice. Mouse: hover tooltip, click drills; touch: tap opens the tooltip with an "Open" button, one finger scrolls the page, pinch zooms; Ctrl/⌘ + wheel zooms; `+ / − / Whole world` buttons. A drill or the assistant's markets fly the map to fit; a hand-set zoom survives month, window and metric changes. Keyboard: markets in Tab order by region then name, accessible name with value and status, Enter drills, Esc hides the tooltip; countries without a market are not focusable **[owner, 2026-11-04]** |
| Comparison radar | up to 4 markets or regions, axes: growth, attainment, share, revenue (normalised), momentum (3-month change); follows `period`/`range` (computed values labelled); add via "+ Compare" in table/map; table alternative |
| Time series | actual vs forecast vs prior year for the current scope; anomalies from data marked with a labelled point (handles a list, not just one); the selected month a dashed labelled line, a 3/12-month window a labelled band **[owner, 2026-11-04]**; tooltip rows carry each line's sample; units in tooltip (M3); table alternative. Executive shows it as the revenue trend (0.5.0) |
| Heat map | markets × 24 months, attainment on a diverging scale centred on 100%, values readable on focus; arrow-key navigation; click = select market + period; table alternative |
| Markets table | analyst only; all KPIs incl. units; sort; filtered by `markets` selection; horizontal scroll with sticky first column on small screens; "Export CSV" of the rows as shown (filter, sort, period, range), raw numbers so any locale's spreadsheet reads them, file `markets-<period>-<range>.csv` **[owner, 2026-11-04; M3]** |

### Coordinated views

- Map/table/heat-map click → drill into market (URL `market`).
- Heat-map cell → also sets `period`; radar and time series follow `period`/`range`.
- Multi-select markets on map or heat map (Shift+click / long-press) → `markets` param → table narrows (M3, with the markets table **[owner, 2026-11-04]**) (replaces the brief's "brush the scatter" example; heat map chosen over scatter, ADR 0004).
- Citation click and "Show on dashboard" → same URL mechanisms.

### States

- Skeletons while loading; widgets that depend on URL state render inside `Suspense` with a skeleton (static HTML has no search params; ADR 0010).
- Each widget has its own error boundary with Retry naming the widget; one failing widget does not break the page. A failed dataset (every widget would fail together) is one page message with one Retry (0.5.0).
- Empty states (e.g. no markets match filter) with a reset action.

## 9. Alerts **[owner approved]**

- Opened from the header (desktop: right sheet) or the Alerts tab (phone).
- Rule fields: name; metric (growth %, attainment %, share %, revenue); operator (below / above); threshold; scope (portfolio / region / selected markets); severity (warning / critical); enabled.
- Validation (zod, messages translated): threshold range per metric (growth −100…100, attainment 0…200, share 0…100, revenue ≥ 0); at least one market when scope is "markets"; unique name; max 10 rules.
- Live preview: "Would flag N markets now: …", computed from latest-period data.
- Save: `/api/v1/alerts` (GET/POST/PATCH/DELETE) persists rules in a cookie (Vercel has no shared memory between requests). Artificial latency ~600 ms [call].
- Optimistic update via TanStack Query: rule appears at once as "Saving…"; on failure it is rolled back and a toast says "Couldn't save — restored previous state". A "Simulate failure" switch in the panel forces the next request to fail (demo and tests).
- Effects: flagged markets get 🔔 on map and table; header shows count; executive "Top risks" includes them.

## 10. Data loading and state [call]

- Dataset: `/api/v1/data` returns `data.json` validated by zod; fetched with TanStack Query; prefetched in the server component at build time and hydrated, so static HTML already contains the data. `staleTime: Infinity` (static data).
- Alert rules: TanStack Query against `/api/v1/alerts`.
- Selectors (pure functions in `entities/*/model`) compute every aggregate from the validated dataset; no component computes KPIs inline.
- Market ↔ map join: `iso3 → numeric ISO` table in `entities/performance` (`ISO3_TO_NUMERIC`).

## 11. Cross-cutting

- **i18n** (ADR 0010): `en-GB` default, `en-US`, `de-DE`, `ru-RU`; `en.json` shared by both English locales. Assistant answers and market/product names stay English; the AI surface says so.
- **Theme** (ADR 0009): light/dark/system; every token has both values; heat-map scale contrast-checked in both.
- **Accessibility**: keyboard reachable everything, visible focus, skip link, landmarks, live region announcing "Answer complete"/"Stopped"/errors (not every token) [call], `prefers-reduced-motion` respected, chart table alternatives, no colour-only signals.
- **Formatting**: currency USD always (no conversion), compact numbers, signed percentages, months per locale.

## 11a. Resilience **[owner]**

**API versioning.** All routes live under `/api/v1/*`. Paths are defined once in `src/shared/config/api-routes.ts`; no hard-coded URLs elsewhere.

**Timeouts.** One shared client in `src/shared/api` wraps `fetch`, combining the caller's `AbortSignal` with a timeout (`AbortSignal.any` + `AbortSignal.timeout`). Errors are typed: `TimeoutError`, `NetworkError`, `HttpError(status)`, `ParseError` (zod), each mapped to a translated message. Values [call]:
- `/api/v1/data` and `/api/v1/alerts`: 8 s total.
- `/api/v1/chat` (stream): 10 s to the first event, then 15 s maximum gap between events (idle timeout); no total limit, so long answers are not cut. A timed-out stream ends in the error state with Retry; partial text is kept and labelled incomplete.
- TanStack Query: queries retry once on network/timeout errors, never on 4xx or parse errors; mutations never retry (rollback instead).

**Offline guard.** `features/network-status`: `navigator.onLine` + `online`/`offline` events via `useSyncExternalStore`. When offline, a full-screen guard ("You're offline — we'll reconnect automatically", Retry button) covers the app; the app stays mounted underneath so chat history, form drafts and URL state survive [call: overlay, not unmount]. It disappears on the `online` event. Caveat noted in README: `navigator.onLine` only reports the network interface, so a request can still fail while "online"; that case is handled by the timeouts/errors above.

**Error and status pages** (all localised, same visual system):
- `app/[locale]/not-found.tsx` — 404 (unknown route, invalid locale via `hasLocale` → `notFound()`, unknown market/region/product ids in URL fall back to defaults instead of 404 [call]).
- `app/[locale]/error.tsx` — 500-style page for render errors in a route, with Retry (`reset()`) and a link home.
- `app/global-error.tsx` — last resort when the root layout fails; imports the `en` dictionary directly because providers are not available there.
- Per-widget error boundaries (§8 States) so one widget failing does not trigger the page.
- API routes return JSON errors `{ error: { code, message } }` with proper status (400 invalid body, 404, 500); the mock chat route keeps the SSE `error` event from the contract.

## 12. Testing (ADR 0008)

Unit: SSE parsing, schemas, selectors, formatters, chat reducer, discrepancy rule, alert validation, fetch client timeouts and error mapping, online-status hook. Component/integration (MSW): streaming, stop, abstain/low/error, citations and data block, drill-down → URL, optimistic rollback, chart table alternatives. One local Playwright happy path.

## 13. Dependencies beyond ADR 0002 **[owner approved]**

- `world-atlas` (`countries-110m.json`, served locally, no CDN) for map shapes; `topojson-client` comes with `react-simple-maps`.
- `sonner` (shadcn toast) for the rollback message, answer-feedback thanks and a failed copy **[2026-11-04]**.

## 14. Cut line if time runs short **[owner]**

Drop in this order: (1) German and Russian **translations** (formatting for all four locales stays; copy English only); (2) tablet-specific layout; (3) radar following `period`/`range` (latest month only); (4) multi-select on the heat map (map and table keep it).

Never cut: streaming + trust surfaces, drill-down + URL state, the four charts with accessible alternatives, both modes, the alerts form with rollback, tests, deployment, README.

## 15. Left to the builder

- Exact visual design, spacing, typography. The design is a **planned step, not an existing input**: ui-ux-pro-max direction → Claude Design artifact → owner review. The plan front-loads non-UI work (schemas, selectors, SSE hook, API routes, tests) and starts UI work only after the design is approved.
- Component breakdown inside slices, file names, test file layout within the rules.
- Copy wording (within the meanings above), skeleton shapes, animation details.
- Normalisation method for the radar's revenue axis.
