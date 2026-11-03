# AGENTS.md

Entry point for AI coding agents in this repo. It holds no rules of its own
on purpose: the single source of truth is [`CLAUDE.md`](./CLAUDE.md), and a
second copy of the same rules would drift from it on the first edit.

**Read before the first line of code:**

1. [`CLAUDE.md`](./CLAUDE.md): working agreement, Feature-Sliced Design,
   stack, conventions, commands.
2. [`DESIGN.md`](./DESIGN.md): tokens, type, spacing, the component
   inventory and a checklist, whenever the work touches the UI.
3. [`docs/decisions/`](./docs/decisions): one ADR per decision, with the
   options and why one was chosen. [`docs/specs/`](./docs/specs) and
   [`docs/plans/`](./docs/plans) for what is being built and in what order.

**The rules broken most often:**

- **Never push, merge or open PRs**, and never commit to `release/*`,
  `develop` or `master`. Work on `feature/X.Y.Z/<task>`; the owner pushes.
- **No project decision alone.** Not covered by an ADR: ask the owner
  first, then record the answer in `docs/decisions/`.
- **Lint rules are never relaxed** (ESLint, Steiger, TypeScript), not even
  with an inline `eslint-disable`. Fix the code or ask.
- **No string literals in JSX**: every string in
  `src/shared/config/i18n/messages/{en,de,ru}.json`, numbers and dates only
  through `formats.ts`.
- **Semantic tokens only** (`bg-surface-ai`, `text-status-at-risk`): no
  raw colours, no arbitrary Tailwind values. See `DESIGN.md`.
- **Network in tests goes through MSW** (`@/shared/lib/test`); an
  unmocked request fails the test.
- **Deferred review findings** go to `docs/plans/backlog.md`, not only
  into a report.

**Before writing a component:** `src/shared/ui` first, then the shadcn
registry (`pnpm dlx shadcn@latest search <name>`), and only then a new one,
after asking the owner.

**Checks before every commit:** `pnpm format && pnpm lint && pnpm typecheck
&& pnpm test`; `pnpm build` must stay static for all four locales.

The block below is written and kept up to date by `next dev`; edit only
outside its markers.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
