import { notFound } from 'next/navigation';
import * as rootParams from 'next/root-params';
import { hasLocale } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';

import { formats } from './formats';
import { messagesFileFor } from './messages';
import de from './messages/de.json';
import en from './messages/en.json';
import ru from './messages/ru.json';
import { routing } from './routing';

const MESSAGES = { en, de, ru };

/** Locale from the `[locale]` root param; unknown values render the 404 page. */
export async function resolveRequestConfig() {
  const locale: unknown = await rootParams.locale();
  if (!hasLocale(routing.locales, locale)) notFound();
  return { locale, messages: MESSAGES[messagesFileFor(locale)], formats };
}

export default getRequestConfig(resolveRequestConfig);
