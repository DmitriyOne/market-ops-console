# Changelog

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versioning: [SemVer](https://semver.org/). The top version must match `package.json` and the `release/X.Y.Z` branch.

## [0.4.0] - Unreleased

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
