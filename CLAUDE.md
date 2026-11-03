# CLAUDE.md

Instructions for AI coding agents working in this repo. Humans: see `README.md`.

## Project

Market Ops Console: a streaming AI assistant and an analytical dashboard over one market dataset (`data/data.json`). Take-home for NewPage Solutions, due 2026-11-09. Requirements: `docs/STARTER_PACK.md`, `docs/CONTRACT.md`.

## Working agreement

1. **Never push, merge, or open PRs.** Commit locally; the owner pushes.
2. **Do not make project decisions alone.** If something is not covered by `docs/decisions/`, ask first. This includes new dependencies, folder changes, and changes to the stack.
3. **Follow the agreed architecture** (`docs/decisions/`). Do not deviate. If it seems wrong, say so and ask; do not work around it.
4. **Before starting a task, ask.** Clarify anything ambiguous, and raise things the owner may not have considered (edge cases, a11y, tests, impact on other slices).
5. **Report briefly and completely.** Format: *Found / Done / Not done / Risks*. No filler. Never hide skipped steps, failing checks, or workarounds. The owner must be able to understand how it works and spot problems from the report alone.

## Reuse before you write (DRY)

Before creating any component, hook, or helper:

1. Search `src/shared` (and the relevant `entities`) for an existing one.
2. Search shadcn/ui: `pnpm dlx shadcn@latest search <name>`. Prefer adding the shadcn component over writing one.
3. Only then write a new one, in the lowest layer where it is reused.

Logic used in two places goes into a shared function. No copy-paste variants.

## Architecture: Feature-Sliced Design v2.1

Detailed rules: `.claude/rules/fsd.md` (auto-loads for `src/**`). Decision: `docs/decisions/0005-feature-sliced-design.md`.

- Next.js `app/` (repo root) is **routing only**: each `page.tsx` re-exports a page from `src/pages`.
- `src/pages` **composes widgets/features.** It may read URL params and choose a layout; everything else (fetching, calculations, formatting, behaviour) lives in features.
- Layers: `app → pages → widgets → features → entities → shared`. Import only downward. Each slice exposes a public API via `index.ts`; never deep-import into another slice.
- Build `shared` and `entities` first; features and widgets build on them.

## Stack (fixed, see `docs/decisions/0002-stack.md`)

Next.js 16 App Router · React 19 · TypeScript 6 strict · Tailwind v4 + shadcn/ui · next-themes · TanStack Query · nuqs · zod · react-hook-form · `@t3-oss/env-nextjs` · `eventsource-parser` · shadcn charts (Recharts) · react-simple-maps · Vitest + Testing Library + MSW · Playwright (one local E2E) · Vercel.

## Code rules

- No `any`, no `as` casts to silence errors. Validate external data with zod at the boundary; infer types from schemas.
- Env vars only through `src/shared/config/env.ts` (`@t3-oss/env-nextjs`). Never read `process.env` directly.
- Render model output as text. Never `dangerouslySetInnerHTML`.
- Colours, spacing, radii come from design tokens. No raw hex or arbitrary Tailwind values. Every colour token has a light (`:root`) and dark (`.dark`) value.
- Every chart ships with an accessible alternative (table), keyboard access, and a non-colour signal.

## Git

Flow: `feature/*` → `release/X.Y.Z` → `develop` → `master`. Only `release/*` merges into `develop`, only `develop` into `master`. Version in `package.json` = top entry of `CHANGELOG.md` = release branch number. Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`, `test:`, `refactor:`).

## Where context lives

| What | Where |
| --- | --- |
| Decisions and their reasons (ADR) | `docs/decisions/` |
| Specs (what we build) | `docs/specs/` |
| Implementation plans | `docs/plans/` |
| Scoped rules, loaded by path | `.claude/rules/` |
| Change history | `CHANGELOG.md` |

Update the relevant doc in the same commit as the change. A new decision gets a new ADR.

## Commands

To be added after scaffolding (`dev`, `build`, `typecheck`, `lint`, `test`, `e2e`).

## Do not

- Write the README sections that ask for the owner's own reasoning (approach, decisions, AI usage, "what I'd do differently"). Draft structure only; the owner writes them.
- Add Storybook, Redux/Zustand, Vercel AI SDK, husky, or a real backend.
