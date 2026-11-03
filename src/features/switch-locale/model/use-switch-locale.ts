'use client';

import { useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

import { type AppLocale, usePathname, useRouter } from '@/shared/config';

/** Switch locale in place: same page, same URL state (drill-down, filters). */
export function useSwitchLocale(): (locale: AppLocale) => void {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return useCallback(
    (locale: AppLocale) => {
      const query = searchParams ? Object.fromEntries(searchParams.entries()) : {};
      router.replace({ pathname, query }, { locale });
    },
    [router, pathname, searchParams],
  );
}
