'use client';

import { useServerInsertedHTML } from 'next/navigation';
import { useRef } from 'react';

import { MODE_SCRIPT } from '@/features/switch-mode';
import { SECTION_SCRIPT } from '@/features/switch-section';
import { PANEL_COLLAPSED_SCRIPT } from '@/widgets/app-shell';

/** The three ADR 0015 marks: collapsed assistant, phone section, Analyst mode. */
export const BEFORE_PAINT_SCRIPT = [PANEL_COLLAPSED_SCRIPT, SECTION_SCRIPT, MODE_SCRIPT].join(';');

/**
 * Puts the before-paint script into the server HTML only (ADR 0015).
 * A `<script>` in the React tree is rendered again on the client, where it
 * never runs and React warns ("Encountered a script tag"); inserted HTML
 * is not part of the tree, so it runs once, before the first paint. The
 * theme provider injects its script the same way.
 */
export function BeforePaintScripts() {
  const inserted = useRef(false);
  useServerInsertedHTML(() => {
    // The callback runs on every flush of the stream; the script goes in the first.
    if (inserted.current) return null;
    inserted.current = true;
    return <script dangerouslySetInnerHTML={{ __html: BEFORE_PAINT_SCRIPT }} />;
  });
  return null;
}
