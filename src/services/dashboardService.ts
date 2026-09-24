/**
 * Dashboard Service
 *
 * Service layer for fetching and calculating dashboard KPI data from Supabase.
 * All methods receive organizationId as a parameter — callers are responsible
 * for resolving it via organization_members (same pattern as Sales.tsx).
 *
 * Uses calcOrderProfit to guarantee that profit calculations on the Dashboard
 * match the Relatório de Receita (RevenueReportChart) exactly.
 */

import { supabase } from '../lib/supabase';
import { calculatePeriodRanges as calculatePeriodRangesUtil } from '../utils/dateRangeCalculator';
import { calculateGrowth as calculateGrowthUtil } from '../utils/growthCalculator';
import { calcOrderProfit, type OrderProfitInput } from '../utils/calcOrderProfit';
import type {
  TimePeriod,
  DateRange,
  PeriodData,
  DashboardKPIData,
  WeeklyConversionData,
  LeadStatusData,
} from '../types/dashboard';

interface EnrichedOrderCalc {
  id: string;
  orderNumber: string;
  orderDate: Date;
  totalAmount: number;
  marketplaceCommission: number;
  realProfit: number;
  customerId: string | null;
  marketplaceId: string | null;
}

export class DashboardService {
  static calculatePeriodRanges(period: TimePeriod): PeriodData {
    return calculatePeriodRangesUtil(period);
  }

