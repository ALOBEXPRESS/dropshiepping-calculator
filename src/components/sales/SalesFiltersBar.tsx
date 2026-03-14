import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { SalesFilters } from '@/hooks/useFilterPersistence';

interface SalesFiltersBarProps {
  filters: SalesFilters;
  onFiltersChange: (filters: SalesFilters) => void;
  onReset: () => void;
}

export const SalesFiltersBar: React.FC<SalesFiltersBarProps> = ({
  filters,
  onFiltersChange,
  onReset,
}) => {
  const hasActiveFilters = !!(filters.startDate || filters.endDate || filters.marketplaceId);

  return (
    <div
      className="flex flex-wrap items-end gap-3 p-3 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
      role="search"
      aria-label="Filtros de vendas"
    >
      <div className="flex flex-col gap-1">
        <Label htmlFor="filter-start" className="text-xs text-gray-500 dark:text-gray-400">
          Data inicial
        </Label>
        <Input
          id="filter-start"
          type="date"
          value={filters.startDate ?? ''}
          onChange={(e) => onFiltersChange({ ...filters, startDate: e.target.value || undefined })}
          className="h-8 text-sm w-36"
          aria-label="Filtrar por data inicial"
        />
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="filter-end" className="text-xs text-gray-500 dark:text-gray-400">
          Data final
        </Label>
        <Input
          id="filter-end"
          type="date"
          value={filters.endDate ?? ''}
          onChange={(e) => onFiltersChange({ ...filters, endDate: e.target.value || undefined })}
          className="h-8 text-sm w-36"
          aria-label="Filtrar por data final"
        />
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="filter-marketplace" className="text-xs text-gray-500 dark:text-gray-400">
          Marketplace
        </Label>
        <Input
          id="filter-marketplace"
          type="text"
          placeholder="ID do canal"
          value={filters.marketplaceId ?? ''}
          onChange={(e) =>
            onFiltersChange({ ...filters, marketplaceId: e.target.value || undefined })
          }
          className="h-8 text-sm w-36"
          aria-label="Filtrar por marketplace"
        />
      </div>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="h-8 gap-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          aria-label="Limpar todos os filtros"
        >
          <X className="w-3.5 h-3.5" aria-hidden="true" />
          Limpar filtros
        </Button>
      )}
    </div>
  );
};
