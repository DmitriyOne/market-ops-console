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

Next.js 16 App Router · React 19 · TypeScript 6 strict · Tailwind v4 + shadcn/ui · `@wrksz/themes` · TanStack Query · nuqs · zod · react-hook-form · next-intl (`as-needed` routing, static pages) · `@t3-oss/env-nextjs` · `eventsource-parser` · shadcn charts (Recharts) · react-simple-maps · Vitest + Testing Library + MSW · Playwright (one local E2E) · Prettier + ESLint 10 + Steiger · Vercel.

## Code rules

- No `any`, no `as` casts to silence errors. Validate external data with zod at the boundary; infer types from schemas.
- Env vars only through `src/shared/config/env.ts` (`@t3-oss/env-nextjs`). Never read `process.env` directly.
- No string literals in UI: visible text, `aria-label`, `alt`, `title`, `placeholder`, zod messages come from `src/shared/config/i18n/messages`.
- Format numbers, currency, percentages and dates only through next-intl global formats (`src/shared/config/i18n/formats.ts`). No ad-hoc `Intl.*` or `toFixed` for display.
- Render model output as text. Never `dangerouslySetInnerHTML`.
- Every network call goes through the shared client in `src/shared/api` (timeouts, typed errors). API paths only from `src/shared/config/api-routes.ts` (`/api/v1/*`).
- Errors (ADR 0013): route handlers are wrapped in `withErrorHandling`; throw `AppError` subclasses, not bare `Error`. Wrap each widget in `WidgetBoundary`. Show failures via `useErrorMessage()`. Log only through `logError`. No empty `catch`.
- Colours, spacing, radii come from design tokens. No raw hex or arbitrary Tailwind values. Every colour token has a light (`:root`) and dark (`.dark`) value.
- Every chart ships with an accessible alternative (table), keyboard access, and a non-colour signal.

## Git

Flow: `feature/X.Y.Z/NAME` (or `fix/X.Y.Z/NAME`) → `release/X.Y.Z` → `develop` → `master`. Only `release/*` merges into `develop`, only `develop` into `master`.

**Never commit directly to `release/*`, `develop` or `master`.** Release branches only receive merges. All work happens on a `feature/X.Y.Z/NAME` (or `fix/X.Y.Z/NAME`) branch created from `release/X.Y.Z`, where `X.Y.Z` is that release (e.g. `feature/0.2.0/foundation`); the owner merges it back. Never use `release/X.Y.Z/...`: git cannot hold `release/0.2.0` and `release/0.2.0/x` at once, and CI treats every `release/*` head as a release. Before the first commit of a task, check the current branch (`git branch --show-current`) and ask which feature branch to use if unsure. Version in `package.json` = top entry of `CHANGELOG.md` = release branch number. Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`, `test:`, `refactor:`).

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

```bash
pnpm dev            # http://localhost:3000
pnpm build          # production build; check routes stay static
pnpm format         # Prettier (code only; *.md is hand-written)
pnpm format:check
pnpm lint           # next typegen + ESLint + Steiger
pnpm typecheck      # next typegen + tsc
pnpm test           # Vitest, single run
```

Run `format`, `lint`, `typecheck` and `test` before every commit; there are no git hooks.

## Do not

- Write the README sections that ask for the owner's own reasoning (approach, decisions, AI usage, "what I'd do differently"). Draft structure only; the owner writes them.
- Add Storybook, Redux/Zustand, Vercel AI SDK, husky, or a real backend.
- Switch off or relax a lint rule (ESLint, Steiger, TypeScript) on your own. Fix the code, or ask the owner; approved exceptions are listed in the ADR.
