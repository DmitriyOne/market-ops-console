'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useFormatter, useTranslations } from 'next-intl';
import { useId, useMemo } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';

import {
  ALERT_METRICS,
  ALERT_OPERATORS,
  ALERT_SEVERITIES,
  type AlertRule,
  type AlertRuleInput,
  type Dataset,
} from '@/shared/api';
import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
} from '@/shared/ui';

import {
  type RuleFormError,
  ruleFormSchema,
  type RuleFormValues,
  SCOPE_KINDS,
  thresholdLimits,
} from '../model/rule-form';
import { describedBy, fieldIds, FormField } from './FormField';
import { MarketsField } from './MarketsField';
import { RulePreview } from './RulePreview';

const ERROR_KEYS: readonly RuleFormError[] = [
  'nameRequired',
  'nameTooLong',
  'duplicateName',
  'thresholdRequired',
  'thresholdRange',
  'regionRequired',
  'marketsRequired',
];
const isFormError = (key: string | undefined): key is RuleFormError =>
  ERROR_KEYS.some((k) => k === key);

const TRIGGER = 'h-11 w-full';

type RuleFormProps = {
  ds: Dataset;
  initial: RuleFormValues;
  /** The other rules: their names are taken. */
  others: readonly AlertRule[];
  editing: boolean;
  onSubmit: (input: AlertRuleInput) => void;
  onCancel: () => void;
};

/**
 * The rule configurator (brief: a non-trivial, schema-validated form).
 * Same checks as the server, translated, shown after a field is left or on
 * save; the preview follows every change.
 */
export function RuleForm({ ds, initial, others, editing, onSubmit, onCancel }: RuleFormProps) {
  const t = useTranslations('alerts');
  const format = useFormatter();
  const base = useId();
  const id = (name: string) => `${base}-${name}`;
  const schema = useMemo(() => ruleFormSchema(others), [others]);
  const form = useForm<RuleFormValues, unknown, AlertRuleInput>({
    resolver: zodResolver(schema),
    defaultValues: initial,
    mode: 'onTouched',
  });
  const { control, register, formState } = form;
  const [metric, operator, threshold, scopeKind, regionId, marketIds] = useWatch({
    control,
    name: ['metric', 'operator', 'threshold', 'scopeKind', 'regionId', 'marketIds'],
  });
  const watched = { metric, operator, threshold, scopeKind, regionId, marketIds };

  const message = (field: keyof RuleFormValues): string | null => {
    const key = formState.errors[field]?.message;
    if (!isFormError(key)) return null;
    if (key === 'thresholdRange') {
      const { min, max } = thresholdLimits(metric);
      return max === null
        ? t('form.errors.thresholdMin', { min: format.number(min) })
        : t('form.errors.thresholdRange', { min: format.number(min), max: format.number(max) });
    }
    return t(`form.errors.${key}`);
  };

  const nameError = message('name');
  const thresholdError = message('threshold');
  const regionError = message('regionId');
  const unit = metric === 'revenue' ? t('form.unitRevenue') : t('form.unitPercent');

  return (
    <form
      noValidate
      aria-labelledby={id('title')}
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        void form.handleSubmit(onSubmit)(event);
      }}
    >
      <h3 id={id('title')} className="text-base font-semibold">
        {editing ? t('form.editTitle') : t('form.newTitle')}
      </h3>

      <FormField id={id('name')} label={t('form.name')} error={nameError}>
        <Input
          id={fieldIds(id('name')).control}
          autoComplete="off"
          className="h-11"
          aria-invalid={nameError ? true : undefined}
          aria-describedby={describedBy(id('name'), false, nameError)}
          {...register('name')}
        />
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField id={id('metric')} label={t('form.metric')} error={null}>
          <Controller
            control={control}
            name="metric"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger
                  ref={field.ref}
                  id={fieldIds(id('metric')).control}
                  className={TRIGGER}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALERT_METRICS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {t(`metric.${m}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </FormField>
        <FormField id={id('operator')} label={t('form.operator')} error={null}>
          <Controller
            control={control}
            name="operator"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger
                  ref={field.ref}
                  id={fieldIds(id('operator')).control}
                  className={TRIGGER}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALERT_OPERATORS.map((o) => (
                    <SelectItem key={o} value={o}>
                      {t(`operator.${o}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </FormField>
      </div>

      <FormField
        id={id('threshold')}
        label={`${t('form.threshold')}, ${unit}`}
        hint={metric === 'revenue' ? t('form.revenueHint') : undefined}
        error={thresholdError}
      >
        <Input
          id={fieldIds(id('threshold')).control}
          inputMode="decimal"
          autoComplete="off"
          className="h-11"
          aria-invalid={thresholdError ? true : undefined}
          aria-describedby={describedBy(id('threshold'), metric === 'revenue', thresholdError)}
          {...register('threshold')}
        />
      </FormField>

      <FormField id={id('scope')} label={t('form.scope')} error={null}>
        <Controller
          control={control}
          name="scopeKind"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger ref={field.ref} id={fieldIds(id('scope')).control} className={TRIGGER}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SCOPE_KINDS.map((k) => (
                  <SelectItem key={k} value={k}>
                    {t(`form.scopeKind.${k}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </FormField>

      {scopeKind === 'region' ? (
        <FormField id={id('region')} label={t('form.region')} error={regionError}>
          <Controller
            control={control}
            name="regionId"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger
                  ref={field.ref}
                  id={fieldIds(id('region')).control}
                  className={TRIGGER}
                  aria-invalid={regionError ? true : undefined}
                  aria-describedby={describedBy(id('region'), false, regionError)}
                >
                  <SelectValue placeholder={t('form.regionPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {ds.regions.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </FormField>
      ) : null}

      {scopeKind === 'markets' ? (
        <Controller
          control={control}
          name="marketIds"
          render={({ field }) => (
            <MarketsField
              ref={field.ref}
              id={id('markets')}
              ds={ds}
              value={field.value}
              onChange={field.onChange}
              error={message('marketIds')}
            />
          )}
        />
      ) : null}

      <div className="grid grid-cols-2 items-end gap-3">
        <FormField id={id('severity')} label={t('form.severity')} error={null}>
          <Controller
            control={control}
            name="severity"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger
                  ref={field.ref}
                  id={fieldIds(id('severity')).control}
                  className={TRIGGER}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALERT_SEVERITIES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {t(`severity.${s}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </FormField>
        <Controller
          control={control}
          name="enabled"
          render={({ field }) => (
            <div className="flex min-h-11 items-center gap-2">
              <Switch id={id('enabled')} checked={field.value} onCheckedChange={field.onChange} />
              <Label htmlFor={id('enabled')}>{t('form.enabled')}</Label>
            </div>
          )}
        />
      </div>

      <RulePreview ds={ds} values={watched} />

      <div className="flex flex-wrap gap-2">
        <Button type="submit" className="h-11">
          {t('form.save')}
        </Button>
        <Button type="button" variant="outline" className="h-11" onClick={onCancel}>
          {t('form.cancel')}
        </Button>
      </div>
    </form>
  );
}
