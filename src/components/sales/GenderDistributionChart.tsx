import React from 'react';
import { Card } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Loader2, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useGenderDistribution } from '@/hooks/sales/useGenderDistribution';

interface GenderDistributionChartProps {
  organizationId: string;
  refreshTrigger?: number;
}

// Cores do design system: chart-1 (masculino), chart-2 (feminino), muted (não classificado)
const GENDER_COLORS = {
  male: 'hsl(var(--chart-1))',       // Azul
  female: 'hsl(var(--chart-2))',     // Rosa
  unclassified: 'hsl(var(--muted))', // Cinza
};

export const GenderDistributionChart: React.FC<GenderDistributionChartProps> = ({
  organizationId,
  refreshTrigger,
}) => {
  const { data, loading, error } = useGenderDistribution(organizationId, refreshTrigger);

  const chartData = [
    { name: 'Masculino', value: data.male, color: GENDER_COLORS.male, percent: data.malePercent },
    { name: 'Feminino', value: data.female, color: GENDER_COLORS.female, percent: data.femalePercent },
    { name: 'Não classificado', value: data.unclassified, color: GENDER_COLORS.unclassified, percent: data.unclassifiedPercent },
  ].filter((item) => item.value > 0);

  const totalClassified = data.male + data.female;

  // Estado de loading: Skeleton com dimensões fixas (evita layout shift)
  if (loading) {
    return (
      <Card className="gcp-card p-6 border-gray-100 dark:border-zinc-800 h-full">
        <div className="flex items-center justify-center h-[340px]">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="gcp-card p-6 border-gray-100 dark:border-zinc-800 h-full">
        <div className="text-center text-red-500 py-8">{error}</div>
      </Card>
    );
  }

  // Estado vazio: mensagem quando não há classificações
  if (data.total === 0 || totalClassified === 0) {
    return (
      <Card className="gcp-card p-6 border-gray-100 dark:border-zinc-800 h-full">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Users className="w-12 h-12 text-gray-400 mb-3" />
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
            Nenhuma classificação disponível ainda. Execute a classificação em lote para enriquecer seus leads.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="gcp-card p-6 border-gray-100 dark:border-zinc-800 h-full transition-all duration-150 hover:shadow-lg hover:border-orange-500/20">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Distribuição de Gênero
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Classificação por gênero dos leads
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Donut Chart com texto central */}
        <div className="relative flex items-center justify-center">
          <ResponsiveContainer width="100%" height={220}>
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

          {/* Centro do donut: total classificado */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <p className="text-3xl font-bold text-gray-900 dark:text-white leading-none">
              {totalClassified}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Classificados
            </p>
          </div>
        </div>

        {/* Legenda com Badge para cada categoria */}
        <div className="space-y-2.5">
          {/* Masculino */}
          {data.male > 0 && (
            <div className="flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: GENDER_COLORS.male }}
                />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  ♂ Masculino
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="text-xs">
                  {data.malePercent.toFixed(1)}%
                </Badge>
                <span className="text-sm text-gray-500 dark:text-gray-400 w-16 text-right">
                  {data.male} leads
                </span>
              </div>
            </div>
          )}

          {/* Feminino */}
          {data.female > 0 && (
            <div className="flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: GENDER_COLORS.female }}
                />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  ♀ Feminino
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="text-xs">
                  {data.femalePercent.toFixed(1)}%
                </Badge>
                <span className="text-sm text-gray-500 dark:text-gray-400 w-16 text-right">
                  {data.female} leads
                </span>
              </div>
            </div>
          )}

          {/* Não classificado */}
          {data.unclassified > 0 && (
            <div className="flex items-center justify-between py-1.5">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: GENDER_COLORS.unclassified }}
                />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  — Não classificado
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="text-xs">
                  {data.unclassifiedPercent.toFixed(1)}%
                </Badge>
                <span className="text-sm text-gray-500 dark:text-gray-400 w-16 text-right">
                  {data.unclassified} leads
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Total de leads */}
        <div className="pt-2 border-t border-gray-100 dark:border-zinc-800 flex items-center justify-between">
          <span className="text-xs text-gray-500 dark:text-gray-400">Total de Leads</span>
          <span className="text-sm font-bold text-gray-900 dark:text-white">
            {data.total}
          </span>
        </div>
      </div>

      {/* CSS Pack: Card com Interação no Hover */}
      <style>{`
        .gcp-card {
          --card-hover-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
        }

        @media (prefers-reduced-motion: reduce) {
          .gcp-card {
            transition: none !important;
          }
        }
      `}</style>
    </Card>
  );
};
