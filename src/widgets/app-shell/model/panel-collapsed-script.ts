// No 'use client': the server layout inlines this text in <head>.

/**
 * Runs before the first paint: a remembered collapse is on <html> before
 * any layout, so the panel never flashes open. Self-contained (literals
 * only) because its source text is inlined.
 */
export function applyPanelCollapsed(): void {
  try {
    if (localStorage.getItem('mo:assistant-collapsed') === '1') {
      document.documentElement.setAttribute('data-assistant-collapsed', '');
    }
  } catch {
    // Storage blocked: the panel stays open.
  }
}

export const PANEL_COLLAPSED_SCRIPT = `(${applyPanelCollapsed.toString()})()`;
