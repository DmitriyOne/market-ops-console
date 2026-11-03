# Backlog: deferred review findings

Minor findings from code reviews that were not fixed in the branch that raised them. Each item names the plan that picks it up. When a plan is written, move its items into tasks; when an item is fixed, delete it here in the same commit.

Format: **Item**: what is wrong (file). Why it can wait. Where it goes.

## From the Plan 1 review (foundation, 2026-11-03)

- **SSE errors lose detail**: `streamSse` drops the API error `code` from a non-2xx JSON body and does not check that `Content-Type` is `text/event-stream` (`src/shared/api/http/stream-sse.ts`). No UI reads it yet. **Plan 2**, first task.
- **Region → market hierarchy not enforced**: a URL with a market outside the selected region is accepted (`src/entities/performance`, URL state). No drill-down UI yet. **Plan 3**, with nuqs parsers.
- **Locale switch rewrites the query**: repeated query keys collapse to one and `#hash` is dropped (`src/features/switch-locale/model/use-switch-locale.ts`). No repeated keys or hashes in use today. **Plan 3**, when URL state lands.
- **Arbitrary Tailwind values in shadcn components** (`src/shared/ui/*`), against `.claude/rules/ui.md`. Generated code. **Design pass**, with the semantic tokens.
- **Offline overlay does not return focus** to where it was after closing (`src/features/network-status/ui/OfflineGuard.tsx`). **Plan 5**, accessibility pass.
- **404 page has no `id="main"` and no skip link** (`app/[locale]/not-found.tsx`). **Plan 3**, with the app shell layout.

## From the error-handling review (2026-11-03)

- **TanStack `CancelledError` would be logged as a failure** (`src/app/providers/query-client.ts`). No `cancelQueries` in the code yet. **Plan 2**, if the assistant cancels queries; add a test.
- **One data failure, many alerts**: every widget's fallback is a `role="alert"` with an identically named "Try again" button (`src/shared/ui/widget-boundary.tsx`). **Plan 3**: a widget label in the button name, one page-level announcement.

## From the design pass (2026-11-03)

- **Fallback checkpoint, dashboard D → A** (ADR 0014): when Plan 2 (assistant) is done, compare the days left to the D estimate. Not enough time means build dashboard A. **Before Plan 3** starts.
- **D screens drawn on the canvas (2026-11-03)**: Analyst, phone (Overview / Assistant / Alerts), widget and assistant states. Builder calls to confirm in Plan 3: phone map has no labels (Top risks below carries the facts); heat-map cells show whole percent, one decimal on focus; heat map is calculated from the series, so it can differ from stored KPIs by a few tenths and says so; radar uses 4 token colours + 4 dash patterns, scaled worst-to-best across 13 markets; in Analyst the assistant is shown collapsed with a badge.
- **Not drawn yet**: tablet, Alerts as a desktop sheet, evidence card on a source chip, product drill-down. **Plan 3**, from the drawn screens and the tokens.

## From Plan 2 (assistant, 2026-11-03)

- **No live accessibility audit yet**: the Plan 2 audit was by code and contrast tests; no rendered axe/Lighthouse run or screen-reader pass of the panel (streaming announcements, `aria-busy` log). **Plan 5**, accessibility pass.
- **`summary-long` scroll behaviour tested only at hook level** (`use-stick-to-bottom.test.tsx`); no test scrolls the real panel while it streams. **Plan 5**, in the Playwright happy path or manually.
- **Source clicks on desktop write the URL but nothing reads it yet** (`region`, `market`, `period`, `markets`). **Plan 3**, dashboard reads `dashboardSearchParams`.
- **`AGENTS.md` is re-created by `next dev`** (Next.js agent rules). Untracked; the owner decides whether to commit or ignore it.
