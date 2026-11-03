'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import type { ReactNode } from 'react';

import { OfflineGuard } from '@/features/network-status';

import { getQueryClient } from './query-client';

/**
 * Client-side app providers. NextIntlClientProvider and ThemeProvider are
 * mounted by the (server) root layout: next-intl inherits locale, messages
 * and formats there, and @wrksz/themes builds its anti-flash script on the
 * server (ADR 0009).
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={getQueryClient()}>
      <NuqsAdapter>
        <OfflineGuard>{children}</OfflineGuard>
      </NuqsAdapter>
    </QueryClientProvider>
  );
}
