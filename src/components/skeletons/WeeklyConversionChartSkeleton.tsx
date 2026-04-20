/**
 * WeeklyConversionChartSkeleton Component
 * 
 * Loading skeleton for WeeklyConversionChart component.
 * Displays animated placeholder matching the bar chart layout.
 * 
 * Requirements: 10.1, 10.9
 */

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * WeeklyConversionChartSkeleton Component
 * 
 * Renders a loading skeleton that matches the WeeklyConversionChart structure:
 * - Header with "Conversion" title
 * - Chart area with bar placeholders
 * - Legend placeholders
 * - Footer message placeholder
 */
export const WeeklyConversionChartSkeleton: React.FC = () => {
  return (
    <Card 
      className="bg-[#1c1c1c] border-none rounded-2xl shadow-xl h-full flex flex-col"
      role="status"
      aria-label="Loading conversion chart"
    >
      <CardHeader>
        <CardTitle className="text-white text-xl font-semibold">Conversion</CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1">
        <div className="w-full h-[400px] flex items-end justify-around gap-4 px-8 pb-12">
          {/* Simulated bar chart with 5 bars of varying heights */}
          {[60, 75, 85, 70, 65].map((height, index) => (
            <div key={index} className="flex-1 flex flex-col items-center gap-2">
              {/* Bar */}
              <Skeleton 
                className="w-full bg-[#2a2a2a]" 
                style={{ height: `${height}%` }}
              />
              {/* X-axis label */}
              <Skeleton className="h-3 w-12 bg-[#2a2a2a]" />
            </div>
          ))}
        </div>
        
        {/* Legend placeholders */}
        <div className="flex justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-3 rounded bg-[#2a2a2a]" />
            <Skeleton className="h-3 w-24 bg-[#2a2a2a]" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-3 rounded bg-[#2a2a2a]" />
            <Skeleton className="h-3 w-24 bg-[#2a2a2a]" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-3 rounded bg-[#2a2a2a]" />
            <Skeleton className="h-3 w-28 bg-[#2a2a2a]" />
          </div>
        </div>
      </CardContent>

      <CardFooter>
        <Skeleton className="h-4 w-80 bg-[#2a2a2a]" />
      </CardFooter>
    </Card>
  );
};

export default WeeklyConversionChartSkeleton;
