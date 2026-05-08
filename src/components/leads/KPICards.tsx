/**
 * KPICards Component
 * 
 * Displays four KPI metrics for leads management in a responsive grid.
 * Uses the KPICard component for consistent styling and the useLeadKPIs hook for data.
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 11.7
 */

import React from 'react';
import { KPICard } from '@/components/KPICard';
import { KPICardSkeleton } from '@/components/skeletons/KPICardSkeleton';
import { useLeadKPIs } from '@/hooks/useLeads';
import type { LeadFilters } from '@/types/leads';
import { Users, UserPlus, UserCheck, UserX } from 'lucide-react';

interface KPICardsProps {
  organizationId: string;
  filters?: LeadFilters;
  className?: string;
}

/**
 * KPICards Component
 * 
 * Displays four key performance indicators for leads:
 * 1. Total Leads - Total count of all leads
 * 2. New Leads - Leads created in the last 30 days
 * 3. Qualified Leads - Leads with status 'qualified'
 * 4. Lost Leads - Leads with status 'lost'
 * 
 * Features:
 * - Responsive grid layout (4 cols desktop, 2 cols tablet, 1 col mobile)
 * - Loading skeletons during data fetch
 * - Icons for each metric
 * - Consistent styling with existing dashboard
 * 
 * @param organizationId - The organization ID to fetch KPIs for
 * @param filters - Optional filters to apply to KPI calculations
 * @param className - Optional additional CSS classes
 */
export const KPICards: React.FC<KPICardsProps> = ({
  organizationId,
  filters,
  className = '',
}) => {
  const { data: kpisData, isLoading } = useLeadKPIs(organizationId, filters);

  // Show loading skeletons while fetching data
  if (isLoading) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
        <KPICardSkeleton />
        <KPICardSkeleton />
        <KPICardSkeleton />
        <KPICardSkeleton />
      </div>
    );
  }

  // Default values if data is not available
  const totalLeads = kpisData?.totalLeads ?? 0;
  const newLeads = kpisData?.newLeads ?? 0;
  const qualifiedLeads = kpisData?.qualifiedLeads ?? 0;
  const lostLeads = kpisData?.lostLeads ?? 0;

  // Calculate trend percentages (simplified - in real app would compare to previous period)
  // For now, showing neutral trends as we don't have historical data
  const totalTrend = { direction: 'neutral' as const, percentage: 0 };
  const newTrend = { direction: 'neutral' as const, percentage: 0 };
  const qualifiedTrend = { direction: 'neutral' as const, percentage: 0 };
  const lostTrend = { direction: 'neutral' as const, percentage: 0 };

  return (
    <div 
      className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}
      role="region"
      aria-label="Indicadores de performance de leads"
    >
      {/* Total Leads KPI */}
      <KPICard
        title="Total de Leads"
        value={totalLeads}
        trend={totalTrend}
        format="number"
        icon={<Users className="w-5 h-5" aria-hidden="true" />}
      />

      {/* New Leads KPI */}
      <KPICard
        title="Novos Leads"
        value={newLeads}
        trend={newTrend}
        format="number"
        icon={<UserPlus className="w-5 h-5" aria-hidden="true" />}
      />

      {/* Qualified Leads KPI */}
      <KPICard
        title="Leads Qualificados"
        value={qualifiedLeads}
        trend={qualifiedTrend}
        format="number"
        icon={<UserCheck className="w-5 h-5" aria-hidden="true" />}
      />

      {/* Lost Leads KPI */}
      <KPICard
        title="Leads Perdidos"
        value={lostLeads}
        trend={lostTrend}
        format="number"
        icon={<UserX className="w-5 h-5" aria-hidden="true" />}
      />
    </div>
  );
};

export default KPICards;
