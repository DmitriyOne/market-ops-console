'use client';

import '@/app/styles/globals.css';

// Last resort when the root layout fails: no providers exist here. The
// dictionaries, routing and logger are imported as modules, not through the
// config and lib barrels, so a failing env or i18n module cannot take this
// page down too.
import { ThemeProvider } from '@wrksz/themes/next';
import { usePathname } from 'next/navigation';
import { hasLocale } from 'next-intl';
import { useEffect } from 'react';

import { fontVariables } from '@/app/fonts';
import { GlobalErrorPage } from '@/pages/global-error';
import { messagesFileFor } from '@/shared/config/i18n/messages';
import de from '@/shared/config/i18n/messages/de.json';
import en from '@/shared/config/i18n/messages/en.json';
import ru from '@/shared/config/i18n/messages/ru.json';
import { type AppLocale, routing } from '@/shared/config/i18n/routing';
import { logError } from '@/shared/lib/errors';

const MESSAGES = { en, de, ru };

/** The locale from the address's first segment; the default one has none. */
function localeFromPath(path: string | null): AppLocale {
  const first = path?.split('/')[1] ?? '';
  return hasLocale(routing.locales, first) ? first : routing.defaultLocale;
}

type Props = { error: Error & { digest?: string }; reset: () => void };

export default function GlobalError({ error, reset }: Props) {
  const locale = localeFromPath(usePathname());
  useEffect(() => {
    logError(error, { scope: 'ui', digest: error.digest, boundary: 'global' });
  }, [error]);
  return (
    <html lang={locale} className={fontVariables} suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <GlobalErrorPage
            digest={error.digest}
            reset={reset}
            locale={locale}
            messages={MESSAGES[messagesFileFor(locale)]}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
