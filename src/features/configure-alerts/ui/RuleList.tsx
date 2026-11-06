'use client';

import {
  CircleAlertIcon,
  LoaderCircleIcon,
  PencilIcon,
  RotateCcwIcon,
  Trash2Icon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { type ReactNode, useEffect, useRef } from 'react';

import { AlertMark, ruleMarkets, useRuleText } from '@/entities/alert-rule';
import type { AlertRule, Dataset } from '@/shared/api';
import { cn } from '@/shared/lib';
import { Button, Switch } from '@/shared/ui';

import type { FailedWrite } from '../model/use-rule-mutations';

type RuleListProps = {
  ds: Dataset;
  rules: readonly AlertRule[];
  saving: ReadonlySet<string>;
  onToggle: (rule: AlertRule) => void;
  onEdit: (rule: AlertRule) => void;
  onDelete: (rule: AlertRule) => void;
  /** Writes that failed: Retry and Dismiss next to the rule (a new rule's above the list). */
  failed: readonly FailedWrite[];
  onRetry: (failed: FailedWrite) => void;
  onDismiss: (failed: FailedWrite) => void;
  /** A refused write (a taken name): back to the form with what it asked for. */
  onFix: (failed: FailedWrite) => void;
};

/** Where focus goes once a Retry or a Dismiss has removed the button it was on. */
const LIST = 'list';
/** A focus ring for what only takes focus from code (a row, the list). */
const FOCUS = 'rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50';

/** The user's rules: what each checks, how many markets it flags now, on/off, edit, delete. */
export function RuleList({
  ds,
  rules,
  saving,
  onToggle,
  onEdit,
  onDelete,
  failed,
  onRetry,
  onDismiss,
  onFix,
}: RuleListProps) {
  const t = useTranslations('alerts');
  const tCommon = useTranslations('common');
  const text = useRuleText(ds);
  const root = useRef<HTMLDivElement>(null);
  // A ref, not state: Retry and Dismiss change the list, which renders anyway.
  const focusTo = useRef<string | null>(null);

  // After the render that removed the button focus was on. A row that is
  // gone by then (deleted meanwhile) falls back to the list; either way the
  // request is used up, so it can't move focus later.
  useEffect(() => {
    const target = focusTo.current;
    if (target === null) return;
    focusTo.current = null;
    const rows = Array.from(root.current?.querySelectorAll<HTMLElement>('[data-rule-id]') ?? []);
    const row = rows.find((r) => r.dataset.ruleId === target);
    const list = root.current?.querySelector<HTMLElement>('[data-rule-list]');
    (row ?? list)?.focus();
  });

  const retry = (f: FailedWrite) => {
    onRetry(f);
    // Only an edit keeps its row: a retried delete takes it away, and a new
    // rule's row is replaced once the server gives it its id.
    focusTo.current = f.kind === 'update' ? f.target : LIST;
  };
  const dismiss = (f: FailedWrite) => {
    onDismiss(f);
    focusTo.current = above.includes(f) ? LIST : f.target;
  };
  const failedFor = new Map(failed.filter((f) => f.kind !== 'create').map((f) => [f.target, f]));
  // Above the list: a new rule's failure (it has no row), and one whose rule
  // is gone (deleted elsewhere: `not_found`), else it would show nowhere.
  const above = failed.filter((f) => f.kind === 'create' || !rules.some((r) => r.id === f.target));

  return (
    <div ref={root} className="flex flex-col gap-3">
      {above.map((f) => (
        <FailedLine key={f.id} failed={f} onRetry={retry} onDismiss={dismiss} onFix={onFix}>
          {/* No row to stand by: the line names the rule. */}
          {t(f.kind === 'remove' ? 'failed.remove' : 'failed.create', {
            name: f.name,
            reason: f.reason,
          })}
        </FailedLine>
      ))}
      {rules.length === 0 ? (
        <p data-rule-list tabIndex={-1} className={cn('text-sm text-muted-foreground', FOCUS)}>
          {t('list.empty')}
        </p>
      ) : (
        // Named, so focus landing here says where it is.
        <ul
          data-rule-list
          tabIndex={-1}
          aria-label={t('list.label')}
          className={cn('flex flex-col', FOCUS)}
        >
          {rules.map((rule) => {
            // A rule still being written has no stable id to edit yet.
            const busy = saving.has(rule.id);
            const flagged = ruleMarkets(ds, rule).length;
            const failure = busy ? undefined : failedFor.get(rule.id);
            return (
              <li
                key={rule.id}
                data-rule-id={rule.id}
                tabIndex={-1}
                aria-busy={busy || undefined}
                className={cn(
                  'flex flex-col gap-2 border-t border-border py-3 transition-opacity first:border-t-0',
                  FOCUS,
                  busy && 'opacity-60',
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <p className="font-semibold break-words">
                      {rule.name}
                      {busy ? (
                        <span className="ml-2 inline-flex items-center gap-1 text-xs font-normal text-muted-foreground">
                          <LoaderCircleIcon
                            aria-hidden
                            className="size-3.5 motion-safe:animate-spin"
                          />
                          {t('list.saving')}
                        </span>
                      ) : null}
                    </p>
                    <p className="text-xs text-muted-foreground">{text.full(rule)}</p>
                    <p className="flex items-center gap-1.5 text-xs">
                      <AlertMark
                        flag={{ severity: rule.severity, rules: [rule] }}
                        labelled={false}
                      />
                      {t(`severity.${rule.severity}`)}
                      <span aria-hidden>{tCommon('separatorMark')}</span>
                      {rule.enabled ? t('list.flagsNow', { count: flagged }) : t('list.off')}
                    </p>
                  </div>
                  <div className="flex min-h-11 items-center">
                    {/* The hit area reaches 46 px tall: 14 px each side of the 18 px inside the border. */}
                    {/* Busy is aria-disabled, not disabled: a disabled control
                        loses focus, and the keyboard user who switched it would
                        land on the page's start. */}
                    <Switch
                      className="after:-inset-y-3.5 aria-disabled:cursor-not-allowed"
                      checked={rule.enabled}
                      aria-disabled={busy || undefined}
                      aria-label={t('list.enabled', { name: rule.name })}
                      onCheckedChange={() => {
                        if (!busy) onToggle(rule);
                      }}
                    />
                  </div>
                </div>
                {/* After the switch, so Tab from a failed toggle lands on Retry. */}
                {failure ? (
                  <FailedLine failed={failure} onRetry={retry} onDismiss={dismiss} onFix={onFix}>
                    {t(failure.kind === 'remove' ? 'failed.remove' : 'failed.update', {
                      reason: failure.reason,
                    })}
                  </FailedLine>
                ) : null}
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-11"
                    disabled={busy}
                    aria-label={t('list.editRule', { name: rule.name })}
                    onClick={() => {
                      onEdit(rule);
                    }}
                  >
                    <PencilIcon aria-hidden />
                    {t('list.edit')}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-11 text-destructive"
                    disabled={busy}
                    aria-label={t('list.deleteRule', { name: rule.name })}
                    onClick={() => {
                      onDelete(rule);
                    }}
                  >
                    <Trash2Icon aria-hidden />
                    {t('list.delete')}
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

type FailedLineProps = {
  failed: FailedWrite;
  onRetry: (failed: FailedWrite) => void;
  onDismiss: (failed: FailedWrite) => void;
  onFix: (failed: FailedWrite) => void;
  children: ReactNode;
};

/**
 * What failed, with Retry and Dismiss; when the API refused the write
 * (Retry would get the same answer), Edit for a new or edited rule and
 * no Retry for a delete. Not a live region: the toast already
 * announced it; this is the same choice where the keyboard can reach it.
 */
function FailedLine({ failed, onRetry, onDismiss, onFix, children }: FailedLineProps) {
  const t = useTranslations('alerts.failed');
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border border-destructive/40 px-3 py-1 text-sm">
      <CircleAlertIcon aria-hidden className="size-4 shrink-0 text-destructive" />
      <p className="min-w-0 flex-1 break-words">{children}</p>
      <div className="flex gap-1">
        {failed.fix ? (
          <Button
            type="button"
            variant="outline"
            className="h-11"
            aria-label={t('fixRule', { name: failed.name })}
            onClick={() => {
              onFix(failed);
            }}
          >
            <PencilIcon aria-hidden />
            {t('fix')}
          </Button>
        ) : failed.retryable ? (
          <Button
            type="button"
            variant="outline"
            className="h-11"
            aria-label={t('retryRule', { name: failed.name })}
            onClick={() => {
              onRetry(failed);
            }}
          >
            <RotateCcwIcon aria-hidden />
            {t('retry')}
          </Button>
        ) : null}
        <Button
          type="button"
          variant="ghost"
          className="h-11"
          aria-label={t('dismissRule', { name: failed.name })}
          onClick={() => {
            onDismiss(failed);
          }}
        >
          {t('dismiss')}
        </Button>
      </div>
    </div>
  );
}
