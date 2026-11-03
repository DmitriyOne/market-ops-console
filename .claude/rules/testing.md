---
paths:
  - "**/*.test.ts"
  - "**/*.test.tsx"
  - "e2e/**"
---

# Testing rules

- Vitest + Testing Library + `user-event`. Query by role/label, not by test id or class.
- Mock the network with MSW, including the SSE chat stream. Exception: the unit tests of the fetch client itself (`src/shared/api/http`) stub `fetch` to control chunks and timers (Plan 1, Task 3). Do not mock our own modules unless unavoidable.
- TDD for pure logic: SSE parsing, selectors/aggregations, formatters, chat reducer, zod schemas.
- Test behaviour the user sees: streaming text, stop, error/abstain/low-confidence states, citations, URL updates, optimistic rollback.
- Playwright: one happy-path E2E, run locally only (not in CI).
- Co-locate tests next to the code (`foo.ts` → `foo.test.ts`).
