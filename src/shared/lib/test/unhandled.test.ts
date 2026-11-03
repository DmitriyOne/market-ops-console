import { describe, expect, it } from 'vitest';

describe('MSW server', () => {
  it('fails a request that no handler covers', async () => {
    const error: unknown = await fetch('/api/v1/not-mocked').catch((e: unknown) => e);
    expect(error).toBeInstanceOf(TypeError);
    if (!(error instanceof TypeError)) return;
    expect(String(error.cause)).toContain('[MSW]');
  });
});
