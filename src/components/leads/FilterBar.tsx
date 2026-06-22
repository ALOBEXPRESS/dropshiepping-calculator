/**
 * FilterBar Component
 * 
 * Provides comprehensive filtering options for the leads table:
 * - Search input with debounce (300ms)
 * - Status filter (multi-select)
 * - Marketplace filter (multi-select)
 * - Gender filter (multi-select)
 * - Date range filter with presets
 * - Filter result counter
 * - Clear filters button
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.7, 3.8, 12.2
 */

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import {
  Search,
  X,
  Filter,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useDebounce } from '@/hooks/useDebounce';
import { useLeadMarketplaces } from '@/hooks/useLeads';
import type { LeadFilters, LeadStatus, Gender } from '@/types/leads';
import { LEAD_STATUS_OPTIONS } from './constants';

interface FilterBarProps {
  organizationId: string;
  filters: LeadFilters;
  onFiltersChange: (filters: LeadFilters) => void;
  resultCount: number;
  className?: string;
}

// Date range presets
const DATE_PRESETS = [
  { label: 'Últimos 7 dias', days: 7 },
  { label: 'Últimos 30 dias', days: 30 },
  { label: 'Últimos 90 dias', days: 90 },
  { label: 'Todos', days: null },
];

// Gender options
const GENDER_OPTIONS = [
  { value: 'male', label: 'Masculino' },
  { value: 'female', label: 'Feminino' },
  { value: 'unknown', label: 'Desconhecido' },
];

/**
 * FilterBar - Comprehensive filtering component
 * 
 * Features:
 * - Debounced search input (300ms)
 * - Multi-select filters for status, marketplace, gender
 * - Date range picker with presets
 * - Active filter counter
 * - Clear all filters button
 * - Responsive layout (collapses on mobile)
 */
