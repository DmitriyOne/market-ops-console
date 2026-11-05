'use client';

import { useQueryStates } from 'nuqs';
import { useCallback } from 'react';

import {
  dashboardSearchParams,
  sortParam,
  type TableColumn,
  type TableSort,
  useDashboard,
} from '@/entities/performance';

const TEXT: readonly TableColumn[] = ['market', 'region'];

/**
 * A header click: the first one sorts numbers high to low, names A to Z and
 * status worst first; the next one flips it. Cosmetic, so it replaces history.
 */
export function useTableSort(): { sort: TableSort; sortBy: (column: TableColumn) => void } {
  const { state } = useDashboard();
  const [, setParams] = useQueryStates(dashboardSearchParams, { history: 'replace' });
  const { sort } = state;
  const sortBy = useCallback(
    (column: TableColumn) => {
      const first = TEXT.includes(column) || column === 'status' ? 'asc' : 'desc';
      const dir = sort?.column === column ? (sort.dir === 'asc' ? 'desc' : 'asc') : first;
      void setParams({ sort: sortParam({ column, dir }) });
    },
    [setParams, sort],
  );
  return { sort, sortBy };
}
