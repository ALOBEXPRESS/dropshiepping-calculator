/**
 * WeeklyConversionChart Usage Example
 * 
 * This example demonstrates how to use the WeeklyConversionChart component
 * with the mocked dashboard data.
 */

import { WeeklyConversionChart } from './WeeklyConversionChart';
import { MOCK_DASHBOARD_DATA } from '@/data/mockDashboardData';

/**
 * Example component showing WeeklyConversionChart usage
 */
export function WeeklyConversionChartExample() {
  return (
    <div className="w-full max-w-6xl mx-auto p-6 bg-[#0f0f0f] min-h-screen">
      <h1 className="text-white text-3xl font-bold mb-6">
        Weekly Conversion Chart Example
      </h1>
      
      <WeeklyConversionChart
        data={MOCK_DASHBOARD_DATA.weeklyConversions}
        mostProfitableDay={MOCK_DASHBOARD_DATA.metadata.mostProfitableDay}
      />
      
      <div className="mt-8 p-4 bg-[#1c1c1c] rounded-lg">
        <h2 className="text-white text-xl font-semibold mb-4">Component Features</h2>
        <ul className="text-[#a3a3a3] space-y-2">
          <li>✓ Three stacked bars: Fees (yellow), Revenue (orange), Net Profit (purple)</li>
          <li>✓ Responsive container (100% width, 400px height)</li>
          <li>✓ Currency-formatted Y-axis (R$ format)</li>
          <li>✓ Interactive tooltip with formatted values</li>
          <li>✓ Legend showing total values for each series</li>
          <li>✓ Footer message highlighting most profitable period</li>
          <li>✓ Dark theme styling (#1c1c1c background, rounded-2xl)</li>
        </ul>
      </div>
    </div>
  );
}

export default WeeklyConversionChartExample;
