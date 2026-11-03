# 0002. Stack

| Concern | Choice | Why | Rejected |
| --- | --- | --- | --- |
| Framework | Next.js 16 App Router | Required by brief; reference chat route drops in as a route handler; Vercel deploy | Remix, TanStack Start: no gain, route must be rewritten |
| Language | TypeScript 6, `strict`, `noUncheckedIndexedAccess` | Brief requires end-to-end types, no `any` | TS 7 (July 2026, Go compiler): parts of the toolchain still catching up |
| UI | Tailwind v4 + shadcn/ui (Radix) | Token-based design system, accessible primitives, source in repo | MUI/Chakra: heavier, harder to own tokens |
| Server state | TanStack Query | Caching, optimistic update + rollback | SWR: weaker mutation story |
| URL state | nuqs | Typed search params as `useState`, back/forward works | Hand-rolled `useSearchParams` parsing |
| Validation | zod | One schema → runtime check + TS type | — |
| Forms | react-hook-form + zod resolver | Type-safe, field arrays for alert rules | Formik: less maintained |
| Env | `@t3-oss/env-nextjs` | Validates env with zod at build, typed access | Raw `process.env` |
| Formatting | `Intl` | Currency, compact numbers, %, dates per locale, no dependency | numeral/date-fns |
| Tables | TanStack Table (+ Virtual if stretch) | Headless, works with shadcn table | AG Grid: heavy |
| Tests | Vitest + Testing Library + MSW; Playwright (1 E2E, local) | See ADR 0008 | Jest: slower with ESM |
| Hosting | Vercel | Native Next.js, free previews | — |

Package manager: pnpm. Design references: `ui-ux-pro-max` skill, then Claude Design artifact.
