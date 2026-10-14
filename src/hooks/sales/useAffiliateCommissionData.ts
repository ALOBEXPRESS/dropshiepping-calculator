import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface AffiliateCommissionProduct {
  product_id: string;
  product_name: string;
  product_sku: string;
  stock_quantity: number;
  marketplace_name: string;
  marketplace_id: string;
  commission_rate: number;
  max_affiliate_percentage: number;
  affiliate_name?: string;
  affiliate_username?: string;
}

export interface MarketplaceOption {
  id: string;
  name: string;
  affiliate_commission_rate: number;
}

export interface AffiliateOrderProduct {
  name: string;
  quantity: number;
  sku?: string;
}

export interface AffiliateOrderGroup {
  affiliate_id: string;
  affiliate_name: string;
  affiliate_username?: string;
  orders_count: number;
  total_profit: number;
  total_amount: number;
  marketplace_names: string[];
  marketplace_ids: string[];
  products: AffiliateOrderProduct[];
  order_numbers: string[];
}

export const useAffiliateCommissionData = (organizationId: string, refreshTrigger?: number) => {
  const [data, setData] = useState<AffiliateCommissionProduct[]>([]);
  const [orderGroups, setOrderGroups] = useState<AffiliateOrderGroup[]>([]);
  const [marketplaces, setMarketplaces] = useState<MarketplaceOption[]>([]);
  const [selectedMarketplace, setSelectedMarketplace] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!organizationId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // 1. Buscar marketplaces com comissão de afiliado > 0
        const { data: marketplacesData, error: marketplacesError } = await supabase
          .from('marketplaces')
          .select('id, name, affiliate_commission_rate')
          .eq('organization_id', organizationId)
          .gt('affiliate_commission_rate', 0)
          .order('name');

        if (marketplacesError) throw marketplacesError;

        const marketplacesList = (marketplacesData || []) as MarketplaceOption[];
        setMarketplaces(marketplacesList);

        // 2. Buscar produtos com afiliados
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('id, name, sku, stock_quantity, marketplace_id, affiliates')
          .eq('organization_id', organizationId)
          .not('affiliates', 'is', null);

        if (productsError) throw productsError;

        // 3. Processar produtos e extrair comissões
        const processedProducts: AffiliateCommissionProduct[] = [];

        for (const product of (productsData || [])) {
          const affiliates = product.affiliates as Array<{
            id: string;
            name: string;
            percentage: string;
            marketplaceName: string;
            username?: string;
          }> | null;

          if (!affiliates || affiliates.length === 0) continue;

          // Encontrar a maior comissão de afiliado para este produto
          const maxAffiliatePercentage = Math.max(
            ...affiliates.map(a => parseFloat(a.percentage || '0'))
          );

          // Pegar o afiliado com a maior comissão
          const topAffiliate = affiliates.reduce((best, current) => {
            const currentPercentage = parseFloat(current.percentage || '0');
            const bestPercentage = parseFloat(best.percentage || '0');
            return currentPercentage > bestPercentage ? current : best;
          }, affiliates[0]);

          // Pegar o marketplace do afiliado (pode ser diferente do marketplace_id do produto)
          const affiliateMarketplaceName = topAffiliate?.marketplaceName || '';

          // Buscar o marketplace correspondente
          const marketplace = marketplacesList.find(
            m => m.name.toLowerCase() === affiliateMarketplaceName.toLowerCase()
          );

          if (!marketplace) continue;

          processedProducts.push({
            product_id: product.id,
            product_name: product.name || 'Produto sem nome',
            product_sku: product.sku || '',
            stock_quantity: product.stock_quantity || 0,
            marketplace_name: marketplace.name,
            marketplace_id: marketplace.id,
            commission_rate: parseFloat(marketplace.affiliate_commission_rate?.toString() || '0'),
            max_affiliate_percentage: maxAffiliatePercentage,
            affiliate_name: topAffiliate?.name || undefined,
            affiliate_username: topAffiliate?.username || undefined,
          });
        }

        // Ordenar produtos por comissão (maior primeiro)
        processedProducts.sort((a, b) => b.max_affiliate_percentage - a.max_affiliate_percentage);
        setData(processedProducts);

        // 4. Buscar pedidos com afiliados vinculados
        const { data: ordersData, error: ordersErr } = await supabase
          .from('orders')
          .select(`
            id,
            order_number,
            affiliate_id,
            total_amount,
            total_profit,
            order_date,
            marketplace_id,
            marketplaces!marketplace_id (
              id,
              name
            ),
            order_items (
              id,
              product_name,
              quantity,
              unit_price
            )
          `)
          .eq('organization_id', organizationId)
          .not('affiliate_id', 'is', null);

        if (ordersErr) {
          console.warn('Error fetching affiliate orders:', ordersErr);
        }

        // Buscar nomes dos afiliados e influenciadores
        const { data: affList } = await supabase
          .from('affiliates')
          .select('id, name, tiktok, instagram')
          .or(`organization_id.eq.${organizationId},organization_id.is.null`);

        const { data: infList } = await supabase
          .from('influencers')
          .select('id, name, tiktok, instagram')
          .or(`organization_id.eq.${organizationId},organization_id.is.null`);

        const affMetaMap = new Map<string, { name: string; username?: string }>();
        for (const it of [...(affList || []), ...(infList || [])]) {
          if (!it.name) continue;
          if (!affMetaMap.has(it.id)) {
            affMetaMap.set(it.id, {
              name: it.name.trim(),
              username: it.tiktok || it.instagram || undefined,
            });
          }
        }

        const groupsMap = new Map<string, AffiliateOrderGroup>();
        for (const o of (ordersData || [])) {
          if (!o.affiliate_id) continue;
          const affId = o.affiliate_id;
          const meta = affMetaMap.get(affId);
          const affName = meta?.name || 'Afiliado ' + affId.slice(0, 8);
          const affUser = meta?.username;

          const mp = o.marketplaces as { id?: string; name?: string } | null;
          const mpId = o.marketplace_id || mp?.id || '';
          const mpName = mp?.name || '';

          const profit = Number(o.total_profit ?? 0);
          const amount = Number(o.total_amount ?? 0);
          const items = (o.order_items || []) as Array<{
            id?: string;
            product_name?: string;
            quantity?: number;
          }>;

          if (!groupsMap.has(affId)) {
            groupsMap.set(affId, {
              affiliate_id: affId,
              affiliate_name: affName,
              affiliate_username: affUser,
              orders_count: 0,
              total_profit: 0,
              total_amount: 0,
              marketplace_names: [],
              marketplace_ids: [],
              products: [],
              order_numbers: [],
            });
          }

          const grp = groupsMap.get(affId)!;
          grp.orders_count += 1;
          grp.total_profit = Math.round((grp.total_profit + profit) * 100) / 100;
          grp.total_amount = Math.round((grp.total_amount + amount) * 100) / 100;
          if (mpName && !grp.marketplace_names.includes(mpName)) {
            grp.marketplace_names.push(mpName);
          }
          if (mpId && !grp.marketplace_ids.includes(mpId)) {
            grp.marketplace_ids.push(mpId);
          }
          if (o.order_number && !grp.order_numbers.includes(String(o.order_number))) {
            grp.order_numbers.push(String(o.order_number));
          }

          for (const it of items) {
            const pName = it.product_name || 'Produto sem nome';
            const qty = Number(it.quantity ?? 1);
            const existingProd = grp.products.find(p => p.name === pName);
            if (existingProd) {
              existingProd.quantity += qty;
            } else {
              grp.products.push({ name: pName, quantity: qty });
            }
          }
        }

        const processedGroups = Array.from(groupsMap.values()).sort((a, b) => b.orders_count - a.orders_count);
        setOrderGroups(processedGroups);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar dados de comissão');
        console.error('Error fetching affiliate commission data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [organizationId, refreshTrigger]);

  // Filtrar dados por marketplace selecionado
  const filteredData = selectedMarketplace === 'all'
    ? data
    : data.filter(p => p.marketplace_id === selectedMarketplace);

  const filteredOrderGroups = selectedMarketplace === 'all'
    ? orderGroups
    : orderGroups.filter(g => g.marketplace_ids.includes(selectedMarketplace));

  return {
    data: filteredData,
    allData: data, // Dados originais de produtos sem filtro de marketplace
    orderGroups: filteredOrderGroups,
    allOrderGroups: orderGroups, // Dados originais de pedidos sem filtro de marketplace
    marketplaces,
    selectedMarketplace,
    setSelectedMarketplace,
    loading,
    error,
  };
};
