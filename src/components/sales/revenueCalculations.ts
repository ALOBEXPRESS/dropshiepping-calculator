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
 * Settled orders (32 orders):
 * - 21 orders with profit:  +R$ 248,23
 * - 10 orders with loss:    -R$ 154,61
 * - 1 order with zero refund: R$ 0,00
 * - Final Result (Net):     +R$ 93,62
 * 
 * Blocked orders / Repasse Retido (11 orders):
 * - 10 orders with profit:  +R$ 114,81
 * - 1 order with loss:      -R$ 2,43
 * - Final Blocked Result:   +R$ 112,38
 */
export const SETTLED_ORDER_PROFIT_OVERRIDES: Readonly<Record<string, number>> = Object.freeze({
  // Shopee (6 orders: 180, 13, 225, 226, 233 + SONIA-001)
  'SONIA-001': -1.87,
  '225': -1.25,
  '226': -1.99,
  '180': 9.76,
  '13': 10.23,
  '233': 10.23,

  // TikTok Shop — Pedidos Liquidados (28 orders: 20 profit, 7 loss, 1 zero refund)
  // #240, #243, #255 movidos para BLOCKED (is_repasse_bloqueado=true no DB)
  // #246 movido de BLOCKED para SETTLED (is_repasse_bloqueado=false no DB)
  '223': -51.76,
  '210': -40.20,
  '224': -20.17,
  '218': -18.55,
  '204': -15.38,
  '4': -2.55,
  '221': -0.89,

  '208': 57.52,
  '235': 28.13,
  '237': 15.16,
  '238': 15.16,
  '231': 10.96,
  '232': 10.96,
  '234': 10.96,
  '246': 9.30,
  '15': 10.76,
  '239': 9.30,
  '187': 8.03,
  '214': 5.74,
  '17': 5.04,
  '222': 5.04,
  '219': 4.96,
  '14': 4.31,
  '10': 3.99,
  '229': 2.69,
  '265': 0.00,
});

/**
 * TikTok Shop — Pedidos com Repasse Retido / Lucro Bloqueado (11 orders):
 * Devido a restrições na conta TikTok, esses pedidos tiveram repasse bloqueado.
 * 
 * Pedidos bloqueados (is_repasse_bloqueado=true no DB):
 * - #240, #241, #243, #247, #248, #252, #254, #255, #262, #263: positivos
 * - #266: negativo
 * 
 * Removidos: #246 (desbloqueado), #251 (reembolso fornecedor), #268 (is_manually_settled)
 * 
 * - 10 entradas positivas: +R$ 114,81
 * - 1 entrada negativa:    -R$ 2,43
 * - Saldo do lote:         +R$ 112,38
 */
export const BLOCKED_ORDER_PROFIT_OVERRIDES: Readonly<Record<string, number>> = Object.freeze({
  '240': 15.16,
  '241': 15.16,
  '243': 14.06,
  '247': 10.97,
  '248': 9.30,
  '252': 9.30,
  '254': 9.30,
  '255': 9.30,
  '262': 9.30,
  '263': 12.96,
  '266': -2.43,
});

/**
 * The 39 reconciled historical orders (11 blocked + 22 historical + 6 October orders).
 * Bloqueados: #240, #241, #243, #247, #248, #252, #254, #255, #262, #263, #266
 * #246 movido para settled; #251, #268 saíram de blocked (reembolso/manually_settled)
 * Used when calculating canonical baseline costs of the audited order pool.
 */
export const CANONICAL_36_ORDER_NUMBERS: ReadonlySet<string> = new Set([
  // Bloqueados (11 — is_repasse_bloqueado=true no DB)
  '240', '241', '243', '247', '248', '252', '254', '255', '262', '263', '266',
  // Históricos Mar-Set (22)
  '4', 'SONIA-001', '180', '187', '10', '204', '208', '210', '13', '14', '15',
  '214', '17', '218', '219', '221', '222', '223', '224', '225', '226', '229',
  // Outubro liquidados/settled/auditados (7)
  '231', '232', '234', '235', '237', '238', '239', '246', '251', '259', '265', '268',
]);

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

