/**
 * GenderLeadsList Component
 * 
 * Exibe lista de leads filtrados por gênero com informações de produtos
 * Mostra nome do lead, gênero, probabilidade e produtos que tentou comprar
 */

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, ShoppingBag, TrendingUp } from 'lucide-react';
import { useLeadsWithGender } from '@/hooks/sales/useLeadsWithGender';
import type { GenderFilter } from './GenderFilterBar';
import { Avatar } from '@/components/ui/avatar';

interface GenderLeadsListProps {
  organizationId: string;
  genderFilter: GenderFilter;
  refreshTrigger?: number;
}

export const GenderLeadsList: React.FC<GenderLeadsListProps> = ({
  organizationId,
  genderFilter,
  refreshTrigger,
}) => {
  const { leads, loading, error } = useLeadsWithGender(
    organizationId,
    genderFilter,
    refreshTrigger
  );

  const getGenderIcon = (gender: 'male' | 'female' | null) => {
    if (gender === 'male') return '♂';
    if (gender === 'female') return '♀';
    return '?';
  };

  const getGenderColor = (gender: 'male' | 'female' | null) => {
    if (gender === 'male') return 'text-blue-600 dark:text-blue-400';
    if (gender === 'female') return 'text-pink-600 dark:text-pink-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const formatProbability = (prob: number | null) => {
    if (prob === null) return 'N/A';
    return `${(prob * 100).toFixed(0)}%`;
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center text-red-600 dark:text-red-400">
          <p className="text-sm">Erro ao carregar leads</p>
          <p className="text-xs mt-1">{error}</p>
        </div>
      </Card>
    );
  }

  const getFilterTitle = () => {
    if (genderFilter === 'male') return 'Leads Masculinos';
    if (genderFilter === 'female') return 'Leads Femininos';
    return 'Todos os Leads';
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600">
          <Users className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {getFilterTitle()}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {leads.length} {leads.length === 1 ? 'lead encontrado' : 'leads encontrados'}
          </p>
        </div>
      </div>

      {leads.length === 0 ? (
        <div className="text-center py-8">
          <Users className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Nenhum lead encontrado com este filtro
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {leads.map((lead) => (
            <div
              key={lead.lead_id}
              className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <Avatar className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold text-sm">
                  {getInitials(lead.lead_name)}
                </Avatar>
                {lead.gender && (
                  <div
                    className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white dark:bg-gray-900 flex items-center justify-center text-xs ${getGenderColor(lead.gender)}`}
                  >
                    {getGenderIcon(lead.gender)}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="font-medium text-sm text-gray-900 dark:text-white truncate">
                    {lead.lead_name}
                  </p>
                  {lead.gender_probability !== null && (
                    <Badge
                      variant="outline"
                      className="text-xs flex-shrink-0"
                    >
                      <TrendingUp className="w-3 h-3 mr-1" />
                      {formatProbability(lead.gender_probability)}
                    </Badge>
                  )}
                </div>

                {/* Stats */}
                <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <ShoppingBag className="w-3 h-3" />
                    <span>
                      {lead.total_orders} {lead.total_orders === 1 ? 'pedido' : 'pedidos'}
                    </span>
                  </div>
                  {lead.total_spent > 0 && (
                    <div className="flex items-center gap-1">
                      <span className="font-medium text-green-600 dark:text-green-400">
                        R$ {Number(lead.total_spent).toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Contact Info */}
                {(lead.lead_email || lead.lead_phone) && (
                  <div className="mt-1 text-xs text-gray-400 dark:text-gray-500 truncate">
                    {lead.lead_email && <span>{lead.lead_email}</span>}
                    {lead.lead_email && lead.lead_phone && <span className="mx-1">•</span>}
                    {lead.lead_phone && <span>{lead.lead_phone}</span>}
                  </div>
                )}

                {/* Last Order Date */}
                {lead.last_order_date && (
                  <div className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                    Último pedido:{' '}
                    {new Date(lead.last_order_date).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: '2-digit',
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
