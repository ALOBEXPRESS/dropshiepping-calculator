/**
 * LeadsMobileList Component
 * 
 * Mobile-optimized list view using card-based layout.
 * Replaces LeadsTableContent on small screens.
 * 
 * Requirements: 11.1, 11.2
 */

import React, { useMemo } from 'react';
import { LeadMobileCard } from './LeadMobileCard';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import type { Lead } from '@/types/leads';

interface LeadsMobileListProps {
  leads: Lead[];
  isLoading: boolean;
  onEdit: (lead: Lead) => void;
  onDelete: (leadId: string) => void;
  selectedLeads: string[];
  onSelectionChange: (leadIds: string[]) => void;
}

/**
 * LeadsMobileList - Mobile-optimized list component
 * 
 * Features:
 * - Stacked card layout for mobile
 * - Select all checkbox
 * - Touch-friendly spacing
 * - Responsive design
 */
export function LeadsMobileList({
  leads,
  isLoading,
  onEdit,
  onDelete,
  selectedLeads,
  onSelectionChange,
}: LeadsMobileListProps) {
  // Calculate if all leads are selected
  const allSelected = useMemo(() => {
    return leads.length > 0 && selectedLeads.length === leads.length;
  }, [leads.length, selectedLeads.length]);

  // Calculate if some (but not all) leads are selected
  const someSelected = useMemo(() => {
    return selectedLeads.length > 0 && selectedLeads.length < leads.length;
  }, [leads.length, selectedLeads.length]);

  /**
   * Handle "select all" checkbox toggle
   */
  const handleSelectAll = () => {
    if (allSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(leads.map(lead => lead.id));
    }
  };

  /**
   * Handle individual lead selection
   */
  const handleSelectLead = (leadId: string) => {
    if (selectedLeads.includes(leadId)) {
      onSelectionChange(selectedLeads.filter(id => id !== leadId));
    } else {
      onSelectionChange([...selectedLeads, leadId]);
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-lg border border-gray-200 dark:border-zinc-800 p-6">
        <div className="text-center text-muted-foreground">
          Carregando leads...
        </div>
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 dark:border-zinc-800 p-6">
        <div className="text-center text-muted-foreground">
          Nenhum lead encontrado
        </div>
      </div>
    );
  }

  return (
    <div
      role="region"
      aria-label="Lista de leads"
      className="space-y-4"
    >
      {/* Select all header */}
      <div className="flex items-center gap-3 px-1">
        <Checkbox
          checked={allSelected}
          onCheckedChange={handleSelectAll}
          aria-label="Selecionar todos os leads"
          className={someSelected ? 'data-[state=checked]:bg-primary/50' : ''}
        />
        <Label className="text-sm font-medium">
          {selectedLeads.length > 0
            ? `${selectedLeads.length} selecionado${selectedLeads.length > 1 ? 's' : ''}`
            : 'Selecionar todos'}
        </Label>
      </div>

      {/* Lead cards */}
      <div className="space-y-3">
        {leads.map((lead, index) => (
          <LeadMobileCard
            key={lead.id}
            lead={lead}
            index={index}
            isSelected={selectedLeads.includes(lead.id)}
            onSelect={handleSelectLead}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}
