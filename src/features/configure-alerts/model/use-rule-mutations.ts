'use client';

import {
  type Mutation,
  type QueryClient,
  useMutation,
  useMutationState,
  useQueryClient,
} from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useCallback, useMemo } from 'react';

import {
  ALERTS_QUERY_KEY,
  createRule,
  deleteRule,
  ruleInCurrency,
  ruleInUsd,
  updateRule,
  useRuleName,
} from '@/entities/alert-rule';
import {
  ALERT_ERROR_CODES,
  type AlertErrorCode,
  type AlertRule,
  type AlertRuleInput,
  HttpError,
  useErrorMessage,
} from '@/shared/api';
import { useCurrency } from '@/shared/lib';
import { toast } from '@/shared/ui';

import { takeSimulatedFailure } from './simulate-failure';

const WRITE_KEY = ['alerts', 'write'] as const;

/**
 * Runs once the server has the rule. It travels with the write (not as a
 * `mutate()` callback, which the next write would replace), so it also
 * runs after a Retry.
 */
type OnSaved = (rule: AlertRule) => void;
type CreateVars = { kind: 'create'; input: AlertRuleInput; tempId: string; onSaved?: OnSaved };
type UpdateVars = { kind: 'update'; rule: AlertRule; previous: AlertRule; onSaved?: OnSaved };
type RemoveVars = { kind: 'remove'; rule: AlertRule; index: number };
type WriteVars = CreateVars | UpdateVars | RemoveVars;

const isCode = (code: string | undefined): code is AlertErrorCode =>
  ALERT_ERROR_CODES.some((c) => c === code);

/**
 * The API refused the write itself (a taken name, ten rules, a rule deleted
 * elsewhere): sending it again gets the same answer. Only the demo's
 * simulated failure, a server fault or the network can pass on a Retry.
 */
const isRefused = (error: unknown): error is HttpError =>
  error instanceof HttpError && isCode(error.code) && error.code !== 'simulated';

function withoutPreset(rule: AlertRule): AlertRule {
  const own = { ...rule };
  delete own.preset;
  return own;
}

/** The list as the API has it: revenue thresholds in USD. */
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

/** Why a write failed, in words: the API's code translated, else the general message. */
function useReason() {
  const t = useTranslations('alerts');
  const errorMessage = useErrorMessage();
  return useCallback(
    (error: unknown) => {
      if (error instanceof HttpError && isCode(error.code)) return t(`errors.${error.code}`);
      return errorMessage(error) ?? '';
    },
    [errorMessage, t],
  );
}

const targetOf = (vars: WriteVars) => (vars.kind === 'create' ? vars.tempId : vars.rule.id);

/** One rollback toast per rule: a newer failure replaces it, Retry or Dismiss in the panel closes it. */
const toastId = (target: string) => `alert-write-${target}`;

/** The writes made for one rule (or one new rule), oldest first. */
function writesFor(client: QueryClient, target: string) {
  return client
    .getMutationCache()
    .findAll({ mutationKey: WRITE_KEY })
    .filter((m) => {
      const vars = m.state.variables;
      return isWriteVars(vars) && targetOf(vars) === target;
    });
}

/**
 * Repeat a failed write, only while it is still the rule's latest and has
 * failed: the toast's Retry and the panel's are two buttons for one action,
 * and pressing both must not send it twice.
 */
function retryWrite(
  client: QueryClient,
  mutate: (vars: WriteVars) => void,
  target: string,
  isIt: (write: Mutation) => boolean,
) {
  const last = writesFor(client, target).at(-1);
  const vars = last?.state.variables;
  if (!last || !isIt(last) || last.state.status !== 'error' || !isWriteVars(vars)) return;
  toast.dismiss(toastId(target));
  mutate(vars);
}

/**
 * Rule writes with an optimistic update (spec §9): the list changes at once,
 * a failure puts that one rule back and says so with Retry; the list is
 * refetched once no write is left in flight. Rules come in and `onSaved`
 * goes out in the chosen currency; the cache and the API get USD (ADR 0017).
 */
