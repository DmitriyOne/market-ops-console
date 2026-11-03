import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useSwitchLocale } from './use-switch-locale';

const replace = vi.fn();

vi.mock('@/shared/config', () => ({
  useRouter: () => ({ replace }),
  usePathname: () => '/dashboard',
}));
vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams('market=de&period=2026-03'),
}));

describe('useSwitchLocale', () => {
  it('keeps the path and every search param when switching locale', () => {
    const { result } = renderHook(() => useSwitchLocale());
    result.current('de-DE');
    expect(replace).toHaveBeenCalledWith(
      { pathname: '/dashboard', query: { market: 'de', period: '2026-03' } },
      { locale: 'de-DE' },
    );
  });
});
