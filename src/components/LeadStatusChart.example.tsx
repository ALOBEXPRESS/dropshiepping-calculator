/**
 * Example usage of LeadStatusChart component
 * 
 * This file demonstrates how to use the LeadStatusChart component
 * with mocked data from the dashboard data file.
 */

import React from 'react';
import { LeadStatusChart } from './LeadStatusChart';
import { MOCK_DASHBOARD_DATA } from '../data/mockDashboardData';

/**
 * Example component showing LeadStatusChart integration
 */
export const LeadStatusChartExample: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0f0f0f] p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-white text-3xl font-bold mb-8">
          LeadStatusChart Component Example
        </h1>
        
        <LeadStatusChart
          data={MOCK_DASHBOARD_DATA.leadStatus}
          recentSignups={MOCK_DASHBOARD_DATA.metadata.recentSignups}
        />
        
        <div className="mt-8 p-6 bg-[#1c1c1c] rounded-2xl">
          <h2 className="text-white text-xl font-semibold mb-4">Data Structure</h2>
          <pre className="text-gray-300 text-sm overflow-auto">
            {JSON.stringify(
              {
                leadStatus: MOCK_DASHBOARD_DATA.leadStatus,
                recentSignups: MOCK_DASHBOARD_DATA.metadata.recentSignups,
              },
              null,
              2
            )}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default LeadStatusChartExample;
