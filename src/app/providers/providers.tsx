'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import type { ReactNode } from 'react';

import { getQueryClient } from './query-client';

/**
 * Client-side app providers. NextIntlClientProvider is mounted by the
 * (server) root layout so it inherits locale, messages and formats.
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={getQueryClient()}>
        <NuqsAdapter>{children}</NuqsAdapter>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
