'use client';

import { useCallback, useSyncExternalStore } from 'react';

const getServerSnapshot = () => false;

/** Whether a CSS media query matches; false on the server and where matchMedia is missing. */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (typeof window.matchMedia !== 'function') return () => undefined;
      const mql = window.matchMedia(query);
      mql.addEventListener('change', onChange);
      return () => {
        mql.removeEventListener('change', onChange);
      };
    },
    [query],
  );
  const getSnapshot = () =>
    typeof window.matchMedia === 'function' && window.matchMedia(query).matches;
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
