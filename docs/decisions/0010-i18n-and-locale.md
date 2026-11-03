# 0010. Internationalisation and locale

**Context.** The brief asks for currencies, large numbers, percentages and dates formatted for a multi-market audience. The owner also wants the UI translated. Locales: `en-GB` (default), `en-US`, `de-DE`, `ru-RU`. Pattern follows the owner's ministry-app (`shared/config/i18n`, next-intl without i18n routing, typed keys).

**Decision.**
- **next-intl 4**, no i18n routing (no `/[locale]/` segment). `createNextIntlPlugin('./src/shared/config/i18n/request.ts')` in `next.config.ts`.
- **Locale in a cookie** (`locale`). `request.ts` reads it with `cookies()`, validates against the supported list, falls back to `en-GB`, and loads `messages/<lang>.json`. The cookie is written by a Server Action in `features/switch-locale/api`; the switcher UI lives in `features/switch-locale/ui`.
- **Files** in `src/shared/config/i18n/`: `locale.ts` (supported locales, default, type), `request.ts`, `formats.ts` (global formats), `types.ts` (`AppConfig` augmentation: `Locale`, `Messages`, `Formats` → keys and format names checked by `tsc`), `messages/{en,de,ru}.json`.
- **Formatting through next-intl only** (`useFormatter` / `getFormatter`, `createFormatter` outside React): global formats `currency`, `compact` (1.2M), `percent`, `signedPercent`, `period` (month/year). One source of truth for every number on screen, server and client. No ad-hoc `Intl.NumberFormat` calls.
- **Currency is data, locale is presentation**: amounts stay USD (`meta.currency`); the locale changes separators and symbols placement only, never converts.
- **No string literals in UI**: all visible text, `aria-label`, `alt`, `title`, `placeholder` and zod error messages come from messages.

**Out of scope.** Assistant answers and market/product names come from `data/` and stay English; the chat labels them as such.

**Alternatives.** `Intl` only, no translations (smaller, but owner wants translated UI). react-i18next (no App Router/RSC integration). Locale in URL (locale is a personal setting, not part of a shared view).

**Consequences.** +1 dependency, three message files to keep in sync (typed keys catch missing ones in `en`; `de`/`ru` checked by a small test). Pages read the locale on the server, so the cookie makes them dynamic; acceptable for this app.
