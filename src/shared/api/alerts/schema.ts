import { z } from 'zod';

/** What a rule can watch: stored latest-month KPIs of a market. */
export const ALERT_METRICS = ['growth', 'attainment', 'share', 'revenue'] as const;
export type AlertMetric = (typeof ALERT_METRICS)[number];

export const ALERT_OPERATORS = ['below', 'above'] as const;
export type AlertOperator = (typeof ALERT_OPERATORS)[number];

export const ALERT_SEVERITIES = ['warning', 'critical'] as const;
export type AlertSeverity = (typeof ALERT_SEVERITIES)[number];

/** Allowed thresholds per metric (spec §9). Revenue is in USD. */
export const THRESHOLD_LIMITS: Record<AlertMetric, { min: number; max: number }> = {
  growth: { min: -100, max: 100 },
  attainment: { min: 0, max: 200 },
  share: { min: 0, max: 100 },
  revenue: { min: 0, max: Number.MAX_SAFE_INTEGER },
};

/**
 * The first visit's example rules. A rule with a preset is shown under the
 * preset's name in the page's language; editing it in the form drops the
 * preset, and the name the user saved is theirs from then on.
 */
export const ALERT_PRESETS = ['attainment', 'share'] as const;
export type AlertPreset = (typeof ALERT_PRESETS)[number];

export const ALERTS_MAX = 10;
export const ALERT_NAME_MAX = 60;

/** Names compare without case and outer spaces: "Low growth" = " low GROWTH ". */
export const nameKey = (name: string) => name.trim().toLocaleLowerCase('en');

export const alertScopeSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('portfolio') }),
  z.object({ kind: z.literal('region'), regionId: z.string().min(1) }),
  z.object({
    kind: z.literal('markets'),
    marketIds: z.array(z.string().min(1)).min(1, { error: 'marketsRequired' }),
  }),
]);
export type AlertScope = z.infer<typeof alertScopeSchema>;

const ruleFields = z.object({
  name: z
    .string()
    .trim()
    .min(1, { error: 'nameRequired' })
    .max(ALERT_NAME_MAX, { error: 'nameTooLong' }),
  metric: z.enum(ALERT_METRICS),
  operator: z.enum(ALERT_OPERATORS),
  threshold: z.number({ error: 'thresholdRequired' }),
  scope: alertScopeSchema,
  severity: z.enum(ALERT_SEVERITIES),
  enabled: z.boolean(),
  preset: z.enum(ALERT_PRESETS).optional(),
});

/** The threshold must fit its metric; the message is a translation key. */
function thresholdInRange(
  rule: { metric: AlertMetric; threshold: number },
  ctx: z.RefinementCtx,
): void {
  const { min, max } = THRESHOLD_LIMITS[rule.metric];
  if (rule.threshold < min || rule.threshold > max) {
    ctx.addIssue({ code: 'custom', path: ['threshold'], message: 'thresholdRange' });
  }
}

/** A rule as the user writes it (no id yet). */
export const alertRuleInputSchema = ruleFields.superRefine(thresholdInRange);
export type AlertRuleInput = z.infer<typeof alertRuleInputSchema>;

export const alertRuleSchema = ruleFields
  .extend({ id: z.string().min(1) })
  .superRefine(thresholdInRange);
export type AlertRule = z.infer<typeof alertRuleSchema>;

/** A stored list: at most ten rules, names unique. */
export const alertRulesSchema = z
  .array(alertRuleSchema)
  .max(ALERTS_MAX, { error: 'tooMany' })
  .superRefine((rules, ctx) => {
    const seen = new Set<string>();
    rules.forEach((rule, index) => {
      const key = nameKey(rule.name);
      if (seen.has(key)) {
        ctx.addIssue({ code: 'custom', path: [index, 'name'], message: 'duplicateName' });
      }
      seen.add(key);
    });
  });

export const alertsResponseSchema = z.object({ rules: alertRulesSchema });
export const alertRuleResponseSchema = z.object({ rule: alertRuleSchema });

/** Sent by the "Simulate failure" switch: the route answers 503 once. */
export const SIMULATE_FAILURE_HEADER = 'x-simulate-failure';

/** Error codes of `/api/v1/alerts`, mapped to messages on the client. */
export const ALERT_ERROR_CODES = [
  'invalid_request',
  'not_found',
  'duplicate_name',
  'too_many',
  'simulated',
] as const;
export type AlertErrorCode = (typeof ALERT_ERROR_CODES)[number];
