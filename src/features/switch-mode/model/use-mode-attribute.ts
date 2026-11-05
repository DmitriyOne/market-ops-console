'use client';

import { useQueryStates } from 'nuqs';
import { useEffect } from 'react';

import { dashboardSearchParams } from '@/entities/performance';

const MODE = { mode: dashboardSearchParams.mode };

/**
 * Keeps the <html> mark set before paint (`MODE_SCRIPT`) in step with the
 * URL, so a skeleton shown later (data still loading, a remembered view
 * not read yet) has the shape of the mode on screen. Reads the URL only:
 * it must work before the dataset has arrived.
 */
export function useModeAttribute(): void {
  const [{ mode }] = useQueryStates(MODE);
  useEffect(() => {
    const html = document.documentElement;
    if (mode === 'analyst') html.setAttribute('data-mode', 'analyst');
    else html.removeAttribute('data-mode');
  }, [mode]);
}
