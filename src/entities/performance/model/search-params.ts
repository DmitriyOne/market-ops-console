import { parseAsNativeArrayOf, parseAsString } from 'nuqs/server';

import { CURRENCY_PARAM } from '@/shared/config';

/**
 * Dashboard view state in the URL (spec §6). Values are read as plain
 * strings and checked against the dataset in `normalizeDashboardState`,
 * so a bad value is corrected in the URL instead of silently kept there.
 */
export const dashboardSearchParams = {
  region: parseAsString,
  market: parseAsString,
  product: parseAsString,
  period: parseAsString,
  range: parseAsString,
  mode: parseAsString,
  /** Map metric (Analyst only); `status` is the default and is not written. */
  kpi: parseAsString,
  /**
   * Selected markets (assistant, map, tiles, table filter), as repeated keys
   * (`markets=de&markets=es`): the standard form, kept by the locale switch.
   */
  markets: parseAsNativeArrayOf(parseAsString),
  /** Markets table order: `growth` ascending, `-growth` descending. */
  sort: parseAsString,
  /**
   * Currency amounts are shown in (`useCurrency` reads it); checked here so a
   * bad or default value leaves the URL and Reset view clears it.
   */
  [CURRENCY_PARAM]: parseAsString,
};
