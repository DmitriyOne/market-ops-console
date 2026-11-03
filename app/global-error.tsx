'use client';

// Last resort when the root layout fails: no providers exist here, so the
// English dictionary is imported directly.
import { enMessages as en } from '@/shared/config';

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
