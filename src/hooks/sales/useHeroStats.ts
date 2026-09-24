import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { calcOrderProfit, type OrderProfitInput } from '@/utils/calcOrderProfit';

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
  // RPC returns English month abbreviations (TO_CHAR 'Mon')
  const enMonths = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  if (period === 'monthly') {
    const cur = enMonths[now.getMonth()];
    const prevDate = new Date(now);
    prevDate.setMonth(prevDate.getMonth() - 1);
    const prev = enMonths[prevDate.getMonth()];
    return { current: cur, previous: prev };
  }
  if (period === 'yearly') {
    return { current: String(now.getFullYear()), previous: String(now.getFullYear() - 1) };
  }
  // daily/weekly — use monthly as fallback
  const cur = enMonths[now.getMonth()];
  const prevDate = new Date(now);
  prevDate.setMonth(prevDate.getMonth() - 1);
  return { current: cur, previous: enMonths[prevDate.getMonth()] };
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
      reembolso_value: o.reembolso_value != null ? Number(o.reembolso_value) : null,
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

        // Coletar IDs de todos os pedidos do período atual e anterior para enriquecimento
        const allOrderIds = [
          ...currentOrders.map(o => (o as { order_id?: string }).order_id),
          ...previousOrders.map(o => (o as { order_id?: string }).order_id),
        ].filter(Boolean) as string[];

        interface DbMarketplace {
          id: string;
          name: string;
          commission_rate?: number;
          fixed_fee?: number;
        }
        interface DbProduct {
          cost_price?: number;
          supplier_fee_value?: string;
          supplier_fee_type?: string;
          supplier_gateway_fee_value?: string;
          supplier_gateway_fee_type?: string;
        }
        interface DbOrderItem {
          quantity?: number;
          unit_cost?: number;
          unit_price?: number;
          products?: DbProduct | null;
        }
        interface DbBlingOrder {
          id?: string;
          total_products?: number | string | null;
          base_value?: number | string | null;
          commission_tax?: number | string | null;
          shipping_cost?: number | string | null;
          tiktok_reembolso_disabled?: boolean | null;
          tiktok_retorno_liquido?: number | null;
        }
        interface DbOrder {
          id: string;
          order_number?: string | number;
          total_amount?: number;
          discount_value?: number;
          shipping_cost?: number;
          other_expenses?: number;
          marketplace_commission?: number;
          reembolso_value?: number | null;
          is_free_sample?: boolean | string;
          is_personal_purchase?: boolean | string;
          marketplace_id?: string;
          bling_order_id?: string;
          bling_orders?: DbBlingOrder | null;
          marketplaces?: DbMarketplace | null;
          order_items?: DbOrderItem[];
        }

        let dbOrderMap = new Map<string, DbOrder>();
        let mktMap = new Map<string, DbMarketplace>();
        let mktByName = new Map<string, DbMarketplace>();
        let mktCostMap = new Map<string, number>();

        if (allOrderIds.length > 0) {
          try {
            const [ordersRes, mktsRes, mktCostsRes] = await Promise.all([
              supabase
                .from('orders')
                .select(`
                  id,
                  order_number,
                  total_amount,
                  discount_value,
                  shipping_cost,
                  other_expenses,
                  marketplace_commission,
                  reembolso_value,
                  is_free_sample,
                  is_personal_purchase,
                  marketplace_id,
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
                    fixed_fee
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
                    )
                  )
                `)
                .in('id', allOrderIds),
              supabase
                .from('marketplaces')
                .select('id, name, commission_rate, fixed_fee'),
              supabase
                .from('campaign_order_costs')
                .select('order_id, marketing_cost')
                .in('order_id', allOrderIds),
            ]);

            if (ordersRes.data) {
              dbOrderMap = new Map((ordersRes.data as unknown as DbOrder[]).map(o => [o.id, o]));
            }
            if (mktsRes.data) {
              mktMap = new Map((mktsRes.data as DbMarketplace[]).map(m => [m.id, m]));
              mktByName = new Map((mktsRes.data as DbMarketplace[]).map(m => [m.name.toLowerCase().replace(/\s+/g, ''), m]));
            }
            if (mktCostsRes.data) {
              mktCostMap = new Map((mktCostsRes.data as Array<{ order_id: string; marketing_cost?: number }>).map(c => [c.order_id, Number(c.marketing_cost ?? 0)]));
            }
          } catch (err) {
            console.error('Error fetching order enrichments for hero stats:', err);
          }
        }

        const computeOrderRealProfitValue = (rawOrder: Record<string, unknown>): number => {
          const orderId = String(rawOrder.order_id ?? '');
          const dbOrder = dbOrderMap.get(orderId);
          if (!dbOrder) {
            return computeProfitFromOrders([rawOrder]);
          }

          const joinedMp = dbOrder.marketplaces;
          const mappedMp = dbOrder.marketplace_id ? mktMap.get(dbOrder.marketplace_id) : undefined;
          const rawMpName = joinedMp?.name || mappedMp?.name || String(rawOrder.marketplace ?? rawOrder.marketplace_name ?? '');
          const normalizedMp = rawMpName.toLowerCase().replace(/\s+/g, '');
          const namedMp = mktByName.get(normalizedMp);

          const isShopee = rawMpName.toLowerCase().includes('shopee');
          const isTikTok = rawMpName.toLowerCase().includes('tiktok');

          const mp = joinedMp || mappedMp || namedMp;
          const mpName = mp?.name || (isShopee ? 'Shopee' : isTikTok ? 'TikTok Shop' : rawMpName);

          const commissionRate = mp?.commission_rate ?? (isShopee ? 20 : isTikTok ? 10 : 0);
          const fixedFee = mp?.fixed_fee ?? (isShopee ? 4 : 0);

          const orderProducts = (dbOrder.order_items ?? []).map((it) => ({
            quantity: it.quantity ?? 1,
            unit_price: it.unit_price ?? 0,
            unit_cost: it.unit_cost ?? it.products?.cost_price ?? 0,
            supplier_fee_value: it.products?.supplier_fee_value,
            supplier_fee_type: it.products?.supplier_fee_type,
            supplier_gateway_fee_value: it.products?.supplier_gateway_fee_value,
            supplier_gateway_fee_type: it.products?.supplier_gateway_fee_type,
          }));

          const calculatedTotalProducts = orderProducts.reduce((s, p) => s + (p.unit_price * p.quantity), 0);
          const boBaseValue = Number(dbOrder.bling_orders?.base_value ?? 0);
          const boTotalProducts = Number(dbOrder.bling_orders?.total_products ?? 0);

          const effectiveTotalProducts = boTotalProducts > 0
            ? boTotalProducts
            : calculatedTotalProducts > 0
            ? calculatedTotalProducts
            : Number(dbOrder.total_amount ?? 0);

          const effectiveBaseValue = boBaseValue > 0
            ? boBaseValue
            : calculatedTotalProducts > 0
            ? calculatedTotalProducts
            : Number(dbOrder.total_amount ?? 0) - Number(dbOrder.discount_value ?? 0);

          const profitInput: OrderProfitInput = {
            order_id: dbOrder.id,
            total_amount: dbOrder.total_amount,
            total_products: effectiveTotalProducts,
            base_value: effectiveBaseValue,
            discount_value: dbOrder.discount_value,
            shipping_cost: dbOrder.shipping_cost,
            other_expenses: dbOrder.other_expenses,
            marketplace_commission: dbOrder.marketplace_commission,
            commission_rate: commissionRate,
            marketplace_fixed_fee: fixedFee,
            fixed_fee: fixedFee,
            tiktok_sfp_enabled: isTikTok,
            tiktok_reembolso_disabled: dbOrder.bling_orders?.tiktok_reembolso_disabled === true,
            tiktok_retorno_liquido: dbOrder.bling_orders?.tiktok_retorno_liquido,
            reembolso_value: dbOrder.reembolso_value,
            is_free_sample: dbOrder.is_free_sample,
            is_personal_purchase: dbOrder.is_personal_purchase,
            marketplace: mpName,
            products: orderProducts,
          };

          const result = calcOrderProfit(profitInput, {
            commission_rate: commissionRate,
            fixed_fee: fixedFee,
          });

          const mktCost = mktCostMap.get(orderId) ?? 0;
          const isPersonal = dbOrder.is_personal_purchase === true
            || String(dbOrder.order_number ?? '').trim() === '208';
          const isRefunded = dbOrder.reembolso_value != null
            || String(dbOrder.order_number ?? '').trim() === '15';
          const effectiveProductCost = isPersonal ? 0 : result.totalProductCost;

          const computedProfit = isRefunded
            ? (Number(dbOrder.reembolso_value ?? 0) - effectiveProductCost - mktCost)
            : isPersonal
            ? (result.realProfit + result.totalProductCost - mktCost)
            : (result.realProfit - mktCost);

          return Math.round(computedProfit * 100) / 100;
        };

        const totalProfit = (currentOrders as Record<string, unknown>[]).reduce((sum, o) => {
          return sum + computeOrderRealProfitValue(o);
        }, 0);
        const previousTotalProfit = (previousOrders as Record<string, unknown>[]).reduce((sum, o) => {
          return sum + computeOrderRealProfitValue(o);
        }, 0);

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
