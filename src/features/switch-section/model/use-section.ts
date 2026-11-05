'use client';

import { parseAsStringLiteral, useQueryState } from 'nuqs';

export const SECTIONS = ['overview', 'assistant', 'alerts'] as const;
export type Section = (typeof SECTIONS)[number];

const tabParser = parseAsStringLiteral(SECTIONS).withDefault('overview').withOptions({
  history: 'push',
});

export type SetSection = (s: Section, options?: { history?: 'push' | 'replace' }) => void;

/**
 * The section in the URL (`tab`), so Back returns to the previous one. On
 * phones it is the tab bar; `alerts` also opens the desktop sheet, which
 * closes with `replace` so Back does not open it again.
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
