'use client';

import { type RefObject, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

import { useMediaQuery } from '@/shared/lib';

// Within this many pixels of the end counts as "at the bottom".
const BOTTOM_SLACK_PX = 16;

export type StickToBottom = {
  showNewContent: boolean;
  scrollToBottom: () => void;
};

/**
 * Keeps a scroll container pinned to its end while the user is there.
 * If they scrolled up, new content does not move them; it raises
 * `showNewContent` instead. `contentKey` changes whenever content grows.
 */
export function useStickToBottom(
  ref: RefObject<HTMLElement | null>,
  contentKey: unknown,
): StickToBottom {
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const [showNewContent, setShowNewContent] = useState(false);
  const atBottomRef = useRef(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onScroll = () => {
      const bottom = el.scrollHeight - el.scrollTop - el.clientHeight <= BOTTOM_SLACK_PX;
      atBottomRef.current = bottom;
      if (bottom) setShowNewContent(false);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', onScroll);
    };
  }, [ref]);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (atBottomRef.current) {
      // Instant while streaming: smooth scrolling would lag behind the tokens.
      el.scrollTop = el.scrollHeight;
    } else {
      setShowNewContent(true);
    }
  }, [ref, contentKey]);

  const scrollToBottom = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: reducedMotion ? 'auto' : 'smooth' });
    atBottomRef.current = true;
    setShowNewContent(false);
  }, [ref, reducedMotion]);

  return { showNewContent, scrollToBottom };
}
