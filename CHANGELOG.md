# Changelog

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versioning: [SemVer](https://semver.org/). The top version must match `package.json` and the `release/X.Y.Z` branch.

## [0.4.0] - Unreleased

### Added
- Assistant (ADR 0014, variant A): streamed answers with Stop, Retry, confidence and one source button per citation; hover, focus or tap shows an evidence card with the real numbers; clicking focuses the dashboard through the URL.
- "What the data shows" block under each answer: portfolio row, cited rows and two deterministic gap rules ("Not mentioned" markets, region gaps), expanded when a gap is found; "Show on dashboard" highlights the listed markets.
- Composer with Enter / Shift+Enter / Esc, a 500-character limit with counter, four suggested questions (translated label, English question) and an "English only" notice for non-English text.
- App shell: assistant as a right panel on desktop (collapsible, remembered, badge for unseen answers), Overview / Assistant tabs on phones.
- MSW test harness for the SSE chat stream and the data route.

### Changed (owner review, 2026-11-03)
- Assistant header "Assistant · Answers in English"; one-line composer placeholder.
- A non-English question gets a reply "I only understand English…" instead of being sent.
- Answers without matching data read as "I can't answer this from the data"; the suggested questions appear after two such replies in a row.
- Confidence shown as three equal bars; percents always with one decimal.
- Evidence card: latest status for a past month, the month's anomaly, a marked trend with period labels.
- "What the data shows" is a table like the design reference, with "Not mentioned in the answer" and an attention summary; closed by default, the header notes gaps.
- Page title and description per locale; `noindex, nofollow` (internal console).
- Pointer cursor on clickable controls; hover cards keep 15px from the screen edge; the evidence chart fills the card.

- A streaming answer starts in a neutral frame; the AI or "can't answer" style is applied when it finishes (its kind arrives only at `done`).
- `AGENTS.md` (entry point for coding agents, keeps the `next dev` block) and `DESIGN.md` (tokens, type, spacing, inventory, checklist).

### Fixed
- Screen-reader-only text inside the chat log no longer stretches the page with an empty scroll area.
- A collapsed assistant no longer flashes open on reload: the state is applied in `<head>` before the first paint.

### Fixed
- Chat route validates the request before reading fixtures, so a bad request is always a 400.
- A failing write in the chat stream can no longer throw out of the stream's error fallback.
- Error logs use the error name (e.g. `TimeoutError`) as `code` for errors that are not `AppError`.

### Changed
- `withErrorHandling` is exported only from `@/shared/api/server`.

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
