import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useGeographicSales } from '@/hooks/sales/useGeographicSales';
import { MapPin, TrendingUp, DollarSign, Package } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface EnhancedGeographicSalesProps {
  organizationId: string;
}

export function EnhancedGeographicSales({ organizationId }: EnhancedGeographicSalesProps) {
  const { stateData, cityData, loading } = useGeographicSales(organizationId);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Análise Geográfica de Vendas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalRevenue = stateData.reduce((sum, state) => sum + state.total_revenue, 0);
  const totalProfit = stateData.reduce((sum, state) => sum + state.total_profit, 0);
  const totalOrders = stateData.reduce((sum, state) => sum + state.order_count, 0);

  const getStateColor = (index: number) => {
    const colors = [
      'from-blue-500 to-blue-600',
      'from-green-500 to-green-600',
      'from-purple-500 to-purple-600',
      'from-orange-500 to-orange-600',
      'from-pink-500 to-pink-600'
    ];
    return colors[index % colors.length];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Análise Geográfica de Vendas
        </CardTitle>
        <CardDescription>
          Distribuição de vendas por estados e cidades
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="states" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="states">Por Estado</TabsTrigger>
            <TabsTrigger value="cities">Top Cidades</TabsTrigger>
          </TabsList>

          <TabsContent value="states" className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Package className="h-4 w-4 text-blue-500" />
                  <p className="text-sm font-medium text-blue-500">Total Pedidos</p>
                </div>
                <p className="text-2xl font-bold">{totalOrders}</p>
              </div>

              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="h-4 w-4 text-green-500" />
                  <p className="text-sm font-medium text-green-500">Receita Total</p>
                </div>
                <p className="text-2xl font-bold">
                  {totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
              </div>

              <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-4 w-4 text-purple-500" />
                  <p className="text-sm font-medium text-purple-500">Lucro Total</p>
                </div>
                <p className="text-2xl font-bold">
                  {totalProfit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
              </div>
            </div>

            {/* States List */}
            <div className="space-y-3">
              {stateData.slice(0, 10).map((state, index) => {
                const revenueShare = totalRevenue > 0 ? (state.total_revenue / totalRevenue) * 100 : 0;

                return (
                  <div key={state.state_code} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${getStateColor(index)} flex items-center justify-center text-white font-bold text-sm`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{state.state_name}</p>
                          <p className="text-xs text-muted-foreground">{state.state_code}</p>
                        </div>
                        {index === 0 && (
                          <Badge variant="default" className="text-xs">
                            Top Estado
                          </Badge>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {state.total_revenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </p>
                        <p className="text-xs text-muted-foreground">{state.order_count} pedidos</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <p className="text-muted-foreground">Participação</p>
                        <p className="font-medium">{revenueShare.toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Lucro</p>
                        <p className="font-medium text-green-600">
                          {state.total_profit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Margem</p>
                        <p className="font-medium">{state.avg_margin.toFixed(1)}%</p>
                      </div>
                    </div>

                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className={`h-full bg-gradient-to-r ${getStateColor(index)} transition-all`}
                        style={{ width: `${revenueShare}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="cities" className="space-y-4">
            <div className="space-y-3">
              {cityData.map((city, index) => {
                const cityRevenueShare = totalRevenue > 0 ? (city.total_revenue / totalRevenue) * 100 : 0;

                return (
                  <div key={`${city.city_name}-${city.state_code}`} className="p-4 border rounded-lg hover:bg-secondary/50 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${getStateColor(index)} flex items-center justify-center text-white font-bold text-sm`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{city.city_name}</p>
                          <p className="text-xs text-muted-foreground">{city.state_code}</p>
                        </div>
                        {index === 0 && (
                          <Badge variant="default" className="text-xs">
                            Top Cidade
                          </Badge>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {city.total_revenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </p>
                        <p className="text-xs text-muted-foreground">{city.order_count} pedidos</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-xs">
                      <div>
                        <p className="text-muted-foreground">Participação</p>
                        <p className="font-medium">{cityRevenueShare.toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Lucro</p>
                        <p className="font-medium text-green-600">
                          {city.total_profit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Ticket Médio</p>
                        <p className="font-medium">
                          {(city.total_revenue / city.order_count).toLocaleString('pt-BR', { 
                            style: 'currency', 
                            currency: 'BRL' 
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 h-2 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className={`h-full bg-gradient-to-r ${getStateColor(index)} transition-all`}
                        style={{ width: `${cityRevenueShare}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {cityData.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum dado de cidade disponível
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
