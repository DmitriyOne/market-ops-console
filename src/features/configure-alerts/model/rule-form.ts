import { z } from 'zod';

import {
  ALERT_METRICS,
  ALERT_NAME_MAX,
  ALERT_OPERATORS,
  ALERT_SEVERITIES,
  type AlertMetric,
  type AlertRule,
  type AlertRuleInput,
  alertRuleInputSchema,
  nameKey,
  THRESHOLD_LIMITS,
} from '@/shared/api';

export const SCOPE_KINDS = ['portfolio', 'region', 'markets'] as const;
export type ScopeKind = (typeof SCOPE_KINDS)[number];

/** Revenue is typed in millions of the chosen currency (monthly revenue is 0.8–3.8 M$); the API stores USD. */
const REVENUE_UNIT = 1_000_000;

/** What the fields hold: text for the number, flat scope fields. */
export type RuleFormValues = {
  name: string;
  metric: AlertMetric;
  operator: (typeof ALERT_OPERATORS)[number];
  threshold: string;
  scopeKind: ScopeKind;
  regionId: string;
  marketIds: string[];
  severity: (typeof ALERT_SEVERITIES)[number];
  enabled: boolean;
};

/** The error keys a field can show (`alerts.form.errors.*`). */
export type RuleFormError =
  | 'nameRequired'
  | 'nameTooLong'
  | 'duplicateName'
  | 'thresholdRequired'
  | 'thresholdRange'
  | 'regionRequired'
  | 'marketsRequired';

/** "1,5" and "1.5" both read as 1.5 (de-DE types a comma); "" or "abc" → NaN. */
export function parseThreshold(text: string): number {
  const trimmed = text.trim().replace(',', '.');
  if (trimmed === '' || !/^[-+−]?\d*\.?\d+$/.test(trimmed)) return Number.NaN;
  return Number(trimmed.replace('−', '-'));
}

/** The allowed range as the field shows it (revenue in M$). */
export function thresholdLimits(metric: AlertMetric): { min: number; max: number | null } {
  const { min, max } = THRESHOLD_LIMITS[metric];
  return metric === 'revenue' ? { min: min / REVENUE_UNIT, max: null } : { min, max };
}

export function toRuleInput(values: RuleFormValues): AlertRuleInput {
  const threshold = parseThreshold(values.threshold);
  const scope: AlertRuleInput['scope'] =
    values.scopeKind === 'region'
      ? { kind: 'region', regionId: values.regionId }
      : values.scopeKind === 'markets'
        ? { kind: 'markets', marketIds: values.marketIds }
        : { kind: 'portfolio' };
  return {
    name: values.name.trim(),
    metric: values.metric,
    operator: values.operator,
    // Rounded so 1.1 M$ is 1 100 000, not 1 100 000.0000000002.
    threshold: values.metric === 'revenue' ? Math.round(threshold * REVENUE_UNIT) : threshold,
    scope,
    severity: values.severity,
    enabled: values.enabled,
  };
}

export function toFormValues(rule: AlertRuleInput): RuleFormValues {
  return {
    name: rule.name,
    metric: rule.metric,
    operator: rule.operator,
    threshold: String(rule.metric === 'revenue' ? rule.threshold / REVENUE_UNIT : rule.threshold),
    scopeKind: rule.scope.kind,
    regionId: rule.scope.kind === 'region' ? rule.scope.regionId : '',
    marketIds: rule.scope.kind === 'markets' ? rule.scope.marketIds : [],
    severity: rule.severity,
    enabled: rule.enabled,
  };
}

/** A new rule: attainment below 95 %, the dashboard's selection ready for "Markets". */
export function newRuleValues(selected: readonly string[]): RuleFormValues {
  return {
    name: '',
    metric: 'attainment',
    operator: 'below',
    threshold: '95',
    scopeKind: selected.length > 0 ? 'markets' : 'portfolio',
    regionId: '',
    marketIds: [...selected],
    severity: 'warning',
    enabled: true,
  };
}

const issue = (ctx: z.RefinementCtx, path: keyof RuleFormValues, message: RuleFormError) => {
  ctx.addIssue({ code: 'custom', path: [path], message });
};

/**
 * The form's schema: the shared rule schema (same checks as the server)
 * plus what only the list knows, a name taken by another rule.
 */
export function ruleFormSchema(others: readonly Pick<AlertRule, 'name'>[]) {
  const taken = new Set(others.map((r) => nameKey(r.name)));
  return z
    .object({
      name: z.string(),
      metric: z.enum(ALERT_METRICS),
      operator: z.enum(ALERT_OPERATORS),
      threshold: z.string(),
      scopeKind: z.enum(SCOPE_KINDS),
      regionId: z.string(),
      marketIds: z.array(z.string()),
      severity: z.enum(ALERT_SEVERITIES),
      enabled: z.boolean(),
    })
    .superRefine((values, ctx) => {
      const name = values.name.trim();
      if (name === '') issue(ctx, 'name', 'nameRequired');
      else if (name.length > ALERT_NAME_MAX) issue(ctx, 'name', 'nameTooLong');
      else if (taken.has(nameKey(name))) issue(ctx, 'name', 'duplicateName');

      if (Number.isNaN(parseThreshold(values.threshold))) {
        issue(ctx, 'threshold', 'thresholdRequired');
      } else {
        // The range: exactly what the server will check.
        const shared = alertRuleInputSchema.safeParse(toRuleInput(values));
        if (!shared.success && shared.error.issues.some((i) => i.path[0] === 'threshold')) {
          issue(ctx, 'threshold', 'thresholdRange');
        }
      }
      if (values.scopeKind === 'region' && values.regionId === '') {
        issue(ctx, 'regionId', 'regionRequired');
      }
      if (values.scopeKind === 'markets' && values.marketIds.length === 0) {
        issue(ctx, 'marketIds', 'marketsRequired');
      }
    })
    .transform(toRuleInput);
}

export type RuleFormSchema = ReturnType<typeof ruleFormSchema>;
