# Backlog: deferred review findings

Minor findings from code reviews that were not fixed in the branch that raised them. Each item names the plan that picks it up. When a plan is written, move its items into tasks; when an item is fixed, delete it here in the same commit.

Format: **Item**: what is wrong (file). Why it can wait. Where it goes.

## From the Plan 1 review (foundation, 2026-11-03)

- **SSE errors lose detail**: `streamSse` drops the API error `code` from a non-2xx JSON body and does not check that `Content-Type` is `text/event-stream` (`src/shared/api/http/stream-sse.ts`). No UI reads it yet; not done in Plan 2. **Hardening plan**, hardening.
- **Arbitrary Tailwind values in shadcn components** (`src/shared/ui/*`), against `.claude/rules/ui.md`. Generated code. **Design pass**, with the semantic tokens.
- **Offline overlay does not return focus** to where it was after closing (`src/features/network-status/ui/OfflineGuard.tsx`). **Hardening plan**, accessibility pass.

## From the error-handling review (2026-11-03)

- **TanStack `CancelledError` would be logged as a failure** (`src/app/providers/query-client.ts`). No `cancelQueries` in the code yet. **Plan 2**, if the assistant cancels queries; add a test.

## From the design pass (2026-11-03)

- **D screens drawn on the canvas (2026-11-03)**: Analyst, phone (Overview / Assistant / Alerts), widget and assistant states. Builder calls to confirm in Plan 3: phone map has no labels (Top risks below carries the facts); heat-map cells show whole percent, one decimal on focus; heat map is calculated from the series, so it can differ from stored KPIs by a few tenths and says so; radar uses 4 token colours + 4 dash patterns, scaled worst-to-best across 13 markets; in Analyst the assistant is shown collapsed with a badge.
- **Not drawn yet**: tablet, Alerts as a desktop sheet, evidence card on a source chip, product drill-down. **Plan 3**, from the drawn screens and the tokens.

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
- **Rate limits belong on the server**: per user / IP in middleware or the platform firewall (e.g. Vercel WAF) for `/api/chat` and a future `/api/feedback`; the client only prevents accidental repeats (one stream at a time, one rating per answer).
- **An answer cut by a reload comes back empty**, as "Stopped" without its partial text (owner, 2026-11-04: keep it). Storage is written when a message starts or ends, not per token; a `pagehide` flush would keep the text if it is ever needed.

## From the 0.6.0 map build (2026-11-04)

- **German compact currency does not shorten thousands** ("999.960 $"), so a revenue value within $50 under a 1 M$ × months break can show below the break while painted in the upper step (en/ru show "$1M"). Step rule follows the en/ru display. **Accepted**, near zero cases in the data.
- **Heat map uses the map's scale** (owner, 2026-11-04): attainment cells take the map's attainment steps and `--scale-div-*` tones, so a value has one colour on both; add a text colour per step (`--scale-div-N-foreground`, checked in `tokens.test.ts`). The unused 7-step `--scale-1…7` was removed in 0.6.0. **M4**.
- **Skeleton vs stored view**: before hydration the card shows a map-shaped block from md up and tiles on a phone; a desktop user who chose tiles sees one layout change on load (localStorage cannot be read before paint). Fix with ADR 0015's before-paint pattern if it shows in review. **Hardening plan**.
- **Touch flow checked in unit tests and Chrome emulation only**, not on a real phone (pinch, tap tooltip, page scroll over the map). **Owner check**.
- **Europe is small at world zoom** in the narrow card column; markets stay reachable by Tab, zoom buttons and the table. Revisit if the layout gives the map more width.
- **Review of 0.6.0 map, deferred** (2026-11-04):
  - Focus ring on a market is partly covered by neighbours and the pattern layer drawn later; draw a separate focus outline on top. **Hardening plan**, a11y polish.
  - When zoomed in, Tab can focus a market outside the view; fly to it on focus if off-screen. **Hardening plan**.
  - Status metric with a product: tooltip shows the product's attainment next to the market's status; only the note under the card says status is per market. Owner decision №9; add the note to the tooltip if users misread it.
  - "Back returns to the old market with the product" needs real browser history (the nuqs test adapter keeps none): add it to the **E2E** happy path (Playwright). Locale switch keeping `kpi` and the SSR skeleton are now unit-tested.
