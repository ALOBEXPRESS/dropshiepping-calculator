import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface ProfitableProduct {
  productName: string;
  productImageUrl: string | null;
  totalProfit: number;
  avgMargin: number;
  totalQuantity: number;
  totalRevenue: number;
}

export const useTopProfitableProducts = (
  organizationId: string,
  limit: number = 10,
  refreshTrigger?: number
) => {
  const [products, setProducts] = useState<ProfitableProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTopProfitableProducts = useCallback(async () => {
    if (!organizationId) return;

    setLoading(true);
    setError(null);

    try {
      // Query para buscar produtos mais lucrativos
      const { data, error: queryError } = await supabase.rpc('get_top_profitable_products', {
        p_organization_id: organizationId,
        p_limit: limit
      });

      if (queryError) {
        // Se a função não existir, fazer query manual com filtro de organização
        const { data: orderItems, error: itemsError } = await supabase
          .from('order_items')
          .select(`
            product_name,
            product_image_url,
            profit,
            profit_margin,
            quantity,
            total_price,
            order_id,
            orders!inner(organization_id)
          `)
          .eq('orders.organization_id', organizationId)
          .order('profit', { ascending: false });

        if (itemsError) throw itemsError;

        // Agrupar por produto
        const productMap = new Map<string, ProfitableProduct>();
        
        orderItems?.forEach(item => {
          const existing = productMap.get(item.product_name);
          if (existing) {
            existing.totalProfit += Number(item.profit) || 0;
            existing.totalQuantity += Number(item.quantity) || 0;
            existing.totalRevenue += Number(item.total_price) || 0;
            existing.avgMargin = (existing.avgMargin + (Number(item.profit_margin) || 0)) / 2;
          } else {
            productMap.set(item.product_name, {
              productName: item.product_name,
              productImageUrl: item.product_image_url,
              totalProfit: Number(item.profit) || 0,
              avgMargin: Number(item.profit_margin) || 0,
              totalQuantity: Number(item.quantity) || 0,
              totalRevenue: Number(item.total_price) || 0,
            });
          }
        });

        const sortedProducts = Array.from(productMap.values())
          .sort((a, b) => b.totalProfit - a.totalProfit)
          .slice(0, limit);

        setProducts(sortedProducts);
      } else {
        setProducts(data || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar produtos lucrativos');
      console.error('Error fetching profitable products:', err);
    } finally {
      setLoading(false);
    }
  }, [organizationId, limit]);

  useEffect(() => {
    fetchTopProfitableProducts();
  }, [fetchTopProfitableProducts, refreshTrigger]);

  return { products, loading, error, refetch: fetchTopProfitableProducts };
};
