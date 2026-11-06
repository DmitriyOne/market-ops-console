'use client';

import { type RefObject, useLayoutEffect, useState } from 'react';

/**
 * Whether `probe` (an invisible copy of the full text) is wider than `box`,
 * the room the text has. Measured before paint and again whenever the room
 * changes, so the choice follows the real width in every language, not a
 * breakpoint. False until measured (and in tests, which have no layout).
 */
export function useOverflows(
  box: RefObject<HTMLElement | null>,
  probe: RefObject<HTMLElement | null>,
  text: string,
): boolean {
  const [overflows, setOverflows] = useState(false);
  useLayoutEffect(() => {
    const room = box.current;
    const full = probe.current;
    if (!room || !full) return;
    const check = () => {
      setOverflows(full.scrollWidth > room.clientWidth);
    };
    check();
    const observer = new ResizeObserver(check);
    observer.observe(room);
    return () => {
      observer.disconnect();
    };
  }, [box, probe, text]);
  return overflows;
}
