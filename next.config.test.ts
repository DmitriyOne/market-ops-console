// @vitest-environment node
import { describe, expect, it } from 'vitest';

import config from './next.config';

// ADR 0018: nothing experimental in production. withSentryConfig turns on
// `clientTraceMetadata` by itself (ADR 0019); an SDK upgrade could add more.
describe('next.config', () => {
  it('turns on no experimental Next.js feature', () => {
    expect(Object.keys(config.experimental ?? {})).toEqual([]);
  });
});
