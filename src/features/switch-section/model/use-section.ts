'use client';

import { parseAsStringLiteral, useQueryState } from 'nuqs';

export const SECTIONS = ['overview', 'assistant', 'alerts'] as const;
export type Section = (typeof SECTIONS)[number];

const tabParser = parseAsStringLiteral(SECTIONS).withDefault('overview').withOptions({
  history: 'push',
});

/**
 * Marks the button that opens the alerts sheet (the header's bell), so the
 * sheet can hand focus back to it on close even when it opened from a link.
 */
export const ALERTS_TRIGGER_ATTR = 'data-alerts-trigger';

export type SetSection = (s: Section, options?: { history?: 'push' | 'replace' }) => void;

/**
 * The section in the URL (`tab`), so Back returns to the previous one. On
 * phones it is the tab bar; `alerts` also opens the desktop sheet, which
 * closes by going Back (or with `replace` after a link), so Back does not
 * open it again.
 */
export function useSection(): [Section, SetSection] {
  const [section, setSection] = useQueryState('tab', tabParser);
  return [
    section,
    (s, options) => {
      void setSection(s, options);
    },
  ];
}
