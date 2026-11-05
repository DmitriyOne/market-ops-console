import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { type AlertRuleInput, alertRuleInputSchema, HttpError } from '@/shared/api';
import { server } from '@/shared/lib/test';

import { createRule, deleteRule } from './alerts-requests';

const input: AlertRuleInput = {
  name: 'Low growth',
  metric: 'growth',
  operator: 'below',
  threshold: 0,
  scope: { kind: 'portfolio' },
  severity: 'warning',
  enabled: true,
};

describe('alert rule requests', () => {
  it('sends JSON, and the demo header only when asked', async () => {
    const seen: (string | null)[] = [];
    server.use(
      http.post('*/api/v1/alerts', async ({ request }) => {
        seen.push(request.headers.get('x-simulate-failure'));
        expect(request.headers.get('content-type')).toBe('application/json');
        return HttpResponse.json(
          { rule: { ...alertRuleInputSchema.parse(await request.json()), id: 'x' } },
          { status: 201 },
        );
      }),
    );
    await expect(createRule(input)).resolves.toMatchObject({ id: 'x', name: 'Low growth' });
    await createRule(input, { simulateFailure: true });
    expect(seen).toEqual([null, '1']);
  });

  it('a failed delete carries the server code', async () => {
    server.use(
      http.delete('*/api/v1/alerts', () =>
        HttpResponse.json({ error: { code: 'simulated' } }, { status: 503 }),
      ),
    );
    const error: unknown = await deleteRule('a').catch((e: unknown) => e);
    expect(error).toBeInstanceOf(HttpError);
    expect(error).toMatchObject({ status: 503, code: 'simulated' });
  });
});
