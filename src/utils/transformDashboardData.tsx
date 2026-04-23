/**
 * Dashboard Data Transformation Utilities
 * 
 * Transforms DashboardKPIData from the service layer into KPICard component props.
 * Now supports the new KPI structure: Revenue, Fees, Profit, Products, Customers
 */

import { DollarSign, TrendingUp, Wallet, Package, Users } from 'lucide-react';
import type { DashboardKPIData, KPIMetric } from '../types/dashboard';
import type { KPICardProps } from '../components/KPICard';

/**
 * Get trend direction from growth percentage
 */
export function getTrendDirection(growth: number | null | undefined): 'up' | 'down' | 'neutral' {
  if (growth === null || growth === undefined || growth === 0) return 'neutral';
  return growth > 0 ? 'up' : 'down';
}

/**
 * Transform a single KPI metric to KPICard props
 */
export function transformKPIMetric(
  title: string,
  metric: KPIMetric,
  format: 'currency' | 'number',
  icon: React.ReactNode
): KPICardProps {
  return {
    title,
    value: metric.current,
    trend: {
      direction: getTrendDirection(metric.growth),
      percentage: metric.growth !== null && metric.growth !== undefined 
        ? Math.abs(metric.growth) 
        : 0
    },
    format,
    icon
  };
}

/**
 * Transform complete dashboard data to KPI card props
 * New structure: Revenue, Fees, Profit, Products, Customers
 */
export function transformToKPICardProps(data: DashboardKPIData): {
  revenue: KPICardProps;
  fees: KPICardProps;
  profit: KPICardProps;
  products: KPICardProps;
  customers: KPICardProps;
} {
  return {
    revenue: transformKPIMetric(
      'Receita Total',
      data.revenue,
      'currency',
      <TrendingUp className="w-5 h-5" aria-hidden="true" />
    ),
    fees: transformKPIMetric(
      'Taxas Marketplace',
      data.fees,
      'currency',
      <Wallet className="w-5 h-5" aria-hidden="true" />
    ),
    profit: transformKPIMetric(
      'Lucro Total',
      data.profit,
      'currency',
      <DollarSign className="w-5 h-5" aria-hidden="true" />
    ),
    products: transformKPIMetric(
      'Produtos',
      data.products,
      'number',
      <Package className="w-5 h-5" aria-hidden="true" />
    ),
    customers: transformKPIMetric(
      'Clientes',
      data.customers,
      'number',
      <Users className="w-5 h-5" aria-hidden="true" />
    )
  };
}
