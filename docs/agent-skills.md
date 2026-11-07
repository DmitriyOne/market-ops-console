# Agent skills used to build this app

Skills are instruction packs for the AI agent (Claude Code). One loads when a task matches it and tells the agent how to work in that area. These are the ones used on this project. They are not copied into the repo: each links to where it is published.

| Skill | Source | What it was used for |
|---|---|---|
| `next-best-practices` | [vercel-labs/next-skills](https://github.com/vercel-labs/next-skills) | Every task: App Router conventions, RSC boundaries, metadata, error files |
| `vercel-react-best-practices` | [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) | Every task: rendering, bundle size, re-renders, hydration without a flash (ADR 0015) |
| `vercel-composition-patterns` | [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) | Every task: component APIs without boolean-prop sprawl |
| `react-query` | [Mindrally/skills](https://github.com/Mindrally/skills) | Server state: queries, optimistic alert writes and rollback (ADR 0016) |
| `ui-ux-pro-max` | [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) | The design direction and tokens (ADR 0014, `DESIGN.md`) |
| `accessibility` | [addyosmani/web-quality-skills](https://github.com/addyosmani/web-quality-skills) | Audit of the assistant panel and the accessibility pass (0.11.0) |
| `error-handling-patterns` | [wshobson/agents](https://github.com/wshobson/agents) | Where errors are caught and how they are logged (ADR 0013) |
| `github-actions-efficiency` | [github/awesome-copilot](https://github.com/github/awesome-copilot) | CI on a free plan: one job per check, caches, the E2E job (ADR 0007) |
| `code-review` | [anthropics/knowledge-work-plugins](https://github.com/anthropics/knowledge-work-plugins) | Branch reviews before a release |
| `brainstorming` | [obra/superpowers](https://github.com/obra/superpowers) | Turning the brief into the spec (`docs/specs`) |
| `writing-plans` | [obra/superpowers](https://github.com/obra/superpowers) | One plan per milestone (`docs/plans`) |
| `executing-plans` | [obra/superpowers](https://github.com/obra/superpowers) | Working through a plan task by task |
| `test-driven-development` | [obra/superpowers](https://github.com/obra/superpowers) | A failing test first, then the code |
| `gdpr-compliance` | [Sushegaad/Claude-Skills-Governance-Risk-and-Compliance](https://github.com/Sushegaad/Claude-Skills-Governance-Risk-and-Compliance) | Sentry and personal data under UK and EU rules (ADR 0019) |
| Sentry's agent skill | [getsentry/skills](https://github.com/getsentry/skills) | Setting up Sentry (ADR 0019) |
| `dataviz` | Built into Claude Code | Chart colours checked with its palette validator for colour blindness and contrast (ADR 0004) |

The project's own rules for the agent are in `CLAUDE.md`, `AGENTS.md` and `.claude/rules/`.
