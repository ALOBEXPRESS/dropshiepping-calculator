/**
 * LeadStatusChartSkeleton Component
 * 
 * Loading skeleton for LeadStatusChart component.
 * Displays animated placeholder matching the bubble chart layout.
 * 
 * Requirements: 10.1, 10.9
 */

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * LeadStatusChartSkeleton Component
 * 
 * Renders a loading skeleton that matches the LeadStatusChart structure:
 * - Header with "Leads" title
 * - Bubble visualization area with circle placeholders
 * - Legend with progress bar placeholders
 * - Footer with signup message placeholder
 */
export const LeadStatusChartSkeleton: React.FC = () => {
  return (
    <Card 
      className="bg-[#1c1c1c] rounded-2xl border-none shadow-xl h-full flex flex-col"
      role="status"
      aria-label="Loading lead status chart"
    >
      <CardHeader>
        <CardTitle className="text-white text-xl font-semibold">Leads</CardTitle>
      </CardHeader>
      
      <CardContent className="pb-4 flex-1">
        <div className="flex flex-col lg:flex-row items-center gap-8 h-full">
          {/* Bubble Visualization Placeholder */}
          <div className="w-full lg:w-2/3 h-[300px] flex items-center justify-center gap-4">
            {/* Three overlapping circle placeholders */}
            <Skeleton className="h-32 w-32 rounded-full bg-[#2a2a2a]" />
            <Skeleton className="h-24 w-24 rounded-full bg-[#2a2a2a] -ml-8" />
            <Skeleton className="h-20 w-20 rounded-full bg-[#2a2a2a] -ml-6" />
          </div>

          {/* Legend Placeholder */}
          <div className="w-full lg:w-1/3 space-y-4">
            {[1, 2, 3].map((item) => (
              <div key={item} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-24 bg-[#2a2a2a]" />
                  <Skeleton className="h-4 w-20 bg-[#2a2a2a]" />
                </div>
                <Skeleton className="h-2 w-full rounded-full bg-[#2a2a2a]" />
              </div>
            ))}
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex items-center gap-2 text-sm border-t border-gray-800 pt-4">
        <Skeleton className="h-6 w-6 rounded-full bg-[#2a2a2a]" />
        <Skeleton className="h-4 w-64 bg-[#2a2a2a]" />
      </CardFooter>
    </Card>
  );
};

export default LeadStatusChartSkeleton;
