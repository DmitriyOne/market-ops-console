import { ConflictError, NotFoundError } from '@/shared/lib';

import { ruleNameKeys } from './examples';
import { type AlertRule, type AlertRuleInput, ALERTS_MAX, nameKey } from './schema';

function withoutPreset(input: AlertRuleInput): AlertRuleInput {
  const fields = { ...input };
  delete fields.preset;
  return fields;
}

function assertUniqueName(rules: readonly AlertRule[], name: string, exceptId?: string): void {
  const key = nameKey(name);
  if (rules.some((r) => r.id !== exceptId && ruleNameKeys(r).has(key))) {
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
  // Presets are the examples' own: a new rule cannot claim one (a client
  // sending it would get a second rule that answers to the example's names).
  const rule: AlertRule = { ...withoutPreset(input), id };
  return { rules: [...rules, rule], rule };
}

export function replaceRule(
  rules: readonly AlertRule[],
  id: string,
  input: AlertRuleInput,
): { rules: AlertRule[]; rule: AlertRule } {
  const current = rules.find((r) => r.id === id);
  if (!current) throw new NotFoundError('Alert rule', id);
  assertUniqueName(rules, input.name, id);
  // A change keeps the rule's own preset (a toggle sends it back) or drops it
  // (a form edit); it never gives the rule another one.
  const kept = input.preset !== undefined && input.preset === current.preset;
  const rule: AlertRule = {
    ...withoutPreset(input),
    ...(kept ? { preset: current.preset } : {}),
    id,
  };
  return { rules: rules.map((r) => (r.id === id ? rule : r)), rule };
}

export function removeRule(rules: readonly AlertRule[], id: string): AlertRule[] {
  if (!rules.some((r) => r.id === id)) throw new NotFoundError('Alert rule', id);
  return rules.filter((r) => r.id !== id);
}
