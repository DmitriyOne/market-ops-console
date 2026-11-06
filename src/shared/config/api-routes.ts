export const API_ROUTES = {
  chat: '/api/v1/chat',
  data: '/api/v1/data',
  alerts: '/api/v1/alerts',
  /** Sentry test page only; 404 unless ENABLE_SENTRY_TEST_PAGE is set (ADR 0019). */
  sentryTest: '/api/v1/sentry-test',
} as const;

export type ApiRoute = (typeof API_ROUTES)[keyof typeof API_ROUTES];
