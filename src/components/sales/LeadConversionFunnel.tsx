import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Filter, TrendingUp } from 'lucide-react';
import { useLeadConversionFunnel } from '@/hooks/sales/useLeadConversionFunnel';

interface LeadConversionFunnelProps {
  organizationId: string;
  refreshTrigger?: number;
}

export const LeadConversionFunnel: React.FC<LeadConversionFunnelProps> = ({
  organizationId,
  refreshTrigger,
}) => {
  const { data, loading } = useLeadConversionFunnel(organizationId, refreshTrigger);

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600">
            <Filter className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Funil de Conversão
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {data.totalLeads} leads no total
            </p>
          </div>
        </div>

        <Badge className="gap-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30">
          <TrendingUp className="w-3 h-3" />
          {formatPercentage(data.conversionRate)} conversão
        </Badge>
      </div>

      <div className="space-y-4">
        {data.stages.map((stage, index) => {
          const maxCount = Math.max(...data.stages.map(s => s.count));
          const widthPercentage = maxCount > 0 ? (stage.count / maxCount) * 100 : 0;

          return (
            <div key={index} className="relative">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {stage.stage}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {stage.count}
                  </Badge>
                </div>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {formatPercentage(stage.percentage)}
                </span>
              </div>

              {/* Funnel Bar */}
              <div className="relative h-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                <div
                  className={`h-full bg-gradient-to-r ${stage.color} transition-all duration-500 flex items-center justify-center`}
                  style={{ width: `${widthPercentage}%` }}
                >
                  {stage.count > 0 && (
                    <span className="text-white font-semibold text-sm">
                      {stage.count} leads
                    </span>
                  )}
                </div>
              </div>

              {/* Conversion Arrow */}
              {index < data.stages.length - 1 && (
                <div className="flex justify-center my-2">
                  <div className="w-0.5 h-4 bg-gray-300 dark:bg-gray-600"></div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              Taxa de Conversão
            </p>
            <p className="text-lg font-bold text-green-600 dark:text-green-400">
              {formatPercentage(data.conversionRate)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              Total de Leads
            </p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {data.totalLeads}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
};
