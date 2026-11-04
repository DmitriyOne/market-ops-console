import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useSwitchLocale } from './use-switch-locale';

const replace = vi.fn();
let search = 'market=de&period=2026-03';

vi.mock('@/shared/config', () => ({
  useRouter: () => ({ replace }),
  usePathname: () => '/dashboard',
}));
vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(search),
}));

describe('useSwitchLocale', () => {
  afterEach(() => {
    window.location.hash = '';
    replace.mockClear();
  });

  it('keeps the path and every search param when switching locale', () => {
    search = 'market=de&period=2026-03';
    const { result } = renderHook(() => useSwitchLocale());
    result.current('de-DE');
    expect(replace).toHaveBeenCalledWith('/dashboard?market=de&period=2026-03', {
      locale: 'de-DE',
    });
  });

  it('keeps the map metric and the mode (Analyst stays on the same metric)', () => {
    search = 'mode=analyst&kpi=growth&region=eu';
    const { result } = renderHook(() => useSwitchLocale());
    result.current('de-DE');
    expect(replace).toHaveBeenCalledWith('/dashboard?mode=analyst&kpi=growth&region=eu', {
      locale: 'de-DE',
    });
  });

  it('keeps repeated keys and the #hash', () => {
    search = 'markets=de&markets=es';
    window.location.hash = '#main';
    const { result } = renderHook(() => useSwitchLocale());
    result.current('ru-RU');
    expect(replace).toHaveBeenCalledWith('/dashboard?markets=de&markets=es#main', {
      locale: 'ru-RU',
    });
  });

  it('a page without params gets no stray "?"', () => {
    search = '';
    const { result } = renderHook(() => useSwitchLocale());
    result.current('en-US');
    expect(replace).toHaveBeenCalledWith('/dashboard', { locale: 'en-US' });
  });
});