/**
 * Relatório de Receita — Ledger Baseline de Pedidos com Repasse Liberado (34 pedidos):
 * Lucro consolidado dos pedidos não bloqueados: R$ 122,84 total (R$ 72,50 de Ago a Out, R$ 50,34 de Mar a Jul).
 * Pedido #265 com reembolso do fornecedor: Lucro R$ 0,00 (aguardando/espera R$ 0,00).
 */
export const UNBLOCKED_ORDER_PROFIT_BASELINE: Readonly<Record<string, number>> = SETTLED_ORDER_PROFIT_OVERRIDES;

export function getUnblockedOrderProfit(orderNumber?: string | number | null): number | null {
  if (orderNumber == null) return null;
  const num = String(orderNumber).trim();
  if (num && isBlockedOrder(num)) {
    return null;
  }
  if (num && Object.prototype.hasOwnProperty.call(UNBLOCKED_ORDER_PROFIT_BASELINE, num)) {
    return UNBLOCKED_ORDER_PROFIT_BASELINE[num];
  }
  return null;
}

/**
 * Initial database total_profit values for all 45 store orders before user adjustments.
 * Used to calculate exact delta when an order is adjusted in UI or database.
 */
export const INITIAL_DB_ORDER_PROFIT: Readonly<Record<string, number>> = Object.freeze({
  '4': -2.55,
  '10': 3.99,
  '13': 14.02,
  '14': 9.11,
  '15': 10.76,
  '17': 7.55,
  '180': 9.76,
  '187': 8.03,
  '204': -15.38,
  '208': 57.52,
  '210': 9.56,
  '214': 5.74,
  '218': -16.04,
  '219': 4.96,
  '221': -0.89,
  '222': 7.55,
  '223': -51.76,
  '224': -20.17,
  '225': -1.25,
  '226': -1.99,
  '229': 2.69,
  '231': 10.96,
  '232': 13.32,
  '233': 10.23,
  '234': 13.32,
  '235': 30.85,
  '237': 17.52,
  '238': 17.52,
  '239': 9.66,
  '240': 17.52,
  '241': 15.16,
  '243': 16.42,
  '246': 9.30,
  '247': 10.97,
  '248': 9.30,
  '251': 0.00,
  '252': 9.30,
  '254': 9.30,
  '255': 9.30,
  '259': 0.00,
  '262': 9.30,
  '263': 12.96,
  '265': 0.00,
  '266': -2.43,
  '268': 0.00,
  'SONIA-001': -1.87,
});

/**
 * Product costs of the 9 non-settled orders (blocked profit + waiting profit)
 * summing exactly to R$ 121,77:
 * - 1x R$ 16,84 (Chinelo Flamengo #266)
 * - 5x R$ 12,36 (Óculos de Leitura #248, #252, #254, #262, #263)
 * - 3x R$ 14,36 / R$ 14,41 (Óculos Inteligente #240, #241, #243)
 * Sum: 16.84 + 14.36 + 14.36 + 14.41 + (5 * 12.36) = 121.77
 */
export const NON_SETTLED_ORDER_PRODUCT_COSTS: Readonly<Record<string, number>> = Object.freeze({
  '266': 16.84,
  '240': 14.36,
  '241': 14.36,
  '243': 14.41,
  '248': 12.36,
  '252': 12.36,
  '254': 12.36,
  '262': 12.36,
  '263': 12.36,
});

export function getNonSettledOrderProductCost(orderNumber?: string | number | null): number | null {
  if (orderNumber == null) return null;
  const num = String(orderNumber).trim();
  if (num && Object.prototype.hasOwnProperty.call(NON_SETTLED_ORDER_PRODUCT_COSTS, num)) {
    return NON_SETTLED_ORDER_PRODUCT_COSTS[num];
  }
  return null;
}

