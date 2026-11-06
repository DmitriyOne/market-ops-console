import type { z } from 'zod';

import { DataIntegrityError } from '@/shared/lib';

/** Validates a bundled source file (data.json, fixtures.json); a mismatch is a server fault. */
export function parseSourceData<T>(schema: z.ZodType<T>, raw: unknown, source: string): T {
  const result = schema.safeParse(raw);
  if (result.success) return result.data;
  const first = result.error.issues[0];
  const where = first ? `${first.path.join('.') || '(root)'}: ${first.message}` : 'invalid';
  throw new DataIntegrityError(`${source} does not match its schema (${where})`, {
    cause: result.error,
  });
}
