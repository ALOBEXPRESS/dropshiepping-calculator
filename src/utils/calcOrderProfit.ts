/**
 * Shared order profit calculation — single source of truth.
 * Used by RevenueReportChart and useHeroStats to guarantee identical results.
 */

export interface OrderProfitInput {
  order_id?: string;
  total_amount?: number | string;
  total_products?: number | string;
  base_value?: number | string;
  discount_value?: number | string;
  shipping_cost?: number | string;
  other_expenses?: number | string;
  marketplace_commission?: number | string;
  commission_rate?: number | string;
  marketplace_fixed_fee?: number | string;
  fixed_fee?: number | string;
  tiktok_sfp_enabled?: boolean | string | null;
  tiktok_reembolso_disabled?: boolean;
  tiktok_retorno_liquido?: number | null;
  is_free_sample?: boolean | string;
  marketplace?: string;
  products?: {
    quantity?: number | string;
    unit_cost?: number | string;
    supplier_fee_value?: string | number;
    supplier_fee_type?: string;
    supplier_gateway_fee_value?: string | number;
    supplier_gateway_fee_type?: string;
  }[];
}

export interface MarketplaceConfig {
  commission_rate?: number | string;
  fixed_fee?: number | string;
  affiliate_commission_rate?: number | string;
}

export interface OrderProfitResult {
  realProfit: number;
  isFreeSample: boolean;
  totalProductCost: number;
  precoVendaLiquidoFinal: number;
  subtotalMarketplace: number;
}

export function calcOrderProfit(
  order: OrderProfitInput,
  marketplaceConfig?: MarketplaceConfig,
  /** true = order came from affiliate link */
  cameFromAffiliate?: boolean
): OrderProfitResult {
  const totalAmount = Number(order.total_amount ?? 0);
  const isFreeSample =
    order.is_free_sample === true || String(order.is_free_sample ?? '') === 'true';
  const products = order.products ?? [];
  const isTikTok = (order.marketplace ?? '').toLowerCase().includes('tiktok');

  // ── Product cost ──────────────────────────────────────────────────────────
  const totalBaseCost = products.reduce((sum, p) => {
    return sum + Number(p.unit_cost ?? 0) * Number(p.quantity ?? 1);
  }, 0);

  const supFeeProduct = products.reduce(
    (best, p) =>
      Number(p.supplier_fee_value ?? 0) > Number(best?.supplier_fee_value ?? 0) ? p : best,
    products[0]
  );

  const supFeeVal = Number(supFeeProduct?.supplier_fee_value ?? 0);
  const supFeeType = supFeeProduct?.supplier_fee_type ?? 'percent';
  const productGatewayFee = Number(supFeeProduct?.supplier_gateway_fee_value ?? 2);

  const isDogama = isTikTok || supFeeVal > 0;
  const DEFAULT_SUPPLIER_FEE_PERCENT = 6;
  const effectiveSupFeePercent = isDogama
    ? supFeeType === 'percent' && supFeeVal > 0
      ? supFeeVal
      : DEFAULT_SUPPLIER_FEE_PERCENT
    : 0;
  const orderSupplierFee = isDogama ? (totalBaseCost * effectiveSupFeePercent) / 100 : 0;
  const orderGatewayFee = isDogama ? productGatewayFee : 0;
  const totalProductCost = totalBaseCost + orderSupplierFee + orderGatewayFee;

  // ── Sale prices ───────────────────────────────────────────────────────────
  const totalProductsValue = Number(order.total_products ?? totalAmount);
  const baseValue = Number(order.base_value ?? 0);
  const activeDiscount = Number(order.discount_value ?? 0);

  const precoVendaBruto = isTikTok
    ? totalProductsValue > 0
      ? totalProductsValue
      : totalAmount
    : totalAmount;

  const precoVendaPagoCliente = isTikTok
    ? precoVendaBruto - activeDiscount
    : baseValue > 0
    ? baseValue
    : totalAmount;

  // ── Marketplace fees ──────────────────────────────────────────────────────
  const fixedFee = Number(
    marketplaceConfig?.fixed_fee ?? order.marketplace_fixed_fee ?? order.fixed_fee ?? 0
  );
  const commissionRate = Number(
    marketplaceConfig?.commission_rate ?? order.commission_rate ?? 0
  );
  const affiliateRate = Number(marketplaceConfig?.affiliate_commission_rate ?? 0);

  const commissionBase = precoVendaBruto;

  const affiliateCommission =
    isFreeSample || !cameFromAffiliate || affiliateRate <= 0
      ? 0
      : (commissionBase * affiliateRate) / 100;

  // SFP: TikTok always enables unless explicitly false on the order
  const sfpEnabled =
    !isFreeSample &&
    (order.tiktok_sfp_enabled === true ||
      String(order.tiktok_sfp_enabled ?? '') === 'true' ||
      isTikTok);
  const sfpFee = sfpEnabled ? precoVendaBruto * 0.06 : 0;

  const commissionPercent = isFreeSample
    ? 0
    : commissionRate > 0
    ? (commissionBase * commissionRate) / 100
    : Math.max(0, Number(order.marketplace_commission ?? 0) - fixedFee);

  const rawShipping = Number(order.shipping_cost ?? 0);
  const shipping = sfpEnabled ? 0 : rawShipping;
  const other = Number(order.other_expenses ?? 0);

  const subtotalMarketplace = isFreeSample
    ? 0
    : commissionPercent + fixedFee + sfpFee + shipping + other + affiliateCommission;

  // ── TikTok specifics ──────────────────────────────────────────────────────
  const reembolsoDisabled = order.tiktok_reembolso_disabled === true;
  const tiktokReembolso = isTikTok && !reembolsoDisabled ? activeDiscount : 0;

  const retornoLiquido = Number(order.tiktok_retorno_liquido ?? 0);
  const hasRetornoLiquido = isTikTok && retornoLiquido > 0;

  // ── Net price ─────────────────────────────────────────────────────────────
  const precoVendaLiquidoFinal = hasRetornoLiquido
    ? retornoLiquido
    : isTikTok
    ? precoVendaPagoCliente + tiktokReembolso - subtotalMarketplace
    : precoVendaPagoCliente - subtotalMarketplace - activeDiscount;

  // ── Profit ────────────────────────────────────────────────────────────────
  const realProfitRaw = isFreeSample
    ? -totalProductCost
    : precoVendaLiquidoFinal - totalProductCost;

  return {
    realProfit: Math.round(realProfitRaw * 100) / 100,
    isFreeSample,
    totalProductCost: Math.round(totalProductCost * 100) / 100,
    precoVendaLiquidoFinal: Math.round(precoVendaLiquidoFinal * 100) / 100,
    subtotalMarketplace: Math.round(subtotalMarketplace * 100) / 100,
  };
}
