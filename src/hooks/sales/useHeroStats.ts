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
  marketplace: string;
  shipping_cost: number;
  other_expenses: number;
  marketplace_commission: number;
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

// Função para calcular taxas da Shopee baseado no preço
const getShopeeRates = (price: number): { commission: number; fixed: number } => {
  if (price <= 79.99) return { commission: 20, fixed: 4 };
  if (price <= 99.99) return { commission: 14, fixed: 16 };
  if (price <= 199.99) return { commission: 14, fixed: 20 };
  if (price <= 499.99) return { commission: 14, fixed: 26 };
  return { commission: 14, fixed: 26 };
};

// Função para calcular o lucro real de um pedido
const calculateOrderProfit = (order: OrderWithProducts): number => {
  const totalAmount = Number(order.total_amount ?? 0);
  const isFreeSample = order.is_free_sample === true;
  
  // Calcular custo base dos produtos
  const totalBaseCost = order.products.reduce((sum, p) => {
    const qty = Number(p.quantity ?? 1);
    const unitCost = Number(p.unit_cost ?? 0);
    return sum + unitCost * qty;
  }, 0);
  
  // Calcular taxas do fornecedor
  const supFeeProduct = order.products.reduce((best, p) => {
    const v = Number(p.supplier_fee_value ?? 0);
    return v > Number(best?.supplier_fee_value ?? 0) ? p : best;
  }, order.products[0]);
  
  const gwFeeProduct = order.products.reduce((best, p) => {
    const v = Number(p.supplier_gateway_fee_value ?? 0);
    return v > Number(best?.supplier_gateway_fee_value ?? 0) ? p : best;
  }, order.products[0]);
  
  const supFeeVal = Number(supFeeProduct?.supplier_fee_value ?? 0);
  const supFeeType = supFeeProduct?.supplier_fee_type ?? 'percent';
  const gwFeeVal = Number(gwFeeProduct?.supplier_gateway_fee_value ?? 0);
  const gwFeeType = gwFeeProduct?.supplier_gateway_fee_type ?? 'fixed';
  
  const orderSupplierFee = supFeeVal > 0
    ? supFeeType === 'percent' ? (totalBaseCost * supFeeVal) / 100 : supFeeVal
    : 0;
  const orderGatewayFee = gwFeeVal > 0
    ? gwFeeType === 'fixed' ? gwFeeVal : (totalBaseCost * gwFeeVal) / 100
    : 0;
  
  const totalProductCost = totalBaseCost + orderSupplierFee + orderGatewayFee;
  
  // Calcular taxas do marketplace
  let commissionRate = 0;
  let fixedFee = 0;
  
  // Se for Shopee, calcular taxas baseadas no preço de venda
  if (order.marketplace?.toLowerCase() === 'shopee') {
    const shopeeRates = getShopeeRates(totalAmount);
    commissionRate = shopeeRates.commission;
    fixedFee = shopeeRates.fixed;
  } else {
    // Para outros marketplaces, usar a comissão já calculada
    commissionRate = 0;
    fixedFee = 0;
  }
  
  const commissionPercent = isFreeSample ? 0 : (commissionRate > 0
    ? (totalAmount * commissionRate) / 100
    : Math.max(0, order.marketplace_commission));
  
  // TikTok SFP não está mais na tabela, então removemos
  const sfpFee = 0;
  
  const subtotalMarketplace = isFreeSample ? 0 : (
    commissionPercent + 
    fixedFee + 
    sfpFee + 
    Number(order.shipping_cost ?? 0) + 
    Number(order.other_expenses ?? 0)
  );
  
  const realProfit = isFreeSample 
    ? -totalProductCost 
    : (totalAmount - totalProductCost - subtotalMarketplace);
  
  return realProfit;
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
            marketplace:marketplaces(name),
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
          .map(order => ({
            ...order,
            order_id: order.id,
            marketplace: Array.isArray(order.marketplace) && order.marketplace.length > 0 
              ? order.marketplace[0].name 
              : '',
            products: itemsByOrder[order.id] || []
          })) as OrderWithProducts[];

        console.log('📊 Pedidos processados:', processedCurrentOrders.length);
        console.log('📊 Detalhes dos pedidos:', processedCurrentOrders.map(o => ({
          order_id: o.order_id,
          marketplace: o.marketplace,
          total_amount: o.total_amount,
          is_free_sample: o.is_free_sample,
          products_count: o.products.length
        })));

        // Calcular lucro total
        const totalProfit = processedCurrentOrders.reduce((sum, order) => {
          const profit = calculateOrderProfit(order);
          console.log(`💰 Pedido ${order.order_id}: Lucro = R$ ${profit.toFixed(2)}`);
          return sum + profit;
        }, 0);

        console.log('💰 Lucro total calculado:', totalProfit);

        // Buscar pedidos do período anterior
        const { data: previousOrders, error: previousOrdersError } = await supabase
          .from('orders')
          .select('id, customer_id')
          .eq('organization_id', organizationId)
          .gte('order_date', dateRange.previous.start)
          .lte('order_date', dateRange.previous.end)
          .not('order_date', 'is', null);

        if (previousOrdersError) throw previousOrdersError;

        // Buscar total de produtos
        const { count: productsCount, error: productsError } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', organizationId);

        if (productsError) throw productsError;

        // Calcular clientes únicos
        const currentUniqueCustomers = new Set(
          processedCurrentOrders
            .map(order => order.customer_id)
            .filter(Boolean)
        );
        const previousUniqueCustomers = new Set(
          (previousOrders || [])
            .map(order => order.customer_id)
            .filter(Boolean)
        );

        const totalOrders = processedCurrentOrders.length;
        const previousTotalOrders = (previousOrders || []).length;
        const totalCustomers = currentUniqueCustomers.size;
        const previousTotalCustomers = previousUniqueCustomers.size;

        // Calcular mudanças percentuais
        const ordersChange = previousTotalOrders > 0 
          ? ((totalOrders - previousTotalOrders) / previousTotalOrders) * 100 
          : 0;
        const customersChange = previousTotalCustomers > 0 
          ? ((totalCustomers - previousTotalCustomers) / previousTotalCustomers) * 100 
          : 0;

        setStats({
          totalRevenue: totalProfit,
          totalOrders,
          totalCustomers,
          totalProducts: productsCount || 0,
          revenueChange: 0, // Pode ser calculado se necessário
          ordersChange: Math.round(ordersChange),
          customersChange: Math.round(customersChange),
          productsChange: 0, // Produtos não mudam por período
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
