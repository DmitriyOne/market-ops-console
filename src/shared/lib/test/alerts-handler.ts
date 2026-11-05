import { http, HttpResponse } from 'msw';

import { type AlertRule, alertRuleInputSchema } from '@/shared/api';

/** The route's first-visit examples, as the browser receives them (en). */
export const EXAMPLE_RULES: readonly AlertRule[] = [
  {
    id: 'example-attainment',
    name: 'Attainment below 95%',
    metric: 'attainment',
    operator: 'below',
    threshold: 95,
    scope: { kind: 'portfolio' },
    severity: 'critical',
    enabled: true,
  },
  {
    id: 'example-share',
    name: 'Share below 10%',
    metric: 'share',
    operator: 'below',
    threshold: 10,
    scope: { kind: 'portfolio' },
    severity: 'warning',
    enabled: true,
  },
];

/**
 * An in-memory `/api/v1/alerts` for component tests. `hold()` keeps every
 * answer waiting until the returned function is called, so a test can look
 * at the optimistic state; `failNext()` answers the next write with 503.
 */
export function alertsApi(initial: readonly AlertRule[] = EXAMPLE_RULES) {
  let rules = [...initial];
  let gate: Promise<void> | null = null;
  let fail = false;
  let nextId = 1;
  const wait = () => gate ?? Promise.resolve();

  const writeFails = (request: Request) => {
    const failed = fail || request.headers.get('x-simulate-failure') === '1';
    fail = false;
    return failed;
  };
  const failure = () => HttpResponse.json({ error: { code: 'simulated' } }, { status: 503 });

  const handlers = [
    http.get('*/api/v1/alerts', async () => {
      await wait();
      return HttpResponse.json({ rules });
    }),
    http.post('*/api/v1/alerts', async ({ request }) => {
      const input = alertRuleInputSchema.parse(await request.json());
      await wait();
      if (writeFails(request)) return failure();
      const rule = { ...input, id: `rule-${String(nextId++)}` };
      rules = [...rules, rule];
      return HttpResponse.json({ rule }, { status: 201 });
    }),
    http.patch('*/api/v1/alerts', async ({ request }) => {
      const id = new URL(request.url).searchParams.get('id') ?? '';
      const input = alertRuleInputSchema.parse(await request.json());
      await wait();
      if (writeFails(request)) return failure();
      const rule = { ...input, id };
      rules = rules.map((r) => (r.id === id ? rule : r));
      return HttpResponse.json({ rule });
    }),
    http.delete('*/api/v1/alerts', async ({ request }) => {
      const id = new URL(request.url).searchParams.get('id') ?? '';
      await wait();
      if (writeFails(request)) return failure();
      rules = rules.filter((r) => r.id !== id);
      return new HttpResponse(null, { status: 204 });
    }),
  ];

  return {
    handlers,
    rules: () => rules,
    failNext: () => {
      fail = true;
    },
    hold: () => {
      let release: () => void = () => undefined;
      gate = new Promise<void>((resolve) => {
        release = () => {
          gate = null;
          resolve();
        };
      });
      return release;
    },
  };
}
