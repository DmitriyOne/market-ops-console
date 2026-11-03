# 0002. Stack

| Concern | Choice | Why | Rejected |
| --- | --- | --- | --- |
| Framework | Next.js 16 App Router | Required by brief; reference chat route drops in as a route handler; Vercel deploy | Remix, TanStack Start: no gain, route must be rewritten |
| Language | TypeScript 6, `strict`, `noUncheckedIndexedAccess` | Brief requires end-to-end types, no `any` | TS 7 (July 2026, Go compiler): parts of the toolchain still catching up |
| UI | Tailwind v4 + shadcn/ui (Radix), class merging with shadcn's `cn` package | Token-based design system, accessible primitives, source in repo; generated components import `cn` as-is | MUI/Chakra: heavier, harder to own tokens; own `clsx` + `tailwind-merge` helper (every `shadcn add` needed a manual import fix) |
| Theme | next-themes | Official shadcn dark-mode approach, no flash on load (ADR 0009) | Own provider |
| Server state | TanStack Query | Caching, optimistic update + rollback | SWR: weaker mutation story |
| URL state | nuqs | Typed search params as `useState`, back/forward works | Hand-rolled `useSearchParams` parsing |
| Validation | zod | One schema → runtime check + TS type | — |
| Forms | react-hook-form + zod resolver | Type-safe, field arrays for alert rules | Formik: less maintained |
| Env | `@t3-oss/env-nextjs` | Validates env with zod at build, typed access | Raw `process.env` |
| i18n + formatting | next-intl 4, `as-needed` locale routing, static pages | Typed keys, ICU plurals, one formatter for server and client (ADR 0010) | `Intl` only, react-i18next, numeral/date-fns |
| Lint / format | Prettier + ESLint 10 + Steiger | ADR 0011 | ESLint-only `@stylistic`, Biome |
| Tables | TanStack Table (+ Virtual if stretch) | Headless, works with shadcn table | AG Grid: heavy |
| Tests | Vitest + Testing Library + MSW; Playwright (1 E2E, local) | See ADR 0008 | Jest: slower with ESM |
| Hosting | Vercel | Native Next.js, free previews | — |

Package manager: pnpm. Design references: `ui-ux-pro-max` skill, then Claude Design artifact.
