# Changelog

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versioning: [SemVer](https://semver.org/). The top version must match `package.json` and the `release/X.Y.Z` branch.

## [0.4.0] - Unreleased

### Added
- Assistant (ADR 0014, variant A): streamed answers with Stop, Retry, confidence and one source button per citation; hover, focus or tap shows an evidence card with the real numbers; clicking focuses the dashboard through the URL.
- "What the data shows" table under each answer: portfolio row, cited rows and two deterministic gap rules ("Not mentioned in the answer", region gaps, each market listed once), closed by default with the gap count in its header; "Show on dashboard" highlights the listed markets.
- Composer with Enter / Shift+Enter / Esc, a 500-character limit with counter and four suggested questions (translated label, English question). A non-English question gets a client-side reply "I only understand English…" instead of being sent.
- Answers without matching data read as "I can't answer this from the data"; the suggested questions appear after two such replies in a row.
- App shell: assistant as a right panel on desktop (collapsible, remembered and applied before the first paint, ADR 0015, badge for unseen answers), Overview / Assistant tabs on phones. Dashboard and assistant each sit in their own error boundary.
- Page title and description per locale; `noindex, nofollow` (internal console).
- `AGENTS.md` (entry point for coding agents, keeps the `next dev` block) and `DESIGN.md` (tokens, type, spacing, inventory, checklist).
- Answer actions: Copy (text with sources and confidence, "Treat as directional" for Low, "Copied" for 2 s), 👍 / 👎 with a reason, once per answer (logged through `logEvent`, never the question, thanks as a toast); "New chat" with a tooltip clears the conversation and focuses the composer (not on touch screens).
- The conversation survives a reload of the same tab (sessionStorage, last 50 messages), read after hydration behind a skeleton so server and client HTML match; restored answers are not counted as new. An answer cut by the reload comes back as "Stopped" without its partial text (written when a message starts or ends, not per token).
- Toasts (sonner, top centre, as wide as the text), tooltips and skeletons (shadcn).
- Disabled controls show the not-allowed cursor and no hover or press effect.
- The data block says that status exists for the latest month only.
- MSW test harness for the SSE chat stream and the data route.

### Changed
- A streaming answer starts in a neutral frame; the AI or "can't answer" style is applied at `done`, when its kind is known.
- Chat failures are logged once to the console (`[chat]`, named errors) and shown as a translated message; the server's own text stays in the log.
- Confidence shown as three equal bars; percents always with one decimal.
- Evidence card: latest status for a past month, the month's anomaly, a full-width trend with period labels; a failed dataset load shows the error instead of "Loading data…".
- Pointer cursor on clickable controls; floating cards keep 15px from the screen edge.
- `withErrorHandling` is exported only from `@/shared/api/server`.
- "Show on dashboard" resets the scope to the portfolio and the latest month before highlighting.

### Fixed
- Chat route validates the request before reading fixtures, so a bad request is always a 400.
- A failing write in the chat stream can no longer throw out of the stream's error fallback.
- Error logs use the error name (e.g. `TimeoutError`) as `code` for errors that are not `AppError`.
- Screen-reader-only text inside the chat log no longer stretches the page with an empty scroll area.
- A server that keeps the stream open after `done` no longer blocks the next question.
- Keyboard focus follows collapse / expand and stays in the composer after a suggestion or Stop.
- The evidence popover closes when it sends a phone to the dashboard; the unread badge clears on Back.
- The collapsed state stays in sync across tabs and with full storage.

## [0.3.0] - Unreleased

### Added
- Design direction (ADR 0014, owner decision): dashboard variant D (map console), assistant variant A; dashboard A is the fallback if time runs out.
- Design tokens in `src/app/styles/globals.css` for light and dark: shadcn base colours, trust surfaces (`surface-ai`, `surface-data`), status (`status-on-track`, `status-at-risk`, `status-off-track` + `-muted`), confidence, map (`map-sea`, `map-land`, `map-hatch`) and a 7-step attainment scale with a text colour per step.
- `tokens.test.ts`: WCAG contrast check of every text pair (4.5:1) and control/chart pair (3:1) in both themes.
- Fonts via `next/font`: Space Grotesk for text, JetBrains Mono for numbers (both SIL OFL 1.1); Cyrillic text uses the system font.

## [0.2.0] - Unreleased

### Added
- Next.js 16 app scaffold with TypeScript 6 (strict), Tailwind v4 + shadcn/ui (Radix), ESLint 10, Prettier, Steiger and Vitest.
- Typed env (`@t3-oss/env-nextjs`) and versioned API paths (`/api/v1/*`).
- Shared fetch client with timeouts (8 s JSON; 10 s first event, 15 s idle for streams), typed errors and an SSE reader.
- zod contracts for `data.json`, `fixtures.json` and the chat stream.
- `entities/performance`: KPI, status and trend selectors (stored vs calculated values, status only for the latest month).
- Mock API: `GET /api/v1/data`, `POST /api/v1/chat` (SSE; stops when the client aborts; JSON errors).
- i18n with next-intl: en-GB (default), en-US, de-DE, ru-RU; `as-needed` prefixes; static pages per locale; global number/date formats.
- App providers (TanStack Query, nuqs, offline guard; intl and theme providers in the root layout), dataset prefetched into static HTML, localised 404 and error pages.
- Theme switch (`@wrksz/themes`, replaces `next-themes` to avoid the React 19 script warning), locale switch that keeps URL state, offline guard.
- Error handling (ADR 0013): domain errors (`ValidationError`, `NotFoundError`, `DataIntegrityError`), `withErrorHandling` for route handlers, SSE `error` event on stream failures, validated lazy loading of source data, central `logError` (routes, error boundaries, query/mutation caches), `WidgetBoundary` and `useErrorMessage`.
- CI: PR guards for `develop` (release branches only; format, lint, typecheck, tests) and `master` (develop only; version check), `scripts/check-version.ts`.

## [0.1.0] - Unreleased

### Added
- Starter pack: dataset, assistant fixtures, streaming contract, reference SSE route.
- `CLAUDE.md` and scoped agent rules in `.claude/rules/`.
- Architecture decision records in `docs/decisions/`.
- Feature-Sliced Design folder skeleton.
- Decisions on theming/dark mode (ADR 0009), i18n with static locale routing (ADR 0010), linting and formatting (ADR 0011).
- ADR 0012: API versioning, timeouts, offline guard, error pages.
- Product design spec: `docs/specs/2026-11-03-market-ops-console-design.md`.
