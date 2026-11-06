# Backlog: deferred review findings

Minor findings from code reviews that were not fixed in the branch that raised them. Each item names the plan that picks it up. When a plan is written, move its items into tasks; when an item is fixed, delete it here in the same commit.

Format: **Item**: what is wrong (file). Why it can wait. Where it goes.

## From the Plan 1 review (foundation, 2026-11-03)

- **SSE errors lose detail**: `streamSse` drops the API error `code` from a non-2xx JSON body and does not check that `Content-Type` is `text/event-stream` (`src/shared/api/http/stream-sse.ts`). No UI reads it yet; not done in Plan 2. **Hardening plan**, hardening.

## From the design pass (2026-11-03)

- **D screens drawn on the canvas (2026-11-03)**: Analyst, phone (Overview / Assistant / Alerts), widget and assistant states. The heat-map and radar calls were built in 0.8.0. Still open: in Analyst the assistant is shown collapsed with a badge (today the panel keeps the user's own choice). **Owner**, decide or drop.
- **Not drawn yet**: tablet (cut line 2, spec §14). The evidence card (0.4.0), product drill-down (0.5.0–0.6.0) and the desktop alerts sheet (0.9.0, owner, 2026-11-05) were built from the tokens without a board.

## From Plan 2 (assistant, 2026-11-03)

- **No screen-reader pass yet**: the Plan 2 audit was by code and contrast tests. Since 0.10.0 axe scans the rendered panel with an answer (E2E); a screen-reader pass (streaming announcements, `aria-busy` log) is still manual. Since 0.11.0 heat-map cells say only their value and rely on the row and column headers being read as focus moves (NVDA and JAWS do in a grid; VoiceOver not tried). **Owner check**, with VoiceOver.
- **`summary-long` scroll behaviour tested only at hook level** (`use-stick-to-bottom.test.tsx`); no test scrolls the real panel while it streams. **Hardening plan**, in the Playwright happy path or manually.

## From the owner review of 0.4.0 (2026-11-03)

- **"New content" smooth scroll can stop short** while tokens keep arriving (PLAUSIBLE, not reproduced; `use-stick-to-bottom.ts`), and sending a question while scrolled up does not jump to it. **Hardening plan**, with the Playwright happy path.

## From the 0.4.0 answer-actions review (2026-11-04)

- **Copied text can hold empty source labels** when a citation has no `label` and the dataset failed to load (`copyText` in `AnswerMessage.tsx` gives `''`, so "Sources: ; Germany"). Needs a failed dataset and a fixture without labels; none today. **Hardening plan**, hardening.
- **Skeleton test queries `data-skeleton` attributes** (`AssistantPanel.test.tsx`, SSR test), not roles, against `.claude/rules/testing.md`. The skeleton has no roles to query apart from `aria-busy`. **Hardening plan**, test pass.
- **Rating is not kept across a reload** of the tab (state in `AnswerActions`), so a restored answer can be rated again. Owner accepted on 2026-11-04; the server would dedupe by `answerId`. **README notes** if feedback goes to a real endpoint.

## From the owner check of 0.5.0 (2026-11-04)

- **No favicon**: every page requests `/favicon.ico` and gets a 404 (console error in the browser). **Done in 0.13.0** (ADR 0018), with titles, descriptions and the preview image; the deploy moved to 0.14.0.

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
  - Status metric with a product: tooltip shows the product's attainment next to the market's status; only the note under the card says status is per market. Owner decision №9; add the note to the tooltip if users misread it.
  - "Back returns to the old market with the product": covered by the E2E history test (0.10.0). Closed.

- **One type cast in the map** (`MarketMap.tsx`, `TOPOLOGY`): react-simple-maps types its `geography` as GeoJSON while it accepts the TopoJSON that world-atlas ships; CLAUDE.md forbids casts that silence errors. **Owner, 2026-11-04: keep it with the comment** (converting with `topojson-client` would add a dependency and still need a cast at the JSON import). Closed.

## From the 0.7.0 markets table (2026-11-04)

- **Table skeleton is portfolio-shaped** (header, 13 rows, total): a region or a selection has fewer rows, so the page below the table moves up once on load. The row count is not known before the data. **Accepted**.
- **Shift+Enter on a tile** relies on the browser putting `shiftKey` on the click a key press makes (Chrome and Firefox do); the map handles Shift+Enter itself. **Hardening plan**, with the a11y pass.

## From the 0.7.0 branch review (2026-11-04)

- **Back undoes one checkbox at a time** in the multi-pick menu (each pick is its own history entry, spec §6). **Accepted (owner, 2026-11-06)**: stays as it is.
- **Popups in the assistant's scroll area** (message list) have no scroll boundary yet (`PopperBoundary` covers `<main>` only): a source card's popup could follow its trigger over the panel header. Same fix if it shows. **Hardening plan**.
- **Map Shift+click** builds the map's still-view key from the rendered selection (`toggleOnMap`), while the toggle itself now reads the URL as it is; two Shift+clicks inside one render could make the map fit once. Cosmetic.

## From the 0.8.0 heat map and radar (2026-11-05)

- **Radar colours follow the selection order**, not the market: removing the first selected market moves the others to the next colour (dataviz rule "colour follows the entity"). Four slots for 13 markets cannot be fixed per market; a stable slot per selection would need memory outside the URL. Legend, dash and marker always match. **Design pass**, if it confuses.
- **Heat-map focus fallback**: covered by the E2E history test (0.10.0: Back from the portfolio to Europe with focus on Japan keeps focus on the clamped row, United Kingdom). Closed.
- **A radar series without a value on a kept axis** would be drawn by Recharts at the centre (as "worst"). Cannot happen with this data (no zero forecast or prior year). Drop the axis or the series if it ever can. **Hardening plan**.
- **Heat-map and radar checked in jsdom only** (no browser run this round; the owner checked on his phone): layout at xl with the assistant open, phone scroll to the selected month, the Recharts radar's look in both themes. **Owner check**.

## From the 0.9.0 alerts build (2026-11-05)

- **A Retry (the toast's, or the row's since 0.11.0) resends the change as it was**: for an edit or a toggle, a rule changed again in between gets the older version back. Rare (two edits of one rule inside one failed save). **Hardening plan**, if it shows.
- **Two writes to one rule in flight** (toggle twice before the first answer): each undoes only itself, but a failed first write puts back its `previous`, which the second had already replaced. Writes now go one at a time (mutation `scope`) and the list is refetched when the last one settles, so the server's state wins in the end. **Accepted**.
- **The alerts route has no input limits** (agent review, 2026-11-05): no cap on the body size or on `marketIds` (count, duplicates, unknown ids), `regionId` not checked against the dataset. A crafted POST with 3,000 ids got 201 and a 46 KB cookie the browser drops, so a reported success stores nothing; only the sender's own data is affected. **Accepted for the mock (owner, 2026-11-05)**; the README says a production API over live data needs input limits and rate limiting.
- **The threshold field reads "1,000" as 1** in English, and "5." or "1.000,5" say "required" instead of "not a number" (`parseThreshold`). Nobody types a thousands separator in a field that holds up to 200 % or a few million dollars. **Accepted (owner, 2026-11-05)**.
- **A revenue threshold is shown with one decimal** ("$1.3M" for 1.25 M$, `useThresholdFormat` uses `compactCurrency`), in the rule list and the Firing reasons. Fixed (owner, 2026-11-05): a `thresholdCurrency` format with two decimals shows it as typed. Closed.
- **Alerts checked in the browser (Playwright on the dev server, 2026-11-05)**: Back after closing the sheet (X, Escape, overlay; a deep link), two quick writes kept after a reload, the saved toast while another rule is switched, ru examples kept after a write, focus after a delete and on a missing market, 44 px rows and switch, the table bell on a tap (touch emulation). Not checked: a real phone, the keyboard open over the form. **Owner check**.

## From the 0.10.0 E2E build (2026-11-05)

- **The E2E run on Vercel previews** (`deployment_status`, `BASE_URL` = the preview URL, filtered to `release/*` previews to spare minutes; protection bypass or Trusted Sources) comes with the deploy. **0.15.0** (0.12.0 became the currency picker, 0.13.0 metadata and error pages, 0.14.0 Sentry; owner 2026-11-06).
- **The phone tab's name reads "Alerts , 5 markets flagged"** in Chromium (a space before the comma from the inline count). Screen readers ignore it. Cosmetic.

## From the 0.11.0 review (2026-11-05)

- **The alerts sheet stays usable behind the offline notice**: it is portalled outside the wrapper the notice makes inert, and Radix keeps focus inside it, so the keyboard can still switch rules while offline (pre-existing). Mark portalled layers inert too, or close the sheet's focus trap while offline. **Hardening plan**.
- **A failure shown in the panel is forgotten after ~5 minutes**: failed writes keep TanStack's default `gcTime` (5 min); only the newest stays while the panel is open, and the toast is gone long before. Set a `gcTime` on the write mutation if it matters. **Accepted**.
- **"Not saved. " with an empty reason** (`alerts.failed.update/remove` when `errorMessage` gives `''`): never seen, every failure has a reason. Cosmetic.

## From the 0.11.1 review (2026-11-05)

- **The share-total formula is not run by a spreadsheet in tests**: they check its text and redo its sum in JS. Checked once in Microsoft Excel for Mac (2026-11-05): all markets 0.2187, Germany and Spain filtered 0.1178, the revenue-weighted share of the two. LibreOffice not checked: it may not take `SUBTOTAL` over `OFFSET` inside `SUMPRODUCT`, and `IFERROR` would leave the cell blank. **Accepted** (Excel is the target), or a note in About if LibreOffice matters.
- **Column letters are written by hand** in the totals (`'D'`, `'J'`, as in the attainment and growth totals): moving a column breaks them silently. Derive them from the column list if columns ever move. **Hardening plan**.
- **A new lockfile makes the parallel jobs race to save one pnpm cache key** ("Unable to reserve cache" warnings, harmless). **Accepted**.
- **Chromium download took 9 min 39 s on the 0.11.1 PR into `develop`** (cache miss; the E2E job 12 min 12 s of its 15-min limit, the whole run 12.5 min instead of ~4.5). The install step has no timeout of its own, so a slower download fails the job with no report. Options: a `timeout-minutes` on the install with a retry, or a longer job limit. Cached now, so the next runs should be fast. **Owner's call** (CI change).

## Currency picker — done in 0.12.0 (ADR 0017)

- **Rates are a snapshot** (ECB, 2026-11-05) in `shared/config/currency.ts`; they age. A real backend sends rates with the data. **Accepted (owner: static rates for the demo)**.
- **The assistant's USD note never shows with the mock fixtures**: no answer quotes an amount. It is unit-tested on a made-up answer. **Accepted**.
- **`next dev` shows USD for a moment** with EUR or GBP stored (the dev server renders amounts on the server); a production build shows skeletons, then the chosen currency (checked 2026-11-05, no `$` at any frame). **Accepted**.
- **A market near a revenue break may change colour with the currency** (steps stay round in the chosen currency, owner's choice). **Accepted**.
- **From the 0.12.0 review — a USD rule edited in EUR or GBP shows six decimals** ("1.113688" M€): exact and round-trips, but reads oddly. Showing two decimals would need the keep-the-stored-dollars check to compare at that precision. **Owner's call**.
- **From the 0.12.0 review — nothing stops a new raw dataset reader**: `datasetQueryOptions` is still exported, so a future `useQuery(datasetQueryOptions)` would show USD with no failing test. **Done in 0.13.1** (owner, 2026-11-06): a `no-restricted-imports` rule allows it only where it is needed (ADR 0017).

## From 0.13.0 (metadata and error pages, 2026-11-06)

- **The server HTML of a localised 404 is Next's empty error shell** (`<html id="__next_error__">`, no `lang`, an empty `<body>`, the general title): without JavaScript, or if it fails, the page is blank. Not new: the 0.12.0 build is the same (0.13.0 review). Cause not established; to look at: the dynamic `[...rest]` catch-all, no top-level `app/layout.tsx` / `app/not-found.tsx`. Status 404 is correct. **Open**.
- **The 404 and 500 titles are set on the client** (React `<title>`, two `<title>` elements, the first wins). Next's metadata cannot be localised in `not-found`. **Accepted**.
- **`MarketsTable` test "a market the alert rules flag has a bell" failed once** in a full run and passes alone (10/10): flaky under load. **Watch**.
- **The Inter files are full fonts** (~325 KB each, only the preview image uses them). Subsetting to Latin + Cyrillic is optional. **Accepted**.
- **A path outside the app's routing** (`/x.txt`, `/api/unknown`) gets Next's own English 404: the localised one needs `global-not-found`, an experimental flag (owner: none in production). **Accepted**.
- **The preview image's URL is `localhost`** until 0.15.0 sets `NEXT_PUBLIC_SITE_URL` or Vercel provides its domain. **0.15.0**.

## From 0.14.0 (Sentry, 2026-11-06)

- **Source maps are not uploaded yet**: production stack traces in Sentry stay minified until `SENTRY_AUTH_TOKEN`, `SENTRY_ORG` and `SENTRY_PROJECT` are set in Vercel. **0.15.0**.
- **The environment is `NODE_ENV`**, so a Vercel preview reports as `production`. Use `VERCEL_ENV` (exposed to the browser) with the deploy. **0.15.0**.
- **Page-load and server traces are two traces**: `clientTraceMetadata` is experimental and removed (ADR 0018, 0019). **Accepted**; revisit if Next makes it stable.
- **Click breadcrumbs name the button by its CSS classes** (Sentry's DOM path: a long Tailwind class list) rather than its label. Readable enough with the URL and the tags; a `data-sentry-label` on key buttons would shorten them. Cosmetic.
- **React's recoverable hydration errors are not reported**: Next gives no hook outside the console. **Accepted**.
- **A Sentry organisation in the EU region, a privacy notice, Sentry's DPA and a consent banner** before any real launch for UK/EU users (README, ADR 0019). **Production**, not this demo.

