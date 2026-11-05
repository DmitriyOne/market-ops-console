'use client';

import { useTranslations } from 'next-intl';
import { useRef } from 'react';

import { ruleMarkets } from '@/entities/alert-rule';
import { useDashboard } from '@/entities/performance';
import { AlertsPanel } from '@/features/configure-alerts';
import { toast } from '@/shared/ui';

import { TriggeredAlerts } from './TriggeredAlerts';

/**
 * The alerts sheet / tab: what fires now, then the rules. A save confirmed
 * by the server says how many markets the rule flags, with a way to see them.
 */
export function AlertsView() {
  const t = useTranslations('alerts');
  const { ds } = useDashboard();
  const triggered = useRef<HTMLHeadingElement>(null);
  return (
    <AlertsPanel
      summary={<TriggeredAlerts headingRef={triggered} />}
      onSaved={(rule) => {
        toast.success(
          t('saved', {
            name: rule.name,
            enabled: String(rule.enabled),
            count: ruleMarkets(ds, rule).length,
          }),
          {
            label: t('triggered.show'),
            onClick: () => {
              // Sonner hands focus back to where it came from as soon as it
              // leaves the toasts; let it do that first, then move on.
              const active = document.activeElement;
              if (active instanceof HTMLElement) active.blur();
              triggered.current?.focus();
              triggered.current?.scrollIntoView({ block: 'start' });
            },
          },
        );
      }}
    />
  );
}
