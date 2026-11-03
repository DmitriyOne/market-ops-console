import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useStickToBottom } from './use-stick-to-bottom';

function scroller({ scrollHeight, clientHeight, scrollTop }: Record<string, number>) {
  const el = document.createElement('div');
  const box = { scrollHeight, clientHeight, scrollTop };
  Object.defineProperty(el, 'scrollHeight', { get: () => box.scrollHeight });
  Object.defineProperty(el, 'clientHeight', { get: () => box.clientHeight });
  Object.defineProperty(el, 'scrollTop', {
    get: () => box.scrollTop,
    set: (v: number) => {
      box.scrollTop = v;
    },
  });
  const scrollTo = vi.fn((options: ScrollToOptions) => {
    box.scrollTop = options.top ?? box.scrollTop;
  });
  Object.defineProperty(el, 'scrollTo', { value: scrollTo });
  return { el, box, scrollTo };
}

function reducedMotion(matches: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({ matches, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
  );
}

describe('useStickToBottom', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('follows new content while at the bottom', () => {
    reducedMotion(false);
    const { el, box } = scroller({ scrollHeight: 500, clientHeight: 300, scrollTop: 200 });
    const { result, rerender } = renderHook(({ key }) => useStickToBottom({ current: el }, key), {
      initialProps: { key: 1 },
    });
    box.scrollHeight = 800;
    rerender({ key: 2 });
    expect(box.scrollTop).toBe(800);
    expect(result.current.showNewContent).toBe(false);
  });

  it('does not scroll and shows "new content" while scrolled up', () => {
    reducedMotion(false);
    const { el, box } = scroller({ scrollHeight: 500, clientHeight: 300, scrollTop: 200 });
    const { result, rerender } = renderHook(({ key }) => useStickToBottom({ current: el }, key), {
      initialProps: { key: 1 },
    });
    box.scrollTop = 0;
    act(() => {
      el.dispatchEvent(new Event('scroll'));
    });
    expect(result.current.atBottom).toBe(false);
    box.scrollHeight = 800;
    rerender({ key: 2 });
    expect(box.scrollTop).toBe(0);
    expect(result.current.showNewContent).toBe(true);
  });

  it('scrollToBottom jumps without smooth scrolling under reduced motion', () => {
    reducedMotion(true);
    const { el, box, scrollTo } = scroller({ scrollHeight: 800, clientHeight: 300, scrollTop: 0 });
    const { result } = renderHook(() => useStickToBottom({ current: el }, 1));
    act(() => {
      result.current.scrollToBottom();
    });
    expect(scrollTo).toHaveBeenCalledWith({ top: 800, behavior: 'auto' });
    expect(box.scrollTop).toBe(800);
    expect(result.current.showNewContent).toBe(false);
  });

  it('scrolls smoothly without reduced motion', () => {
    reducedMotion(false);
    const { el, scrollTo } = scroller({ scrollHeight: 800, clientHeight: 300, scrollTop: 0 });
    const { result } = renderHook(() => useStickToBottom({ current: el }, 1));
    act(() => {
      result.current.scrollToBottom();
    });
    expect(scrollTo).toHaveBeenCalledWith({ top: 800, behavior: 'smooth' });
  });
});
