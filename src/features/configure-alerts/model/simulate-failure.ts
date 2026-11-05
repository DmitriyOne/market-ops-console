'use client';

import { useSyncExternalStore } from 'react';

// In memory on purpose: a demo switch, cleared by a reload.
let armed = false;
const listeners = new Set<() => void>();

function set(value: boolean): void {
  armed = value;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** "Fail the next save": the switch's state, shared by the panel and the writes. */
export function useSimulateFailure(): [boolean, (value: boolean) => void] {
  return [
    useSyncExternalStore(
      subscribe,
      () => armed,
      () => false,
    ),
    set,
  ];
}

/** Read by the next write: true once, then the switch turns itself off. */
export function takeSimulatedFailure(): boolean {
  if (!armed) return false;
  set(false);
  return true;
}