export function useRuleMutations() {
  const client = useQueryClient();
  const t = useTranslations('alerts');
  const reason = useReason();
  const currency = useCurrency();

  const mutation = useMutation({
    mutationKey: WRITE_KEY,
    // One write at a time: the server stores the whole list per answer, so
    // two in flight would each start from the old list and one would be
    // lost. The optimistic change (onMutate) still shows at once.
    scope: { id: 'alert-rules' },
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
      if (vars.kind !== 'remove' && saved) vars.onSaved?.(saved);
    },
    onError: (error, vars) => {
      revert(client, vars);
      // A refused write gets no Retry: the panel offers Edit instead.
      const retry = isRefused(error)
        ? undefined
        : {
            label: t('retry'),
            onClick: () => {
              // The write's own variables: the cache holds this very object.
              retryWrite(
                client,
                mutation.mutate,
                targetOf(vars),
                (m) => m.state.variables === vars,
              );
            },
          };
      toast.error(t('rollback', { reason: reason(error) }), retry, {
        id: toastId(targetOf(vars)),
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

  return useMemo(() => {
    const shown = (onSaved?: OnSaved): OnSaved | undefined =>
      onSaved &&
      ((saved) => {
        onSaved(ruleInCurrency(saved, currency));
      });
    return {
      /** `onSaved` runs once the server has the rule (the list already shows it). */
      create: (input: AlertRuleInput, onSaved?: OnSaved) => {
        mutate({
          kind: 'create',
          input: ruleInUsd(input, currency),
          tempId: `saving-${crypto.randomUUID()}`,
          onSaved: shown(onSaved),
        });
      },
      /** An edit from the form: the rule is the user's from now on, an example's preset goes. */
      update: (rule: AlertRule, onSaved?: OnSaved) => {
        const previous = rules(client).find((r) => r.id === rule.id);
        if (previous) {
          const next = withoutPreset(ruleInUsd(rule, currency, previous));
          mutate({ kind: 'update', rule: next, previous, onSaved: shown(onSaved) });
        }
      },
      // From the stored rule: only `enabled` changes.
      toggle: (rule: AlertRule) => {
        const previous = rules(client).find((r) => r.id === rule.id);
        if (previous) {
          mutate({ kind: 'update', rule: { ...previous, enabled: !previous.enabled }, previous });
        }
      },
      remove: (rule: AlertRule) => {
        const list = rules(client);
        const index = list.findIndex((r) => r.id === rule.id);
        const stored = list[index];
        if (stored) mutate({ kind: 'remove', rule: stored, index });
      },
      /** The failed write again, as it was (the same as the toast's Retry, which it closes). */
      retry: (failed: FailedWrite) => {
        retryWrite(client, mutate, failed.target, (m) => m.mutationId === failed.id);
      },
      /**
       * Stop offering Retry for this rule: every settled write for it is
       * forgotten, so an older failure does not come back in its place.
       */
      dismiss: (failed: FailedWrite) => {
        const cache = client.getMutationCache();
        for (const m of writesFor(client, failed.target)) {
          if (m.state.status !== 'pending') cache.remove(m);
        }
        toast.dismiss(toastId(failed.target));
      },
    };
  }, [client, currency, mutate]);
}

/**
 * A write that failed and was not made again since. The panel offers Retry
 * for it next to the rule, so it is in reach of the keyboard too: the toast
 * is outside the modal sheet, where focus can't go.
 */
export type FailedWrite = {
  /** The mutation's id. */
  id: number;
  kind: WriteVars['kind'];
  /** The list row it belongs to; a failed create's row is gone, a Retry brings it back under this id. */
  target: string;
  name: string;
  reason: string;
  /** False when the API refused the write: Retry would get the same answer. */
  retryable: boolean;
  /**
   * A refused new or edited rule: what it asked for, in the chosen currency,
   * for the panel's Edit. Null otherwise.
   */
  fix: { input: AlertRuleInput; nameTaken: boolean } | null;
};

/** The writes to offer Retry for: per rule, the latest write, if it failed. */
export function useFailedWrites(): readonly FailedWrite[] {
  const reason = useReason();
  const nameOf = useRuleName();
  const currency = useCurrency();
  const writes = useMutationState({
    filters: { mutationKey: WRITE_KEY },
    select: (m) => ({
      id: m.mutationId,
      status: m.state.status,
      vars: m.state.variables,
      error: m.state.error,
    }),
  });
  return useMemo(() => {
    // The cache keeps writes in the order they were made, so a later write wins.
    const latest = new Map<string, (typeof writes)[number] & { vars: WriteVars }>();
    for (const w of writes) {
      const { vars } = w;
      if (isWriteVars(vars)) latest.set(targetOf(vars), { ...w, vars });
    }
    const failed: FailedWrite[] = [];
    for (const [target, w] of latest) {
      if (w.status !== 'error') continue;
      const { vars } = w;
      const name =
        vars.kind === 'create'
          ? vars.input.name
          : nameOf(vars.kind === 'update' ? vars.previous : vars.rule);
      const refused = isRefused(w.error);
      const asked = vars.kind === 'create' ? vars.input : vars.kind === 'update' ? vars.rule : null;
      const fix =
        asked && refused
          ? {
              input: ruleInCurrency(asked, currency),
              nameTaken: w.error instanceof HttpError && w.error.code === 'duplicate_name',
            }
          : null;
      failed.push({
        id: w.id,
        kind: vars.kind,
        target,
        name,
        reason: reason(w.error),
        retryable: !refused,
        fix,
      });
    }
    return failed;
  }, [writes, reason, nameOf, currency]);
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
