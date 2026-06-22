 
/**
 * Example usage of useDashboardData hook
 * 
 * This file demonstrates how to use the useDashboardData hook
 * in a React component to fetch and display dashboard data.
 */

import { useState } from 'react';
import { useDashboardData } from './useDashboardData';
import type { TimePeriod } from '../types/dashboard';

/**
 * Example component showing basic usage of useDashboardData
 */
export function DashboardExample() {
  const [period, setPeriod] = useState<TimePeriod>('week');
  const { data, isLoading, isError, error, refetch } = useDashboardData(period);

  // Loading state
  if (isLoading) {
    return (
      <div className="p-4">
        <p>Loading dashboard data...</p>
        <div className="animate-pulse space-y-4">
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded">
        <h3 className="text-red-800 font-semibold mb-2">Error Loading Dashboard</h3>
        <p className="text-red-600 mb-4">{error?.message || 'Failed to load dashboard data'}</p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  // Success state with data
  return (
    <div className="p-4 space-y-4">
      {/* Period Filter */}
      <div className="flex gap-2">
        {(['day', 'week', 'month', 'year', 'total'] as TimePeriod[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-2 rounded ${
              period === p
                ? 'bg-orange-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Profit Card */}
        <div className="p-4 bg-white border rounded shadow">
          <h3 className="text-sm text-gray-600 mb-2">Total Profit</h3>
          <p className="text-2xl font-bold">
            ${data?.profit.current.toLocaleString()}
          </p>
          {data?.profit.growth !== null && (
            <p className={`text-sm ${data?.profit.growth != null && data.profit.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {data?.profit.growth != null && data.profit.growth >= 0 ? '↑' : '↓'} {Math.abs(data?.profit.growth ?? 0).toFixed(1)}%
            </p>
          )}
        </div>

        {/* Orders Card */}
        <div className="p-4 bg-white border rounded shadow">
          <h3 className="text-sm text-gray-600 mb-2">Orders</h3>
          <p className="text-2xl font-bold">
            {data?.customers.current.toLocaleString()}
          </p>
          {data?.customers.growth !== null && (
            <p className={`text-sm ${data?.customers.growth != null && data.customers.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {data?.customers.growth != null && data.customers.growth >= 0 ? '↑' : '↓'} {Math.abs(data?.customers.growth ?? 0).toFixed(1)}%
            </p>
          )}
        </div>

        {/* Customers Card */}
        <div className="p-4 bg-white border rounded shadow">
          <h3 className="text-sm text-gray-600 mb-2">Customers</h3>
          <p className="text-2xl font-bold">
            {data?.customers.current.toLocaleString()}
          </p>
          {data?.customers.growth !== null && (
            <p className={`text-sm ${data?.customers.growth != null && data.customers.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {data?.customers.growth != null && data.customers.growth >= 0 ? '↑' : '↓'} {Math.abs(data?.customers.growth ?? 0).toFixed(1)}%
            </p>
          )}
        </div>

        {/* Products Card */}
        <div className="p-4 bg-white border rounded shadow">
          <h3 className="text-sm text-gray-600 mb-2">Products</h3>
          <p className="text-2xl font-bold">
            {data?.products.current.toLocaleString()}
          </p>
          {data?.products.growth !== null && (
            <p className={`text-sm ${data?.products.growth != null && data.products.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {data?.products.growth != null && data.products.growth >= 0 ? '↑' : '↓'} {Math.abs(data?.products.growth ?? 0).toFixed(1)}%
            </p>
          )}
        </div>
      </div>

      {/* Manual Refetch Button */}
      <button
        onClick={() => refetch()}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Refresh Data
      </button>
    </div>
  );
}

/**
 * Example showing how to use the hook with custom loading component
 */
export function DashboardWithCustomLoading() {
  const { data, isLoading } = useDashboardData('week');

  return (
    <div>
      {isLoading ? (
        <CustomLoadingSkeleton />
      ) : (
        <div>
          <h2>Profit: ${data?.profit.current}</h2>
          <h2>Orders: {data?.customers.current}</h2>
        </div>
      )}
    </div>
  );
}

function CustomLoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-24 bg-gray-200 animate-pulse rounded"></div>
      <div className="h-24 bg-gray-200 animate-pulse rounded"></div>
    </div>
  );
}

/**
 * Example showing how to handle different periods
 */
export function DashboardWithPeriodSwitch() {
  const [period, setPeriod] = useState<TimePeriod>('week');
  const { data, isLoading } = useDashboardData(period);

  const handlePeriodChange = (newPeriod: TimePeriod) => {
    setPeriod(newPeriod);
    // React Query will automatically fetch new data when period changes
    // because the query key includes the period
  };

  return (
    <div>
      <select value={period} onChange={(e) => handlePeriodChange(e.target.value as TimePeriod)}>
        <option value="day">Day</option>
        <option value="week">Week</option>
        <option value="month">Month</option>
        <option value="year">Year</option>
        <option value="total">Total</option>
      </select>

      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <div>
          <p>Profit: ${data?.profit.current}</p>
          <p>Growth: {data?.profit.growth}%</p>
        </div>
      )}
    </div>
  );
}
