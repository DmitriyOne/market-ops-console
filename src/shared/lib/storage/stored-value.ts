'use client';

import { useCallback, useSyncExternalStore } from 'react';

const listeners = new Map<string, Set<() => void>>();
// This visit's choice when it could not be written (blocked or full
// storage); it wins over what storage still holds. Another tab's change clears it.
const memory = new Map<string, string>();

function read(key: string): string {
  const own = memory.get(key);
  if (own !== undefined) return own;
  try {
    return localStorage.getItem(key) ?? '';
  } catch {
    return '';
  }
}

function notify(key: string) {
  for (const listener of listeners.get(key) ?? []) listener();
}

// Unknown until the browser is read: the caller shows a placeholder, not
// the default, so a remembered choice does not flash the other view first.
const getServerSnapshot = () => null;

/** A raw string remembered per browser: `null` while unknown, `''` when nothing is stored. */
export function useStoredValue(key: string): [string | null, (value: string) => void] {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const set = listeners.get(key) ?? new Set();
      set.add(onChange);
      listeners.set(key, set);
      // Another tab changed it (`key` is null when storage was cleared).
      const onStorage = (event: StorageEvent) => {
        if (event.key !== key && event.key !== null) return;
        memory.delete(key);
        onChange();
      };
      window.addEventListener('storage', onStorage);
      return () => {
        set.delete(onChange);
        window.removeEventListener('storage', onStorage);
      };
    },
    [key],
  );
  const value = useSyncExternalStore<string | null>(subscribe, () => read(key), getServerSnapshot);
  const update = useCallback(
    (next: string) => {
      try {
        localStorage.setItem(key, next);
        memory.delete(key);
      } catch {
        // Not remembered across reloads; works for now.
        memory.set(key, next);
      }
      notify(key);
    },
    [key],
  );
  return [value, update];
}
