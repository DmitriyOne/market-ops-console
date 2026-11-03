'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import type { ReactNode } from 'react';

import { OfflineGuard } from '@/features/network-status';

import { getQueryClient } from './query-client';

/**
 * next-themes renders an inline <script> that sets the theme class before
 * paint. It runs from the server HTML; when React renders it again in the
 * browser, React 19 warns about a script tag. Marking it non-executable on
 * the client silences that without changing behaviour (next-themes 0.4.6
 * has no fix).
 */
const THEME_SCRIPT_PROPS = {
  type: typeof window === 'undefined' ? 'text/javascript' : 'text/plain',
};

/**
 * Client-side app providers. NextIntlClientProvider is mounted by the
 * (server) root layout so it inherits locale, messages and formats.
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      scriptProps={THEME_SCRIPT_PROPS}
    >
      <QueryClientProvider client={getQueryClient()}>
        <NuqsAdapter>
          <OfflineGuard>{children}</OfflineGuard>
        </NuqsAdapter>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
