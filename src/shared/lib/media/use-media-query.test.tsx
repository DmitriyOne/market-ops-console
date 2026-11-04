import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useMediaQuery } from './use-media-query';

type Listener = (event: { matches: boolean }) => void;

function mockMatchMedia(initial: boolean) {
  const listeners = new Set<Listener>();
  const mql = {
    matches: initial,
    addEventListener: (_: string, l: Listener) => listeners.add(l),
    removeEventListener: (_: string, l: Listener) => listeners.delete(l),
  };
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => mql),
  );
  return (matches: boolean) => {
    mql.matches = matches;
    for (const l of listeners) l({ matches });
  };
}

describe('useMediaQuery', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('follows the media query', () => {
    const change = mockMatchMedia(false);
    const { result } = renderHook(() => useMediaQuery('(pointer: coarse)'));
    expect(result.current).toBe(false);
    act(() => {
      change(true);
    });
    expect(result.current).toBe(true);
  });

  it('is false where matchMedia does not exist', () => {
    vi.stubGlobal('matchMedia', undefined);
    const { result } = renderHook(() => useMediaQuery('(pointer: coarse)'));
    expect(result.current).toBe(false);
  });
});
