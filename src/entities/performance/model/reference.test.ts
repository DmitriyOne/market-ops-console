import { describe, expect, it } from 'vitest';

import { scopeParts } from './reference';
import { ds } from './test-dataset';

describe('scopeParts', () => {
  it('names the product, then the market or region; none for the portfolio', () => {
    expect(scopeParts(ds, { productId: 'veltrix', marketId: 'de', regionId: 'eu' })).toEqual([
      'Veltrix',
      'Germany',
    ]);
    expect(scopeParts(ds, { regionId: 'eu' })).toEqual(['Europe']);
    expect(scopeParts(ds, {})).toEqual([]);
  });
});
