/**
 * Recharts Integration Example
 * 
 * This example demonstrates the proper usage of Recharts components
 * for the WeeklyConversionChart in the LeadsDashboard component.
 * 
 * Requirements: 9.1, 9.3, 9.8
 */

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// Example data structure matching the design document
interface WeeklyConversionData {
  week: string;
  fees: number;
  revenue: number;
  netProfit: number;
}

const sampleData: WeeklyConversionData[] = [
  { week: '12 Jul', fees: 2100, revenue: 6800, netProfit: 4700 },
  { week: '15 Jul', fees: 2400, revenue: 7200, netProfit: 4800 },
  { week: '17 Jul', fees: 2800, revenue: 8100, netProfit: 5300 },
  { week: '19 Jul', fees: 2600, revenue: 7500, netProfit: 4900 },
  { week: '21 Jul', fees: 2682, revenue: 7246, netProfit: 4564 },
];

// Currency formatter for Brazilian Real
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

/**
 * Example Recharts Bar Chart Component
 * 
 * Demonstrates:
 * - TypeScript type safety with Recharts
 * - React 19 compatibility
 * - Proper component imports
 * - Currency formatting
 * - Boostboard color scheme (#FFB800, #FF4D00, #7C3AED)
 */
export function RechartsExample() {
  return (
    <div className="w-full h-[400px] bg-[#1c1c1c] rounded-2xl p-6">
      <h3 className="text-white text-lg font-semibold mb-4">
        Weekly Conversion Chart Example
      </h3>
      
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={sampleData}>
          <XAxis 
            dataKey="week" 
            stroke="#a3a3a3"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            tickFormatter={formatCurrency}
            stroke="#a3a3a3"
            style={{ fontSize: '12px' }}
          />
          <Tooltip 
            formatter={(value: number) => formatCurrency(value)}
            contentStyle={{
              backgroundColor: '#1c1c1c',
              border: '1px solid #333',
              borderRadius: '8px',
            }}
            labelStyle={{ color: '#fff' }}
          />
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="rect"
          />
          <Bar 
            dataKey="fees" 
            fill="#FFB800" 
            name="Fees"
            radius={[4, 4, 0, 0]}
          />
          <Bar 
            dataKey="revenue" 
            fill="#FF4D00" 
            name="Revenue"
            radius={[4, 4, 0, 0]}
          />
          <Bar 
            dataKey="netProfit" 
            fill="#7C3AED" 
            name="Net Profit"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default RechartsExample;
