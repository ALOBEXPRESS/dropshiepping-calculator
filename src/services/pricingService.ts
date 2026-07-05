import type { MercadoLivreTaxes, ShopeeCategory, CalculationResult, AiModel, KiePlan, Influencer, Affiliate } from '../types/calculator';
import { amazonCategories } from './amazonCategories';
import { calculateProfitFromPrice, calculateSellingPrice, type MercadoLivreParams, type CalculationResult as MLCalculationResult } from './calculators/mercadolivre';

// Affiliate commission = single rate per marketplace (not summed per affiliate).
// Multiple affiliates represent different people selling the same product — the marketplace
// commission rate is the same for all. Use the highest rate among selected affiliates.
const calcTotalAffiliatePercent = (affiliates: Affiliate[]): number => {
  if (affiliates.length === 0) return 0;
  return Math.max(...affiliates.map(a => parseFloat(a.percentage?.replace(',', '.') || '0')));
};

export const shopeeCategories: Record<string, ShopeeCategory> = {
  eletronicos:      { name: 'Eletrônicos', avgCPC: 0.45, avgCR: 1.2 },
  cameras:          { name: 'Câmeras e Acessórios', avgCPC: 0.42, avgCR: 1.1 },
  moda:             { name: 'Moda e Acessórios', avgCPC: 0.35, avgCR: 2.5 },
  casa:             { name: 'Casa e Decoração', avgCPC: 0.40, avgCR: 1.8 },
  beleza:           { name: 'Beleza e Cuidados', avgCPC: 0.38, avgCR: 2.2 },
  celulares:        { name: 'Celulares e Acessórios', avgCPC: 0.55, avgCR: 1.0 },
  informatica:      { name: 'Informática', avgCPC: 0.50, avgCR: 1.1 },
  esportes:         { name: 'Esportes e Fitness', avgCPC: 0.42, avgCR: 1.5 },
  brinquedos:       { name: 'Brinquedos e Hobbies', avgCPC: 0.30, avgCR: 2.0 },
  papelaria:        { name: 'Papelaria e Arte', avgCPC: 0.25, avgCR: 2.8 },
  automotivo:       { name: 'Automotivo', avgCPC: 0.48, avgCR: 1.3 },
  eletrodomesticos: { name: 'Eletrodomésticos', avgCPC: 0.44, avgCR: 1.2 },
  saude:            { name: 'Saúde e Bem-Estar', avgCPC: 0.40, avgCR: 1.6 },
  games:            { name: 'Games e Consoles', avgCPC: 0.52, avgCR: 1.0 },
  calcados:         { name: 'Calçados e Acessórios de Moda', avgCPC: 0.36, avgCR: 2.2 },
  relogios:         { name: 'Joias, Relógios e Porta-Joias', avgCPC: 0.38, avgCR: 1.8 },
  moveis:           { name: 'Móveis', avgCPC: 0.45, avgCR: 1.0 },
  ferramentas:      { name: 'Ferramentas', avgCPC: 0.46, avgCR: 1.2 },
  pet:              { name: 'Pet Shop', avgCPC: 0.35, avgCR: 2.0 },
  livros:           { name: 'Livros', avgCPC: 0.22, avgCR: 3.0 },
};

