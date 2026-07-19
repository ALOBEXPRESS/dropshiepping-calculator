import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { calcOrderProfit } from '@/utils/calcOrderProfit';

interface HeroStats {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  revenueChange?: number;
  ordersChange?: number;
  customersChange?: number;
  productsChange?: number;
  previousRevenue?: number;
}

// Maps period to current/previous period labels returned by get_revenue_report
const getPeriodLabels = (period: 'daily' | 'weekly' | 'monthly' | 'yearly') => {
  const now = new Date();
  const ptMonths = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

  if (period === 'monthly') {
    const cur = ptMonths[now.getMonth()];
    const prevDate = new Date(now);
    prevDate.setMonth(prevDate.getMonth() - 1);
    const prev = ptMonths[prevDate.getMonth()];
    return { current: cur, previous: prev };
  }
  if (period === 'yearly') {
    return { current: String(now.getFullYear()), previous: String(now.getFullYear() - 1) };
  }
  // daily/weekly — use monthly as fallback
  const cur = ptMonths[now.getMonth()];
  const prevDate = new Date(now);
  prevDate.setMonth(prevDate.getMonth() - 1);
  return { current: cur, previous: ptMonths[prevDate.getMonth()] };
};

type RpcPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

// Compute profit from an orders_data array (from RPC)
function computeProfitFromOrders(orders: Record<string, unknown>[]): number {
  return orders.reduce((sum, o) => {
    const products = (o.products as Record<string, unknown>[] | null) ?? [];
    const marketplaceName = String(o.marketplace ?? o.marketplace_name ?? '');
    const mpConfig = {
      commission_rate: Number(o.commission_rate ?? 0),
      fixed_fee: Number(o.marketplace_fixed_fee ?? o.fixed_fee ?? 0),
      affiliate_commission_rate: Number(o.affiliate_commission_rate ?? 0),
    };
    const input = {
      order_id: String(o.order_id ?? ''),
      total_amount: Number(o.total_amount ?? 0),
      total_products: Number(o.total_products ?? o.total_amount ?? 0),
      base_value: Number(o.base_value ?? 0),
      discount_value: Number(o.discount_value ?? 0),
      shipping_cost: Number(o.shipping_cost ?? 0),
      other_expenses: Number(o.other_expenses ?? 0),
      marketplace_commission: Number(o.marketplace_commission ?? 0),
      marketplace_fixed_fee: Number(o.marketplace_fixed_fee ?? 0),
      is_free_sample: o.is_free_sample as boolean | string | undefined,
      tiktok_sfp_enabled: o.tiktok_sfp_enabled as boolean | string | null | undefined,
      tiktok_reembolso_disabled: Boolean(o.tiktok_reembolso_disabled),
      tiktok_retorno_liquido: o.tiktok_retorno_liquido != null ? Number(o.tiktok_retorno_liquido) : null,
      marketplace: marketplaceName,
      products: products.map((p) => ({
        quantity: Number(p.quantity ?? 1),
        unit_cost: Number(p.unit_cost ?? 0),
        supplier_fee_value: p.supplier_fee_value as string | number | undefined,
        supplier_fee_type: String(p.supplier_fee_type ?? 'percent'),
        supplier_gateway_fee_value: p.supplier_gateway_fee_value as string | number | undefined,
        supplier_gateway_fee_type: String(p.supplier_gateway_fee_type ?? 'fixed'),
      })),
    };
    const { realProfit } = calcOrderProfit(input, mpConfig);
    return sum + realProfit;
  }, 0);
}

export const useHeroStats = (
  organizationId: string,
  period: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'monthly',
  refreshTrigger?: number
) => {
  const [stats, setStats] = useState<HeroStats>({
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalProducts: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      if (!organizationId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Use get_revenue_report RPC with yearly to get all months — same data as RevenueReportChart
        const rpcPeriod: RpcPeriod = (period === 'daily' || period === 'weekly') ? 'monthly' : period;
        const { data: rpcData, error: rpcError } = await supabase.rpc('get_revenue_report', {
          p_organization_id: organizationId,
          p_period: rpcPeriod,
        });
        if (rpcError) throw rpcError;

        const labels = getPeriodLabels(period);
        const rows = (rpcData ?? []) as Array<{ period_label: string; orders_data: Record<string, unknown>[] | null }>;

        const currentRow = rows.find((r) => r.period_label === labels.current);
        const previousRow = rows.find((r) => r.period_label === labels.previous);

        const currentOrders = currentRow?.orders_data ?? [];
        const previousOrders = previousRow?.orders_data ?? [];

        const totalProfit = computeProfitFromOrders(currentOrders as Record<string, unknown>[]);
        const previousTotalProfit = computeProfitFromOrders(previousOrders as Record<string, unknown>[]);

        const totalOrders = currentOrders.length;
        const previousTotalOrders = previousOrders.length;

        const currentUniqueCustomers = new Set(
          (currentOrders as Record<string, unknown>[]).map((o) => 
            (o.customer_name as string | null) || (o.lead_id as string | null) || (o.order_id as string)
          ).filter(Boolean)
        );
        const previousUniqueCustomers = new Set(
          (previousOrders as Record<string, unknown>[]).map((o) =>
            (o.customer_name as string | null) || (o.lead_id as string | null) || (o.order_id as string)
          ).filter(Boolean)
        );

        // Products sold = total quantity of items across all orders this period
        const currentProductsSold = (currentOrders as Record<string, unknown>[]).reduce((sum, o) => {
          const products = (o.products as Record<string, unknown>[] | null) ?? [];
          return sum + products.reduce((s, p) => s + Number(p.quantity ?? 1), 0);
        }, 0);
        const previousProductsSold = (previousOrders as Record<string, unknown>[]).reduce((sum, o) => {
          const products = (o.products as Record<string, unknown>[] | null) ?? [];
          return sum + products.reduce((s, p) => s + Number(p.quantity ?? 1), 0);
        }, 0);

        // Products count via DB (products don't come from RPC)
        const now = new Date();
        const currentStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const currentEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();
        const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
        const prevEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();

        const [{ count: productsCount }, { count: previousProductsCount }] = await Promise.all([
          supabase.from('products').select('*', { count: 'exact', head: true }).eq('organization_id', organizationId).gte('created_at', currentStart).lte('created_at', currentEnd),
          supabase.from('products').select('*', { count: 'exact', head: true }).eq('organization_id', organizationId).gte('created_at', prevStart).lte('created_at', prevEnd),
        ]);

        const totalCustomers = currentUniqueCustomers.size;
        const previousTotalCustomers = previousUniqueCustomers.size;

        const pct = (cur: number, prev: number) =>
          prev !== 0 ? ((cur - prev) / Math.abs(prev)) * 100 : cur !== 0 ? 100 : 0;

        setStats({
          totalRevenue: totalProfit,
          totalOrders,
          totalCustomers,
          totalProducts: currentProductsSold,
          revenueChange: Math.round(pct(totalProfit, previousTotalProfit)),
          ordersChange: Math.round(pct(totalOrders, previousTotalOrders)),
          customersChange: Math.round(pct(totalCustomers, previousTotalCustomers)),
          productsChange: Math.round(pct(currentProductsSold, previousProductsSold)),
          previousRevenue: previousTotalProfit,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar estatísticas');
        console.error('Error fetching hero stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [organizationId, period, refreshTrigger]);

  return { stats, loading, error };
};
