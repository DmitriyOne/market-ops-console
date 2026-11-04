# 0006. State split

| State | Tool | Lives in |
| --- | --- | --- |
| Dataset, alert rules (server) | TanStack Query | entity `api/` |
| Drill path, period, selection, mode (shareable) | nuqs (URL) | parsers in entity/feature `model/` |
| Chat stream | `useReducer` in `useChatStream`; finished messages copied to `sessionStorage` `mo:chat:v1` (per tab, last 50, read after hydration) **[owner, 2026-11-04]** | `features/ask-question/model` |
| Collapsed assistant panel | `localStorage` `mo:assistant-collapsed` + `data-assistant-collapsed` on `<html>` (ADR 0015) | `widgets/app-shell/model` |
| Ephemeral UI (open panel, hover) | `useState` | component |
| Theme | `@wrksz/themes` (localStorage) | provider in the root layout `app/[locale]/layout.tsx` (ADR 0009) |
| Locale | URL prefix (`as-needed`) + `NEXT_LOCALE` cookie | next-intl routing, ADR 0010 |
| Dependency-style values (QueryClient, intl messages) | React Context | QueryClient: `src/app/providers`; `NextIntlClientProvider`: root layout `app/[locale]/layout.tsx` (ADR 0010) |

React Context is not used for app state. No Redux/Zustand: the three tools above cover every case.

URL shape (draft): `/[de-DE/]dashboard?region=eu&market=de&product=veltrix&period=2026-03&compare=de,it&mode=analyst&kpi=attainment`.
