'use client';

import { useQuery } from '@tanstack/react-query';
import { useLocale } from 'next-intl';
import { useMemo } from 'react';

import type { AlertRule, Dataset } from '@/shared/api';

import { alertsQueryOptions } from '../api/alerts-query';
import { type AlertFlags, evaluateRules, NO_FLAGS } from './evaluate';

/** The user's rules; never suspends, so a slow or failed list hides only the bells. */
export function useAlertRules() {
  return useQuery(alertsQueryOptions(useLocale()));
}

/** What the rules flag now; nothing until they load or when they fail. */
export function useAlertFlags(ds: Dataset): AlertFlags {
  const { data } = useAlertRules();
  return useMemo(() => (data ? evaluateRules(ds, data) : NO_FLAGS), [ds, data]);
}

export type { AlertRule };
