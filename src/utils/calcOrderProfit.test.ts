/**
 * Characterization tests for calcOrderProfit.ts
 * These lock the CURRENT behaviour of the single source of truth for order profit.
 * Used by RevenueReportChart AND dashboardService AND useHeroStats — any regression
 * here means broken financial reports. DO NOT change expected values without a
 * deliberate business decision.
 */
import { describe, it, expect } from 'vitest';
import { calcOrderProfit, type OrderProfitInput } from './calcOrderProfit';

// ─── helpers ─────────────────────────────────────────────────────────────────

/** Minimal order — no marketplace, no products, no fees */
function baseOrder(overrides: Partial<OrderProfitInput> = {}): OrderProfitInput {
  return {
    total_amount: 100,
    products: [{ unit_cost: 20, quantity: 1 }],
    marketplace: 'mercado_livre',
    ...overrides,
  };
}

// ─── Basic profit ─────────────────────────────────────────────────────────────

describe('calcOrderProfit — basic cases', () => {
  it('simple order: revenue 100, cost 20, no fees → profit 80', () => {
    const r = calcOrderProfit(baseOrder());
    expect(r.realProfit).toBe(80);
    expect(r.totalProductCost).toBe(20);
    expect(r.isFreeSample).toBe(false);
  });

  it('zero total_amount → profit equals negative product cost', () => {
    const r = calcOrderProfit(baseOrder({ total_amount: 0 }));
    expect(r.realProfit).toBe(-20);
  });

  it('result is rounded to 2 decimal places', () => {
    const r = calcOrderProfit(baseOrder({ total_amount: 100.005, products: [{ unit_cost: 33.333, quantity: 1 }] }));
    expect(String(r.realProfit)).toMatch(/^-?\d+(\.\d{1,2})?$/);
  });
});

// ─── Commission / marketplace fees ───────────────────────────────────────────

describe('calcOrderProfit — marketplace commission', () => {
  it('applies commission_rate from marketplaceConfig', () => {
    const r = calcOrderProfit(
      baseOrder({ total_amount: 100, products: [{ unit_cost: 10, quantity: 1 }] }),
      { commission_rate: 10 } // 10 % of 100 = 10
    );
    expect(r.subtotalMarketplace).toBe(10);
    expect(r.realProfit).toBe(80); // 100 - 10 (commission) - 10 (cost)
  });

  it('applies fixed_fee from marketplaceConfig', () => {
    const r = calcOrderProfit(
      baseOrder({ total_amount: 100, products: [{ unit_cost: 10, quantity: 1 }] }),
      { commission_rate: 0, fixed_fee: 5 }
    );
    expect(r.subtotalMarketplace).toBe(5);
    expect(r.realProfit).toBe(85);
  });

  it('combines commission_rate + fixed_fee', () => {
    const r = calcOrderProfit(
      baseOrder({ total_amount: 100, products: [{ unit_cost: 10, quantity: 1 }] }),
      { commission_rate: 10, fixed_fee: 2 }
    );
    // commission = 10 % of 100 = 10, fixed = 2 → subtotal = 12
    expect(r.subtotalMarketplace).toBe(12);
    expect(r.realProfit).toBe(78);
  });
});

// ─── Free sample ──────────────────────────────────────────────────────────────

describe('calcOrderProfit — free sample', () => {
  it('is_free_sample=true → profit = -totalProductCost', () => {
    const r = calcOrderProfit(
      baseOrder({ total_amount: 100, is_free_sample: true, products: [{ unit_cost: 20, quantity: 1 }] })
    );
    expect(r.isFreeSample).toBe(true);
    expect(r.realProfit).toBe(-20);
    expect(r.subtotalMarketplace).toBe(0);
  });

  it('is_free_sample as string "true" is handled', () => {
    const r = calcOrderProfit(baseOrder({ is_free_sample: 'true' as unknown as boolean }));
    expect(r.isFreeSample).toBe(true);
    expect(r.realProfit).toBe(-20);
  });
});

// ─── Reembolso / negative profit ─────────────────────────────────────────────

