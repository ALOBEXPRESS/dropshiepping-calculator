import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useMarketplacePerformance } from '@/hooks/sales/useMarketplacePerformance';
import { Store, TrendingUp, DollarSign, Percent } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface MarketplacePerformanceCardProps {
  organizationId: string;
}

export function MarketplacePerformanceCard({ organizationId }: MarketplacePerformanceCardProps) {
  const { data, loading } = useMarketplacePerformance(organizationId);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance por Marketplace</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);
  const totalProfit = data.reduce((sum, item) => sum + item.profit, 0);
  const totalOrders = data.reduce((sum, item) => sum + item.orders_count, 0);

  const getMarketplaceName = (id: string) => {
    const names: Record<string, string> = {
      'shopee': 'Shopee',
      'mercadolivre': 'Mercado Livre',
      'amazon': 'Amazon',
      'unknown': 'Outros'
    };
    return names[id] || id;
  };

  const getMarketplaceColor = (index: number) => {
    const colors = [
      'from-orange-500 to-orange-600',
      'from-yellow-500 to-yellow-600',
      'from-blue-500 to-blue-600',
      'from-purple-500 to-purple-600'
    ];
    return colors[index % colors.length];
  };

  return (
    <Card role="article" aria-label="Performance por marketplace">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Store className="h-5 w-5" aria-hidden="true" />
          Performance por Marketplace
        </CardTitle>
        <CardDescription>
          Comparação de desempenho entre plataformas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-secondary/50 rounded-lg" role="region" aria-label="Resumo geral de marketplaces">
          <div className="text-center" role="article" aria-label={`Total de pedidos: ${totalOrders}`}>
            <p className="text-sm text-muted-foreground">Total Pedidos</p>
            <p className="text-2xl font-bold">{totalOrders}</p>
          </div>
          <div className="text-center" role="article" aria-label={`Receita total: ${totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`}>
            <p className="text-sm text-muted-foreground">Receita Total</p>
            <p className="text-2xl font-bold">
              {totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          </div>
          <div className="text-center" role="article" aria-label={`Lucro total: ${totalProfit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`}>
            <p className="text-sm text-muted-foreground">Lucro Total</p>
            <p className="text-2xl font-bold">
              {totalProfit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          </div>
        </div>

        <div className="space-y-4" role="list" aria-label="Lista de marketplaces">
          {data.map((marketplace, index) => {
            const revenueShare = totalRevenue > 0 ? (marketplace.revenue / totalRevenue) * 100 : 0;
            const profitShare = totalProfit > 0 ? (marketplace.profit / totalProfit) * 100 : 0;

            return (
              <div 
                key={marketplace.marketplace} 
                className="space-y-2"
                role="listitem"
                aria-label={`${getMarketplaceName(marketplace.marketplace)}: ${marketplace.orders_count} pedidos, receita ${marketplace.revenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}, margem ${marketplace.avg_margin.toFixed(1)}%`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${getMarketplaceColor(index)}`} />
                    <span className="font-medium">{getMarketplaceName(marketplace.marketplace)}</span>
                    {index === 0 && (
                      <Badge 
                        variant="default" 
                        className="text-xs"
                        aria-label="Marketplace com melhor desempenho"
                      >
                        Top
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-muted-foreground">{marketplace.orders_count} pedidos</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3 text-blue-500" />
                        <span className="text-muted-foreground">Receita</span>
                      </div>
                      <span className="font-medium">
                        {marketplace.revenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className={`h-full bg-gradient-to-r ${getMarketplaceColor(index)} transition-all`}
                        style={{ width: `${revenueShare}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground text-right">{revenueShare.toFixed(1)}% do total</p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3 text-green-500" />
                        <span className="text-muted-foreground">Lucro</span>
                      </div>
                      <span className="font-medium">
                        {marketplace.profit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500 transition-all"
                        style={{ width: `${profitShare}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground text-right">{profitShare.toFixed(1)}% do total</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm pt-1">
                  <div className="flex items-center gap-1">
                    <Percent className="h-3 w-3 text-purple-500" />
                    <span className="text-muted-foreground">Margem Média</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{marketplace.avg_margin.toFixed(1)}%</span>
                    <Badge 
                      variant={marketplace.avg_margin >= 20 ? 'default' : 'secondary'} 
                      className="text-xs"
                      aria-label={marketplace.avg_margin >= 20 ? 'Margem ótima' : 'Margem regular'}
                    >
                      {marketplace.avg_margin >= 20 ? 'Ótimo' : 'Regular'}
                    </Badge>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