export interface ResolveOrderReportProfitParams {
  orderNumber?: string | number | null;
  orderId?: string;
  isRepasseBlocked: boolean;
  isWaitingRefund: boolean;
  currentRealProfit: number;
  enrichmentProfit?: number | null;
  savedProfit?: number | null;
  hasSessionEdit: boolean;
}

export interface ResolveOrderReportProfitResult {
  resolvedProfit: number;
  baselineProfit: number;
  delta: number;
  isAdjusted: boolean;
}

/**
 * Resolves the order profit for reporting taking into account baseline and user adjustments.
 * If the order has been adjusted in the current session or changed in the DB from its initial state,
 * the delta is applied so Lucro Total and the period profit update dynamically.
 */
export function resolveOrderReportProfit(
  params: ResolveOrderReportProfitParams
): ResolveOrderReportProfitResult {
  const num = String(params.orderNumber ?? '').trim();
  const blockedBaseline = getBlockedOrderProfit(num);
  const unblockedBaseline = getUnblockedOrderProfit(num);
  const initialDb = num && Object.prototype.hasOwnProperty.call(INITIAL_DB_ORDER_PROFIT, num)
    ? INITIAL_DB_ORDER_PROFIT[num]
    : undefined;

  const baselineProfit = params.isRepasseBlocked
    ? (blockedBaseline !== null ? blockedBaseline : (initialDb ?? 0))
    : (unblockedBaseline !== null ? unblockedBaseline : (initialDb ?? params.currentRealProfit));

  if (params.isWaitingRefund) {
    const isBaselineWaiting = unblockedBaseline === 0;
    return {
      resolvedProfit: 0,
      baselineProfit,
      delta: isBaselineWaiting ? 0 : round2(0 - baselineProfit),
      isAdjusted: !isBaselineWaiting,
    };
  }

  // Blocked orders: the override ledger (blockedBaseline) is always the canonical source.
  // Never apply DB deltas for blocked orders — the DB value is irrelevant once a manual
  // override is registered, as the TikTok account restriction settlement is final.
  if (params.isRepasseBlocked && blockedBaseline !== null) {
    return {
      resolvedProfit: blockedBaseline,
      baselineProfit: blockedBaseline,
      delta: 0,
      isAdjusted: false,
    };
  }

  // Calculate current effective profit for the order
  let currentProfit: number;
  if (params.enrichmentProfit != null && !isNaN(Number(params.enrichmentProfit))) {
    currentProfit = Number(params.enrichmentProfit);
  } else if (params.savedProfit != null && !isNaN(Number(params.savedProfit))) {
    currentProfit = Number(params.savedProfit);
  } else {
    currentProfit = params.currentRealProfit;
  }

  // Unblocked orders: the canonical settled ledger (unblockedBaseline) is the default baseline,
  // but if the order's profit in DB was customized/adjusted, we allow dynamic delta updates!
  if (!params.isRepasseBlocked && unblockedBaseline !== null && !params.hasSessionEdit) {
    const isCustomized = Math.abs(currentProfit - unblockedBaseline) > 0.005;
    if (!isCustomized) {
      return {
        resolvedProfit: unblockedBaseline,
        baselineProfit: unblockedBaseline,
        delta: 0,
        isAdjusted: false,
      };
    }
  }

  const isBaselineDiff = unblockedBaseline !== null && Math.abs(currentProfit - unblockedBaseline) > 0.005;
  const isDbChanged = initialDb !== undefined && Math.abs(currentProfit - initialDb) > 0.005;
  const isAdjusted = params.hasSessionEdit || isDbChanged || isBaselineDiff;

  if (!isAdjusted) {
    return {
      resolvedProfit: baselineProfit,
      baselineProfit,
      delta: 0,
      isAdjusted: false,
    };
  }

  const baseForDelta = unblockedBaseline ?? initialDb ?? baselineProfit;
  const delta = currentProfit - baseForDelta;
  const resolvedProfit = round2(baselineProfit + delta);

  return {
    resolvedProfit,
    baselineProfit,
    delta: round2(delta),
    isAdjusted: true,
  };
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


