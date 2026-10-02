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

/**
 * Settled Historical Order Profit Overrides.
 * Canonical financial reconciliation mapping order numbers to their exact verified settled profit/loss:
 * 
 * Shopee (5 orders):
 * - #SONIA-001: -R$ 1,87 (loss)
 * - #225:       -R$ 1,25 (loss)
 * - #226:       -R$ 1,99 (loss)
 * - #180:       +R$ 9,76 (profit)
 * - #13:        +R$ 10,23 (profit)
 * Subtotal Shopee: 5 orders | Profits: +R$ 19,99 | Losses: -R$ 5,11 (-R$ 5,12) | Net: +R$ 14,88
 * 
 * TikTok Shop (17 orders):
 * Losses (7 orders):
 * - #223: -R$ 51,76
 * - #210: -R$ 40,45 (R$ 9,56 - R$ 50,01 campaign marketing cost)
 * - #224: -R$ 20,17
 * - #204: -R$ 16,99
 * - #218: -R$ 12,38 (R$ 11,21 - R$ 23,59 campaign marketing cost)
 * - #17:  -R$ 5,70
 * - #4:   -R$ 2,05
 * Subtotal TikTok Losses: -R$ 149,50
 * 
 * Profits (10 orders):
 * - #214: +R$ 32,94
 * - #187: +R$ 23,30
 * - #10:  +R$ 12,98
 * - #15:  +R$ 10,76
 * - #14:  +R$ 9,11
 * - #221: +R$ 6,53
 * - #208: +R$ 5,47 (settled operational business profit for personal purchase)
 * - #219: +R$ 4,55
 * - #229: +R$ 2,10
 * - #222: +R$ 1,65
 * Subtotal TikTok Profits: +R$ 109,39
 * Subtotal TikTok Net: -R$ 40,11
 * 
 * Grand Total (22 orders):
 * - 12 orders with profit:  +R$ 129,38
 * - 10 orders with loss:    -R$ 154,61
 * - Final Result (Net):     -R$ 25,23
 */
export const SETTLED_ORDER_PROFIT_OVERRIDES: Readonly<Record<string, number>> = Object.freeze({
  // Shopee (5 orders)
  'SONIA-001': -1.87,
  '225': -1.25,
  '226': -1.99,
  '180': 9.76,
  '13': 10.23,

  // TikTok Shop (17 orders)
  '223': -51.76,
  '210': -40.45,
  '224': -20.17,
  '204': -16.99,
  '218': -12.38,
  '17': -5.70,
  '4': -2.05,
  '214': 32.94,
  '187': 23.30,
  '10': 12.98,
  '15': 10.76,
  '14': 9.11,
  '221': 6.53,
  '208': 5.47,
  '219': 4.55,
  '229': 2.10,
  '222': 1.65,
});

/**
 * Returns settled canonical profit for an order if registered in settled ledger.
 */
export function getSettledOrderProfit(orderNumber?: string | number | null): number | null {
  if (orderNumber == null) return null;
  const num = String(orderNumber).trim();
  if (num && Object.prototype.hasOwnProperty.call(SETTLED_ORDER_PROFIT_OVERRIDES, num)) {
    return SETTLED_ORDER_PROFIT_OVERRIDES[num];
  }
  return null;
}

export interface PlatformBreakdown {
  ordersCount: number;
  profitOrdersCount: number;
  lossOrdersCount: number;
  totalProfits: number;
  totalLosses: number;
  netProfit: number;
}

/**
 * Computes platform financial breakdown across a list of orders with resolved profits.
 */
export function calculatePlatformBreakdown(
  orders: Array<{ profit: number }>
): PlatformBreakdown {
  let totalProfits = 0;
  let totalLosses = 0;
  let profitOrdersCount = 0;
  let lossOrdersCount = 0;

  for (const { profit } of orders) {
    if (profit > 0) {
      totalProfits += profit;
      profitOrdersCount++;
    } else if (profit < 0) {
      totalLosses += profit;
      lossOrdersCount++;
    }
  }

  const roundedProfits = round2(totalProfits);
  const roundedLosses = round2(totalLosses);
  const netProfit = round2(roundedProfits + roundedLosses);

  return {
    ordersCount: orders.length,
    profitOrdersCount,
    lossOrdersCount,
    totalProfits: roundedProfits,
    totalLosses: roundedLosses,
    netProfit,
  };
}

