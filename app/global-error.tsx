'use client';

import '@/app/styles/globals.css';

// Last resort when the root layout fails: no providers exist here. Everything
// is imported as a module, never through a barrel (`@/shared/config`,
// `@/shared/lib`, `@/shared/ui`), so a failing env or i18n module cannot take
// this page down too. The screen is drawn here, not in src/pages, because a
// page may only use those barrels (Steiger).
import { ThemeProvider } from '@wrksz/themes/next';
import { usePathname } from 'next/navigation';
import { createTranslator } from 'next-intl';
import { useEffect } from 'react';

import { fontVariables } from '@/app/fonts';
import { dashboardPath, localeFromPath } from '@/shared/config/i18n/locale-from-path';
import { messagesFileFor } from '@/shared/config/i18n/messages';
import de from '@/shared/config/i18n/messages/de.json';
import en from '@/shared/config/i18n/messages/en.json';
import ru from '@/shared/config/i18n/messages/ru.json';
import { logError } from '@/shared/lib/errors';
import { Button } from '@/shared/ui/button';
import { StatusScreen } from '@/shared/ui/status-screen';

const MESSAGES = { en, de, ru };

type Props = { error: Error & { digest?: string }; reset: () => void };

export default function GlobalError({ error, reset }: Props) {
  const locale = localeFromPath(usePathname());
  const t = createTranslator({ locale, messages: MESSAGES[messagesFileFor(locale)] });
  useEffect(() => {
    logError(error, { scope: 'ui', digest: error.digest, boundary: 'global' });
  }, [error]);
  const appName = t('common.appName');
  const title = t('errorPage.title');
  return (
    <html lang={locale} className={fontVariables} suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <title>{t('common.titleTemplate', { page: title, appName })}</title>
          <StatusScreen
            code={500}
            appName={appName}
            skipLabel={t('common.skipToContent')}
            title={title}
            body={t('errorPage.body')}
            detail={
              error.digest ? (
                <p className="font-mono text-sm text-muted-foreground">
                  {t('errorPage.errorId', { id: error.digest })}
                </p>
              ) : null
            }
          >
            <Button size="lg" className="h-11 px-5" onClick={reset}>
              {t('errors.retry')}
            </Button>
            <Button asChild variant="outline" size="lg" className="h-11 px-5">
              {/* A plain link: next-intl's Link needs the provider that failed. */}
              <a href={dashboardPath(locale)}>{t('errorPage.home')}</a>
            </Button>
          </StatusScreen>
        </ThemeProvider>
      </body>
    </html>
  );
}
