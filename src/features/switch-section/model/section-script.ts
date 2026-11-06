// No 'use client': the server layout inlines this text in <head>.

/**
 * Runs before the first paint (ADR 0015): a phone link to the Assistant or
 * Alerts tab (`?tab=assistant`, `?tab=alerts`) marks <html>, so the static
 * page shows that area instead of flashing Overview until hydration.
 * Self-contained (literals only) because its source text is inlined.
 */
export function applySection(): void {
  try {
    const tab = new URLSearchParams(window.location.search).get('tab');
    if (tab === 'assistant' || tab === 'alerts') {
      document.documentElement.setAttribute('data-section', tab);
    }
  } catch {
    // Old browser: Overview first, as before.
  }
}

export const SECTION_SCRIPT = `(${applySection.toString()})()`;
