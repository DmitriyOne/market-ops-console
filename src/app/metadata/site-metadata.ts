import type { Metadata } from 'next';

import {
  type AppLocale,
  deMessages,
  enMessages,
  type MessagesFile,
  messagesFileFor,
  ruMessages,
} from '@/shared/config';

const MESSAGES: Record<MessagesFile, typeof enMessages> = {
  en: enMessages,
  de: deMessages,
  ru: ruMessages,
};

/**
 * Title and description per locale. An internal console: kept out of
 * search engines (owner decision, 2026-11-03).
 */
export function siteMetadata(locale: AppLocale): Metadata {
  const { appName, description } = MESSAGES[messagesFileFor(locale)].common;
  return {
    title: { default: appName, template: `%s · ${appName}` },
    description,
    robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
  };
}
