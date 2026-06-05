import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface HeroStats {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  revenueChange?: number;
  ordersChange?: number;
  customersChange?: number;
  productsChange?: number;
}

interface OrderWithProducts {
  order_id: string;
  customer_id: string;
  total_amount: number;
  total_products: number;
  discount_value: number;
  marketplace: string;
  shipping_cost: number;
  other_expenses: number;
  marketplace_commission: number;
  commission_rate: number;
  fixed_fee: number;
  is_free_sample: boolean;
  order_date: string;
  products: {
    quantity: number;
    unit_cost: number;
    supplier_fee_value: string;
    supplier_fee_type: string;
    supplier_gateway_fee_value: string;
    supplier_gateway_fee_type: string;
  }[];
}

// Função removida — taxas Shopee agora vêm do marketplace join

// Função para calcular o lucro real de um pedido — espelha computeOrderRealProfit do chart
const calculateOrderProfit = (order: OrderWithProducts): number => {
  const totalAmount = Number(order.total_amount ?? 0);
  const isFreeSample = order.is_free_sample === true;
  const isTikTok = (order.marketplace ?? '').toLowerCase().includes('tiktok');

  const totalBaseCost = order.products.reduce((sum, p) => {
    return sum + Number(p.unit_cost ?? 0) * Number(p.quantity ?? 1);
  }, 0);

  const supFeeProduct = order.products.reduce((best, p) => {
    const v = Number(p.supplier_fee_value ?? 0);
    return v > Number(best?.supplier_fee_value ?? 0) ? p : best;
  }, order.products[0]);

  const supFeeVal = Number(supFeeProduct?.supplier_fee_value ?? 0);
  const supFeeType = supFeeProduct?.supplier_fee_type ?? 'percent';
  const productGatewayFee = Number(supFeeProduct?.supplier_gateway_fee_value ?? 2);

  const isDogama = isTikTok || supFeeVal > 0;
  const DEFAULT_SUPPLIER_FEE_PERCENT = 6;
  const effectiveSupFeePercent = isDogama
    ? (supFeeType === 'percent' && supFeeVal > 0 ? supFeeVal : DEFAULT_SUPPLIER_FEE_PERCENT)
    : 0;
  const orderSupplierFee = isDogama ? (totalBaseCost * effectiveSupFeePercent) / 100 : 0;
  const orderGatewayFee = isDogama ? productGatewayFee : 0;
  const totalProductCost = Math.round((totalBaseCost + orderSupplierFee + orderGatewayFee) * 100) / 100;

  // Preços de venda — TikTok usa total_products como bruto
  const totalProductsValue = Number(order.total_products ?? totalAmount);
  const activeDiscount = Number(order.discount_value ?? 0);
  const precoVendaBruto = isTikTok ? (totalProductsValue > 0 ? totalProductsValue : totalAmount) : totalAmount;
  const precoVendaPagoCliente = isTikTok ? precoVendaBruto - activeDiscount : totalAmount;

  // Marketplace fees
  const commissionRate = Number(order.commission_rate ?? 0);
  const fixedFee = Number(order.fixed_fee ?? 0);
  const commissionBase = precoVendaBruto;
  const commissionPercent = isFreeSample ? 0 : (commissionRate > 0
    ? (commissionBase * commissionRate) / 100
    : Math.max(0, Number(order.marketplace_commission ?? 0) - fixedFee));

  const sfpEnabled = !isFreeSample && isTikTok;
  const sfpFee = sfpEnabled ? precoVendaBruto * 0.06 : 0;
  const rawShipping = Number(order.shipping_cost ?? 0);
  const shipping = sfpEnabled ? 0 : rawShipping;
  const other = Number(order.other_expenses ?? 0);

  const subtotalMarketplace = isFreeSample ? 0 : (commissionPercent + fixedFee + sfpFee + shipping + other);

  const tiktokReembolso = isTikTok ? activeDiscount : 0;
  const precoVendaLiquidoFinal = isTikTok
    ? precoVendaPagoCliente + tiktokReembolso - subtotalMarketplace
    : precoVendaPagoCliente - subtotalMarketplace - activeDiscount;

  const realProfit = isFreeSample ? -totalProductCost : (precoVendaLiquidoFinal - totalProductCost);
  return Math.round(realProfit * 100) / 100;
};

