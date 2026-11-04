import { http, type HttpHandler } from 'msw';

import raw from '@/data/data.json';

/** The data route answering with the real `data.json`, or with `status`. */
export function datasetHandler(options: { status?: number } = {}): HttpHandler {
  return http.get('*/api/v1/data', () =>
    options.status
      ? Response.json({ error: { code: 'server_error' } }, { status: options.status })
      : Response.json(raw),
  );
}
