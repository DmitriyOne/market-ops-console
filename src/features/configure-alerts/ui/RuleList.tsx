'use client';

import {
  CircleAlertIcon,
  LoaderCircleIcon,
  PencilIcon,
  RotateCcwIcon,
  Trash2Icon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { type ReactNode, useEffect, useRef, useState } from 'react';

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
};

/** Where focus goes once a Retry or a Dismiss has removed the button it was on. */
const LIST = 'list';

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
}: RuleListProps) {
  const t = useTranslations('alerts');
  const text = useRuleText(ds);
  const root = useRef<HTMLDivElement>(null);
  const [focusTo, setFocusTo] = useState<string | null>(null);

  // After the render that removed the button focus was on.
  useEffect(() => {
    if (focusTo === null) return;
    const el =
      focusTo === LIST
        ? root.current
        : Array.from(root.current?.querySelectorAll<HTMLElement>('[data-rule-id]') ?? []).find(
            (row) => row.dataset.ruleId === focusTo,
          );
    if (el) {
      el.focus();
      setFocusTo(null);
    }
  }, [focusTo, rules, failed]);

  const retry = (f: FailedWrite) => {
    onRetry(f);
    // Only an edit keeps its row: a retried delete takes it away, and a new
    // rule's row is replaced once the server gives it its id.
    setFocusTo(f.kind === 'update' ? f.target : LIST);
  };
  const dismiss = (f: FailedWrite) => {
    onDismiss(f);
    setFocusTo(f.kind === 'create' ? LIST : f.target);
  };
  const failedFor = new Map(failed.filter((f) => f.kind !== 'create').map((f) => [f.target, f]));
  const created = failed.filter((f) => f.kind === 'create');

  return (
    <div ref={root} tabIndex={-1} className="flex flex-col gap-3 outline-none">
      {created.map((f) => (
        <FailedLine key={f.id} failed={f} onRetry={retry} onDismiss={dismiss}>
          {t('failed.create', { name: f.name, reason: f.reason })}
        </FailedLine>
      ))}
      {rules.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('list.empty')}</p>
      ) : (
        <ul aria-label={t('list.label')} className="flex flex-col">
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
                  'flex flex-col gap-2 border-t border-border py-3 transition-opacity outline-none first:border-t-0 focus-visible:ring-3 focus-visible:ring-ring/50',
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
                      <span aria-hidden>·</span>
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
                  <FailedLine failed={failure} onRetry={retry} onDismiss={dismiss}>
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
  children: ReactNode;
};

/**
 * What failed, with Retry and Dismiss. Not a live region: the toast already
 * announced it; this is the same choice where the keyboard can reach it.
 */
function FailedLine({ failed, onRetry, onDismiss, children }: FailedLineProps) {
  const t = useTranslations('alerts.failed');
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border border-destructive/40 px-3 py-1 text-sm">
      <CircleAlertIcon aria-hidden className="size-4 shrink-0 text-destructive" />
      <p className="min-w-0 flex-1 break-words">{children}</p>
      <div className="flex gap-1">
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
