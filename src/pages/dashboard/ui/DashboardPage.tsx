'use client';

import { Suspense } from 'react';

import { DatasetGate } from '@/entities/performance';
import { AlertsPanelSkeleton } from '@/features/configure-alerts';
import { AlertsView } from '@/widgets/alerts-panel';
import { AppShell, AppShellFallback } from '@/widgets/app-shell';
import { AssistantPanel, AssistantPanelSkeleton } from '@/widgets/assistant-panel';
import { DashboardHeader, DashboardHeaderSkeleton } from '@/widgets/dashboard-header';

import { Overview, OverviewSkeleton } from './Overview';

export function DashboardPage() {
  return (
    // The shell reads the URL (tab, focus), which static HTML does not have:
    // the static page shows skeletons in the real shape, the view joins on hydration.
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
    </Suspense>
  );
}
