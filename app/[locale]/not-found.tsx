import { getTranslations } from 'next-intl/server';

import { Link } from '@/shared/config';

export default async function NotFound() {
  const t = await getTranslations('notFound');
  const tCommon = await getTranslations('common');
  return (
    <>
      <a
        href="#main"
        className="sr-only rounded-md bg-primary px-3 py-2 text-primary-foreground focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50"
      >
        {tCommon('skipToContent')}
      </a>
      <main id="main" className="flex min-h-dvh flex-col items-start gap-3 p-6">
        <h1 className="text-xl font-semibold">{t('title')}</h1>
        <p className="text-muted-foreground">{t('body')}</p>
        <Link href="/dashboard" className="underline underline-offset-4">
          {t('home')}
        </Link>
      </main>
    </>
  );
}
