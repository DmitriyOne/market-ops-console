import type { formats } from './formats';
import type en from './messages/en.json';
import type { AppLocale } from './routing';

// Typed keys and formats: a missing or mistyped key fails `pnpm typecheck`.
declare module 'next-intl' {
  interface AppConfig {
    Locale: AppLocale;
    Messages: typeof en;
    Formats: typeof formats;
  }
}
