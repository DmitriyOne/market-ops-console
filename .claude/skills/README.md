# Agent skills used to build this app

Skills are instruction packs for the AI agent (Claude Code): they load when a task matches and tell the agent how to work in that area. These are the ones used on this project, copied here as they were published, so a reviewer can read exactly what the agent was told. Claude Code also picks them up as project skills when the repo is opened.

They are third-party files, kept as published: lint and Prettier skip this folder (like `reference/`).

| Skill | Source | What it was used for |
|---|---|---|
| `next-best-practices` | public skills catalogue | Every task: App Router conventions, RSC boundaries, metadata, error files |
| `vercel-react-best-practices` | Vercel, MIT | Every task: rendering, bundle size, re-renders, hydration without a flash (ADR 0015) |
| `vercel-composition-patterns` | Vercel, MIT | Every task: component APIs without boolean-prop sprawl |
| `react-query` | Mindrally skills | Every task with server state: queries, optimistic alert writes and rollback (ADR 0016) |
| `ui-ux-pro-max` | public skills catalogue | The design direction and tokens (ADR 0014, `DESIGN.md`) |
| `accessibility` | web-quality-skills, MIT | Audit of the assistant panel and the a11y pass (0.11.0) |
| `error-handling-patterns` | public skills catalogue | Where errors are caught and how they are logged (ADR 0013) |
| `github-actions-efficiency` | public skills catalogue | CI on a free plan: one job per check, caches, the E2E job (ADR 0007) |
| `code-review` | public skills catalogue | Branch reviews before a release |
| `superpowers-brainstorming` | Superpowers (Jesse Vincent), MIT | Turning the brief into the spec (`docs/specs`) |
| `superpowers-writing-plans` | Superpowers, MIT | One plan per milestone (`docs/plans`) |
| `superpowers-executing-plans` | Superpowers, MIT | Working through a plan task by task |
| `superpowers-test-driven-development` | Superpowers, MIT | A failing test first, then the code |

Used but **not copied** here:

| Skill | Why not here | What it was used for |
|---|---|---|
| `dataviz` | Built into Claude Code, not a separate package | Chart colours checked with its palette validator (colour blindness, contrast; ADR 0004) |
| `gdpr-compliance` | A plugin with no licence file found, so not redistributed | Sentry and personal data under UK and EU rules (ADR 0019) |
| Sentry's agent skill | Read online at `skills.sentry.dev` | Setting up Sentry (ADR 0019) |

The project's own rules for the agent are in `CLAUDE.md`, `AGENTS.md` and `.claude/rules/`.
