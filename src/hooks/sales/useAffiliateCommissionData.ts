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
}

export interface MarketplaceOption {
  id: string;
  name: string;
  affiliate_commission_rate: number;
}

export const useAffiliateCommissionData = (organizationId: string, refreshTrigger?: number) => {
  const [data, setData] = useState<AffiliateCommissionProduct[]>([]);
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
          }> | null;

          if (!affiliates || affiliates.length === 0) continue;

          // Encontrar a maior comissão de afiliado para este produto
          const maxAffiliatePercentage = Math.max(
            ...affiliates.map(a => parseFloat(a.percentage || '0'))
          );

          // Pegar o marketplace do afiliado (pode ser diferente do marketplace_id do produto)
          const affiliateMarketplaceName = affiliates[0]?.marketplaceName || '';

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
          });
        }

        // 4. Ordenar por comissão (maior primeiro)
        processedProducts.sort((a, b) => b.max_affiliate_percentage - a.max_affiliate_percentage);

        setData(processedProducts);
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

  return {
    data: filteredData,
    marketplaces,
    selectedMarketplace,
    setSelectedMarketplace,
    loading,
    error,
  };
};
