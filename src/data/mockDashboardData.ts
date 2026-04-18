/**
 * Mocked dashboard data for LeadsDashboard component
 * 
 * This file contains static data matching the Boostboard reference design.
 * Values are structured to be easily replaceable with API calls in the future.
 * 
 * Requirements: 7.1, 7.3, 7.4, 7.5
 */

import type { DashboardData } from '../types/dashboard';

/**
 * Main mocked dashboard data constant
 * 
 * Contains KPI metrics, weekly conversion data, lead status distribution,
 * and metadata matching the exact values from the Boostboard reference design.
 */
export const MOCK_DASHBOARD_DATA: DashboardData = {
  kpis: {
    totalRevenue: {
      value: 33846,
      trend: {
        direction: 'up',
        percentage: 12.5,
        comparisonPeriod: 'month'
      }
    },
    marketplaceFees: {
      value: 12582,
      trend: {
        direction: 'down',
        percentage: 3.2,
        comparisonPeriod: 'month'
      },
      breakdown: {
        mercadoLivre: 7500,
        shopee: 3200,
        tiktok: 1882
      }
    },
    totalLeads: {
      value: 245214,
      trend: {
        direction: 'up',
        percentage: 8.7,
        comparisonPeriod: 'week'
      }
    }
  },
  weeklyConversions: [
    {
      week: '12 Jul',
      date: new Date('2024-07-12'),
      fees: 2100,
      revenue: 6800,
      netProfit: 4700,
      conversionRate: 0.15
    },
    {
      week: '15 Jul',
      date: new Date('2024-07-15'),
      fees: 2400,
      revenue: 7200,
      netProfit: 4800,
      conversionRate: 0.18
    },
    {
      week: '17 Jul',
      date: new Date('2024-07-17'),
      fees: 2800,
      revenue: 8100,
      netProfit: 5300,
      conversionRate: 0.22
    },
    {
      week: '19 Jul',
      date: new Date('2024-07-19'),
      fees: 2600,
      revenue: 7500,
      netProfit: 4900,
      conversionRate: 0.19
    },
    {
      week: '21 Jul',
      date: new Date('2024-07-21'),
      fees: 2682,
      revenue: 7246,
      netProfit: 4564,
      conversionRate: 0.17
    }
  ],
  leadStatus: [
    {
      status: 'completed',
      count: 177,
      percentage: 67,
      color: '#FFB800',
      label: 'Concluídos'
    },
    {
      status: 'ongoing',
      count: 87,
      percentage: 21,
      color: '#FF4D00',
      label: 'Em Andamento'
    },
    {
      status: 'awaiting',
      count: 23,
      percentage: 12,
      color: '#7C3AED',
      label: 'Aguardando'
    }
  ],
  metadata: {
    lastUpdated: new Date(),
    mostProfitableDay: '17 de Julho',
    recentSignups: 14,
    dataSource: 'mock'
  }
};
