import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLowMarginProducts } from '@/hooks/sales/useLowMarginProducts';
import { AlertTriangle, TrendingDown, Package } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface LowMarginProductsAlertProps {
  organizationId: string;
}

export function LowMarginProductsAlert({ organizationId }: LowMarginProductsAlertProps) {
  const { data, loading } = useLowMarginProducts(organizationId, 20);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Produtos com Margem Baixa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const criticalProducts = data.filter(p => p.avg_margin < 10);
  const warningProducts = data.filter(p => p.avg_margin >= 10 && p.avg_margin < 20);

  const getMarginColor = (margin: number) => {
    if (margin < 10) return 'text-red-500';
    if (margin < 15) return 'text-orange-500';
    return 'text-yellow-500';
  };

  const getMarginBadge = (margin: number) => {
    if (margin < 10) return { variant: 'destructive' as const, label: 'Crítico' };
    if (margin < 15) return { variant: 'secondary' as const, label: 'Atenção' };
    return { variant: 'outline' as const, label: 'Baixo' };
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          Produtos com Margem Baixa
        </CardTitle>
        <CardDescription>
          Produtos com margem de lucro abaixo de 20%
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <Alert>
            <Package className="h-4 w-4" />
            <AlertDescription>
              Parabéns! Todos os produtos têm margem de lucro saudável (≥ 20%)
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <p className="text-sm font-medium text-red-500">Críticos</p>
                </div>
                <p className="text-2xl font-bold">{criticalProducts.length}</p>
                <p className="text-xs text-muted-foreground">Margem {'<'} 10%</p>
              </div>

              <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingDown className="h-4 w-4 text-orange-500" />
                  <p className="text-sm font-medium text-orange-500">Atenção</p>
                </div>
                <p className="text-2xl font-bold">{warningProducts.length}</p>
                <p className="text-xs text-muted-foreground">Margem 10-20%</p>
              </div>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {data.map((product, index) => {
                const badge = getMarginBadge(product.avg_margin);
                
                return (
                  <div 
                    key={index} 
                    className="p-3 border rounded-lg hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-medium text-sm line-clamp-2">{product.product_name}</p>
                      </div>
                      <Badge variant={badge.variant} className="ml-2">
                        {badge.label}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-4 gap-2 text-xs">
                      <div>
                        <p className="text-muted-foreground">Margem</p>
                        <p className={`font-bold ${getMarginColor(product.avg_margin)}`}>
                          {product.avg_margin.toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Lucro</p>
                        <p className="font-medium">
                          {product.total_profit.toLocaleString('pt-BR', { 
                            style: 'currency', 
                            currency: 'BRL',
                            minimumFractionDigits: 2
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Vendidos</p>
                        <p className="font-medium">{product.total_sold}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Receita</p>
                        <p className="font-medium">
                          {product.total_revenue.toLocaleString('pt-BR', { 
                            style: 'currency', 
                            currency: 'BRL',
                            minimumFractionDigits: 2
                          })}
                        </p>
                      </div>
                    </div>

                    {product.avg_margin < 10 && (
                      <div className="mt-2 pt-2 border-t">
                        <p className="text-xs text-red-500 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Considere revisar o preço ou fornecedor deste produto
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
