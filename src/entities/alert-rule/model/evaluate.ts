import type {
  AlertMetric,
  AlertRule,
  AlertRuleInput,
  AlertSeverity,
  Dataset,
  Market,
} from '@/shared/api';

export type MarketFlag = {
  /** The highest severity among the rules that flag the market. */
  severity: AlertSeverity;
  /** Every enabled rule that flags it, in list order. */
  rules: AlertRule[];
};

export type AlertFlags = {
  byMarket: ReadonlyMap<string, MarketFlag>;
  /** Flagged markets (the header's number). */
  count: number;
};

export const NO_FLAGS: AlertFlags = { byMarket: new Map(), count: 0 };

/** Stored latest-month KPIs (spec §5: the source of truth for that month). */
const VALUE: Record<AlertMetric, (m: Market) => number> = {
  growth: (m) => m.kpis.growthPct,
  attainment: (m) => m.kpis.forecastAttainmentPct,
  share: (m) => m.kpis.sharePct,
  revenue: (m) => m.kpis.revenue,
};

function inScope(market: Market, scope: AlertRuleInput['scope']): boolean {
  if (scope.kind === 'portfolio') return true;
  if (scope.kind === 'region') return market.regionId === scope.regionId;
  return scope.marketIds.includes(market.id);
}

/** Markets a rule flags now, in dataset order. Below and above are strict. */
export function ruleMarkets(ds: Dataset, rule: AlertRuleInput): Market[] {
  return ds.markets.filter((m) => {
    if (!inScope(m, rule.scope)) return false;
    const value = VALUE[rule.metric](m);
    return rule.operator === 'below' ? value < rule.threshold : value > rule.threshold;
  });
}

/** What the enabled rules flag at the latest month, per market. */
export function evaluateRules(ds: Dataset, rules: readonly AlertRule[]): AlertFlags {
  const byMarket = new Map<string, MarketFlag>();
  for (const rule of rules) {
    if (!rule.enabled) continue;
    for (const market of ruleMarkets(ds, rule)) {
      const flag = byMarket.get(market.id);
      if (flag) {
        flag.rules.push(rule);
        if (rule.severity === 'critical') flag.severity = 'critical';
      } else {
        byMarket.set(market.id, { severity: rule.severity, rules: [rule] });
      }
    }
  }
  return { byMarket, count: byMarket.size };
}

/** Flagged market ids, critical first, otherwise in dataset order. */
export function flaggedIds(flags: AlertFlags): string[] {
  const ids = [...flags.byMarket.keys()];
  const critical = (id: string) => flags.byMarket.get(id)?.severity === 'critical';
  return [...ids.filter(critical), ...ids.filter((id) => !critical(id))];
}
