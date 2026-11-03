import { withErrorHandling } from '@/shared/api';
import { loadDataset } from '@/shared/api/server';

export const GET = withErrorHandling('/api/v1/data', () =>
  Response.json(loadDataset(), {
    headers: { 'Cache-Control': 'public, max-age=3600' },
  }),
);
