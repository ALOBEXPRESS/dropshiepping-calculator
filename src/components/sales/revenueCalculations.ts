/**
 * Sales Dashboard Financial & Period Calculation Engine
 * Pure, robust functions with zero-drift precision and boundary safety.
 */

import type { SalesFilters } from '@/hooks/useFilterPersistence';

const EN_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

/**
 * Formats a numeric value into Brazilian Real (BRL) currency string.
 */
export function formatBRL(value: number | null | undefined): string {
  const safeVal = typeof value === 'number' && !isNaN(value) ? value : 0;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(safeVal);
}

/**
 * Rounds a number to 2 decimal places to avoid floating point drift.
 */
export function round2(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

/**
 * Safely adds numbers avoiding floating-point precision errors (e.g. 0.1 + 0.2).
 */
export function safeSum(values: (number | null | undefined)[]): number {
  const sum = values.reduce<number>((acc, v) => {
    const n = typeof v === 'number' && !isNaN(v) ? v : 0;
    return acc + n;
  }, 0);
  return round2(sum);
}

/**
 * Calculates profit margin percentage and classifies the status according to business rules:
 * - Critical: < 10%
 * - Warning: 10% to < 20%
 * - Healthy: >= 20%
 *
 * Safe against zero revenue, negative profit, nulls, and division by zero.
 */
export interface MarginClassification {
  marginPercent: number;
  status: 'critical' | 'warning' | 'healthy';
}

export function calculateMargin(profit: number, revenue: number): MarginClassification {
  const safeProfit = isNaN(profit) ? 0 : profit;
  const safeRevenue = isNaN(revenue) ? 0 : revenue;

  if (safeRevenue <= 0) {
    if (safeProfit < 0) {
      return { marginPercent: -100, status: 'critical' };
    }
    return { marginPercent: 0, status: 'critical' };
  }

  const margin = round2((safeProfit / safeRevenue) * 100);

  if (margin < 10) {
    return { marginPercent: margin, status: 'critical' };
  }
  if (margin < 20) {
    return { marginPercent: margin, status: 'warning' };
  }
  return { marginPercent: margin, status: 'healthy' };
}

/**
 * Calculates percentage change between current and previous periods.
 * Safe against division by zero and nulls.
 * 
 * Formula:
 * If prev !== 0: ((cur - prev) / |prev|) * 100
 * If prev === 0: cur !== 0 ? 100 : 0
 */
export function calculatePercentageChange(current: number, previous: number): number {
  const cur = isNaN(current) ? 0 : current;
  const prev = isNaN(previous) ? 0 : previous;

  if (prev !== 0) {
    return Math.round(((cur - prev) / Math.abs(prev)) * 100);
  }
  return cur !== 0 ? 100 : 0;
}

/**
 * Safely gets current and previous period labels for RPC `get_revenue_report`.
 * 
 * Fixes the JavaScript `setMonth(m - 1)` rollover bug when the reference date
 * is on the 29th, 30th, or 31st (e.g. March 31 setMonth(1) would roll into March 3).
 * Always uses the 1st of the month for relative month arithmetic.
 */
export function getSafePeriodLabels(
  period: 'daily' | 'weekly' | 'monthly' | 'yearly',
  referenceDate: Date = new Date()
): { current: string; previous: string } {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();

  if (period === 'monthly') {
    const cur = EN_MONTHS[month];
    // Set day to 1 before subtracting month to prevent 31-day rollover
    const prevDate = new Date(year, month - 1, 1);
    const prev = EN_MONTHS[prevDate.getMonth()];
    return { current: cur, previous: prev };
  }

  if (period === 'yearly') {
    return {
      current: String(year),
      previous: String(year - 1),
    };
  }

  // daily / weekly fallback to monthly comparison labels
  const cur = EN_MONTHS[month];
  const prevDate = new Date(year, month - 1, 1);
  return { current: cur, previous: EN_MONTHS[prevDate.getMonth()] };
}

/**
 * Filters an order by custom date range and marketplace.
 */
export function matchesOrderFilters(
  order: {
    order_date?: string | null;
    created_at?: string | null;
    marketplace?: string | null;
    marketplace_name?: string | null;
    marketplace_id?: string | null;
  },
  filters?: SalesFilters
): boolean {
  if (!filters) return true;

  const rawDate = order.order_date || order.created_at;
  if (rawDate) {
    const dateStr = rawDate.split('T')[0];
    if (filters.startDate && dateStr < filters.startDate) {
      return false;
    }
    if (filters.endDate && dateStr > filters.endDate) {
      return false;
    }
  }

  if (filters.marketplaceId && filters.marketplaceId.trim()) {
    const search = filters.marketplaceId.trim().toLowerCase();
    const mpId = String(order.marketplace_id ?? '').toLowerCase();
    const mpName = String(order.marketplace ?? order.marketplace_name ?? '').toLowerCase();
    const matches = mpId.includes(search) || mpName.includes(search);
    if (!matches) return false;
  }

  return true;
}
