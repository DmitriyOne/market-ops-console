# Backlog: deferred review findings

Minor findings from code reviews that were not fixed in the branch that raised them. Each item names the plan that picks it up. When a plan is written, move its items into tasks; when an item is fixed, delete it here in the same commit.

Format: **Item**: what is wrong (file). Why it can wait. Where it goes.

## From the Plan 1 review (foundation, 2026-11-03)

- **SSE errors lose detail**: `streamSse` drops the API error `code` from a non-2xx JSON body and does not check that `Content-Type` is `text/event-stream` (`src/shared/api/http/stream-sse.ts`). No UI reads it yet; not done in Plan 2. **Plan 5**, hardening.
- **Arbitrary Tailwind values in shadcn components** (`src/shared/ui/*`), against `.claude/rules/ui.md`. Generated code. **Design pass**, with the semantic tokens.
- **Offline overlay does not return focus** to where it was after closing (`src/features/network-status/ui/OfflineGuard.tsx`). **Plan 5**, accessibility pass.

## From the error-handling review (2026-11-03)

- **TanStack `CancelledError` would be logged as a failure** (`src/app/providers/query-client.ts`). No `cancelQueries` in the code yet. **Plan 2**, if the assistant cancels queries; add a test.

## From the design pass (2026-11-03)

- **D screens drawn on the canvas (2026-11-03)**: Analyst, phone (Overview / Assistant / Alerts), widget and assistant states. Builder calls to confirm in Plan 3: phone map has no labels (Top risks below carries the facts); heat-map cells show whole percent, one decimal on focus; heat map is calculated from the series, so it can differ from stored KPIs by a few tenths and says so; radar uses 4 token colours + 4 dash patterns, scaled worst-to-best across 13 markets; in Analyst the assistant is shown collapsed with a badge.
- **Not drawn yet**: tablet, Alerts as a desktop sheet, evidence card on a source chip, product drill-down. **Plan 3**, from the drawn screens and the tokens.

## From Plan 2 (assistant, 2026-11-03)

- **No live accessibility audit yet**: the Plan 2 audit was by code and contrast tests; no rendered axe/Lighthouse run or screen-reader pass of the panel (streaming announcements, `aria-busy` log). **Plan 5**, accessibility pass.
- **`summary-long` scroll behaviour tested only at hook level** (`use-stick-to-bottom.test.tsx`); no test scrolls the real panel while it streams. **Plan 5**, in the Playwright happy path or manually.

## From the owner review of 0.4.0 (2026-11-03)

- **"New content" smooth scroll can stop short** while tokens keep arriving (PLAUSIBLE, not reproduced; `use-stick-to-bottom.ts`), and sending a question while scrolled up does not jump to it. **Plan 5**, with the Playwright happy path.

## From the 0.4.0 answer-actions review (2026-11-04)

- **Copied text can hold empty source labels** when a citation has no `label` and the dataset failed to load (`copyText` in `AnswerMessage.tsx` gives `''`, so "Sources: ; Germany"). Needs a failed dataset and a fixture without labels; none today. **Plan 5**, hardening.
- **Skeleton test queries `data-skeleton` attributes** (`AssistantPanel.test.tsx`, SSR test), not roles, against `.claude/rules/testing.md`. The skeleton has no roles to query apart from `aria-busy`. **Plan 5**, test pass.
- **Rating is not kept across a reload** of the tab (state in `AnswerActions`), so a restored answer can be rated again. Owner accepted on 2026-11-04; the server would dedupe by `answerId`. **README notes** if feedback goes to a real endpoint.

## From the owner check of 0.5.0 (2026-11-04)

- **No favicon**: every page requests `/favicon.ico` and gets a 404 (console error in the browser). Add an `app/icon.svg` (or `favicon.ico`) in the app's style. **Plan 5**, polish before the README.

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
- **Skeleton vs stored view**: before hydration the card shows a map-shaped block from md up and tiles on a phone; a desktop user who chose tiles sees one layout change on load (localStorage cannot be read before paint). Fix with ADR 0015's before-paint pattern if it shows in review. **Plan 5**.
- **Touch flow checked in unit tests and Chrome emulation only**, not on a real phone (pinch, tap tooltip, page scroll over the map). **Owner check**.
- **Europe is small at world zoom** in the narrow card column; markets stay reachable by Tab, zoom buttons and the table. Revisit if the layout gives the map more width.
- **Review of 0.6.0 map, deferred** (2026-11-04):
  - Focus ring on a market is partly covered by neighbours and the pattern layer drawn later; draw a separate focus outline on top. **Plan 5**, a11y polish.
  - When zoomed in, Tab can focus a market outside the view; fly to it on focus if off-screen. **Plan 5**.
  - Status metric with a product: tooltip shows the product's attainment next to the market's status; only the note under the card says status is per market. Owner decision №9; add the note to the tooltip if users misread it.
  - "Back returns to the old market with the product" needs real browser history (the nuqs test adapter keeps none): add it to the **E2E** happy path (Playwright). Locale switch keeping `kpi` and the SSR skeleton are now unit-tested.
- **Dev warning "Encountered a script tag while rendering React component"** (seen by the owner in the browser console). Source not confirmed yet: the likely one is our two inline `<script>` tags in `app/[locale]/layout.tsx` (ADR 0015) when React renders the layout on the client; ADR 0009 says `@wrksz/themes` injects its script outside the tree. Reproduce with the stack trace, then fix in the ADR 0015 pattern. Dev only so far. **Plan 5**.

- **One type cast in the map** (`MarketMap.tsx`, `TOPOLOGY`): react-simple-maps types its `geography` as GeoJSON while it accepts the TopoJSON that world-atlas ships; CLAUDE.md forbids casts that silence errors. Owner to choose: keep with the comment (recommended), or convert with `topojson-client` as a direct dependency (still one cast at the JSON import).

## Currency picker (owner, 2026-11-04) — after the required work, its own release before the README

- Money everywhere shows a plain `$` (`currencyDisplay: 'narrowSymbol'` in `formats.ts`), not `US$`.
- A currency choice (USD / EUR / GBP) in the menu next to language and theme (desktop header and the phone ⚙︎ sheet), remembered per browser, not in the URL (a display preference like the locale).
- One rate for all 24 months, so growth and attainment % never change; only amounts do.
- Rates fixed in code with their date (no network request, owner's choice); the menu shows "rate of <date>".
- Converted: KPIs, charts, tables, map legend and revenue steps, evidence cards, "What the data shows". Not converted: AI answer text (shown as received, spec anti-goal), with a note "AI answers quote USD". CSV export: decide with M3 (raw USD is the safe default).
- README and CHANGELOG say it is a convenience view over USD data.
