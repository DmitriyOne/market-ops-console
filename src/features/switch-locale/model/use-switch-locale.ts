'use client';

import { useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

import { type AppLocale, usePathname, useRouter } from '@/shared/config';

/**
 * Switch locale in place: same page, same URL state (drill-down, filters).
 * The query is passed as a string, so repeated keys survive, and the hash is kept.
 */
export function useSwitchLocale(): (locale: AppLocale) => void {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return useCallback(
    (locale: AppLocale) => {
      const query = searchParams?.toString() ?? '';
      const href = `${pathname}${query ? `?${query}` : ''}${window.location.hash}`;
      router.replace(href, { locale });
    },
    [router, pathname, searchParams],
  );
}
