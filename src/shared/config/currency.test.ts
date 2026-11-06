import { describe, expect, it } from 'vitest';

import { CURRENCIES, isCurrency } from './currency';

describe('isCurrency', () => {
  it('accepts the three codes as written in the URL', () => {
    for (const code of CURRENCIES) expect(isCurrency(code)).toBe(true);
  });

  it('rejects anything else: other codes, lower case, empty', () => {
    for (const value of ['JPY', 'eur', 'Gbp', '', ' USD']) expect(isCurrency(value)).toBe(false);
  });
});
