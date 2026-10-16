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
      // ML Fee (Classico Eletronicos) = 13%
      // Gateway Fee = 4%
      // Denominator = 1 - (13 + 22 + 4)/100 = 1 - 0.39 = 0.61
      // Expected Suggested Price approx = (62 + FixedFee) / 0.61
      // Fixed fee depends on price range. If price >= 50 and < 79, fixed is 6.75 (or similar logic in code)
      
      expect(Number(result.totalCost)).toBe(62);
      expect(result.recommendedMargin).toBe(22);
      expect(Number(result.suggestedPrice)).toBeGreaterThan(result.totalCost);
      expect(result.marketplaceFee).toBe("13");
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

    it('should recalculate net revenue and margin when supplier fee percent changes', () => {
      const result3Percent = calculateMetrics(
        12.00, // baseCost
        0,     // pkgCost
        3,     // supplierFeeVal (3%)
        0,     // markup
        'mercadolivre',
        'eletronicos',
        'classico',
        'without',
        'cnpj',
        0,
        false, 0, 0, 0, 0,
        32.90, // manualPriceVal
        0, 0, 0, 0, 0, 0, 0, 0, 'percent', 0, 0, 0, 'classico', 0, '', '', '', '', false,
        'percent', // supplierFeeType
        0,
        2.00, // supplierGatewayFixedFee
        'fixed' // supplierGatewayFeeType
      );

      const result6Percent = calculateMetrics(
        12.00, // baseCost
        0,     // pkgCost
        6,     // supplierFeeVal (6%)
        0,     // markup
        'mercadolivre',
        'eletronicos',
        'classico',
        'without',
        'cnpj',
        0,
        false, 0, 0, 0, 0,
        32.90, // manualPriceVal
        0, 0, 0, 0, 0, 0, 0, 0, 'percent', 0, 0, 0, 'classico', 0, '', '', '', '', false,
        'percent', // supplierFeeType
        0,
        2.00, // supplierGatewayFixedFee
        'fixed' // supplierGatewayFeeType
      );

      expect(result3Percent.supplierFeeCost).toBe('0.36');
      expect(result6Percent.supplierFeeCost).toBe('0.72');
      expect(Number(result3Percent.netRevenue)).toBeCloseTo(7.76, 2);
      expect(Number(result6Percent.netRevenue)).toBeCloseTo(7.40, 2);
      expect(Number(result3Percent.netRevenue) - Number(result6Percent.netRevenue)).toBeCloseTo(0.36, 2);
      expect(Number(result3Percent.actualMargin)).toBeGreaterThan(Number(result6Percent.actualMargin));
    });

    it('should recalculate net revenue and margin when TikTok commission changes from 6% to 16%', () => {
      const result6Percent = calculateMetrics(
        34.00, // baseCost
        0,     // pkgCost
        3,     // supplierFeeVal (3%)
        0,     // markup
        'tiktok',
        'eletronicos',
        'classico',
        'without',
        'cnpj',
        0,
        false, 0, 0, 0, 0,
        69.90, // manualPriceVal
        0, 0,
        6,     // tiktokCommVal = 6%
        0, 0, 0, 0, 0, 'percent', 0, 0, 0, 'classico', 0, '', '', '', '', false,
        'percent',
        0,
        2.00,
        'fixed',
        'individual',
        'eletronicos',
        0, 0, 0, 0, 0, 'fixed', 'fixed', 'fixed', 'fixed', 0, [],
        [{ id: '1', name: 'Afiliado', percentage: '10.5' }]
      );

      const result16Percent = calculateMetrics(
        34.00, // baseCost
        0,     // pkgCost
        3,     // supplierFeeVal (3%)
        0,     // markup
        'tiktok',
        'eletronicos',
        'classico',
        'without',
        'cnpj',
        0,
        false, 0, 0, 0, 0,
        69.90, // manualPriceVal
        0, 0,
        16,    // tiktokCommVal = 16%
        0, 0, 0, 0, 0, 'percent', 0, 0, 0, 'classico', 0, '', '', '', '', false,
        'percent',
        0,
        2.00,
        'fixed',
        'individual',
        'eletronicos',
        0, 0, 0, 0, 0, 'fixed', 'fixed', 'fixed', 'fixed', 0, [],
        [{ id: '1', name: 'Afiliado', percentage: '10.5' }]
      );

      expect(result6Percent.marketplaceFee).toBe('6');
      expect(result16Percent.marketplaceFee).toBe('16');
      expect(Number(result6Percent.marketplaceCost)).toBeCloseTo(4.19, 2);
      expect(Number(result16Percent.marketplaceCost)).toBeCloseTo(11.18, 2);
      expect(Number(result6Percent.netRevenue)).toBeCloseTo(15.35, 2);
      expect(Number(result16Percent.netRevenue)).toBeCloseTo(8.36, 2);
      expect(Number(result6Percent.netRevenue) - Number(result16Percent.netRevenue)).toBeCloseTo(6.99, 2);
      expect(Number(result16Percent.actualMargin)).toBeLessThan(Number(result6Percent.actualMargin));
    });

    it('should set marginStatus to negative when net revenue is below supplier cost or below marketplace costs', () => {
      // Scenario from user: supplier cost = 10.61, price = 29.90, netRevenue = 8.51 (which is < 10.61)
      const belowSupplierCostResult = calculateMetrics(
        10.61, // baseCost
        0,     // pkgCost
        0,     // supplierFeePercent
        0,     // markup
        'tiktok',
        'eletronicos',
        'classico',
        'without',
        'cnpj',
        0,
        false, 0, 0, 0, 0,
        29.90, // manualPriceVal
        0, 0,
        10,    // tiktokCommVal = 10%
        0, 0, 0, 0, 0, 'percent', 0, 0, 0, 'classico', 0, '', '', '', '', false,
        'percent',
        0,
        2.00,  // supplierGatewayCost = 2.00
        'fixed',
        'individual',
        'eletronicos',
        0, 0, 0, 0, 0, 'fixed', 'fixed', 'fixed', 'fixed', 0, [], []
      );

      // net revenue will be ~ R$ 10.30 or below supplier cost depending on other fees
      // If baseCost > netRevenue, marginStatus must be negative
      // Let's create an explicit scenario where netRevenue < baseCost:
      // Base cost 20.00, price 30.00, fees ~ 11.00 -> netRevenue = 30 - 20 - 11 = -1 or +3 < 20
      const belowSupplierCostCase = calculateMetrics(
        20.00, // baseCost = 20
        0, 0, 0,
        'tiktok', 'eletronicos', 'classico', 'without', 'cnpj', 0, false, 0, 0, 0, 0,
        35.00, // manualPriceVal = 35 -> 10% = 3.50 + 4.00 fixed = 7.50 -> net = 35 - 20 - 7.50 = 7.50 (< 20.00)
        0, 0,
        10, 0, 0, 0, 0, 0, 'percent', 0, 0, 0, 'classico', 0, '', '', '', '', false,
        'percent', 0, 0, 'fixed', 'individual', 'eletronicos', 0, 0, 0, 0, 0, 'fixed', 'fixed', 'fixed', 'fixed', 0, [], []
      );

      expect(Number(belowSupplierCostCase.netRevenue)).toBeLessThan(20.00);
      expect(Number(belowSupplierCostCase.netRevenue)).toBeGreaterThan(0); // net is positive, but less than cost
      expect(belowSupplierCostCase.marginStatus).toBe('negative');

      // Scenario where net revenue is above supplier cost but below marketplace costs:
      // Base cost = 4.00, Price = 20.00, Marketplace fees = 10% (2.00) + 4.00 fixed = 6.00 total marketplace costs.
      // With paid traffic = 5.00 fixed, Net = 20 - 4 - 6 - 5 = 5.00.
      // 5.00 is > baseCost (4.00), but 5.00 is < totalMarketplaceCosts (6.00).
      const belowMktCostsCase = calculateMetrics(
        4.00,  // baseCost = 4.00
        0, 0, 0,
        'tiktok', 'eletronicos', 'classico', 'without', 'cnpj', 0, false, 0, 0, 0, 0,
        20.00, // manualPriceVal = 20.00 -> mkt fees: 2.00 + 4.00 = 6.00
        0, 0,
        10,    // tiktokCommVal = 10%
        0, 0, 0,
        5.00,  // paidTrafficVal = 5.00
        0,
        'fixed' // paidTrafficType = fixed
      );

      expect(Number(belowMktCostsCase.netRevenue)).toBeGreaterThan(4.00); // netRevenue > baseCost
      const totalMktCosts = Number(belowMktCostsCase.marketplaceCost) + Number(belowMktCostsCase.fixedFee);
      expect(Number(belowMktCostsCase.netRevenue)).toBeLessThan(totalMktCosts); // netRevenue < marketplace costs
      expect(belowMktCostsCase.marginStatus).toBe('negative');
      expect(belowMktCostsCase.isLossCondition).toBe(true);
      expect(Number(belowMktCostsCase.lossAmount)).toBeLessThan(0);
    });

    it('should calculate prejuizo = lucro liquido - (taxas fornecedor + taxas marketplace) for user TikTok Shop scenario', () => {
      // User scenario:
      // Selling price: 29.90
      // Supplier cost: 10.61
      // Supplier fee: 3% (0.32)
      // Supplier gateway: 2.00 fixed
      // TikTok commission: 16% (4.78)
      // Fixed fee: 4.00
      const userCase = calculateMetrics(
        10.61, // baseCost
        0,     // pkgCost
        3,     // supplierFeeVal (3%)
        0,     // markup
        'tiktok',
        'eletronicos',
        'classico',
        'without',
        'cnpj',
        0,
        false, 0, 0, 0, 0,
        29.90, // manualPriceVal
        0, 0,
        16,    // tiktokCommVal = 16%
        0, 0, 0, 0, 0, 'percent', 0, 0, 0, 'classico', 0, '', '', '', '', false,
        'percent',
        0,
        2.00,  // supplierGatewayCost = 2.00 fixed
        'fixed',
        'individual',
        'eletronicos',
        0, 0, 0, 0, 0, 'fixed', 'fixed', 'fixed', 'fixed', 0, [], []
      );

      // Verify net revenue is ~ 8.19
      expect(Number(userCase.netRevenue)).toBeCloseTo(8.19, 1);
      // Supplier fees = 0.32 + 2.00 = 2.32
      const supFees = Number(userCase.supplierFeeCost) + Number(userCase.supplierGatewayCost);
      expect(supFees).toBeCloseTo(2.32, 2);
      // Marketplace fees = 4.78 + 4.00 = 8.78
      const mktFees = Number(userCase.marketplaceCost) + Number(userCase.fixedFee);
      expect(mktFees).toBeCloseTo(8.78, 2);
      // Total operational fees = 11.10
      const totalOpFees = supFees + mktFees;
      expect(totalOpFees).toBeCloseTo(11.10, 2);
      expect(Number(userCase.totalOperationalFees)).toBeCloseTo(11.10, 2);

      // prejuizo = lucro liquido - (taxas fornecedor + taxas de marketplace)
      // 8.19 - 11.10 = -2.91
      expect(userCase.isLossCondition).toBe(true);
      expect(userCase.marginStatus).toBe('negative');
      expect(Number(userCase.lossAmount)).toBeCloseTo(-2.91, 1);
      // lossMargin = (-2.91 / 29.90) * 100 = -9.7%
      expect(Number(userCase.lossMargin)).toBeCloseTo(-9.7, 1);
    });
  });
});



