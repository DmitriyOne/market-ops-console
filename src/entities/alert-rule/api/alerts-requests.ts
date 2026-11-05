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
  /** Names the first-visit examples the server stores on the first write. */
  locale?: string;
  simulateFailure?: boolean;
};

function headers({ simulateFailure }: WriteOptions): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    ...(simulateFailure ? { [SIMULATE_FAILURE_HEADER]: '1' } : {}),
  };
}

function url(id: string | null, { locale }: WriteOptions): string {
  const params = new URLSearchParams();
  if (id !== null) params.set('id', id);
  if (locale) params.set('locale', locale);
  const query = params.toString();
  return query ? `${API_ROUTES.alerts}?${query}` : API_ROUTES.alerts;
}

export async function createRule(
  input: AlertRuleInput,
  options: WriteOptions = {},
): Promise<AlertRule> {
  const { rule } = await fetchJson(url(null, options), alertRuleResponseSchema, {
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
  const { rule } = await fetchJson(url(id, options), alertRuleResponseSchema, {
    method: 'PATCH',
    headers: headers(options),
    body: JSON.stringify(input),
  });
  return rule;
}

export function deleteRule(id: string, options: WriteOptions = {}): Promise<void> {
  return fetchEmpty(url(id, options), { method: 'DELETE', headers: headers(options) });
}
