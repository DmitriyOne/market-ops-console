'use client';

import { ArrowLeftIcon, PlusIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { type ReactNode, useEffect, useId, useRef, useState } from 'react';

import { useAlertFlags, useAlertRules } from '@/entities/alert-rule';
import { useDashboard, useKpiFormat } from '@/entities/performance';
import { type AlertRule, ALERTS_MAX } from '@/shared/api';
import { Button, Label, Skeleton, Switch, ToggleGroup, ToggleGroupItem } from '@/shared/ui';

import { newRuleValues, toFormValues } from '../model/rule-form';
import { useSimulateFailure } from '../model/simulate-failure';
import { useRuleMutations, useSavingIds } from '../model/use-rule-mutations';
import { DeleteRuleDialog } from './DeleteRuleDialog';
import { RuleForm } from './RuleForm';
import { RuleList } from './RuleList';

export const ALERT_TABS = ['firing', 'rules'] as const;
export type AlertTab = (typeof ALERT_TABS)[number];
const isTab = (value: string): value is AlertTab => ALERT_TABS.some((t) => t === value);

type Form = { kind: 'new' } | { kind: 'edit'; rule: AlertRule } | null;

type AlertsPanelProps = {
  /** What the rules flag now (the "Firing" tab's content). */
  firing: ReactNode;
  /** The open tab; its owner can switch it (a toast's "Show"). */
  tab: AlertTab;
  onTabChange: (tab: AlertTab) => void;
  /** After the server has a created or edited rule. */
  onSaved?: (rule: AlertRule) => void;
};

/**
 * The alerts panel: "Firing" and "Rules" tabs with New rule always in
 * reach, and the form for one rule over the whole panel (owner,
 * 2026-11-05). Needs the dataset (inside Suspense); the frame (desktop
 * sheet or phone tab) gives the title.
 */
export function AlertsPanel({ firing, tab, onTabChange, onSaved }: AlertsPanelProps) {
  const t = useTranslations('alerts');
  const { ds, state } = useDashboard();
  const { period } = useKpiFormat();
  const rules = useAlertRules();
  const flags = useAlertFlags(ds);
  const saving = useSavingIds();
  const { create, update, toggle, remove } = useRuleMutations();
  const [simulate, setSimulate] = useSimulateFailure();
  const [form, setForm] = useState<Form>(null);
  const [deleting, setDeleting] = useState<AlertRule | null>(null);
  const newButton = useRef<HTMLButtonElement>(null);
  const simulateId = useId();
  const fullNoteId = useId();
  const contentId = useId();

  // Back from the form: focus returns to New rule, where the next one starts.
  const focusNew = useRef(false);
  useEffect(() => {
    if (focusNew.current && form === null) {
      focusNew.current = false;
      newButton.current?.focus();
    }
  }, [form]);
  const closeForm = () => {
    focusNew.current = true;
    setForm(null);
  };

  const list = rules.data ?? [];
  const full = list.length >= ALERTS_MAX;

  if (form) {
    const editing = form.kind === 'edit' ? form.rule : null;
    return (
      <div className="flex flex-col gap-3">
        <Button type="button" variant="ghost" className="h-11 self-start" onClick={closeForm}>
          <ArrowLeftIcon aria-hidden />
          {t('form.back')}
        </Button>
        <RuleForm
          ds={ds}
          initial={editing ? toFormValues(editing) : newRuleValues(state.selected)}
          others={list.filter((r) => r.id !== editing?.id)}
          editing={editing !== null}
          onCancel={closeForm}
          onSubmit={(input) => {
            if (editing) update({ ...input, id: editing.id }, onSaved);
            else create(input, onSaved);
            // The saved rule shows in the list with "Saving…".
            onTabChange('rules');
            closeForm();
          }}
        />
      </div>
    );
  }

  // The counts once the list is in ("Rules · 2"), the bare names before.
  const tabLabel = (tab: AlertTab, n: number) =>
    rules.data ? t('tabs.withCount', { tab: t(`tabs.${tab}`), count: n }) : t(`tabs.${tab}`);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        {t('description', { period: period(ds.meta.latestPeriod) })}
      </p>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <ToggleGroup
          type="single"
          value={tab}
          onValueChange={(next) => {
            if (isTab(next)) onTabChange(next);
          }}
          aria-label={t('tabs.label')}
          aria-controls={contentId}
          spacing={1}
          className="rounded-xl bg-muted p-1"
        >
          {ALERT_TABS.map((v) => (
            <ToggleGroupItem
              key={v}
              value={v}
              className="min-h-11 px-3 hover:bg-card/60 data-[state=on]:bg-card data-[state=on]:shadow-sm"
            >
              {tabLabel(v, v === 'firing' ? flags.count : list.length)}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <Button
          ref={newButton}
          type="button"
          className="h-11"
          disabled={!rules.data || full}
          aria-describedby={full ? fullNoteId : undefined}
          onClick={() => {
            setForm({ kind: 'new' });
          }}
        >
          <PlusIcon aria-hidden />
          {t('list.new')}
        </Button>
      </div>
      {full ? (
        <p id={fullNoteId} className="text-xs text-muted-foreground">
          {t('list.full')}
        </p>
      ) : null}

      <div id={contentId} className="flex flex-col gap-4">
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
        ) : tab === 'firing' ? (
          firing
        ) : (
          <RuleList
            ds={ds}
            rules={list}
            saving={saving}
            onToggle={toggle}
            onEdit={(rule) => {
              setForm({ kind: 'edit', rule });
            }}
            onDelete={setDeleting}
          />
        )}
      </div>

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
        afterDelete={() => {
          newButton.current?.focus();
        }}
      />
    </div>
  );
}

/** Before the dataset arrives: the description line, the tabs and two rows. */
export function AlertsPanelSkeleton() {
  return (
    <div aria-hidden className="flex flex-col gap-4">
      <Skeleton className="h-4 w-3/4" />
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="h-13 w-56 rounded-xl" />
        <Skeleton className="h-11 w-32" />
      </div>
      <Skeleton className="h-16" />
      <Skeleton className="h-16" />
    </div>
  );
}
