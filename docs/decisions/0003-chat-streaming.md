# 0003. Chat streaming

**Context.** Contract: `POST /api/chat` → SSE with `token`, `done` (kind, citations, confidence) and `error` events (`docs/CONTRACT.md`); served at `/api/v1/chat` (ADR 0012). Native `EventSource` is GET-only.

**Decision.** `fetch` + `ReadableStream`, parsed by `eventsource-parser`; each event validated with a zod discriminated union; state in an own `useChatStream` hook (`useReducer`); stop via `AbortController`. The reference route is fixed to stop enqueuing when the client aborts.

**Alternatives.**
- Hand-written parser: easy to get wrong (multi-byte chars and `\r\n` split across chunks).
- `@microsoft/fetch-event-source`: last release April 2021; retries POST by default.
- Vercel AI SDK `useChat`: expects its own protocol; needs a custom `ChatTransport` adapter to map our contract. Extra layer over a fake backend, and hides the work being assessed.

**Consequences.** ~80 lines of own, fully typed, testable code. Parser edge cases handled by a spec-compliant library.
