import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useOverflows } from './use-overflows';

/** jsdom has no layout: the widths are set by hand. */
function sized(scrollWidth: number, clientWidth: number): HTMLSpanElement {
  const el = document.createElement('span');
  Object.defineProperty(el, 'scrollWidth', { value: scrollWidth });
  Object.defineProperty(el, 'clientWidth', { value: clientWidth });
  return el;
}

describe('useOverflows', () => {
  it('is true when the full text is wider than its room', () => {
    const room = { current: sized(0, 120) };
    const probe = { current: sized(180, 0) };
    const { result } = renderHook(() => useOverflows(room, probe, 'May 2026 · 12 months'));
    expect(result.current).toBe(true);
  });

  it('is false when it fits, or before anything is there to measure', () => {
    const fits = renderHook(() =>
      useOverflows({ current: sized(0, 240) }, { current: sized(180, 0) }, 'May 2026'),
    );
    expect(fits.result.current).toBe(false);
    const empty = renderHook(() => useOverflows({ current: null }, { current: null }, 'May 2026'));
    expect(empty.result.current).toBe(false);
  });
});
