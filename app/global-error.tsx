'use client';

// Last resort when the root layout fails: no providers exist here, so the
// English dictionary is imported directly (not via the config barrel, so a
// failing env or i18n module cannot take this page down too).
import en from '@/shared/config/i18n/messages/en.json';

type Props = { error: Error & { digest?: string }; reset: () => void };

export default function GlobalError({ reset }: Props) {
  return (
    <html lang="en-GB">
      <body>
        <main>
          <h1>{en.errorPage.title}</h1>
          <p>{en.errorPage.body}</p>
          <button type="button" onClick={reset}>
            {en.errors.retry}
          </button>
        </main>
      </body>
    </html>
  );
}
