import { deflateRawSync, inflateRawSync } from 'node:zlib';

import { logWarning } from '@/shared/lib';

import { restorePresets } from './examples';
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
  if (!value) return null;
  // A cookie that is there but unreadable means the user's rules are gone
  // (the next write replaces them): a warning, not silence (ADR 0019).
  const unreadable = (reason: string) => {
    logWarning('alerts_cookie_unreadable', {
      scope: 'api',
      reason,
      length: value.length,
    });
    return null;
  };
  if (value.length > MAX_COOKIE_LENGTH) return unreadable('too_long');
  try {
    const inflated = inflateRawSync(Buffer.from(value, 'base64url'), {
      maxOutputLength: MAX_INFLATED_BYTES,
    });
    const parsed = alertRulesSchema.safeParse(JSON.parse(inflated.toString('utf8')));
    return parsed.success ? restorePresets(parsed.data) : unreadable('schema');
  } catch {
    // Not deflated base64, too large once inflated, or not JSON: treated as no list, the next write replaces it.
    return unreadable('format');
  }
}
