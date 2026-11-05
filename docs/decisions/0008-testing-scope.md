# 0008. Testing scope

**Decision.**
- Unit (TDD): SSE parsing, zod schemas, selectors/aggregations, formatters, chat reducer.
- Component/integration (Vitest + Testing Library + MSW): chat streaming/stop/error/abstain/low-confidence, citations, drill-down updating URL, alert form validation and optimistic rollback, chart table alternatives.
- E2E (Playwright, `e2e/`, 0.10.0): the happy path (map → Germany → URL → the assistant's answer streams → a source opens that market and month), Back/Forward in a real browser, the phone tab bar, and axe scans (WCAG 2.1 A/AA) of the main views on desktop and phone. Locators by role and name only, no fixed waits. Two projects, both Chromium: desktop 1440×900 and Pixel 7.
- Where: locally with `pnpm e2e` (builds the app and starts it on :3100, apart from a dev server on :3000) and on every PR into `develop` (owner, 2026-11-05; ADR 0007). With `BASE_URL` the same suite tests a deployed preview (planned with the deploy).
- axe findings are fixed in the app; an exclusion would be written here (none so far). axe catches a part of the problems only: keyboard and screen-reader checks stay manual.

**Skipped.** Visual regression (fonts and OS make screenshots flaky), whole-page aria snapshots (break on any copy change), Storybook, a cross-browser matrix (WebKit/Firefox: CI minutes).
