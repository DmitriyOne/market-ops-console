import { describe, expect, it } from 'vitest';

import { API_ROUTES } from './api-routes';

describe('API_ROUTES', () => {
  it('keeps every route under /api/v1/', () => {
    for (const route of Object.values(API_ROUTES)) {
      expect(route.startsWith('/api/v1/')).toBe(true);
    }
  });
});
