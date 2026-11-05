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
import { ValidationError } from '@/shared/lib';

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

function cookieHeader(rules: readonly AlertRule[]): string {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${ALERTS_COOKIE}=${encodeRules(rules)}; Path=${ROUTE}; Max-Age=${String(ALERTS_COOKIE_MAX_AGE)}; HttpOnly; SameSite=Lax${secure}`;
}

function saved(rules: readonly AlertRule[], body: unknown, status = 200): Response {
  const headers = { ...NO_STORE, 'Set-Cookie': cookieHeader(rules) };
  if (body === null) return new Response(null, { status, headers });
  return Response.json(body, { status, headers });
}

async function readInput(request: Request) {
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

/** Every answer waits like a real network; a demo switch can fail one write. */
async function write(request: Request, handler: () => Promise<Response>): Promise<Response> {
  await sleep(env.MOCK_ALERTS_DELAY_MS);
  if (request.headers.get(SIMULATE_FAILURE_HEADER) === '1') {
    return Response.json(
      { error: { code: 'simulated', message: 'Simulated failure.' } },
      { status: 503, headers: NO_STORE },
    );
  }
  return handler();
}

export const GET = withErrorHandling(ROUTE, async (request: Request) => {
  await sleep(env.MOCK_ALERTS_DELAY_MS);
  return Response.json({ rules: storedRules(request) }, { headers: NO_STORE });
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
