'use client';

import { createContext, use } from 'react';

const PopperBoundaryContext = createContext<Element | null>(null);

/**
 * The scroll area the popups inside it belong to. The page scrolls in
 * `<main>` under a fixed header, and a popup is portalled to the body: left
 * to the viewport, it would follow a scrolled trigger over the header. With
 * the area as its boundary it flips and sizes within it, and hides once the
 * trigger has scrolled out of it.
 */
export const PopperBoundary = PopperBoundaryContext;

/** Radix popper props for the surrounding area; none outside one (the header). */
export function usePopperBoundary(): { collisionBoundary?: Element; hideWhenDetached?: boolean } {
  const boundary = use(PopperBoundaryContext);
  return boundary ? { collisionBoundary: boundary, hideWhenDetached: true } : {};
}
