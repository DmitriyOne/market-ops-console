export { datasetQueryOptions } from './api/dataset-query';
export {
  type Evidence,
  evidenceFor,
  resolveCitation,
  type ResolvedCitation,
} from './model/citation';
export {
  type DashboardState,
  type Mode,
  MODES,
  normalizeDashboardState,
  RANGES,
} from './model/dashboard-state';
export {
  type HeatCell,
  heatMap,
  type HeatMapView,
  type HeatMetric,
  type HeatNotice,
  type HeatRow,
} from './model/heat-map';
export { ISO3_TO_NUMERIC } from './model/iso-numeric';
export { computeKpis, type KpiName, type Kpis, type KpiSource, type KpiValue } from './model/kpis';
export {
  MAP_METRICS,
  MAP_SCALES,
  type MapMetric,
  type MapScale,
  type ScaleMetric,
  type ScaleStep,
} from './model/map-scale';
export {
  type MapItem,
  type MapLegend,
  type MapNotice,
  marketMap,
  type MarketMapView,
} from './model/market-map';
export {
  type MarketTile,
  marketTiles,
  type RiskItem,
  type TileGroup,
  type TopRisks,
  topRisks,
} from './model/market-status';
export {
  marketsMonthly,
  marketsTable,
  type MarketsTableView,
  type MonthlyRow,
  parseSort,
  sortParam,
  TABLE_COLUMNS,
  type TableColumn,
  type TableRow,
  type TableSort,
  type TableTotals,
} from './model/markets-table';
export { type OverviewKpis, overviewKpis, type RiskCount } from './model/overview';
export { periodToDate } from './model/period';
export {
  comparisonRadar,
  RADAR_AXES,
  RADAR_LIMIT,
  type RadarAxis,
  type RadarAxisNotice,
  type RadarSeries,
  type RadarValue,
  type RadarView,
} from './model/radar';
export { getMarket, getProduct, getRegion, scopeLabel } from './model/reference';
export {
  isLatestSnapshot,
  marketsInOrder,
  marketsInScope,
  periodsInRange,
  type Range,
  type Scope,
} from './model/scope';
export { dashboardSearchParams } from './model/search-params';
export { marketsAtRiskCount, nonOnTrackMarkets, statusFor } from './model/status';
export { type Mover, type TopMovers, topMovers } from './model/top-movers';
export { anomaliesInScope, type ScopedAnomaly, type TrendPoint, trendSeries } from './model/trend';
export { type TrendAnomaly, type TrendView, trendView } from './model/trend-view';
export { useDashboard } from './model/use-dashboard';
export { type DashboardFocus, useDashboardFocus } from './model/use-dashboard-focus';
export { DatasetGate } from './ui/DatasetGate';
export { StatusChip, StatusIcon, useStatusLabel } from './ui/StatusChip';
export { useKpiFormat } from './ui/use-kpi-format';
