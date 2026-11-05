# Backlog: deferred review findings

Minor findings from code reviews that were not fixed in the branch that raised them. Each item names the plan that picks it up. When a plan is written, move its items into tasks; when an item is fixed, delete it here in the same commit.

Format: **Item**: what is wrong (file). Why it can wait. Where it goes.

## From the Plan 1 review (foundation, 2026-11-03)

- **SSE errors lose detail**: `streamSse` drops the API error `code` from a non-2xx JSON body and does not check that `Content-Type` is `text/event-stream` (`src/shared/api/http/stream-sse.ts`). No UI reads it yet; not done in Plan 2. **Hardening plan**, hardening.
- **Arbitrary Tailwind values in shadcn components** (`src/shared/ui/*`), against `.claude/rules/ui.md`. Generated code. **Design pass**, with the semantic tokens.
- **Offline overlay does not return focus** to where it was after closing (`src/features/network-status/ui/OfflineGuard.tsx`). **Hardening plan**, accessibility pass.

## From the design pass (2026-11-03)

- **D screens drawn on the canvas (2026-11-03)**: Analyst, phone (Overview / Assistant / Alerts), widget and assistant states. The heat-map and radar calls were built in 0.8.0. Still open: in Analyst the assistant is shown collapsed with a badge (today the panel keeps the user's own choice). **Owner**, decide or drop.
- **Not drawn yet**: tablet (cut line 2, spec §14). The evidence card (0.4.0), product drill-down (0.5.0–0.6.0) and the desktop alerts sheet (0.9.0, owner, 2026-11-05) were built from the tokens without a board.

## From Plan 2 (assistant, 2026-11-03)

- **No live accessibility audit yet**: the Plan 2 audit was by code and contrast tests; no rendered axe/Lighthouse run or screen-reader pass of the panel (streaming announcements, `aria-busy` log). **Hardening plan**, accessibility pass.
- **`summary-long` scroll behaviour tested only at hook level** (`use-stick-to-bottom.test.tsx`); no test scrolls the real panel while it streams. **Hardening plan**, in the Playwright happy path or manually.

## From the owner review of 0.4.0 (2026-11-03)

- **"New content" smooth scroll can stop short** while tokens keep arriving (PLAUSIBLE, not reproduced; `use-stick-to-bottom.ts`), and sending a question while scrolled up does not jump to it. **Hardening plan**, with the Playwright happy path.

## From the 0.4.0 answer-actions review (2026-11-04)

- **Copied text can hold empty source labels** when a citation has no `label` and the dataset failed to load (`copyText` in `AnswerMessage.tsx` gives `''`, so "Sources: ; Germany"). Needs a failed dataset and a fixture without labels; none today. **Hardening plan**, hardening.
- **Skeleton test queries `data-skeleton` attributes** (`AssistantPanel.test.tsx`, SSR test), not roles, against `.claude/rules/testing.md`. The skeleton has no roles to query apart from `aria-busy`. **Hardening plan**, test pass.
- **Rating is not kept across a reload** of the tab (state in `AnswerActions`), so a restored answer can be rated again. Owner accepted on 2026-11-04; the server would dedupe by `answerId`. **README notes** if feedback goes to a real endpoint.

## From the owner check of 0.5.0 (2026-11-04)

- **No favicon**: every page requests `/favicon.ico` and gets a 404 (console error in the browser). Add an `app/icon.svg` (or `favicon.ico`) in the app's style. **Hardening plan**, polish before the README.

## README notes (owner, 2026-11-04)

Points the owner wants explained in the README, in his own words:

- **Chat history in sessionStorage, not localStorage or a server.** Production keeps threads on the server per user, with retention and real deletion; the brief forbids a real backend. sessionStorage survives a reload and ends with the tab. localStorage was rejected: transcript left on shared computers, races between tabs. Risks that remain and how they are handled: XSS can read it (plain-text rendering, no third-party scripts, CSP later), ~5 MB quota (50 messages, try/catch), sync writes (only when a message starts or ends), old formats (versioned key, zod on read). "New chat" clears it.
- **Citations are per answer, not per claim**: the contract has no positions in the text; guessing them means parsing AI text.
- **Status is for the latest month only** in the data; the data block says so, while a question may say "this quarter".
- **Answer feedback** (👍/👎 + reason, once per answer) goes to `logEvent` (console now, analytics later); it never includes the question text.
- **Rate limits belong on the server**: per user / IP in middleware or the platform firewall (e.g. Vercel WAF) for `/api/chat`, `/api/v1/alerts` (with input limits: body size, market ids) and a future `/api/feedback`; the client only prevents accidental repeats (one stream at a time, one rating per answer).
- **An answer cut by a reload comes back empty**, as "Stopped" without its partial text (owner, 2026-11-04: keep it). Storage is written when a message starts or ends, not per token; a `pagehide` flush would keep the text if it is ever needed.

## From the 0.6.0 map build (2026-11-04)

- **German compact currency does not shorten thousands** ("999.960 $"), so a revenue value within $50 under a 1 M$ × months break can show below the break while painted in the upper step (en/ru show "$1M"). Step rule follows the en/ru display. **Accepted**, near zero cases in the data.
- **Skeleton vs stored view**: before hydration the card shows a map-shaped block from md up and tiles on a phone; a desktop user who chose tiles sees one layout change on load. The mode already uses ADR 0015's before-paint pattern (`data-mode`, 0.7.0); the stored view can take the same (`localStorage` is readable in the head script). **Hardening plan**.
- **Touch flow checked in unit tests and Chrome emulation only**, not on a real phone (pinch, tap tooltip, page scroll over the map). **Owner check**.
- **Europe is small at world zoom** in the narrow card column; markets stay reachable by Tab, zoom buttons and the table. Revisit if the layout gives the map more width.
- **Review of 0.6.0 map, deferred** (2026-11-04):
  - Focus ring on a market is partly covered by neighbours and the pattern layer drawn later; draw a separate focus outline on top. **Hardening plan**, a11y polish.
  - When zoomed in, Tab can focus a market outside the view; fly to it on focus if off-screen. **Hardening plan**.
  - Status metric with a product: tooltip shows the product's attainment next to the market's status; only the note under the card says status is per market. Owner decision №9; add the note to the tooltip if users misread it.
  - "Back returns to the old market with the product" needs real browser history (the nuqs test adapter keeps none): add it to the **E2E** happy path (Playwright). Locale switch keeping `kpi` and the SSR skeleton are now unit-tested.

- **One type cast in the map** (`MarketMap.tsx`, `TOPOLOGY`): react-simple-maps types its `geography` as GeoJSON while it accepts the TopoJSON that world-atlas ships; CLAUDE.md forbids casts that silence errors. **Owner, 2026-11-04: keep it with the comment** (converting with `topojson-client` would add a dependency and still need a cast at the JSON import). Closed.

## From the 0.7.0 markets table (2026-11-04)

- **Table skeleton is portfolio-shaped** (header, 13 rows, total): a region or a selection has fewer rows, so the page below the table moves up once on load. The row count is not known before the data. **Accepted**.
- **Total row's sticky cell** is plain `bg-muted` while the footer row is `bg-muted/50` over the card, so the first cell is a shade darker. An opaque mixed token would fix it. **Design pass**.
- **Shift+Enter on a tile** relies on the browser putting `shiftKey` on the click a key press makes (Chrome and Firefox do); the map handles Shift+Enter itself. **Hardening plan**, with the a11y pass.

## From the 0.7.0 branch review (2026-11-04)

- **Excel has no share total** while the UI footer has one (a revenue-weighted share is not a column formula). Add as a value, or leave. **Design pass**.
- **Back undoes one checkbox at a time** in the multi-pick menu (each pick is its own history entry, spec §6). Confirm or batch the menu's picks into one entry on close.
- **Popups in the assistant's scroll area** (message list) have no scroll boundary yet (`PopperBoundary` covers `<main>` only): a source card's popup could follow its trigger over the panel header. Same fix if it shows. **Hardening plan**.
- **Map Shift+click** builds the map's still-view key from the rendered selection (`toggleOnMap`), while the toggle itself now reads the URL as it is; two Shift+clicks inside one render could make the map fit once. Cosmetic.

## From the 0.8.0 heat map and radar (2026-11-05)

- **Radar colours follow the selection order**, not the market: removing the first selected market moves the others to the next colour (dataviz rule "colour follows the entity"). Four slots for 13 markets cannot be fixed per market; a stable slot per selection would need memory outside the URL. Legend, dash and marker always match. **Design pass**, if it confuses.
- **Heat-map cell names repeat for each of the 312 buttons** (market, month, value, anomaly); a screen reader reads the row header too, so the market name is said twice. Row and column headers would carry it if the cells were `gridcell`s instead of buttons. **Hardening plan**, a11y pass with a screen reader.
- **Heat-map focus fallback is untested**: when the focused row disappears (browser Back from the portfolio to a region with focus on a row outside it) focus should land on the clamped row. Code reads right; no in-app action reaches it. **E2E** happy path.
- **A radar series without a value on a kept axis** would be drawn by Recharts at the centre (as "worst"). Cannot happen with this data (no zero forecast or prior year). Drop the axis or the series if it ever can. **Hardening plan**.
- **Heat-map and radar checked in jsdom only** (no browser run this round; the owner checked on his phone): layout at xl with the assistant open, phone scroll to the selected month, the Recharts radar's look in both themes. **Owner check**.

## From the 0.9.0 alerts build (2026-11-05)

- **A Retry from the rollback toast resends the change as it was**: for an edit or a toggle, a rule changed again in between gets the older version back. Rare (two edits of one rule inside one failed save). **Hardening plan**, if it shows.
- **Two writes to one rule in flight** (toggle twice before the first answer): each undoes only itself, but a failed first write puts back its `previous`, which the second had already replaced. The list is refetched when the last write settles, so the server's state wins in the end. **Accepted**.
- **The alerts route has no input limits** (agent review, 2026-11-05): no cap on the body size or on `marketIds` (count, duplicates, unknown ids), `regionId` not checked against the dataset. A crafted POST with 3,000 ids got 201 and a 46 KB cookie the browser drops, so a reported success stores nothing; only the sender's own data is affected. **Accepted for the mock (owner, 2026-11-05)**; the README says a production API over live data needs input limits and rate limiting.
- **The threshold field reads "1,000" as 1** in English, and "5." or "1.000,5" say "required" instead of "not a number" (`parseThreshold`). Nobody types a thousands separator in a field that holds up to 200 % or a few million dollars. **Accepted (owner, 2026-11-05)**.
- **A revenue threshold is shown with one decimal** ("$1.3M" for 1.25 M$, `useThresholdFormat` uses `compactCurrency`), in the rule list and the Firing reasons. A threshold format with two decimals would show it as typed. **Owner**, decide.
- **The anomaly ⚠ in the markets table has a hover tooltip only**, so a touch screen can't read its note (the alert bell next to it became a popover in 0.9.0). Same fix if wanted. **Hardening plan**.
- **Alerts checked in jsdom only** (no browser run this round): the sheet's look and focus return on desktop, the phone tab with the keyboard open, Radix Select inside the sheet on a phone. **Owner check**.

## Currency picker (owner, 2026-11-04) — after the required work, its own release before the README

- Money everywhere shows a plain `$` (`currencyDisplay: 'narrowSymbol'` in `formats.ts`), not `US$`.
- A currency choice (USD / EUR / GBP) in the menu next to language and theme (desktop header and the phone ⚙︎ sheet), remembered per browser, not in the URL (a display preference like the locale).
- One rate for all 24 months, so growth and attainment % never change; only amounts do.
- Rates fixed in code with their date (no network request, owner's choice); the menu shows "rate of <date>".
- Converted: KPIs, charts, tables, map legend and revenue steps, evidence cards, "What the data shows". Not converted: AI answer text (shown as received, spec anti-goal), with a note "AI answers quote USD". CSV export stays raw USD (decided in 0.7.0; the header says `_usd`).
- README and CHANGELOG say it is a convenience view over USD data.