export const mercadoLivreTaxes: MercadoLivreTaxes = {
  gratis: {
    // Eletrônicos
    eletronicos:      { rate: 0, name: 'Eletrônicos (Fones, Caixas BT, Projetores)' },
    cameras:          { rate: 0, name: 'Câmeras e Acessórios' },
    // Celulares
    celulares:        { rate: 0, name: 'Celulares e Acessórios' },
    // Informática
    informatica:      { rate: 0, name: 'Informática' },
    // Moda
    moda:             { rate: 0, name: 'Moda e Acessórios' },
    calcados:         { rate: 0, name: 'Calçados e Acessórios de Moda' },
    relogios:         { rate: 0, name: 'Joias, Relógios e Porta-Joias' },
    // Casa
    casa:             { rate: 0, name: 'Casa e Decoração' },
    moveis:           { rate: 0, name: 'Móveis' },
    // Beleza
    beleza:           { rate: 0, name: 'Beleza e Cuidado Pessoal' },
    // Esportes
    esportes:         { rate: 0, name: 'Esportes e Fitness' },
    // Brinquedos
    brinquedos:       { rate: 0, name: 'Brinquedos e Hobbies' },
    // Ferramentas
    ferramentas:      { rate: 0, name: 'Ferramentas' },
    // Pet
    pet:              { rate: 0, name: 'Pet Shop' },
    // Livros
    livros:           { rate: 0, name: 'Livros' },
    // Automotivo
    automotivo:       { rate: 0, name: 'Automotivo e Acessórios' },
    // Eletrodomésticos (NEW)
    eletrodomesticos: { rate: 0, name: 'Eletrodomésticos' },
    // Saúde (NEW)
    saude:            { rate: 0, name: 'Saúde e Bem-Estar' },
    // Games (NEW)
    games:            { rate: 0, name: 'Games e Consoles' },
    // Papelaria (NEW)
    papelaria:        { rate: 0, name: 'Papelaria e Arte' },
  },
  classico: {
    // Eletrônicos — 13% (fones, caixas bt, projetores, media streaming)
    eletronicos:      { rate: 13,   name: 'Eletrônicos (Fones, Caixas BT, Projetores)' },
    // Câmeras — 11%
    cameras:          { rate: 11,   name: 'Câmeras e Acessórios' },
    // Celulares — 13% (carregadores, cabos, suportes veiculares); smartwatches 11% → use celulares for 13%, smartwatch niche is minority
    celulares:        { rate: 13,   name: 'Celulares e Acessórios' },
    // Informática — 13% (mouses, impressoras, leitores de cartão)
    informatica:      { rate: 13,   name: 'Informática' },
    // Moda — 16% (mantido)
    moda:             { rate: 16,   name: 'Moda e Acessórios' },
    // Calçados/Acessórios de Moda — 14% (chaveiros)
    calcados:         { rate: 14,   name: 'Calçados e Acessórios de Moda' },
    // Joias/Relógios — 12.5% (porta joias)
    relogios:         { rate: 12.5, name: 'Joias, Relógios e Porta-Joias' },
    // Casa — 11.5% (câmeras seg, lâmpadas, luminárias, facas, kits utensílios)
    casa:             { rate: 11.5, name: 'Casa e Decoração' },
    // Móveis — mantido próximo de casa
    moveis:           { rate: 11.5, name: 'Móveis' },
    // Beleza — 12% (escovas, pranchas, barbeadores, máquinas de cortar)
    beleza:           { rate: 12,   name: 'Beleza e Cuidado Pessoal' },
    // Esportes — 11.5% (térmicos, garrafinhas, smartbands, garrafas)
    esportes:         { rate: 11.5, name: 'Esportes e Fitness' },
    // Brinquedos — 11.5% (bolhas, lançadores de água, pop its)
    brinquedos:       { rate: 11.5, name: 'Brinquedos e Hobbies' },
    // Ferramentas — mantido
    ferramentas:      { rate: 13,   name: 'Ferramentas' },
    // Pet — mantido
    pet:              { rate: 14,   name: 'Pet Shop' },
    // Livros — mantido
    livros:           { rate: 12,   name: 'Livros' },
    // Automotivo — 11% (aspiradores)
    automotivo:       { rate: 11,   name: 'Automotivo e Acessórios' },
    // Eletrodomésticos (NEW) — 11% (liquidificadores, climatizadores, processadores)
    eletrodomesticos: { rate: 11,   name: 'Eletrodomésticos' },
    // Saúde (NEW) — 12% (umidificadores, hidromassageadores, massageadores)
    saude:            { rate: 12,   name: 'Saúde e Bem-Estar' },
    // Games (NEW) — 11%
    games:            { rate: 11,   name: 'Games e Consoles' },
    // Papelaria (NEW) — 11.5% (marcadores, cadernos, estojos)
    papelaria:        { rate: 11.5, name: 'Papelaria e Arte' },
  },
  premium: {
    eletronicos:      { rate: 18,   name: 'Eletrônicos (Fones, Caixas BT, Projetores)' },
    cameras:          { rate: 16,   name: 'Câmeras e Acessórios' },
    celulares:        { rate: 18,   name: 'Celulares e Acessórios' },
    informatica:      { rate: 18,   name: 'Informática' },
    moda:             { rate: 19,   name: 'Moda e Acessórios' },
    calcados:         { rate: 19,   name: 'Calçados e Acessórios de Moda' },
    relogios:         { rate: 17.5, name: 'Joias, Relógios e Porta-Joias' },
    casa:             { rate: 16.5, name: 'Casa e Decoração' },
    moveis:           { rate: 16.5, name: 'Móveis' },
    beleza:           { rate: 17,   name: 'Beleza e Cuidado Pessoal' },
    esportes:         { rate: 16.5, name: 'Esportes e Fitness' },
    brinquedos:       { rate: 16.5, name: 'Brinquedos e Hobbies' },
    ferramentas:      { rate: 18,   name: 'Ferramentas' },
    pet:              { rate: 19,   name: 'Pet Shop' },
    livros:           { rate: 17,   name: 'Livros' },
    automotivo:       { rate: 16,   name: 'Automotivo e Acessórios' },
    eletrodomesticos: { rate: 16,   name: 'Eletrodomésticos' },
    saude:            { rate: 17,   name: 'Saúde e Bem-Estar' },
    games:            { rate: 16,   name: 'Games e Consoles' },
    papelaria:        { rate: 16.5, name: 'Papelaria e Arte' },
  }
};

