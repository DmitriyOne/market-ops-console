'use client';

import { useStoredValue } from './stored-value';

/**
 * One of a few view choices remembered per browser. `null` on the server
 * and while hydrating; `fallback` until the user picks (it may change,
 * e.g. with the screen width) or when storage holds an unknown value.
 */
export function useStoredChoice<T extends string>(
  key: string,
  choices: readonly T[],
  fallback: T,
): [T | null, (choice: T) => void] {
  const [raw, write] = useStoredValue(key);
  if (raw === null) return [null, write];
  const known = choices.find((c) => c === raw);
  return [known ?? fallback, write];
}
