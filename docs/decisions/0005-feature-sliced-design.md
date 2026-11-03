# 0005. Feature-Sliced Design v2.1

**Context.** Two surfaces, shared entities, coordinated views. Code must stay navigable as it grows.

**Decision.** FSD v2.1, pages-first. All layers created up front (`app`, `pages`, `widgets`, `features`, `entities`, `shared`); `processes` omitted (deprecated). Next.js root `app/` is routing only; root `pages/` kept empty so Next does not treat `src/pages` as the Pages Router. `src/pages` holds composition only, no logic. Rules: `.claude/rules/fsd.md`.

**Alternatives.** Flat `components/ hooks/ lib/`: fast to start, unclear ownership later. Feature folders without layers: no import direction.

**Consequences.** Clear import direction and public APIs. Some overhead for a small app, kept low by pages-first. Import boundaries can be linted with Steiger (optional).