// Função para obter range de datas baseado no período
const getDateRange = (period: 'daily' | 'weekly' | 'monthly' | 'yearly') => {
  const now = new Date();
  const currentStart = new Date(now);
  const currentEnd = new Date(now);
  const previousStart = new Date(now);
  const previousEnd = new Date(now);
  
  switch (period) {
    case 'daily': {
      // Hoje
      currentStart.setHours(0, 0, 0, 0);
      currentEnd.setHours(23, 59, 59, 999);
      // Ontem
      previousStart.setDate(previousStart.getDate() - 1);
      previousStart.setHours(0, 0, 0, 0);
      previousEnd.setDate(previousEnd.getDate() - 1);
      previousEnd.setHours(23, 59, 59, 999);
      break;
    }
    case 'weekly': {
      // Esta semana (domingo a sábado)
      const dayOfWeek = now.getDay();
      currentStart.setDate(now.getDate() - dayOfWeek);
      currentStart.setHours(0, 0, 0, 0);
      currentEnd.setHours(23, 59, 59, 999);
      // Semana passada
      previousStart.setDate(currentStart.getDate() - 7);
      previousStart.setHours(0, 0, 0, 0);
      previousEnd.setDate(currentStart.getDate() - 1);
      previousEnd.setHours(23, 59, 59, 999);
      break;
    }
    case 'monthly': {
      // Este mês
      currentStart.setDate(1);
      currentStart.setHours(0, 0, 0, 0);
      currentEnd.setMonth(currentEnd.getMonth() + 1, 0);
      currentEnd.setHours(23, 59, 59, 999);
      // Mês passado
      previousStart.setMonth(previousStart.getMonth() - 1, 1);
      previousStart.setHours(0, 0, 0, 0);
      previousEnd.setDate(0); // Último dia do mês anterior
      previousEnd.setHours(23, 59, 59, 999);
      break;
    }
    case 'yearly': {
      // Este ano
      currentStart.setMonth(0, 1);
      currentStart.setHours(0, 0, 0, 0);
      currentEnd.setMonth(11, 31);
      currentEnd.setHours(23, 59, 59, 999);
      // Ano passado
      previousStart.setFullYear(previousStart.getFullYear() - 1, 0, 1);
      previousStart.setHours(0, 0, 0, 0);
      previousEnd.setFullYear(previousEnd.getFullYear() - 1, 11, 31);
      previousEnd.setHours(23, 59, 59, 999);
      break;
    }
  }
  
  return {
    current: { start: currentStart.toISOString(), end: currentEnd.toISOString() },
    previous: { start: previousStart.toISOString(), end: previousEnd.toISOString() }
  };
};

