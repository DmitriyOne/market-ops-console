// Mock alert rules API (spec §9). The list lives in one cookie because a
// serverless deployment keeps no memory between requests; the client
// treats it as any remote store (optimistic writes, rollback on failure).
import { type AlertRule, alertRuleInputSchema, SIMULATE_FAILURE_HEADER } from '@/shared/api';
import {
  addRule,
  ALERTS_COOKIE,
  ALERTS_COOKIE_MAX_AGE,
  decodeRules,
  encodeRules,
  exampleRules,
  removeRule,
  replaceRule,
  withErrorHandling,
} from '@/shared/api/server';
import { API_ROUTES, env } from '@/shared/config';
import { ForbiddenError, ValidationError } from '@/shared/lib';

export const runtime = 'nodejs';

const ROUTE = API_ROUTES.alerts;
const NO_STORE = { 'Cache-Control': 'no-store' };

const sleep = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

function readCookie(request: Request, name: string): string | undefined {
  for (const part of (request.headers.get('cookie') ?? '').split(';')) {
    const [key, ...value] = part.trim().split('=');
    if (key === name) return value.join('=');
  }
  return undefined;
}

/** The stored list; the examples until the first write. */
function storedRules(request: Request): AlertRule[] {
  return (
    decodeRules(readCookie(request, ALERTS_COOKIE)) ??
    exampleRules(new URL(request.url).searchParams.get('locale'))
  );
}

function cookieHeader(rules: readonly AlertRule[] | null): string {
  const secure = env.NODE_ENV === 'production' ? '; Secure' : '';
  // null clears the cookie (Max-Age=0).
  const value = rules ? encodeRules(rules) : '';
  const maxAge = rules ? ALERTS_COOKIE_MAX_AGE : 0;
  return `${ALERTS_COOKIE}=${value}; Path=${ROUTE}; Max-Age=${String(maxAge)}; HttpOnly; SameSite=Lax${secure}`;
}

function saved(rules: readonly AlertRule[], body: unknown, status = 200): Response {
  const headers = { ...NO_STORE, 'Set-Cookie': cookieHeader(rules) };
  if (body === null) return new Response(null, { status, headers });
  return Response.json(body, { status, headers });
}

/**
 * Writes come only from our own pages: SameSite=Lax already keeps the
 * cookie off cross-site POSTs, and this also refuses them outright.
 */
function assertSameOrigin(request: Request): void {
  const site = request.headers.get('sec-fetch-site');
  if (site !== null && site !== 'same-origin') throw new ForbiddenError('Cross-site write.');
  const origin = request.headers.get('origin');
  if (origin !== null && origin !== new URL(request.url).origin) {
    throw new ForbiddenError('Cross-site write.');
  }
}

async function readInput(request: Request) {
  // JSON only: a form post cannot send it without a CORS preflight.
  if (!request.headers.get('content-type')?.startsWith('application/json')) {
    throw new ValidationError('Body must be application/json.');
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch (error) {
    throw new ValidationError('Body must be JSON.', { cause: error });
  }
  const parsed = alertRuleInputSchema.safeParse(body);
  if (!parsed.success) {
    throw new ValidationError('The rule is not valid.', { cause: parsed.error });
  }
  return parsed.data;
}

function readId(request: Request): string {
  const id = new URL(request.url).searchParams.get('id');
  if (!id) throw new ValidationError('id is required.');
  return id;
}

/** Every write waits like a real network; a demo switch can fail one. */
async function write(request: Request, handler: () => Promise<Response>): Promise<Response> {
  assertSameOrigin(request);
  await sleep(env.MOCK_ALERTS_DELAY_MS);
  if (request.headers.get(SIMULATE_FAILURE_HEADER) === '1') {
    return Response.json(
      { error: { code: 'simulated', message: 'Simulated failure.' } },
      { status: 503, headers: NO_STORE },
    );
  }
  return handler();
}

// Reads answer at once: the delay is for writes, so "Saving…" can be seen (spec §9).
export const GET = withErrorHandling(ROUTE, (request: Request) => {
  const cookie = readCookie(request, ALERTS_COOKIE);
  const stored = decodeRules(cookie);
  const rules = stored ?? exampleRules(new URL(request.url).searchParams.get('locale'));
  // An unreadable cookie is warned about once (decodeRules) and cleared, so
  // every later load does not warn again (ADR 0019).
  const headers = cookie && !stored ? { ...NO_STORE, 'Set-Cookie': cookieHeader(null) } : NO_STORE;
  return Promise.resolve(Response.json({ rules }, { headers }));
});

export const POST = withErrorHandling(ROUTE, (request: Request) =>
  write(request, async () => {
    const input = await readInput(request);
    const { rules, rule } = addRule(storedRules(request), input, crypto.randomUUID());
    return saved(rules, { rule }, 201);
  }),
);

export const PATCH = withErrorHandling(ROUTE, (request: Request) =>
  write(request, async () => {
    const id = readId(request);
    const input = await readInput(request);
    const { rules, rule } = replaceRule(storedRules(request), id, input);
    return saved(rules, { rule });
  }),
);

export const DELETE = withErrorHandling(ROUTE, (request: Request) =>
  write(request, () => {
    const rules = removeRule(storedRules(request), readId(request));
    return Promise.resolve(saved(rules, null, 204));
  }),
);
