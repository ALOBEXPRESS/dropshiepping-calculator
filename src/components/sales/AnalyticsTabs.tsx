import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  ShoppingBag, 
  MapPin, 
  CreditCard,
  ChevronRight 
} from 'lucide-react';
import { TopSellingProductsTable } from './TopSellingProductsTable';
import { RecentOrdersChart } from './RecentOrdersChart';
import { BrazilStatesDistribution } from './BrazilStatesDistribution';
import { TransactionsList } from './TransactionsList';

interface AnalyticsTabsProps {
  organizationId: string;
  refreshTrigger?: number;
}

export const AnalyticsTabs: React.FC<AnalyticsTabsProps> = ({ 
  organizationId, 
  refreshTrigger 
}) => {
  return (
    <Tabs defaultValue="products" className="w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <TabsList className="w-full sm:w-auto grid grid-cols-2 sm:flex sm:grid-cols-none gap-1">
          <TabsTrigger value="products" className="gap-2">
            <TrendingUp className="w-4 h-4" />
            <span className="hidden sm:inline">Produtos Mais Vendidos</span>
            <span className="sm:hidden">Produtos</span>
          </TabsTrigger>
          <TabsTrigger value="orders" className="gap-2">
            <ShoppingBag className="w-4 h-4" />
            <span className="hidden sm:inline">Pedidos Recentes</span>
            <span className="sm:hidden">Pedidos</span>
          </TabsTrigger>
          <TabsTrigger value="map" className="gap-2">
            <MapPin className="w-4 h-4" />
            <span className="hidden sm:inline">Distribuição</span>
            <span className="sm:hidden">Mapa</span>
          </TabsTrigger>
          <TabsTrigger value="transactions" className="gap-2">
            <CreditCard className="w-4 h-4" />
            <span className="hidden sm:inline">Transações</span>
            <span className="sm:hidden">Transações</span>
          </TabsTrigger>
        </TabsList>
        
        <Button variant="ghost" size="sm" className="hidden sm:flex">
          Ver Todos
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>

      <TabsContent value="products" className="mt-0">
        <TopSellingProductsTable 
          organizationId={organizationId} 
          limit={6} 
          refreshTrigger={refreshTrigger} 
        />
      </TabsContent>

      <TabsContent value="orders" className="mt-0">
        <RecentOrdersChart 
          organizationId={organizationId} 
          refreshTrigger={refreshTrigger} 
        />
      </TabsContent>

      <TabsContent value="map" className="mt-0">
        <BrazilStatesDistribution 
          organizationId={organizationId} 
          refreshTrigger={refreshTrigger} 
        />
      </TabsContent>

      <TabsContent value="transactions" className="mt-0">
        <TransactionsList 
          organizationId={organizationId} 
          refreshTrigger={refreshTrigger} 
        />
      </TabsContent>
    </Tabs>
  );
};
