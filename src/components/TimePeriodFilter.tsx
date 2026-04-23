/**
 * TimePeriodFilter Component
 * 
 * A filter component for selecting time periods in the sales dashboard.
 * Provides five predefined period options: Day, Week, Month, Year, and Total.
 * 
 * ## Features:
 * - Five period buttons: Dia, Semana, Mês, Ano, Total
 * - Active state styling (orange #FF4D00 background, white text)
 * - Inactive state styling (transparent background, gray #a3a3a3 text)
 * - Disabled state during data loading
 * - Keyboard navigation support (Tab, Enter, Space, Arrow keys)
 * - Mobile-responsive with horizontal scroll
 * - Dark theme styling consistent with Boostboard design
 * - WCAG AA compliant accessibility
 * 
 * ## Usage Example:
 * ```tsx
 * <TimePeriodFilter
 *   selectedPeriod="week"
 *   onPeriodChange={(period) => setPeriod(period)}
 *   disabled={isLoading}
 * />
 * ```
 * 
 * ## Accessibility:
 * - ARIA labels for screen readers
 * - Keyboard navigation with arrow keys
 * - Focus visible indicators
 * - Disabled state properly communicated
 * - Roving tabindex pattern for efficient keyboard navigation
 * 
 * Requirements: 2.1, 2.9, 6.1, 6.3
 * 
 * @module components/TimePeriodFilter
 */

import React, { useRef } from 'react';
import { cn } from '@/lib/utils';

export type TimePeriod = 'day' | 'week' | 'month' | 'year' | 'total';

export interface TimePeriodFilterProps {
  /** Currently selected period */
  selectedPeriod: TimePeriod;
  /** Callback when period changes */
  onPeriodChange: (period: TimePeriod) => void;
  /** Disable filter during loading */
  disabled?: boolean;
}

interface PeriodOption {
  id: TimePeriod;
  label: string;
}

const periodOptions: PeriodOption[] = [
  { id: 'day', label: 'Dia' },
  { id: 'week', label: 'Semana' },
  { id: 'month', label: 'Mês' },
  { id: 'year', label: 'Ano' },
  { id: 'total', label: 'Total' },
];

/**
 * TimePeriodFilter Component
 * 
 * Displays a horizontal row of period filter buttons with:
 * - Active state: orange background (#FF4D00), white text
 * - Inactive state: transparent background, gray text (#a3a3a3)
 * - Hover state: subtle brightness increase
 * - Disabled state: reduced opacity, no interaction
 * - Keyboard navigation: Tab, Enter, Space, Arrow keys
 * - Mobile: horizontal scroll on small screens
 */
export const TimePeriodFilter: React.FC<TimePeriodFilterProps> = ({
  selectedPeriod,
  onPeriodChange,
  disabled = false,
}) => {
  // Refs for managing keyboard navigation focus
  const buttonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});

  const handlePeriodClick = (period: TimePeriod) => {
    if (!disabled) {
      onPeriodChange(period);
    }
  };

  /**
   * Handle keyboard navigation for period buttons
   * 
   * Implements roving tabindex pattern for efficient keyboard navigation:
   * - ArrowRight: Move focus to next button (wraps to first if at end)
   * - ArrowLeft: Move focus to previous button (wraps to last if at start)
   * - Home: Move focus to first button
   * - End: Move focus to last button
   * - Enter/Space: Select the focused period
   * 
   * @param e - Keyboard event
   * @param currentPeriod - ID of the currently focused period
   */
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    currentPeriod: TimePeriod
  ) => {
    if (disabled) return;

    const currentIndex = periodOptions.findIndex((opt) => opt.id === currentPeriod);
    let targetIndex: number | null = null;

    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault();
        // Move to next button, wrap to first if at end
        targetIndex = (currentIndex + 1) % periodOptions.length;
        break;

      case 'ArrowLeft':
        e.preventDefault();
        // Move to previous button, wrap to last if at start
        targetIndex = currentIndex === 0 ? periodOptions.length - 1 : currentIndex - 1;
        break;

      case 'Home':
        e.preventDefault();
        // Focus first button
        targetIndex = 0;
        break;

      case 'End':
        e.preventDefault();
        // Focus last button
        targetIndex = periodOptions.length - 1;
        break;

      case 'Enter':
      case ' ':
        e.preventDefault();
        // Select the current period
        handlePeriodClick(currentPeriod);
        return;

      default:
        return;
    }

    // Focus the target button if a navigation key was pressed
    if (targetIndex !== null) {
      const targetPeriod = periodOptions[targetIndex];
      const targetRef = buttonRefs.current[targetPeriod.id];
      if (targetRef) {
        targetRef.focus();
      }
    }
  };

  return (
    <div
      className="w-full mb-6"
      role="group"
      aria-label="Filtro de período de tempo"
    >
      {/* Container with horizontal scroll on mobile */}
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex gap-2 min-w-max md:min-w-0 md:justify-start">
          {periodOptions.map((option) => {
            const isActive = selectedPeriod === option.id;
            
            return (
              <button
                key={option.id}
                ref={(el) => { buttonRefs.current[option.id] = el; }}
                onClick={() => handlePeriodClick(option.id)}
                onKeyDown={(e) => handleKeyDown(e, option.id)}
                disabled={disabled}
                className={cn(
                  // Base styles
                  'px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-200',
                  'focus:outline-none focus:ring-2 focus:ring-[#FF4D00] focus:ring-offset-2 focus:ring-offset-[#0f0f0f]',
                  'whitespace-nowrap',
                  
                  // Active state
                  isActive && !disabled && 'bg-[#FF4D00] text-white shadow-lg',
                  
                  // Inactive state
                  !isActive && !disabled && 'bg-transparent text-[#a3a3a3] hover:bg-[#1c1c1c] hover:text-white',
                  
                  // Disabled state
                  disabled && 'opacity-50 cursor-not-allowed'
                )}
                aria-pressed={isActive}
                aria-label={`Filtrar por ${option.label.toLowerCase()}`}
                tabIndex={isActive ? 0 : -1}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom scrollbar styles (hidden on mobile) */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default TimePeriodFilter;
