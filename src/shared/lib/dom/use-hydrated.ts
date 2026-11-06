'use client';

import { useSyncExternalStore } from 'react';

const subscribeNothing = () => () => undefined;
const onClient = () => true;
const onServer = () => false;

/**
 * False on the server and while hydrating, true after. For a value the client
 * may already have when its part of the page hydrates (a query that a part
 * hydrated earlier has fetched): show it from here, so the first render
 * matches the static HTML.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(subscribeNothing, onClient, onServer);
}
