# 0011. Linting and formatting

**Context.** Code must look the same everywhere and catch type and a11y mistakes early. No git hooks (owner rejected husky), so checks run via scripts and CI.

**Decision.**
- **Prettier 3** formats everything, with `prettier-plugin-tailwindcss` (official) to sort classes. Prettier defaults otherwise.
- **ESLint 10** (flat config, `eslint.config.mjs`) checks logic, not formatting:
  - `eslint-config-next`: `core-web-vitals` + `typescript`;
  - `typescript-eslint` `strictTypeChecked` (no `any`, unsafe casts, floating promises);
  - `eslint-plugin-i18next` `no-literal-string`, `jsx-only`, including `aria-label`, `alt`, `title`, `placeholder` (same setup as the owner's ministry-app, ADR 0010);
  - `eslint-plugin-simple-import-sort`;
  - `eslint-config-prettier` last, so ESLint never fights Prettier.
- **Steiger** checks FSD boundaries (ADR 0005).
- Scripts: `format` (`prettier --write .`), `format:check`, `lint` (`eslint . && steiger src`), `typecheck` (`tsc --noEmit`).
- CI (PR → `develop`) runs `format:check`, `lint`, `typecheck`, tests (ADR 0007).

**Alternatives.** ESLint-only with `@stylistic` (one tool, as in ministry-app; does not reflow long lines, Tailwind sorting needs a third-party plugin). Biome (fast, but no Next/i18next/FSD rule parity).

**Consequences.** Two tools, clear split: Prettier = how code looks, ESLint = whether it is correct. Editor format-on-save recommended (`.vscode/settings.json`).
