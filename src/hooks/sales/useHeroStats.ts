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

// Função para obter range de datas baseado no período
const getDateRange = (period: 'daily' | 'weekly' | 'monthly' | 'yearly') => {
  const now = new Date();
  const currentStart = new Date(now);
  const currentEnd = new Date(now);
  const previousStart = new Date(now);
  const previousEnd = new Date(now);

  switch (period) {
    case 'daily': {
      currentStart.setHours(0, 0, 0, 0);
      currentEnd.setHours(23, 59, 59, 999);
      previousStart.setDate(previousStart.getDate() - 1);
      previousStart.setHours(0, 0, 0, 0);
      previousEnd.setDate(previousEnd.getDate() - 1);
      previousEnd.setHours(23, 59, 59, 999);
      break;
    }
    case 'weekly': {
      const dayOfWeek = now.getDay();
      currentStart.setDate(now.getDate() - dayOfWeek);
      currentStart.setHours(0, 0, 0, 0);
      currentEnd.setHours(23, 59, 59, 999);
      previousStart.setDate(currentStart.getDate() - 7);
      previousStart.setHours(0, 0, 0, 0);
      previousEnd.setDate(currentStart.getDate() - 1);
      previousEnd.setHours(23, 59, 59, 999);
      break;
    }
    case 'monthly': {
      currentStart.setDate(1);
      currentStart.setHours(0, 0, 0, 0);
      currentEnd.setMonth(currentEnd.getMonth() + 1, 0);
      currentEnd.setHours(23, 59, 59, 999);
      previousStart.setMonth(previousStart.getMonth() - 1, 1);
      previousStart.setHours(0, 0, 0, 0);
      previousEnd.setDate(0);
      previousEnd.setHours(23, 59, 59, 999);
      break;
    }
    case 'yearly': {
      currentStart.setMonth(0, 1);
      currentStart.setHours(0, 0, 0, 0);
      currentEnd.setMonth(11, 31);
      currentEnd.setHours(23, 59, 59, 999);
      previousStart.setFullYear(previousStart.getFullYear() - 1, 0, 1);
      previousStart.setHours(0, 0, 0, 0);
      previousEnd.setFullYear(previousEnd.getFullYear() - 1, 11, 31);
      previousEnd.setHours(23, 59, 59, 999);
      break;
    }
  }

  return {
    current: { start: currentStart.toISOString(), end: currentEnd.toISOString() },
    previous: { start: previousStart.toISOString(), end: previousEnd.toISOString() },
  };
};

