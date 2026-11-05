// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { type AlertRuleInput, alertRuleResponseSchema, alertsResponseSchema } from '@/shared/api';

import { DELETE, GET, PATCH, POST } from './route';

const URL_BASE = 'http://localhost/api/v1/alerts';
const errorBody = z.object({ error: z.object({ code: z.string() }) });

const input: AlertRuleInput = {
  name: 'Low growth',
  metric: 'growth',
  operator: 'below',
  threshold: 0,
  scope: { kind: 'portfolio' },
  severity: 'warning',
  enabled: true,
};

/** Keeps the cookie between calls, like a browser. */
function client() {
  let cookie = '';
  const send = async (
    handler: (r: Request) => Promise<Response>,
    {
      query = '',
      body,
      headers = {},
    }: { query?: string; body?: unknown; headers?: Record<string, string> } = {},
  ) => {
    const response = await handler(
      new Request(`${URL_BASE}${query}`, {
        method: 'POST',
        headers: { cookie, 'content-type': 'application/json', ...headers },
        body: body === undefined ? undefined : JSON.stringify(body),
      }),
    );
    const set = response.headers.get('set-cookie');
    if (set) cookie = set.split(';')[0] ?? '';
    return response;
  };
  const list = async () => alertsResponseSchema.parse(await (await send(GET)).json()).rules;
  return { send, list, cookie: () => cookie };
}

describe('/api/v1/alerts', () => {
  it('a first visit gets the two examples in the asked language, nothing stored', async () => {
    const { send } = client();
    const response = await send(GET, { query: '?locale=ru-RU' });
    expect(response.headers.get('set-cookie')).toBeNull();
    expect(response.headers.get('cache-control')).toBe('no-store');
    const { rules } = alertsResponseSchema.parse(await response.json());
    expect(rules.map((r) => r.name)).toEqual(['Выполнение плана ниже 95%', 'Доля ниже 10%']);
  });

  it('creates, replaces and deletes, keeping the list in an httpOnly cookie', async () => {
    const c = client();
    const created = await c.send(POST, { body: input });
    expect(created.status).toBe(201);
    expect(created.headers.get('set-cookie')).toMatch(/HttpOnly; SameSite=Lax/);
    const { rule } = alertRuleResponseSchema.parse(await created.json());
    expect((await c.list()).map((r) => r.name)).toEqual([
      'Attainment below 95%',
      'Share below 10%',
      'Low growth',
    ]);

    const patched = await c.send(PATCH, {
      query: `?id=${rule.id}`,
      body: { ...input, enabled: false },
    });
    expect(patched.status).toBe(200);
    expect((await c.list()).find((r) => r.id === rule.id)?.enabled).toBe(false);

    const deleted = await c.send(DELETE, { query: '?id=example-share' });
    expect(deleted.status).toBe(204);
    expect((await c.list()).map((r) => r.id)).toEqual(['example-attainment', rule.id]);
  });

  it('answers with codes the client translates', async () => {
    const c = client();
    const code = async (r: Response) => errorBody.parse(await r.json()).error.code;

    const invalid = await c.send(POST, { body: { ...input, threshold: 500 } });
    expect([invalid.status, await code(invalid)]).toEqual([400, 'invalid_request']);

    const dup = await c.send(POST, { body: { ...input, name: ' attainment BELOW 95% ' } });
    expect([dup.status, await code(dup)]).toEqual([409, 'duplicate_name']);

    const missing = await c.send(PATCH, { query: '?id=nope', body: input });
    expect([missing.status, await code(missing)]).toEqual([404, 'not_found']);

    for (let i = 0; i < 8; i += 1)
      await c.send(POST, { body: { ...input, name: `R${String(i)}` } });
    const full = await c.send(POST, { body: { ...input, name: 'Eleventh' } });
    expect([full.status, await code(full)]).toEqual([409, 'too_many']);
  });

  it('the demo switch fails one write with 503 and stores nothing', async () => {
    const c = client();
    const failed = await c.send(POST, { body: input, headers: { 'x-simulate-failure': '1' } });
    expect(failed.status).toBe(503);
    expect(await failed.json()).toMatchObject({ error: { code: 'simulated' } });
    expect(c.cookie()).toBe('');
    expect(await c.list()).toHaveLength(2);
  });

  it('refuses writes from another site and bodies that are not JSON', async () => {
    const c = client();
    const code = async (r: Response) => errorBody.parse(await r.json()).error.code;
    const fetchSite = await c.send(POST, {
      body: input,
      headers: { 'sec-fetch-site': 'cross-site' },
    });
    expect([fetchSite.status, await code(fetchSite)]).toEqual([403, 'forbidden']);
    const origin = await c.send(DELETE, {
      query: '?id=example-share',
      headers: { origin: 'https://evil.example' },
    });
    expect(origin.status).toBe(403);
    const form = await c.send(POST, { body: input, headers: { 'content-type': 'text/plain' } });
    expect([form.status, await code(form)]).toEqual([400, 'invalid_request']);
    expect(c.cookie()).toBe('');
    const same = await c.send(POST, {
      body: input,
      headers: { 'sec-fetch-site': 'same-origin', origin: 'http://localhost' },
    });
    expect(same.status).toBe(201);
  });

  it('a broken cookie is read as no list', async () => {
    const response = await GET(new Request(URL_BASE, { headers: { cookie: 'mo-alerts=garbage' } }));
    expect(await response.json()).toMatchObject({
      rules: [{ id: 'example-attainment' }, { id: 'example-share' }],
    });
  });
});
