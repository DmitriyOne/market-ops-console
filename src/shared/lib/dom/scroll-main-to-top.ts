/** The scrolling dashboard area: `<main id="main">`, also the skip link's target. */
const MAIN_ID = 'main';

/**
 * Brings the dashboard back to its top after a change made from elsewhere
 * (reset, a source in the assistant), so the change is in view.
 */
export function scrollMainToTop(): void {
  const main = document.getElementById(MAIN_ID);
  if (!main) return;
  const still =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  main.scrollTo({ top: 0, behavior: still ? 'auto' : 'smooth' });
}
