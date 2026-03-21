import type { MercadoLivreTaxes, ShopeeCategory, CalculationResult, AiModel, KiePlan, Influencer, Affiliate } from '../types/calculator';
import { amazonCategories } from './amazonCategories';
import { calculateProfitFromPrice, calculateSellingPrice, type MercadoLivreParams, type CalculationResult as MLCalculationResult } from './calculators/mercadolivre';

// Sum affiliate commissions once per marketplace (dedup by marketplaceName, fallback by rate value)
const calcTotalAffiliatePercent = (affiliates: Affiliate[]): number => {
  if (affiliates.length === 0) return 0;
  const seen = new Set<string>();
  let total = 0;
  for (const a of affiliates) {
    const key = a.marketplaceName ?? a.percentage?.replace(',', '.') ?? '0';
    if (!seen.has(key)) {
      seen.add(key);
      total += parseFloat(a.percentage?.replace(',', '.') || '0');
    }
  }
  return total;
};

export const shopeeCategories: Record<string, ShopeeCategory> = {
  eletronicos: { name: 'Eletrônicos', avgCPC: 0.45, avgCR: 1.2 },
  moda: { name: 'Moda e Acessórios', avgCPC: 0.35, avgCR: 2.5 },
  casa: { name: 'Casa e Decoração', avgCPC: 0.40, avgCR: 1.8 },
  beleza: { name: 'Beleza e Cuidados', avgCPC: 0.38, avgCR: 2.2 },
  celulares: { name: 'Celulares e Acessórios', avgCPC: 0.55, avgCR: 1.0 },
  informatica: { name: 'Informática', avgCPC: 0.50, avgCR: 1.1 },
  esportes: { name: 'Esportes e Lazer', avgCPC: 0.42, avgCR: 1.5 },
  brinquedos: { name: 'Brinquedos', avgCPC: 0.30, avgCR: 2.0 },
  papelaria: { name: 'Papelaria', avgCPC: 0.25, avgCR: 2.8 },
  automotivo: { name: 'Automotivo', avgCPC: 0.48, avgCR: 1.3 }
};

export const mercadoLivreTaxes: MercadoLivreTaxes = {
  gratis: {
    eletronicos: { rate: 0, name: 'Eletrônicos' },
    celulares: { rate: 0, name: 'Celulares e Acessórios' },
    informatica: { rate: 0, name: 'Informática' },
    moda: { rate: 0, name: 'Moda e Acessórios' },
    calcados: { rate: 0, name: 'Calçados' },
    relogios: { rate: 0, name: 'Relógios' },
    casa: { rate: 0, name: 'Casa e Decoração' },
    moveis: { rate: 0, name: 'Móveis' },
    beleza: { rate: 0, name: 'Beleza e Cuidado Pessoal' },
    esportes: { rate: 0, name: 'Esportes e Fitness' },
    brinquedos: { rate: 0, name: 'Brinquedos' },
    ferramentas: { rate: 0, name: 'Ferramentas' },
    pet: { rate: 0, name: 'Pet Shop' },
    livros: { rate: 0, name: 'Livros' },
    automotivo: { rate: 0, name: 'Automotivo' }
  },
  classico: {
    eletronicos: { rate: 12, name: 'Eletrônicos' },
    celulares: { rate: 12, name: 'Celulares e Acessórios' },
    informatica: { rate: 12, name: 'Informática' },
    moda: { rate: 16, name: 'Moda e Acessórios' },
    calcados: { rate: 16, name: 'Calçados' },
    relogios: { rate: 16, name: 'Relógios' },
    casa: { rate: 13, name: 'Casa e Decoração' },
    moveis: { rate: 13, name: 'Móveis' },
    beleza: { rate: 14, name: 'Beleza e Cuidado Pessoal' },
    esportes: { rate: 14, name: 'Esportes e Fitness' },
    brinquedos: { rate: 14, name: 'Brinquedos' },
    ferramentas: { rate: 13, name: 'Ferramentas' },
    pet: { rate: 14, name: 'Pet Shop' },
    livros: { rate: 12, name: 'Livros' },
    automotivo: { rate: 13, name: 'Automotivo' }
  },
  premium: {
    eletronicos: { rate: 17, name: 'Eletrônicos' },
    celulares: { rate: 17, name: 'Celulares e Acessórios' },
    informatica: { rate: 17, name: 'Informática' },
    moda: { rate: 19, name: 'Moda e Acessórios' },
    calcados: { rate: 19, name: 'Calçados' },
    relogios: { rate: 19, name: 'Relógios' },
    casa: { rate: 18, name: 'Casa e Decoração' },
    moveis: { rate: 18, name: 'Móveis' },
    beleza: { rate: 19, name: 'Beleza e Cuidado Pessoal' },
    esportes: { rate: 19, name: 'Esportes e Fitness' },
    brinquedos: { rate: 19, name: 'Brinquedos' },
    ferramentas: { rate: 18, name: 'Ferramentas' },
    pet: { rate: 19, name: 'Pet Shop' },
    livros: { rate: 17, name: 'Livros' },
    automotivo: { rate: 18, name: 'Automotivo' }
  }
};

export const getRecommendedMargin = (price: number) => {
  if (price <= 30) return 30;
  if (price <= 50) return 25;
  if (price <= 80) return 22;
  if (price <= 150) return 19;
  return 16;
};

  const calculateGatewayCost = (
    amount: number,
    feePercent: number,
    fixedFee: number,
    bank: string,
    method: string
  ) => {
    if (bank === 'picpay' && method === 'credit') {
      const percentCost = amount * (feePercent / 100);
      return Math.max(fixedFee, percentCost);
    }
    if (bank === 'picpay' && method === 'pix') {
      return amount * (feePercent / 100);
    }
    return (amount * (feePercent / 100)) + fixedFee;
  };

