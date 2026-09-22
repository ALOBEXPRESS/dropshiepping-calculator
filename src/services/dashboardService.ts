/**
 * Dashboard Service
 *
 * Service layer for fetching and calculating dashboard KPI data from Supabase.
 * All methods receive organizationId as a parameter — callers are responsible
 * for resolving it via organization_members (same pattern as Sales.tsx).
 */

import { supabase } from '../lib/supabase';
import { calculatePeriodRanges as calculatePeriodRangesUtil } from '../utils/dateRangeCalculator';
import { calculateGrowth as calculateGrowthUtil } from '../utils/growthCalculator';
import type {
  TimePeriod,
  DateRange,
  PeriodData,
  DashboardKPIData,
  WeeklyConversionData,
  LeadStatusData,
} from '../types/dashboard';

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

  // ─── KPI Fetchers ────────────────────────────────────────────────────────────

  static async fetchRevenueData(
    organizationId: string,
    currentRange: DateRange,
    previousRange: DateRange,
    marketplaceId?: string | null
  ): Promise<{ current: number; previous: number }> {
    let currentQuery = supabase
      .from('orders')
      .select('total_amount')
      .eq('organization_id', organizationId)
      .gte('order_date', currentRange.start.toISOString())
      .lte('order_date', currentRange.end.toISOString());

    let previousQuery = supabase
      .from('orders')
      .select('total_amount')
      .eq('organization_id', organizationId)
      .gte('order_date', previousRange.start.toISOString())
      .lte('order_date', previousRange.end.toISOString());

    if (marketplaceId) {
      currentQuery = currentQuery.eq('marketplace_id', marketplaceId);
      previousQuery = previousQuery.eq('marketplace_id', marketplaceId);
    }

    const [cur, prev] = await Promise.all([currentQuery, previousQuery]);
    if (cur.error) throw new Error(cur.error.message);
    if (prev.error) throw new Error(prev.error.message);

    return {
      current: cur.data?.reduce((s, r) => s + (r.total_amount ?? 0), 0) ?? 0,
      previous: prev.data?.reduce((s, r) => s + (r.total_amount ?? 0), 0) ?? 0,
    };
  }

  static async fetchFeesData(
    organizationId: string,
    currentRange: DateRange,
    previousRange: DateRange,
    marketplaceId?: string | null
  ): Promise<{ current: number; previous: number }> {
    let currentQuery = supabase
      .from('orders')
      .select('marketplace_commission')
      .eq('organization_id', organizationId)
      .gte('order_date', currentRange.start.toISOString())
      .lte('order_date', currentRange.end.toISOString());

    let previousQuery = supabase
      .from('orders')
      .select('marketplace_commission')
      .eq('organization_id', organizationId)
      .gte('order_date', previousRange.start.toISOString())
      .lte('order_date', previousRange.end.toISOString());

    if (marketplaceId) {
      currentQuery = currentQuery.eq('marketplace_id', marketplaceId);
      previousQuery = previousQuery.eq('marketplace_id', marketplaceId);
    }

    const [cur, prev] = await Promise.all([currentQuery, previousQuery]);
    if (cur.error) throw new Error(cur.error.message);
    if (prev.error) throw new Error(prev.error.message);

    return {
      current: cur.data?.reduce((s, r) => s + (r.marketplace_commission ?? 0), 0) ?? 0,
      previous: prev.data?.reduce((s, r) => s + (r.marketplace_commission ?? 0), 0) ?? 0,
    };
  }

  static async fetchProfitData(
    organizationId: string,
    currentRange: DateRange,
    previousRange: DateRange,
    marketplaceId?: string | null
  ): Promise<{ current: number; previous: number }> {
    let currentQuery = supabase
      .from('orders')
      .select('total_profit')
      .eq('organization_id', organizationId)
      .gte('order_date', currentRange.start.toISOString())
      .lte('order_date', currentRange.end.toISOString());

    let previousQuery = supabase
      .from('orders')
      .select('total_profit')
      .eq('organization_id', organizationId)
      .gte('order_date', previousRange.start.toISOString())
      .lte('order_date', previousRange.end.toISOString());

    if (marketplaceId) {
      currentQuery = currentQuery.eq('marketplace_id', marketplaceId);
      previousQuery = previousQuery.eq('marketplace_id', marketplaceId);
    }

    const [cur, prev] = await Promise.all([currentQuery, previousQuery]);
    if (cur.error) throw new Error(cur.error.message);
    if (prev.error) throw new Error(prev.error.message);

    return {
      current: cur.data?.reduce((s, r) => s + (r.total_profit ?? 0), 0) ?? 0,
      previous: prev.data?.reduce((s, r) => s + (r.total_profit ?? 0), 0) ?? 0,
    };
  }

  static async fetchCustomersData(
    organizationId: string,
    currentRange: DateRange,
    previousRange: DateRange,
    marketplaceId?: string | null
  ): Promise<{ current: number; previous: number }> {
    let currentQuery = supabase
      .from('orders')
      .select('customer_id')
      .eq('organization_id', organizationId)
      .not('customer_id', 'is', null)
      .not('processed_at', 'is', null)
      .gte('order_date', currentRange.start.toISOString())
      .lte('order_date', currentRange.end.toISOString());

    let previousQuery = supabase
      .from('orders')
      .select('customer_id')
      .eq('organization_id', organizationId)
      .not('customer_id', 'is', null)
      .not('processed_at', 'is', null)
      .gte('order_date', previousRange.start.toISOString())
      .lte('order_date', previousRange.end.toISOString());

    if (marketplaceId) {
      currentQuery = currentQuery.eq('marketplace_id', marketplaceId);
      previousQuery = previousQuery.eq('marketplace_id', marketplaceId);
    }

    const [cur, prev] = await Promise.all([currentQuery, previousQuery]);
    if (cur.error) throw new Error(cur.error.message);
    if (prev.error) throw new Error(prev.error.message);

    return {
      current: new Set(cur.data?.map(r => r.customer_id) ?? []).size,
      previous: new Set(prev.data?.map(r => r.customer_id) ?? []).size,
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

    const [revenueData, feesData, profitData, customersData, productsData] = await Promise.all([
      this.fetchRevenueData(organizationId, ranges.current, ranges.previous, marketplaceId),
      this.fetchFeesData(organizationId, ranges.current, ranges.previous, marketplaceId),
      this.fetchProfitData(organizationId, ranges.current, ranges.previous, marketplaceId),
      this.fetchCustomersData(organizationId, ranges.current, ranges.previous, marketplaceId),
      this.fetchProductsData(organizationId, marketplaceId),
    ]);

    return {
      revenue: { ...revenueData, growth: this.calculateGrowth(revenueData.current, revenueData.previous) },
      fees: { ...feesData, growth: this.calculateGrowth(feesData.current, feesData.previous) },
      profit: { ...profitData, growth: this.calculateGrowth(profitData.current, profitData.previous) },
      customers: { ...customersData, growth: this.calculateGrowth(customersData.current, customersData.previous) },
      products: { ...productsData, growth: this.calculateGrowth(productsData.current, productsData.previous) },
    };
  }

  // ─── Chart data ──────────────────────────────────────────────────────────────

  /**
   * Fetch daily/weekly conversion chart data.
   * Groups orders by order_date within the current period range and sums
   * total_amount (revenue), marketplace_commission (fees), and total_profit.
   *
   * For 'total' or 'year': buckets by month (last 6 months shown).
   * For 'month' or 'week': buckets by day.
   * For 'day': returns the single day as one bar.
   */
  static async fetchConversionChartData(
    organizationId: string,
    period: TimePeriod,
    marketplaceId?: string | null
  ): Promise<WeeklyConversionData[]> {
    const ranges = this.calculatePeriodRanges(period);

    let query = supabase
      .from('orders')
      .select('order_date, total_amount, marketplace_commission, total_profit')
      .eq('organization_id', organizationId)
      .gte('order_date', ranges.current.start.toISOString())
      .lte('order_date', ranges.current.end.toISOString())
      .order('order_date', { ascending: true });

    if (marketplaceId) query = query.eq('marketplace_id', marketplaceId);

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) return [];

    // Bucket by month for total/year, by day for month/week/day
    const byMonth = period === 'total' || period === 'year';

    const ptMonths = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

    const buckets = new Map<string, { fees: number; revenue: number; profit: number }>();

    for (const row of data) {
      if (!row.order_date) continue;
      const d = new Date(row.order_date);
      let key: string;
      if (byMonth) {
        key = `${ptMonths[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
      } else {
        const day = String(d.getUTCDate()).padStart(2, '0');
        const mon = ptMonths[d.getUTCMonth()];
        key = `${day} ${mon}`;
      }
      const existing = buckets.get(key) ?? { fees: 0, revenue: 0, profit: 0 };
      existing.fees += Number(row.marketplace_commission ?? 0);
      existing.revenue += Number(row.total_amount ?? 0);
      existing.profit += Number(row.total_profit ?? 0);
      buckets.set(key, existing);
    }

    // For 'total' keep last 6 months; otherwise keep as-is
    let entries = Array.from(buckets.entries());
    if (byMonth) entries = entries.slice(-6);

    return entries.map(([label, vals]) => ({
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
   * Categorises processed orders into 3 buckets based on total_profit:
   *   - "Sem Lucro": total_profit <= 0
   *   - "Lucro 1x":  total_profit > 0 (processed once)
   *   - "Qualificados": orders from customers who have >= 2 processed orders
   */
  static async fetchLeadsChartData(
    organizationId: string,
    period: TimePeriod,
    marketplaceId?: string | null
  ): Promise<LeadStatusData[]> {
    const ranges = this.calculatePeriodRanges(period);

    let query = supabase
      .from('orders')
      .select('id, customer_id, total_profit')
      .eq('organization_id', organizationId)
      .not('processed_at', 'is', null)
      .gte('order_date', ranges.current.start.toISOString())
      .lte('order_date', ranges.current.end.toISOString());

    if (marketplaceId) query = query.eq('marketplace_id', marketplaceId);

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) return [];

    // Count processed orders per customer to identify "qualified" (2+ orders)
    const customerOrderCount = new Map<string, number>();
    for (const row of data) {
      if (row.customer_id) {
        customerOrderCount.set(row.customer_id, (customerOrderCount.get(row.customer_id) ?? 0) + 1);
      }
    }

    let semLucro = 0;
    let lucroPrimeiro = 0;
    let qualificados = 0;

    for (const row of data) {
      const orderCount = row.customer_id ? (customerOrderCount.get(row.customer_id) ?? 1) : 1;
      if (orderCount >= 2) {
        qualificados++;
      } else if ((row.total_profit ?? 0) > 0) {
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
