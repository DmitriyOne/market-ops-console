// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { scrollMainToTop } from './scroll-main-to-top';

function mountMain() {
  const main = document.createElement('main');
  main.id = 'main';
  const scrollTo = vi.fn();
  main.scrollTo = scrollTo;
  document.body.append(main);
  return scrollTo;
}

const reducedMotion = (reduce: boolean) => {
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({ matches: reduce })),
  );
};

describe('scrollMainToTop', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    vi.unstubAllGlobals();
  });

  it('scrolls the dashboard area to the top, smoothly', () => {
    reducedMotion(false);
    const scrollTo = mountMain();
    scrollMainToTop();
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
  });

  it('jumps at once under reduced motion', () => {
    reducedMotion(true);
    const scrollTo = mountMain();
    scrollMainToTop();
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'auto' });
  });

  it('does nothing without a main area', () => {
    reducedMotion(false);
    expect(() => {
      scrollMainToTop();
    }).not.toThrow();
  });
});
