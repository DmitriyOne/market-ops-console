export const API_ROUTES = {
  chat: '/api/v1/chat',
  data: '/api/v1/data',
  alerts: '/api/v1/alerts',
} as const;

export type ApiRoute = (typeof API_ROUTES)[keyof typeof API_ROUTES];
