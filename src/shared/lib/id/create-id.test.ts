import { afterEach, describe, expect, it, vi } from 'vitest';

import { createId } from './create-id';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('createId', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('is a v4 UUID', () => {
    expect(createId()).toMatch(UUID);
  });

  it('works where randomUUID is missing (plain http on a LAN address is not a secure context)', () => {
    vi.stubGlobal('crypto', { getRandomValues: crypto.getRandomValues.bind(crypto) });
    const a = createId();
    expect(a).toMatch(UUID);
    expect(createId()).not.toBe(a);
  });
});
