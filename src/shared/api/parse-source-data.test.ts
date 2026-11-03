import { describe, expect, it } from 'vitest';
import { z, ZodError } from 'zod';

import { DataIntegrityError } from '@/shared/lib';

import { parseSourceData } from './parse-source-data';

const schema = z.object({ markets: z.array(z.object({ id: z.string() })) });

describe('parseSourceData', () => {
  it('returns the parsed value', () => {
    expect(parseSourceData(schema, { markets: [{ id: 'de' }] }, 'data.json')).toEqual({
      markets: [{ id: 'de' }],
    });
  });

  it('throws DataIntegrityError naming the file and the first broken path', () => {
    let caught: unknown;
    try {
      parseSourceData(schema, { markets: [{ id: 7 }] }, 'data.json');
    } catch (error) {
      caught = error;
    }
    if (!(caught instanceof DataIntegrityError)) throw new Error('expected DataIntegrityError');
    expect(caught.message).toContain('data.json');
    expect(caught.message).toContain('markets.0.id');
    expect(caught.cause).toBeInstanceOf(ZodError);
  });
});
