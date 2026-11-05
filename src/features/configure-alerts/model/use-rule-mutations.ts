'use client';

import {
  type QueryClient,
  useMutation,
  useMutationState,
  useQueryClient,
} from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useCallback, useMemo } from 'react';

import { ALERTS_QUERY_KEY, createRule, deleteRule, updateRule } from '@/entities/alert-rule';
import {
  ALERT_ERROR_CODES,
  type AlertErrorCode,
  type AlertRule,
  type AlertRuleInput,
  HttpError,
  useErrorMessage,
} from '@/shared/api';
import { toast } from '@/shared/ui';

import { takeSimulatedFailure } from './simulate-failure';

const WRITE_KEY = ['alerts', 'write'] as const;

type CreateVars = { kind: 'create'; input: AlertRuleInput; tempId: string };
type UpdateVars = { kind: 'update'; rule: AlertRule; previous: AlertRule };
type RemoveVars = { kind: 'remove'; rule: AlertRule; index: number };
type WriteVars = CreateVars | UpdateVars | RemoveVars;

const isCode = (code: string | undefined): code is AlertErrorCode =>
  ALERT_ERROR_CODES.some((c) => c === code);

function rules(client: QueryClient): AlertRule[] {
  return client.getQueryData<AlertRule[]>(ALERTS_QUERY_KEY) ?? [];
}

function setRules(client: QueryClient, update: (list: AlertRule[]) => AlertRule[]): void {
  client.setQueryData<AlertRule[]>(ALERTS_QUERY_KEY, (list) => update(list ?? []));
}

/** The optimistic change, applied before the server answers. */
function apply(client: QueryClient, vars: WriteVars): void {
  if (vars.kind === 'create') {
    setRules(client, (list) => [...list, { ...vars.input, id: vars.tempId }]);
  } else if (vars.kind === 'update') {
    setRules(client, (list) => list.map((r) => (r.id === vars.rule.id ? vars.rule : r)));
  } else {
    setRules(client, (list) => list.filter((r) => r.id !== vars.rule.id));
  }
}

/**
 * Undo exactly this write, leaving any other write made since in place
 * (a whole-list snapshot would also undo those).
 */
function revert(client: QueryClient, vars: WriteVars): void {
  if (vars.kind === 'create') {
    setRules(client, (list) => list.filter((r) => r.id !== vars.tempId));
  } else if (vars.kind === 'update') {
    setRules(client, (list) => list.map((r) => (r.id === vars.previous.id ? vars.previous : r)));
  } else {
    setRules(client, (list) =>
      list.some((r) => r.id === vars.rule.id)
        ? list
        : [...list.slice(0, vars.index), vars.rule, ...list.slice(vars.index)],
    );
  }
}

async function send(vars: WriteVars): Promise<AlertRule | null> {
  const options = { simulateFailure: takeSimulatedFailure() };
  if (vars.kind === 'create') return createRule(vars.input, options);
  if (vars.kind === 'update') {
    const { id, ...input } = vars.rule;
    return updateRule(id, input, options);
  }
  await deleteRule(vars.rule.id, options);
  return null;
}

/**
 * Rule writes with an optimistic update (spec §9): the list changes at once,
 * a failure puts that one rule back and says so with Retry; the list is
 * refetched once no write is left in flight.
 */
export function useRuleMutations() {
  const client = useQueryClient();
  const t = useTranslations('alerts');
  const errorMessage = useErrorMessage();

  const reason = useCallback(
    (error: unknown) => {
      if (error instanceof HttpError && isCode(error.code)) return t(`errors.${error.code}`);
      return errorMessage(error) ?? '';
    },
    [errorMessage, t],
  );

  const mutation = useMutation({
    mutationKey: WRITE_KEY,
    mutationFn: send,
    onMutate: async (vars) => {
      // A list arriving now would overwrite the optimistic change.
      await client.cancelQueries({ queryKey: ALERTS_QUERY_KEY });
      apply(client, vars);
    },
    onSuccess: (saved, vars) => {
      if (vars.kind === 'create' && saved) {
        setRules(client, (list) => list.map((r) => (r.id === vars.tempId ? saved : r)));
      }
    },
    onError: (error, vars) => {
      revert(client, vars);
      toast.error(t('rollback', { reason: reason(error) }), {
        label: t('retry'),
        onClick: () => {
          mutation.mutate(vars);
        },
      });
    },
    onSettled: () => {
      // This write still counts as running here.
      if (client.isMutating({ mutationKey: WRITE_KEY }) === 1) {
        void client.invalidateQueries({ queryKey: ALERTS_QUERY_KEY });
      }
    },
  });
  const { mutate } = mutation;

  return useMemo(
    () => ({
      create: (input: AlertRuleInput) => {
        mutate({ kind: 'create', input, tempId: `saving-${crypto.randomUUID()}` });
      },
      update: (rule: AlertRule) => {
        const previous = rules(client).find((r) => r.id === rule.id);
        if (previous) mutate({ kind: 'update', rule, previous });
      },
      toggle: (rule: AlertRule) => {
        mutate({ kind: 'update', rule: { ...rule, enabled: !rule.enabled }, previous: rule });
      },
      remove: (rule: AlertRule) => {
        const index = rules(client).findIndex((r) => r.id === rule.id);
        if (index >= 0) mutate({ kind: 'remove', rule, index });
      },
    }),
    [client, mutate],
  );
}

/** Ids of rules with a write in flight, shown as "Saving…". */
export function useSavingIds(): ReadonlySet<string> {
  const pending = useMutationState({
    filters: { mutationKey: WRITE_KEY, status: 'pending' },
    select: (m) => m.state.variables,
  });
  return useMemo(() => {
    const ids = new Set<string>();
    for (const vars of pending) {
      if (!isWriteVars(vars)) continue;
      ids.add(vars.kind === 'create' ? vars.tempId : vars.rule.id);
    }
    return ids;
  }, [pending]);
}

function isWriteVars(value: unknown): value is WriteVars {
  return typeof value === 'object' && value !== null && 'kind' in value;
}
