import { ConflictError, NotFoundError } from '@/shared/lib';

import { type AlertRule, type AlertRuleInput, ALERTS_MAX, nameKey } from './schema';

function assertUniqueName(rules: readonly AlertRule[], name: string, exceptId?: string): void {
  const key = nameKey(name);
  if (rules.some((r) => r.id !== exceptId && nameKey(r.name) === key)) {
    throw new ConflictError('duplicate_name', 'A rule with this name already exists.');
  }
}

export function addRule(
  rules: readonly AlertRule[],
  input: AlertRuleInput,
  id: string,
): { rules: AlertRule[]; rule: AlertRule } {
  if (rules.length >= ALERTS_MAX) {
    throw new ConflictError('too_many', `At most ${String(ALERTS_MAX)} rules.`);
  }
  assertUniqueName(rules, input.name);
  const rule = { ...input, id };
  return { rules: [...rules, rule], rule };
}

export function replaceRule(
  rules: readonly AlertRule[],
  id: string,
  input: AlertRuleInput,
): { rules: AlertRule[]; rule: AlertRule } {
  if (!rules.some((r) => r.id === id)) throw new NotFoundError('Alert rule', id);
  assertUniqueName(rules, input.name, id);
  const rule = { ...input, id };
  return { rules: rules.map((r) => (r.id === id ? rule : r)), rule };
}

export function removeRule(rules: readonly AlertRule[], id: string): AlertRule[] {
  if (!rules.some((r) => r.id === id)) throw new NotFoundError('Alert rule', id);
  return rules.filter((r) => r.id !== id);
}
