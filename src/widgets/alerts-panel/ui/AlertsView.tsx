'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';

import { ruleMarkets } from '@/entities/alert-rule';
import { useDashboard } from '@/entities/performance';
import { AlertsPanel, type AlertTab } from '@/features/configure-alerts';
import { useSection } from '@/features/switch-section';
import { toast } from '@/shared/ui';

import { TriggeredAlerts } from './TriggeredAlerts';

/**
 * The alerts sheet / tab: "Firing" first (the bell's answer), "Rules" one
 * tap away. A save the server confirms says how many markets the rule
 * flags, with Show, which opens "Firing" at its heading.
 */
export function AlertsView() {
  const t = useTranslations('alerts');
  const { ds } = useDashboard();
  const [tab, setTab] = useState<AlertTab>('firing');
  const heading = useRef<HTMLHeadingElement>(null);
  const [, setSection] = useSection();

  // A save can be confirmed after the sheet or tab was closed; Show then
  // opens it again (on "Firing", where it starts).
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // The heading exists only once "Firing" is shown: focus it after that render.
  const [showFiring, setShowFiring] = useState(0);
  useEffect(() => {
    if (showFiring === 0) return;
    heading.current?.focus();
    heading.current?.scrollIntoView({ block: 'start' });
  }, [showFiring]);

  return (
    <AlertsPanel
      tab={tab}
      onTabChange={setTab}
      firing={<TriggeredAlerts headingRef={heading} />}
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
              if (!mounted.current) {
                setSection('alerts');
                return;
              }
              // Sonner hands focus back to where it came from as soon as it
              // leaves the toasts; let it do that first, then move on.
              const active = document.activeElement;
              if (active instanceof HTMLElement) active.blur();
              setTab('firing');
              setShowFiring((n) => n + 1);
            },
          },
        );
      }}
    />
  );
}
