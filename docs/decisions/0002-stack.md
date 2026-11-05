# 0002. Stack

| Concern | Choice | Why | Rejected |
| --- | --- | --- | --- |
| Framework | Next.js 16 App Router | Required by brief; reference chat route drops in as a route handler; Vercel deploy | Remix, TanStack Start: no gain, route must be rewritten |
| Language | TypeScript 6, `strict`, `noUncheckedIndexedAccess` | Brief requires end-to-end types, no `any` | TS 7 (July 2026, Go compiler): parts of the toolchain still catching up |
| UI | Tailwind v4 + shadcn/ui (Radix), class merging with shadcn's `cn` package | Token-based design system, accessible primitives, source in repo; generated components import `cn` as-is | MUI/Chakra: heavier, harder to own tokens; own `clsx` + `tailwind-merge` helper (every `shadcn add` needed a manual import fix) |
| Theme | `@wrksz/themes` | Drop-in for the shadcn `next-themes` approach, no flash on load, no React 19 script warning (ADR 0009) | `next-themes` (React 19 warning, unmaintained); own provider |
| Server state | TanStack Query | Caching, optimistic update + rollback | SWR: weaker mutation story |
| URL state | nuqs | Typed search params as `useState`, back/forward works | Hand-rolled `useSearchParams` parsing |
| Validation | zod | One schema → runtime check + TS type | — |
| Forms | react-hook-form + zod resolver (installed with alerts) | Type-safe, field arrays for alert rules | Formik: less maintained |
| Env | `@t3-oss/env-nextjs` | Validates env with zod at build, typed access | Raw `process.env` |
| i18n + formatting | next-intl 4, `as-needed` locale routing, static pages | Typed keys, ICU plurals, one formatter for server and client (ADR 0010) | `Intl` only, react-i18next, numeral/date-fns |
| Lint / format | Prettier + ESLint 10 + Steiger | ADR 0011 | ESLint-only `@stylistic`, Biome |
| Tables | shadcn `Table` + a sort/filter selector in the entity (0.7.0, plan 2026-11-04-05, owner-approved) | 13 rows: sort, filter and totals are a few lines of pure, tested code; the state lives in the URL anyway | TanStack Table (planned first; no gain at 13 rows), AG Grid: heavy |
| Excel export | ExcelJS 4, `import()` on click (0.7.0, owner) | Real Excel tables (filters, banding, frozen panes, formats, conditional colours); its own ~256 KB gz chunk, not in the first load | CSV only (one column in Excel with Russian regional settings, no filters), SheetJS CE (styles need the paid build) |
| Tests | Vitest + Testing Library + MSW; Playwright (1 E2E, local) | See ADR 0008 | Jest: slower with ESM |
| Hosting | Vercel | Native Next.js, free previews | — |

Package manager: pnpm. Design references: `ui-ux-pro-max` skill, then Claude Design artifact.
