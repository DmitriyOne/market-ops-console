import { createSentryTunnelRoute } from '@sentry/nextjs/tunnel';

import { env } from '@/shared/config';

// Sentry's tunnel (ADR 0019): the browser posts events here, so it never
// talks to sentry.io. The SDK's handler forwards the visitor's IP (as
// `X-Sentry-Forwarded-For`), user agent, client hints, origin and referer;
// we hand it a fresh request with the body and its length only, so none of
// those reach Sentry. The DSN is passed from env (another DSN gets 403);
// without one there is no tunnel (404).
const MAX_BYTES = 1024 * 1024;
const dsn = env.NEXT_PUBLIC_SENTRY_DSN;
const tunnel = dsn ? createSentryTunnelRoute({ allowedDsns: [dsn] }) : null;

export async function POST(request: Request): Promise<Response> {
  if (!tunnel) return new Response(null, { status: 404 });
  if (Number(request.headers.get('content-length')) > MAX_BYTES) {
    return new Response(null, { status: 413 });
  }
  const body = await request.arrayBuffer();
  const bare = new Request(request.url, {
    method: 'POST',
    body,
    headers: { 'Content-Length': String(body.byteLength) },
  });
  return tunnel.POST(bare);
}
