import {
  type AlertRule,
  type AlertRuleInput,
  alertRuleResponseSchema,
  fetchEmpty,
  fetchJson,
  SIMULATE_FAILURE_HEADER,
} from '@/shared/api';
import { API_ROUTES } from '@/shared/config';

export type WriteOptions = { simulateFailure?: boolean };

function headers({ simulateFailure }: WriteOptions): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    ...(simulateFailure ? { [SIMULATE_FAILURE_HEADER]: '1' } : {}),
  };
}

const withId = (id: string) => `${API_ROUTES.alerts}?${new URLSearchParams({ id }).toString()}`;

export async function createRule(
  input: AlertRuleInput,
  options: WriteOptions = {},
): Promise<AlertRule> {
  const { rule } = await fetchJson(API_ROUTES.alerts, alertRuleResponseSchema, {
    method: 'POST',
    headers: headers(options),
    body: JSON.stringify(input),
  });
  return rule;
}

export async function updateRule(
  id: string,
  input: AlertRuleInput,
  options: WriteOptions = {},
): Promise<AlertRule> {
  const { rule } = await fetchJson(withId(id), alertRuleResponseSchema, {
    method: 'PATCH',
    headers: headers(options),
    body: JSON.stringify(input),
  });
  return rule;
}

export function deleteRule(id: string, options: WriteOptions = {}): Promise<void> {
  return fetchEmpty(withId(id), { method: 'DELETE', headers: headers(options) });
}
