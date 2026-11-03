# 0001. One repo, one app

**Context.** The assistant and the dashboard share data, types and URL state. Citations in the chat must open the dashboard at the cited market and period. The brief asks for one repo and one live link.

**Decision.** One Next.js app in one repo (`market-ops-console`). The two surfaces are separate FSD slices/widgets.

**Alternatives.** Two repos/apps: duplicated `data.json` and types, two deploys, no shared URL state, citations become cross-site links.

**Consequences.** Shared entities and formatters are written once. Context-aware assistant (stretch) is possible.
