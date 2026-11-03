import '@testing-library/jest-dom/vitest';

import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';

import { server } from '@/shared/lib/test';

// Vitest runs without globals, so Testing Library cannot unmount on its own.
afterEach(() => {
  cleanup();
  server.resetHandlers();
});

// Network in tests goes through MSW; an unmocked request fails the test.
beforeAll(() => {
  server.listen({ onUnhandledFrame: 'error' });
});
afterAll(() => {
  server.close();
});

// `server-only` throws outside the react-server condition; tests import
// server modules (route handlers, the dataset loader) directly.
vi.mock('server-only', () => ({}));
