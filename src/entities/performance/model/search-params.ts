import { parseAsNativeArrayOf, parseAsString } from 'nuqs/server';

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
  /**
   * Markets highlighted from the assistant's data check, as repeated keys
   * (`markets=de&markets=es`): the standard form, kept by the locale switch.
   */
  markets: parseAsNativeArrayOf(parseAsString),
};
