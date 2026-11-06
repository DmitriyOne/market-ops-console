import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useOverflows } from './use-overflows';

/** jsdom has no layout: the widths are set by hand. */
function sized(scrollWidth: number, clientWidth: number): HTMLSpanElement {
  const el = document.createElement('span');
  Object.defineProperty(el, 'scrollWidth', { value: scrollWidth, configurable: true });
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

  describe('the web font arriving after the first paint', () => {
    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('measures again when the text itself gets wider, not only its room', () => {
      const watched: { el: Element; again: () => void }[] = [];
      vi.stubGlobal(
        'ResizeObserver',
        class {
          constructor(private readonly callback: () => void) {}
          observe(el: Element) {
            watched.push({ el, again: this.callback });
          }
          disconnect() {}
        },
      );
      const room = { current: sized(0, 160) };
      const probe = { current: sized(150, 0) };
      const { result } = renderHook(() => useOverflows(room, probe, 'May 2026 · 12 months'));
      expect(result.current).toBe(false);
      // The fallback font was narrower: the same label is wider in the web font.
      Object.defineProperty(probe.current, 'scrollWidth', { value: 190 });
      const onProbe = watched.find((w) => w.el === probe.current);
      expect(onProbe, 'the text is watched').toBeDefined();
      act(() => {
        onProbe?.again();
      });
      expect(result.current).toBe(true);
    });
  });
});