export const getRecommendedMargin = (price: number) => {
  if (price <= 30) return 30;
  if (price <= 50) return 25;
  if (price <= 80) return 22;
  if (price <= 150) return 19;
  return 16;
};

/**
 * Calcula a taxa fixa do Mercado Livre por faixa de preço (Task 3.3)
 * Regras de março de 2026:
 * - Preço < R$ 12,50: R$ 0,00 (isento)
 * - R$ 12,50 - R$ 29,00: R$ 6,25
 * - R$ 29,01 - R$ 50,00: R$ 6,50
 * - R$ 50,01 - R$ 78,99: R$ 6,75
 * - Preço ≥ R$ 79,00: R$ 0,00 (isento, mas com frete grátis obrigatório)
 */
export const getMercadoLivreFixedFee = (price: number, listingType: string): number => {
  // Anúncios grátis não têm taxa fixa
  if (listingType === 'gratis') {
    return 0;
  }
  
  // Faixas de preço
  if (price < 12.50) return 0.00;
  if (price >= 12.50 && price <= 29.00) return 6.25;
  if (price >= 29.01 && price <= 50.00) return 6.50;
  if (price >= 50.01 && price <= 78.99) return 6.75;
  if (price >= 79.00) return 0.00; // Isento, mas com frete grátis
  
  return 0;
};

/**
 * Mapeamento de endereços de fornecedores (Task 3.4)
 */
export const SUPPLIER_ADDRESSES: Record<string, import('../types/calculator').SupplierAddress> = {
  'Tyr': {
    street: 'Rua Desembargador Olavo Ferreira Prado',
    number: '787',
    neighborhood: 'Americanópolis',
    city: 'São Paulo',
    state: 'SP',
    postalCode: '04427000'
  },
  'Dogama': {
    street: 'Rua Messias Jerônimo',
    number: '906',
    complement: 'Ponto de Coleta dos Correios',
    neighborhood: 'São Geraldo 2',
    city: 'Nova Serrana',
    state: 'MG',
    postalCode: '35520292'
  },
  'Alobexpress': {
    street: 'Estr. Aterrado do Leme',
    number: '1240',
    complement: 'Condominio Leme 2 bloco 7 app 502',
    neighborhood: 'Santa Cruz',
    city: 'Rio de Janeiro',
    state: 'RJ',
    postalCode: '23575330'
  }
};

/**
 * Mapeamento de regiões de frete por fornecedor (Task 3.4)
 * Estrutura: { fornecedor: { região: CEP } }
 */
