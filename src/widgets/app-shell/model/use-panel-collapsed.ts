'use client';

import { useCallback, useSyncExternalStore } from 'react';

const KEY = 'mo:assistant-collapsed';
const listeners = new Set<() => void>();
// Used only when localStorage throws (private mode, blocked storage).
let memory = false;

function read(): boolean {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return memory;
  }
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  window.addEventListener('storage', onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener('storage', onChange);
  };
}

// Static HTML has no localStorage: the server render is always open.
const getServerSnapshot = () => false;

/** Whether the desktop assistant panel is collapsed, remembered per browser. */
export function usePanelCollapsed(): [boolean, (collapsed: boolean) => void] {
  const collapsed = useSyncExternalStore(subscribe, read, getServerSnapshot);
  const update = useCallback((next: boolean) => {
    try {
      localStorage.setItem(KEY, next ? '1' : '0');
    } catch {
      // Not remembered across reloads; the panel still works.
      memory = next;
    }
    for (const listener of listeners) listener();
  }, []);
  return [collapsed, update];
}
