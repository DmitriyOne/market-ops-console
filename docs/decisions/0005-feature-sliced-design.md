# 0005. Feature-Sliced Design v2.1

**Context.** Two surfaces, shared entities, coordinated views. Code must stay navigable as it grows.

**Decision.** FSD v2.1, pages-first. All layers created up front (`app`, `pages`, `widgets`, `features`, `entities`, `shared`); `processes` omitted (deprecated). Next.js root `app/` is routing only; root `pages/` kept empty so Next does not treat `src/pages` as the Pages Router. `src/pages` holds composition; it may read URL params and choose a layout, but fetching, calculations, formatting and behaviour live in features. Rules: `.claude/rules/fsd.md`.

**Alternatives.** Flat `components/ hooks/ lib/`: fast to start, unclear ownership later. Feature folders without layers: no import direction.

**Consequences.** Clear import direction and public APIs. Some overhead for a small app, kept low by pages-first. Import boundaries are linted with Steiger (`steiger` 0.9 + `@feature-sliced/steiger-plugin`), run in `pnpm lint` and CI.

**Steiger exceptions (owner decisions, 2026-11-03).** Rules are switched off only with the owner's approval, each with a comment in `steiger.config.ts`:
- `fsd/insignificant-slice`: off globally. Pages-first keeps single-consumer slices on purpose.
- `fsd/segments-by-purpose`: off for `src/app/providers/**` only. `providers` is the agreed name for app-wide providers (`.claude/rules/fsd.md`).
