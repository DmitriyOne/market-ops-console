'use client';

import { Suspense } from 'react';

import { DatasetGate } from '@/entities/performance';
import { AlertsPanelSkeleton } from '@/features/configure-alerts';
import { CurrencyFormats } from '@/shared/lib';
import { AlertsView } from '@/widgets/alerts-panel';
import { AppShell, AppShellFallback } from '@/widgets/app-shell';
import { AssistantPanel, AssistantPanelSkeleton } from '@/widgets/assistant-panel';
import { DashboardHeader, DashboardHeaderSkeleton } from '@/widgets/dashboard-header';

import { Overview, OverviewSkeleton } from './Overview';

export function DashboardPage() {
  return (
    // The shell reads the URL (tab, focus), which static HTML does not have:
    // the static page shows skeletons in the real shape, the view joins on hydration.
    // The currency is in the URL too, so its formats are provided in here.
    <Suspense
      fallback={
        <AppShellFallback
          header={<DashboardHeaderSkeleton />}
          main={<OverviewSkeleton />}
          assistant={<AssistantPanelSkeleton />}
          alerts={<AlertsPanelSkeleton />}
        />
      }
    >
      <CurrencyFormats>
        <AppShell
          header={<DashboardHeader />}
          main={<Overview />}
          assistant={(api) => (
            <AssistantPanel
              onAnswerDone={api.notifyAnswer}
              onFocusDashboard={api.showMain}
              headerAction={api.headerAction}
            />
          )}
          alerts={
            // The dashboard says once when the data fails; the panel stays quiet.
            <DatasetGate fallback={null}>
              <Suspense fallback={<AlertsPanelSkeleton />}>
                <AlertsView />
              </Suspense>
            </DatasetGate>
          }
        />
      </CurrencyFormats>
    </Suspense>
  );
}
