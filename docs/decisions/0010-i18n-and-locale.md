# 0010. Internationalisation and locale

**Context.** The brief asks for currencies, large numbers, percentages and dates formatted for a multi-market audience. The owner wants the UI translated and **pages statically rendered**. Locales: `en-GB` (default), `en-US`, `de-DE`, `ru-RU`. Conventions follow the owner's ministry-app (`shared/config/i18n`, typed keys, no literals in markup).

**Decision.**
- **next-intl 4 with locale-based routing, `localePrefix: 'as-needed'`**: `/dashboard` = `en-GB`, `/de-DE/dashboard`, `/en-US/dashboard`, `/ru-RU/dashboard`.
- **Static rendering**: routes live under `app/[locale]/`; `generateStaticParams` in `app/[locale]/layout.tsx` returns all locales, so every page is prebuilt in 4 versions. `request.ts` reads the locale from `next/root-params` (default in Next 16.3+; `setRequestLocale` is legacy and not used) and validates it with `hasLocale`, else `notFound()`.
- **`proxy.ts`** (Next 16 name for middleware) = `createMiddleware(routing)`: locale negotiation (prefix → `NEXT_LOCALE` cookie → `Accept-Language` → default) and redirects. Matcher excludes `api`, `_next`, `_vercel`, files with a dot and the preview images (`…/opengraph-image/…`, 0.13.0, so the default locale's image is not redirected; ADR 0018).
- **Files** in `src/shared/config/i18n/`: `routing.ts` (`defineRouting`: locales, default, prefix, cookie `maxAge` 1 year), `navigation.ts` (`createNavigation(routing)`: locale-aware `Link`, `useRouter`, `usePathname`), `request.ts`, `formats.ts`, `types.ts` (`AppConfig`: `Locale`, `Messages`, `Formats` → keys and format names checked by `tsc`), `messages/{en,de,ru}.json`. `en-GB` and `en-US` share `en.json`; they differ only in formats.
- **Locale switcher** in `features/switch-locale`: `router.replace` from `navigation.ts` with the target locale, **keeping the current search params** (the shareable dashboard state).
- **Formatting only through next-intl** global formats (numbers: `currency`, `wholeCurrency`, `compactCurrency`, `signedCompactCurrency`, `thresholdCurrency`, `compact`, `integer`, `rate`, `percent`, `signedPercent`, `signedDecimal`, `wholePercent`, `signedWholePercent`, `thresholdPercent`, `signedThresholdPercent`; dates: `period`, `periodShort`, `day`, `month`, `year`) via `useFormatter` / `getFormatter` / `createFormatter`. No ad-hoc `Intl.*`. Amounts arrive in USD (`meta.currency`) and show in the chosen currency (0.12.0, ADR 0017: `formatsFor(currency)`); locale changes presentation only.
- **Joining and titles (0.13.0):** label parts are joined with the dictionary's `common.separator` (`useJoinParts`), lists of names with `format.list` (`conjunction`: CLDR's `unit` list has no separator in Russian), anything else as a message with placeholders (`common.after`, `common.srAfter`, …); page titles follow `common.titleTemplate` (ADR 0018). Lint enforces both (ADR 0011).
- **No string literals in markup**, enforced by `i18next/no-literal-string` (ADR 0011).

**Out of scope.** Assistant answers and market/product names come from `data/` and stay English; the chat labels them as such.

**Alternatives.**
- Cookie only, no routing: simplest, but `cookies()` makes every page dynamic.
- `localePrefix: 'never'`: static with clean URLs, but a shared link opens in the recipient's language and alternate links are disabled. Owner chose `as-needed` so the locale is part of the link.

**Consequences.**
- +1 dependency; three message files kept in sync (typed keys catch missing keys in `en`; `de`/`ru` completeness checked by a test).
- Static HTML is built without search params. URL state (nuqs) is read on the client, so URL-dependent widgets render inside `Suspense` with a skeleton to avoid flashing the default view on shared links.
- Root `app/` contains `[locale]/` and `api/`; `proxy.ts` sits next to it.
- Unknown paths: with `as-needed`, the proxy treats an unknown prefix as a path under the default (or negotiated) locale, e.g. `/xx/dashboard` → `/en-GB/xx/dashboard`. The `app/[locale]/[...rest]` catch-all turns it into a 404. Because the root layout sits in a dynamic segment, Next 16 serves that 404 as an error shell whose translated text renders after hydration; the experimental `globalNotFound` flag would change this. Owner decision (2026-11-03): do not enable experimental flags; the status code is 404 and the text appears after hydration.
- Place names (2026-11-06, found by the production check): region and market names follow the page's language through the dataset's `select` (`useDatasetSelect`, with the currency), from `places` in the messages. Country names were generated once from `Intl.DisplayNames` and are kept as text, not computed at run time: Node's and the browser's ICU can differ, which would break hydration. Products are brands and keep their names; the AI's answers stay English (fixtures), so a citation label may name "Germany" on a German page. One word per idea: the forecast is Plan / План in German and Russian.
