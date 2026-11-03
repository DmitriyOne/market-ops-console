import { setupServer } from 'msw/node';

/** MSW server for component and hook tests; started in `vitest.setup.ts`. */
export const server = setupServer();
