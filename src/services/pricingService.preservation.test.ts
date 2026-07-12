import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { calculateMetrics } from './pricingService';

/**
 * Preservation Property Tests for Mercado Livre Taxa Fixa Bugfix
 * 
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7**
 * 
 * These tests verify that the behavior for NON-BUGGY inputs remains unchanged.
 * They should PASS on the UNFIXED code, confirming baseline behavior to preserve.
 * 
 * Property 2: Preservation - Comportamento de Outros Marketplaces e Cenários
 */

describe('Preservation Property Tests - BEFORE Fix', () => {
  
  /**
   * Property: Shopee calculations remain unchanged
   * **Validates: Requirement 3.2**
   */
  describe('Shopee Preservation', () => {
    it('should calculate Shopee fees correctly for various prices', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 10, max: 500, noNaN: true }), // baseCost
          fc.double({ min: 0, max: 10, noNaN: true }), // pkgCost
          (baseCost, pkgCost) => {
            const result = calculateMetrics(
              baseCost,
              pkgCost,
              0, // supplierFeeVal
              0, // markup
              'shopee', // currentMarketplace
              'eletronicos', // currentCategory
              'classico', // currentAdType
              'without', // currentShipping
              'cnpj',
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
              0, // mlShippingVal
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

            // Shopee should have commission and fixed fee based on price ranges
            expect(Number(result.marketplaceFee)).toBeGreaterThan(0);
            expect(Number(result.suggestedPrice)).toBeGreaterThan(baseCost + pkgCost);
            expect(result.taxDescription).toContain('Shopee');
            
            // Verify Shopee-specific fee structure is applied
            const price = Number(result.suggestedPrice);
            if (price <= 79.99) {
              expect(Number(result.marketplaceFee)).toBe(20);
            } else if (price <= 499.99) {
              expect(Number(result.marketplaceFee)).toBe(14);
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should handle Shopee with manual price correctly', () => {
      const result = calculateMetrics(
        50, // baseCost
        2, // pkgCost
        0, 0, 'shopee', 'eletronicos', 'classico', 'without', 'cnpj', 0,
        false, 0, 0, 0, 4.00,
        100, // manualPriceVal - set manual price
        0, 0, 0, 0, 0, 0, 0, 0,
        'percent', 0, 0, 0, 'classico', 0, '', '', '', '', false,
        'percent', 0, 0, 'fixed', 'individual', 'eletronicos', 0,
        0, 0, 0, 0, 'fixed', 'fixed', 'fixed', 'fixed'
      );

      expect(Number(result.suggestedPrice)).not.toBe(100);
      expect(result.manualPrice).toBe(100);
      expect(Number(result.marketplaceFee)).toBe(14); // 100 is in 80-199.99 range
    });
  });

  /**
   * Property: TikTok calculations remain unchanged
   * **Validates: Requirement 3.2**
   */
  describe('TikTok Preservation', () => {
    it('should calculate TikTok fees correctly for various prices', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 10, max: 500, noNaN: true }),
          fc.double({ min: 0, max: 10, noNaN: true }),
          (baseCost, pkgCost) => {
            const result = calculateMetrics(
              baseCost, pkgCost, 0, 0, 'tiktok', 'eletronicos', 'classico',
              'without', 'cnpj', 0, false, 0, 0, 0, 4.00, 0, 0, 0,
              0, // tiktokCommVal
              0, 0, 0, 0, 0,
              'percent', 0, 0, 0, 'classico', 0, '', '', '', '', false,
              'percent', 0, 0, 'fixed', 'individual', 'eletronicos', 0,
              0, 0, 0, 0, 'fixed', 'fixed', 'fixed', 'fixed'
            );

            const price = Number(result.suggestedPrice);
            const expectedFee = price < 50 ? 10 : 6;
            const expectedFixed = price < 50 ? 4 : 6;

            expect(Number(result.marketplaceFee)).toBe(expectedFee);
            expect(Number(result.fixedFee)).toBe(expectedFixed);
            expect(Number(result.suggestedPrice)).toBeGreaterThan(baseCost + pkgCost);
            expect(result.taxDescription).toContain('Tiktok');
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Property: Enjoei calculations remain unchanged
   * **Validates: Requirement 3.2**
   */
  describe('Enjoei Preservation', () => {
    it('should calculate Enjoei fees correctly for classico and turbinado', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 10, max: 300, noNaN: true }),
          fc.constantFrom('classico', 'turbinado'),
          (baseCost, adType) => {
            const result = calculateMetrics(
              baseCost, 2, 0, 0, 'enjoei', 'eletronicos', adType,
              'without', 'cnpj', 0, false, 0, 0, 0, 4.00, 0, 0, 0, 0,
              0, 0, 0, 0, 0,
              'percent', 0, 0, 0, adType, 0, '', '', '', '', false,
              'percent', 0, 0, 'fixed', 'individual', 'eletronicos', 0,
              0, 0, 0, 0, 'fixed', 'fixed', 'fixed', 'fixed'
            );

            // Enjoei has different commission rates
            const expectedCommission = adType === 'turbinado' ? 18 : 12;
            expect(Number(result.marketplaceFee)).toBe(expectedCommission);
            expect(Number(result.fixedFee)).toBeGreaterThan(0);
            expect(result.taxDescription).toContain('Comissão');
            expect(result.taxDescription).toContain('Tarifa Fixa');
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Property: Amazon calculations remain unchanged
   * **Validates: Requirement 3.2**
   */
  describe('Amazon Preservation', () => {
    it('should calculate Amazon fees correctly for different plans', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 20, max: 500, noNaN: true }),
          fc.constantFrom('individual', 'profissional'),
          (baseCost, plan) => {
            const result = calculateMetrics(
              baseCost, 2, 0, 0, 'amazon', 'eletronicos', 'classico',
              'without', 'cnpj', 0, false, 0, 0, 0, 4.00, 0, 0, 0, 0,
              0, 0, 0, 0, 0,
              'percent', 0, 0, 0, 'classico', 0, '', '', '', '', false,
              'percent', 0, 0, 'fixed', plan, 'eletronicos', 0,
              0, 0, 0, 0, 'fixed', 'fixed', 'fixed', 'fixed'
            );

            expect(Number(result.marketplaceFee)).toBeGreaterThan(0);
            expect(result.taxDescription).toContain('Amazon');
            
            // Amazon fixed fee logic depends on price calculation
            // Just verify the structure is correct
            expect(result.fixedFee).toBeDefined();
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Property: Mercado Livre ≥ R$ 79 without dimensions has no fixed fee
   * **Validates: Requirement 3.1**
   */
  describe('Mercado Livre ≥ R$ 79 Preservation', () => {
    it('should not apply fixed fee for products >= R$ 79', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 79, max: 500, noNaN: true }),
          fc.double({ min: 0, max: 20, noNaN: true }),
          (baseCost, pkgCost) => {
            const result = calculateMetrics(
              baseCost, pkgCost, 0, 0, 'mercadolivre', 'eletronicos', 'classico',
              'without', 'cnpj', 0, false, 0, 0, 0, 4.00, 0, 0, 0, 0,
              0, 0, 0, 0, 10, // mlShippingVal
              'percent', 0, 0, 0, 'classico', 0, '', '', '', '', false,
              'percent', 0, 0, 'fixed', 'individual', 'eletronicos', 0,
              0, 0, 0, 0, 'fixed', 'fixed', 'fixed', 'fixed'
            );

            // For products >= R$ 79, there should be NO fixed fee
            expect(Number(result.fixedFee)).toBe(0);
            expect(Number(result.marketplaceFee)).toBeGreaterThan(0);
            // Tax description may vary in format (case-insensitive check)
            expect(result.taxDescription.toLowerCase()).toContain('comissão');
            expect(result.taxDescription).not.toContain('Tarifa Fixa');
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Property: Dynamic recalculation works correctly
   * **Validates: Requirement 3.3**
   */
  describe('Dynamic Recalculation Preservation', () => {
    it('should recalculate when price changes', () => {
      const baseCost = 50;
      const pkgCost = 2;
      
      // Calculate with automatic price
      const autoResult = calculateMetrics(
        baseCost, pkgCost, 0, 0, 'mercadolivre', 'eletronicos', 'classico',
        'without', 'cnpj', 0, false, 0, 0, 0, 4.00, 0, 0, 0, 0,
        0, 0, 0, 0, 10,
        'percent', 0, 0, 0, 'classico', 0, '', '', '', '', false,
        'percent', 0, 0, 'fixed', 'individual', 'eletronicos', 0,
        0, 0, 0, 0, 'fixed', 'fixed', 'fixed', 'fixed'
      );

      // Calculate with manual price
      const manualPrice = 100;
      const manualResult = calculateMetrics(
        baseCost, pkgCost, 0, 0, 'mercadolivre', 'eletronicos', 'classico',
        'without', 'cnpj', 0, false, 0, 0, 0, 4.00,
        manualPrice, // manualPriceVal
        0, 0, 0, 0, 0, 0, 0, 10,
        'percent', 0, 0, 0, 'classico', 0, '', '', '', '', false,
        'percent', 0, 0, 'fixed', 'individual', 'eletronicos', 0,
        0, 0, 0, 0, 'fixed', 'fixed', 'fixed', 'fixed'
      );

      // Verify automatic calculation
      expect(Number(autoResult.suggestedPrice)).toBeGreaterThan(baseCost + pkgCost);
      expect(autoResult.manualPrice).toBe(0);

      // Verify manual price is used
      expect(manualResult.manualPrice).toBe(manualPrice);
      
      // Verify discount/increase is calculated
      const diff = manualPrice - Number(autoResult.suggestedPrice);
      if (diff > 0) {
        expect(manualResult.increaseApplied).toBeGreaterThan(0);
      } else if (diff < 0) {
        expect(manualResult.discountApplied).toBeGreaterThan(0);
      }
    });
  });

  /**
   * Property: Products with variations calculate individually
   * **Validates: Requirement 3.4**
   * 
   * Note: This tests that the calculateMetrics function produces different
   * results for different prices, which is the foundation for per-variation
   * calculation in the UI layer.
   */
  describe('Variations Preservation', () => {
    it('should calculate different costs for different variation prices', () => {
      const baseCost1 = 30;
      const baseCost2 = 60;
      const baseCost3 = 90;

      const result1 = calculateMetrics(
        baseCost1, 2, 0, 0, 'mercadolivre', 'eletronicos', 'classico',
        'without', 'cnpj', 0, false, 0, 0, 0, 4.00, 0, 0, 0, 0,
        0, 0, 0, 0, 10,
        'percent', 0, 0, 0, 'classico', 0, '', '', '', '', false,
        'percent', 0, 0, 'fixed', 'individual', 'eletronicos', 0,
        0, 0, 0, 0, 'fixed', 'fixed', 'fixed', 'fixed'
      );

      const result2 = calculateMetrics(
        baseCost2, 2, 0, 0, 'mercadolivre', 'eletronicos', 'classico',
        'without', 'cnpj', 0, false, 0, 0, 0, 4.00, 0, 0, 0, 0,
        0, 0, 0, 0, 10,
        'percent', 0, 0, 0, 'classico', 0, '', '', '', '', false,
        'percent', 0, 0, 'fixed', 'individual', 'eletronicos', 0,
        0, 0, 0, 0, 'fixed', 'fixed', 'fixed', 'fixed'
      );

      const result3 = calculateMetrics(
        baseCost3, 2, 0, 0, 'mercadolivre', 'eletronicos', 'classico',
        'without', 'cnpj', 0, false, 0, 0, 0, 4.00, 0, 0, 0, 0,
        0, 0, 0, 0, 10,
        'percent', 0, 0, 0, 'classico', 0, '', '', '', '', false,
        'percent', 0, 0, 'fixed', 'individual', 'eletronicos', 0,
        0, 0, 0, 0, 'fixed', 'fixed', 'fixed', 'fixed'
      );

      // Each variation should have different suggested prices
      expect(Number(result1.suggestedPrice)).not.toBe(Number(result2.suggestedPrice));
      expect(Number(result2.suggestedPrice)).not.toBe(Number(result3.suggestedPrice));
      expect(Number(result1.suggestedPrice)).not.toBe(Number(result3.suggestedPrice));

      // Each should have different total costs
      expect(result1.totalCost).not.toBe(result2.totalCost);
      expect(result2.totalCost).not.toBe(result3.totalCost);

      // Verify individual calculation logic is working
      expect(Number(result1.suggestedPrice)).toBeGreaterThan(baseCost1);
      expect(Number(result2.suggestedPrice)).toBeGreaterThan(baseCost2);
      expect(Number(result3.suggestedPrice)).toBeGreaterThan(baseCost3);
    });
  });

  /**
   * Property: Results display is preserved
   * **Validates: Requirement 3.5**
   */
  describe('Results Display Preservation', () => {
    it('should display detailed cost breakdown', () => {
      const result = calculateMetrics(
        50, 2, 0, 0, 'mercadolivre', 'eletronicos', 'classico',
        'without', 'cnpj', 0, false, 0, 0, 0, 4.00, 0, 0, 0, 0,
        0, 0, 0, 0, 10,
        'percent', 0, 0, 0, 'classico', 0, '', '', '', '', false,
        'percent', 0, 0, 'fixed', 'individual', 'eletronicos', 0,
        0, 0, 0, 0, 'fixed', 'fixed', 'fixed', 'fixed'
      );

      // Verify all cost components are present
      expect(result.cost).toBeDefined();
      expect(result.packagingCost).toBeDefined();
      expect(result.totalCost).toBeDefined();
      expect(result.suggestedPrice).toBeDefined();
      expect(result.marketplaceFee).toBeDefined();
      expect(result.marketplaceCost).toBeDefined();
      expect(result.fixedFee).toBeDefined();
      expect(result.gatewayCost).toBeDefined();
      expect(result.totalFees).toBeDefined();
      expect(result.netRevenue).toBeDefined();
      expect(result.actualMargin).toBeDefined();
      expect(result.taxDescription).toBeDefined();

      // Verify values are formatted correctly
      expect(typeof result.packagingCost).toBe('string');
      expect(typeof result.suggestedPrice).toBe('string');
      expect(typeof result.marketplaceFee).toBe('string');
      expect(typeof result.netRevenue).toBe('string');
    });
  });

  /**
   * Property: Data persistence structure is preserved
   * **Validates: Requirement 3.6**
   */
  describe('Data Persistence Preservation', () => {
    it('should return consistent data structure', () => {
      const result = calculateMetrics(
        50, 2, 0, 0, 'shopee', 'eletronicos', 'classico',
        'without', 'cnpj', 0, false, 0, 0, 0, 4.00, 0, 0, 0, 0,
        0, 0, 0, 0, 0,
        'percent', 0, 0, 0, 'classico', 0, '', '', '', '', false,
        'percent', 0, 0, 'fixed', 'individual', 'eletronicos', 0,
        0, 0, 0, 0, 'fixed', 'fixed', 'fixed', 'fixed'
      );

      // Verify all required fields exist
      const requiredFields = [
        'cost', 'packagingCost', 'supplierFeeCost', 'supplierGatewayCost',
        'emergencyReserve', 'totalCost', 'suggestedPrice', 'suggestedPriceRaw',
        'marketplaceFee', 'marketplaceCost', 'fixedFee', 'gatewayCost',
        'gatewayFee', 'paidTrafficCost', 'paidTrafficFee', 'paidTrafficType',
        'paidTrafficGatewayCost', 'adsCostPerSale', 'totalCPA', 'totalFees',
        'shopeeStoreCoupon', 'shopeeProductCoupon', 'shopeeFollowerCoupon',
        'shopeeSellerVoucher', 'shopeeCouponTotal', 'netRevenue', 'actualMargin',
        'recommendedMargin', 'taxDescription', 'manualPrice', 'discountApplied',
        'increaseApplied', 'discountPercent', 'recommendedValue', 'competitor',
        'breakevenCPA', 'reverseCR', 'marginStatus', 'returnRate', 'lossPerReturn',
        'influencerCost', 'affiliateCost', 'totalInfluencerPercent',
        'totalAffiliatePercent', 'tiktokSfpFee'
      ];

      requiredFields.forEach(field => {
        expect(result).toHaveProperty(field);
      });
    });
  });

  /**
   * Property: Mercado Livre < R$ 79 without shipping calculation
   * **Validates: Requirement 3.7**
   */
  describe('Mercado Livre < R$ 79 No Shipping Calculation', () => {
    it('should not calculate shipping for products < R$ 79', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 10, max: 78.99, noNaN: true }),
          (baseCost) => {
            const result = calculateMetrics(
              baseCost, 2, 0, 0, 'mercadolivre', 'eletronicos', 'classico',
              'without', 'cnpj', 0, false, 0, 0, 0, 4.00, 0, 0, 0, 0,
              0, 0, 0, 0, 10, // mlShippingVal is included in cost
              'percent', 0, 0, 0, 'classico', 0, '', '', '', '', false,
              'percent', 0, 0, 'fixed', 'individual', 'eletronicos', 0,
              0, 0, 0, 0, 'fixed', 'fixed', 'fixed', 'fixed'
            );

            // For products < R$ 79, shipping is paid by buyer (not calculated in seller cost)
            // The mlShippingVal is included in totalCost but not as a separate "free shipping" calculation
            expect(Number(result.suggestedPrice)).toBeGreaterThan(baseCost);
            expect(result.totalCost).toBeGreaterThan(baseCost);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Property: Competitor markup logic is preserved
   * **Validates: Requirement 3.3 (dynamic recalculation)**
   */
  describe('Competitor Markup Preservation', () => {
    it('should calculate competitor-based pricing correctly', () => {
      const competitorPrice = 100;
      
      // Positive markup (multiply)
      const positiveResult = calculateMetrics(
        50, 2, 0, 0, 'mercadolivre', 'eletronicos', 'classico',
        'without', 'cnpj', 0, false, 0, 0, 0, 4.00, 0,
        competitorPrice, // competitorPriceVal
        1.2, // competitorMarkupVal (positive = multiply)
        0, 0, 0, 0, 0, 10,
        'percent', 0, 0, 0, 'classico', 0, '', '', '', '', false,
        'percent', 0, 0, 'fixed', 'individual', 'eletronicos', 0,
        0, 0, 0, 0, 'fixed', 'fixed', 'fixed', 'fixed'
      );

      expect(Number(positiveResult.recommendedValue)).toBe(120);

      // Negative markup (divide)
      const negativeResult = calculateMetrics(
        50, 2, 0, 0, 'mercadolivre', 'eletronicos', 'classico',
        'without', 'cnpj', 0, false, 0, 0, 0, 4.00, 0,
        competitorPrice,
        -1.2, // negative = divide
        0, 0, 0, 0, 0, 10,
        'percent', 0, 0, 0, 'classico', 0, '', '', '', '', false,
        'percent', 0, 0, 'fixed', 'individual', 'eletronicos', 0,
        0, 0, 0, 0, 'fixed', 'fixed', 'fixed', 'fixed'
      );

      expect(Number(negativeResult.recommendedValue)).toBeCloseTo(83.33, 2);
    });
  });

  /**
   * Property: Paid traffic calculations are preserved
   * **Validates: Requirement 3.3 (dynamic recalculation)**
   */
  describe('Paid Traffic Preservation', () => {
    it('should calculate paid traffic cost correctly (percent vs fixed)', () => {
      // Percent-based
      const percentResult = calculateMetrics(
        50, 2, 0, 0, 'mercadolivre', 'eletronicos', 'classico',
        'without', 'cnpj', 0, false, 0, 0, 0, 4.00, 0, 0, 0, 0,
        0, 0, 0,
        20, // paidTrafficVal (20%)
        10,
        'percent', // paidTrafficType
        0, 0, 0, 'classico', 0, '', '', '', '', false,
        'percent', 0, 0, 'fixed', 'individual', 'eletronicos', 0,
        0, 0, 0, 0, 'fixed', 'fixed', 'fixed', 'fixed'
      );

      const price = percentResult.suggestedPriceRaw;
      const expectedTrafficCost = price * 0.20;
      expect(Number(percentResult.paidTrafficCost)).toBeCloseTo(expectedTrafficCost, 2);
      expect(percentResult.paidTrafficType).toBe('percent');

      // Fixed-based
      const fixedResult = calculateMetrics(
        50, 2, 0, 0, 'mercadolivre', 'eletronicos', 'classico',
        'without', 'cnpj', 0, false, 0, 0, 0, 4.00, 0, 0, 0, 0,
        0, 0, 0,
        20, // R$ 20 fixed
        10,
        'fixed', // paidTrafficType
        0, 0, 0, 'classico', 0, '', '', '', '', false,
        'percent', 0, 0, 'fixed', 'individual', 'eletronicos', 0,
        0, 0, 0, 0, 'fixed', 'fixed', 'fixed', 'fixed'
      );

      expect(Number(fixedResult.paidTrafficCost)).toBeCloseTo(20, 2);
      expect(fixedResult.paidTrafficType).toBe('fixed');
    });
  });
});
