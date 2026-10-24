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
 * Settled orders (33 orders):
 * - 23 orders with profit:  +R$ 277,61
 * - 10 orders with loss:    -R$ 158,06
 * - Final Result (Net):     +R$ 119,55
 * 
 * Blocked orders / Repasse Retido (11 orders):
 * - 9 orders with profit:   +R$ 98,43
 * - 2 orders with loss:     -R$ 2,86
 * - Final Blocked Result:   +R$ 95,57
 */
export const SETTLED_ORDER_PROFIT_OVERRIDES: Readonly<Record<string, number>> = Object.freeze({
  // Shopee (6 orders: 180, 13, 225, 226, 233 + SONIA-001)
  'SONIA-001': -1.87,
  '225': -1.25,
  '226': -1.99,
  '180': 9.76,
  '13': 10.23,
  '233': 10.23,

  // TikTok Shop — Pedidos Liquidados (27 orders: 20 profit, 7 loss)
  '223': -51.76,
  '210': -40.26,
  '224': -20.17,
  '218': -18.61,
  '204': -16.99,
  '17': -2.61,
  '4': -2.55,

  '208': 57.52,
  '214': 28.07,
  '237': 15.10,
  '238': 15.10,
  '240': 15.10,
  '10': 14.00,
  '231': 10.96,
  '232': 10.90,
  '235': 10.00,
  '15': 10.76,
  '239': 9.30,
  '243': 9.30,
  '14': 8.56,
  '222': 5.68,
  '255': 5.68,
  '219': 4.98,
  '221': 4.98,
  '234': 4.46,
  '187': 8.03,
  '229': 2.69,
});

/**
 * TikTok Shop — Pedidos com Repasse Retido / Lucro Bloqueado (11 orders):
 * Devido a restrições na conta TikTok, esses pedidos tiveram repasse bloqueado.
 * 
 * - 9 entradas positivas:   +R$ 98,43
 * - 2 entradas negativas:   -R$ 2,86
 * - Saldo do lote:          +R$ 95,57
 */
export const BLOCKED_ORDER_PROFIT_OVERRIDES: Readonly<Record<string, number>> = Object.freeze({
  '241': 15.10,
  '246': 9.30,
  '247': 10.91,
  '248': 9.30,
  '251': 9.30,
  '252': 9.30,
  '254': 9.30,
  '262': 12.96,
  '263': 12.96,
  '268': -0.37,
  '266': -2.49,
});

export function isBlockedOrder(orderNumber?: string | number | null): boolean {
  if (orderNumber == null) return false;
  const num = String(orderNumber).trim();
  return Boolean(num && Object.prototype.hasOwnProperty.call(BLOCKED_ORDER_PROFIT_OVERRIDES, num));
}

export function getBlockedOrderProfit(orderNumber?: string | number | null): number | null {
  if (orderNumber == null) return null;
  const num = String(orderNumber).trim();
  if (num && Object.prototype.hasOwnProperty.call(BLOCKED_ORDER_PROFIT_OVERRIDES, num)) {
    return BLOCKED_ORDER_PROFIT_OVERRIDES[num];
  }
  return null;
}

/**
 * Returns settled canonical profit for an order if registered in settled ledger.
 */
export function getSettledOrderProfit(orderNumber?: string | number | null): number | null {
  if (orderNumber == null) return null;
  const num = String(orderNumber).trim();
  if (num && isBlockedOrder(num)) {
    return null;
  }
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

/**
 * Formats a date string (YYYY-MM-DD or ISO) into Brazilian format DD/MM/YYYY without timezone drift.
 */
export function formatDateBR(dateStr?: string | null): string {
  if (!dateStr) return '';
  const dateOnly = dateStr.split('T')[0];
  const parts = dateOnly.split('-').map(Number);
  if (parts.length !== 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) {
    return dateStr;
  }
  const dd = String(parts[2]).padStart(2, '0');
  const mm = String(parts[1]).padStart(2, '0');
  const yyyy = parts[0];
  return `${dd}/${mm}/${yyyy}`;
}

/**
 * Calculates the default delivery date (order date + default 7 days).
 */
export function calculateDefaultDeliveryDate(
  orderDateStr?: string | null,
  daysToAdd: number = 7
): string | null {
  if (!orderDateStr) return null;
  const dateOnly = orderDateStr.split('T')[0];
  const parts = dateOnly.split('-').map(Number);
  if (parts.length !== 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) {
    return null;
  }
  const d = new Date(parts[0], parts[1] - 1, parts[2] + daysToAdd);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Calculates the expected settlement date:
 * If logistics delayed and no delivery date: returns null (aguardando entrega).
 * If deliveryDateStr is provided: deliveryDateStr + settlementDays.
 * If not provided: orderDateStr + settlementDays.
 */
export function calculateSettlementDate(
  orderDateStr?: string | null,
  deliveryDateStr?: string | null,
  settlementDays: number = 7,
  isLogisticsDelayed: boolean = false
): string | null {
  if (isLogisticsDelayed && !deliveryDateStr) {
    return null;
  }
  const effectiveDeliv = deliveryDateStr || orderDateStr;
  if (!effectiveDeliv) return null;
  const parts = effectiveDeliv.split('T')[0].split('-').map(Number);
  if (parts.length !== 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) {
    return null;
  }
  const d = new Date(parts[0], parts[1] - 1, parts[2] + settlementDays);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Checks whether an order is settled based on its delivery date (or order date if delivery not yet set)
 * and the marketplace settlement period.
 * 
 * If isLogisticsDelayed is true and no deliveryDateStr is set, the order NEVER settles automatically.
 * It will only settle once deliveryDateStr is set AND referenceDate >= deliveryDateStr + settlementDays.
 * 
 * @param orderDateStr Date string (YYYY-MM-DD or ISO) of the order
 * @param settlementDays Number of days for settlement (default 7)
 * @param referenceDate Current date for comparison (default new Date())
 * @param deliveryDateStr Optional custom delivery date (YYYY-MM-DD or ISO)
 * @param isLogisticsDelayed Optional boolean indicating logistics delay
 * @returns true if settled (liquidação concluída), false if pending (em espera)
 */
export function isOrderSettled(
  orderDateStr?: string | null,
  settlementDays: number = 7,
  referenceDate: Date = new Date(),
  deliveryDateStr?: string | null,
  isLogisticsDelayed: boolean = false,
  isManuallySettled: boolean = false
): boolean {
  // Se foi liquidado manualmente, liquidação está concluída
  if (isManuallySettled) {
    return true;
  }

  // Se estiver em atraso logístico e ainda não houver data de entrega confirmada, não liquida
  if (isLogisticsDelayed && !deliveryDateStr) {
    return false;
  }

  if (!orderDateStr && !deliveryDateStr) return true;

  let baseDate: Date;

  if (deliveryDateStr) {
    const parts = deliveryDateStr.split('T')[0].split('-').map(Number);
    if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
      baseDate = new Date(parts[0], parts[1] - 1, parts[2]);
    } else {
      return true;
    }
  } else if (orderDateStr) {
    const parts = orderDateStr.split('T')[0].split('-').map(Number);
    if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
      baseDate = new Date(parts[0], parts[1] - 1, parts[2]);
    } else {
      return true;
    }
  } else {
    return true;
  }

  // Settlement occurs settlementDays after base date
  const settlementDate = new Date(
    baseDate.getFullYear(),
    baseDate.getMonth(),
    baseDate.getDate() + settlementDays
  );

  // Normalized end of day for reference date
  const refEndOfDay = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate(),
    23, 59, 59, 999
  );

  return refEndOfDay.getTime() >= settlementDate.getTime();
}


