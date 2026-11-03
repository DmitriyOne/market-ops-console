# 0006. State split

| State | Tool | Lives in |
| --- | --- | --- |
| Dataset, alert rules (server) | TanStack Query | entity `api/` |
| Drill path, period, selection, mode (shareable) | nuqs (URL) | parsers in entity/feature `model/` |
| Chat stream (local, transient) | `useReducer` in `useChatStream` | `features/ask-question/model` |
| Ephemeral UI (open panel, hover) | `useState` | component |
| Theme, locale (personal settings) | next-themes (localStorage), cookie read by next-intl | providers in `src/app/providers` |
| Dependency-style values (QueryClient, intl messages) | React Context | `src/app/providers` |

React Context is not used for app state. No Redux/Zustand: the three tools above cover every case.

URL shape (draft): `/dashboard?region=eu&market=de&product=veltrix&period=2026-03&compare=de,it&mode=analyst&kpi=attainment`.
