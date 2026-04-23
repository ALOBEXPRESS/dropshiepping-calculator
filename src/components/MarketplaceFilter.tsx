/**
 * MarketplaceFilter Component
 * 
 * Dropdown filter for selecting marketplace to view dashboard data.
 * Allows filtering by specific marketplace or viewing all marketplaces.
 */

import React from 'react';
import { ChevronDown } from 'lucide-react';

export interface Marketplace {
  id: string;
  name: string;
}

export interface MarketplaceFilterProps {
  /** List of available marketplaces */
  marketplaces: Marketplace[];
  /** Currently selected marketplace ID (null = all) */
  selectedMarketplace: string | null;
  /** Callback when marketplace changes */
  onMarketplaceChange: (marketplaceId: string | null) => void;
  /** Disable filter during loading */
  disabled?: boolean;
}

/**
 * MarketplaceFilter Component
 * 
 * Renders a dropdown to select marketplace for filtering dashboard data.
 */
const MarketplaceFilter: React.FC<MarketplaceFilterProps> = ({
  marketplaces,
  selectedMarketplace,
  onMarketplaceChange,
  disabled = false
}) => {

  return (
    <div className="relative inline-block">
      <label htmlFor="marketplace-filter" className="sr-only">
        Filtrar por marketplace
      </label>
      <select
        id="marketplace-filter"
        value={selectedMarketplace || ''}
        onChange={(e) => onMarketplaceChange(e.target.value || null)}
        disabled={disabled}
        className="
          appearance-none
          bg-[#1c1c1c] 
          text-white 
          px-4 
          py-2 
          pr-10
          rounded-lg 
          border 
          border-gray-700
          hover:border-gray-600
          focus:outline-none 
          focus:ring-2 
          focus:ring-[#FF4D00]
          disabled:opacity-50
          disabled:cursor-not-allowed
          cursor-pointer
          transition-colors
        "
        aria-label="Selecionar marketplace"
      >
        <option value="">Todos os Marketplaces</option>
        {marketplaces.map((marketplace) => (
          <option key={marketplace.id} value={marketplace.id}>
            {marketplace.name}
          </option>
        ))}
      </select>
      
      {/* Custom dropdown icon */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
        <ChevronDown className="w-4 h-4 text-gray-400" />
      </div>
    </div>
  );
};

export default MarketplaceFilter;