export function FilterBar({
  organizationId,
  filters,
  onFiltersChange,
  resultCount,
  className = '',
}: FilterBarProps) {
  // Local state for search input (before debounce)
  const [searchInput, setSearchInput] = useState(filters.searchText || '');
  
  // State for mobile filter sheet
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  
  // Debounced search value (Requirement 3.1, 12.2)
  const debouncedSearch = useDebounce(searchInput, 300);
  
  // Fetch marketplaces for dropdown (Requirement 3.3)
  const { data: marketplaces, isLoading: isLoadingMarketplaces } = useLeadMarketplaces(organizationId);
  
  // State for date range popover
  const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false);
  
  // Update filters when debounced search changes
  useEffect(() => {
    if (debouncedSearch !== filters.searchText) {
      onFiltersChange({
        ...filters,
        searchText: debouncedSearch || undefined,
      });
    }
  }, [debouncedSearch]);
  
  /**
   * Handle search input change
   */
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
  };
  
  /**
   * Handle status filter change
   */
  const handleStatusChange = (status: LeadStatus) => {
    const currentStatuses = filters.status || [];
    const newStatuses = currentStatuses.includes(status)
      ? currentStatuses.filter(s => s !== status)
      : [...currentStatuses, status];
    
    onFiltersChange({
      ...filters,
      status: newStatuses.length > 0 ? newStatuses : undefined,
    });
  };
  
  /**
   * Handle marketplace filter change
   */
  const handleMarketplaceChange = (marketplaceId: string) => {
    const currentMarketplaces = filters.marketplaceId || [];
    const newMarketplaces = currentMarketplaces.includes(marketplaceId)
      ? currentMarketplaces.filter(id => id !== marketplaceId)
      : [...currentMarketplaces, marketplaceId];
    
    onFiltersChange({
      ...filters,
      marketplaceId: newMarketplaces.length > 0 ? newMarketplaces : undefined,
    });
  };
  
  /**
   * Handle gender filter change
   */
  const handleGenderChange = (gender: string) => {
    const currentGenders = filters.gender || [];
    const genderValue = gender === 'unknown' ? null : gender;
    const newGenders = currentGenders.includes(genderValue as (Gender | null))
      ? currentGenders.filter(g => g !== genderValue)
      : [...currentGenders, genderValue as (Gender | null)];
    
    onFiltersChange({
      ...filters,
      gender: newGenders.length > 0 ? newGenders : undefined,
    });
  };
  
  /**
   * Handle date range preset selection
   */
  const handleDatePreset = (days: number | null) => {
    if (days === null) {
      // Clear date filter
      onFiltersChange({
        ...filters,
        dateRange: undefined,
      });
    } else {
      const to = new Date();
      const from = new Date();
      from.setDate(from.getDate() - days);
      
      onFiltersChange({
        ...filters,
        dateRange: { from, to },
      });
    }
    setIsDatePopoverOpen(false);
  };
  
  /**
   * Handle custom date range selection
   */
  const handleDateRangeChange = (range: { from: Date; to: Date } | undefined) => {
    onFiltersChange({
      ...filters,
      dateRange: range,
    });
  };
  
  /**
   * Clear all filters
   */
  const handleClearFilters = () => {
    setSearchInput('');
    onFiltersChange({
      searchText: undefined,
      status: undefined,
      marketplaceId: undefined,
      gender: undefined,
      dateRange: undefined,
    });
  };
  
  /**
   * Count active filters
   */
  const activeFilterCount = [
    filters.searchText,
    filters.status?.length,
    filters.marketplaceId?.length,
    filters.gender?.length,
    filters.dateRange,
  ].filter(Boolean).length;
  
  /**
   * Format date range for display
   */
  const formatDateRange = () => {
    if (!filters.dateRange) return 'Selecionar período';
    
    const { from, to } = filters.dateRange;
    return `${format(from, 'dd/MM/yyyy', { locale: ptBR })} - ${format(to, 'dd/MM/yyyy', { locale: ptBR })}`;
  };
  
  /**
   * Render filter controls (shared between desktop and mobile)
   */
  const renderFilterControls = () => (
    <div className="grid grid-cols-1 gap-4">
      {/* Search input - Requirement 3.1 */}
      <div>
        <Label htmlFor="search" className="text-sm text-gray-700 dark:text-gray-300 mb-1.5 block">
          Buscar
        </Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            id="search"
            type="text"
            placeholder="Nome, email, telefone, empresa..."
            value={searchInput}
            onChange={handleSearchChange}
            className="pl-10"
            aria-label="Buscar leads"
          />
        </div>
      </div>
      
      {/* Status filter - Requirement 3.2 */}
      <div>
        <Label className="text-sm text-gray-700 dark:text-gray-300 mb-1.5 block">
          Status
        </Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-between"
              aria-label="Filtrar por status"
            >
              <span className="truncate">
                {filters.status && filters.status.length > 0
                  ? `${filters.status.length} selecionado${filters.status.length > 1 ? 's' : ''}`
                  : 'Todos os status'}
              </span>
              <Filter className="ml-2 h-4 w-4 shrink-0" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56" align="start">
            <div className="space-y-2">
              {LEAD_STATUS_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-800 p-2 rounded"
                >
                  <input
                    type="checkbox"
                    checked={filters.status?.includes(option.value) || false}
                    onChange={() => handleStatusChange(option.value)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">{option.label}</span>
                </label>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>
      
      {/* Marketplace filter - Requirement 3.3 */}
      <div>
        <Label className="text-sm text-gray-700 dark:text-gray-300 mb-1.5 block">
          Canal
        </Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-between"
              disabled={isLoadingMarketplaces}
              aria-label="Filtrar por canal"
            >
              <span className="truncate">
                {filters.marketplaceId && filters.marketplaceId.length > 0
                  ? `${filters.marketplaceId.length} selecionado${filters.marketplaceId.length > 1 ? 's' : ''}`
                  : 'Todos os canais'}
              </span>
              <Filter className="ml-2 h-4 w-4 shrink-0" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56" align="start">
            <div className="space-y-2">
              {marketplaces?.map((marketplace) => (
                <label
                  key={marketplace.id}
                  className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-800 p-2 rounded"
                >
                  <input
                    type="checkbox"
                    checked={filters.marketplaceId?.includes(marketplace.id) || false}
                    onChange={() => handleMarketplaceChange(marketplace.id)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">{marketplace.name}</span>
                </label>
              ))}
              {(!marketplaces || marketplaces.length === 0) && (
                <div className="text-sm text-gray-500 p-2">
                  Nenhum canal disponível
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>
      
      {/* Gender filter - Requirement 3.4 */}
      <div>
        <Label className="text-sm text-gray-700 dark:text-gray-300 mb-1.5 block">
          Gênero
        </Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-between"
              aria-label="Filtrar por gênero"
            >
              <span className="truncate">
                {filters.gender && filters.gender.length > 0
                  ? `${filters.gender.length} selecionado${filters.gender.length > 1 ? 's' : ''}`
                  : 'Todos'}
              </span>
              <Filter className="ml-2 h-4 w-4 shrink-0" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56" align="start">
            <div className="space-y-2">
              {GENDER_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-800 p-2 rounded"
                >
                  <input
                    type="checkbox"
                    checked={
                      option.value === 'unknown'
                        ? filters.gender?.includes(null) || false
                        : filters.gender?.includes(option.value as Gender) || false
                    }
                    onChange={() => handleGenderChange(option.value)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">{option.label}</span>
                </label>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>
      
      {/* Date range filter - Requirement 3.5 */}
      <div>
        <Label className="text-sm text-gray-700 dark:text-gray-300 mb-1.5 block">
          Período
        </Label>
        <Popover open={isDatePopoverOpen} onOpenChange={setIsDatePopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-between"
              aria-label="Filtrar por período"
            >
              <span className="truncate">{formatDateRange()}</span>
              <CalendarIcon className="ml-2 h-4 w-4 shrink-0" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-4" align="start">
            <div className="space-y-4">
              {/* Presets */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Períodos rápidos</Label>
                <div className="grid grid-cols-2 gap-2">
                  {DATE_PRESETS.map((preset) => (
                    <Button
                      key={preset.label}
                      variant="outline"
                      size="sm"
                      onClick={() => handleDatePreset(preset.days)}
                      className="justify-start text-sm"
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
              </div>
              
              {/* Custom date inputs */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Período personalizado</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="date-from" className="text-xs text-gray-500">De</Label>
                    <Input
                      id="date-from"
                      type="date"
                      value={filters.dateRange?.from ? format(filters.dateRange.from, 'yyyy-MM-dd') : ''}
                      onChange={(e) => {
                        const from = e.target.value ? new Date(e.target.value) : undefined;
                        if (from && filters.dateRange?.to) {
                          handleDateRangeChange({ from, to: filters.dateRange.to });
                        } else if (from) {
                          handleDateRangeChange({ from, to: new Date() });
                        }
                      }}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="date-to" className="text-xs text-gray-500">Até</Label>
                    <Input
                      id="date-to"
                      type="date"
                      value={filters.dateRange?.to ? format(filters.dateRange.to, 'yyyy-MM-dd') : ''}
                      onChange={(e) => {
                        const to = e.target.value ? new Date(e.target.value) : undefined;
                        if (to && filters.dateRange?.from) {
                          handleDateRangeChange({ from: filters.dateRange.from, to });
                        } else if (to) {
                          const from = new Date();
                          from.setDate(from.getDate() - 30);
                          handleDateRangeChange({ from, to });
                        }
                      }}
                      className="text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
  
  return (
    <div 
      role="search" 
      aria-label="Filtros de leads"
      className={`bg-white dark:bg-zinc-900 rounded-lg p-4 border border-gray-200 dark:border-zinc-800 ${className}`}
    >
      <div className="space-y-4">
        {/* Header with filter count and clear button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-500 dark:text-gray-400" aria-hidden="true" />
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
              Filtros
            </h3>
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-2" aria-label={`${activeFilterCount} ${activeFilterCount === 1 ? 'filtro ativo' : 'filtros ativos'}`}>
                {activeFilterCount} {activeFilterCount === 1 ? 'filtro' : 'filtros'}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="text-sm hidden md:flex"
              >
                <X className="h-4 w-4 mr-1" />
                Limpar filtros
              </Button>
            )}
            
            {/* Mobile filter button - Requirement 11.1, 11.6 */}
            <Sheet open={isMobileFilterOpen} onOpenChange={setIsMobileFilterOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="md:hidden"
                  aria-label="Abrir filtros"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filtros
                  {activeFilterCount > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Filtros de Leads</SheetTitle>
                  <SheetDescription>
                    Refine sua busca usando os filtros abaixo
                  </SheetDescription>
                </SheetHeader>
                
                <div className="mt-6 space-y-6">
                  {/* Filter controls for mobile */}
                  {renderFilterControls()}
                  
                  {/* Clear filters button for mobile */}
                  {activeFilterCount > 0 && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        handleClearFilters();
                        setIsMobileFilterOpen(false);
                      }}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Limpar todos os filtros
                    </Button>
                  )}
                  
                  {/* Apply button for mobile */}
                  <Button
                    className="w-full"
                    onClick={() => setIsMobileFilterOpen(false)}
                  >
                    Aplicar filtros
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
        
        {/* Desktop filter controls - hidden on mobile */}
        <div className="hidden md:block">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search input - Requirement 3.1 */}
            <div className="lg:col-span-2">
              <Label htmlFor="search-desktop" className="text-sm text-gray-700 dark:text-gray-300 mb-1.5 block">
                Buscar
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search-desktop"
                  type="text"
                  placeholder="Nome, email, telefone, empresa..."
                  value={searchInput}
                  onChange={handleSearchChange}
                  className="pl-10"
                  aria-label="Buscar leads"
                />
              </div>
            </div>
            
            {/* Status filter - Requirement 3.2 */}
            <div>
              <Label className="text-sm text-gray-700 dark:text-gray-300 mb-1.5 block">
                Status
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between"
                    aria-label="Filtrar por status"
                  >
                    <span className="truncate">
                      {filters.status && filters.status.length > 0
                        ? `${filters.status.length} selecionado${filters.status.length > 1 ? 's' : ''}`
                        : 'Todos os status'}
                    </span>
                    <Filter className="ml-2 h-4 w-4 shrink-0" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56" align="start">
                  <div className="space-y-2">
                    {LEAD_STATUS_OPTIONS.map((option) => (
                      <label
                        key={option.value}
                        className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-800 p-2 rounded"
                      >
                        <input
                          type="checkbox"
                          checked={filters.status?.includes(option.value) || false}
                          onChange={() => handleStatusChange(option.value)}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm">{option.label}</span>
                      </label>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            
            {/* Marketplace filter - Requirement 3.3 */}
            <div>
              <Label className="text-sm text-gray-700 dark:text-gray-300 mb-1.5 block">
                Canal
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between"
                    disabled={isLoadingMarketplaces}
                    aria-label="Filtrar por canal"
                  >
                    <span className="truncate">
                      {filters.marketplaceId && filters.marketplaceId.length > 0
                        ? `${filters.marketplaceId.length} selecionado${filters.marketplaceId.length > 1 ? 's' : ''}`
                        : 'Todos os canais'}
                    </span>
                    <Filter className="ml-2 h-4 w-4 shrink-0" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56" align="start">
                  <div className="space-y-2">
                    {marketplaces?.map((marketplace) => (
                      <label
                        key={marketplace.id}
                        className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-800 p-2 rounded"
                      >
                        <input
                          type="checkbox"
                          checked={filters.marketplaceId?.includes(marketplace.id) || false}
                          onChange={() => handleMarketplaceChange(marketplace.id)}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm">{marketplace.name}</span>
                      </label>
                    ))}
                    {(!marketplaces || marketplaces.length === 0) && (
                      <div className="text-sm text-gray-500 p-2">
                        Nenhum canal disponível
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            
            {/* Gender filter - Requirement 3.4 */}
            <div>
              <Label className="text-sm text-gray-700 dark:text-gray-300 mb-1.5 block">
                Gênero
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between"
                    aria-label="Filtrar por gênero"
                  >
                    <span className="truncate">
                      {filters.gender && filters.gender.length > 0
                        ? `${filters.gender.length} selecionado${filters.gender.length > 1 ? 's' : ''}`
                        : 'Todos'}
                    </span>
                    <Filter className="ml-2 h-4 w-4 shrink-0" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56" align="start">
                  <div className="space-y-2">
                    {GENDER_OPTIONS.map((option) => (
                      <label
                        key={option.value}
                        className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-800 p-2 rounded"
                      >
                        <input
                          type="checkbox"
                          checked={
                            option.value === 'unknown'
                              ? filters.gender?.includes(null) || false
                              : filters.gender?.includes(option.value as Gender) || false
                          }
                          onChange={() => handleGenderChange(option.value)}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm">{option.label}</span>
                      </label>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            
            {/* Date range filter - Requirement 3.5 */}
            <div className="lg:col-span-2">
              <Label className="text-sm text-gray-700 dark:text-gray-300 mb-1.5 block">
                Período
              </Label>
              <Popover open={isDatePopoverOpen} onOpenChange={setIsDatePopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between"
                    aria-label="Filtrar por período"
                  >
                    <span className="truncate">{formatDateRange()}</span>
                    <CalendarIcon className="ml-2 h-4 w-4 shrink-0" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-4" align="start">
                  <div className="space-y-4">
                    {/* Presets */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Períodos rápidos</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {DATE_PRESETS.map((preset) => (
                          <Button
                            key={preset.label}
                            variant="outline"
                            size="sm"
                            onClick={() => handleDatePreset(preset.days)}
                            className="justify-start text-sm"
                          >
                            {preset.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                    
                    {/* Custom date inputs */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Período personalizado</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label htmlFor="date-from-desktop" className="text-xs text-gray-500">De</Label>
                          <Input
                            id="date-from-desktop"
                            type="date"
                            value={filters.dateRange?.from ? format(filters.dateRange.from, 'yyyy-MM-dd') : ''}
                            onChange={(e) => {
                              const from = e.target.value ? new Date(e.target.value) : undefined;
                              if (from && filters.dateRange?.to) {
                                handleDateRangeChange({ from, to: filters.dateRange.to });
                              } else if (from) {
                                handleDateRangeChange({ from, to: new Date() });
                              }
                            }}
                            className="text-sm"
                          />
                        </div>
                        <div>
                          <Label htmlFor="date-to-desktop" className="text-xs text-gray-500">Até</Label>
                          <Input
                            id="date-to-desktop"
                            type="date"
                            value={filters.dateRange?.to ? format(filters.dateRange.to, 'yyyy-MM-dd') : ''}
                            onChange={(e) => {
                              const to = e.target.value ? new Date(e.target.value) : undefined;
                              if (to && filters.dateRange?.from) {
                                handleDateRangeChange({ from: filters.dateRange.from, to });
                              } else if (to) {
                                const from = new Date();
                                from.setDate(from.getDate() - 30);
                                handleDateRangeChange({ from, to });
                              }
                            }}
                            className="text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
        
        {/* Result counter - Requirement 3.7 */}
        <div 
          className="text-sm text-gray-600 dark:text-gray-400"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {resultCount} {resultCount === 1 ? 'lead encontrado' : 'leads encontrados'}
        </div>
      </div>
    </div>
  );
}
