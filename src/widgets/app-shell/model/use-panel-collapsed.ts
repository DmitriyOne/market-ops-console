'use client';

import { useCallback, useSyncExternalStore } from 'react';

const KEY = 'mo:assistant-collapsed';
const ATTR = 'data-assistant-collapsed';
const listeners = new Set<() => void>();

// The <html> attribute is the state: the pre-paint script sets it (ADR 0015),
// CSS lays the panel out from it, and this hook reads and writes it.
const read = () => document.documentElement.hasAttribute(ATTR);

function subscribe(onChange: () => void) {
  // Another tab changed the choice (`key` is null when storage was cleared).
  const onStorage = (event: StorageEvent) => {
    if (event.key !== KEY && event.key !== null) return;
    document.documentElement.toggleAttribute(ATTR, event.newValue === '1');
    onChange();
  };
  listeners.add(onChange);
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener('storage', onStorage);
  };
}

// Static HTML is rendered open; the attribute may differ only after the script.
const getServerSnapshot = () => false;

/** Whether the desktop assistant panel is collapsed, remembered per browser. */
export function usePanelCollapsed(): [boolean, (collapsed: boolean) => void] {
  const collapsed = useSyncExternalStore(subscribe, read, getServerSnapshot);
  const update = useCallback((next: boolean) => {
    document.documentElement.toggleAttribute(ATTR, next);
    try {
      localStorage.setItem(KEY, next ? '1' : '0');
    } catch {
      // Blocked or full storage: not remembered across reloads, works for now.
    }
    for (const listener of listeners) listener();
  }, []);
  return [collapsed, update];
}
