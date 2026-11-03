import '@testing-library/jest-dom/vitest';

import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Vitest runs without globals, so Testing Library cannot unmount on its own.
afterEach(() => {
  cleanup();
});

// `server-only` throws outside the react-server condition; tests import
// server modules (route handlers, the dataset loader) directly.
vi.mock('server-only', () => ({}));
