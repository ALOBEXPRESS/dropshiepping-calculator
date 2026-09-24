import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface ProductSalesStats {
  totalSales: number;
  totalQuantity: number;
  totalProfit: number;
  totalRevenue: number;
  totalCost: number;
}

export const useProductSalesStats = (productId?: string) => {
  const [stats, setStats] = useState<ProductSalesStats>({
    totalSales: 0,
    totalQuantity: 0,
    totalProfit: 0,
    totalRevenue: 0,
    totalCost: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    if (!productId) {
      setStats({
        totalSales: 0,
        totalQuantity: 0,
        totalProfit: 0,
        totalRevenue: 0,
        totalCost: 0
      });
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Obter SKUs e variação do produto
      let skus: string[] = [];
      let varIds: string[] = [];

      // Buscar produto principal
      const { data: mainProduct } = await supabase
        .from('products')
        .select('sku')
        .eq('id', productId)
        .maybeSingle();

      if (mainProduct?.sku) {
        skus.push(mainProduct.sku);
      }

      // Buscar variações do produto
      const { data: variations } = await supabase
        .from('products_variations_bling')
        .select('id, sku')
        .eq('product_id', productId);

      if (variations && variations.length > 0) {
        variations.forEach((v) => {
          if (v.id) varIds.push(v.id);
          if (v.sku) skus.push(v.sku);
        });
      }

      skus = [...new Set(skus.filter(Boolean))];
      varIds = [...new Set(varIds.filter(Boolean))];

      // 2. Buscar vendas em bling_order_items (pedidos importados/entrando)
      const blingQuery = supabase
        .from('bling_order_items')
        .select('id, order_id, quantity, unit_value, total_value');

      const filterConditions: string[] = [
        `product_id.eq.${productId}`,
        `product_bling_id.eq.${productId}`
      ];

      if (varIds.length > 0) {
        filterConditions.push(`product_variation_id.in.(${varIds.map(id => `"${id}"`).join(',')})`);
      }
      if (skus.length > 0) {
        filterConditions.push(`code.in.(${skus.map(s => `"${s}"`).join(',')})`);
      }

      const { data: blingItems, error: blingError } = await blingQuery.or(filterConditions.join(','));

      if (blingError) {
        console.warn('Erro ao buscar bling_order_items:', blingError);
      }

      // 3. Buscar vendas na tabela order_items (pedidos processados)
      const orderItemsQuery = supabase
        .from('order_items')
        .select('id, order_id, quantity, total_price, profit, unit_cost, total_cost');

      const orderItemConditions: string[] = [`product_id.eq.${productId}`];
      if (skus.length > 0) {
        orderItemConditions.push(`product_sku.in.(${skus.map(s => `"${s}"`).join(',')})`);
      }

      const { data: orderItems, error: itemsError } = await orderItemsQuery.or(orderItemConditions.join(','));

      if (itemsError) {
        console.warn('Erro ao buscar order_items:', itemsError);
      }

      // 4. Consolidar vendas dos dois lados, evitando contagem duplicada por order_id se processado
      const countedOrderIds = new Set<string>();
      let totalQty = 0;
      let totalRev = 0;
      let totalProf = 0;
      let totalCst = 0;

      // Buscar custo/lucro estimado para pedidos pendentes em bling_order_items
      if (blingItems && blingItems.length > 0) {
        const blingOrderIds = [...new Set(blingItems.map((i) => i.order_id))];
        const { data: pendingOrders } = await supabase
          .from('pending_orders_to_process')
          .select('bling_order_id, total_cost, estimated_profit')
          .in('bling_order_id', blingOrderIds);

        const pendingMap = new Map<string, { total_cost: number; estimated_profit: number }>();
        if (pendingOrders) {
          pendingOrders.forEach((po) => {
            pendingMap.set(po.bling_order_id, {
              total_cost: Number(po.total_cost || 0),
              estimated_profit: Number(po.estimated_profit || 0),
            });
          });
        }

        blingItems.forEach((item) => {
          countedOrderIds.add(item.order_id);
          totalQty += Number(item.quantity || 1);
          totalRev += Number(item.total_value || (Number(item.quantity || 1) * Number(item.unit_value || 0)));
          const po = pendingMap.get(item.order_id);
          if (po) {
            totalCst += po.total_cost;
            totalProf += po.estimated_profit;
          }
        });
      }

      // Adicionar itens de order_items (se não contados via bling_order_id)
      if (orderItems && orderItems.length > 0) {
        orderItems.forEach((item) => {
          if (!countedOrderIds.has(item.order_id)) {
            countedOrderIds.add(item.order_id);
            totalQty += Number(item.quantity || 1);
            totalRev += Number(item.total_price || 0);
            totalProf += Number(item.profit || 0);
            totalCst += Number(item.total_cost || 0);
          }
        });
      }

      setStats({
        totalSales: countedOrderIds.size,
        totalQuantity: totalQty,
        totalProfit: totalProf,
        totalRevenue: totalRev,
        totalCost: totalCst
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar estatísticas');
      console.error('Error fetching product sales stats:', err);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchStats();

    if (!productId) return;

    // Escutar mudanças em tempo real para atualizar conforme novos pedidos entram
    const channel = supabase
      .channel(`product-sales-stats-${productId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bling_orders' }, () => {
        fetchStats();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bling_order_items' }, () => {
        fetchStats();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchStats();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' }, () => {
        fetchStats();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [productId, fetchStats]);

  return { stats, loading, error, refetch: fetchStats };
};
