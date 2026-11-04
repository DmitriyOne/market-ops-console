'use client';

import { useCallback } from 'react';

import { useStoredValue } from './stored-value';

/**
 * An on/off view choice remembered per browser (a table instead of a
 * chart, say). `null` on the server and while hydrating, then off until set.
 */
export function useStoredFlag(key: string): [boolean | null, (on: boolean) => void] {
  const [raw, write] = useStoredValue(key);
  const set = useCallback(
    (on: boolean) => {
      write(on ? '1' : '0');
    },
    [write],
  );
  return [raw === null ? null : raw === '1', set];
}
