import { parseAsArrayOf, parseAsString, parseAsStringLiteral } from 'nuqs/server';

import type { Range } from './scope';

export const RANGES = ['1m', '3m', '12m'] as const satisfies readonly Range[];

/** Dashboard view state in the URL (spec §6). */
export const dashboardSearchParams = {
  region: parseAsString,
  market: parseAsString,
  product: parseAsString,
  period: parseAsString,
  range: parseAsStringLiteral(RANGES).withDefault('1m'),
  /** Markets highlighted from the assistant's data check. */
  markets: parseAsArrayOf(parseAsString),
};
