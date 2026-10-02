import { describe, it, expect } from 'vitest';
import {
  formatBRL,
  round2,
  safeSum,
  calculateMargin,
  calculatePercentageChange,
  getSafePeriodLabels,
  matchesOrderFilters,
  getSettledOrderProfit,
  SETTLED_ORDER_PROFIT_OVERRIDES,
  calculatePlatformBreakdown,
} from './revenueCalculations';

describe('revenueCalculations', () => {
  describe('formatBRL', () => {
    it('formats positive numbers as BRL', () => {
      const formatted = formatBRL(324.85);
      expect(formatted).toContain('324,85');
    });

    it('formats negative numbers as BRL', () => {
      const formatted = formatBRL(-25.23);
      expect(formatted).toContain('25,23');
    });

    it('handles zero and nullish gracefully', () => {
      expect(formatBRL(0)).toContain('0,00');
      expect(formatBRL(null)).toContain('0,00');
      expect(formatBRL(undefined)).toContain('0,00');
      expect(formatBRL(NaN)).toContain('0,00');
    });
  });

  describe('round2 and safeSum', () => {
    it('avoids floating point drift (0.1 + 0.2)', () => {
      expect(0.1 + 0.2).not.toBe(0.3);
      expect(safeSum([0.1, 0.2])).toBe(0.3);
    });

    it('sums array of numbers with nulls and undefined safely', () => {
      expect(safeSum([100.55, null, 25.45, undefined, 10])).toBe(136);
    });

    it('rounds correctly to 2 decimals', () => {
      expect(round2(12.3456)).toBe(12.35);
      expect(round2(-85.854)).toBe(-85.85);
    });
  });

  describe('calculateMargin', () => {
    it('classifies healthy margin >= 20%', () => {
      const res = calculateMargin(25, 100);
      expect(res.marginPercent).toBe(25);
      expect(res.status).toBe('healthy');
    });

    it('classifies warning margin between 10% and 20%', () => {
      const res = calculateMargin(15, 100);
      expect(res.marginPercent).toBe(15);
      expect(res.status).toBe('warning');

      const boundary10 = calculateMargin(10, 100);
      expect(boundary10.marginPercent).toBe(10);
      expect(boundary10.status).toBe('warning');
    });

    it('classifies critical margin < 10%', () => {
      const res = calculateMargin(9.5, 100);
      expect(res.marginPercent).toBe(9.5);
      expect(res.status).toBe('critical');

      const negativeMargin = calculateMargin(-50, 100);
      expect(negativeMargin.marginPercent).toBe(-50);
      expect(negativeMargin.status).toBe('critical');
    });

    it('handles zero revenue safely without division by zero', () => {
      const zeroRev = calculateMargin(0, 0);
      expect(zeroRev.marginPercent).toBe(0);
      expect(zeroRev.status).toBe('critical');

      const negativeLossWithZeroRev = calculateMargin(-30, 0);
      expect(negativeLossWithZeroRev.marginPercent).toBe(-100);
      expect(negativeLossWithZeroRev.status).toBe('critical');
    });
  });

  describe('calculatePercentageChange', () => {
    it('calculates standard positive growth', () => {
      expect(calculatePercentageChange(150, 100)).toBe(50);
    });

    it('calculates standard negative decline', () => {
      expect(calculatePercentageChange(50, 100)).toBe(-50);
    });

    it('handles previous === 0 gracefully', () => {
      expect(calculatePercentageChange(100, 0)).toBe(100);
      expect(calculatePercentageChange(0, 0)).toBe(0);
    });

    it('handles negative previous period profit correctly', () => {
      // From -100 to +50: difference is +150, divided by |-100| = +150%
      expect(calculatePercentageChange(50, -100)).toBe(150);
      // From -100 to -150: difference is -50, divided by |-100| = -50%
      expect(calculatePercentageChange(-150, -100)).toBe(-50);
    });
  });

  describe('getSafePeriodLabels', () => {
    it('prevents rollover bug on 31st of months (e.g. March 31 -> Feb)', () => {
      // March 31, 2026
      const march31 = new Date(2026, 2, 31);
      const labels = getSafePeriodLabels('monthly', march31);
      expect(labels.current).toBe('Mar');
      expect(labels.previous).toBe('Feb'); // In buggy Date.setMonth(-1), this became Mar!
    });

    it('prevents rollover bug on May 31 -> Apr', () => {
      const may31 = new Date(2026, 4, 31);
      const labels = getSafePeriodLabels('monthly', may31);
      expect(labels.current).toBe('May');
      expect(labels.previous).toBe('Apr');
    });

    it('handles January roll back to December of previous year', () => {
      const jan15 = new Date(2026, 0, 15);
      const labels = getSafePeriodLabels('monthly', jan15);
      expect(labels.current).toBe('Jan');
      expect(labels.previous).toBe('Dec');
    });

    it('handles yearly comparison', () => {
      const oct2026 = new Date(2026, 9, 2);
      const labels = getSafePeriodLabels('yearly', oct2026);
      expect(labels.current).toBe('2026');
      expect(labels.previous).toBe('2025');
    });
  });

  describe('matchesOrderFilters', () => {
    const mockOrder = {
      order_date: '2026-09-15T14:30:00Z',
      marketplace_name: 'TikTok Shop',
      marketplace_id: 'tiktok-br-123',
    };

    it('returns true when no filters are set', () => {
      expect(matchesOrderFilters(mockOrder)).toBe(true);
      expect(matchesOrderFilters(mockOrder, {})).toBe(true);
    });

    it('filters by date range correctly', () => {
      expect(
        matchesOrderFilters(mockOrder, { startDate: '2026-09-01', endDate: '2026-09-30' })
      ).toBe(true);

      expect(
        matchesOrderFilters(mockOrder, { startDate: '2026-09-20' })
      ).toBe(false);

      expect(
        matchesOrderFilters(mockOrder, { endDate: '2026-09-10' })
      ).toBe(false);
    });

    it('filters by marketplace id or name', () => {
      expect(matchesOrderFilters(mockOrder, { marketplaceId: 'tiktok' })).toBe(true);
      expect(matchesOrderFilters(mockOrder, { marketplaceId: 'tiktok-br' })).toBe(true);
      expect(matchesOrderFilters(mockOrder, { marketplaceId: 'shopee' })).toBe(false);
    });
  });

  describe('SETTLED_ORDER_PROFIT_OVERRIDES and platform breakdown', () => {
    it('retrieves settled profit for known orders', () => {
      expect(getSettledOrderProfit('223')).toBe(-51.76);
      expect(getSettledOrderProfit('210')).toBe(-40.45);
      expect(getSettledOrderProfit('214')).toBe(32.94);
      expect(getSettledOrderProfit('SONIA-001')).toBe(-1.87);
      expect(getSettledOrderProfit('180')).toBe(9.76);
      expect(getSettledOrderProfit('999999')).toBe(null);
      expect(getSettledOrderProfit(null)).toBe(null);
      expect(getSettledOrderProfit(undefined)).toBe(null);
    });

    it('matches exact TikTok Shop platform financial reconciliation', () => {
      const tiktokNums = [
        '223', '210', '224', '204', '218', '17', '4',
        '214', '187', '10', '15', '14', '221', '208', '219', '229', '222'
      ];
      const orders = tiktokNums.map(num => ({ profit: getSettledOrderProfit(num)! }));
      const breakdown = calculatePlatformBreakdown(orders);

      expect(breakdown.ordersCount).toBe(17);
      expect(breakdown.profitOrdersCount).toBe(10);
      expect(breakdown.lossOrdersCount).toBe(7);
      expect(breakdown.totalProfits).toBe(109.39);
      expect(breakdown.totalLosses).toBe(-149.50);
      expect(breakdown.netProfit).toBe(-40.11);
    });

    it('matches exact Shopee platform financial reconciliation', () => {
      const shopeeNums = ['SONIA-001', '225', '226', '180', '13'];
      const orders = shopeeNums.map(num => ({ profit: getSettledOrderProfit(num)! }));
      const breakdown = calculatePlatformBreakdown(orders);

      expect(breakdown.ordersCount).toBe(5);
      expect(breakdown.profitOrdersCount).toBe(2);
      expect(breakdown.lossOrdersCount).toBe(3);
      expect(breakdown.totalProfits).toBe(19.99);
      expect(breakdown.totalLosses).toBe(-5.11);
      expect(breakdown.netProfit).toBe(14.88);
    });

    it('matches exact Total 22 orders financial reconciliation (-R$ 25,23)', () => {
      const allNums = Object.keys(SETTLED_ORDER_PROFIT_OVERRIDES);
      const orders = allNums.map(num => ({ profit: getSettledOrderProfit(num)! }));
      const breakdown = calculatePlatformBreakdown(orders);

      expect(breakdown.ordersCount).toBe(22);
      expect(breakdown.profitOrdersCount).toBe(12);
      expect(breakdown.lossOrdersCount).toBe(10);
      expect(breakdown.totalProfits).toBe(129.38);
      expect(breakdown.totalLosses).toBe(-154.61);
      expect(breakdown.netProfit).toBe(-25.23);
    });
  });
});

