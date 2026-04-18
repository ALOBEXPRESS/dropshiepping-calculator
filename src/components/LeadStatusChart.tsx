/**
 * LeadStatusChart Component
 * 
 * Displays lead status distribution using overlapping bubble circles.
 * Replaces the previous "Distribuição de Gênero" donut chart.
 * 
 * Performance optimizations:
 * - Memoized with React.memo to prevent unnecessary re-renders
 * - useMemo for expensive bubble radius calculations
 * - useMemo for data transformations
 * - ResponsiveContainer with debounced resize (300ms)
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.6, 4.7, 4.8, 6.2, 6.3, 6.4, 8.1, 9.2, 9.7, 10.9
 */

import React, { useMemo } from 'react';
import { ScatterChart, Scatter, Cell, ResponsiveContainer, XAxis, YAxis, ZAxis } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './ui/card';
import { Avatar, AvatarFallback } from './ui/avatar';
import type { LeadStatusData } from '../types/dashboard';

interface LeadStatusChartProps {
  data: LeadStatusData[];
  recentSignups: number;
}

/**
 * Calculate bubble radius proportionally based on count
 * 
 * This algorithm ensures bubbles are sized proportionally to their lead counts
 * while maintaining a minimum size for visibility and a maximum size to prevent
 * overwhelming the visualization.
 * 
 * Algorithm: Linear interpolation between minRadius and maxRadius
 * Formula: minRadius + ((count / maxCount) * (maxRadius - minRadius))
 * 
 * Example with actual data:
 * - Completed: 177 leads (max) → 40 + ((177/177) * 80) = 120px
 * - Ongoing: 87 leads → 40 + ((87/177) * 80) ≈ 79px
 * - Awaiting: 23 leads → 40 + ((23/177) * 80) ≈ 50px
 * 
 * @param count - Number of leads in this status
 * @param maxCount - Maximum count across all statuses (used for normalization)
 * @returns Calculated radius in pixels (between 40 and 120)
 */
const calculateBubbleRadius = (count: number, maxCount: number): number => {
  const minRadius = 40;  // Minimum bubble size ensures small categories remain visible
  const maxRadius = 120; // Maximum bubble size prevents overwhelming the chart
  
  // Linear interpolation: scale count ratio to radius range
  return minRadius + ((count / maxCount) * (maxRadius - minRadius));
};

/**
 * LeadStatusChart Component
 * 
 * Renders three overlapping circles representing lead statuses:
 * - Completed (177 leads, 67%) - Yellow #FFB800
 * - Ongoing (87 leads, 21%) - Orange #FF4D00
 * - Awaiting (23 leads, 12%) - Purple #7C3AED
 * 
 * Handles missing or partial data gracefully.
 * Performance optimized with memoization.
 */
export const LeadStatusChart = React.memo<LeadStatusChartProps>(({ data, recentSignups }) => {
  // Handle missing or empty data gracefully
  if (!data || data.length === 0) {
    return (
      <Card className="bg-[#1c1c1c] rounded-2xl border-none shadow-xl h-full flex flex-col">
        <CardHeader>
          <CardTitle className="text-white text-xl font-semibold">Leads</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <p className="text-[#a3a3a3] text-center">Nenhum dado de status de leads disponível</p>
        </CardContent>
      </Card>
    );
  }

  // Memoize data sanitization to prevent recalculation on every render
  const sanitizedData = useMemo(() => {
    return data.map(item => ({
      status: item.status || 'unknown',
      count: item.count ?? 0,
      percentage: item.percentage ?? 0,
      color: item.color || '#a3a3a3',
      label: item.label || 'Unknown',
    }));
  }, [data]);

  // Memoize maximum count calculation for proportional sizing
  const maxCount = useMemo(() => {
    return Math.max(...sanitizedData.map(d => d.count), 1); // Ensure at least 1 to avoid division by zero
  }, [sanitizedData]);

  // Memoize bubble data transformation with calculated radii
  // This prevents recalculating bubble positions and sizes on every render
  // Bubble positioning: Horizontal spacing creates overlapping effect
  // - First bubble (Completed): x=150 (left side)
  // - Second bubble (Ongoing): x=250 (center, overlaps with first)
  // - Third bubble (Awaiting): x=350 (right side, overlaps with second)
  // All bubbles centered vertically at y=150
  const bubbleData = useMemo(() => {
    return sanitizedData.map((item, index) => ({
      x: index === 0 ? 150 : index === 1 ? 250 : 350, // Horizontal positioning for overlap
      y: 150, // Center vertically
      z: calculateBubbleRadius(item.count, maxCount), // Proportional radius
      color: item.color,
      label: item.label,
      count: item.count,
      percentage: item.percentage,
    }));
  }, [sanitizedData, maxCount]);

  return (
    <Card className="bg-[#1c1c1c] rounded-2xl border-none shadow-xl h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-white text-xl font-semibold">Leads</CardTitle>
      </CardHeader>
      
      <CardContent className="pb-4 flex-1">
        <div className="flex flex-col lg:flex-row items-center gap-8 h-full">
          {/* Bubble Visualization */}
          <div 
            className="w-full lg:w-2/3 h-[300px]"
            role="img"
            aria-label={`Distribuição de status de leads: ${sanitizedData.map(d => `${d.label} ${d.count} leads (${d.percentage}%)`).join(', ')}`}
          >
            <ResponsiveContainer width="100%" height="100%" debounce={300}>
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <XAxis 
                  type="number" 
                  dataKey="x" 
                  domain={[0, 500]} 
                  hide 
                />
                <YAxis 
                  type="number" 
                  dataKey="y" 
                  domain={[0, 300]} 
                  hide 
                />
                <ZAxis 
                  type="number" 
                  dataKey="z" 
                  range={[1000, 10000]} 
                />
                <Scatter data={bubbleData}>
                  {bubbleData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color} 
                      opacity={0.8}
                      aria-label={`${entry.label}: ${entry.count} leads (${entry.percentage}%)`}
                    />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          {/* Legend with Progress Bars */}
          <div 
            className="w-full lg:w-1/3 space-y-4"
            role="list"
            aria-label="Detalhamento de status de leads"
          >
            {sanitizedData.map((item) => (
              <div key={item.status} className="space-y-2" role="listitem">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">{item.label}</span>
                  <span className="text-sm text-gray-400" aria-label={`${item.count} leads, ${item.percentage} percent`}>
                    {item.count} ({item.percentage}%)
                  </span>
                </div>
                <div 
                  className="w-full bg-gray-700 rounded-full h-2"
                  role="progressbar"
                  aria-valuenow={item.percentage}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${item.label} progress: ${item.percentage}%`}
                >
                  <div
                    className="h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${item.percentage}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex items-center gap-2 text-sm border-t border-gray-800 pt-4" style={{ color: '#a3a3a3' }}>
        <Avatar className="h-6 w-6" aria-hidden="true">
          <AvatarFallback className="bg-[#7C3AED] text-white text-xs">
            +{recentSignups ?? 0}
          </AvatarFallback>
        </Avatar>
        <span role="status" aria-live="polite">+{recentSignups ?? 0} usuários cadastrados em menos de um minuto!</span>
      </CardFooter>
    </Card>
  );
});

// Display name for React DevTools
LeadStatusChart.displayName = 'LeadStatusChart';

export default LeadStatusChart;
