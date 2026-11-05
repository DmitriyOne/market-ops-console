import {
  type AppLocale,
  deMessages,
  enMessages,
  messagesFileFor,
  routing,
  ruMessages,
} from '@/shared/config';

import type { AlertRule } from './schema';

const MESSAGES = { en: enMessages, de: deMessages, ru: ruMessages } as const;

const isLocale = (value: string | null): value is AppLocale =>
  routing.locales.some((l) => l === value);

/**
 * The first visit's list (owner, 2026-11-05): two rules that flag markets
 * at once, named in the page's language. Not stored until the first write.
 */
export function exampleRules(locale: string | null): AlertRule[] {
  const names =
    MESSAGES[messagesFileFor(isLocale(locale) ? locale : routing.defaultLocale)].alerts.examples;
  return [
    {
      id: 'example-attainment',
      name: names.attainment,
      metric: 'attainment',
      operator: 'below',
      threshold: 95,
      scope: { kind: 'portfolio' },
      severity: 'critical',
      enabled: true,
    },
    {
      id: 'example-share',
      name: names.share,
      metric: 'share',
      operator: 'below',
      threshold: 10,
      scope: { kind: 'portfolio' },
      severity: 'warning',
      enabled: true,
    },
  ];
}
