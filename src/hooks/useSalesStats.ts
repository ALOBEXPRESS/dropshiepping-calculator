import { useState, useEffect } from 'react';
import {
  getProductSalesStats,
  getGeneralFinancialSummary,
  getTopPriceProductsByMarketplace,
  getTopProfitProductsByMarketplace,
  getProductCountByMarketplace,
  type ProductSalesStats,
  type GeneralFinancialSummary,
  type MarketplaceProductStats
} from '../services/salesStatsService';

export function useProductSalesStats(productId: string | null) {
  const [stats, setStats] = useState<ProductSalesStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!productId) {
      setStats(null);
      return;
    }

    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const data = await getProductSalesStats(productId);
        setStats(data);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [productId]);

  return { stats, loading, error };
}

export function useGeneralFinancialSummary() {
  const [summary, setSummary] = useState<GeneralFinancialSummary>({
    total_profit: 0,
    total_sales: 0,
    estimated_expenses: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchSummary = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const data = await getGeneralFinancialSummary();
        setSummary(data);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
    
    // Atualizar a cada 30 segundos
    const interval = setInterval(fetchSummary, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return { summary, loading, error, refresh: () => getGeneralFinancialSummary().then(setSummary) };
}

export function useTopProductsByMarketplace(limit = 5) {
  const [topPriceProducts, setTopPriceProducts] = useState<MarketplaceProductStats[]>([]);
  const [topProfitProducts, setTopProfitProducts] = useState<MarketplaceProductStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchTopProducts = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const [priceData, profitData] = await Promise.all([
          getTopPriceProductsByMarketplace(limit),
          getTopProfitProductsByMarketplace(limit)
        ]);
        
        setTopPriceProducts(priceData);
        setTopProfitProducts(profitData);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchTopProducts();
    
    // Atualizar a cada 30 segundos
    const interval = setInterval(fetchTopProducts, 30000);
    
    return () => clearInterval(interval);
  }, [limit]);

  return { topPriceProducts, topProfitProducts, loading, error };
}

export function useProductCountByMarketplace() {
  const [counts, setCounts] = useState<{ marketplace: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchCounts = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const data = await getProductCountByMarketplace();
        setCounts(data);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchCounts();
    
    // Atualizar a cada 30 segundos
    const interval = setInterval(fetchCounts, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return { counts, loading, error };
}
