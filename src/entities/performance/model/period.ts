import type { Period } from '@/shared/api';

/** `YYYY-MM` as the first day of that month, UTC (formats use timeZone UTC). */
export function periodToDate(period: Period): Date {
  return new Date(`${period}-01T00:00:00Z`);
}
