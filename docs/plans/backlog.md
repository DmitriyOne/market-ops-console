# Backlog: deferred review findings

Minor findings from code reviews that were not fixed in the branch that raised them. Each item names the plan that picks it up. When a plan is written, move its items into tasks; when an item is fixed, delete it here in the same commit.

Format: **Item**: what is wrong (file). Why it can wait. Where it goes.

## From the Plan 1 review (foundation, 2026-11-03)

- **SSE errors lose detail**: `streamSse` drops the API error `code` from a non-2xx JSON body and does not check that `Content-Type` is `text/event-stream` (`src/shared/api/http/stream-sse.ts`). No UI reads it yet. **Plan 2**, first task.
- **Region → market hierarchy not enforced**: a URL with a market outside the selected region is accepted (`src/entities/performance`, URL state). No drill-down UI yet. **Plan 3**, with nuqs parsers.
- **Locale switch rewrites the query**: repeated query keys collapse to one and `#hash` is dropped (`src/features/switch-locale/model/use-switch-locale.ts`). No repeated keys or hashes in use today. **Plan 3**, when URL state lands.
- **`as` casts in tests**: `src/shared/api/http/fetch-json.test.ts:54`. Test-only. **Plan 2**, when the HTTP tests are touched.
- **Arbitrary Tailwind values in shadcn components** (`src/shared/ui/*`), against `.claude/rules/ui.md`. Generated code. **Design pass**, with the semantic tokens.
- **Offline overlay does not return focus** to where it was after closing (`src/features/network-status/ui/OfflineGuard.tsx`). **Plan 5**, accessibility pass.
- **404 page has no `id="main"` and no skip link** (`app/[locale]/not-found.tsx`). **Plan 3**, with the app shell layout.

## From the error-handling review (2026-11-03)

- **Server helper in the client-safe barrel**: `withErrorHandling` is exported from `src/shared/api/http/index.ts`; it belongs in `@/shared/api/server`. Tree-shaken today. **Plan 2**.
- **Unguarded fallback in the chat stream `catch`**: if `controller.enqueue` itself failed, the fallback `send` and `close` throw and the client gets a cut stream instead of an `error` event (`app/api/v1/chat/route.ts`). Rare; the error is logged first. **Plan 2**.
- **Broken fixtures beat a bad request**: `loadFixtures()` runs before `readQuestion()`, so a malformed request gets 500 instead of 400 when fixtures are broken (`app/api/v1/chat/route.ts:37`). Fixtures are checked in. **Plan 2**.
- **Fragile mid-stream test**: throws on the 2nd `TextEncoder.encode` call, so it depends on the encode count and the fixture length (`app/api/v1/chat/route.test.ts`). **Plan 2**: assert the fixture has more than one token or count only `data: ` writes.
- **Client error logs say `code: 'unknown'`** for `ApiError` (`src/shared/lib/errors/log-error.ts`). The error object is still attached. **Plan 2**: fall back to `error.name`.
- **TanStack `CancelledError` would be logged as a failure** (`src/app/providers/query-client.ts`). No `cancelQueries` in the code yet. **Plan 2**, if the assistant cancels queries; add a test.
- **One data failure, many alerts**: every widget's fallback is a `role="alert"` with an identically named "Try again" button (`src/shared/ui/widget-boundary.tsx`). **Plan 3**: a widget label in the button name, one page-level announcement.
