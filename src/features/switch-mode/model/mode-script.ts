// No 'use client': the server layout inlines this text in <head>.

/**
 * Runs before the first paint (ADR 0015): an Analyst link (`?mode=analyst`)
 * marks <html>, so the static skeletons take the Analyst shape (the markets
 * table, the map's metric picker and hint) and nothing jumps on hydration.
 * Self-contained (literals only) because its source text is inlined.
 */
export function applyMode(): void {
  try {
    if (new URLSearchParams(window.location.search).get('mode') === 'analyst') {
      document.documentElement.setAttribute('data-mode', 'analyst');
    }
  } catch {
    // Old browser: Executive skeletons, as before.
  }
}

export const MODE_SCRIPT = `(${applyMode.toString()})()`;