  static calculateGrowth(current: number, previous: number): number | null {
    return calculateGrowthUtil(current, previous);
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  /** Resolve the organization_id for the currently signed-in user. */
  static async resolveOrganizationId(): Promise<string | null> {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return null;

    const { data, error } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();

    if (error || !data) return null;
    return data.organization_id as string;
  }

  /**
   * Helper to parse "YYYY-MM-DD" dates into a local Date without UTC day-boundary shift.
   */
  private static parseOrderDate(dateStr: string): Date {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const y = Number(parts[0]);
      const m = Number(parts[1]);
      const d = Number(parts[2]);
      if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
        return new Date(y, m - 1, d, 12, 0, 0);
      }
    }
    return new Date(dateStr);
  }

  /**
   * Fetches all processed orders for an organization and calculates their real profit,
   * costs, fees and revenue using calcOrderProfit and campaign marketing cost overrides.
   */
  static async fetchEnrichedOrders(
    organizationId: string,
    marketplaceId?: string | null
  ): Promise<EnrichedOrderCalc[]> {
    let ordersQuery = supabase
      .from('orders')
      .select(`
        id,
        order_number,
        order_date,
        total_amount,
        discount_value,
        shipping_cost,
        other_expenses,
        marketplace_commission,
        reembolso_value,
        is_free_sample,
        is_personal_purchase,
        marketplace_id,
        customer_id,
        lead_id,
        processed_at,
        bling_order_id,
        bling_orders!bling_order_id (
          id,
          total_products,
          base_value,
          commission_tax,
          shipping_cost,
          tiktok_reembolso_disabled,
          tiktok_retorno_liquido
        ),
        marketplaces!marketplace_id (
          id,
          name,
          commission_rate,
          fixed_fee,
          affiliate_commission_rate
        ),
        order_items (
          quantity,
          unit_cost,
          unit_price,
          products (
            name,
            sku,
            cost_price,
            supplier_fee_value,
            supplier_fee_type,
            supplier_gateway_fee_value,
            supplier_gateway_fee_type
          ),
          bling_order_items (
            products_bling (
              cost_price
            )
          )
        )
      `)
      .eq('organization_id', organizationId)
      .not('processed_at', 'is', null);

    if (marketplaceId) {
      ordersQuery = ordersQuery.eq('marketplace_id', marketplaceId);
    }

    const [ordersRes, mktsRes, mktCostsRes] = await Promise.all([
      ordersQuery,
      supabase
        .from('marketplaces')
        .select('id, name, commission_rate, fixed_fee, affiliate_commission_rate'),
      supabase
        .from('campaign_order_costs')
        .select('order_id, marketing_cost')
        .eq('organization_id', organizationId),
    ]);

    if (ordersRes.error) throw new Error(ordersRes.error.message);

    interface DbMarketplace {
      id: string;
      name: string;
      commission_rate?: number;
      fixed_fee?: number;
      affiliate_commission_rate?: number;
    }

    const mktList = (mktsRes.data ?? []) as DbMarketplace[];
    const mktMap = new Map(mktList.map(m => [m.id, m]));
    const mktByName = new Map(mktList.map(m => [m.name.toLowerCase().replace(/\s+/g, ''), m]));
    const mktCostMap = new Map((mktCostsRes.data ?? []).map(c => [c.order_id, Number(c.marketing_cost ?? 0)]));

    return (ordersRes.data ?? []).map((order) => {
      const joinedMp = order.marketplaces as DbMarketplace | null;
      const mappedMp = order.marketplace_id ? mktMap.get(order.marketplace_id) : undefined;
      const rawMpName = joinedMp?.name || mappedMp?.name || '';
      const normalizedMp = rawMpName.toLowerCase().replace(/\s+/g, '');
      const namedMp = mktByName.get(normalizedMp);

      const isShopee = rawMpName.toLowerCase().includes('shopee');
      const isTikTok = rawMpName.toLowerCase().includes('tiktok');

      const mp = joinedMp || mappedMp || namedMp;
      const mpName = mp?.name || (isShopee ? 'Shopee' : isTikTok ? 'TikTok Shop' : rawMpName);

      const commissionRate = Number(mp?.commission_rate ?? (isShopee ? 20 : isTikTok ? 10 : 0));
      const fixedFee = Number(mp?.fixed_fee ?? (isShopee ? 4 : 0));

      const items = (order.order_items ?? []) as Array<{
        quantity?: number;
        unit_cost?: number;
        unit_price?: number;
        products?: {
          cost_price?: number;
          supplier_fee_value?: string | number;
          supplier_fee_type?: string;
          supplier_gateway_fee_value?: string | number;
          supplier_gateway_fee_type?: string;
        } | null;
        bling_order_items?: {
          products_bling?: {
            cost_price?: number;
          } | null;
        } | null;
      }>;

      const orderProducts = items.map((it) => {
        const p = it.products;
        const pb = it.bling_order_items?.products_bling;
        return {
          quantity: Number(it.quantity ?? 1),
          unit_price: Number(it.unit_price ?? 0),
          unit_cost: Number(it.unit_cost ?? p?.cost_price ?? pb?.cost_price ?? 0),
          supplier_fee_value: p?.supplier_fee_value,
          supplier_fee_type: p?.supplier_fee_type,
          supplier_gateway_fee_value: p?.supplier_gateway_fee_value,
          supplier_gateway_fee_type: p?.supplier_gateway_fee_type,
        };
      });

      const calculatedTotalProducts = orderProducts.reduce((s, p) => s + (p.unit_price * p.quantity), 0);
      const bo = order.bling_orders as {
        base_value?: number;
        total_products?: number;
        tiktok_reembolso_disabled?: boolean;
        tiktok_retorno_liquido?: number | null;
      } | null;

      const boBaseValue = Number(bo?.base_value ?? 0);
      const boTotalProducts = Number(bo?.total_products ?? 0);

      const effectiveTotalProducts = boTotalProducts > 0
        ? boTotalProducts
        : calculatedTotalProducts > 0
        ? calculatedTotalProducts
        : Number(order.total_amount ?? 0);

      const effectiveBaseValue = boBaseValue > 0
        ? boBaseValue
        : calculatedTotalProducts > 0
        ? calculatedTotalProducts
        : Number(order.total_amount ?? 0) - Number(order.discount_value ?? 0);

      const profitInput: OrderProfitInput = {
        order_id: order.id,
        total_amount: Number(order.total_amount ?? 0),
        total_products: effectiveTotalProducts,
        base_value: effectiveBaseValue,
        discount_value: Number(order.discount_value ?? 0),
        shipping_cost: Number(order.shipping_cost ?? 0),
        other_expenses: Number(order.other_expenses ?? 0),
        marketplace_commission: Number(order.marketplace_commission ?? 0),
        commission_rate: commissionRate,
        marketplace_fixed_fee: fixedFee,
        fixed_fee: fixedFee,
        tiktok_sfp_enabled: isTikTok,
        tiktok_reembolso_disabled: bo?.tiktok_reembolso_disabled === true,
        tiktok_retorno_liquido: bo?.tiktok_retorno_liquido != null ? Number(bo.tiktok_retorno_liquido) : null,
        reembolso_value: order.reembolso_value != null ? Number(order.reembolso_value) : null,
        is_free_sample: order.is_free_sample,
        is_personal_purchase: order.is_personal_purchase,
        marketplace: mpName,
        products: orderProducts,
      };

      const result = calcOrderProfit(profitInput, {
        commission_rate: commissionRate,
        fixed_fee: fixedFee,
      });

      const mktCost = mktCostMap.get(order.id) ?? 0;
      const hasReembolso = order.reembolso_value != null;
      const reembolsoOv = hasReembolso ? Number(order.reembolso_value) : null;

      const effectiveProfit = hasReembolso && reembolsoOv !== null && !isNaN(reembolsoOv)
        ? (reembolsoOv - result.totalProductCost - mktCost)
        : (result.realProfit - mktCost);

      return {
        id: order.id,
        orderNumber: String(order.order_number ?? ''),
        orderDate: this.parseOrderDate(order.order_date),
        totalAmount: Number(order.total_amount ?? 0),
        marketplaceCommission: Number(order.marketplace_commission ?? 0),
        realProfit: Math.round(effectiveProfit * 100) / 100,
        customerId: order.customer_id,
        marketplaceId: order.marketplace_id,
      };
    });
  }

  // ─── KPI Fetchers ────────────────────────────────────────────────────────────

  static async fetchRevenueData(
    organizationId: string,
    currentRange: DateRange,
    previousRange: DateRange,
    marketplaceId?: string | null
  ): Promise<{ current: number; previous: number }> {
    const orders = await this.fetchEnrichedOrders(organizationId, marketplaceId);
    const cur = orders.filter(o => o.orderDate >= currentRange.start && o.orderDate <= currentRange.end);
    const prev = orders.filter(o => o.orderDate >= previousRange.start && o.orderDate <= previousRange.end);
    return {
      current: cur.reduce((s, r) => s + r.totalAmount, 0),
      previous: prev.reduce((s, r) => s + r.totalAmount, 0),
    };
  }

  static async fetchFeesData(
    organizationId: string,
    currentRange: DateRange,
    previousRange: DateRange,
    marketplaceId?: string | null
  ): Promise<{ current: number; previous: number }> {
    const orders = await this.fetchEnrichedOrders(organizationId, marketplaceId);
    const cur = orders.filter(o => o.orderDate >= currentRange.start && o.orderDate <= currentRange.end);
    const prev = orders.filter(o => o.orderDate >= previousRange.start && o.orderDate <= previousRange.end);
    return {
      current: cur.reduce((s, r) => s + r.marketplaceCommission, 0),
      previous: prev.reduce((s, r) => s + r.marketplaceCommission, 0),
    };
  }

  static async fetchProfitData(
    organizationId: string,
    currentRange: DateRange,
    previousRange: DateRange,
    marketplaceId?: string | null
  ): Promise<{ current: number; previous: number }> {
    const orders = await this.fetchEnrichedOrders(organizationId, marketplaceId);
    const cur = orders.filter(o => o.orderDate >= currentRange.start && o.orderDate <= currentRange.end);
    const prev = orders.filter(o => o.orderDate >= previousRange.start && o.orderDate <= previousRange.end);
    return {
      current: Math.round(cur.reduce((s, r) => s + r.realProfit, 0) * 100) / 100,
      previous: Math.round(prev.reduce((s, r) => s + r.realProfit, 0) * 100) / 100,
    };
  }

  static async fetchCustomersData(
    organizationId: string,
    currentRange: DateRange,
    previousRange: DateRange,
    marketplaceId?: string | null
  ): Promise<{ current: number; previous: number }> {
    const orders = await this.fetchEnrichedOrders(organizationId, marketplaceId);
    const cur = orders.filter(o => o.orderDate >= currentRange.start && o.orderDate <= currentRange.end);
    const prev = orders.filter(o => o.orderDate >= previousRange.start && o.orderDate <= previousRange.end);
    return {
      current: new Set(cur.map(r => r.customerId).filter(Boolean)).size,
      previous: new Set(prev.map(r => r.customerId).filter(Boolean)).size,
    };
  }

  static async fetchProductsData(
    organizationId: string,
    marketplaceId?: string | null
  ): Promise<{ current: number; previous: number }> {
    let query = supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId);

    if (marketplaceId) query = query.eq('marketplace_id', marketplaceId);

    const { count, error } = await query;
    if (error) throw new Error(error.message);

    return { current: count ?? 0, previous: count ?? 0 };
  }

  // ─── Main KPI entry point ────────────────────────────────────────────────────

  static async fetchDashboardData(
    organizationId: string,
    period: TimePeriod,
    marketplaceId?: string | null
  ): Promise<DashboardKPIData> {
    const ranges = this.calculatePeriodRanges(period);

    const [enrichedOrders, productsData] = await Promise.all([
      this.fetchEnrichedOrders(organizationId, marketplaceId),
      this.fetchProductsData(organizationId, marketplaceId),
    ]);

    const isTotal = period === 'total';

    const currentOrders = isTotal
      ? enrichedOrders
      : enrichedOrders.filter(o => o.orderDate >= ranges.current.start && o.orderDate <= ranges.current.end);

    const previousOrders = isTotal
      ? []
      : enrichedOrders.filter(o => o.orderDate >= ranges.previous.start && o.orderDate <= ranges.previous.end);

    const revenueCurrent = currentOrders.reduce((s, r) => s + r.totalAmount, 0);
    const revenuePrevious = previousOrders.reduce((s, r) => s + r.totalAmount, 0);

    const feesCurrent = currentOrders.reduce((s, r) => s + r.marketplaceCommission, 0);
    const feesPrevious = previousOrders.reduce((s, r) => s + r.marketplaceCommission, 0);

    const profitCurrent = Math.round(currentOrders.reduce((s, r) => s + r.realProfit, 0) * 100) / 100;
    const profitPrevious = Math.round(previousOrders.reduce((s, r) => s + r.realProfit, 0) * 100) / 100;

    const customersCurrent = new Set(currentOrders.map(r => r.customerId).filter(Boolean)).size;
    const customersPrevious = new Set(previousOrders.map(r => r.customerId).filter(Boolean)).size;

    return {
      revenue: {
        current: revenueCurrent,
        previous: revenuePrevious,
        growth: isTotal ? null : this.calculateGrowth(revenueCurrent, revenuePrevious),
      },
      fees: {
        current: feesCurrent,
        previous: feesPrevious,
        growth: isTotal ? null : this.calculateGrowth(feesCurrent, feesPrevious),
      },
      profit: {
        current: profitCurrent,
        previous: profitPrevious,
        growth: isTotal ? null : this.calculateGrowth(profitCurrent, profitPrevious),
      },
      customers: {
        current: customersCurrent,
        previous: customersPrevious,
        growth: isTotal ? null : this.calculateGrowth(customersCurrent, customersPrevious),
      },
      products: {
        ...productsData,
        growth: isTotal ? null : this.calculateGrowth(productsData.current, productsData.previous),
      },
    };
  }

  // ─── Chart data ──────────────────────────────────────────────────────────────

  /**
   * Fetch daily/weekly conversion chart data.
   * Groups orders by order_date within the current period range and sums
   * total_amount (revenue), marketplace_commission (fees), and realProfit.
   *
   * For 'total' or 'year': buckets by month.
   * For 'month' or 'week': buckets by day.
   * For 'day': returns the single day as one bar.
   */
  static async fetchConversionChartData(
    organizationId: string,
    period: TimePeriod,
    marketplaceId?: string | null
  ): Promise<WeeklyConversionData[]> {
    const ranges = this.calculatePeriodRanges(period);
    const enrichedOrders = await this.fetchEnrichedOrders(organizationId, marketplaceId);

    const isTotal = period === 'total';
    const filteredOrders = isTotal
      ? enrichedOrders
      : enrichedOrders.filter(o => o.orderDate >= ranges.current.start && o.orderDate <= ranges.current.end);

    if (filteredOrders.length === 0) return [];

    // Bucket by month for total/year, by day for month/week/day
    const byMonth = period === 'total' || period === 'year';
    const ptMonths = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

    // Sort by orderDate ascending
    filteredOrders.sort((a, b) => a.orderDate.getTime() - b.orderDate.getTime());

    const buckets = new Map<string, { fees: number; revenue: number; profit: number }>();

    for (const o of filteredOrders) {
      const d = o.orderDate;
      let key: string;
      if (byMonth) {
        key = `${ptMonths[d.getMonth()]} ${d.getFullYear()}`;
      } else {
        const day = String(d.getDate()).padStart(2, '0');
        const mon = ptMonths[d.getMonth()];
        key = `${day} ${mon}`;
      }
      const existing = buckets.get(key) ?? { fees: 0, revenue: 0, profit: 0 };
      existing.fees += o.marketplaceCommission;
      existing.revenue += o.totalAmount;
      existing.profit += o.realProfit;
      buckets.set(key, existing);
    }

    return Array.from(buckets.entries()).map(([label, vals]) => ({
      week: label,
      day: label,
      fees: Math.round(vals.fees * 100) / 100,
      revenue: Math.round(vals.revenue * 100) / 100,
      profit: Math.round(vals.profit * 100) / 100,
      netProfit: Math.round(vals.profit * 100) / 100,
    }));
  }

  /**
   * Fetch leads chart data.
   * Categorises processed orders into 3 buckets based on realProfit:
   *   - "Sem Lucro": realProfit <= 0
   *   - "Lucro 1x":  realProfit > 0 (processed once)
   *   - "Qualificados": orders from customers who have >= 2 processed orders
   */
  static async fetchLeadsChartData(
    organizationId: string,
    period: TimePeriod,
    marketplaceId?: string | null
  ): Promise<LeadStatusData[]> {
    const ranges = this.calculatePeriodRanges(period);
    const enrichedOrders = await this.fetchEnrichedOrders(organizationId, marketplaceId);

    const isTotal = period === 'total';
    const filteredOrders = isTotal
      ? enrichedOrders
      : enrichedOrders.filter(o => o.orderDate >= ranges.current.start && o.orderDate <= ranges.current.end);

    if (filteredOrders.length === 0) return [];

    // Count processed orders per customer to identify "qualified" (2+ orders)
    const customerOrderCount = new Map<string, number>();
    for (const o of filteredOrders) {
      if (o.customerId) {
        customerOrderCount.set(o.customerId, (customerOrderCount.get(o.customerId) ?? 0) + 1);
      }
    }

    let semLucro = 0;
    let lucroPrimeiro = 0;
    let qualificados = 0;

    for (const o of filteredOrders) {
      const orderCount = o.customerId ? (customerOrderCount.get(o.customerId) ?? 1) : 1;
      if (orderCount >= 2) {
        qualificados++;
      } else if (o.realProfit > 0) {
        lucroPrimeiro++;
      } else {
        semLucro++;
      }
    }

    const total = semLucro + lucroPrimeiro + qualificados || 1;

    return [
      {
        status: 'sem_lucro',
        label: 'Sem Lucro Processado',
        count: semLucro,
        percentage: Math.round((semLucro / total) * 100),
        color: '#FFB800',
      },
      {
        status: 'lucro_1x',
        label: 'Lucro Processado 1x',
        count: lucroPrimeiro,
        percentage: Math.round((lucroPrimeiro / total) * 100),
        color: '#FF4D00',
      },
      {
        status: 'qualificados',
        label: 'Qualificados (2+x)',
        count: qualificados,
        percentage: Math.round((qualificados / total) * 100),
        color: '#7C3AED',
      },
    ];
  }

  /** Fetch marketplaces for this org (used by MarketplaceFilter). */
  static async fetchMarketplaces(organizationId: string): Promise<Array<{ id: string; name: string }>> {
    const { data, error } = await supabase
      .from('marketplaces')
      .select('id, name')
      .eq('organization_id', organizationId)
      .order('name');

    if (error) return [];
    return data ?? [];
  }
}
