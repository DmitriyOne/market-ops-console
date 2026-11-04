# Backlog: deferred review findings

Minor findings from code reviews that were not fixed in the branch that raised them. Each item names the plan that picks it up. When a plan is written, move its items into tasks; when an item is fixed, delete it here in the same commit.

Format: **Item**: what is wrong (file). Why it can wait. Where it goes.

## From the Plan 1 review (foundation, 2026-11-03)

- **SSE errors lose detail**: `streamSse` drops the API error `code` from a non-2xx JSON body and does not check that `Content-Type` is `text/event-stream` (`src/shared/api/http/stream-sse.ts`). No UI reads it yet; not done in Plan 2. **Plan 5**, hardening.
- **Region → market hierarchy not enforced**: a URL with a market outside the selected region is accepted (`src/entities/performance`, URL state). No drill-down UI yet. **Plan 3**, with nuqs parsers.
- **Locale switch rewrites the query**: repeated query keys collapse to one and `#hash` is dropped (`src/features/switch-locale/model/use-switch-locale.ts`). No repeated keys or hashes in use today. **Plan 3**, when URL state lands.
- **Arbitrary Tailwind values in shadcn components** (`src/shared/ui/*`), against `.claude/rules/ui.md`. Generated code. **Design pass**, with the semantic tokens.
- **Offline overlay does not return focus** to where it was after closing (`src/features/network-status/ui/OfflineGuard.tsx`). **Plan 5**, accessibility pass.
- **404 page has no `id="main"` and no skip link** (`app/[locale]/not-found.tsx`). **Plan 3**, with the app shell layout.

## From the error-handling review (2026-11-03)

- **TanStack `CancelledError` would be logged as a failure** (`src/app/providers/query-client.ts`). No `cancelQueries` in the code yet. **Plan 2**, if the assistant cancels queries; add a test.
- **One data failure, many alerts**: every widget's fallback is a `role="alert"` with an identically named "Try again" button (`src/shared/ui/widget-boundary.tsx`). **Plan 3**: a widget label in the button name, one page-level announcement.

## From the design pass (2026-11-03)

- **D screens drawn on the canvas (2026-11-03)**: Analyst, phone (Overview / Assistant / Alerts), widget and assistant states. Builder calls to confirm in Plan 3: phone map has no labels (Top risks below carries the facts); heat-map cells show whole percent, one decimal on focus; heat map is calculated from the series, so it can differ from stored KPIs by a few tenths and says so; radar uses 4 token colours + 4 dash patterns, scaled worst-to-best across 13 markets; in Analyst the assistant is shown collapsed with a badge.
- **Not drawn yet**: tablet, Alerts as a desktop sheet, evidence card on a source chip, product drill-down. **Plan 3**, from the drawn screens and the tokens.

## From Plan 2 (assistant, 2026-11-03)

- **No live accessibility audit yet**: the Plan 2 audit was by code and contrast tests; no rendered axe/Lighthouse run or screen-reader pass of the panel (streaming announcements, `aria-busy` log). **Plan 5**, accessibility pass.
- **`summary-long` scroll behaviour tested only at hook level** (`use-stick-to-bottom.test.tsx`); no test scrolls the real panel while it streams. **Plan 5**, in the Playwright happy path or manually.
- **Source clicks on desktop write the URL but nothing reads it yet** (`region`, `market`, `period`, `markets`). **Plan 3**, dashboard reads `dashboardSearchParams`.

## From the owner review of 0.4.0 (2026-11-03)

- **Phone bottom tab bar look** (`SectionTabBar`): the owner likes it for now but may want it tuned once the dashboard sections land. **Plan 3**, with the D phone screens (Overview / Assistant / Alerts).
- **Phone `?tab=assistant` deep link paints Overview first** until hydration. Same fix as the panel (ADR 0015). **Plan 3**, with the phone layout.
- **"New content" smooth scroll can stop short** while tokens keep arriving (PLAUSIBLE, not reproduced; `use-stick-to-bottom.ts`), and sending a question while scrolled up does not jump to it. **Plan 5**, with the Playwright happy path.

## From the 0.4.0 answer-actions review (2026-11-04)

- **Copied text can hold empty source labels** when a citation has no `label` and the dataset failed to load (`copyText` in `AnswerMessage.tsx` gives `''`, so "Sources: ; Germany"). Needs a failed dataset and a fixture without labels; none today. **Plan 5**, hardening.
- **Skeleton test queries `data-skeleton` attributes** (`AssistantPanel.test.tsx`, SSR test), not roles, against `.claude/rules/testing.md`. The skeleton has no roles to query apart from `aria-busy`. **Plan 5**, test pass.
- **Rating is not kept across a reload** of the tab (state in `AnswerActions`), so a restored answer can be rated again. Owner accepted on 2026-11-04; the server would dedupe by `answerId`. **README notes** if feedback goes to a real endpoint.

## README notes (owner, 2026-11-04)

Points the owner wants explained in the README, in his own words:

- **Chat history in sessionStorage, not localStorage or a server.** Production keeps threads on the server per user, with retention and real deletion; the brief forbids a real backend. sessionStorage survives a reload and ends with the tab. localStorage was rejected: transcript left on shared computers, races between tabs. Risks that remain and how they are handled: XSS can read it (plain-text rendering, no third-party scripts, CSP later), ~5 MB quota (50 messages, try/catch), sync writes (only when a message starts or ends), old formats (versioned key, zod on read). "New chat" clears it.
- **Citations are per answer, not per claim**: the contract has no positions in the text; guessing them means parsing AI text.
- **Status is for the latest month only** in the data; the data block says so, while a question may say "this quarter".
- **Answer feedback** (👍/👎 + reason, once per answer) goes to `logEvent` (console now, analytics later); it never includes the question text.
- **Rate limits belong on the server**: per user / IP in middleware or the platform firewall (e.g. Vercel WAF) for `/api/chat` and a future `/api/feedback`; the client only prevents accidental repeats (one stream at a time, one rating per answer).
- **Stale lines in the README today**: the status line still says `0.2.0` ("Dashboard and assistant UI come next"); the structure block lists "chat message" under `entities`, but it lives in `features/ask-question`.
