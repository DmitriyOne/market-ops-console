import '@testing-library/jest-dom/vitest';

import { vi } from 'vitest';

// `server-only` throws outside the react-server condition; tests import
// server modules (route handlers, the dataset loader) directly.
vi.mock('server-only', () => ({}));
