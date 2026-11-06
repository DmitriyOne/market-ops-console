# 0012. API versioning, timeouts and failure handling

**Context.** Requests must never hang, the app must behave sensibly offline, and every failure must end in a clear, localised state. The owner asked for versioned API paths.

**Decision.**
- All route handlers under `/api/v1/*`; paths defined once in `src/shared/config/api-routes.ts`.
- One shared fetch client in `src/shared/api`: caller signal + timeout via `AbortSignal.any`/`AbortSignal.timeout` (the chat stream's idle gap uses `setTimeout`, because it restarts on every event); typed errors (`TimeoutError`, `NetworkError`, `HttpError`, `ParseError`) mapped to translated messages.
- Timeouts: 8 s for JSON requests; for the chat stream 10 s to first event and 15 s idle gap, no total cap.
- Query retries once on network/timeout only; mutations never retry.
- Offline guard (`features/network-status`): `navigator.onLine` + events, full-screen overlay that keeps the app mounted.
- Localised `not-found`, `error`, `global-error` pages; per-widget error boundaries; JSON error shape `{ error: { code, message } }` for API routes.

**Alternatives.** Unversioned `/api/*` (simpler, but no path for breaking changes); total timeout on the stream (would cut long answers); unmounting the app when offline (loses chat and form state); ping-based connectivity checks (more accurate, more code and traffic — timeouts cover the gap).

**Consequences.** Every network call goes through one client, so timeouts and error copy are consistent and testable. `navigator.onLine` can report "online" without internet; timeouts handle that case.

**Addendum (2026-11-06).** The starter pack's contract names `POST /api/chat`; a reviewer checking the contract by hand would get a 404. `next.config.ts` rewrites `/api/chat` to `/api/v1/chat` (a plain `rewrites`, not experimental), so the contract's path answers the same stream. The app itself calls v1.
