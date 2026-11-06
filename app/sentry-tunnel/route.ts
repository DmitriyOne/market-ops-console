import { createSentryTunnelRoute } from '@sentry/nextjs/tunnel';

import { env } from '@/shared/config';

// Sentry's tunnel in handler mode (ADR 0019): the browser posts events here
// and only the event body goes on to Sentry, never the visitor's headers (no
// IP in `X-Forwarded-For`, no user agent); the default rewrite mode forwards
// every request header. The allowed DSN is passed explicitly: by default the
// route asks the server SDK for it and answers 500 when that client is not
// up with a DSN. Another DSN gets 403; without a DSN there is no tunnel (404).
const dsn = env.NEXT_PUBLIC_SENTRY_DSN;
const tunnel = dsn ? createSentryTunnelRoute({ allowedDsns: [dsn] }) : null;

export function POST(request: Request): Promise<Response> {
  return tunnel ? tunnel.POST(request) : Promise.resolve(new Response(null, { status: 404 }));
}
