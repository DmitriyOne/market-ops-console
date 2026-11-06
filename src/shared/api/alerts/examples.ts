import { deMessages, enMessages, ruMessages } from '@/shared/config';

import { type AlertPreset, type AlertRule, nameKey } from './schema';

const PRESET_NAMES = [enMessages, deMessages, ruMessages].map((m) => m.alerts.examples);

/**
 * The first visit's list (owner, 2026-11-05): two rules that flag markets
 * at once. Each carries its preset, so the page names it in its own
 * language (owner, 2026-11-06); `name` holds the English one. Not stored
 * until the first write.
 */
export function exampleRules(): AlertRule[] {
  const en = enMessages.alerts.examples;
  return [
    {
      id: 'example-attainment',
      name: en.attainment,
      metric: 'attainment',
      operator: 'below',
      threshold: 95,
      scope: { kind: 'portfolio' },
      severity: 'critical',
      enabled: true,
      preset: 'attainment',
    },
    {
      id: 'example-share',
      name: en.share,
      metric: 'share',
      operator: 'below',
      threshold: 10,
      scope: { kind: 'portfolio' },
      severity: 'warning',
      enabled: true,
      preset: 'share',
    },
  ];
}

/**
 * The names a rule goes by, compared as `nameKey`: its own, and for an
 * example every language's name for it, since a page in any language shows
 * one of them.
 */
export function ruleNameKeys(rule: Pick<AlertRule, 'name' | 'preset'>): Set<string> {
  const keys = new Set([nameKey(rule.name)]);
  const preset: AlertPreset | undefined = rule.preset;
  if (preset) for (const names of PRESET_NAMES) keys.add(nameKey(names[preset]));
  return keys;
}
