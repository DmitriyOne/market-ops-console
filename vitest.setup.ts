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

// jsdom has no ResizeObserver; Radix measures floating content (tooltip arrow) with it.
class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}
// Assigned, not stubbed: tests that unstub their own globals must keep it.
Object.assign(globalThis, { ResizeObserver: ResizeObserverStub });

// jsdom has no pointer capture or scrollIntoView; sonner's swipe and Radix
// Select call them on press and open. Node-environment tests have no DOM.
if (typeof Element !== 'undefined') {
  Object.assign(Element.prototype, {
    setPointerCapture(): void {},
    releasePointerCapture(): void {},
    hasPointerCapture: () => false,
    scrollIntoView(): void {},
  });
}
