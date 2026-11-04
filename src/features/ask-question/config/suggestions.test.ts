import { describe, expect, it } from 'vitest';

import raw from '@/data/fixtures.json';
import { fixturesSchema, pickFixture } from '@/shared/api';
import { deMessages, enMessages, ruMessages } from '@/shared/config';

import { SUGGESTED_QUESTIONS } from './suggestions';

const fixtures = fixturesSchema.parse(raw);

describe('SUGGESTED_QUESTIONS', () => {
  it.each(SUGGESTED_QUESTIONS.map((s) => [s.id, s] as const))(
    '%s sends an English question that routes to its fixture',
    (_id, suggestion) => {
      expect(pickFixture(fixtures, suggestion.question).id).toBe(suggestion.fixtureId);
    },
  );

  it('covers the four demo fixtures', () => {
    expect(SUGGESTED_QUESTIONS.map((s) => s.fixtureId)).toEqual([
      'at-risk',
      'germany-dip',
      'apac-vs-europe',
      'forecast-miss',
    ]);
  });

  it.each([
    ['en', enMessages],
    ['de', deMessages],
    ['ru', ruMessages],
  ])('has a %s button label for each suggestion', (_locale, messages) => {
    for (const s of SUGGESTED_QUESTIONS) {
      expect(messages.assistant.suggestions[s.id].length).toBeGreaterThan(0);
    }
  });
});
