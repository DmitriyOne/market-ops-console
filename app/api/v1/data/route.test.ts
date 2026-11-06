// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { datasetSchema } from '@/shared/api';

import { GET } from './route';

describe('GET /api/v1/data', () => {
  it('returns the validated dataset with a cache header', async () => {
    const response = await GET();
    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('public, max-age=3600');
    expect(datasetSchema.safeParse(await response.json()).success).toBe(true);
  });
});
