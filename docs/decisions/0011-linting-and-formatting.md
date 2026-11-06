# 0011. Linting and formatting

**Context.** Code must look the same everywhere and catch type and a11y mistakes early. No git hooks (owner rejected husky), so checks run via scripts and CI.

**Decision.**
- **Prettier 3** formats code, with `prettier-plugin-tailwindcss` (official) to sort classes; `singleQuote`, `printWidth: 100`.
- **ESLint 10** (flat config, `eslint.config.mjs`) checks logic, not formatting:
  - `eslint-config-next`: `core-web-vitals` + `typescript`;
  - `typescript-eslint` `strictTypeChecked` (no `any`, unsafe casts, floating promises);
  - `eslint-plugin-i18next` `no-literal-string`, `jsx-only`, including `aria-label`, `alt`, `title`, `placeholder` (same setup as the owner's ministry-app, ADR 0010); since 0.13.0 also `aria-description`, `aria-roledescription`, `aria-valuetext`, `aria-placeholder`;
  - **0.13.0, stricter (owner: no visible text outside the dictionaries):**
    - plain `.ts` in `src` and `app` is checked too (`mode: all`, template text included) for strings with a space or a non-ASCII character; identifiers, keys, class names, URLs and lone punctuation pass. Not shown as copy, so left out by callee: `t`, error constructors and `super` (capitalised `…Error` constructors, developer messages), `matchMedia` / `useMediaQuery`, `.replace` (input clean-up);
    - `no-restricted-syntax`, because the i18next rule trims text and lets lone punctuation through, and checks attributes on native tags only from its own list: a separator (`·`, `—`, `–`, or `,` `;` `:` followed by a space) in `.join()`, template text, `+` concatenation, a JSX literal or JSX text, or a constant holding only `·`/`—`/`–`; text or a template in `aria-*`, `title`, `alt`, `placeholder` and `label`, also inside `{…}` and conditionals. Join label parts with `useJoinParts()`, lists with next-intl's `format.list()` (`conjunction`: CLDR's `unit` list has no separator in Russian), or a message with placeholders;
    - what still passes (checked with probe files, 0.13.0 review): a single word after a placeholder in a `.ts` template (`` `${n} selected` ``) and a constant holding only `', '`. Catching them would flag class names; review covers them;
  - **`no-restricted-imports`, one rule** (a later block replaces it for its files, so each block sets the whole list): the bare `datasetQueryOptions` only in the files ADR 0017 lists (0.13.1, tests included), and `@sentry/*` only in the logging and monitoring helpers, the Sentry start-up files, `next.config.ts` and the tunnel route (0.14.0, ADR 0019; root files checked; tests may mock the SDK); a `no-restricted-syntax` selector catches a dynamic `import('@sentry/…')`, which `no-restricted-imports` does not see;
  - `eslint-plugin-simple-import-sort`;
  - `eslint-config-prettier` last, so ESLint never fights Prettier.
- **Steiger** checks FSD boundaries (ADR 0005).
- Scripts: `format` (`prettier --write .`), `format:check`, `lint` (`next typegen && eslint . && steiger src`), `typecheck` (`next typegen && tsc --noEmit`). `next typegen` comes first so a clean checkout (CI) has the generated route and root-param types.
- CI runs `format:check`, `lint`, `typecheck` on PRs into `release/*`, and the same plus tests on PRs into `develop` (ADR 0007).

**Exceptions (owner-approved, 2026-11-03).** Agents never relax a rule on their own (CLAUDE.md).
- Prettier skips `*.md`: docs are hand-written, and the starter-pack files must stay byte-for-byte.
- `i18next/no-literal-string` skips `*.test.tsx`: tests render throwaway markup (e.g. a counter) that is not UI copy.
- 0.13.0, the `.ts` check skips `src/shared/api`, `app/api` (messages for developers in API responses and logs; the UI shows translated texts by error code, never `error.message`) and `src/shared/lib/test` (test helpers). The CSV export keeps its machine format (`snake_case` headers, `; ` between anomalies, the same in every locale, 0.7.0).

**Alternatives.** ESLint-only with `@stylistic` (one tool, as in ministry-app; does not reflow long lines, Tailwind sorting needs a third-party plugin). Biome (fast, but no Next/i18next/FSD rule parity).

**Consequences.** Two tools, clear split: Prettier = how code looks, ESLint = whether it is correct. Editor format-on-save recommended (`.vscode/settings.json`).