describe('calcOrderProfit — reembolso_value', () => {
  it('reembolso_value=0 overrides precoVendaLiquido to 0', () => {
    const r = calcOrderProfit(
      baseOrder({
        total_amount: 100,
        reembolso_value: 0,
        products: [{ unit_cost: 20, quantity: 1 }],
      })
    );
    // precoVendaLiquidoFinal = 0 → profit = 0 - 20 = -20
    expect(r.precoVendaLiquidoFinal).toBe(0);
    expect(r.realProfit).toBe(-20);
  });

  it('reembolso_value=50 reduces profit accordingly', () => {
    const r = calcOrderProfit(
      baseOrder({
        total_amount: 100,
        reembolso_value: 50,
        products: [{ unit_cost: 20, quantity: 1 }],
      })
    );
    expect(r.precoVendaLiquidoFinal).toBe(50);
    expect(r.realProfit).toBe(30); // 50 - 20
  });

  it('reembolso_value=null is ignored (treated as no override)', () => {
    const r = calcOrderProfit(
      baseOrder({
        total_amount: 100,
        reembolso_value: null,
        products: [{ unit_cost: 20, quantity: 1 }],
      })
    );
    // falls through to normal calculation
    expect(r.realProfit).toBe(80);
  });

  it('reembolso_marketplace_enabled with value overrides net sales price', () => {
    const r = calcOrderProfit(
      baseOrder({
        total_amount: 100,
        reembolso_marketplace_enabled: true,
        reembolso_marketplace_value: 10,
        products: [{ unit_cost: 20, quantity: 1 }],
      })
    );
    expect(r.precoVendaLiquidoFinal).toBe(10);
    expect(r.realProfit).toBe(-10); // 10 - 20
  });

  it('reembolso_fornecedor_enabled reduces product cost and increases profit when higher than product cost', () => {
    const r = calcOrderProfit(
      baseOrder({
        total_amount: 100,
        reembolso_marketplace_enabled: true,
        reembolso_marketplace_value: -9.85,
        reembolso_fornecedor_enabled: true,
        reembolso_fornecedor_value: 94,
        products: [{ unit_cost: 20, quantity: 1 }],
      })
    );
    expect(r.precoVendaLiquidoFinal).toBe(-9.85);
    expect(r.effectiveProductCost).toBe(-74); // 20 - 94 = -74
    expect(r.realProfit).toBe(64.15); // -9.85 - (-74) = +64.15
  });

  it('reembolso_fornecedor_enabled without marketplace refund yields profit = reembolso_fornecedor - product_cost', () => {
    const r = calcOrderProfit(
      baseOrder({
        total_amount: 100,
        reembolso_marketplace_enabled: false,
        reembolso_fornecedor_enabled: true,
        reembolso_fornecedor_value: 26.39,
        products: [{ unit_cost: 28.39, quantity: 1 }],
      })
    );
    expect(r.precoVendaLiquidoFinal).toBe(0);
    expect(r.totalProductCost).toBe(28.39);
    expect(r.realProfit).toBe(-2); // 26.39 - 28.39 = -2.00
  });

  it('manual_product_cost overrides item costs and fees and is used in reembolso_fornecedor', () => {
    const r = calcOrderProfit(
      baseOrder({
        total_amount: 100,
        marketplace: 'TikTok Shop',
        manual_product_cost: 24.90,
        reembolso_fornecedor_enabled: true,
        reembolso_fornecedor_value: 26.39,
        products: [
          {
            unit_cost: 20,
            quantity: 1,
            supplier_fee_value: 6,
            supplier_fee_type: 'percent',
            supplier_gateway_fee_value: 2,
          },
        ],
      })
    );
    expect(r.totalProductCost).toBe(24.90);
    expect(r.realProfit).toBe(1.49); // 26.39 - 24.90 = +1.49
  });
});

// ─── TikTok specifics ────────────────────────────────────────────────────────

describe('calcOrderProfit — TikTok marketplace', () => {
  const tiktokOrder = (overrides: Partial<OrderProfitInput> = {}): OrderProfitInput => ({
    total_amount: 100,
    total_products: 100,
    discount_value: 10,
    marketplace: 'tiktok',
    products: [{ unit_cost: 15, quantity: 1 }],
    ...overrides,
  });

  it('TikTok: SFP fee = 6% of gross price applied', () => {
    const r = calcOrderProfit(tiktokOrder(), { commission_rate: 0, fixed_fee: 0 });
    // sfpFee = 6 % of 100 = 6; discount reembolso = 10; precoVendaLiquido = (100-10) + 10 - 6 = 94
    expect(r.subtotalMarketplace).toBeCloseTo(6, 1);
  });

  it('TikTok: supplier fee 6% applies by default', () => {
    const r = calcOrderProfit(tiktokOrder());
    // totalBaseCost = 15; isDogama = true; supFee = 6% of 15 = 0.9; gateway = 2
    expect(r.totalProductCost).toBeCloseTo(15 + 0.9 + 2, 1);
  });

  it('TikTok: tiktok_reembolso_disabled=true skips discount reembolso', () => {
    const r1 = calcOrderProfit(tiktokOrder({ tiktok_reembolso_disabled: false }), {});
    const r2 = calcOrderProfit(tiktokOrder({ tiktok_reembolso_disabled: true }), {});
    expect(r1.precoVendaLiquidoFinal).toBeGreaterThan(r2.precoVendaLiquidoFinal);
  });

  it('TikTok: tiktok_retorno_liquido overrides net price', () => {
    const r = calcOrderProfit(tiktokOrder({ tiktok_retorno_liquido: 75 }));
    expect(r.precoVendaLiquidoFinal).toBe(75);
  });
});

// ─── Multiple products ────────────────────────────────────────────────────────

describe('calcOrderProfit — multiple products', () => {
  it('sums costs across products', () => {
    const r = calcOrderProfit({
      total_amount: 200,
      marketplace: 'mercado_livre',
      products: [
        { unit_cost: 30, quantity: 2 }, // 60
        { unit_cost: 10, quantity: 1 }, // 10
      ],
    });
    expect(r.totalProductCost).toBe(70);
    expect(r.realProfit).toBe(130);
  });

  it('applies quantity multiplier correctly', () => {
    const r = calcOrderProfit({
      total_amount: 100,
      marketplace: 'mercado_livre',
      products: [{ unit_cost: 5, quantity: 4 }],
    });
    expect(r.totalProductCost).toBe(20);
  });
});

// ─── Affiliate commission ─────────────────────────────────────────────────────

describe('calcOrderProfit — affiliate', () => {
  it('affiliate commission is deducted when cameFromAffiliate=true', () => {
    const r = calcOrderProfit(
      baseOrder({ total_amount: 100, products: [{ unit_cost: 10, quantity: 1 }] }),
      { commission_rate: 0, affiliate_commission_rate: 10 },
      true // cameFromAffiliate
    );
    // affiliate = 10% of 100 = 10
    expect(r.subtotalMarketplace).toBe(10);
    expect(r.realProfit).toBe(80);
  });

  it('affiliate commission is 0 when cameFromAffiliate=false', () => {
    const r = calcOrderProfit(
      baseOrder({ total_amount: 100, products: [{ unit_cost: 10, quantity: 1 }] }),
      { commission_rate: 0, affiliate_commission_rate: 10 },
      false
    );
    expect(r.subtotalMarketplace).toBe(0);
    expect(r.realProfit).toBe(90);
  });
});
