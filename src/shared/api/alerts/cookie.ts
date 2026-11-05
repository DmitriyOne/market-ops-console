import { deflateRawSync, inflateRawSync } from 'node:zlib';

import { type AlertRule, alertRulesSchema } from './schema';

/** One cookie holds the list (Vercel keeps no memory between requests). */
export const ALERTS_COOKIE = 'mo-alerts';
export const ALERTS_COOKIE_MAX_AGE = 31536000;

// Deflated: ten full rules as plain base64 JSON pass the ~4 KB cookie limit.
export function encodeRules(rules: readonly AlertRule[]): string {
  return deflateRawSync(JSON.stringify(rules)).toString('base64url');
}

/** The stored list, or null when there is none or it is not a valid list. */
export function decodeRules(value: string | undefined): AlertRule[] | null {
  if (!value) return null;
  try {
    const parsed = alertRulesSchema.safeParse(
      JSON.parse(inflateRawSync(Buffer.from(value, 'base64url')).toString('utf8')),
    );
    return parsed.success ? parsed.data : null;
  } catch {
    // Not deflated base64 or not JSON: treated as no list, the next write replaces it.
    return null;
  }
}
