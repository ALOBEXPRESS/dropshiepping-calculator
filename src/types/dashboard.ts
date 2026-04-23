/**
 * Dashboard types for sales dashboard real data feature
 */

/**
 * Time period options for filtering dashboard data
 */
export type TimePeriod = 'day' | 'week' | 'month' | 'year' | 'total';

/**
 * Date range with start and end dates
 */
export interface DateRange {
  start: Date;
  end: Date;
}

/**
 * Period data containing current and previous date ranges
 */
export interface PeriodData {
  current: DateRange;
  previous: DateRange;
}

/**
 * KPI metric with current value, previous value, and growth percentage
 */
export interface KPIMetric {
  current: number;
  previous: number;
  growth: number | null;
}

/**
 * Dashboard KPI data containing all metrics
 */
export interface DashboardKPIData {
  revenue: KPIMetric;  // Receita Total (total_amount)
  fees: KPIMetric;     // Taxas Marketplace (marketplace_commission)
  profit: KPIMetric;   // Lucro Total (total_profit)
  products: KPIMetric; // Produtos do marketplace
  customers: KPIMetric; // Clientes com lucro processado
}

/**
 * Lead status data for bubble chart
 */
export interface LeadStatusData {
  status: string;
  label: string;
  count: number;
  percentage: number;
  color: string;
}

/**
 * Weekly conversion data for bar chart
 */
export interface WeeklyConversionData {
  week: string;
  day: string;
  fees: number;
  revenue: number;
  profit: number;
  netProfit: number;
}

/**
 * Complete dashboard data (legacy - for backward compatibility)
 * @deprecated Use DashboardKPIData instead
 */
export type DashboardData = DashboardKPIData;
