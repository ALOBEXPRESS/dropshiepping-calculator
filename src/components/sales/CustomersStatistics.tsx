import React from 'react';
import { Card } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Loader2, Users } from 'lucide-react';
import { useLeadConversionFunnel } from '@/hooks/sales/useLeadConversionFunnel';

interface CustomersStatisticsProps {
  organizationId: string;
  refreshTrigger?: number;
}

// Map gradient class → solid hex for recharts (which can't use Tailwind gradients)
const STAGE_COLORS: Record<string, string> = {
  'Novos Leads':  '#3b82f6', // blue-500
  'Recorrentes':  '#6366f1', // indigo-500
  'Convertidos':  '#22c55e', // green-500
  'Qualificados': '#10b981', // emerald-500
};

export const CustomersStatistics: React.FC<CustomersStatisticsProps> = ({
  organizationId,
  refreshTrigger,
}) => {
  const { data, loading, error } = useLeadConversionFunnel(organizationId, refreshTrigger);

  const chartData = data.stages
    .filter((s) => s.count > 0)
    .map((s) => ({
      name: s.stage,
      value: s.count,
      color: STAGE_COLORS[s.stage] ?? '#487FFF',
    }));

  if (loading) {
    return (
      <Card className="p-6 border-gray-100 dark:border-zinc-800 h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6 border-gray-100 dark:border-zinc-800 h-full flex items-center justify-center">
        <div className="text-center text-red-500">{error}</div>
      </Card>
    );
  }

  return (
    <Card className="p-6 border-gray-100 dark:border-zinc-800 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Funil de Leads
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Classificação por estágio de conversão
          </p>
        </div>
      </div>

      {chartData.length > 0 ? (
        <div className="space-y-4 flex-1 flex flex-col">
          {/* Donut Chart */}
          <div className="relative flex items-center justify-center flex-1">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={58}
                  outerRadius={88}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(24,24,27,0.95)',
                    border: '1px solid #3f3f46',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    color: '#fff',
                  }}
                  formatter={(value: number, name: string) => [`${value} leads`, name]}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Centro do donut */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="text-3xl font-bold text-gray-900 dark:text-white leading-none">
                {data.totalLeads}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Total de Leads
              </p>
            </div>
          </div>

          {/* Legenda */}
          <div className="space-y-2">
            {data.stages.map((stage) => (
              <div
                key={stage.stage}
                className="flex items-center justify-between py-1 border-b border-gray-100 dark:border-zinc-800 last:border-0"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: STAGE_COLORS[stage.stage] ?? '#487FFF' }}
                  />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {stage.stage}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {stage.count} leads
                  </span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white w-12 text-right">
                    {stage.percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Taxa de conversão */}
          <div className="pt-2 border-t border-gray-100 dark:border-zinc-800 flex items-center justify-between">
            <span className="text-xs text-gray-500 dark:text-gray-400">Taxa de Conversão</span>
            <span className="text-sm font-bold text-green-600 dark:text-green-400">
              {data.conversionRate.toFixed(1)}%
            </span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Users className="w-12 h-12 text-gray-400 mb-3" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Nenhum lead encontrado
          </p>
        </div>
      )}
    </Card>
  );
};
