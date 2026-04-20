/**
 * KPICard Component
 * 
 * A reusable card component for displaying key performance indicators (KPIs)
 * with trend indicators and formatted values. Designed for the LeadsDashboard
 * component following the Boostboard dark theme design.
 * 
 * ## Features:
 * - Large bold value display with automatic formatting (currency, number, percentage)
 * - Trend indicator with colored arrow (green for up, red for down, gray for neutral)
 * - Optional icon in header
 * - Dark theme styling (#1c1c1c background, rounded-2xl, shadow-lg)
 * - Hover effects and focus states for accessibility
 * - Graceful handling of missing optional fields
 * 
 * ## Usage Examples:
 * 
 * ### Currency KPI (Total Revenue)
 * ```tsx
 * <KPICard
 *   title="Total Revenue"
 *   value={33846}
 *   trend={{ direction: 'up', percentage: 12.5 }}
 *   format="currency"
 *   icon={<DollarSign className="w-5 h-5" />}
 * />
 * // Displays: "R$ 33.846,00" with green "+12.5%" indicator
 * ```
 * 
 * ### Number KPI (Total Leads)
 * ```tsx
 * <KPICard
 *   title="Total Leads"
 *   value={245214}
 *   trend={{ direction: 'up', percentage: 8.7 }}
 *   format="number"
 *   icon={<Users className="w-5 h-5" />}
 * />
 * // Displays: "245.214" with green "+8.7%" indicator
 * ```
 * 
 * ### Percentage KPI
 * ```tsx
 * <KPICard
 *   title="Conversion Rate"
 *   value={15.3}
 *   trend={{ direction: 'down', percentage: 2.1 }}
 *   format="percentage"
 * />
 * // Displays: "15.3%" with red "-2.1%" indicator
 * ```
 * 
 * ## Accessibility:
 * - ARIA labels for screen readers
 * - Keyboard focusable with visible focus ring
 * - Semantic HTML structure
 * - WCAG AA compliant color contrast
 * 
 * Requirements: 2.2, 2.3, 2.5, 2.9, 6.2, 6.3, 6.8, 8.1
 * 
 * @module components/KPICard
 */

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface KPICardProps {
  /** The title/label of the KPI (e.g., "Total Revenue", "Marketplace Fees") */
  title: string;
  /** The value to display (number or pre-formatted string) */
  value: string | number;
  /** Trend indicator with direction and percentage change */
  trend: {
    /** Direction of the trend: 'up' for positive, 'down' for negative, 'neutral' for no change */
    direction: 'up' | 'down' | 'neutral';
    /** Percentage change (absolute value, e.g., 12.5 for ±12.5%) */
    percentage: number;
  };
  /** Optional icon to display in the header (e.g., <DollarSign />, <Users />) */
  icon?: React.ReactNode;
  /** Format type for the value: 'currency' for R$, 'number' for plain numbers, 'percentage' for % */
  format?: 'currency' | 'number' | 'percentage';
}

/**
 * Formats a number value according to the specified format type
 * 
 * Supports three format types:
 * - currency: Brazilian Real format (R$ 33.846,00) with dot for thousands, comma for decimals
 * - percentage: Percentage format (12.5%) with one decimal place
 * - number: Plain number format (245.214) with dot for thousands
 * 
 * @param value - The value to format (number or string)
 * @param format - The format type to apply
 * @returns Formatted string representation of the value
 * 
 * @example
 * formatValue(33846, 'currency') // "R$ 33.846,00"
 * formatValue(245214, 'number')  // "245.214"
 * formatValue(15.3, 'percentage') // "15.3%"
 */
const formatValue = (value: string | number, format?: 'currency' | 'number' | 'percentage'): string => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) {
    return String(value);
  }
  
  switch (format) {
    case 'currency':
      // Brazilian Real (R$) format with dot for thousands and comma for decimals
      return `R$ ${numValue.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}`;
    case 'percentage':
      return `${numValue.toFixed(1)}%`;
    case 'number':
    default:
      return numValue.toLocaleString('pt-BR');
  }
};

/**
 * Returns the appropriate trend icon based on direction
 */
const getTrendIcon = (direction: 'up' | 'down' | 'neutral') => {
  switch (direction) {
    case 'up':
      return <ArrowUp className="w-4 h-4" />;
    case 'down':
      return <ArrowDown className="w-4 h-4" />;
    case 'neutral':
      return <Minus className="w-4 h-4" />;
  }
};

/**
 * Returns the appropriate color class for the trend indicator
 */
const getTrendColor = (direction: 'up' | 'down' | 'neutral'): string => {
  switch (direction) {
    case 'up':
      return 'text-[#10b981]'; // Green
    case 'down':
      return 'text-[#ef4444]'; // Red
    case 'neutral':
      return 'text-[#a3a3a3]'; // Gray
  }
};

/**
 * KPICard Component
 * 
 * Displays a single KPI metric with:
 * - Large bold value display
 * - Trend indicator (arrow + percentage)
 * - Optional icon
 * - Support for different value formats (currency, number, percentage)
 * - Dark theme styling (#1c1c1c background, rounded-2xl, shadow-lg)
 * - Graceful handling of missing optional fields
 */
export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  trend,
  icon,
  format = 'number'
}) => {
  const formattedValue = formatValue(value, format);
  const trendIcon = getTrendIcon(trend.direction);
  const trendColor = getTrendColor(trend.direction);
  const trendSign = trend.direction === 'up' ? '+' : trend.direction === 'down' ? '-' : '';
  const trendPercentage = trend.percentage ?? 0;

  return (
    <Card 
      className="bg-[#1c1c1c] border-none rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-shadow duration-200 focus-within:ring-2 focus-within:ring-[#FF4D00] focus-within:ring-offset-2 focus-within:ring-offset-[#0f0f0f]"
      role="article"
      aria-label={`${title}: ${formattedValue}, trend ${trendSign}${trendPercentage}%`}
    >
      <CardHeader className="p-0 mb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-[#a3a3a3] uppercase tracking-wide">
            {title}
          </CardTitle>
          {icon && (
            <div className="text-[#a3a3a3]" aria-hidden="true">
              {icon}
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="space-y-2">
          {/* Large value display */}
          <p className="text-3xl font-bold text-white leading-none" aria-label={`Value: ${formattedValue}`}>
            {formattedValue}
          </p>
          
          {/* Trend indicator */}
          <div 
            className={cn(
              "flex items-center gap-1 text-sm font-medium",
              trendColor
            )}
            role="status"
            aria-label={`Trend: ${trend.direction} ${trendPercentage} percent`}
          >
            <span aria-hidden="true">{trendIcon}</span>
            <span>
              {trendSign}{Math.abs(trendPercentage)}%
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default KPICard;
