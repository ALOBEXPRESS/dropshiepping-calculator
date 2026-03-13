import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useRevenueProfitTrend } from '@/hooks/sales/useRevenueProfitTrend';
import { TrendingUp, TrendingDown, DollarSign, Wallet } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';

interface RevenueProfitTrendChartProps {
  organizationId: string;
}

export function RevenueProfitTrendChart({ organizationId }: RevenueProfitTrendChartProps) {
  const [period, setPeriod] = useState<number>(30);
  const { data, loading } = useRevenueProfitTrend(organizationId, period);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Evolução Receita vs Lucro</CardTitle>
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
  const avgMargin = data.length > 0 
    ? data.reduce((sum, item) => sum + item.avg_margin, 0) / data.length 
    : 0;

  // Calculate growth (compare first half vs second half)
  const midPoint = Math.floor(data.length / 2);
  const firstHalf = data.slice(0, midPoint);
  const secondHalf = data.slice(midPoint);
  
  const firstHalfRevenue = firstHalf.reduce((sum, item) => sum + item.revenue, 0);
  const secondHalfRevenue = secondHalf.reduce((sum, item) => sum + item.revenue, 0);
  const revenueGrowth = firstHalfRevenue > 0 
    ? ((secondHalfRevenue - firstHalfRevenue) / firstHalfRevenue) * 100 
    : 0;

  const maxRevenue = Math.max(...data.map(d => d.revenue), 1);
  const maxProfit = Math.max(...data.map(d => d.profit), 1);

  return (
    <Card role="article" aria-label="Evolução de receita e lucro">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Evolução Receita vs Lucro</CardTitle>
            <CardDescription>Últimos {period} dias</CardDescription>
          </div>
          <Select value={period.toString()} onValueChange={(v) => setPeriod(Number(v))}>
            <SelectTrigger className="w-32" aria-label="Selecionar período de análise">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 dias</SelectItem>
              <SelectItem value="30">30 dias</SelectItem>
              <SelectItem value="90">90 dias</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 mb-6" role="region" aria-label="Resumo financeiro">
          <div className="space-y-1" role="article" aria-label={`Receita total: ${totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`}>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-blue-500" aria-hidden="true" />
              <p className="text-sm text-muted-foreground">Receita Total</p>
            </div>
            <p className="text-2xl font-bold">
              {totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
            <div className="flex items-center gap-1">
              {revenueGrowth >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500" aria-hidden="true" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500" aria-hidden="true" />
              )}
              <span 
                className={`text-xs ${revenueGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}
                aria-label={`Crescimento de ${revenueGrowth.toFixed(1)}%`}
              >
                {revenueGrowth.toFixed(1)}%
              </span>
            </div>
          </div>

          <div className="space-y-1" role="article" aria-label={`Lucro total: ${totalProfit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`}>
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-green-500" aria-hidden="true" />
              <p className="text-sm text-muted-foreground">Lucro Total</p>
            </div>
            <p className="text-2xl font-bold">
              {totalProfit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          </div>

          <div className="space-y-1" role="article" aria-label={`Margem média: ${avgMargin.toFixed(1)}%`}>
            <p className="text-sm text-muted-foreground">Margem Média</p>
            <p className="text-2xl font-bold">{avgMargin.toFixed(1)}%</p>
            <Badge 
              variant={avgMargin >= 20 ? 'default' : 'destructive'}
              aria-label={avgMargin >= 20 ? 'Margem saudável' : 'Margem requer atenção'}
            >
              {avgMargin >= 20 ? 'Saudável' : 'Atenção'}
            </Badge>
          </div>
        </div>

        <div className="space-y-3" role="list" aria-label="Histórico diário de receita e lucro">
          {data.slice(-10).map((item, index) => {
            const revenueWidth = (item.revenue / maxRevenue) * 100;
            const profitWidth = (item.profit / maxProfit) * 100;
            const date = new Date(item.date).toLocaleDateString('pt-BR', { 
              day: '2-digit', 
              month: 'short' 
            });

            return (
              <div 
                key={index} 
                className="space-y-1"
                role="listitem"
                aria-label={`${date}: Receita ${item.revenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}, Lucro ${item.profit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`}
              >
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{date}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-blue-500">
                      {item.revenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                    <span className="text-green-500">
                      {item.profit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 rounded-full transition-all"
                      style={{ width: `${revenueWidth}%` }}
                    />
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500 rounded-full transition-all"
                      style={{ width: `${profitWidth}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-center gap-6 mt-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full" />
            <span>Receita</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full" />
            <span>Lucro</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
