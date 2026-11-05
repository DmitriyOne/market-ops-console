# 0006. State split

| State | Tool | Lives in |
| --- | --- | --- |
| Dataset, alert rules (server) | TanStack Query | entity `api/` |
| Drill path, period, selection, mode, map metric `kpi` (shareable) | nuqs (URL) | parsers in entity/feature `model/` |
| Chat stream | `useReducer` in `useChatStream`; messages copied to `sessionStorage` `mo:chat:v1` when one starts or ends (per tab, last 50, read after hydration) **[owner, 2026-11-04]** | `features/ask-question/model` |
| Mode for the static skeletons | `data-mode="analyst"` on `<html>`, set before paint from `?mode=` (ADR 0015) and kept in step with the URL by `useModeAttribute`; the URL stays the source | `features/switch-mode/model` |
| Collapsed assistant panel | `localStorage` `mo:assistant-collapsed` + `data-assistant-collapsed` on `<html>` (ADR 0015) | `widgets/app-shell/model` |
| Remembered card views (market status `map / tiles / table`, trend chart or table) | `localStorage` via `useStoredChoice` / `useStoredFlag` (`mo:market-status-view`, `mo:revenue-trend-table`); unknown while hydrating, so the card keeps its skeleton | `shared/lib/storage` |
| Ephemeral UI (open panel, hover, map tooltip, map zoom) | `useState` | component |
| Theme | `@wrksz/themes` (localStorage) | provider in the root layout `app/[locale]/layout.tsx` (ADR 0009) |
| Locale | URL prefix (`as-needed`) + `NEXT_LOCALE` cookie | next-intl routing, ADR 0010 |
| Dependency-style values (QueryClient, intl messages, the popups' scroll boundary) | React Context | QueryClient: `src/app/providers`; `NextIntlClientProvider`: root layout `app/[locale]/layout.tsx` (ADR 0010); `PopperBoundary` (`<main>`): `shared/ui`, provided by `widgets/app-shell` |

React Context is not used for app state. No Redux/Zustand: the three tools above cover every case.

URL shape: `/[de-DE/]dashboard?region=eu&market=de&product=veltrix&period=2026-03&range=3m&mode=analyst&kpi=attainment&markets=de&markets=es&sort=-growth` (defaults are not written; `markets` is the one selection list, `sort` the markets table order; the M4 radar compares the selected markets, no `compare` param). A selection change is a history entry (`push`), a sort is not (`replace`); a broken value (unknown or repeated market, unknown sort) is corrected in place with `replace`.
