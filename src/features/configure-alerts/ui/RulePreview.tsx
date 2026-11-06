'use client';

import { useFormatter, useTranslations } from 'next-intl';

import { ruleMarkets } from '@/entities/alert-rule';
import { useKpiFormat } from '@/entities/performance';
import type { Dataset } from '@/shared/api';

import { parseThreshold, type RuleFormValues, toRuleInput } from '../model/rule-form';

/** "Would flag 3 markets now (May 2026): …", following the fields as they change. */
/** The fields that decide which markets a rule flags. */
export type PreviewValues = Pick<
  RuleFormValues,
  'metric' | 'operator' | 'threshold' | 'scopeKind' | 'regionId' | 'marketIds'
>;

export function RulePreview({ ds, values }: { ds: Dataset; values: PreviewValues }) {
  const t = useTranslations('alerts.preview');
  const format = useFormatter();
  const { period: formatPeriod } = useKpiFormat();
  const period = formatPeriod(ds.meta.latestPeriod);

  const incomplete =
    Number.isNaN(parseThreshold(values.threshold)) ||
    (values.scopeKind === 'region' && values.regionId === '') ||
    (values.scopeKind === 'markets' && values.marketIds.length === 0);
  const markets = incomplete
    ? []
    : ruleMarkets(ds, toRuleInput({ ...values, name: '', severity: 'warning', enabled: true }));
  const text = incomplete
    ? t('incomplete')
    : markets.length === 0
      ? t('none', { period })
      : t('flags', {
          count: markets.length,
          period,
          markets: format.list(
            markets.map((m) => m.name),
            { type: 'conjunction' },
          ),
        });

  return (
    <div className="rounded-lg border border-border bg-muted/50 p-3">
      <p className="text-xs font-medium text-muted-foreground">{t('label')}</p>
      {/* Polite: read when the user pauses, not on every key. */}
      <p aria-live="polite" className="text-sm">
        {text}
      </p>
    </div>
  );
}
