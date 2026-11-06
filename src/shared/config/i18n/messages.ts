import type { AppLocale } from './routing';

export type MessagesFile = 'en' | 'de' | 'ru';

/** en-GB and en-US share one dictionary; they differ only in formatting. */
export function messagesFileFor(locale: AppLocale): MessagesFile {
  return locale.startsWith('de') ? 'de' : locale.startsWith('ru') ? 'ru' : 'en';
}
