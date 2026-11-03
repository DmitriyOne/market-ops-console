import { describe, expect, it } from 'vitest';

describe('MSW server', () => {
  it('fails a request that no handler covers', async () => {
    await expect(fetch('/api/v1/not-mocked')).rejects.toThrow();
  });
});
