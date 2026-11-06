import { loadDataset, withErrorHandling } from '@/shared/api/server';

export const GET = withErrorHandling('/api/v1/data', () =>
  Response.json(loadDataset(), {
    headers: { 'Cache-Control': 'public, max-age=3600' },
  }),
);
