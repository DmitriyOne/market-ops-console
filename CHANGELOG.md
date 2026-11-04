# Changelog

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versioning: [SemVer](https://semver.org/). The top version must match `package.json` and the `release/X.Y.Z` branch.

## [0.7.0] - Unreleased

### Added
- Markets table in Analyst, full width under the map: every KPI per market of the scope (revenue, gap to forecast, attainment, growth, share, units, status), a total of the rows shown, headers that sort (in the URL as `sort`, no history entry), a sticky market column on small screens, a market name that opens the market.
- `Markets ▾` filter with removable chips; in Analyst, Shift+click or Shift+Enter on the map or the tiles, or "Add to filter" in the touch tooltip, adds a market. A hint under the map says how. A pick on the map keeps the map still.
- "Export CSV" of the table as shown: raw USD and percent numbers, English headers, UTF-8 BOM, formula-injection guard, file `markets-<period>-<range>[-<product>].csv`.
- Units in the revenue trend in Analyst (table column and chart tooltip).

### Changed
- `markets` is one selection list for the assistant, the map, the tiles and the filter; "highlighted from the assistant" now reads "selected", and the open market reads "open now".

## [0.6.0] - Unreleased

### Added
- CI on PRs into `release/*`: format check, lint (ESLint + Steiger) and typecheck, no tests (ADR 0007).
- Market map in the Market status card, behind a `Map / Tiles / Table` switch remembered per browser (map from the md width, tiles on a phone; an old "table" choice is kept). World without Antarctica, coloured by status (colour + dots / hatching) or, in Analyst, by attainment, growth, share or revenue on stepped scales with a legend that counts markets per step. Hover or keyboard focus shows name, value ("Calculated" when computed) and status; click or Enter opens the market; a touch tap shows the tooltip with an "Open" button. One finger and the plain wheel scroll the page; pinch or Ctrl/⌘ + wheel zoom, plus `+ / − / Whole world`. A drill or "Show on dashboard" flies the map to fit; a zoom set by hand survives month, window and metric changes. Status or share where they do not exist fall back to attainment with a notice. On a phone the map gets a taller frame (land fills it, only Pacific edges fall outside), smaller-looking zoom buttons with 44px targets, and "Open" in the tooltip brings the page to its top. The metric menu is not modal and keeps one width, so the card does not flash. The map loads on its own chunk.
- `kpi` URL param (map metric, Analyst only, picked in the card with the map or the table; changes replace history).
- The table view gets the map metric's column; tiles, table and map follow the chosen product (status stays market level).

### Removed
- The unused 7-step attainment scale tokens (`--scale-1…7`); the heat map will use the map's diverging scale.

### Changed
- Phone header: the app name is back on the first row next to ⚙︎; the path moves to its own row.
- Moving to another market keeps the chosen product (map, tiles, top risks, top movers, breadcrumbs); picking the current market again in the breadcrumbs goes back up from the product.

## [0.5.0] - Unreleased

### Added
- Dashboard header: drill-down path `Portfolio › Region › Market › Product` (each step opens the list of its siblings; picking the current one goes back up to it), period, mode, language and theme; on phones the path and a ⚙︎ button that opens language, theme and "Reset view" in a bottom sheet (whole rows are the targets), period and mode below. Skeleton of the same shape in the static HTML.
- Market status (variant A): markets as tiles grouped by region, status by shape, word and colour, off-track tiles hatched, attainment following the period; markets listed by the assistant ("Show on dashboard") are ringed and named as highlighted; a tile drills into its market; "Show as table" gives the same facts. Off the latest month the tiles show attainment only, with a notice.
- Top risks: non-on-track markets, off track first then by attainment, each with attainment, growth and the status word; a row drills in; an empty region says so.
- Top movers: highest and lowest growth YoY in the window for the markets of the scope (brief: "health at a glance"), with a bar per market (red only for a decline); a row drills in.
- Revenue trend: actual vs forecast vs prior year over 24 months for the current scope (Recharts, loaded on its own after the page), the selected month marked with a dashed labelled line (a labelled band for 3 / 12 months), anomalies in the data marked and named under the chart; a legend with each line's pattern, a sentence describing the selected month for screen readers, keyboard access through the Recharts accessibility layer and "Show as table" with every month.
- shadcn `card`; a `bg-hatch` utility for the off-track pattern.
- KPI cards for the current view: revenue, forecast attainment, growth YoY and markets at risk ("6 of 13", "2 off track · 4 at risk"), each with a supporting line and a 12-month line; computed figures carry a "Calculated" badge that names the formula. Off the latest month the risk card says status exists for the latest month only and offers to jump there; a product says status is per market.
- Scope title: "Veltrix · Germany" with the number of markets and products and the latest data month.
- Period picker: a month grid with a year switch (months without data cannot be picked, arrow keys move between months) and the window 1 / 3 / 12 months; both go into the URL with a history entry.
- Executive / Analyst switch; each switch is a history entry, so Back returns to the previous mode.
- The app name leads to the clean dashboard (portfolio, latest month, Executive) in one history step; on phones "Reset view" in the ⚙︎ sheet.
- "Show as table" on market status and the revenue trend is remembered per browser, and the button then reads "Show as tiles" / "Show as chart"; the card keeps its skeleton until the choice is read, so a reload never flashes the other view.
- Reset and the assistant's source / "Show on dashboard" scroll the dashboard back to its top, so the change is in view.
- Phone settings sheet: the whole Language and Theme rows open their menus and show the current choice.
- Chart motion: the trend lines draw in and move to new values, sparklines reveal left to right, mover bars grow; all off under reduced motion.
- Drill-down actions (portfolio, region, market, product) keep the period and range; a market brings its region.
- shadcn `breadcrumb`, `chart` (trimmed to the frame; Recharts 3), `sheet`, `table`, `toggle-group`.
- Dashboard URL state is checked against the data: a market brings its own region, a product needs a market, unknown ids, months, ranges and modes fall back to the default, and a bad link is corrected in place without a history entry.

- When the dataset cannot load, the dashboard shows one message with one "Try again" instead of one alert per widget; a widget that fails on its own names itself ("Couldn't load Key figures", "Try again: Key figures").
- A phone link to the Assistant tab (`?tab=assistant`) shows the assistant area from the first paint (inline script, ADR 0015) instead of flashing Overview.

### Fixed
- Review of 0.5.0: market tiles' names start with the visible code ("DE Germany, …", WCAG 2.5.3); the "Calculated" badge is a 44px target that opens the formula on tap; the header steps aside when the dataset fails, so the page shows its single message; repeated `markets` keys are read; a product step clears highlights; tiles say they are whole markets when a product is chosen; the trend table shows whole dollars; the month picker keeps focus at the first and last year; Russian verb agreement in the risk split; table caption names the window.
- Owner check of 0.5.0: a wide table no longer widens its card past the phone screen; screen-reader-only text no longer stretches the page below the tab bar; the "Calculated" badge has no grey box on hover and keeps its corner (a calculator icon in a narrow card); the selected month on the trend chart is a thin dashed line with its name (a light band for 3 / 12 months) instead of a thick grey bar; phone chart axes are shorter ("Jun 24", a tick a year); the mode and range switches have room around their labels; the phone period picker is as wide as its button; the phone Assistant tab hides the header; the bottom tab bar is a segmented track with the current section as a raised chip (owner, variant E); market status and revenue trend skeletons have the real card's title, corner button and layout; the chart tooltip shows each line's colour and pattern next to its name; a source card no longer flashes in the screen corner after "Show on dashboard" on touch screens.
- The 404 page has a skip link and a `main#main` landmark.
- Switching language keeps repeated query keys (`markets=de&markets=es`) and the `#hash`.

## [0.4.0] - 2026-11-04

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
