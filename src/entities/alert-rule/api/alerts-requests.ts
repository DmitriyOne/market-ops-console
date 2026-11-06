import {
  type AlertRule,
  type AlertRuleInput,
  alertRuleResponseSchema,
  fetchEmpty,
  fetchJson,
  SIMULATE_FAILURE_HEADER,
} from '@/shared/api';
import { API_ROUTES } from '@/shared/config';

export type WriteOptions = {
  simulateFailure?: boolean;
};

function headers({ simulateFailure }: WriteOptions): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    ...(simulateFailure ? { [SIMULATE_FAILURE_HEADER]: '1' } : {}),
  };
}

function url(id: string | null): string {
  return id === null
    ? API_ROUTES.alerts
    : `${API_ROUTES.alerts}?${new URLSearchParams({ id }).toString()}`;
}

export async function createRule(
  input: AlertRuleInput,
  options: WriteOptions = {},
): Promise<AlertRule> {
  const { rule } = await fetchJson(url(null), alertRuleResponseSchema, {
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
  const { rule } = await fetchJson(url(id), alertRuleResponseSchema, {
    method: 'PATCH',
    headers: headers(options),
    body: JSON.stringify(input),
  });
  return rule;
}

export function deleteRule(id: string, options: WriteOptions = {}): Promise<void> {
  return fetchEmpty(url(id), { method: 'DELETE', headers: headers(options) });
}
