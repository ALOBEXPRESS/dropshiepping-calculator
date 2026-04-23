/**
 * Mocked dashboard data for LeadsDashboard component
 */

import type { LeadStatusData, WeeklyConversionData } from '../types/dashboard';

export interface ExtendedDashboardData {
  revenue: { current: number; previous: number; growth: number | null };
  fees: { current: number; previous: number; growth: number | null };
  profit: { current: number; previous: number; growth: number | null };
  products: { current: number; previous: number; growth: number | null };
  customers: { current: number; previous: number; growth: number | null };
  weeklyConversions: WeeklyConversionData[];
  leadStatus: LeadStatusData[];
  metadata: {
    mostProfitableDay: string;
    recentSignups: number;
  };
}

export const MOCK_DASHBOARD_DATA: ExtendedDashboardData = {
  revenue: { current: 94200, previous: 85000, growth: 10.8 },
  fees: { current: 10582, previous: 9500, growth: 11.4 },
  profit: { current: 33846, previous: 30000, growth: 12.8 },
  products: { current: 42, previous: 42, growth: 0 },
  customers: { current: 11, previous: 10, growth: 10.0 },
  weeklyConversions: [
    { week: '12 Jul', day: '12 Jul', fees: 2100, revenue: 6800, profit: 4700, netProfit: 4700 },
    { week: '15 Jul', day: '15 Jul', fees: 2400, revenue: 7200, profit: 4800, netProfit: 4800 },
    { week: '17 Jul', day: '17 Jul', fees: 2800, revenue: 8100, profit: 5300, netProfit: 5300 },
    { week: '19 Jul', day: '19 Jul', fees: 2600, revenue: 7500, profit: 4900, netProfit: 4900 },
    { week: '21 Jul', day: '21 Jul', fees: 2682, revenue: 7246, profit: 4564, netProfit: 4564 },
  ],
  leadStatus: [
    { status: 'new', label: 'Sem Lucro Processado', count: 177, percentage: 45, color: '#FFB800' },
    { status: 'contacted', label: 'Lucro Processado 1x', count: 87, percentage: 27, color: '#FF4D00' },
    { status: 'qualified', label: 'Qualificados (2+x)', count: 23, percentage: 28, color: '#7C3AED' },
  ],
  metadata: {
    mostProfitableDay: '17 de Julho',
    recentSignups: 14,
  },
};
