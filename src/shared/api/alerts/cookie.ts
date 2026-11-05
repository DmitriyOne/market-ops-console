import { deflateRawSync, inflateRawSync } from 'node:zlib';

import { type AlertRule, alertRulesSchema } from './schema';

/** One cookie holds the list (Vercel keeps no memory between requests). */
export const ALERTS_COOKIE = 'mo-alerts';
export const ALERTS_COOKIE_MAX_AGE = 31536000;
/** Browsers keep ~4 KB per cookie; anything longer was not written by us. */
const MAX_COOKIE_LENGTH = 4096;
/** Ten full rules inflate to ~3 KB; the cap stops a crafted value expanding. */
const MAX_INFLATED_BYTES = 16 * 1024;

// Deflated: ten full rules as plain base64 JSON pass the ~4 KB cookie limit.
export function encodeRules(rules: readonly AlertRule[]): string {
  return deflateRawSync(JSON.stringify(rules)).toString('base64url');
}

/** The stored list, or null when there is none or it is not a valid list. */
export function decodeRules(value: string | undefined): AlertRule[] | null {
  if (!value || value.length > MAX_COOKIE_LENGTH) return null;
  try {
    const inflated = inflateRawSync(Buffer.from(value, 'base64url'), {
      maxOutputLength: MAX_INFLATED_BYTES,
    });
    const parsed = alertRulesSchema.safeParse(JSON.parse(inflated.toString('utf8')));
    return parsed.success ? parsed.data : null;
  } catch {
    // Not deflated base64, too large once inflated, or not JSON: treated as no list, the next write replaces it.
    return null;
  }
}
