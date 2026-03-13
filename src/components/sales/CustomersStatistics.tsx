import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { supabase } from '@/lib/supabase';
import { Loader2, Users } from 'lucide-react';

interface CustomersStatisticsProps {
  organizationId: string;
  refreshTrigger?: number;
}

interface CustomerData {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

export const CustomersStatistics: React.FC<CustomersStatisticsProps> = ({ organizationId, refreshTrigger }) => {
  const [data, setData] = useState<CustomerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState('this_month');

  useEffect(() => {
    const fetchData = async () => {
      if (!organizationId) return;

      setLoading(true);
      setError(null);

      try {
        // Calcular data de início baseado no período
        const startDate = new Date();
        switch (period) {
          case 'this_week':
            startDate.setDate(startDate.getDate() - 7);
            break;
          case 'this_month':
            startDate.setMonth(startDate.getMonth() - 1);
            break;
          case 'this_quarter':
            startDate.setMonth(startDate.getMonth() - 3);
            break;
          default:
            startDate.setMonth(startDate.getMonth() - 1);
        }

        // Buscar clientes por marketplace (como proxy para segmentação)
        const { data: leadsData, error: fetchError } = await supabase
          .from('leads')
          .select(`
            id,
            marketplace_id,
            marketplaces!marketplace_id (
              name
            )
          `)
          .eq('organization_id', organizationId)
          .gte('created_at', startDate.toISOString());

        if (fetchError) throw fetchError;

        // Agrupar por marketplace
        const marketplaceMap = new Map<string, number>();
        let total = 0;

        leadsData?.forEach((lead) => {
          const marketplaceName = (lead.marketplaces as { name?: string })?.name || 'Outros';
          marketplaceMap.set(marketplaceName, (marketplaceMap.get(marketplaceName) || 0) + 1);
          total++;
        });

        // Converter para array e calcular percentuais
        const colors = ['#487FFF', '#9B51E0', '#45B369', '#FFC861', '#EF4A00'];
        const chartData: CustomerData[] = Array.from(marketplaceMap.entries())
          .map(([name, value], index) => ({
            name,
            value,
            percentage: total > 0 ? Math.round((value / total) * 100) : 0,
            color: colors[index % colors.length],
          }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 5); // Top 5

        setData(chartData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
        console.error('Error fetching customers statistics:', err);
      } finally {
        setLoading(false);
      }
    };

    // Só refetch se refreshTrigger for > 0 (ou seja, após processar pedido)
    if (!refreshTrigger || refreshTrigger === 0) {
      fetchData();
    } else if (refreshTrigger > 0) {
      console.log('🔄 CustomersStatistics: refreshTrigger mudou, refazendo query...', refreshTrigger);
      fetchData();
    }
  }, [organizationId, period, refreshTrigger]);

  const totalCustomers = data.reduce((sum, item) => sum + item.value, 0);

  if (loading) {
    return (
      <Card className="p-6 border-gray-100 dark:border-zinc-800">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6 border-gray-100 dark:border-zinc-800">
        <div className="text-center text-red-500 py-8">{error}</div>
      </Card>
    );
  }

  return (
    <Card className="p-6 border-gray-100 dark:border-zinc-800 h-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Estatísticas de Clientes
        </h3>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[140px] border-gray-200 dark:border-zinc-800">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="this_week">Esta Semana</SelectItem>
            <SelectItem value="this_month">Este Mês</SelectItem>
            <SelectItem value="this_quarter">Este Trimestre</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {data.length > 0 ? (
        <div className="space-y-6">
          {/* Donut Chart */}
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '12px',
                  }}
                  formatter={(value) => [`${Number(value)} clientes`, 'Total']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Total no centro */}
          <div className="text-center -mt-40 mb-32">
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {totalCustomers}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Total de Clientes
            </p>
          </div>

          {/* Lista de categorias */}
          <div className="space-y-3">
            {data.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-zinc-800 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {item.name}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {item.value} clientes
                  </span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {item.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Users className="w-12 h-12 text-gray-400 mb-3" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Sem dados de clientes para o período selecionado
          </p>
        </div>
      )}
    </Card>
  );
};
