import { describe, it, expect } from 'vitest';
import { calculateMetrics, getRecommendedMargin } from './pricingService';

describe('Pricing Service', () => {
  describe('getRecommendedMargin', () => {
    it('should return 30 for prices <= 30', () => {
      expect(getRecommendedMargin(10)).toBe(30);
      expect(getRecommendedMargin(30)).toBe(30);
    });
    it('should return 25 for prices <= 50', () => {
      expect(getRecommendedMargin(31)).toBe(25);
      expect(getRecommendedMargin(50)).toBe(25);
    });
    it('should return 22 for prices <= 80', () => {
      expect(getRecommendedMargin(51)).toBe(22);
      expect(getRecommendedMargin(80)).toBe(22);
    });
    it('should return 19 for prices <= 150', () => {
      expect(getRecommendedMargin(81)).toBe(19);
      expect(getRecommendedMargin(150)).toBe(19);
    });
    it('should return 16 for prices > 150', () => {
      expect(getRecommendedMargin(151)).toBe(16);
      expect(getRecommendedMargin(200)).toBe(16);
    });
  });

  describe('calculateMetrics - General Logic', () => {
    it('should calculate metrics correctly for Mercado Livre', () => {
      const result = calculateMetrics(
        50.00, // baseCost
        2.00, // pkgCost
        0, // supplierFeePercent
        0, // markup
        'mercadolivre', // currentMarketplace
        'eletronicos', // currentCategory
        'classico', // currentAdType
        'without', // currentShipping
        'cnpj', // currentShopeeSellerType
        0, // currentExtraCommission
        false, // currentAds
        0, // currentCpc
        0, // currentDailyBudget
        0, // currentSales
        4.00, // gatewayFeeVal
        0, // manualPriceVal
        0, // competitorPriceVal
        0, // competitorMarkupVal
        0, // tiktokCommVal
        0, // wpShippingVal
        0, // emergencyReserveVal
        0, // returnRateVal
        0, // paidTrafficVal
        10.00, // mlShippingVal
        'percent',
        0,
        0,
        0,
        'classico',
        0,
        '',
        '',
        '',
        '',
        false,
        'percent',
        0,
        0,
        'fixed',
        'individual',
        'eletronicos',
        0,
        0,
        0,
        0,
        0,
        'fixed',
        'fixed',
        'fixed',
        'fixed'
      );

      // Total Cost = 50 + 2 + 10 = 62
      // Recommended Margin for 62 is 22%
      // ML Fee (Classico Eletronicos) = 12%
      // Gateway Fee = 4%
      // Denominator = 1 - (12 + 22 + 4)/100 = 1 - 0.38 = 0.62
      // Expected Suggested Price approx = (62 + FixedFee) / 0.62
      // Fixed fee depends on price range. If price >= 50 and < 79, fixed is 6.75 (or similar logic in code)
      
      expect(Number(result.totalCost)).toBe(62);
      expect(result.recommendedMargin).toBe(22);
      expect(Number(result.suggestedPrice)).toBeGreaterThan(result.totalCost);
      expect(result.marketplaceFee).toBe("12");
    });

    it('should calculate discount and increase correctly when manual price is set', () => {
      // First get automatic price
      const autoResult = calculateMetrics(
        100, 0, 0, 0, 'shopee', 'eletronicos', 'classico', 'without', 'cnpj', 0, false, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        'percent',
        0,
        0,
        0,
        'classico',
        0,
        '',
        '',
        '',
        '',
        false,
        'percent',
        0,
        0,
        'fixed',
        'individual',
        'eletronicos',
        0,
        0,
        0,
        0,
        0,
        'fixed',
        'fixed',
        'fixed',
        'fixed'
      );
      const suggested = autoResult.suggestedPriceRaw;

      // Set manual price lower (Discount)
      const discountPrice = suggested - 10;
      const discountResult = calculateMetrics(
        100, 0, 0, 0, 'shopee', 'eletronicos', 'classico', 'without', 'cnpj', 0, false, 0, 0, 0, 0, discountPrice, 0, 0, 0, 0, 0, 0, 0, 0,
        'percent',
        0,
        0,
        0,
        'classico',
        0,
        '',
        '',
        '',
        '',
        false,
        'percent',
        0,
        0,
        'fixed',
        'individual',
        'eletronicos',
        0,
        0,
        0,
        0,
        0,
        'fixed',
        'fixed',
        'fixed',
        'fixed'
      );

      expect(discountResult.discountApplied).toBeCloseTo(10, 2);
      expect(discountResult.increaseApplied).toBe(0);
      expect(discountResult.discountPercent).toBeCloseTo((-10 / suggested) * 100, 2);

      // Set manual price higher (Increase)
      const increasePrice = suggested + 20;
      const increaseResult = calculateMetrics(
        100, 0, 0, 0, 'shopee', 'eletronicos', 'classico', 'without', 'cnpj', 0, false, 0, 0, 0, 0, increasePrice, 0, 0, 0, 0, 0, 0, 0, 0,
        'percent',
        0,
        0,
        0,
        'classico',
        0,
        '',
        '',
        '',
        '',
        false,
        'percent',
        0,
        0,
        'fixed',
        'individual',
        'eletronicos',
        0,
        0,
        0,
        0,
        0,
        'fixed',
        'fixed',
        'fixed',
        'fixed'
      );

      expect(increaseResult.increaseApplied).toBeCloseTo(20, 2);
      expect(increaseResult.discountApplied).toBe(0);
      expect(increaseResult.discountPercent).toBeCloseTo((20 / suggested) * 100, 2);
    });

    it('should handle competitor markup logic', () => {
      const competitorPrice = 100;
      
      // Markup 1.2x (Positive)
      const positiveResult = calculateMetrics(
        50, 0, 0, 0, 'mercadolivre', 'eletronicos', 'classico', 'without', 'cnpj', 0, false, 0, 0, 0, 0, 0, competitorPrice, 1.2, 0, 0, 0, 0, 0, 0,
        'percent',
        0,
        0,
        0,
        'classico',
        0,
        '',
        '',
        '',
        '',
        false,
        'percent',
        0,
        0,
        'fixed',
        'individual',
        'eletronicos',
        0,
        0,
        0,
        0,
        0,
        'fixed',
        'fixed',
        'fixed',
        'fixed'
      );
      expect(Number(positiveResult.recommendedValue)).toBe(120.00);

      // Markup -1.2x (Negative/Division)
      const negativeResult = calculateMetrics(
        50, 0, 0, 0, 'mercadolivre', 'eletronicos', 'classico', 'without', 'cnpj', 0, false, 0, 0, 0, 0, 0, competitorPrice, -1.2, 0, 0, 0, 0, 0, 0,
        'percent',
        0,
        0,
        0,
        'classico',
        0,
        '',
        '',
        '',
        '',
        false,
        'percent',
        0,
        0,
        'fixed',
        'individual',
        'eletronicos',
        0,
        0,
        0,
        0,
        0,
        'fixed',
        'fixed',
        'fixed',
        'fixed'
      );
      // 100 / 1.2 = 83.33
      expect(Number(negativeResult.recommendedValue)).toBeCloseTo(83.33, 2);
    });

    it('should calculate paid traffic cost correctly (Percent vs Fixed)', () => {
      // Base calculation
      // Price ~100
      const baseResult = calculateMetrics(
        50, 0, 0, 0, 'mercadolivre', 'eletronicos', 'classico', 'without', 'cnpj', 0, false, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        20, // 20% Paid Traffic
        0,
        'percent',
        0,
        0,
        0,
        'classico',
        0,
        '',
        '',
        '',
        '',
        false,
        'percent',
        0,
        0,
        'fixed',
        'individual',
        'eletronicos',
        0,
        0,
        0,
        0,
        0
      );
      
      const price = baseResult.suggestedPriceRaw;
      const expectedTrafficCostPercent = price * 0.20;
      expect(Number(baseResult.paidTrafficCost)).toBeCloseTo(expectedTrafficCostPercent, 2);
      expect(baseResult.paidTrafficType).toBe('percent');

      // Fixed calculation
      const fixedResult = calculateMetrics(
        50, 0, 0, 0, 'mercadolivre', 'eletronicos', 'classico', 'without', 'cnpj', 0, false, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        20, // R$ 20 Fixed
        0,
        'fixed',
        0,
        0,
        0,
        'classico',
        0,
        '',
        '',
        '',
        '',
        false,
        'percent',
        0,
        0,
        'fixed',
        'individual',
        'eletronicos',
        0,
        0,
        0,
        0,
        0
      );
      
      expect(Number(fixedResult.paidTrafficCost)).toBeCloseTo(20, 2);
      expect(fixedResult.paidTrafficType).toBe('fixed');
    });
  });
});
