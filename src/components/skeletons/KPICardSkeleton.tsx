/**
 * KPICardSkeleton Component
 * 
 * Loading skeleton for KPICard component.
 * Displays animated placeholder matching the KPICard layout.
 * 
 * Requirements: 10.1, 10.9
 */

import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * KPICardSkeleton Component
 * 
 * Renders a loading skeleton that matches the KPICard structure:
 * - Header with title and icon placeholder
 * - Large value placeholder
 * - Trend indicator placeholder
 */
export const KPICardSkeleton: React.FC = () => {
  return (
    <Card 
      className="bg-[#1c1c1c] border-none rounded-2xl p-6 shadow-xl"
      role="status"
      aria-label="Loading KPI data"
    >
      <CardHeader className="p-0 mb-4">
        <div className="flex items-center justify-between">
          {/* Title skeleton */}
          <Skeleton className="h-4 w-32 bg-[#2a2a2a]" />
          {/* Icon skeleton */}
          <Skeleton className="h-5 w-5 rounded bg-[#2a2a2a]" />
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="space-y-2">
          {/* Large value skeleton */}
          <Skeleton className="h-9 w-40 bg-[#2a2a2a]" />
          
          {/* Trend indicator skeleton */}
          <div className="flex items-center gap-1">
            <Skeleton className="h-4 w-4 rounded bg-[#2a2a2a]" />
            <Skeleton className="h-4 w-16 bg-[#2a2a2a]" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default KPICardSkeleton;