export const useHeroStats = (organizationId: string, period: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'monthly', refreshTrigger?: number) => {
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
      if (!organizationId) { setLoading(false); return; }

      setLoading(true);
      setError(null);

      try {
        const dateRange = getDateRange(period);
        
        // Buscar pedidos do período atual
        const { data: currentOrders, error: currentOrdersError } = await supabase
          .from('orders')
          .select(`
            id,
            customer_id,
            total_amount,
            discount_value,
            marketplace_id,
            shipping_cost,
            other_expenses,
            marketplace_commission,
            is_free_sample,
            order_date,
            bling_orders(total_products)
          `)
          .eq('organization_id', organizationId)
          .gte('order_date', dateRange.current.start)
          .lte('order_date', dateRange.current.end)
          .not('order_date', 'is', null);

        if (currentOrdersError) throw currentOrdersError;

        // Buscar marketplaces para os pedidos (incluindo marketplaces de sistema)
        const marketplaceIds = [...new Set((currentOrders || []).map(o => o.marketplace_id).filter(Boolean))];
        const { data: marketplaces, error: marketplacesError } = await supabase
          .from('marketplaces')
          .select('id, name, commission_rate, fixed_fee')
          .in('id', marketplaceIds);

        if (marketplacesError) throw marketplacesError;

        // Criar maps de marketplace_id -> name/rates
        const marketplaceMap = (marketplaces || []).reduce((acc: Record<string, string>, m: { id: string; name: string }) => {
          acc[m.id] = m.name;
          return acc;
        }, {});
        const marketplaceRatesMap = (marketplaces || []).reduce((acc: Record<string, { commission_rate: number; fixed_fee: number }>, m: { id: string; commission_rate: number; fixed_fee: number }) => {
          acc[m.id] = { commission_rate: Number(m.commission_rate ?? 0), fixed_fee: Number(m.fixed_fee ?? 0) };
          return acc;
        }, {});

        // Buscar itens dos pedidos com informações dos produtos
        const orderIds = (currentOrders || []).map(o => o.id);
        const { data: orderItems, error: itemsError } = await supabase
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

        // Agrupar itens por pedido
        const itemsByOrder = (orderItems || []).reduce((acc: Record<string, unknown[]>, item: Record<string, unknown>) => {
          const orderId = item.order_id as string;
          if (!acc[orderId]) acc[orderId] = [];
          acc[orderId].push({
            quantity: item.quantity,
            unit_cost: item.unit_cost,
            supplier_fee_value: (item.products as Record<string, unknown>)?.supplier_fee_value || '0',
            supplier_fee_type: (item.products as Record<string, unknown>)?.supplier_fee_type || 'percent',
            supplier_gateway_fee_value: (item.products as Record<string, unknown>)?.supplier_gateway_fee_value || '0',
            supplier_gateway_fee_type: (item.products as Record<string, unknown>)?.supplier_gateway_fee_type || 'fixed'
          });
          return acc;
        }, {});

        // Processar pedidos atuais
        const processedCurrentOrders = (currentOrders || [])
          .filter(order => itemsByOrder[order.id]?.length > 0)
          .map(order => {
            const marketplaceName = order.marketplace_id ? marketplaceMap[order.marketplace_id] || '' : '';
            const rates = order.marketplace_id ? marketplaceRatesMap[order.marketplace_id] ?? { commission_rate: 0, fixed_fee: 0 } : { commission_rate: 0, fixed_fee: 0 };
            const blingOrder = Array.isArray((order as unknown as { bling_orders?: { total_products?: number }[] }).bling_orders)
              ? (order as unknown as { bling_orders: { total_products?: number }[] }).bling_orders[0]
              : null;
            return {
              ...order,
              order_id: order.id,
              marketplace: marketplaceName,
              commission_rate: rates.commission_rate,
              fixed_fee: rates.fixed_fee,
              total_products: Number(blingOrder?.total_products ?? order.total_amount ?? 0),
              discount_value: Number((order as unknown as { discount_value?: number }).discount_value ?? 0),
              products: itemsByOrder[order.id] || []
            };
          }) as OrderWithProducts[];

        // Calcular lucro total
        const totalProfit = processedCurrentOrders.reduce((sum, order) => {
          const profit = calculateOrderProfit(order);
          return sum + profit;
        }, 0);

        // Buscar pedidos do período anterior para calcular lucro anterior
        const { data: previousOrdersData, error: previousOrdersError } = await supabase
          .from('orders')
          .select(`
            id,
            customer_id,
            total_amount,
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

        // Buscar itens dos pedidos anteriores
        const previousOrderIds = (previousOrdersData || []).map(o => o.id);
        let previousTotalProfit = 0;
        
        if (previousOrderIds.length > 0) {
          const { data: previousOrderItems, error: previousItemsError } = await supabase
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

          if (!previousItemsError) {
            // Agrupar itens por pedido anterior
            const previousItemsByOrder = (previousOrderItems || []).reduce((acc: Record<string, unknown[]>, item: Record<string, unknown>) => {
              const orderId = item.order_id as string;
              if (!acc[orderId]) acc[orderId] = [];
              acc[orderId].push({
                quantity: item.quantity,
                unit_cost: item.unit_cost,
                supplier_fee_value: (item.products as Record<string, unknown>)?.supplier_fee_value || '0',
                supplier_fee_type: (item.products as Record<string, unknown>)?.supplier_fee_type || 'percent',
                supplier_gateway_fee_value: (item.products as Record<string, unknown>)?.supplier_gateway_fee_value || '0',
                supplier_gateway_fee_type: (item.products as Record<string, unknown>)?.supplier_gateway_fee_type || 'fixed'
              });
              return acc;
            }, {});

            // Processar pedidos anteriores
            const processedPreviousOrders = (previousOrdersData || [])
              .filter(order => previousItemsByOrder[order.id]?.length > 0)
              .map(order => {
                const marketplaceName = order.marketplace_id ? marketplaceMap[order.marketplace_id] || '' : '';
                const rates = order.marketplace_id ? marketplaceRatesMap[order.marketplace_id] ?? { commission_rate: 0, fixed_fee: 0 } : { commission_rate: 0, fixed_fee: 0 };
                return {
                  ...order,
                  order_id: order.id,
                  marketplace: marketplaceName,
                  commission_rate: rates.commission_rate,
                  fixed_fee: rates.fixed_fee,
                  total_products: Number(order.total_amount ?? 0),
                  discount_value: Number((order as unknown as { discount_value?: number }).discount_value ?? 0),
                  products: previousItemsByOrder[order.id] || []
                };
              }) as OrderWithProducts[];

            // Calcular lucro total do período anterior
            previousTotalProfit = processedPreviousOrders.reduce((sum, order) => {
              const profit = calculateOrderProfit(order);
              return sum + profit;
            }, 0);
          }
        }

        // Buscar total de produtos do período atual
        const { count: productsCount, error: productsError } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', organizationId)
          .gte('created_at', dateRange.current.start)
          .lte('created_at', dateRange.current.end);

        if (productsError) throw productsError;

        // Buscar total de produtos do período anterior
        const { count: previousProductsCount, error: previousProductsError } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', organizationId)
          .gte('created_at', dateRange.previous.start)
          .lte('created_at', dateRange.previous.end);

        if (previousProductsError) throw previousProductsError;

        // Calcular clientes únicos
        const currentUniqueCustomers = new Set(
          processedCurrentOrders
            .map(order => order.customer_id)
            .filter(Boolean)
        );
        const previousUniqueCustomers = new Set(
          (previousOrdersData || [])
            .map(order => order.customer_id)
            .filter(Boolean)
        );

        const totalOrders = processedCurrentOrders.length;
        const previousTotalOrders = (previousOrdersData || []).length;
        const totalCustomers = currentUniqueCustomers.size;
        const previousTotalCustomers = previousUniqueCustomers.size;

        // Calcular mudanças percentuais
        const revenueChange = previousTotalProfit !== 0
          ? ((totalProfit - previousTotalProfit) / Math.abs(previousTotalProfit)) * 100
          : (totalProfit !== 0 ? 100 : 0);
        
        const ordersChange = previousTotalOrders > 0 
          ? ((totalOrders - previousTotalOrders) / previousTotalOrders) * 100 
          : (totalOrders > 0 ? 100 : 0);
        
        const customersChange = previousTotalCustomers > 0 
          ? ((totalCustomers - previousTotalCustomers) / previousTotalCustomers) * 100 
          : (totalCustomers > 0 ? 100 : 0);
        
        const productsChange = (previousProductsCount || 0) > 0
          ? (((productsCount || 0) - (previousProductsCount || 0)) / (previousProductsCount || 0)) * 100
          : ((productsCount || 0) > 0 ? 100 : 0);

        setStats({
          totalRevenue: totalProfit,
          totalOrders,
          totalCustomers,
          totalProducts: productsCount || 0,
          revenueChange: Math.round(revenueChange),
          ordersChange: Math.round(ordersChange),
          customersChange: Math.round(customersChange),
          productsChange: Math.round(productsChange),
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
