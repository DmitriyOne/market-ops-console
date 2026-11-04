'use client';

import { parseAsStringLiteral, useQueryState } from 'nuqs';

export const SECTIONS = ['overview', 'assistant'] as const;
export type Section = (typeof SECTIONS)[number];

const tabParser = parseAsStringLiteral(SECTIONS).withDefault('overview').withOptions({
  history: 'push',
});

/** The phone section in the URL (`tab`), so Back returns to the previous one. */
export function useSection(): [Section, (s: Section) => void] {
  const [section, setSection] = useQueryState('tab', tabParser);
  return [
    section,
    (s: Section) => {
      void setSection(s);
    },
  ];
}
