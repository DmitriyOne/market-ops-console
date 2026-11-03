import { describe, expect, it } from 'vitest';

import fixtures from '@/data/fixtures.json';

import { chatEventSchema, chatRequestSchema, fixturesSchema } from './contract';

describe('fixturesSchema', () => {
  it('accepts fixtures.json', () => {
    expect(fixturesSchema.parse(fixtures).fixtures).toHaveLength(7);
  });
});

describe('chatEventSchema', () => {
  it('accepts the contract examples', () => {
    expect(chatEventSchema.parse({ type: 'token', value: 'Three ' })).toEqual({
      type: 'token',
      value: 'Three ',
    });
    expect(
      chatEventSchema.parse({
        type: 'done',
        kind: 'normal',
        citations: [{ marketId: 'de', period: '2026-03', label: 'Germany, March dip' }],
        confidence: 'high',
      }).type,
    ).toBe('done');
    expect(
      chatEventSchema.parse({ type: 'error', message: 'Simulated upstream failure' }).type,
    ).toBe('error');
  });

  it('rejects a token without a value', () => {
    expect(chatEventSchema.safeParse({ type: 'token' }).success).toBe(false);
  });

  it('rejects an unknown answer kind', () => {
    expect(
      chatEventSchema.safeParse({ type: 'done', kind: 'maybe', citations: [], confidence: 'high' })
        .success,
    ).toBe(false);
  });
});

describe('chatRequestSchema', () => {
  it('trims the question', () => {
    expect(chatRequestSchema.parse({ question: '  germany  ' })).toEqual({ question: 'germany' });
  });

  it('rejects empty, blank and over-long questions', () => {
    expect(chatRequestSchema.safeParse({ question: '' }).success).toBe(false);
    expect(chatRequestSchema.safeParse({ question: '   ' }).success).toBe(false);
    expect(chatRequestSchema.safeParse({ question: 'a'.repeat(501) }).success).toBe(false);
    expect(chatRequestSchema.safeParse({ question: 'a'.repeat(500) }).success).toBe(true);
  });
});