export const AI_MODELS: Record<string, AiModel> = {
    'sora_2_pro': { name: 'Sora 2 Pro', costPerSec: 0.75 },
    'sora_2': { name: 'Sora 2', costPerSec: 0.15 },
    'veo_3_fast': { name: 'Veo 3 (Fast)', costPerSec: 4.00 },
    'veo_3_quality': { name: 'Veo 3 (Quality)', costPerSec: 16.67 },
    'kling_ai_2_6': { name: 'Kling AI 2.6', costPerSec: 0.28 },
    'veo_3_1': { name: 'Veo 3.1', costPerSec: 60.00 },
    'hailou_2_3': { name: 'Hailou 2.3', costPerSec: 0.15 },
    'seedance_1_0_fast': { name: 'Seedance 1.0 (Fast)', costPerSec: 0.08 },
};

export const KIE_PLANS: Record<string, KiePlan> = {
    '5': { name: 'Starter ($5)', price: 5, credits: 1000 },
    '50': { name: 'Pro ($50)', price: 50, credits: 10000 },
    '500': { name: 'Business ($500)', price: 500, credits: 105000 },
};

export const calculateMetrics = (
    baseCost: number, 
    pkgCost: number,
    supplierFeeVal: number,
    markup: number, 
    currentMarketplace: string,
    currentCategory: string,
    currentAdType: string,
    currentShipping: string,
    currentShopeeSellerType: 'cpf' | 'cnpj' = 'cnpj',
    currentExtraCommission: number,
    currentAds: boolean,
    currentCpc: number,
    currentDailyBudget: number,
    currentSales: number,
    gatewayFeeVal: number,
    manualPriceVal: number,
    competitorPriceVal: number,
    competitorMarkupVal: number,
    tiktokCommVal: number,
    wpShippingVal: number,
    emergencyReserveVal: number,
    returnRateVal: number,
    paidTrafficVal: number,
    mlShippingVal: number,
    paidTrafficType: 'percent' | 'fixed' = 'percent',
    gatewayFixedFeeVal: number = 0,
    paidTrafficGatewayFeePercent: number = 0,
    paidTrafficGatewayFixedFee: number = 0,
    enjoeiAdType: string = 'classico',
    enjoeiInactivityMonths: number = 0,
    gatewayBank: string = '',
    gatewayMethod: string = '',
    paidTrafficGatewayBank: string = '',
    paidTrafficGatewayMethod: string = '',
    meliPlus: boolean = false,
    supplierFeeType: 'percent' | 'fixed' = 'percent',
    supplierGatewayFeePercent: number = 0,
    supplierGatewayFixedFee: number = 0,
    supplierGatewayFeeType: 'percent' | 'fixed' = 'fixed',
    amazonPlan: 'individual' | 'profissional' = 'individual',
    amazonCategory: string = 'eletronicos',
    customMarketplaceFee: number = 0,
    shopeeStoreCoupon: number = 0,
    shopeeProductCoupon: number = 0,
    shopeeFollowerCoupon: number = 0,
    shopeeSellerVoucher: number = 0,
    shopeeStoreCouponType: 'fixed' | 'percent' = 'fixed',
    shopeeProductCouponType: 'fixed' | 'percent' = 'fixed',
    shopeeFollowerCouponType: 'fixed' | 'percent' = 'fixed',
    shopeeSellerVoucherType: 'fixed' | 'percent' = 'fixed',
    currentConversionRate: number = 0,
    influencers: Influencer[] = [],
    affiliates: Affiliate[] = []
): CalculationResult => {
  // Calculate supplier fee (if fixed, add to cost. If percent, it depends on selling price - handled later)
  const supplierFeeCostFixed = supplierFeeType === 'fixed' ? supplierFeeVal : 0;
  const supplierFeeRate = supplierFeeType === 'percent' ? supplierFeeVal : 0;
  
  // Calculate supplier gateway fee
  const supplierGatewayCost = supplierGatewayFeeType === 'fixed'
    ? supplierGatewayFixedFee
    : baseCost * (supplierGatewayFeePercent / 100);
  
  const marketplaceShippingCost = currentMarketplace === 'mercadolivre'
    ? mlShippingVal
    : ['wordpress', 'tiktok', 'enjoei', 'amazon', 'shein'].includes(currentMarketplace)
      ? wpShippingVal
      : 0;
  const totalCost = baseCost + supplierFeeCostFixed + supplierGatewayCost + pkgCost + marketplaceShippingCost;
  const resolveCouponValue = (value: number, type: 'fixed' | 'percent', price: number) => {
    if (currentMarketplace !== 'shopee') return 0;
    if (type === 'percent') return price * (value / 100);
    return value;
  };
  const resolveShopeeCoupons = (sellingPrice: number, costPrice: number) => {
    const shopeeStoreCouponValue = resolveCouponValue(shopeeStoreCoupon, shopeeStoreCouponType, sellingPrice);
    const shopeeProductCouponValue = resolveCouponValue(shopeeProductCoupon, shopeeProductCouponType, costPrice);
    const shopeeFollowerCouponValue = resolveCouponValue(shopeeFollowerCoupon, shopeeFollowerCouponType, sellingPrice);
    const shopeeSellerVoucherValue = resolveCouponValue(shopeeSellerVoucher, shopeeSellerVoucherType, sellingPrice);
    const shopeeCouponTotal = shopeeStoreCouponValue + shopeeProductCouponValue + shopeeFollowerCouponValue + shopeeSellerVoucherValue;
    return {
      shopeeStoreCouponValue,
      shopeeProductCouponValue,
      shopeeFollowerCouponValue,
      shopeeSellerVoucherValue,
      shopeeCouponTotal
    };
  };

  // Enjoei Logic
  if (currentMarketplace === 'enjoei') {
      const commission = enjoeiAdType === 'turbinado' ? 18 : 12;
      const marketplaceFeeRate = commission;
      const recommendedMargin = getRecommendedMargin(totalCost);
      const effectiveMarkup = markup; // Use the passed markup

      const getEnjoeiFixed = (price: number, type: string) => {
          if (type === 'turbinado') {
              if (price <= 15) return 3.50;
              if (price <= 30) return 7.50;
              if (price <= 50) return 8.50;
              if (price <= 70) return 10.50;
              if (price <= 100) return 12.50;
              if (price <= 150) return 16.50;
              if (price <= 300) return 27.50;
              if (price <= 500) return 45.00;
              return 50.00;
          } else {
              // classico
              if (price <= 15) return 2.50;
              if (price <= 30) return 6.00;
              if (price <= 50) return 6.50;
              if (price <= 70) return 8.00;
              if (price <= 100) return 10.00;
              if (price <= 150) return 12.50;
              if (price <= 300) return 21.50;
              if (price <= 500) return 35.00;
              return 40.00;
          }
      };

      // Iterative calculation for Suggested Price
      let suggestedPrice = 0;
      let calculatedFixedFee = 0;

      // Initial guess (assuming a middle tier fixed fee)
      const tempFixed = 12.50; 
      
      const calcPrice = (c: number, m: number, feeRate: number, fixed: number, gateway: number) => {
          // P = (Cost + Fixed) / (1 - (Fee% + Margin% + Gateway%)/100)
          // If markup is used as multiplier: P = Cost * Markup. But usually we want to preserve margin logic if markup is 0.
          // The current system uses 'markup' as a multiplier if != 0, else calculates based on recommendedMargin.
          // Let's follow the pattern.
          if (m !== 0) {
              if (m > 0) return c * m;
              return c / Math.abs(m);
          }
          const denom = 1 - (feeRate + recommendedMargin + gateway) / 100;
          return denom > 0 ? (c + fixed + baseCost * (supplierFeeRate / 100)) / denom : (c + fixed + baseCost * (supplierFeeRate / 100)) * 2; 
      };

      // 1. First Pass
      suggestedPrice = calcPrice(totalCost, effectiveMarkup, marketplaceFeeRate, tempFixed + gatewayFixedFeeVal, gatewayFeeVal);
      
      // 2. Refine Fixed Fee
      calculatedFixedFee = getEnjoeiFixed(suggestedPrice, enjoeiAdType);
      
      // 3. Second Pass
      suggestedPrice = calcPrice(totalCost, effectiveMarkup, marketplaceFeeRate, calculatedFixedFee + gatewayFixedFeeVal, gatewayFeeVal);
      
      // 4. Final Check (Iterate once more for stability)
      calculatedFixedFee = getEnjoeiFixed(suggestedPrice, enjoeiAdType);
      suggestedPrice = calcPrice(totalCost, effectiveMarkup, marketplaceFeeRate, calculatedFixedFee + gatewayFixedFeeVal, gatewayFeeVal);
      
      // Use Manual Price if set
      const effectiveSellingPrice = manualPriceVal > 0 ? manualPriceVal : suggestedPrice;
      const finalFixedFee = getEnjoeiFixed(effectiveSellingPrice, enjoeiAdType);
      const {
        shopeeStoreCouponValue,
        shopeeProductCouponValue,
        shopeeFollowerCouponValue,
        shopeeSellerVoucherValue,
        shopeeCouponTotal
      } = resolveShopeeCoupons(effectiveSellingPrice, baseCost);
      
      // Inactivity Fee (add to fixed costs if >= 2 months)
      const inactivityFee = enjoeiInactivityMonths >= 2 ? (11 * enjoeiInactivityMonths) : 0;
      
      const totalFixedFee = finalFixedFee + inactivityFee;

      const commissionVal = effectiveSellingPrice * (marketplaceFeeRate / 100);
      const gatewayCost = calculateGatewayCost(effectiveSellingPrice, gatewayFeeVal, gatewayFixedFeeVal, gatewayBank, gatewayMethod);
      
      const paidTrafficCost = paidTrafficType === 'fixed' 
          ? paidTrafficVal 
          : effectiveSellingPrice * (paidTrafficVal / 100);
      const paidTrafficGatewayCost = calculateGatewayCost(paidTrafficCost, paidTrafficGatewayFeePercent, paidTrafficGatewayFixedFee, paidTrafficGatewayBank, paidTrafficGatewayMethod);
      
      const adsCostPerSale = (currentAds && currentSales > 0 && currentDailyBudget > 0) ? (currentDailyBudget / currentSales) : 0;
      const totalCPA = adsCostPerSale + paidTrafficCost;

      // Calculate final supplier fee cost based on baseCost (not selling price)
  const supplierFeeCost = supplierFeeType === 'fixed' 
      ? supplierFeeVal 
      : baseCost * (supplierFeeVal / 100);

  // Recalculate total cost to include dynamic supplier fee for final metrics
  const fullTotalCost = totalCost + (supplierFeeType === 'percent' ? supplierFeeCost : 0);

  // Total Fees Calculation
      const netRevenue = effectiveSellingPrice - commissionVal - totalFixedFee - gatewayCost - fullTotalCost - adsCostPerSale - paidTrafficCost - paidTrafficGatewayCost - shopeeCouponTotal;

      const actualMargin = (netRevenue / effectiveSellingPrice) * 100;
      
      let marginStatus = 'good';
      if (netRevenue < 0) marginStatus = 'negative';
      else if (actualMargin < (recommendedMargin - 0.5)) marginStatus = 'low';
      else if (actualMargin > (recommendedMargin + 0.5)) marginStatus = 'excellent';

      const taxDescription = `${marketplaceFeeRate}% Comissão + R$ ${finalFixedFee.toFixed(2)} Tarifa Fixa${inactivityFee > 0 ? ' + R$ ' + inactivityFee.toFixed(2) + ' (Inatividade)' : ''}`;
      
      const supplierFeeCostEnjoei = supplierFeeType === 'fixed' 
          ? supplierFeeVal 
          : baseCost * (supplierFeeVal / 100);

      const totalInfluencerPercent = influencers.reduce((acc, curr) => acc + (parseFloat(curr.percentage?.replace(',', '.') || '0')), 0);
      const totalAffiliatePercent = calcTotalAffiliatePercent(affiliates);
      
      const influencerCost = effectiveSellingPrice * (totalInfluencerPercent / 100);
      const affiliateCost = effectiveSellingPrice * (totalAffiliatePercent / 100);

      return {
          cost: fullTotalCost,
          packagingCost: pkgCost.toFixed(2),
          supplierFeeCost: supplierFeeCostEnjoei.toFixed(2),
          supplierGatewayCost: supplierGatewayCost.toFixed(2),
          emergencyReserve: emergencyReserveVal.toFixed(2),
          totalCost: totalCost, 
          suggestedPrice: effectiveSellingPrice.toFixed(2),
          suggestedPriceRaw: effectiveSellingPrice,
          marketplaceFee: marketplaceFeeRate.toFixed(0),
          marketplaceCost: commissionVal.toFixed(2),
          fixedFee: totalFixedFee.toFixed(2),
          gatewayCost: gatewayCost.toFixed(2),
          gatewayFee: gatewayFeeVal,
          paidTrafficCost: paidTrafficCost.toFixed(2),
          paidTrafficFee: paidTrafficVal,
          paidTrafficType: paidTrafficType,
          paidTrafficGatewayCost: paidTrafficGatewayCost.toFixed(2),
          adsCostPerSale: adsCostPerSale.toFixed(2),
          totalCPA: totalCPA.toFixed(2),
          totalFees: (commissionVal + totalFixedFee + gatewayCost + paidTrafficCost + adsCostPerSale + pkgCost + supplierFeeCost + paidTrafficGatewayCost + shopeeCouponTotal).toFixed(2),
          shopeeStoreCoupon: shopeeStoreCouponValue.toFixed(2),
          shopeeProductCoupon: shopeeProductCouponValue.toFixed(2),
          shopeeFollowerCoupon: shopeeFollowerCouponValue.toFixed(2),
          shopeeSellerVoucher: shopeeSellerVoucherValue.toFixed(2),
          shopeeCouponTotal: shopeeCouponTotal.toFixed(2),
          netRevenue: netRevenue.toFixed(2),
          actualMargin: actualMargin.toFixed(1),
          recommendedMargin,
          taxDescription,
          manualPrice: manualPriceVal,
          discountApplied: 0,
          increaseApplied: 0,
          discountPercent: 0,
          recommendedValue: "0.00",
          competitor: competitorPriceVal,
          breakevenCPA: (netRevenue + totalCPA).toFixed(2),
          reverseCR: "0.00",
          marginStatus,
          returnRate: returnRateVal,
          lossPerReturn: (totalCost + adsCostPerSale).toFixed(2),
          influencerCost: influencerCost.toFixed(2),
          affiliateCost: affiliateCost.toFixed(2),
          totalInfluencerPercent: totalInfluencerPercent,
          totalAffiliatePercent: totalAffiliatePercent
      };
  }

  // New Logic for Mercado Livre
  if (currentMarketplace === 'mercadolivre') {
      const categoryTaxes = mercadoLivreTaxes[currentAdType];
      const tax = categoryTaxes[currentCategory];
      const commissionRate = tax.rate === 0
        ? 0
        : meliPlus
          ? Math.max(9, tax.rate - 2)
          : tax.rate; 
      const recommendedMargin = getRecommendedMargin(totalCost);
      
      const cpaFromConversion = currentCpc > 0 && currentConversionRate > 0
        ? (currentCpc / currentConversionRate)
        : 0;
      const adsCostVal = currentAds
        ? (cpaFromConversion || (currentSales > 0 && currentDailyBudget > 0 ? (currentDailyBudget / currentSales) : 0))
        : 0;
      const paidTrafficRate = paidTrafficType === 'percent' ? paidTrafficVal : 0;
      const paidTrafficGatewayRate = paidTrafficType === 'percent' ? (paidTrafficVal * (paidTrafficGatewayFeePercent / 100)) : 0;
      const paidTrafficGatewayFixedCost = paidTrafficVal > 0 ? paidTrafficGatewayFixedFee : 0;
      const paidTrafficFixedCost = paidTrafficType === 'fixed' ? paidTrafficVal : 0;
      const paidTrafficGatewayFixedTotal = paidTrafficType === 'fixed'
        ? paidTrafficGatewayFixedFee + (paidTrafficVal * (paidTrafficGatewayFeePercent / 100))
        : paidTrafficGatewayFixedCost;
      const otherFixedCosts = gatewayFixedFeeVal + paidTrafficFixedCost + paidTrafficGatewayFixedTotal;
      
      const params: MercadoLivreParams = {
          costPrice: baseCost + supplierFeeCostFixed,
          packagingCost: pkgCost,
          shippingCost: mlShippingVal,
          listingType: currentAdType as MercadoLivreParams['listingType'],
          categoryRate: commissionRate,
          desiredMargin: recommendedMargin,
          gatewayFee: gatewayFeeVal,
          adsCost: adsCostVal,
          otherCosts: otherFixedCosts,
          otherVariableRate: paidTrafficRate + paidTrafficGatewayRate
      };

      let autoResult: MLCalculationResult;
      
      // 1. Calculate Suggested Price (Auto) based on Markup or Recommended Margin
      if (markup !== 0) {
           const costBaseForMarkup = totalCost;
           let markupPrice = 0;
           if (markup > 0) {
               markupPrice = costBaseForMarkup * markup;
           } else {
               markupPrice = costBaseForMarkup / Math.abs(markup);
           }
           autoResult = calculateProfitFromPrice(markupPrice, params);
      } else {
           autoResult = calculateSellingPrice(params);
      }

      // 2. Determine Effective Result (Actual financials)
      let result: MLCalculationResult;
      if (manualPriceVal > 0) {
          result = calculateProfitFromPrice(manualPriceVal, params);
      } else {
          result = autoResult;
      }

      // Map result to existing structure
      const diffVal = manualPriceVal > 0 ? manualPriceVal - autoResult.suggestedPrice : 0;
      const discountApplied = diffVal < 0 ? Math.abs(diffVal) : 0;
      const increaseApplied = diffVal > 0 ? diffVal : 0;
      const discountPercent = manualPriceVal > 0 ? ((diffVal / autoResult.suggestedPrice) * 100) : 0;
      
      let recommendedValue = 0;
      if (competitorMarkupVal > 0) {
          recommendedValue = competitorPriceVal * competitorMarkupVal;
      } else {
          recommendedValue = competitorPriceVal / Math.abs(competitorMarkupVal);
      }
      
      const effectiveSellingPrice = manualPriceVal > 0 ? manualPriceVal : autoResult.suggestedPrice;
      
      const totalInfluencerPercent = influencers.reduce((acc, curr) => acc + (parseFloat(curr.percentage?.replace(',', '.') || '0')), 0);
      const totalAffiliatePercent = calcTotalAffiliatePercent(affiliates);
      
      const influencerCost = effectiveSellingPrice * (totalInfluencerPercent / 100);
      const affiliateCost = effectiveSellingPrice * (totalAffiliatePercent / 100);

      const paidTrafficCost = paidTrafficType === 'fixed' 
        ? paidTrafficVal 
        : effectiveSellingPrice * (paidTrafficVal / 100);
      const {
        shopeeStoreCouponValue,
        shopeeProductCouponValue,
        shopeeFollowerCouponValue,
        shopeeSellerVoucherValue,
        shopeeCouponTotal
      } = resolveShopeeCoupons(effectiveSellingPrice, baseCost);
      const paidTrafficGatewayCost = calculateGatewayCost(paidTrafficCost, paidTrafficGatewayFeePercent, paidTrafficGatewayFixedFee, paidTrafficGatewayBank, paidTrafficGatewayMethod);
      const totalCPA = adsCostVal + paidTrafficCost;
      const gatewayCost = calculateGatewayCost(effectiveSellingPrice, gatewayFeeVal, gatewayFixedFeeVal, gatewayBank, gatewayMethod);
      const netRevenue = effectiveSellingPrice - result.commissionAmount - result.fixedFee - gatewayCost - totalCost - adsCostVal - paidTrafficCost - paidTrafficGatewayCost - shopeeCouponTotal - influencerCost - affiliateCost;
      const actualMargin = effectiveSellingPrice > 0 ? (netRevenue / effectiveSellingPrice) * 100 : 0;
      
      let marginStatus = 'good';
      if (netRevenue < 0) {
          marginStatus = 'negative';
      } else if (actualMargin < (recommendedMargin - 0.5)) {
          marginStatus = 'low';
      } else if (actualMargin > (recommendedMargin + 0.5)) {
          marginStatus = 'excellent';
      }
      
      const breakevenCPA = netRevenue + totalCPA;
      
      let reverseCR = 0;
      if (currentCpc > 0 && currentDailyBudget > 0 && currentSales > 0) {
          const clicks = currentDailyBudget / currentCpc;
          reverseCR = (currentSales / clicks) * 100;
      }
      
      const variableSupplierFee = supplierFeeType === 'percent' ? baseCost * (supplierFeeRate / 100) : 0;
      const finalSupplierFeeCost = supplierFeeCostFixed + variableSupplierFee;

      return {
          cost: baseCost,
          packagingCost: pkgCost.toFixed(2),
          supplierFeeCost: finalSupplierFeeCost.toFixed(2),
          supplierGatewayCost: supplierGatewayCost.toFixed(2),
          emergencyReserve: emergencyReserveVal.toFixed(2),
          totalCost: totalCost, 
          suggestedPrice: autoResult.suggestedPrice.toFixed(2),
          suggestedPriceRaw: autoResult.suggestedPrice,
          marketplaceFee: commissionRate.toFixed(0),
          marketplaceCost: result.commissionAmount.toFixed(2),
          fixedFee: result.fixedFee.toFixed(2),
          gatewayCost: gatewayCost.toFixed(2),
          gatewayFee: gatewayFeeVal,
          paidTrafficCost: paidTrafficCost.toFixed(2),
          paidTrafficFee: paidTrafficVal,
          paidTrafficType: paidTrafficType,
          paidTrafficGatewayCost: paidTrafficGatewayCost.toFixed(2),
          adsCostPerSale: adsCostVal.toFixed(2),
          totalCPA: totalCPA.toFixed(2),
          totalFees: (result.commissionAmount + result.fixedFee + gatewayCost + paidTrafficCost + paidTrafficGatewayCost + adsCostVal + pkgCost + finalSupplierFeeCost + marketplaceShippingCost + shopeeCouponTotal + influencerCost + affiliateCost).toFixed(2),
          shopeeStoreCoupon: shopeeStoreCouponValue.toFixed(2),
          shopeeProductCoupon: shopeeProductCouponValue.toFixed(2),
          shopeeFollowerCoupon: shopeeFollowerCouponValue.toFixed(2),
          shopeeSellerVoucher: shopeeSellerVoucherValue.toFixed(2),
          shopeeCouponTotal: shopeeCouponTotal.toFixed(2),
          netRevenue: netRevenue.toFixed(2),
          actualMargin: actualMargin.toFixed(1),
          recommendedMargin,
          taxDescription: result.taxDescription,
          manualPrice: manualPriceVal,
          discountApplied,
          increaseApplied,
          discountPercent,
          recommendedValue: recommendedValue.toFixed(2),
          competitor: competitorPriceVal,
          breakevenCPA: breakevenCPA.toFixed(2),
          reverseCR: reverseCR.toFixed(2),
          marginStatus,
          returnRate: returnRateVal,
          lossPerReturn: (totalCost + adsCostVal).toFixed(2),
          influencerCost: influencerCost.toFixed(2),
          affiliateCost: affiliateCost.toFixed(2),
          totalInfluencerPercent: totalInfluencerPercent,
          totalAffiliatePercent: totalAffiliatePercent
      };
  }

  // LEGACY LOGIC (Shopee, Tiktok, Wordpress)
  let marketplaceFee = 0;
  let fixedFee = 0;
  let taxDescription = '';
  
  const calculateFees = (currentPrice: number) => {
      let currentFixedFee = 0;
      let currentMarketplaceFee = 0;
      const shopeeFixedFee = currentShopeeSellerType === 'cpf' ? 5 : 4;

      if (currentMarketplace === 'shopee') {
          const baseCommission = currentExtraCommission > 0 ? currentExtraCommission : 14;
          const freeShippingFee = 6;
          const hasFreeShipping = currentShipping === 'with';
          currentMarketplaceFee = baseCommission + (hasFreeShipping ? freeShippingFee : 0);
          currentFixedFee = currentPrice < 10 ? (currentPrice * 0.5) : shopeeFixedFee;
      } else if (currentMarketplace === 'tiktok') {
          currentMarketplaceFee = tiktokCommVal;
          currentFixedFee = currentPrice < 79 ? 4 : 0;
      } else if (currentMarketplace === 'wordpress') {
          currentMarketplaceFee = 0;
          currentFixedFee = 0;
      } else if (currentMarketplace === 'olx') {
          currentMarketplaceFee = 0;
          currentFixedFee = 0;
      } else if (!['mercadolivre', 'shopee', 'tiktok', 'shein', 'amazon'].includes(currentMarketplace)) {
          currentMarketplaceFee = customMarketplaceFee;
          currentFixedFee = 0;
      } else {
          const categoryTaxes = mercadoLivreTaxes[currentAdType];
          const tax = categoryTaxes[currentCategory];
          currentMarketplaceFee = tax.rate;

          if (currentAdType === 'gratis') {
              currentFixedFee = 0;
          } else {
              if (currentPrice < 29) {
                  currentFixedFee = 6.25;
              } else if (currentPrice < 50) {
                  currentFixedFee = 6.50;
              } else if (currentPrice < 79) {
                  currentFixedFee = 6.75;
              } else {
                  currentFixedFee = 0;
              }
          }
      }
      return { fixed: currentFixedFee, rate: currentMarketplaceFee };
  };

  if (currentMarketplace === 'shopee') {
    const baseCommission = currentExtraCommission > 0 ? currentExtraCommission : 14;
    const freeShippingFee = 6;
    const hasFreeShipping = currentShipping === 'with';
    const shopeeFixedFee = currentShopeeSellerType === 'cpf' ? 5 : 4;
    const totalRate = baseCommission + (hasFreeShipping ? freeShippingFee : 0);
    marketplaceFee = totalRate;
    const transactionFee = 2;
    const commissionFee = Math.max(0, baseCommission - transactionFee);
    
    taxDescription = hasFreeShipping 
      ? `Shopee: comissão ${totalRate}% (inclui 6% Frete Grátis) + R$ ${shopeeFixedFee.toFixed(2)} (Tarifa Fixa ${currentShopeeSellerType.toUpperCase()})` 
      : `Shopee: ${commissionFee}% (Comissão) + ${transactionFee}% (Transação) + R$ ${shopeeFixedFee.toFixed(2)} (Tarifa Fixa ${currentShopeeSellerType.toUpperCase()})`;
  } else if (currentMarketplace === 'tiktok') {
      marketplaceFee = tiktokCommVal;
      taxDescription = `${tiktokCommVal}% (Comissão Tiktok Shop)`;
  } else if (currentMarketplace === 'shein') {
      marketplaceFee = 16;
      taxDescription = `16% (Comissão Shein)`;
  } else if (currentMarketplace === 'amazon') {
      const cat = amazonCategories[amazonCategory];
      marketplaceFee = cat ? cat.commission : 15;
      fixedFee = amazonPlan === 'individual' ? 2.00 : 0;
      taxDescription = `${marketplaceFee}% (Comissão Amazon)${fixedFee > 0 ? ' + R$ ' + fixedFee.toFixed(2) + ' (Plano Individual)' : ''}`;
  } else if (currentMarketplace === 'wordpress') {
      marketplaceFee = 0;
      taxDescription = `Venda Direta (Site Próprio)`;
  } else if (currentMarketplace === 'olx') {
      marketplaceFee = 0;
      taxDescription = `Venda Direta (OLX)`;
  } else if (!['mercadolivre', 'shopee', 'tiktok', 'shein', 'amazon'].includes(currentMarketplace)) {
      marketplaceFee = customMarketplaceFee;
      taxDescription = `${marketplaceFee}% (Comissão ${currentMarketplace})`;
  } else {
    const categoryTaxes = mercadoLivreTaxes[currentAdType];
    const tax = categoryTaxes[currentCategory];
    marketplaceFee = tax.rate;
  }

  const recommendedMargin = getRecommendedMargin(totalCost);
  
  let suggestedPrice = 0;
  
  
  const calcPrice = (c: number, m: number, feeRate: number, fixed: number, gateway: number) => {
      // Amazon Minimum Commission Logic
      if (currentMarketplace === 'amazon') {
         const cat = amazonCategories[amazonCategory];
         const minComm = cat ? cat.minimum : 1.0;
         const supplierRate = supplierFeeRate;
         const supplierFixedCost = baseCost * (supplierRate / 100);
         
         // Standard calculation with supplier fee as fixed cost in numerator
         const denom = 1 - (feeRate + m + gateway) / 100;
         const price = denom > 0 ? (c + fixed + supplierFixedCost) / denom : (c + fixed + supplierFixedCost) * 2;
         
         // Check if calculated commission is below minimum
         const comm = price * (feeRate / 100);
         if (comm < minComm) {
             // Recalculate with Fixed Commission Amount (minComm) instead of Rate
             const denomMin = 1 - (m + gateway) / 100;
             return denomMin > 0 ? (c + fixed + minComm + supplierFixedCost) / denomMin : (c + fixed + minComm + supplierFixedCost) * 2;
         }
         return price;
      }
      return (c + fixed + baseCost * (supplierFeeRate / 100)) / (1 - (feeRate + m + gateway) / 100);
  };

  if (currentMarketplace === 'mercadolivre') {
      let tempFixed = 0;
      if (currentAdType === 'gratis') {
          suggestedPrice = calcPrice(totalCost, recommendedMargin, marketplaceFee, 0, gatewayFeeVal);
          fixedFee = 0;
      } else {
          let tempPrice = calcPrice(totalCost, recommendedMargin, marketplaceFee, tempFixed, gatewayFeeVal);
          
          if (tempPrice >= 79) {
              fixedFee = 0;
              suggestedPrice = tempPrice;
          } else {
              tempFixed = 6.75;
              tempPrice = calcPrice(totalCost, recommendedMargin, marketplaceFee, tempFixed, gatewayFeeVal);
              if (tempPrice >= 50 && tempPrice < 79) {
                  fixedFee = 6.75;
                  suggestedPrice = tempPrice;
              } else {
                  tempFixed = 6.50;
                  tempPrice = calcPrice(totalCost, recommendedMargin, marketplaceFee, tempFixed, gatewayFeeVal);
                  if (tempPrice >= 29 && tempPrice < 50) {
                      fixedFee = 6.50;
                      suggestedPrice = tempPrice;
                  } else {
                      tempFixed = 6.25;
                      tempPrice = calcPrice(totalCost, recommendedMargin, marketplaceFee, tempFixed, gatewayFeeVal);
                      if (tempPrice >= 12.50 && tempPrice < 29) {
                          fixedFee = 6.25;
                          suggestedPrice = tempPrice;
                      } else {
                          const denominator = 0.5 - (marketplaceFee + recommendedMargin + gatewayFeeVal) / 100;
                          if (denominator > 0) {
                              suggestedPrice = totalCost / denominator;
                              fixedFee = suggestedPrice / 2;
                          } else {
                              suggestedPrice = totalCost * 2;
                              fixedFee = suggestedPrice / 2;
                          }
                      }
                  }
              }
          }
      }
      
      taxDescription = currentAdType === 'gratis' 
      ? `0% comissão`
      : `${marketplaceFee}% comissão${fixedFee > 0 ? ' + R$ ' + fixedFee.toFixed(2) + ' (Tarifa Fixa Mercado Livre)' : ''}`;
  } else if (currentMarketplace === 'shopee') {
      const shopeeFixedFee = currentShopeeSellerType === 'cpf' ? 5 : 4;
      const tempPrice = calcPrice(totalCost, recommendedMargin, marketplaceFee, shopeeFixedFee + gatewayFixedFeeVal, gatewayFeeVal);
      
      if (tempPrice < 8) {
           const denominator = 0.5 - (marketplaceFee + recommendedMargin + gatewayFeeVal) / 100;
           if (denominator > 0) {
               suggestedPrice = totalCost / denominator;
               fixedFee = suggestedPrice * 0.5;
           } else {
               suggestedPrice = tempPrice;
               fixedFee = shopeeFixedFee;
           }
      } else {
           suggestedPrice = tempPrice;
           fixedFee = shopeeFixedFee;
      }
  } else if (currentMarketplace === 'tiktok') {
      const tempPriceWithFixed = calcPrice(totalCost, recommendedMargin, marketplaceFee, 2 + gatewayFixedFeeVal, gatewayFeeVal);
      
      if (tempPriceWithFixed < 79) {
          suggestedPrice = tempPriceWithFixed;
          fixedFee = 2;
      } else {
          suggestedPrice = calcPrice(totalCost, recommendedMargin, marketplaceFee, 0 + gatewayFixedFeeVal, gatewayFeeVal);
          fixedFee = 0;
      }
  } else {
      suggestedPrice = calcPrice(totalCost, recommendedMargin, marketplaceFee, gatewayFixedFeeVal, gatewayFeeVal);
      fixedFee = 0;
  }

  if (markup !== 0) {
      if (markup > 0) {
          suggestedPrice = totalCost * markup;
      } else {
          suggestedPrice = totalCost / Math.abs(markup);
      }
      const fees = calculateFees(suggestedPrice);
      fixedFee = fees.fixed;

      if (currentMarketplace === 'mercadolivre') {
           taxDescription = currentAdType === 'gratis' 
          ? `0% comissão${fixedFee > 0 ? ' + R$ ' + fixedFee.toFixed(2) + ' (Tarifa Fixa Mercado Livre)' : ''}`
          : `${marketplaceFee}% comissão${fixedFee > 0 ? ' + R$ ' + fixedFee.toFixed(2) + ' (Tarifa Fixa Mercado Livre)' : ''}`;
      }
  } else {
       if (currentMarketplace === 'mercadolivre') {
           const fees = calculateFees(suggestedPrice);
           fixedFee = fees.fixed;
           taxDescription = currentAdType === 'gratis' 
          ? `0% comissão${fixedFee > 0 ? ' + R$ ' + fixedFee.toFixed(2) + ' (Tarifa Fixa Mercado Livre)' : ''}`
          : `${marketplaceFee}% comissão${fixedFee > 0 ? ' + R$ ' + fixedFee.toFixed(2) + ' (Tarifa Fixa Mercado Livre)' : ''}`;
       }
  }

  const effectiveSellingPrice = manualPriceVal > 0 ? manualPriceVal : suggestedPrice;
  const {
    shopeeStoreCouponValue,
    shopeeProductCouponValue,
    shopeeFollowerCouponValue,
    shopeeSellerVoucherValue,
    shopeeCouponTotal
  } = resolveShopeeCoupons(effectiveSellingPrice, baseCost);
  const finalFees = calculateFees(effectiveSellingPrice);
  const finalFixedFee = finalFees.fixed;

  let calculatedCommission = effectiveSellingPrice * (marketplaceFee / 100);
  if (currentMarketplace === 'shopee' && calculatedCommission > 100) {
     calculatedCommission = 100;
  }

  const gatewayCost = calculateGatewayCost(effectiveSellingPrice, gatewayFeeVal, gatewayFixedFeeVal, gatewayBank, gatewayMethod);
  const paidTrafficCost = paidTrafficType === 'fixed' 
      ? paidTrafficVal 
      : effectiveSellingPrice * (paidTrafficVal / 100);
  
  const paidTrafficGatewayCost = calculateGatewayCost(paidTrafficCost, paidTrafficGatewayFeePercent, paidTrafficGatewayFixedFee, paidTrafficGatewayBank, paidTrafficGatewayMethod);

  let adsCostPerSale = 0;
  if (currentAds && currentSales > 0 && currentDailyBudget > 0) {
      adsCostPerSale = currentDailyBudget / currentSales;
  }
  
  const totalCPA = adsCostPerSale + paidTrafficCost;

  const marketplaceCost = calculatedCommission;
  
  // Calculate final supplier fee cost based on baseCost (not selling price)
  const supplierFeeCost = supplierFeeType === 'fixed' 
      ? supplierFeeVal 
      : baseCost * (supplierFeeVal / 100);

  const totalInfluencerPercent = influencers.reduce((acc, curr) => acc + (parseFloat(curr.percentage?.replace(',', '.') || '0')), 0);
  const totalAffiliatePercent = calcTotalAffiliatePercent(affiliates);
  
  const influencerCost = effectiveSellingPrice * (totalInfluencerPercent / 100);
  const affiliateCost = effectiveSellingPrice * (totalAffiliatePercent / 100);

  // Partial cost was totalCost (base + fixed supplier + gateway supplier + pkg + shipping)
  // We need to subtract the variable supplier fee too
  const netRevenue = effectiveSellingPrice - marketplaceCost - finalFixedFee - gatewayCost - totalCost - supplierFeeCost - adsCostPerSale - paidTrafficCost - paidTrafficGatewayCost - shopeeCouponTotal - influencerCost - affiliateCost;
  const actualMargin = (netRevenue / effectiveSellingPrice) * 100;
  
  const breakevenCPA = netRevenue + totalCPA; 
  
  let reverseCR = 0;
  if (currentCpc > 0 && currentDailyBudget > 0 && currentSales > 0) {
      const clicks = currentDailyBudget / currentCpc;
      reverseCR = (currentSales / clicks) * 100;
  }

  const diffVal = manualPriceVal > 0 ? manualPriceVal - suggestedPrice : 0;
  const discountApplied = diffVal < 0 ? Math.abs(diffVal) : 0;
  const increaseApplied = diffVal > 0 ? diffVal : 0;
  const discountPercent = manualPriceVal > 0 ? ((diffVal / suggestedPrice) * 100) : 0;
  
  let recommendedValue = 0;
  if (competitorMarkupVal > 0) {
      recommendedValue = competitorPriceVal * competitorMarkupVal;
  } else {
      recommendedValue = competitorPriceVal / Math.abs(competitorMarkupVal);
  }

  let marginStatus = 'good';
  if (netRevenue < 0) {
      marginStatus = 'negative';
  } else if (actualMargin < (recommendedMargin - 0.5)) {
      marginStatus = 'low';
  } else if (actualMargin > (recommendedMargin + 0.5)) {
      marginStatus = 'excellent';
  }

  return {
    cost: baseCost,
    packagingCost: pkgCost.toFixed(2),
    supplierFeeCost: supplierFeeCost.toFixed(2),
    supplierGatewayCost: supplierGatewayCost.toFixed(2),
    emergencyReserve: emergencyReserveVal.toFixed(2),
    totalCost: (totalCost + (supplierFeeType === 'percent' ? supplierFeeCost : 0)),
    suggestedPrice: suggestedPrice.toFixed(2),
    suggestedPriceRaw: suggestedPrice,
    marketplaceFee: marketplaceFee.toFixed(0),
    marketplaceCost: marketplaceCost.toFixed(2),
    fixedFee: finalFixedFee.toFixed(2),
    gatewayCost: gatewayCost.toFixed(2),
      gatewayFee: gatewayFeeVal,
      paidTrafficCost: paidTrafficCost.toFixed(2),
      paidTrafficFee: paidTrafficVal,
      paidTrafficType: paidTrafficType,
      paidTrafficGatewayCost: paidTrafficGatewayCost.toFixed(2),
      adsCostPerSale: adsCostPerSale.toFixed(2),
      totalCPA: totalCPA.toFixed(2),
    totalFees: (marketplaceCost + finalFixedFee + gatewayCost + paidTrafficCost + adsCostPerSale + pkgCost + supplierFeeCost + marketplaceShippingCost + paidTrafficGatewayCost + shopeeCouponTotal + influencerCost + affiliateCost).toFixed(2),
    shopeeStoreCoupon: shopeeStoreCouponValue.toFixed(2),
    shopeeProductCoupon: shopeeProductCouponValue.toFixed(2),
    shopeeFollowerCoupon: shopeeFollowerCouponValue.toFixed(2),
    shopeeSellerVoucher: shopeeSellerVoucherValue.toFixed(2),
    shopeeCouponTotal: shopeeCouponTotal.toFixed(2),
    netRevenue: netRevenue.toFixed(2),
    actualMargin: actualMargin.toFixed(1),
    recommendedMargin,
    taxDescription,
    manualPrice: manualPriceVal,
    discountApplied,
    increaseApplied,
    discountPercent,
    recommendedValue: recommendedValue.toFixed(2),
    competitor: competitorPriceVal,
    breakevenCPA: breakevenCPA.toFixed(2),
    reverseCR: reverseCR.toFixed(2),
    marginStatus,
    returnRate: returnRateVal,
    lossPerReturn: (totalCost + adsCostPerSale).toFixed(2),
          influencerCost: influencerCost.toFixed(2),
          affiliateCost: affiliateCost.toFixed(2),
          totalInfluencerPercent: totalInfluencerPercent,
          totalAffiliatePercent: totalAffiliatePercent
      };
};
