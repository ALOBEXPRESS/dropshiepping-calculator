/**
 * Gender Classification Funnel
 * 
 * Componente visual elegante que exibe o funil de leads com classificação de gênero.
 * Design: Data-Dense Dashboard com cores azul/laranja e tipografia Fira.
 * 
 * Features:
 * - Donut chart com distribuição de gênero
 * - Estatísticas de conversão
 * - Indicadores de progresso
 * - Animações suaves
 */

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  UserCheck, 
  UserX, 
  TrendingUp, 
  Sparkles,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

interface GenderStats {
  total: number;
  male: number;
  female: number;
  unclassified: number;
  malePercentage: number;
  femalePercentage: number;
  unclassifiedPercentage: number;
  classificationRate: number;
}

interface GenderClassificationFunnelProps {
  organizationId: string;
  refreshTrigger?: number;
  onClassifyClick?: () => void;
  className?: string;
}

export const GenderClassificationFunnel: React.FC<GenderClassificationFunnelProps> = ({
  organizationId,
  refreshTrigger,
  onClassifyClick,
  className
}) => {
  const [stats, setStats] = useState<GenderStats>({
    total: 0,
    male: 0,
    female: 0,
    unclassified: 0,
    malePercentage: 0,
    femalePercentage: 0,
    unclassifiedPercentage: 0,
    classificationRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    if (!organizationId) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('leads')
        .select('gender')
        .eq('organization_id', organizationId);

      if (fetchError) throw fetchError;

      const total = data?.length || 0;
      const male = data?.filter(l => l.gender === 'male').length || 0;
      const female = data?.filter(l => l.gender === 'female').length || 0;
      const unclassified = data?.filter(l => l.gender === null).length || 0;

      const malePercentage = total > 0 ? (male / total) * 100 : 0;
      const femalePercentage = total > 0 ? (female / total) * 100 : 0;
      const unclassifiedPercentage = total > 0 ? (unclassified / total) * 100 : 0;
      const classificationRate = total > 0 ? ((male + female) / total) * 100 : 0;

      setStats({
        total,
        male,
        female,
        unclassified,
        malePercentage,
        femalePercentage,
        unclassifiedPercentage,
        classificationRate
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar estatísticas');
      console.error('Error fetching gender stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [organizationId, refreshTrigger, fetchStats]);

  // Calcular ângulos para o donut chart
  const maleAngle = (stats.malePercentage / 100) * 360;
  const femaleAngle = (stats.femalePercentage / 100) * 360;

  // Criar path do SVG para o donut chart
  const createArc = (startAngle: number, endAngle: number, radius: number, innerRadius: number) => {
    const start = polarToCartesian(50, 50, radius, endAngle);
    const end = polarToCartesian(50, 50, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

    const innerStart = polarToCartesian(50, 50, innerRadius, endAngle);
    const innerEnd = polarToCartesian(50, 50, innerRadius, startAngle);

    return [
      'M', start.x, start.y,
      'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y,
      'L', innerEnd.x, innerEnd.y,
      'A', innerRadius, innerRadius, 0, largeArcFlag, 1, innerStart.x, innerStart.y,
      'Z'
    ].join(' ');
  };

  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians)
    };
  };

  if (loading) {
    return (
      <Card className={cn("p-6 border-gray-200 dark:border-zinc-800", className)}>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn("p-6 border-gray-200 dark:border-zinc-800", className)}>
        <div className="text-center text-red-500 py-8">{error}</div>
      </Card>
    );
  }

  return (
    <Card className={cn("p-6 border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1" style={{ fontFamily: "'Fira Sans', sans-serif" }}>
            Funil de Leads
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Classificação por gênero via Genderize.io
          </p>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={fetchStats}
          className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        >
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Donut Chart + Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Donut Chart */}
        <div className="flex items-center justify-center">
          <div className="relative w-48 h-48">
            <svg viewBox="0 0 100 100" className="transform -rotate-90">
              {/* Male segment */}
              {stats.male > 0 && (
                <path
                  d={createArc(0, maleAngle, 45, 30)}
                  fill="#3B82F6"
                  className="transition-all duration-300 hover:opacity-80 cursor-pointer"
                  style={{ filter: 'drop-shadow(0 2px 4px rgba(59, 130, 246, 0.3))' }}
                />
              )}
              {/* Female segment */}
              {stats.female > 0 && (
                <path
                  d={createArc(maleAngle, maleAngle + femaleAngle, 45, 30)}
                  fill="#EC4899"
                  className="transition-all duration-300 hover:opacity-80 cursor-pointer"
                  style={{ filter: 'drop-shadow(0 2px 4px rgba(236, 72, 153, 0.3))' }}
                />
              )}
              {/* Unclassified segment */}
              {stats.unclassified > 0 && (
                <path
                  d={createArc(maleAngle + femaleAngle, 360, 45, 30)}
                  fill="#94A3B8"
                  className="transition-all duration-300 hover:opacity-80 cursor-pointer"
                  style={{ filter: 'drop-shadow(0 2px 4px rgba(148, 163, 184, 0.3))' }}
                />
              )}
            </svg>
            {/* Center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-3xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: "'Fira Code', monospace" }}>
                {stats.total}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Total de Leads
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="space-y-3">
          {/* Novos Leads (Masculino) */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-blue-600 dark:text-blue-400 uppercase tracking-wide font-medium">
                  Masculino
                </p>
                <p className="text-lg font-bold text-blue-900 dark:text-blue-100" style={{ fontFamily: "'Fira Code', monospace" }}>
                  {stats.male} leads
                </p>
              </div>
            </div>
            <Badge className="bg-blue-500 text-white hover:bg-blue-600">
              {stats.malePercentage.toFixed(1)}%
            </Badge>
          </div>

          {/* Recorrentes (Feminino) */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-pink-50 dark:bg-pink-950/20 border border-pink-200 dark:border-pink-800/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-pink-500 flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-pink-600 dark:text-pink-400 uppercase tracking-wide font-medium">
                  Feminino
                </p>
                <p className="text-lg font-bold text-pink-900 dark:text-pink-100" style={{ fontFamily: "'Fira Code', monospace" }}>
                  {stats.female} leads
                </p>
              </div>
            </div>
            <Badge className="bg-pink-500 text-white hover:bg-pink-600">
              {stats.femalePercentage.toFixed(1)}%
            </Badge>
          </div>

          {/* Não Classificados */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-400 flex items-center justify-center">
                <UserX className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide font-medium">
                  Não Classificados
                </p>
                <p className="text-lg font-bold text-gray-900 dark:text-gray-100" style={{ fontFamily: "'Fira Code', monospace" }}>
                  {stats.unclassified} leads
                </p>
              </div>
            </div>
            <Badge variant="outline" className="border-gray-400 text-gray-600 dark:text-gray-400">
              {stats.unclassifiedPercentage.toFixed(1)}%
            </Badge>
          </div>
        </div>
      </div>

      {/* Taxa de Conversão */}
      <div className="p-4 rounded-lg bg-gradient-to-r from-blue-50 to-pink-50 dark:from-blue-950/20 dark:to-pink-950/20 border border-blue-200 dark:border-blue-800/30">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Taxa de Classificação
            </p>
          </div>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400" style={{ fontFamily: "'Fira Code', monospace" }}>
            {stats.classificationRate.toFixed(1)}%
          </p>
        </div>
        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-pink-500 transition-all duration-500 ease-out"
            style={{ width: `${stats.classificationRate}%` }}
          />
        </div>
      </div>

      {/* CTA Button */}
      {stats.unclassified > 0 && onClassifyClick && (
        <div className="mt-6">
          <Button
            onClick={onClassifyClick}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold shadow-lg shadow-orange-500/30 transition-all duration-200"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Classificar {stats.unclassified} Leads Pendentes
          </Button>
        </div>
      )}
    </Card>
  );
};
