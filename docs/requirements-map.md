# Brief → where it is → how to check

Every requirement of the brief, where the code is, and a link or test that shows it. Live: https://df-market-ops-console.vercel.app (links below are relative to it). Tests: `pnpm test` (unit and component), `pnpm e2e` (Playwright, desktop and phone).

## Assistant

| Brief | Where | Check |
|---|---|---|
| Stream token by token (SSE / streaming fetch) | `src/shared/api/http/stream-sse.ts`, `src/features/ask-question/model/use-chat-stream.ts`, `app/api/v1/chat/route.ts` | Ask anything; `e2e/happy-path.spec.ts` counts >20 DOM updates per answer |
| Clear in-progress states, stop a generation | `src/widgets/assistant-panel/ui/AnswerMessage.tsx`; Stop aborts the request and the server loop | "Give me a full summary of the portfolio", then Stop; `e2e/assistant.spec.ts` checks the request is aborted |
| Cite evidence (markets, products, periods) | `SourceButton.tsx`, `EvidenceCard.tsx`, `src/entities/performance/model/citation.ts` | "Why did Germany dip?" → hover a source (numbers, trend), click it → the dashboard opens that market and month |
| Confidence and uncertainty, honestly | `AnswerMessage.tsx` (meter + word; Low adds "Treat as directional") | "Compare APAC and Europe" (medium), "Which markets are at risk?" |
| Say when it can't answer | `AnswerMessage.tsx` (abstain frame + what the data covers) | "What will sales be next year?" |
| AI vs authoritative data, visually and structurally | AI surface tokens + "AI answer · may be incomplete"; "What the data shows" built from the dataset only: `src/widgets/assistant-panel/model/data-check.ts` | Any cited answer → "What the data shows" |
| The four example questions | `src/features/ask-question/config/suggestions.ts` (chips) | The chips in the empty assistant |
| Error, partial, empty states | error frame + Try again (replaces the failed answer), Stopped frame, empty state with chips | "force error"; Stop mid-answer |
| Contract: `POST /api/chat`, SSE `token` / `done` / `error`, typed | `src/shared/api/chat/contract.ts` (zod, both ends); served at `/api/v1/chat`, `/api/chat` rewritten to it (ADR 0012) | `curl -N -X POST …/api/chat -H 'content-type: application/json' -d '{"question":"germany"}'`; `e2e/resilience.spec.ts` |

## Dashboard

| Brief | Where | Check |
|---|---|---|
| Drill portfolio → region → market → product without losing context | `src/entities/performance/model/dashboard-state.ts`, `DrillBreadcrumbs.tsx` | `/dashboard?region=eu&market=de&product=veltrix` |
| Health at a glance: totals, trend, top movers, markets at risk | `src/pages/dashboard/ui/Overview.tsx` (KPI strip, trend, Top movers, Top risks) | `/dashboard` |
| Choropleth by a KPI, click to drill | `src/widgets/market-status/ui/MarketMap.tsx` | Click Germany on the map; Analyst: the KPI picker |
| Radar comparing markets or regions | `src/widgets/comparison-radar/` | `/dashboard?mode=analyst`; Shift+click markets on the map |
| Time series: actual vs forecast vs prior year | `src/widgets/revenue-trend/ui/TrendChart.tsx` | `/dashboard`, Revenue trend |
| One advanced chart | Heat map, markets × months, diverging: `src/widgets/heat-map/ui/HeatGrid.tsx` | `/dashboard?mode=analyst&range=12m` |
| Executive and analyst modes | `src/features/switch-mode`, `Overview.tsx` | Executive / Analyst switch |
| Coordinated views | map → drill; map Shift+click or table filter → selection narrows table and radar (`src/features/select-markets`); period → radar, trend, heat map | Pick markets, change the period |
| URL reflects path, selection, filters; back / forward | nuqs + `dashboard-state.ts` (repairs bad links in place), Share link button | `e2e/history.spec.ts`, `e2e/share.spec.ts` |
| Accessible charts: table alternative, ARIA, keyboard, not colour alone | "Show as table" on every chart; map paths focusable with value + status; heat map is an ARIA grid; patterns and shapes besides colour | `e2e/a11y.spec.ts` (axe, WCAG 2.1 A/AA, desktop and phone); Tab through the map |
| Currency, large numbers, percentages, dates for many markets | `src/shared/config/i18n/formats.ts`; en-GB, en-US, de-DE, ru-RU; USD / EUR / GBP | `/de-DE/dashboard?currency=EUR` |
| Schema-validated form, optimistic save, rollback | `src/features/configure-alerts/ui/RuleForm.tsx`; one zod schema for form and route: `src/shared/api/alerts/schema.ts`; `use-rule-mutations.ts` | Alerts → New rule; "Fail the next save (demo)" shows the rollback; `e2e/alerts.spec.ts` |

## Engineering

| Brief | Where | Check |
|---|---|---|
| React 18+, TypeScript, Next.js App Router; typed contract and events; no `any` | `package.json`; `src/shared/api/chat/contract.ts`; strict TS; `typescript-eslint` strict-type-checked bans `any`; no `as` casts but `as const` (project rule) | `pnpm typecheck && pnpm lint` |
| Components on design tokens | `src/app/styles/globals.css` (`@theme`), `DESIGN.md`; lint and a test forbid raw colours | `src/app/styles/tokens.test.ts` |
| Server vs client state, deliberate | TanStack Query (dataset prefetched into the static page, alert rules), nuqs (URL), localStorage (preferences), sessionStorage (chat): ADR 0006 | — |
| Component / integration tests + one E2E happy path | 140+ Vitest files, 940+ tests; `e2e/happy-path.spec.ts` (map → Germany → ask → source opens the month) | `pnpm test`, `pnpm e2e` |
| Resilience: error boundaries, degradation, safe model output | `src/shared/ui/widget-boundary.tsx` per widget; offline guard; 404 / 500 pages; answers rendered as text, never HTML | `e2e/resilience.spec.ts` |
| Observability | Sentry: errors, traces, web vitals from the browser, logs; body-only tunnel `/monitoring` (ADR 0019) | — |
| CI/CD, deployed | `.github/workflows/` (format, lint, types, unit, E2E on pull requests); Vercel | https://df-market-ops-console.vercel.app |

## Measured (2026-11-06, production 0.15.0)

Lighthouse 12.8.2, https://df-market-ops-console.vercel.app/dashboard, Chrome headless; mobile = Lighthouse's default throttling (slow 4G, 4× CPU).

| | Performance | Accessibility | Best practices | SEO | LCP | FCP | TBT | CLS | JS transferred |
|---|---|---|---|---|---|---|---|---|---|
| Desktop | 99 | 100 | 100 | 63 | 1.0 s | 0.3 s | 0 ms | 0.019 | 698 KB, 28 files |
| Mobile | 68 | 100 | 100 | 63 | 5.5 s | 1.1 s | 450 ms | 0 | 625 KB, 27 files |

- SEO 63 is on purpose: `robots.txt` disallows everything and pages are `noindex` (a demo, ADR 0018); every other SEO check passes.
- Mobile LCP: the largest element is the line under the title, which is drawn once the URL is read on the client (the static page shows a skeleton in its place, so a shared link never flashes the default view, ADR 0010). 89 % of the 5.5 s is render delay on a 4× slower CPU: JavaScript parse and hydration. What would bring it down is in `docs/plans/backlog.md`.
- All JS chunks of the build: 34 files, 980 KB gzip, of which the largest (250 KB) is ExcelJS, loaded only when Excel export is clicked.
