---
paths:
  - "src/**"
  - "app/**"
---

# Feature-Sliced Design rules

## Layers (import only downward)

| Layer | Holds | Example here |
| --- | --- | --- |
| `src/app` | Providers, global styles, tokens | `QueryClientProvider`, `NuqsAdapter`, locale provider |
| `src/pages` | Page composition only | `dashboard`, `assistant` |
| `src/widgets` | Self-contained screen blocks | map panel, radar panel, chat panel, health summary |
| `src/features` | User actions with business value | drill-down, select period, ask question, stop generation, configure alerts |
| `src/entities` | Business entities: types, schemas, selectors, small UI | market, region, product, citation, chat-message |
| `src/shared` | Business-agnostic code | `ui` (shadcn), `lib` (format, sse), `api`, `config` (env, tokens) |

`processes` is deprecated in FSD v2.1 and not used.

## Slices and segments

- Segments inside a slice: `ui/`, `model/`, `api/`, `lib/`, `config/`. Create only the ones you need.
- Public API: every slice has `index.ts`. Import `@/entities/market`, never `@/entities/market/model/selectors`.
- No cross-imports between slices of the same layer. If two features need the same thing, move it down.
- Pages-first (v2.1): keep code in the widget/page that uses it until a second consumer appears; then move it down.

## Pages contain no logic

`src/pages/*` imports widgets/features and lays them out. Allowed: reading URL params (via the owning slice's nuqs hook) and passing them down, simple conditional layout (e.g. executive vs analyst). Not allowed: data fetching, calculations, formatting, effects with behaviour, anything more than a few lines. When in doubt, it belongs in a feature.

Import boundaries are checked by Steiger (`steiger` + `@feature-sliced/steiger-plugin`).

## Next.js App Router

- Root `app/` is routing only: pages live under `app/[locale]/` (ADR 0010); `page.tsx` = `export { DashboardPage as default } from '@/pages/dashboard'`. `proxy.ts` sits at the repo root. Route handlers (`app/api/v1/*`) may call into `src/shared/api` or `src/entities/*/api`.
- Root `pages/` exists empty (with README) so Next.js does not treat `src/pages` as the Pages Router.

## Where state and React Context live

1. **URL state** (drill path, period, selection, mode): `nuqs`, parsers defined in the owning entity/feature `model/`.
2. **Server state** (dataset, alert rules): TanStack Query, query keys and hooks in the entity `api/`.
3. **Local stream state** (chat): `useReducer` in `features/ask-question/model`.
4. **React Context**: only for dependency-style values, not for app state.
   - App-wide (QueryClient, nuqs adapter, `NextIntlClientProvider`, theme): provider in `src/app/providers`, hook exported from `shared` or the owning entity.
   - Slice-scoped (e.g. a chat session): context + provider in that slice's `model/`, exported via its `index.ts`, mounted by the widget that owns it.
