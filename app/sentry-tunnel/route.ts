// Sentry's tunnel in handler mode (ADR 0019): the browser posts events here
// and only the event body goes on to Sentry, never the visitor's headers (no
// IP in `X-Forwarded-For`, no user agent). The default rewrite mode forwards
// every request header. Accepts only our own DSN (403 otherwise).
export { POST } from '@sentry/nextjs/tunnel';
