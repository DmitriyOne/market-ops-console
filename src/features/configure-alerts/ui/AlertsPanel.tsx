'use client';

import { PlusIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useId, useRef, useState } from 'react';

import { useAlertRules } from '@/entities/alert-rule';
import { useDashboard, useKpiFormat } from '@/entities/performance';
import { type AlertRule, ALERTS_MAX } from '@/shared/api';
import { Button, Label, Skeleton, Switch } from '@/shared/ui';

import { newRuleValues, toFormValues } from '../model/rule-form';
import { useSimulateFailure } from '../model/simulate-failure';
import { useRuleMutations, useSavingIds } from '../model/use-rule-mutations';
import { DeleteRuleDialog } from './DeleteRuleDialog';
import { RuleForm } from './RuleForm';
import { RuleList } from './RuleList';

type View = { kind: 'list' } | { kind: 'new' } | { kind: 'edit'; rule: AlertRule };

/** Title and description for whatever frames the panel (sheet or phone tab). */
export function useAlertsHeading(): { title: string; description: string } {
  const t = useTranslations('alerts');
  const { ds } = useDashboard();
  const { period } = useKpiFormat();
  return {
    title: t('title'),
    description: t('description', { period: period(ds.meta.latestPeriod) }),
  };
}

/**
 * The alerts configurator: the rule list, or the form for one rule, and the
 * demo switch. Needs the dataset (inside Suspense); the frame gives the title.
 */
export function AlertsPanel() {
  const t = useTranslations('alerts');
  const { ds, state } = useDashboard();
  const rules = useAlertRules();
  const saving = useSavingIds();
  const { create, update, toggle, remove } = useRuleMutations();
  const [simulate, setSimulate] = useSimulateFailure();
  const [view, setView] = useState<View>({ kind: 'list' });
  const [deleting, setDeleting] = useState<AlertRule | null>(null);
  const newButton = useRef<HTMLButtonElement>(null);
  const simulateId = useId();
  const fullNoteId = useId();

  // Back from the form: focus returns to where a next rule starts.
  const focusNew = useRef(false);
  useEffect(() => {
    if (focusNew.current && view.kind === 'list') {
      focusNew.current = false;
      newButton.current?.focus();
    }
  }, [view]);
  const backToList = () => {
    focusNew.current = true;
    setView({ kind: 'list' });
  };

  const list = rules.data ?? [];
  const full = list.length >= ALERTS_MAX;

  if (view.kind !== 'list') {
    const editing = view.kind === 'edit' ? view.rule : null;
    return (
      <RuleForm
        ds={ds}
        initial={editing ? toFormValues(editing) : newRuleValues(state.selected)}
        others={list.filter((r) => r.id !== editing?.id)}
        editing={editing !== null}
        onCancel={backToList}
        onSubmit={(input) => {
          if (editing) update({ ...input, id: editing.id });
          else create(input);
          backToList();
        }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {rules.isPending ? (
        <div aria-busy className="flex flex-col gap-3">
          <span className="sr-only">{t('list.loading')}</span>
          <Skeleton aria-hidden className="h-16" />
          <Skeleton aria-hidden className="h-16" />
        </div>
      ) : rules.isError ? (
        <div role="alert" className="flex flex-col items-start gap-2">
          <p className="text-sm">{t('list.loadFailed')}</p>
          <Button
            type="button"
            variant="outline"
            className="h-11"
            onClick={() => {
              void rules.refetch();
            }}
          >
            {t('list.retry')}
          </Button>
        </div>
      ) : (
        <>
          <RuleList
            ds={ds}
            rules={list}
            saving={saving}
            onToggle={toggle}
            onEdit={(rule) => {
              setView({ kind: 'edit', rule });
            }}
            onDelete={setDeleting}
          />
          <div className="flex flex-col items-start gap-1.5">
            <Button
              ref={newButton}
              type="button"
              className="h-11"
              disabled={full}
              aria-describedby={full ? fullNoteId : undefined}
              onClick={() => {
                setView({ kind: 'new' });
              }}
            >
              <PlusIcon aria-hidden />
              {t('list.new')}
            </Button>
            {full ? (
              <p id={fullNoteId} className="text-xs text-muted-foreground">
                {t('list.full')}
              </p>
            ) : null}
          </div>
        </>
      )}

      <div className="flex items-start gap-3 rounded-lg border border-dashed border-border p-3">
        <Switch
          id={simulateId}
          checked={simulate}
          onCheckedChange={setSimulate}
          aria-describedby={`${simulateId}-hint`}
          className="mt-0.5"
        />
        <div className="flex flex-col gap-1">
          <Label htmlFor={simulateId}>{t('simulate.label')}</Label>
          <p id={`${simulateId}-hint`} className="text-xs text-muted-foreground">
            {t('simulate.hint')}
          </p>
        </div>
      </div>

      <DeleteRuleDialog
        rule={deleting}
        onClose={() => {
          setDeleting(null);
        }}
        onConfirm={remove}
      />
    </div>
  );
}