- **Dev warning "Encountered a script tag while rendering React component"** (seen by the owner in the browser console). Source not confirmed yet: the likely one is our two inline `<script>` tags in `app/[locale]/layout.tsx` (ADR 0015) when React renders the layout on the client; ADR 0009 says `@wrksz/themes` injects its script outside the tree. Reproduce with the stack trace, then fix in the ADR 0015 pattern. Dev only so far. **Hardening plan**.

- **One type cast in the map** (`MarketMap.tsx`, `TOPOLOGY`): react-simple-maps types its `geography` as GeoJSON while it accepts the TopoJSON that world-atlas ships; CLAUDE.md forbids casts that silence errors. **Owner, 2026-11-04: keep it with the comment** (converting with `topojson-client` would add a dependency and still need a cast at the JSON import). Closed.

## From the 0.7.0 markets table (2026-11-04)

- **No table skeleton in the static HTML**: the page does not know the mode before hydration, so in Analyst the markets table appears under the map after load (below the fold on most screens). Fix with the mode read before paint if it shows in review. **Hardening plan**.
- **Total row's sticky cell** is plain `bg-muted` while the footer row is `bg-muted/50` over the card, so the first cell is a shade darker. An opaque mixed token would fix it. **Design pass**.
- **Shift+Enter on a tile** relies on the browser putting `shiftKey` on the click a key press makes (Chrome and Firefox do); the map handles Shift+Enter itself. **Hardening plan**, with the a11y pass.

## From the 0.7.0 branch review (2026-11-04)

- **Row figures mix two sources at the latest month** (open question to the owner): with no product and `1m` at the latest month, revenue, attainment and growth are the stored `market.kpis`, while forecast, prior year and gap are summed from series. In the data they differ a little (India 103.1% shown vs 104.2% = revenue ÷ forecast in the same row; revenue − forecast ≠ gap by $1–2), and the Excel total attainment is a ratio of the columns, so it does not match the rows' figures. Choice: series everywhere in the table (tiles keep stored KPIs), or derive gap from the stored revenue. Not changed without the owner.
- **Table slot outside its boundary**: `AnalystOnly` in `Overview.tsx` reads `useDashboard` outside the slot's `WidgetBoundary`, in a Suspense with no fallback. `DatasetGate` already guards the data, so the risk is low. Move the mode check inside the slot. **Hardening plan**.
- **Excel has no share total** while the UI footer has one (a revenue-weighted share is not a column formula). Add as a value, or leave. **Design pass**.
- **Back undoes one checkbox at a time** in the multi-pick menu (each pick is its own history entry, spec §6). Confirm or batch the menu's picks into one entry on close.
- **Popups in the assistant's scroll area** (message list) have no scroll boundary yet (`PopperBoundary` covers `<main>` only): a source card's popup could follow its trigger over the panel header. Same fix if it shows. **Hardening plan**.
- **Map Shift+click** builds the map's still-view key from the rendered selection (`toggleOnMap`), while the toggle itself now reads the URL as it is; two Shift+clicks inside one render could make the map fit once. Cosmetic.

## For M4 (owner, 2026-11-04)

- **Radar = selection**: the radar compares the selected markets (`markets`, first 4); with nothing selected it compares regions. No `compare` param and no "+ Compare" buttons. The heat map's multi-select changes the same list.

## Currency picker (owner, 2026-11-04) — after the required work, its own release before the README

- Money everywhere shows a plain `$` (`currencyDisplay: 'narrowSymbol'` in `formats.ts`), not `US$`.
- A currency choice (USD / EUR / GBP) in the menu next to language and theme (desktop header and the phone ⚙︎ sheet), remembered per browser, not in the URL (a display preference like the locale).
- One rate for all 24 months, so growth and attainment % never change; only amounts do.
- Rates fixed in code with their date (no network request, owner's choice); the menu shows "rate of <date>".
- Converted: KPIs, charts, tables, map legend and revenue steps, evidence cards, "What the data shows". Not converted: AI answer text (shown as received, spec anti-goal), with a note "AI answers quote USD". CSV export stays raw USD (decided in 0.7.0; the header says `_usd`).
- README and CHANGELOG say it is a convenience view over USD data.
