'use client';

import { LoaderCircleIcon, PencilIcon, Trash2Icon } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { AlertMark, ruleMarkets, useRuleText } from '@/entities/alert-rule';
import type { AlertRule, Dataset } from '@/shared/api';
import { cn } from '@/shared/lib';
import { Button, Switch } from '@/shared/ui';

type RuleListProps = {
  ds: Dataset;
  rules: readonly AlertRule[];
  saving: ReadonlySet<string>;
  onToggle: (rule: AlertRule) => void;
  onEdit: (rule: AlertRule) => void;
  onDelete: (rule: AlertRule) => void;
};

/** The user's rules: what each checks, how many markets it flags now, on/off, edit, delete. */
export function RuleList({ ds, rules, saving, onToggle, onEdit, onDelete }: RuleListProps) {
  const t = useTranslations('alerts');
  const text = useRuleText(ds);

  if (rules.length === 0) {
    return <p className="text-sm text-muted-foreground">{t('list.empty')}</p>;
  }
  return (
    <ul aria-label={t('list.label')} className="flex flex-col">
      {rules.map((rule) => {
        // A rule still being written has no stable id to edit yet.
        const busy = saving.has(rule.id);
        const flagged = ruleMarkets(ds, rule).length;
        return (
          <li
            key={rule.id}
            aria-busy={busy || undefined}
            className={cn(
              'flex flex-col gap-2 border-t border-border py-3 transition-opacity first:border-t-0',
              busy && 'opacity-60',
            )}
          >
            <div className="flex items-start gap-3">
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <p className="font-semibold break-words">
                  {rule.name}
                  {busy ? (
                    <span className="ml-2 inline-flex items-center gap-1 text-xs font-normal text-muted-foreground">
                      <LoaderCircleIcon aria-hidden className="size-3.5 motion-safe:animate-spin" />
                      {t('list.saving')}
                    </span>
                  ) : null}
                </p>
                <p className="text-xs text-muted-foreground">{text.full(rule)}</p>
                <p className="flex items-center gap-1.5 text-xs">
                  <AlertMark flag={{ severity: rule.severity, rules: [rule] }} labelled={false} />
                  {t(`severity.${rule.severity}`)}
                  <span aria-hidden>·</span>
                  {rule.enabled ? t('list.flagsNow', { count: flagged }) : t('list.off')}
                </p>
              </div>
              <div className="flex min-h-11 items-center">
                {/* The hit area reaches 46 px tall: 14 px each side of the 18 px inside the border. */}
                <Switch
                  className="after:-inset-y-3.5"
                  checked={rule.enabled}
                  disabled={busy}
                  aria-label={t('list.enabled', { name: rule.name })}
                  onCheckedChange={() => {
                    onToggle(rule);
                  }}
                />
              </div>
            </div>
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
  );
}
