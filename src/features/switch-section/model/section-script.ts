// No 'use client': the server layout inlines this text in <head>.

/**
 * Runs before the first paint (ADR 0015): a phone link to the Assistant tab
 * (`?tab=assistant`) marks <html>, so the static page shows the assistant
 * area instead of flashing Overview until hydration. Self-contained
 * (literals only) because its source text is inlined.
 */
export function applySection(): void {
  try {
    if (new URLSearchParams(window.location.search).get('tab') === 'assistant') {
      document.documentElement.setAttribute('data-section', 'assistant');
    }
  } catch {
    // Old browser: Overview first, as before.
  }
}

export const SECTION_SCRIPT = `(${applySection.toString()})()`;
