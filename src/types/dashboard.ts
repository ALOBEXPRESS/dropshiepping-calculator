/**
 * TypeScript interfaces for LeadsDashboard component
 * 
 * This file defines the data models for the Boostboard-inspired dashboard
 * that replaces the previous conversion funnel and gender distribution visualizations.
 * 
 * @module types/dashboard
 * @see {@link ../components/LeadsDashboard.tsx} for component implementation
 * 
 * Requirements: 7.2, 7.3, 10.3, 10.5
 */

/**
 * Trend indicator showing direction and percentage change
 * 
 * Used in KPI cards to display performance trends compared to a previous period.
 * 
 * @example
 * ```typescript
 * const upwardTrend: TrendIndicator = {
 *   direction: 'up',
 *   percentage: 12.5,
 *   comparisonPeriod: 'month'
 * };
 * ```
 */
export interface TrendIndicator {
  /** Direction of the trend: 'up' for growth, 'down' for decline, 'neutral' for no change */
  direction: 'up' | 'down' | 'neutral';
  /** Percentage change (absolute value, e.g., 12.5 for +12.5% or -12.5%) */
  percentage: number;
  /** Time period for comparison: 'week', 'month', or 'quarter' */
  comparisonPeriod: 'week' | 'month' | 'quarter';
}

/**
 * KPI metrics for the dashboard cards
 * 
 * Contains all key performance indicators displayed in the three main KPI cards.
 * Replaces the previous "Funil de Conversão" metrics (Novos Leads, Recorrentes, Convertidos, Qualificados).
 * 
 * @example
 * ```typescript
 * const kpis: KPIMetrics = {
 *   totalRevenue: {
 *     value: 33846,
 *     trend: { direction: 'up', percentage: 12.5, comparisonPeriod: 'month' }
 *   },
 *   marketplaceFees: {
 *     value: 12582,
 *     trend: { direction: 'down', percentage: 3.2, comparisonPeriod: 'month' },
 *     breakdown: { mercadoLivre: 7500, shopee: 3200, tiktok: 1882 }
 *   },
 *   totalLeads: {
 *     value: 245214,
 *     trend: { direction: 'up', percentage: 8.7, comparisonPeriod: 'week' }
 *   }
 * };
 * ```
 */
export interface KPIMetrics {
  /** Total revenue in Brazilian Real (R$) with trend indicator */
  totalRevenue: {
    /** Revenue value (e.g., 33846 for R$ 33,846.00) */
    value: number;
    /** Trend compared to previous period */
    trend: TrendIndicator;
  };
  /** Marketplace fees paid to platforms (Mercado Livre, Shopee, TikTok) */
  marketplaceFees: {
    /** Total fees value in R$ */
    value: number;
    /** Trend compared to previous period */
    trend: TrendIndicator;
    /** Breakdown by marketplace platform */
    breakdown: {
      /** Fees paid to Mercado Livre */
      mercadoLivre: number;
      /** Fees paid to Shopee */
      shopee: number;
      /** Fees paid to TikTok */
      tiktok: number;
    };
  };
  /** Total number of leads in the system */
  totalLeads: {
    /** Lead count (e.g., 245214) */
    value: number;
    /** Trend compared to previous period */
    trend: TrendIndicator;
  };
}

/**
 * Weekly conversion data for the bar chart visualization
 * 
 * Represents a single week's conversion metrics displayed in the WeeklyConversionChart.
 * Each data point shows fees, revenue, net profit, and conversion rate for a specific week.
 * 
 * @example
 * ```typescript
 * const weekData: WeeklyConversionData = {
 *   week: '12 Jul',
 *   date: new Date('2024-07-12'),
 *   fees: 2100,
 *   revenue: 6800,
 *   netProfit: 4700,
 *   conversionRate: 0.15
 * };
 * ```
 */
