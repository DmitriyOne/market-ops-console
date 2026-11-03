'use client';

import { useTranslations } from 'next-intl';
import { useCallback } from 'react';

import { errorMessageKey } from './error-message-key';

/** `(error) => translated copy` for any caught error: the one way the UI words failures. */
export function useErrorMessage(): (error: unknown) => string {
  const t = useTranslations();
  return useCallback((error: unknown) => t(errorMessageKey(error)), [t]);
}
