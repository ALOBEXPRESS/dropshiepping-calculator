import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useMarketplacePerformance } from '@/hooks/sales/useMarketplacePerformance';
import { Store, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

// Importar logos dos marketplaces
import mercadoLivreImg from '@/imgs/mercadolivre.svg';
import shopeeImg from '@/imgs/18790-256x256x32.png';
import amazonImg from '@/imgs/amazon.jpg';
import tiktokImg from '@/imgs/tiktok-shop-seller-cent-icon-filled-256.png';
import sheinImg from '@/imgs/shein.svg';
import enjoeiImg from '@/imgs/enjoei.svg';
import olxImg from '@/imgs/olx.png';

interface MarketplacePerformanceCardProps {
  organizationId: string;
  refreshTrigger?: number;
}

// Mapeamento de marketplace_id para logo
const marketplaceLogos: Record<string, string> = {
  'mercadolivre': mercadoLivreImg,
  'mercado-livre': mercadoLivreImg,
  'mercado livre': mercadoLivreImg,
  'shopee': shopeeImg,
  'amazon': amazonImg,
  'tiktok': tiktokImg,
  'tiktok-shop': tiktokImg,
  'shein': sheinImg,
  'enjoei': enjoeiImg,
  'olx': olxImg,
};

export function MarketplacePerformanceCard({ organizationId, refreshTrigger }: MarketplacePerformanceCardProps) {
  const { data, loading } = useMarketplacePerformance(organizationId, refreshTrigger);
  const [currentIndex, setCurrentIndex] = useState(0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getMarketplaceLogo = (marketplaceId: string, marketplaceName: string) => {
    // Tentar encontrar logo pelo ID ou nome (case insensitive)
    const key = marketplaceId.toLowerCase();
    const nameKey = marketplaceName.toLowerCase();
    
    return marketplaceLogos[key] || marketplaceLogos[nameKey] || null;
  };

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? data.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === data.length - 1 ? 0 : prev + 1));
  };

  if (loading) {
    return (
      <Card className="p-6 border-gray-100 dark:border-zinc-800">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className="p-6 border-gray-100 dark:border-zinc-800">
        <div className="flex items-center gap-2 mb-4">
          <Store className="w-5 h-5 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Performance por Marketplace
          </h3>
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Store className="w-12 h-12 text-gray-400 mb-3" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Nenhum dado de marketplace disponível
          </p>
        </div>
      </Card>
    );
  }

  const currentMarketplace = data[currentIndex];
  const logo = getMarketplaceLogo(currentMarketplace.marketplace_id, currentMarketplace.marketplace);

  return (
    <Card className="p-6 border-gray-100 dark:border-zinc-800 hover:shadow-lg transition-shadow duration-200">
      <div className="flex items-center gap-2 mb-6">
        <Store className="w-5 h-5 text-gray-400" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Performance por Marketplace
        </h3>
      </div>

      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Comparação de desempenho entre plataformas
      </p>

      {/* Carrossel de Marketplace */}
      <div className="relative">
        {/* Logo e Nome do Marketplace */}
        <div className="flex flex-col items-center mb-6">
          {logo ? (
            <div className="w-24 h-24 rounded-lg overflow-hidden flex items-center justify-center bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 shadow-md mb-4">
              <img 
                src={logo} 
                alt={currentMarketplace.marketplace}
                className="w-20 h-20 object-contain"
              />
            </div>
          ) : (
            <div className="w-24 h-24 rounded-lg flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600 shadow-md mb-4">
              <Store className="w-12 h-12 text-white" />
            </div>
          )}
          <h4 className="text-xl font-bold text-gray-900 dark:text-white text-center">
            {currentMarketplace.marketplace}
          </h4>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-zinc-900 rounded-lg mb-6">
          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Pedidos</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {currentMarketplace.orders_count}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Receita Total</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(currentMarketplace.revenue)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Lucro Total</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(currentMarketplace.profit)}
            </p>
          </div>
        </div>

        {/* Navegação */}
        {data.length > 1 && (
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevious}
              className="flex items-center gap-1"
              aria-label="Marketplace anterior"
            >
              <ChevronLeft className="w-4 h-4" />
              Anterior
            </Button>

            <div className="flex items-center gap-2">
              {data.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentIndex
                      ? 'bg-blue-600 w-6'
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                  aria-label={`Ir para marketplace ${index + 1}`}
                />
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleNext}
              className="flex items-center gap-1"
              aria-label="Próximo marketplace"
            >
              Próximo
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
