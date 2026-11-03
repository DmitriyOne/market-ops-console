import fsd from '@feature-sliced/steiger-plugin';
import { defineConfig } from 'steiger';

export default defineConfig([
  ...fsd.configs.recommended,
  {
    rules: {
      // Pages-first (FSD v2.1, spec §15): a slice with a single consumer is
      // intended here; code moves down only when a second consumer appears.
      'fsd/insignificant-slice': 'off',
    },
  },
  {
    // Owner decision (ADR 0005): `src/app/providers` is the agreed home of
    // app-wide providers (.claude/rules/fsd.md).
    files: ['./src/app/providers/**'],
    rules: {
      'fsd/segments-by-purpose': 'off',
    },
  },
]);
