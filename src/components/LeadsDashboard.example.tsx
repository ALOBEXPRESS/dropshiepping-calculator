/**
 * LeadsDashboard Component Example
 * 
 * This file demonstrates how to use the LeadsDashboard component
 * in different contexts and configurations.
 */

import React from 'react';
import LeadsDashboard from './LeadsDashboard';

/**
 * Basic Usage Example
 * 
 * The LeadsDashboard component is a self-contained dashboard
 * that includes navigation, KPI cards, and chart placeholders.
 * It uses mocked data from mockDashboardData.ts by default.
 */
export const BasicExample: React.FC = () => {
  return <LeadsDashboard />;
};

/**
 * Full Page Example
 * 
 * The LeadsDashboard is designed to be used as a full-page component.
 * It includes a fixed navigation bar and responsive layout.
 */
export const FullPageExample: React.FC = () => {
  return (
    <div className="w-full h-screen">
      <LeadsDashboard />
    </div>
  );
};

/**
 * Responsive Layout Demonstration
 * 
 * The component automatically adapts to different screen sizes:
 * - Mobile (< 768px): Single column, stacked cards
 * - Tablet (768px - 1024px): 2-column KPI grid, stacked charts
 * - Desktop (> 1024px): 3-column KPI row, side-by-side charts
 */
export const ResponsiveExample: React.FC = () => {
  return (
    <div className="space-y-8">
      <div className="text-white text-center p-4">
        <h2 className="text-2xl font-bold mb-2">Responsive Dashboard</h2>
        <p className="text-gray-400">Resize your browser to see the layout adapt</p>
      </div>
      <LeadsDashboard />
    </div>
  );
};

/**
 * Integration Notes
 * 
 * To integrate the LeadsDashboard into your application:
 * 
 * 1. Import the component:
 *    import LeadsDashboard from '@/components/LeadsDashboard';
 * 
 * 2. Add it to your route:
 *    <Route path="/dashboard" element={<LeadsDashboard />} />
 * 
 * 3. The component uses mocked data from src/data/mockDashboardData.ts
 *    In Phase 2, this will be replaced with API calls.
 * 
 * 4. Chart components (WeeklyConversionChart and LeadStatusChart)
 *    will be implemented in Phase 2 and will replace the placeholders.
 */

export default BasicExample;
