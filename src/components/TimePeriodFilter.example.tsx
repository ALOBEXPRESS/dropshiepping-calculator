/**
 * TimePeriodFilter Component Examples
 * 
 * Demonstrates various usage scenarios for the TimePeriodFilter component.
 */

import React, { useState } from 'react';
import TimePeriodFilter from './TimePeriodFilter';
import type { TimePeriod } from '../types/dashboard';

/**
 * Example 1: Basic Usage
 * 
 * Shows the filter with default state and period selection.
 */
export const BasicExample: React.FC = () => {
  const [period, setPeriod] = useState<TimePeriod>('week');

  return (
    <div className="p-8 bg-[#0f0f0f] min-h-screen">
      <h2 className="text-2xl font-bold text-white mb-6">Basic Usage</h2>
      
      <TimePeriodFilter
        selectedPeriod={period}
        onPeriodChange={setPeriod}
      />
      
      <div className="mt-4 p-4 bg-[#1c1c1c] rounded-lg">
        <p className="text-white">
          Selected Period: <span className="text-[#FF4D00] font-bold">{period}</span>
        </p>
      </div>
    </div>
  );
};

/**
 * Example 2: Disabled State
 * 
 * Shows the filter in disabled state during data loading.
 */
export const DisabledExample: React.FC = () => {
  const [period, setPeriod] = useState<TimePeriod>('month');
  const [isLoading, setIsLoading] = useState(false);

  const handlePeriodChange = (newPeriod: TimePeriod) => {
    setPeriod(newPeriod);
    setIsLoading(true);
    
    // Simulate data loading
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  };

  return (
    <div className="p-8 bg-[#0f0f0f] min-h-screen">
      <h2 className="text-2xl font-bold text-white mb-6">Disabled State (Loading)</h2>
      
      <TimePeriodFilter
        selectedPeriod={period}
        onPeriodChange={handlePeriodChange}
        disabled={isLoading}
      />
      
      <div className="mt-4 p-4 bg-[#1c1c1c] rounded-lg">
        <p className="text-white">
          {isLoading ? (
            <span className="text-[#a3a3a3]">Loading data...</span>
          ) : (
            <>
              Selected Period: <span className="text-[#FF4D00] font-bold">{period}</span>
            </>
          )}
        </p>
      </div>
    </div>
  );
};

/**
 * Example 3: With Dashboard Context
 * 
 * Shows the filter integrated with mock KPI data.
 */
export const DashboardContextExample: React.FC = () => {
  const [period, setPeriod] = useState<TimePeriod>('week');
  const [isLoading, setIsLoading] = useState(false);

  const mockData: Record<TimePeriod, { profit: number; orders: number }> = {
    day: { profit: 1250, orders: 15 },
    week: { profit: 8750, orders: 105 },
    month: { profit: 35000, orders: 420 },
    year: { profit: 420000, orders: 5040 },
    total: { profit: 1250000, orders: 15000 },
  };

  const handlePeriodChange = (newPeriod: TimePeriod) => {
    setIsLoading(true);
    
    // Simulate data loading
    setTimeout(() => {
      setPeriod(newPeriod);
      setIsLoading(false);
    }, 800);
  };

  const currentData = mockData[period];

  return (
    <div className="p-8 bg-[#0f0f0f] min-h-screen">
      <h2 className="text-2xl font-bold text-white mb-6">Dashboard Context</h2>
      
      <TimePeriodFilter
        selectedPeriod={period}
        onPeriodChange={handlePeriodChange}
        disabled={isLoading}
      />
      
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-6 bg-[#1c1c1c] rounded-2xl">
          <p className="text-sm text-[#a3a3a3] uppercase mb-2">Lucro Total</p>
          {isLoading ? (
            <div className="h-8 bg-[#2c2c2c] rounded animate-pulse" />
          ) : (
            <p className="text-3xl font-bold text-white">
              R$ {currentData.profit.toLocaleString('pt-BR')}
            </p>
          )}
        </div>
        
        <div className="p-6 bg-[#1c1c1c] rounded-2xl">
          <p className="text-sm text-[#a3a3a3] uppercase mb-2">Pedidos</p>
          {isLoading ? (
            <div className="h-8 bg-[#2c2c2c] rounded animate-pulse" />
          ) : (
            <p className="text-3xl font-bold text-white">
              {currentData.orders.toLocaleString('pt-BR')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Example 4: Mobile Responsive
 * 
 * Shows the filter in a narrow container to demonstrate mobile behavior.
 */
export const MobileResponsiveExample: React.FC = () => {
  const [period, setPeriod] = useState<TimePeriod>('year');

  return (
    <div className="p-8 bg-[#0f0f0f] min-h-screen">
      <h2 className="text-2xl font-bold text-white mb-6">Mobile Responsive</h2>
      
      <div className="max-w-sm border-2 border-[#1c1c1c] rounded-lg p-4">
        <p className="text-sm text-[#a3a3a3] mb-4">
          Container width: 384px (mobile viewport)
        </p>
        
        <TimePeriodFilter
          selectedPeriod={period}
          onPeriodChange={setPeriod}
        />
        
        <p className="text-xs text-[#a3a3a3] mt-4">
          ← Scroll horizontally to see all options
        </p>
      </div>
    </div>
  );
};

/**
 * Example 5: All Periods
 * 
 * Shows all five period options in sequence.
 */
export const AllPeriodsExample: React.FC = () => {
  const periods: TimePeriod[] = ['day', 'week', 'month', 'year', 'total'];
  
  return (
    <div className="p-8 bg-[#0f0f0f] min-h-screen">
      <h2 className="text-2xl font-bold text-white mb-6">All Period Options</h2>
      
      <div className="space-y-6">
        {periods.map((period) => (
          <div key={period}>
            <p className="text-sm text-[#a3a3a3] mb-2 capitalize">{period}</p>
            <TimePeriodFilter
              selectedPeriod={period}
              onPeriodChange={() => {}}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Default export with all examples
 */
const TimePeriodFilterExamples: React.FC = () => {
  return (
    <div className="space-y-12">
      <BasicExample />
      <DisabledExample />
      <DashboardContextExample />
      <MobileResponsiveExample />
      <AllPeriodsExample />
    </div>
  );
};

export default TimePeriodFilterExamples;
