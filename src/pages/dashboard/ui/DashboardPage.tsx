'use client';

import { useSuspenseQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Suspense } from 'react';

import { datasetQueryOptions } from '@/entities/performance';
import { LocaleSwitch } from '@/features/switch-locale';
import { ThemeSwitch } from '@/features/switch-theme';
import { AppShell } from '@/widgets/app-shell';
import { AssistantPanel } from '@/widgets/assistant-panel';

// Placeholder proving the prefetched dataset hydrates; replaced in Plan 3.
function MarketCount() {
  const t = useTranslations('dashboard');
  const { data } = useSuspenseQuery(datasetQueryOptions);
  return <p className="p-4">{t('marketCount', { count: data.markets.length })}</p>;
}

function Header() {
  return (
    <div className="flex justify-end gap-1 p-2">
      {/* Reads search params, which static HTML does not have. */}
      <Suspense>
        <LocaleSwitch />
      </Suspense>
      <ThemeSwitch />
    </div>
  );
}

function Main() {
  return (
    <Suspense>
      <MarketCount />
    </Suspense>
  );
}

export function DashboardPage() {
  return (
    // The shell reads the URL (tab, focus), which static HTML does not have:
    // the static page shows header and dashboard, the assistant joins on hydration.
    <Suspense
      fallback={
        <div className="flex h-dvh flex-col bg-background">
          <header className="border-b border-border">
            <Header />
          </header>
          <main id="main" className="min-h-0 flex-1 overflow-y-auto">
            <Main />
          </main>
        </div>
      }
    >
      <AppShell
        header={<Header />}
        main={<Main />}
        assistant={(api) => (
          <AssistantPanel onAnswerDone={api.notifyAnswer} onFocusDashboard={api.showMain} />
        )}
      />
    </Suspense>
  );
}
