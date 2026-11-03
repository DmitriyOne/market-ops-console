# 0013. Error handling

**Context.** Errors come from three places: the network (timeouts, offline, bad responses), the server (invalid source data, bad requests) and rendering. The owner asked for logical error types and `try/catch` where it is useful, following the `error-handling-patterns` skill.

**Decision.** Catch at boundaries, where an error can be handled meaningfully; everywhere else let it propagate.

| Where | Error types | Handled by |
| --- | --- | --- |
| Client ↔ API | `ApiError`: `TimeoutError`, `NetworkError`, `HttpError`, `ParseError`, `AbortedError` (`@/shared/api`, ADR 0012) | fetch client classifies; TanStack Query retries transient ones once |
| Server | `AppError`: `ValidationError` (400), `NotFoundError` (404), `DataIntegrityError` (500), each with `code`, `status`, `cause` (`@/shared/lib`) | `withErrorHandling(route, handler)` on every route handler |
| Rendering | anything thrown while rendering | `WidgetBoundary` per widget, `app/[locale]/error.tsx` per route, `app/global-error.tsx` last |

Rules:
- **Server responses.** `withErrorHandling` answers expected errors (`expose: true`) with `{ error: { code, message } }`. Server faults are logged and answered with a generic 500 (`internal` or `data_integrity`) that leaks no internals. Once a stream has started, failures become the contract's SSE `error` event.
- **Source data.** `data.json` and `fixtures.json` are parsed lazily with `parseSourceData`; a mismatch is a `DataIntegrityError` naming the file and the first broken path, with the `ZodError` as `cause`.
- **Logging.** One function, `logError(error, { scope, ...context })`, called where errors are handled: route handlers, `ErrorBoundary`, `app/[locale]/error.tsx`, `app/global-error.tsx`, and the QueryClient's query/mutation caches. It remembers logged error objects (`WeakSet`), so a failed query that the cache logs and an error boundary then catches is logged once. User aborts are not logged. A reporting service (Sentry) would plug in there.
- **User-facing copy.** Every failure the UI shows goes through `useErrorMessage()` (→ `errorMessageKey` → `errors.*` messages). For a request the user stopped (`AbortedError`) it returns `null`: the UI shows its "Stopped" state, never an error.
- **User actions** (ask, save alert). They are TanStack mutations or the chat stream. Each catches its error, shows `useErrorMessage(error)` with a Retry, and rolls back optimistic state (Plans 2 and 4).
- No empty `catch`, no catch-and-rethrow-with-log (one log per error), no `try/catch` around code that cannot fail.

**Alternatives.** Result types everywhere (explicit, but noisy in React and against TanStack Query's thrown-error model). `react-error-boundary` (an extra dependency for ~30 lines). A logging library (not needed for a mock backend).

**Consequences.** Consistent JSON errors and copy, one log per failure, widgets fail independently. Error boundaries only catch render errors; async errors reach the UI through query/mutation state.
