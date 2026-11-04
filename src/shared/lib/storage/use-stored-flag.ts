'use client';

import { useCallback, useSyncExternalStore } from 'react';

const listeners = new Map<string, Set<() => void>>();
// This visit's choice when it could not be written (blocked or full
// storage); it wins over what storage still holds. Another tab's change clears it.
const memory = new Map<string, boolean>();

function read(key: string): boolean {
  const own = memory.get(key);
  if (own !== undefined) return own;
  try {
    return localStorage.getItem(key) === '1';
  } catch {
    return false;
  }
}

function notify(key: string) {
  for (const listener of listeners.get(key) ?? []) listener();
}

const getServerSnapshot = () => false;

/**
 * An on/off view choice remembered per browser (a table instead of a
 * chart, say). Off on the server and until set.
 */
export function useStoredFlag(key: string): [boolean, (on: boolean) => void] {
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
  const value = useSyncExternalStore(subscribe, () => read(key), getServerSnapshot);
  const update = useCallback(
    (on: boolean) => {
      try {
        localStorage.setItem(key, on ? '1' : '0');
        memory.delete(key);
      } catch {
        // Not remembered across reloads; works for now.
        memory.set(key, on);
      }
      notify(key);
    },
    [key],
  );
  return [value, update];
}