// Build product items map grouped by order_id from order_items rows
function buildItemsByOrder(
  orderItems: Record<string, unknown>[]
): Record<string, unknown[]> {
  return orderItems.reduce((acc: Record<string, unknown[]>, item: Record<string, unknown>) => {
    const orderId = item.order_id as string;
    if (!acc[orderId]) acc[orderId] = [];
    acc[orderId].push({
      quantity: item.quantity,
      unit_cost: item.unit_cost,
      supplier_fee_value: (item.products as Record<string, unknown>)?.supplier_fee_value || '0',
      supplier_fee_type: (item.products as Record<string, unknown>)?.supplier_fee_type || 'percent',
      supplier_gateway_fee_value:
        (item.products as Record<string, unknown>)?.supplier_gateway_fee_value || '0',
      supplier_gateway_fee_type:
        (item.products as Record<string, unknown>)?.supplier_gateway_fee_type || 'fixed',
    });
    return acc;
  }, {});
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
        const dateRange = getDateRange(period);

        // ── Current period orders ─────────────────────────────────────────
        const { data: currentOrders, error: currentOrdersError } = await supabase
          .from('orders')
          .select(`
            id,
            customer_id,
            lead_id,
            total_amount,
            discount_value,
            bling_order_id,
            marketplace_id,
            shipping_cost,
            other_expenses,
            marketplace_commission,
            is_free_sample,
            order_date
          `)
          .eq('organization_id', organizationId)
          .gte('order_date', dateRange.current.start)
          .lte('order_date', dateRange.current.end)
          .not('order_date', 'is', null);

        if (currentOrdersError) throw currentOrdersError;

        const currentOrders_ = currentOrders ?? [];
        const orderIds = currentOrders_.map((o) => o.id);

        // ── bling_orders → total_products ─────────────────────────────────
        const blingOrderIds = currentOrders_
          .map((o) => (o as unknown as { bling_order_id?: string }).bling_order_id)
          .filter(Boolean) as string[];
        const blingTotalProducts: Record<string, number> = {};
        if (blingOrderIds.length > 0) {
          const { data: blingRows } = await supabase
            .from('bling_orders')
            .select('id, total_products')
            .in('id', blingOrderIds);
          (blingRows ?? []).forEach((bo: { id: string; total_products?: number }) => {
            blingTotalProducts[bo.id] = Number(bo.total_products ?? 0);
          });
        }

        // ── Marketplaces (with affiliate_commission_rate) ─────────────────
        const marketplaceIds = [
          ...new Set(currentOrders_.map((o) => o.marketplace_id).filter(Boolean)),
        ];
        let marketplaces: { id: string; name: string; commission_rate: number; fixed_fee: number; affiliate_commission_rate?: number }[] = [];
        if (marketplaceIds.length > 0) {
          const { data: mpData, error: marketplacesError } = await supabase
            .from('marketplaces')
            .select('id, name, commission_rate, fixed_fee, affiliate_commission_rate')
            .in('id', marketplaceIds);
          if (marketplacesError) throw marketplacesError;
          marketplaces = mpData ?? [];
        }

        const marketplaceMap = (marketplaces ?? []).reduce(
          (acc: Record<string, string>, m: { id: string; name: string }) => {
            acc[m.id] = m.name;
            return acc;
          },
          {}
        );
        const marketplaceConfigMap = (marketplaces ?? []).reduce(
          (
            acc: Record<
              string,
              { commission_rate: number; fixed_fee: number; affiliate_commission_rate: number }
            >,
            m: {
              id: string;
              commission_rate: number;
              fixed_fee: number;
              affiliate_commission_rate?: number;
            }
          ) => {
            acc[m.id] = {
              commission_rate: Number(m.commission_rate ?? 0),
              fixed_fee: Number(m.fixed_fee ?? 0),
              affiliate_commission_rate: Number(m.affiliate_commission_rate ?? 0),
            };
            return acc;
          },
          {}
        );

        // ── Order items ───────────────────────────────────────────────────
        let orderItemsRaw: unknown[] = [];
        if (orderIds.length > 0) {
          const { data: rawItems, error: itemsError } = await supabase
            .from('order_items')
            .select(`
              order_id,
              quantity,
              unit_cost,
              products!inner(
                supplier_fee_value,
                supplier_fee_type,
                supplier_gateway_fee_value,
                supplier_gateway_fee_type
              )
            `)
            .in('order_id', orderIds);
          if (itemsError) throw itemsError;
          orderItemsRaw = rawItems ?? [];
        }

        const itemsByOrder = buildItemsByOrder(
          (orderItemsRaw ?? []) as Record<string, unknown>[]
        );

        // ── Affiliates map — skip gracefully if table absent ──────────────
        const affiliateByOrderId: Record<string, boolean> = {};
        if (orderIds.length > 0) {
          try {
            const { data: affiliateRows } = await supabase
              .from('order_affiliates')
              .select('order_id')
              .in('order_id', orderIds);
            (affiliateRows ?? []).forEach((r: { order_id: string }) => {
              affiliateByOrderId[r.order_id] = true;
            });
          } catch {
            // table may not exist — affiliate commission will be 0
          }
        }

        // ── Compute current profit ────────────────────────────────────────
        const totalProfit = currentOrders_
          .filter((o) => itemsByOrder[o.id]?.length > 0)
          .reduce((sum, o) => {
            const marketplaceName = o.marketplace_id
              ? (marketplaceMap[o.marketplace_id] ?? '')
              : '';
            const mpConfig = o.marketplace_id
              ? marketplaceConfigMap[o.marketplace_id]
              : undefined;
            const blingOrderId = (o as unknown as { bling_order_id?: string }).bling_order_id;
            const totalProducts = blingOrderId
              ? (blingTotalProducts[blingOrderId] ?? Number(o.total_amount ?? 0))
              : Number(o.total_amount ?? 0);

            const input = {
              order_id: o.id,
              total_amount: Number(o.total_amount ?? 0),
              total_products: totalProducts,
              discount_value: Number(o.discount_value ?? 0),
              shipping_cost: Number(o.shipping_cost ?? 0),
              other_expenses: Number(o.other_expenses ?? 0),
              marketplace_commission: Number(o.marketplace_commission ?? 0),
              is_free_sample: o.is_free_sample,
              tiktok_reembolso_disabled: undefined,
              tiktok_retorno_liquido: undefined,
              marketplace: marketplaceName,
              products: itemsByOrder[o.id] as {
                quantity: number;
                unit_cost: number;
                supplier_fee_value: string;
                supplier_fee_type: string;
                supplier_gateway_fee_value: string;
                supplier_gateway_fee_type: string;
              }[],
            };

            const { realProfit } = calcOrderProfit(input, mpConfig, affiliateByOrderId[o.id]);
            return sum + realProfit;
          }, 0);

        // ── Previous period orders ────────────────────────────────────────
        const { data: previousOrdersData, error: previousOrdersError } = await supabase
          .from('orders')
          .select(`
            id,
            customer_id,
            lead_id,
            total_amount,
            discount_value,
            marketplace_id,
            shipping_cost,
            other_expenses,
            marketplace_commission,
            is_free_sample,
            order_date
          `)
          .eq('organization_id', organizationId)
          .gte('order_date', dateRange.previous.start)
          .lte('order_date', dateRange.previous.end)
          .not('order_date', 'is', null);

        if (previousOrdersError) throw previousOrdersError;

        const previousOrders_ = previousOrdersData ?? [];
        const previousOrderIds = previousOrders_.map((o) => o.id);
        let previousTotalProfit = 0;

        if (previousOrderIds.length > 0) {
          const { data: prevItemsRaw } = await supabase
            .from('order_items')
            .select(`
              order_id,
              quantity,
              unit_cost,
              products!inner(
                supplier_fee_value,
                supplier_fee_type,
                supplier_gateway_fee_value,
                supplier_gateway_fee_type
              )
            `)
            .in('order_id', previousOrderIds);

          const prevItemsByOrder = buildItemsByOrder(
            (prevItemsRaw ?? []) as Record<string, unknown>[]
          );

          const prevAffiliateByOrderId: Record<string, boolean> = {};
          try {
            const { data: prevAffRows } = await supabase
              .from('order_affiliates')
              .select('order_id')
              .in('order_id', previousOrderIds);
            (prevAffRows ?? []).forEach((r: { order_id: string }) => {
              prevAffiliateByOrderId[r.order_id] = true;
            });
          } catch {
            // table may not exist
          }

          previousTotalProfit = previousOrders_
            .filter((o) => prevItemsByOrder[o.id]?.length > 0)
            .reduce((sum, o) => {
              const marketplaceName = o.marketplace_id
                ? (marketplaceMap[o.marketplace_id] ?? '')
                : '';
              const mpConfig = o.marketplace_id
                ? marketplaceConfigMap[o.marketplace_id]
                : undefined;

              const input = {
                order_id: o.id,
                total_amount: Number(o.total_amount ?? 0),
                total_products: Number(o.total_amount ?? 0),
                discount_value: Number(o.discount_value ?? 0),
                shipping_cost: Number(o.shipping_cost ?? 0),
                other_expenses: Number(o.other_expenses ?? 0),
                marketplace_commission: Number(o.marketplace_commission ?? 0),
                is_free_sample: o.is_free_sample,
                tiktok_reembolso_disabled: undefined,
                tiktok_retorno_liquido: undefined,
                marketplace: marketplaceName,
                products: prevItemsByOrder[o.id] as {
                  quantity: number;
                  unit_cost: number;
                  supplier_fee_value: string;
                  supplier_fee_type: string;
                  supplier_gateway_fee_value: string;
                  supplier_gateway_fee_type: string;
                }[],
              };

              const { realProfit } = calcOrderProfit(
                input,
                mpConfig,
                prevAffiliateByOrderId[o.id]
              );
              return sum + realProfit;
            }, 0);
        }

        // ── Products count ────────────────────────────────────────────────
        const { count: productsCount, error: productsError } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', organizationId)
          .gte('created_at', dateRange.current.start)
          .lte('created_at', dateRange.current.end);

        if (productsError) throw productsError;

        const { count: previousProductsCount, error: previousProductsError } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', organizationId)
          .gte('created_at', dateRange.previous.start)
          .lte('created_at', dateRange.previous.end);

        if (previousProductsError) throw previousProductsError;

        // ── Unique customers ──────────────────────────────────────────────
        const processedCurrentOrders = currentOrders_.filter(
          (o) => itemsByOrder[o.id]?.length > 0
        );
        const currentUniqueCustomers = new Set(
          processedCurrentOrders
            .map(
              (o) =>
                (o as unknown as { lead_id?: string }).lead_id ||
                (o as unknown as { customer_id?: string }).customer_id
            )
            .filter(Boolean)
        );
        const previousUniqueCustomers = new Set(
          previousOrders_
            .map(
              (o) =>
                (o as unknown as { lead_id?: string }).lead_id ||
                (o as unknown as { customer_id?: string }).customer_id
            )
            .filter(Boolean)
        );

        const totalOrders = processedCurrentOrders.length;
        const previousTotalOrders = previousOrders_.length;
        const totalCustomers = currentUniqueCustomers.size;
        const previousTotalCustomers = previousUniqueCustomers.size;

        // ── % changes ─────────────────────────────────────────────────────
        const revenueChange =
          previousTotalProfit !== 0
            ? ((totalProfit - previousTotalProfit) / Math.abs(previousTotalProfit)) * 100
            : totalProfit !== 0
            ? 100
            : 0;

        const ordersChange =
          previousTotalOrders > 0
            ? ((totalOrders - previousTotalOrders) / previousTotalOrders) * 100
            : totalOrders > 0
            ? 100
            : 0;

        const customersChange =
          previousTotalCustomers > 0
            ? ((totalCustomers - previousTotalCustomers) / previousTotalCustomers) * 100
            : totalCustomers > 0
            ? 100
            : 0;

        const productsChange =
          (previousProductsCount || 0) > 0
            ? (((productsCount || 0) - (previousProductsCount || 0)) /
                (previousProductsCount || 0)) *
              100
            : (productsCount || 0) > 0
            ? 100
            : 0;

        setStats({
          totalRevenue: totalProfit,
          totalOrders,
          totalCustomers,
          totalProducts: productsCount || 0,
          revenueChange: Math.round(revenueChange),
          ordersChange: Math.round(ordersChange),
          customersChange: Math.round(customersChange),
          productsChange: Math.round(productsChange),
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
