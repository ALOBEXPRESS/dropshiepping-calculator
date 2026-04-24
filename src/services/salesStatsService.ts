import { supabase } from '../lib/supabase';

export interface ProductSalesStats {
  product_id: string;
  total_sales: number;
  total_revenue: number;
  sales_by_marketplace: {
    marketplace: string;
    sales_count: number;
    revenue: number;
  }[];
}

export interface GeneralFinancialSummary {
  total_profit: number;
  total_sales: number;
  estimated_expenses: number;
}

export interface MarketplaceProductStats {
  product_id: string;
  product_name: string;
  marketplace: string;
  price: number;
  profit: number;
  sales_count: number;
  image_url?: string;
}

/**
 * Busca estatísticas de vendas de um produto específico
 */
export async function getProductSalesStats(productId: string): Promise<ProductSalesStats | null> {
  try {
    // Buscar pedidos que contêm o produto
    const { data: orders, error } = await supabase
      .from('bling_orders')
      .select(`
        id,
        total_amount,
        sales_channel_id,
        sales_channels (
          marketplace
        )
      `)
      .eq('sync_status', 'synced');

    if (error) throw error;

    // TODO: Quando tivermos a tabela bling_order_items, filtrar por product_id
    // Por enquanto, retornamos estatísticas gerais
    
    const totalSales = orders?.length || 0;
    const totalRevenue = orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;

    // Agrupar por marketplace
    const salesByMarketplace = orders?.reduce((acc, order) => {
      const salesChannel = order.sales_channels as { marketplace?: string } | { marketplace?: string }[] | null;
      const marketplace = (Array.isArray(salesChannel) ? salesChannel[0]?.marketplace : salesChannel?.marketplace) || 'Desconhecido';
      const existing = acc.find(m => m.marketplace === marketplace);
      
      if (existing) {
        existing.sales_count++;
        existing.revenue += order.total_amount || 0;
      } else {
        acc.push({
          marketplace,
          sales_count: 1,
          revenue: order.total_amount || 0
        });
      }
      
      return acc;
    }, [] as ProductSalesStats['sales_by_marketplace']) || [];

    return {
      product_id: productId,
      total_sales: totalSales,
      total_revenue: totalRevenue,
      sales_by_marketplace: salesByMarketplace
    };
  } catch (error) {
    console.error('Erro ao buscar estatísticas de vendas:', error);
    return null;
  }
}

/**
 * Busca resumo financeiro geral de todos os produtos
 */
export async function getGeneralFinancialSummary(): Promise<GeneralFinancialSummary> {
  try {
    // Buscar usuário autenticado
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Erro ao buscar usuário:', userError);
      return {
        total_profit: 0,
        total_sales: 0,
        estimated_expenses: 0
      };
    }

    // Usar o user.id como organization_id (assumindo que cada usuário tem sua própria organização)
    // Buscar a organização do usuário via organization_members
    const { data: memberData } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .limit(1)
      .single();
    
    const organizationId = memberData?.organization_id ?? user.id;

    // Buscar pedidos processados da tabela orders
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('profit, marketplace_commission, shipping_cost, other_expenses')
      .eq('organization_id', organizationId)
      .not('processed_at', 'is', null);

    if (ordersError) {
      console.error('Erro ao buscar orders:', ordersError);
      return {
        total_profit: 0,
        total_sales: 0,
        estimated_expenses: 0
      };
    }

    if (!ordersData || ordersData.length === 0) {
      console.log('Nenhum pedido processado encontrado');
      return {
        total_profit: 0,
        total_sales: 0,
        estimated_expenses: 0
      };
    }

    // Calcular totais
    const totalProfit = ordersData.reduce((sum, o) => 
      sum + (Number(o.profit) || 0), 0);

    const totalSales = ordersData.length;

    const totalExpenses = ordersData.reduce((sum, o) => 
      sum + (Number(o.marketplace_commission) || 0) + 
      (Number(o.shipping_cost) || 0) + 
      (Number(o.other_expenses) || 0), 0);

    console.log('Resumo financeiro calculado:', { totalProfit, totalSales, totalExpenses });

    return {
      total_profit: totalProfit,
      total_sales: totalSales,
      estimated_expenses: totalExpenses
    };
  } catch (error) {
    console.error('Erro ao buscar resumo financeiro:', error);
    return {
      total_profit: 0,
      total_sales: 0,
      estimated_expenses: 0
    };
  }
}

/**
 * Busca produtos com maior preço por marketplace
 */
export async function getTopPriceProductsByMarketplace(limit = 5): Promise<MarketplaceProductStats[]> {
  try {
    // Buscar produtos da tabela products
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, price, profit, marketplace, image_url');

    if (productsError) throw productsError;

    // Buscar contagem de vendas por produto (quando tivermos bling_order_items)
    // Por enquanto, retornamos os produtos ordenados por preço
    
    const productsWithSales = products?.map(product => ({
      product_id: product.id,
      product_name: product.name,
      marketplace: product.marketplace,
      price: product.price || 0,
      profit: product.profit || 0,
      sales_count: 0, // TODO: Calcular quando tivermos bling_order_items
      image_url: product.image_url
    })) || [];

    // Ordenar por preço e limitar
    return productsWithSales
      .sort((a, b) => b.price - a.price)
      .slice(0, limit);
  } catch (error) {
    console.error('Erro ao buscar produtos com maior preço:', error);
    return [];
  }
}

/**
 * Busca produtos com maior lucro por marketplace
 */
export async function getTopProfitProductsByMarketplace(limit = 5): Promise<MarketplaceProductStats[]> {
  try {
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, price, profit, marketplace, image_url');

    if (productsError) throw productsError;

    const productsWithSales = products?.map(product => ({
      product_id: product.id,
      product_name: product.name,
      marketplace: product.marketplace,
      price: product.price || 0,
      profit: product.profit || 0,
      sales_count: 0, // TODO: Calcular quando tivermos bling_order_items
      image_url: product.image_url
    })) || [];

    // Ordenar por lucro e limitar
    return productsWithSales
      .sort((a, b) => b.profit - a.profit)
      .slice(0, limit);
  } catch (error) {
    console.error('Erro ao buscar produtos com maior lucro:', error);
    return [];
  }
}

/**
 * Busca total de produtos por marketplace
 */
export async function getProductCountByMarketplace(): Promise<{ marketplace: string; count: number }[]> {
  try {
    // Buscar pedidos com informações do canal de venda
    const { data: orders, error } = await supabase
      .from('bling_orders')
      .select(`
        id,
        sales_channels (
          marketplace
        )
      `);

    if (error) throw error;

    // Agrupar por marketplace
    const countByMarketplace = orders?.reduce((acc, order) => {
      const salesChannel = order.sales_channels as { marketplace?: string } | { marketplace?: string }[] | null;
      const marketplace = (Array.isArray(salesChannel) ? salesChannel[0]?.marketplace : salesChannel?.marketplace) || 'Desconhecido';
      const existing = acc.find(m => m.marketplace === marketplace);
      
      if (existing) {
        existing.count++;
      } else {
        acc.push({ marketplace, count: 1 });
      }
      
      return acc;
    }, [] as { marketplace: string; count: number }[]) || [];

    return countByMarketplace;
  } catch (error) {
    console.error('Erro ao buscar contagem de produtos por marketplace:', error);
    return [];
  }
}
