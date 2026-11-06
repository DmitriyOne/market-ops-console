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

/**
 * The body, counted as it arrives: null once it passes the cap, whatever
 * Content-Length says (a chunked body has none).
 */
async function readCapped(
  body: ReadableStream<Uint8Array>,
): Promise<Uint8Array<ArrayBuffer> | null> {
  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_BYTES) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(new ArrayBuffer(total));
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

export async function POST(request: Request): Promise<Response> {
  if (!tunnel) return new Response(null, { status: 404 });
  if (!request.body) return new Response(null, { status: 400 });
  if (Number(request.headers.get('content-length')) > MAX_BYTES) {
    return new Response(null, { status: 413 });
  }
  const body = await readCapped(request.body);
  if (!body) return new Response(null, { status: 413 });
  const bare = new Request(request.url, {
    method: 'POST',
    body,
    headers: { 'Content-Length': String(body.byteLength) },
  });
  return tunnel.POST(bare);
}