export interface WeeklyConversionData {
  /** Week label displayed on X-axis (e.g., "12 Jul", "15 Jul") */
  week: string;
  /** Full date object for the week */
  date: Date;
  /** Marketplace fees for this week in R$ */
  fees: number;
  /** Total revenue for this week in R$ */
  revenue: number;
  /** Net profit (revenue - fees - costs) for this week in R$ */
  netProfit: number;
  /** Conversion rate as decimal (e.g., 0.15 for 15%) */
  conversionRate: number;
}

/**
 * Lead status data for the bubble chart visualization
 * 
 * Represents a single lead status category displayed as a bubble in the LeadStatusChart.
 * Replaces the previous "Distribuição de Gênero" (Gender Distribution) donut chart.
 * 
 * @example
 * ```typescript
 * const completedStatus: LeadStatusData = {
 *   status: 'completed',
 *   count: 177,
 *   percentage: 67,
 *   color: '#FFB800',
 *   label: 'Completed'
 * };
 * ```
 */
export interface LeadStatusData {
  /** Status identifier: 'completed', 'ongoing', or 'awaiting' */
  status: 'completed' | 'ongoing' | 'awaiting';
  /** Number of leads in this status */
  count: number;
  /** Percentage of total leads (0-100) */
  percentage: number;
  /** Hex color code for visualization (e.g., '#FFB800' for yellow) */
  color: string;
  /** Display label for the status (e.g., 'Completed', 'Ongoing', 'Awaiting') */
  label: string;
}

/**
 * Dashboard metadata including timestamps and contextual information
 * 
 * Contains supplementary information about the dashboard data, including
 * when it was last updated and contextual messages for chart footers.
 * 
 * @example
 * ```typescript
 * const metadata: DashboardMetadata = {
 *   lastUpdated: new Date(),
 *   mostProfitableDay: 'July 17',
 *   recentSignups: 14,
 *   dataSource: 'mock'
 * };
 * ```
 */
export interface DashboardMetadata {
  /** Timestamp of last data update */
  lastUpdated: Date;
  /** Most profitable day/week for display in chart footer (e.g., "July 17") */
  mostProfitableDay: string;
  /** Number of recent user signups for display in chart footer */
  recentSignups: number;
  /** Data source indicator: 'mock' for development, 'api' for production */
  dataSource: 'mock' | 'api';
}

/**
 * Main dashboard data structure containing all metrics and visualizations
 * 
 * This is the root data structure passed to the LeadsDashboard component.
 * It aggregates all KPIs, chart data, and metadata needed to render the complete dashboard.
 * 
 * @example
 * ```typescript
 * const dashboardData: DashboardData = {
 *   kpis: { totalRevenue: {...}, marketplaceFees: {...}, totalLeads: {...} },
 *   weeklyConversions: [
 *     { week: '12 Jul', date: new Date('2024-07-12'), fees: 2100, revenue: 6800, netProfit: 4700, conversionRate: 0.15 },
 *     // ... more weeks
 *   ],
 *   leadStatus: [
 *     { status: 'completed', count: 177, percentage: 67, color: '#FFB800', label: 'Completed' },
 *     { status: 'ongoing', count: 87, percentage: 21, color: '#FF4D00', label: 'Ongoing' },
 *     { status: 'awaiting', count: 23, percentage: 12, color: '#7C3AED', label: 'Awaiting' }
 *   ],
 *   metadata: { lastUpdated: new Date(), mostProfitableDay: 'July 17', recentSignups: 14, dataSource: 'mock' }
 * };
 * ```
 */
export interface DashboardData {
  /** KPI metrics for the three main cards */
  kpis: KPIMetrics;
  /** Weekly conversion data for the bar chart (typically 4-8 weeks) */
  weeklyConversions: WeeklyConversionData[];
  /** Lead status distribution data for the bubble chart (3 statuses) */
  leadStatus: LeadStatusData[];
  /** Dashboard metadata and contextual information */
  metadata: DashboardMetadata;
}
