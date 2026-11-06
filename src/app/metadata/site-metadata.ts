import type { Metadata } from 'next';
import { createTranslator } from 'next-intl';

import {
  type AppLocale,
  deMessages,
  enMessages,
  type MessagesFile,
  messagesFileFor,
  ruMessages,
  siteUrl,
} from '@/shared/config';

const MESSAGES: Record<MessagesFile, typeof enMessages> = {
  en: enMessages,
  de: deMessages,
  ru: ruMessages,
};

/** `en-GB` → `en_GB`, the form Open Graph expects. */
const ogLocale = (locale: AppLocale) => locale.replace('-', '_');

/**
 * Title, description and link preview per locale. An internal console: kept
 * out of search engines (owner, 2026-11-03; robots.txt disallows all, 0.13.0).
 * The preview image comes from `opengraph-image.tsx` next to the layout.
 */
export function siteMetadata(locale: AppLocale): Metadata {
  const t = createTranslator({ locale, messages: MESSAGES[messagesFileFor(locale)] });
  const appName = t('common.appName');
  const description = t('common.description');
  return {
    metadataBase: siteUrl(),
    applicationName: appName,
    title: { default: appName, template: t('common.titleTemplate', { page: '%s', appName }) },
    description,
    robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
    openGraph: {
      type: 'website',
      siteName: appName,
      title: appName,
      description,
      locale: ogLocale(locale),
    },
    twitter: { card: 'summary_large_image', title: appName, description },
  };
}
