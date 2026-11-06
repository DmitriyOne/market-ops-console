// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { type AlertRuleInput, alertRuleResponseSchema, alertsResponseSchema } from '@/shared/api';
import { encodeRules } from '@/shared/api/server';

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
  it('a first visit gets the two examples as presets, nothing stored', async () => {
    const { send } = client();
    const response = await send(GET);
    expect(response.headers.get('set-cookie')).toBeNull();
    expect(response.headers.get('cache-control')).toBe('no-store');
    const { rules } = alertsResponseSchema.parse(await response.json());
    expect(rules.map((r) => [r.preset, r.name])).toEqual([
      ['attainment', 'Attainment below 95%'],
      ['share', 'Share below 10%'],
    ]);
  });

  it('an unreadable cookie is warned about once and cleared, not on every load', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const c = client();
    const first = await c.send(GET, { headers: { cookie: 'mo-alerts=%%%' } });
    expect(first.headers.get('set-cookie')).toMatch(/^mo-alerts=; .*Max-Age=0/);
    await c.send(GET);
    expect(warn).toHaveBeenCalledOnce();
    warn.mockRestore();
  });

  it('an example keeps its preset through a toggle; an edit from the form drops it', async () => {
    const c = client();
    const [example] = await c.list();
    if (!example) throw new Error('no example');
    const { id, ...stored } = example;
    await c.send(PATCH, { query: `?id=${id}`, body: { ...stored, enabled: false } });
    expect((await c.list())[0]).toMatchObject({ preset: 'attainment', enabled: false });

    const edited: Partial<typeof stored> = { ...stored, name: 'Мой план' };
    delete edited.preset;
    await c.send(PATCH, { query: `?id=${id}`, body: edited });
    expect((await c.list())[0]).toMatchObject({ name: 'Мой план' });
    expect((await c.list())[0]?.preset).toBeUndefined();
  });

  it("an example's name is taken in every language, not only the stored English one", async () => {
    const c = client();
    for (const name of ['Выполнение плана ниже 95%', 'attainment BELOW 95%']) {
      const response = await c.send(POST, { body: { ...input, name } });
      expect(response.status).toBe(409);
    }
  });

  it('a list stored by 0.15 (examples without a preset, named in Russian) gets the presets back', async () => {
    const c = client();
    const base = { operator: 'below', scope: { kind: 'portfolio' }, enabled: true } as const;
    const old = encodeRules([
      {
        ...base,
        id: 'example-attainment',
        name: 'Выполнение плана ниже 95%',
        metric: 'attainment',
        threshold: 95,
        severity: 'critical',
      },
      // Renamed by the user before 0.16: theirs, not the example's.
      {
        ...base,
        id: 'example-share',
        name: 'Моя доля',
        metric: 'share',
        threshold: 10,
        severity: 'warning',
      },
    ]);
    const response = await c.send(GET, { headers: { cookie: `mo-alerts=${old}` } });
    const { rules } = alertsResponseSchema.parse(await response.json());
    expect(rules.map((r) => [r.id, r.preset])).toEqual([
      ['example-attainment', 'attainment'],
      ['example-share', undefined],
    ]);
    // Its English name is taken too, as for a list stored by 0.16.
    const dup = await c.send(POST, {
      headers: { cookie: `mo-alerts=${old}` },
      body: { ...input, name: 'Attainment below 95%' },
    });
    expect(dup.status).toBe(409);
  });

  it('a write cannot give a rule a preset that is not its own', async () => {
    const c = client();
    const created = await c.send(POST, { body: { ...input, preset: 'attainment' } });
    const { rule } = alertRuleResponseSchema.parse(await created.json());
    expect(rule.preset).toBeUndefined();
    const { id, ...fields } = rule;
    const changed = await c.send(PATCH, {
      query: `?id=${id}`,
      body: { ...fields, preset: 'share' },
    });
    expect(alertRuleResponseSchema.parse(await changed.json()).rule.preset).toBeUndefined();
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
