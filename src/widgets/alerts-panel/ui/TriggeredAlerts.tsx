'use client';

import { useTranslations } from 'next-intl';
import { type Ref, useId } from 'react';

import {
  AlertMark,
  flaggedIds,
  metricValue,
  useAlertFlags,
  useAlertRules,
  useMetricValueFormat,
  useThresholdFormat,
} from '@/entities/alert-rule';
import { useDashboard, useKpiFormat } from '@/entities/performance';
import { useDrillDown } from '@/features/drill-down';
import { useSection } from '@/features/switch-section';
import { scrollMainToTop } from '@/shared/lib';
import { Button } from '@/shared/ui';

/**
 * What the rules flag now: one row per market, most severe first, each
 * rule with the market's figure, and a button that opens the market (and
 * leaves the panel). The answer to "my alert fired: where?".
 */
export function TriggeredAlerts({ headingRef }: { headingRef?: Ref<HTMLHeadingElement> }) {
  const t = useTranslations('alerts');
  const tCommon = useTranslations('common');
  const titleId = useId();
  const { ds } = useDashboard();
  const { period } = useKpiFormat();
  const value = useMetricValueFormat();
  const threshold = useThresholdFormat();
  const rules = useAlertRules();
  const flags = useAlertFlags(ds);
  const { toMarket } = useDrillDown();
  const [, setSection] = useSection();

  if (!rules.data) return null;
  const ids = flaggedIds(flags);

  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-2">
      <h3
        id={titleId}
        ref={headingRef}
        tabIndex={-1}
        className="text-base font-semibold outline-none"
      >
        {t('triggered.title', { count: ids.length, period: period(ds.meta.latestPeriod) })}
      </h3>
      {ids.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('triggered.none')}</p>
      ) : (
        <ul className="flex flex-col">
          {ids.map((id) => {
            const market = ds.markets.find((m) => m.id === id);
            const flag = flags.byMarket.get(id);
            if (!market || !flag) return null;
            return (
              <li
                key={id}
                className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border py-2 first:border-t-0"
              >
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <p className="flex items-center gap-1.5 font-semibold">
                    <AlertMark flag={flag} labelled={false} />
                    {market.name}
                    <span className="sr-only">
                      {tCommon('srAfter', { text: t(`severity.${flag.severity}`) })}
                    </span>
                  </p>
                  {flag.rules.map((rule) => (
                    <p key={rule.id} className="text-xs text-muted-foreground">
                      {t('triggered.reason', {
                        metric: t(`metric.${rule.metric}`),
                        value: value(rule.metric, metricValue(market, rule.metric)),
                        operator: rule.operator,
                        threshold: threshold(rule.metric, rule.threshold),
                      })}
                    </p>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="h-11"
                  // The name is in the label, the short word on the button (label in name).
                  aria-label={t('triggered.open', { name: market.name })}
                  onClick={() => {
                    toMarket(id);
                    // Leave the panel: the desktop sheet closes, the phone shows Overview.
                    setSection('overview', { history: 'replace' });
                    scrollMainToTop();
                  }}
                >
                  {t('triggered.openShort')}
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
