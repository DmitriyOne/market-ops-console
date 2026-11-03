import { loadDataset } from '@/shared/api/server';

export function GET(): Response {
  return Response.json(loadDataset(), {
    headers: { 'Cache-Control': 'public, max-age=3600' },
  });
}
