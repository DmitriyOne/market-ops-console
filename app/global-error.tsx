'use client';

// Last resort when the root layout fails: no providers exist here, so the
// English dictionary is imported directly (not via the config barrel, so a
// failing env or i18n module cannot take this page down too).
import { useEffect } from 'react';

import en from '@/shared/config/i18n/messages/en.json';
// Direct module import, not the @/shared/lib barrel, for the same reason.
import { logError } from '@/shared/lib/errors';

type Props = { error: Error & { digest?: string }; reset: () => void };

export default function GlobalError({ error, reset }: Props) {
  useEffect(() => {
    logError(error, { scope: 'ui', digest: error.digest, boundary: 'global' });
  }, [error]);
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
