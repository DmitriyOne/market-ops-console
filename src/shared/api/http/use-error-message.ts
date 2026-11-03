'use client';

import { useTranslations } from 'next-intl';
import { useCallback } from 'react';

import { errorMessageKey } from './error-message-key';
import { ApiError } from './errors';

/**
 * `(error) => translated copy` for any caught error: the one way the UI words
 * failures. Returns null when the user stopped the request themselves — the
 * UI shows its "Stopped" state instead of an error.
 */
export function useErrorMessage(): (error: unknown) => string | null {
  const t = useTranslations();
  return useCallback(
    (error: unknown) =>
      error instanceof ApiError && error.kind === 'aborted' ? null : t(errorMessageKey(error)),
    [t],
  );
}