export const SHIPPING_REGIONS: Record<string, Record<string, import('../types/calculator').ShippingRegion>> = {
  'Tyr': {
    'Mais Distante': { name: 'Roraima', postalCode: '69301010' },
    'Equilíbrio': { name: 'Bahia', postalCode: '40010000' },
    'Curta Distância': { name: 'São Paulo (mesmo estado)', postalCode: '01310100' }
  },
  'Dogama': {
    'Mais Distante': { name: 'Roraima', postalCode: '69301010' },
    'Equilíbrio': { name: 'Ceará', postalCode: '60010000' },
    'Curta Distância': { name: 'Minas Gerais (mesmo estado)', postalCode: '30130100' }
  },
  'Alobexpress': {
    'Mais Distante': { name: 'Roraima', postalCode: '69301010' },
    'Equilíbrio': { name: 'Paraíba', postalCode: '58010000' },
    'Curta Distância': { name: 'Rio de Janeiro (mesmo estado)', postalCode: '20040030' }
  }
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
    _currentShipping: string,
    _currentShopeeSellerType: 'cpf' | 'cnpj' = 'cnpj', // eslint-disable-line @typescript-eslint/no-unused-vars
    _currentExtraCommission: number,
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
    affiliates: Affiliate[] = [],
    tiktokSfpEnabled: boolean = false
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

      let taxDescription = `${marketplaceFeeRate}% Comissão + R$ ${finalFixedFee.toFixed(2)} Tarifa Fixa${inactivityFee > 0 ? ' + R$ ' + inactivityFee.toFixed(2) + ' (Inatividade)' : ''}`;
      
      const supplierFeeCostEnjoei = supplierFeeType === 'fixed' 
          ? supplierFeeVal 
          : baseCost * (supplierFeeVal / 100);

      const totalInfluencerPercent = influencers.reduce((acc, curr) => acc + (parseFloat(curr.percentage?.replace(',', '.') || '0')), 0);
      const totalAffiliatePercent = calcTotalAffiliatePercent(affiliates);
      
      const influencerCost = effectiveSellingPrice * (totalInfluencerPercent / 100);
      const affiliateCost = effectiveSellingPrice * (totalAffiliatePercent / 100);

      if (totalAffiliatePercent > 0) {
        taxDescription += ` + ${totalAffiliatePercent}% (Afiliado)`;
      }

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
          totalFees: (commissionVal + totalFixedFee + gatewayCost + paidTrafficCost + adsCostPerSale + pkgCost + supplierFeeCost + supplierGatewayCost + paidTrafficGatewayCost + shopeeCouponTotal).toFixed(2),
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
          totalAffiliatePercent: totalAffiliatePercent,
          tiktokSfpFee: '0.00'
      };
  }

  // New Logic for Mercado Livre
  if (currentMarketplace === 'mercadolivre') {
      const categoryTaxes = mercadoLivreTaxes[currentAdType];
      const tax = categoryTaxes[currentCategory] ?? categoryTaxes['eletronicos'];
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
          totalFees: (result.commissionAmount + result.fixedFee + gatewayCost + paidTrafficCost + paidTrafficGatewayCost + adsCostVal + pkgCost + finalSupplierFeeCost + supplierGatewayCost + marketplaceShippingCost + shopeeCouponTotal + influencerCost + affiliateCost).toFixed(2),
          shopeeStoreCoupon: shopeeStoreCouponValue.toFixed(2),
          shopeeProductCoupon: shopeeProductCouponValue.toFixed(2),
          shopeeFollowerCoupon: shopeeFollowerCouponValue.toFixed(2),
          shopeeSellerVoucher: shopeeSellerVoucherValue.toFixed(2),
          shopeeCouponTotal: shopeeCouponTotal.toFixed(2),
          netRevenue: netRevenue.toFixed(2),
          actualMargin: actualMargin.toFixed(1),
          recommendedMargin,
          taxDescription: totalAffiliatePercent > 0 ? `${result.taxDescription} + ${totalAffiliatePercent}% (Afiliado)` : result.taxDescription,
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
          totalAffiliatePercent: totalAffiliatePercent,
          tiktokSfpFee: '0.00'
      };
  }

  // Helper: retorna comissão % e taxa fixa da Shopee baseado no preço de venda (novas regras 2025)
  const getShopeeRates = (price: number): { commission: number; fixed: number; subsidyPix: number } => {
    if (price <= 79.99) return { commission: 20, fixed: 4, subsidyPix: 0 };
    if (price <= 99.99) return { commission: 14, fixed: 16, subsidyPix: 5 };
    if (price <= 199.99) return { commission: 14, fixed: 20, subsidyPix: 5 };
    if (price <= 499.99) return { commission: 14, fixed: 26, subsidyPix: 5 };
    return { commission: 14, fixed: 26, subsidyPix: 8 };
  };

  // LEGACY LOGIC (Shopee, Tiktok, Wordpress)
  let marketplaceFee = 0;
  let fixedFee = 0;
  let taxDescription = '';
  
  const calculateFees = (currentPrice: number) => {
      let currentFixedFee = 0;
      let currentMarketplaceFee = 0;

      if (currentMarketplace === 'shopee') {
          const rates = getShopeeRates(currentPrice);
          currentMarketplaceFee = rates.commission;
          currentFixedFee = currentPrice < 10 ? (currentPrice * 0.5) : rates.fixed;
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
          const tax = categoryTaxes[currentCategory] ?? categoryTaxes['eletronicos'];
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
    // Novas regras Shopee 2025: frete grátis obrigatório, taxas por faixa de preço
    // Usamos preço estimado para determinar a faixa inicial (será recalculado com preço real)
    const estimatedPrice = manualPriceVal > 0 ? manualPriceVal : (totalCost * 2.5);
    const rates = getShopeeRates(estimatedPrice);
    marketplaceFee = rates.commission;
    const shopeeFixedFee = rates.fixed;
    taxDescription = `Shopee: ${rates.commission}% comissão + R$ ${shopeeFixedFee.toFixed(2)} (Taxa Fixa) — Frete Grátis incluso`;
  } else if (currentMarketplace === 'tiktok') {
      marketplaceFee = tiktokCommVal;
      taxDescription = `${tiktokCommVal}% (Comissão Tiktok Shop)`; // updated after finalFixedFee
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
    const tax = categoryTaxes[currentCategory] ?? categoryTaxes['eletronicos'];
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
      // Cálculo iterativo: a faixa depende do preço, que depende da faixa
      // Resolve com iteração até convergir
      let iterPrice = totalCost * 2.5;
      for (let i = 0; i < 10; i++) {
        const rates = getShopeeRates(iterPrice);
        const newPrice = calcPrice(totalCost, recommendedMargin, rates.commission, rates.fixed + gatewayFixedFeeVal, gatewayFeeVal);
        if (Math.abs(newPrice - iterPrice) < 0.01) { iterPrice = newPrice; break; }
        iterPrice = newPrice;
      }
      const finalRates = getShopeeRates(iterPrice);
      if (iterPrice < 8) {
        const denominator = 0.5 - (finalRates.commission + recommendedMargin + gatewayFeeVal) / 100;
        suggestedPrice = denominator > 0 ? totalCost / denominator : iterPrice;
        fixedFee = suggestedPrice * 0.5;
      } else {
        suggestedPrice = iterPrice;
        fixedFee = finalRates.fixed;
      }
      // Atualiza taxDescription com faixa real
      const realRates = getShopeeRates(suggestedPrice);
      marketplaceFee = realRates.commission;
      taxDescription = `Shopee: ${realRates.commission}% comissão + R$ ${realRates.fixed.toFixed(2)} (Taxa Fixa) — Frete Grátis incluso`;
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

  // Update TikTok taxDescription now that finalFixedFee is known
  if (currentMarketplace === 'tiktok') {
    taxDescription = finalFixedFee > 0
      ? `${tiktokCommVal}% (Comissão Tiktok Shop) + R$ ${finalFixedFee.toFixed(2)} (Taxa Fixa)`
      : `${tiktokCommVal}% (Comissão Tiktok Shop)`;
  }
  // Update Shopee taxDescription and marketplaceFee with real price faixa
  if (currentMarketplace === 'shopee') {
    const realRates = getShopeeRates(effectiveSellingPrice);
    marketplaceFee = realRates.commission;
    taxDescription = `Shopee: ${realRates.commission}% comissão + R$ ${finalFixedFee.toFixed(2)} (Taxa Fixa) — Frete Grátis incluso`;
  }

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

  // Append affiliate commission to taxDescription if applicable
  if (totalAffiliatePercent > 0) {
    taxDescription += ` + ${totalAffiliatePercent}% (Afiliado)`;
  }

  // Append supplier fees to taxDescription for transparency
  if (supplierFeeCost > 0) {
    if (supplierFeeType === 'fixed') {
      taxDescription += ` + R$ ${supplierFeeCost.toFixed(2)} (Taxa Fornecedor)`;
    } else {
      taxDescription += ` + ${supplierFeeVal}% fornecedor = R$ ${supplierFeeCost.toFixed(2)}`;
    }
  }
  if (supplierGatewayCost > 0) {
    if (supplierGatewayFeeType === 'fixed') {
      taxDescription += ` + R$ ${supplierGatewayCost.toFixed(2)} (Gateway Fornecedor)`;
    } else {
      taxDescription += ` + ${supplierGatewayFeePercent}% gateway fornecedor = R$ ${supplierGatewayCost.toFixed(2)}`;
    }
  }

  // Partial cost was totalCost (base + fixed supplier + gateway supplier + pkg + shipping)
  // We need to subtract the variable supplier fee too
  
  // Calculate TikTok SFP fee (6% of selling price when enabled)
  const tiktokSfpFee = (currentMarketplace === 'tiktok' && tiktokSfpEnabled) 
    ? effectiveSellingPrice * 0.06 
    : 0;
  
  const netRevenue = effectiveSellingPrice - marketplaceCost - finalFixedFee - gatewayCost - totalCost - supplierFeeCost - adsCostPerSale - paidTrafficCost - paidTrafficGatewayCost - shopeeCouponTotal - influencerCost - affiliateCost - tiktokSfpFee;
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
    totalFees: (marketplaceCost + finalFixedFee + gatewayCost + paidTrafficCost + adsCostPerSale + pkgCost + supplierFeeCost + supplierGatewayCost + marketplaceShippingCost + paidTrafficGatewayCost + shopeeCouponTotal + influencerCost + affiliateCost + tiktokSfpFee).toFixed(2),
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
          totalAffiliatePercent: totalAffiliatePercent,
          tiktokSfpFee: tiktokSfpFee.toFixed(2)
      };
};
