import { useCallback } from 'react';

import type { Dataset } from '@/shared/api';
import { useJoinParts } from '@/shared/lib';

import { scopeParts } from '../model/reference';

type Scope = { regionId?: string; marketId?: string; productId?: string };

/** "Veltrix · Germany", "Europe", or null for the whole portfolio. */
export function useScopeLabel(): (ds: Dataset, scope: Scope) => string | null {
  const join = useJoinParts();
  return useCallback(
    (ds, scope) => {
      const parts = scopeParts(ds, scope);
      return parts.length > 0 ? join(parts) : null;
    },
    [join],
  );
}
