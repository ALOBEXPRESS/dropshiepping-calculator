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
      reembolso_marketplace_enabled: o.reembolso_marketplace_enabled as boolean | undefined,
      reembolso_marketplace_value: o.reembolso_marketplace_value != null ? Number(o.reembolso_marketplace_value) : null,
      reembolso_fornecedor_enabled: o.reembolso_fornecedor_enabled as boolean | undefined,
      reembolso_fornecedor_value: o.reembolso_fornecedor_value != null ? Number(o.reembolso_fornecedor_value) : null,
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
          id?: string;
          sku?: string;
          name?: string;
          cost_price?: number;
          supplier_fee_value?: string | number;
          supplier_fee_type?: string;
          supplier_gateway_fee_value?: string | number;
          supplier_gateway_fee_type?: string;
        }
        interface DbOrderItem {
          id?: string;
          product_id?: string | null;
          product_name?: string | null;
          sku?: string | null;
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
          total_profit?: number | null;
          discount_value?: number;
          shipping_cost?: number;
          other_expenses?: number;
          marketplace_commission?: number;
          reembolso_value?: number | null;
          reembolso_marketplace_enabled?: boolean | null;
          reembolso_marketplace_value?: number | null;
          reembolso_fornecedor_enabled?: boolean | null;
          reembolso_fornecedor_value?: number | null;
          is_free_sample?: boolean | string;
          is_personal_purchase?: boolean | string;
          marketplace_id?: string;
          bling_order_id?: string;
          bling_orders?: DbBlingOrder | DbBlingOrder[] | null;
          marketplaces?: DbMarketplace | null;
          order_items?: DbOrderItem[];
        }

        let dbOrderMap = new Map<string, DbOrder>();
        let mktMap = new Map<string, DbMarketplace>();
        let mktByName = new Map<string, DbMarketplace>();
        let mktCostMap = new Map<string, number>();
        const productsById = new Map<string, DbProduct>();
        const productsBySku = new Map<string, DbProduct>();
        const productsByName = new Map<string, DbProduct>();

        const normalizeKey = (raw: string) => {
          const v = raw.trim();
          if (!v) return [];
          const beforeCor = v.split(/\s+Cor:/i)[0]?.trim() ?? '';
          const beforeSemi = v.split(';')[0]?.trim() ?? '';
          const out = [v];
          if (beforeCor && beforeCor !== v) out.push(beforeCor);
          if (beforeSemi && beforeSemi !== v) out.push(beforeSemi);
          return Array.from(new Set(out.filter(Boolean)));
        };

        if (allOrderIds.length > 0) {
          try {
            const [ordersRes, mktsRes, mktCostsRes, productsRes] = await Promise.all([
              supabase
                .from('orders')
                .select(`
                  id,
                  order_number,
                  total_amount,
                  total_profit,
                  discount_value,
                  shipping_cost,
                  other_expenses,
                  marketplace_commission,
                  reembolso_value,
                  reembolso_marketplace_enabled,
                  reembolso_marketplace_value,
                  reembolso_fornecedor_enabled,
                  reembolso_fornecedor_value,
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
                    id,
                    product_id,
                    product_name,
                    sku,
                    quantity,
                    unit_cost,
                    unit_price,
                    products (
                      id,
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
              supabase
                .from('products')
                .select('id, sku, name, cost_price, supplier_fee_value, supplier_fee_type, supplier_gateway_fee_value, supplier_gateway_fee_type')
                .or(`organization_id.eq.${organizationId},organization_id.is.null`),
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
            for (const p of (productsRes.data ?? []) as DbProduct[]) {
              if (p.id) productsById.set(p.id, p);
              if (p.sku) productsBySku.set(p.sku.trim(), p);
              if (p.name) {
                productsByName.set(p.name.trim(), p);
                for (const k of normalizeKey(p.name)) {
                  if (!productsByName.has(k)) productsByName.set(k, p);
                }
              }
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

          const orderProducts = (dbOrder.order_items ?? []).map((it) => {
            const candidateKeys = [
              String(it.sku ?? '').trim(),
              ...normalizeKey(String(it.product_name ?? '')),
            ].filter(Boolean);

            const lookup = (it.product_id ? productsById.get(it.product_id) : undefined)
              || candidateKeys.map(k => productsBySku.get(k)).find(Boolean)
              || candidateKeys.map(k => productsByName.get(k)).find(Boolean)
              || it.products;

            const rawUnitCost = Number(it.unit_cost ?? 0);
            const resolvedUnitCost = rawUnitCost > 0 ? rawUnitCost : Number(lookup?.cost_price ?? 0);

            return {
              quantity: it.quantity ?? 1,
              unit_price: it.unit_price ?? 0,
              unit_cost: resolvedUnitCost,
              supplier_fee_value: lookup?.supplier_fee_value != null ? String(lookup.supplier_fee_value) : undefined,
              supplier_fee_type: lookup?.supplier_fee_type != null ? String(lookup.supplier_fee_type) : undefined,
              supplier_gateway_fee_value: lookup?.supplier_gateway_fee_value != null ? String(lookup.supplier_gateway_fee_value) : undefined,
              supplier_gateway_fee_type: lookup?.supplier_gateway_fee_type != null ? String(lookup.supplier_gateway_fee_type) : undefined,
            };
          });

          const calculatedTotalProducts = orderProducts.reduce((s, p) => s + (p.unit_price * p.quantity), 0);
          const bo = Array.isArray(dbOrder.bling_orders) ? dbOrder.bling_orders[0] : dbOrder.bling_orders;
          const boBaseValue = Number(bo?.base_value ?? 0);
          const boTotalProducts = Number(bo?.total_products ?? 0);

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
            tiktok_reembolso_disabled: bo?.tiktok_reembolso_disabled === true,
            tiktok_retorno_liquido: bo?.tiktok_retorno_liquido != null ? Number(bo.tiktok_retorno_liquido) : undefined,
            reembolso_value: dbOrder.reembolso_value,
            reembolso_marketplace_enabled: dbOrder.reembolso_marketplace_enabled != null ? Boolean(dbOrder.reembolso_marketplace_enabled) : undefined,
            reembolso_marketplace_value: dbOrder.reembolso_marketplace_value,
            reembolso_fornecedor_enabled: dbOrder.reembolso_fornecedor_enabled != null ? Boolean(dbOrder.reembolso_fornecedor_enabled) : undefined,
            reembolso_fornecedor_value: dbOrder.reembolso_fornecedor_value,
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
          const hasReembolsoSaved = dbOrder.reembolso_fornecedor_enabled === true || dbOrder.reembolso_marketplace_enabled === true || dbOrder.reembolso_value != null;
          if (hasReembolsoSaved && dbOrder.total_profit != null && !isNaN(Number(dbOrder.total_profit))) {
            return Number(dbOrder.total_profit);
          }
          return Math.round((result.realProfit - mktCost) * 100) / 100;
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
