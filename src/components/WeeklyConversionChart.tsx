/**
 * WeeklyConversionChart Component
 * 
 * Displays weekly conversion metrics using a stacked bar chart with three data series:
 * - Fees (yellow #FFB800)
 * - Revenue (orange #FF4D00)
 * - Net Profit (purple #7C3AED)
 * 
 * Performance optimizations:
 * - Memoized with React.memo to prevent unnecessary re-renders
 * - useMemo for expensive data transformations and calculations
 * - ResponsiveContainer with debounced resize (300ms)
 * 
 * Requirements: 3.1, 3.2, 3.5, 3.6, 3.7, 3.9, 6.2, 6.3, 8.1, 10.9
 * 
 * @module components/WeeklyConversionChart
 */

import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import type { WeeklyConversionData } from '@/types/dashboard';

/**
 * SVG Pattern component for hatched fill
 * 
 * Creates a diagonal hatched pattern used for Net Profit bars to make them
 * visually distinct from solid-colored Fees and Revenue bars.
 * 
 * Pattern details:
 * - Pattern repeats every 8x8 pixels (patternUnits="userSpaceOnUse")
 * - Three diagonal lines create 45° angle hatching
 * - Purple color (#7C3AED) matches the Net Profit theme color
 * - Lines are 1px wide for subtle texture
 * 
 * SVG path breakdown:
 * - "M-1,1 l2,-2": First diagonal line (top-left corner)
 * - "M0,8 l8,-8": Main diagonal line (bottom-left to top-right)
 * - "M7,9 l2,-2": Third diagonal line (bottom-right corner)
 * 
 * Usage: Apply to Bar component with fill="url(#hatch)"
 */
const HatchPattern = () => (
  <defs>
    <pattern
      id="hatch"
      patternUnits="userSpaceOnUse"
      width="8"
      height="8"
    >
      <path
        d="M-1,1 l2,-2 M0,8 l8,-8 M7,9 l2,-2"
        stroke="#7C3AED"
        strokeWidth="1"
      />
    </pattern>
  </defs>
);

/**
 * Props for WeeklyConversionChart component
 */
export interface WeeklyConversionChartProps {
  /** Array of weekly conversion data points */
  data: WeeklyConversionData[];
  /** The most profitable day/week to highlight in the footer message */
  mostProfitableDay: string;
}

/**
 * Formats a number as Brazilian Real currency
 * 
 * @param value - The numeric value to format
 * @returns Formatted currency string (e.g., "R$ 33.846")
 */
const formatCurrency = (value: number): string => {
  return `R$ ${value.toLocaleString('pt-BR')}`;
};

/**
 * Custom tooltip component for the bar chart
 * Displays formatted currency values on hover
 */
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1c1c1c] border border-gray-700 rounded-lg p-3 shadow-lg">
        <p className="text-white font-semibold mb-2">{payload[0].payload.week}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {formatCurrency(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

/**
 * WeeklyConversionChart Component
 * 
 * Renders a stacked bar chart showing weekly conversion metrics with:
 * - Responsive container (width 100%, height 400px, debounced resize 300ms)
 * - Three stacked bars: Fees, Revenue, Net Profit
 * - Currency-formatted Y-axis
 * - Legend showing total values
 * - Footer message highlighting most profitable period
 * - Graceful handling of missing optional fields
 * - Performance optimized with memoization
 * 
 * @param props - Component props
 * @returns React component
 */
export const WeeklyConversionChart = React.memo(({ data, mostProfitableDay }: WeeklyConversionChartProps) => {
  // Handle missing or empty data gracefully
  if (!data || data.length === 0) {
    return (
      <Card className="bg-[#1c1c1c] border-none rounded-2xl shadow-xl h-full flex flex-col">
        <CardHeader>
          <CardTitle className="text-white text-xl font-semibold">Conversion</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <p className="text-[#a3a3a3] text-center">Nenhum dado de conversão disponível</p>
        </CardContent>
      </Card>
    );
  }

  // Memoize data sanitization to prevent recalculation on every render
  const sanitizedData = useMemo(() => {
    return data.map(item => ({
      week: item.week || 'N/A',
      fees: item.fees ?? 0,
      revenue: item.revenue ?? 0,
      netProfit: item.netProfit ?? 0,
    }));
  }, [data]);

  // Memoize totals calculation for legend display
  // Sums all weekly values for each data series to show in legend
  // Example: "Fees: R$ 12,582", "Revenue: R$ 36,646", "Net Profit: R$ 24,064"
  const totals = useMemo(() => {
    return sanitizedData.reduce(
      (acc, item) => ({
        fees: acc.fees + item.fees,
        revenue: acc.revenue + item.revenue,
        netProfit: acc.netProfit + item.netProfit,
      }),
      { fees: 0, revenue: 0, netProfit: 0 }
    );
  }, [sanitizedData]);

  return (
    <Card className="bg-[#1c1c1c] border-none rounded-2xl shadow-xl h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-white text-xl font-semibold">Conversão</CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1" role="img" aria-label="Gráfico de barras de conversão semanal mostrando taxas, receita e lucro líquido ao longo do tempo">
        <ResponsiveContainer width="100%" height={400} debounce={300}>
          <BarChart
            data={sanitizedData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <HatchPattern />
            <XAxis
              dataKey="week"
              stroke="#a3a3a3"
              tick={{ fill: '#a3a3a3' }}
              axisLine={{ stroke: '#404040' }}
              aria-label="Semana"
            />
            <YAxis
              stroke="#a3a3a3"
              tick={{ fill: '#a3a3a3' }}
              axisLine={{ stroke: '#404040' }}
              tickFormatter={formatCurrency}
              aria-label="Valor em Real Brasileiro"
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} />
            <Legend
              wrapperStyle={{
                paddingTop: '20px',
                color: '#a3a3a3',
              }}
              formatter={(value: string) => {
                const keyMap: Record<string, keyof typeof totals> = {
                  'Taxas': 'fees',
                  'Receita': 'revenue',
                  'Lucro Líquido': 'netProfit'
                };
                const key = keyMap[value];
                const total = key ? totals[key] : 0;
                return `${value}: ${formatCurrency(total)}`;
              }}
            />
            <Bar
              dataKey="fees"
              stackId="a"
              fill="#FFB800"
              name="Taxas"
              radius={[0, 0, 0, 0]}
              aria-label="Taxas"
            />
            <Bar
              dataKey="revenue"
              stackId="a"
              fill="#FF4D00"
              name="Receita"
              radius={[0, 0, 0, 0]}
              aria-label="Receita"
            />
            <Bar
              dataKey="netProfit"
              stackId="a"
              fill="url(#hatch)"
              name="Lucro Líquido"
              radius={[4, 4, 0, 0]}
              aria-label="Lucro Líquido"
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>

      <CardFooter>
        <p className="text-[#a3a3a3] text-sm" role="status">
          {mostProfitableDay || 'N/A'} é o dia mais lucrativo deste mês. Bom trabalho!
        </p>
      </CardFooter>
    </Card>
  );
});

// Display name for React DevTools
WeeklyConversionChart.displayName = 'WeeklyConversionChart';

export default WeeklyConversionChart;
