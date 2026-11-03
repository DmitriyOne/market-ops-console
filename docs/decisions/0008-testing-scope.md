# 0008. Testing scope

**Decision.**
- Unit (TDD): SSE parsing, zod schemas, selectors/aggregations, formatters, chat reducer.
- Component/integration (Vitest + Testing Library + MSW): chat streaming/stop/error/abstain/low-confidence, citations, drill-down updating URL, alert form validation and optimistic rollback, chart table alternatives.
- E2E (Playwright): one happy path, local only: open dashboard → select Germany → URL updates → ask about Germany → answer streams with a citation.

**Skipped.** E2E in CI, visual regression, Storybook, cross-browser matrix.
