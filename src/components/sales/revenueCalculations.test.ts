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
  getBlockedOrderProfit,
  isBlockedOrder,
  calculatePlatformBreakdown,
  isOrderSettled,
  calculateDefaultDeliveryDate,
  calculateSettlementDate,
  formatDateBR,
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
      expect(getSettledOrderProfit('210')).toBe(-40.20);
      expect(getSettledOrderProfit('214')).toBe(5.74);
      expect(getSettledOrderProfit('SONIA-001')).toBe(-1.87);
      expect(getSettledOrderProfit('180')).toBe(9.76);
      expect(getSettledOrderProfit('999999')).toBe(null);
      expect(getSettledOrderProfit(null)).toBe(null);
      expect(getSettledOrderProfit(undefined)).toBe(null);
    });

    it('matches exact Shopee platform financial reconciliation (5 orders + SONIA-001)', () => {
      const shopeeNums = ['SONIA-001', '225', '226', '180', '13', '233'];
      const orders = shopeeNums.map(num => ({ profit: getSettledOrderProfit(num)! }));
      const breakdown = calculatePlatformBreakdown(orders);

      expect(breakdown.ordersCount).toBe(6);
      expect(breakdown.totalProfits).toBe(30.22);
      expect(breakdown.totalLosses).toBe(-5.11);
      expect(breakdown.netProfit).toBe(25.11);
    });

    it('matches exact 34 settled orders (+R$ 122,84 net) across store', () => {
      const settledNums = [
        // Shopee (6 orders)
        'SONIA-001', '225', '226', '180', '13', '233',
        // TikTok Settled (28 orders)
        '223', '210', '224', '218', '204', '4', '221',
        '208', '235', '237', '238', '240', '243',
        '231', '232', '234', '15', '239', '255',
        '187', '214', '17', '222', '219', '14',
        '10', '229', '265'
      ];
      const settledOrders = settledNums.map(num => ({ profit: getSettledOrderProfit(num)! }));
      const settledBreakdown = calculatePlatformBreakdown(settledOrders);

      expect(settledBreakdown.ordersCount).toBe(34);
      expect(settledBreakdown.profitOrdersCount).toBe(23);
      expect(settledBreakdown.lossOrdersCount).toBe(10);
      expect(settledBreakdown.totalProfits).toBe(277.45);
      expect(settledBreakdown.totalLosses).toBe(-154.61);
      expect(settledBreakdown.netProfit).toBe(122.84);
    });

    it('matches exact 11 blocked orders (+R$ 95,75 net) with repasse retido', () => {
      const blockedNums = [
        '241', '246', '247', '248', '251', '252', '254', '262', '263',
        '268', '266'
      ];
      const blockedOrders = blockedNums.map(num => ({ profit: getBlockedOrderProfit(num)! }));
      const blockedBreakdown = calculatePlatformBreakdown(blockedOrders);

      expect(blockedBreakdown.ordersCount).toBe(11);
      expect(blockedBreakdown.profitOrdersCount).toBe(9);
      expect(blockedBreakdown.lossOrdersCount).toBe(2);
      expect(blockedBreakdown.totalProfits).toBe(98.55);
      expect(blockedBreakdown.totalLosses).toBe(-2.80);
      expect(blockedBreakdown.netProfit).toBe(95.75);
    });
  });

  describe('isOrderSettled', () => {
    const refDate = new Date(2026, 9, 12); // 2026-10-12

    it('returns true if orderDate is missing or empty', () => {
      expect(isOrderSettled(null, 7, refDate)).toBe(true);
      expect(isOrderSettled(undefined, 7, refDate)).toBe(true);
      expect(isOrderSettled('', 7, refDate)).toBe(true);
    });

    it('identifies order as pending by default when within settlementDays window from order date', () => {
      // Order placed 2 days ago (2026-10-10) -> settlement on 2026-10-17
      expect(isOrderSettled('2026-10-10', 7, refDate)).toBe(false);
      // Order placed 6 days ago (2026-10-06) -> settlement on 2026-10-13 (refDate is 2026-10-12)
      expect(isOrderSettled('2026-10-06', 7, refDate)).toBe(false);
    });

    it('identifies order as settled by default when settlementDays (7 days) have elapsed from order date', () => {
      // Order placed 7 days ago (2026-10-05) -> settlement on 2026-10-12 (refDate is 2026-10-12)
      expect(isOrderSettled('2026-10-05', 7, refDate)).toBe(true);
      // Order placed 10 days ago (2026-10-02) -> settled
      expect(isOrderSettled('2026-10-02', 7, refDate)).toBe(true);
    });

    it('starts countdown from custom delivery_date when provided', () => {
      // Order placed 2026-10-01, delivered on 2026-10-03 -> settlement occurs on 2026-10-10 (settled by 2026-10-12)
      expect(isOrderSettled('2026-10-01', 7, refDate, '2026-10-03')).toBe(true);
      // Order placed 2026-10-01, delivered on 2026-10-08 -> settlement occurs on 2026-10-15 (pending on 2026-10-12)
      expect(isOrderSettled('2026-10-01', 7, refDate, '2026-10-08')).toBe(false);
    });

    it('respects configurable settlement periods with delivery date', () => {
      // 1 day settlement after delivery on 2026-10-11 -> settles on 2026-10-12 (today)
      expect(isOrderSettled('2026-10-10', 1, refDate, '2026-10-11')).toBe(true);
      expect(isOrderSettled('2026-10-10', 1, refDate, '2026-10-12')).toBe(false);
    });

    it('handles ISO timestamps with timezone', () => {
      expect(isOrderSettled('2026-10-10T15:30:00.000Z', 7, refDate)).toBe(false);
      expect(isOrderSettled('2026-09-20T10:00:00.000Z', 7, refDate)).toBe(true);
    });

    it('suspends settlement indefinitely when in logistics delay without confirmed delivery date', () => {
      // Placed 30 days ago, normally settled, but in logistics delay and not delivered -> pending
      expect(isOrderSettled('2026-09-12', 7, refDate, null, true)).toBe(false);
      expect(isOrderSettled('2026-09-12', 7, refDate, '', true)).toBe(false);
      expect(isOrderSettled(null, 7, refDate, null, true)).toBe(false);
    });

    it('applies delivery_date + 7 days settlement when order in logistics delay gets delivered', () => {
      // Delivered on 2026-10-03 + 7 days = 2026-10-10. refDate is 2026-10-12 -> settled!
      expect(isOrderSettled('2026-09-12', 7, refDate, '2026-10-03', true)).toBe(true);
      // Delivered on 2026-10-08 + 7 days = 2026-10-15. refDate is 2026-10-12 -> not yet settled!
      expect(isOrderSettled('2026-09-12', 7, refDate, '2026-10-08', true)).toBe(false);
    });

    it('settles immediately when isManuallySettled is true regardless of dates or delay', () => {
      expect(isOrderSettled('2026-10-11', 7, refDate, null, false, true)).toBe(true);
      expect(isOrderSettled('2026-10-11', 7, refDate, null, true, true)).toBe(true);
    });
  });

  describe('delivery and settlement date helpers', () => {
    it('calculates default delivery date 7 days after order date', () => {
      expect(calculateDefaultDeliveryDate('2026-10-10', 7)).toBe('2026-10-17');
      expect(calculateDefaultDeliveryDate('2026-10-03', 7)).toBe('2026-10-10');
      expect(calculateDefaultDeliveryDate(null)).toBeNull();
    });

    it('calculates settlement date based on custom delivery date or default order date', () => {
      // Custom delivery: 2026-10-12 + 7 days settlement = 2026-10-19
      expect(calculateSettlementDate('2026-10-10', '2026-10-12', 7)).toBe('2026-10-19');
      // Default order date: 2026-10-10 + 7 days settlement = 2026-10-17
      expect(calculateSettlementDate('2026-10-10', null, 7)).toBe('2026-10-17');
    });

    it('returns null settlement date when logistics delayed without delivery date', () => {
      expect(calculateSettlementDate('2026-10-10', null, 7, true)).toBeNull();
      expect(calculateSettlementDate('2026-10-10', '2026-10-12', 7, true)).toBe('2026-10-19');
    });

    it('formats dates in DD/MM/YYYY without timezone drift', () => {
      expect(formatDateBR('2026-10-10')).toBe('10/10/2026');
      expect(formatDateBR('2026-10-10T15:00:00Z')).toBe('10/10/2026');
      expect(formatDateBR(null)).toBe('');
    });
  });
});

