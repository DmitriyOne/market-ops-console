# 0.13.1 Lint rule: no raw dataset reads

**Goal:** nobody can read the dataset in dollars by accident. Since 0.12.0
the server sends dollars and `useDataset()` / `useDashboard()` convert to the
chosen currency; `datasetQueryOptions` is the bare query and always gives
dollars. A new widget that uses it shows `$` next to a page in `€`, and no
test fails (0.12.0 review, backlog).

## Owner decisions (2026-11-06)

1. **A lint rule**, not a refactor: `no-restricted-imports` forbids
   `datasetQueryOptions` outside the files that need it.
2. **Micro-release 0.13.1**, from `develop` after 0.13.0.
3. **Multi-pick menu: one history entry per pick stays** (backlog item
   closed as accepted).
4. **A clearer check name on PRs into `master`**: the job was the bare
   `check`; it is "Branch & version", like the `develop` one. No full CI
   there (ADR 0007: `develop` takes only fully checked `release/*`).

## The rule

`no-restricted-imports` on `src/**` and `app/**` (`.ts`, `.tsx`), with
`importNames: ['datasetQueryOptions']` for `@/entities/performance` and for
any path ending in `dataset-query` (relative imports inside the slice), and a
message that points to `useDataset` / `useDashboard`.

Allowed (`ignores` of that block), each for a reason:
- `src/entities/performance/api/dataset-query.ts`: defines it;
- `src/entities/performance/index.ts`: re-exports it (the server page needs it);
- `src/entities/performance/model/use-dataset.ts`, `use-dashboard.ts`: the
  readers that add the currency `select`;
- `src/entities/performance/ui/DatasetGate.tsx`: reads only loading and error;
- `src/features/export-markets/ui/ExportMenu.tsx`: CSV and Excel are in
  dollars on purpose (ADR 0017);
- `app/[locale]/dashboard/page.tsx`: the server prefetch fills the cache, no
  amounts shown.

It is a new block, not added to the existing `no-restricted-syntax` one (a
second `no-restricted-syntax` for the same files would replace it).

## Tasks

1. The rule in `eslint.config.mjs`; probe: a temporary
   `useQuery(datasetQueryOptions)` in a widget fails lint, relative import
   inside the slice fails too; removed after. `pnpm lint` clean.
2. The `master` check renamed (`pr-master.yml`, ADR 0007).
   Docs: ADR 0017 (the rule and the allowed files), `.claude/rules/fsd.md` line "read the dataset through `useDataset` /
   `useDashboard`", backlog (both items closed), CHANGELOG 0.13.1, version
   0.13.1, README status.
3. Checks: format, lint, typecheck, test, build; no E2E change.

## Risks

- A future reader that truly needs dollars must be added to the list: one
  line in the config, with the reason in ADR 0017.
- `import * as performance from '@/entities/performance'` is reported too
  (ESLint flags a namespace import when `importNames` is set); checked in
  the probe.

## Done (2026-11-06)

- Probe: a widget importing `datasetQueryOptions`, a namespace import of the
  entity and a relative import inside the slice each fail lint; `useDataset`
  and the seven allowed files pass (temporary files, removed).
