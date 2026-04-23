/**
 * Dashboard Service
 * 
 * Service layer for fetching and calculating dashboard KPI data from Supabase.
 * Now supports marketplace filtering for all metrics.
 * 
 * Features:
 * - Fetches revenue, fees, profit, products, and customers data
 * - Supports marketplace filtering
 * - Calculates growth trends comparing current vs previous periods
 * - Filters data by organization_id for multi-tenancy
 */

import { supabase } from '../lib/supabase';
import { calculatePeriodRanges as calculatePeriodRangesUtil } from '../utils/dateRangeCalculator';
import { calculateGrowth as calculateGrowthUtil } from '../utils/growthCalculator';
import type { 
  TimePeriod, 
  DateRange, 
  PeriodData, 
  DashboardKPIData
} from '../types/dashboard';

export class DashboardService {
  static calculatePeriodRanges(period: TimePeriod): PeriodData {
    try {
      return calculatePeriodRangesUtil(period);
    } catch (error) {
      console.error('[DashboardService] Error calculating period ranges:', error);
      throw new Error(`Failed to calculate period ranges: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static calculateGrowth(current: number, previous: number): number | null {
    try {
      return calculateGrowthUtil(current, previous);
    } catch (error) {
      console.error('[DashboardService] Error calculating growth:', error);
      throw new Error(`Failed to calculate growth: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Fetch revenue data (sum of total_amount from orders)
   */
  static async fetchRevenueData(
    currentRange: DateRange,
    previousRange: DateRange,
    marketplaceId?: string | null
  ): Promise<{ current: number; previous: number }> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('User not authenticated');

      const organizationId = user.id;

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

      const [currentResult, previousResult] = await Promise.all([currentQuery, previousQuery]);

      if (currentResult.error) throw new Error(`Failed to fetch current revenue: ${currentResult.error.message}`);
      if (previousResult.error) throw new Error(`Failed to fetch previous revenue: ${previousResult.error.message}`);

      const currentRevenue = currentResult.data?.reduce((sum, row) => sum + (row.total_amount ?? 0), 0) ?? 0;
      const previousRevenue = previousResult.data?.reduce((sum, row) => sum + (row.total_amount ?? 0), 0) ?? 0;

      return { current: currentRevenue, previous: previousRevenue };
    } catch (error) {
      console.error('[DashboardService] Error fetching revenue:', error);
      throw error;
    }
  }

  /**
   * Fetch marketplace fees (sum of marketplace_commission)
   */
  static async fetchFeesData(
    currentRange: DateRange,
    previousRange: DateRange,
    marketplaceId?: string | null
  ): Promise<{ current: number; previous: number }> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('User not authenticated');

      const organizationId = user.id;

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

      const [currentResult, previousResult] = await Promise.all([currentQuery, previousQuery]);

      if (currentResult.error) throw new Error(`Failed to fetch current fees: ${currentResult.error.message}`);
      if (previousResult.error) throw new Error(`Failed to fetch previous fees: ${previousResult.error.message}`);

      const currentFees = currentResult.data?.reduce((sum, row) => sum + (row.marketplace_commission ?? 0), 0) ?? 0;
      const previousFees = previousResult.data?.reduce((sum, row) => sum + (row.marketplace_commission ?? 0), 0) ?? 0;

      return { current: currentFees, previous: previousFees };
    } catch (error) {
      console.error('[DashboardService] Error fetching fees:', error);
      throw error;
    }
  }

  /**
   * Fetch profit data (sum of total_profit)
   */
  static async fetchProfitData(
    currentRange: DateRange,
    previousRange: DateRange,
    marketplaceId?: string | null
  ): Promise<{ current: number; previous: number }> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('User not authenticated');

      const organizationId = user.id;

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

      const [currentResult, previousResult] = await Promise.all([currentQuery, previousQuery]);

      if (currentResult.error) throw new Error(`Failed to fetch current profit: ${currentResult.error.message}`);
      if (previousResult.error) throw new Error(`Failed to fetch previous profit: ${previousResult.error.message}`);

      const currentProfit = currentResult.data?.reduce((sum, row) => sum + (row.total_profit ?? 0), 0) ?? 0;
      const previousProfit = previousResult.data?.reduce((sum, row) => sum + (row.total_profit ?? 0), 0) ?? 0;

      return { current: currentProfit, previous: previousProfit };
    } catch (error) {
      console.error('[DashboardService] Error fetching profit:', error);
      throw error;
    }
  }

  /**
   * Fetch customers count (only with processed_at NOT NULL)
   */
  static async fetchCustomersData(
    currentRange: DateRange,
    previousRange: DateRange,
    marketplaceId?: string | null
  ): Promise<{ current: number; previous: number }> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('User not authenticated');

      const organizationId = user.id;

      let currentQuery = supabase
        .from('orders')
        .select('customer_id')
        .eq('organization_id', organizationId)
        .not('customer_id', 'is', null)
        .not('processed_at', 'is', null) // Only customers with processed profit
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

      const [currentResult, previousResult] = await Promise.all([currentQuery, previousQuery]);

      if (currentResult.error) throw new Error(`Failed to fetch current customers: ${currentResult.error.message}`);
      if (previousResult.error) throw new Error(`Failed to fetch previous customers: ${previousResult.error.message}`);

      const currentCustomers = new Set(currentResult.data?.map(row => row.customer_id) ?? []).size;
      const previousCustomers = new Set(previousResult.data?.map(row => row.customer_id) ?? []).size;

      return { current: currentCustomers, previous: previousCustomers };
    } catch (error) {
      console.error('[DashboardService] Error fetching customers:', error);
      throw error;
    }
  }

  /**
   * Fetch products count (filtered by marketplace if provided)
   */
  static async fetchProductsData(
    marketplaceId?: string | null
  ): Promise<{ current: number; previous: number }> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('User not authenticated');

      const organizationId = user.id;

      let query = supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId);

      if (marketplaceId) {
        query = query.eq('marketplace_id', marketplaceId);
      }

      const { count, error } = await query;

      if (error) throw new Error(`Failed to fetch products: ${error.message}`);

      const productsCount = count ?? 0;

      return { current: productsCount, previous: productsCount };
    } catch (error) {
      console.error('[DashboardService] Error fetching products:', error);
      throw error;
    }
  }

  /**
   * Main entry point - fetch all dashboard data
   */
  static async fetchDashboardData(
    period: TimePeriod,
    marketplaceId?: string | null
  ): Promise<DashboardKPIData> {
    try {
      console.log('[DashboardService] Fetching dashboard data:', { period, marketplaceId: marketplaceId || 'all' });

      const ranges = this.calculatePeriodRanges(period);

      const [revenueData, feesData, profitData, customersData, productsData] = await Promise.all([
        this.fetchRevenueData(ranges.current, ranges.previous, marketplaceId),
        this.fetchFeesData(ranges.current, ranges.previous, marketplaceId),
        this.fetchProfitData(ranges.current, ranges.previous, marketplaceId),
        this.fetchCustomersData(ranges.current, ranges.previous, marketplaceId),
        this.fetchProductsData(marketplaceId)
      ]);

      return {
        revenue: {
          current: revenueData.current,
          previous: revenueData.previous,
          growth: this.calculateGrowth(revenueData.current, revenueData.previous)
        },
        fees: {
          current: feesData.current,
          previous: feesData.previous,
          growth: this.calculateGrowth(feesData.current, feesData.previous)
        },
        profit: {
          current: profitData.current,
          previous: profitData.previous,
          growth: this.calculateGrowth(profitData.current, profitData.previous)
        },
        customers: {
          current: customersData.current,
          previous: customersData.previous,
          growth: this.calculateGrowth(customersData.current, customersData.previous)
        },
        products: {
          current: productsData.current,
          previous: productsData.previous,
          growth: this.calculateGrowth(productsData.current, productsData.previous)
        }
      };
    } catch (error) {
      console.error('[DashboardService] Error fetching dashboard data:', error);
      throw error;
    }
  }

  /**
   * Fetch list of marketplaces for the organization
   */
  static async fetchMarketplaces(): Promise<Array<{ id: string; name: string }>> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('User not authenticated');

      const organizationId = user.id;

      const { data, error } = await supabase
        .from('marketplaces')
        .select('id, name')
        .eq('organization_id', organizationId)
        .order('name');

      if (error) throw new Error(`Failed to fetch marketplaces: ${error.message}`);

      return data || [];
    } catch (error) {
      console.error('[DashboardService] Error fetching marketplaces:', error);
      throw error;
    }
  }
}
