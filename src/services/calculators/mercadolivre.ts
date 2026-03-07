
// src/services/calculators/mercadolivre.ts

export interface MercadoLivreParams {
  costPrice: number;
  packagingCost: number;
  shippingCost: number; // Frete pago pelo vendedor (Gratis para o comprador)
  listingType: 'classico' | 'premium' | 'gratis';
  categoryRate: number; // Taxa da categoria (ex: 12% ou 17%)
  desiredMargin: number; // Margem de lucro desejada (%)
  gatewayFee: number; // Taxa do gateway de pagamento (%) se houver
  adsCost: number; // Custo de ads por venda (Fixo em R$)
  otherCosts: number; // Outros custos fixos
  otherVariableRate: number; // Outras taxas variáveis (%) ex: Tráfego Pago
}

export interface CalculationResult {
  suggestedPrice: number;
  netProfit: number;
  actualMargin: number;
  totalFees: number;
  fixedFee: number;
  commissionAmount: number;
  taxDescription: string;
}

/**
 * Calcula a taxa fixa do Mercado Livre baseada no preço de venda
 */
export const getFixedFee = (price: number, listingType: string): number => {
  if (listingType === 'gratis') return 0;

  if (price < 12.50) {
    return price * 0.5;
  }
  if (price < 79) return 6.00;
  return 0; // Acima de 79 não tem taxa fixa (tem frete grátis geralmente)
};

/**
 * Calcula o preço de venda sugerido para atingir a margem desejada
 */
export const calculateSellingPrice = (params: MercadoLivreParams): CalculationResult => {
  const {
    costPrice,
    packagingCost,
    shippingCost,
    listingType,
    categoryRate,
    desiredMargin,
    gatewayFee,
    adsCost,
    otherCosts,
    otherVariableRate
  } = params;

  const baseCosts = costPrice + packagingCost + shippingCost + adsCost + otherCosts;
  const totalVariableRate = (categoryRate + desiredMargin + gatewayFee + otherVariableRate) / 100;

  // Função para testar um preço candidato
  const tryPrice = (fixedFee: number | ((p: number) => number)): number => {
    if (typeof fixedFee === 'function') {
      const denominator = 0.5 - totalVariableRate;
      if (denominator <= 0) return Infinity; 
      return baseCosts / denominator;
    }
    const denominator = 1 - totalVariableRate;
    if (denominator <= 0) return Infinity;
    return (baseCosts + fixedFee) / denominator;
  };

  let finalPrice = 0;
  let appliedFixedFee = 0;

  // Ranges definition (Price Min, Price Max, Fixed Fee)
  // Max is exclusive, Min is inclusive.
  const ranges = [
      { min: 79, max: Infinity, fee: 0 },
      { min: 12.50, max: 79, fee: 6.00 },
      { min: 0, max: 12.50, fee: (p: number) => p * 0.5 }
  ];

  let bestFallbackPrice = 0;

  for (const range of ranges) {
      const p = tryPrice(range.fee);
      
      // Check if valid in range
      if (p >= range.min && p < range.max) {
          finalPrice = p;
          appliedFixedFee = typeof range.fee === 'function' ? range.fee(p) : range.fee;
          break; // Exact match found
      }

      // If p > max, it means we calculated a price that pushes us into a higher (cheaper fee) bracket.
      // This is a "safe" price (conservative), as we calculated it assuming a higher fee than we will actually pay.
      // We keep the smallest of these "over-shot" prices as a fallback.
      if (p >= range.max) {
          if (bestFallbackPrice === 0 || p < bestFallbackPrice) {
              bestFallbackPrice = p;
          }
      }
  }

  // If no exact match, use fallback
  if (finalPrice === 0 && bestFallbackPrice > 0) {
      finalPrice = bestFallbackPrice;
      // Re-calculate fee for this price (it will likely be 0 or lower tier)
      appliedFixedFee = getFixedFee(finalPrice, listingType);
  } else if (finalPrice === 0) {
      // Fallback for extreme cases (e.g. impossible margins)
      finalPrice = baseCosts * 2; // Fail safe
      appliedFixedFee = getFixedFee(finalPrice, listingType);
  }

  // Recalcular métricas finais com o preço determinado
  const commissionAmount = finalPrice * (categoryRate / 100);
  const gatewayAmount = finalPrice * (gatewayFee / 100);
  const totalFees = commissionAmount + appliedFixedFee + gatewayAmount;
  const netProfit = finalPrice - baseCosts - totalFees;
  const actualMargin = (netProfit / finalPrice) * 100;

  // Descrição da taxa
  let taxDesc = '';
  if (listingType === 'gratis') {
    taxDesc = 'Grátis (0%)';
  } else {
    taxDesc = `${categoryRate}% Comissão`;
    if (appliedFixedFee > 0) {
      taxDesc += ` + R$ ${appliedFixedFee.toFixed(2)} (Fixo)`;
    }
    if (finalPrice >= 79 && shippingCost > 0) {
       taxDesc += ` + Frete Grátis Pago`;
    }
  }

  return {
    suggestedPrice: finalPrice,
    netProfit,
    actualMargin,
    totalFees,
    fixedFee: appliedFixedFee,
    commissionAmount,
    taxDescription: taxDesc
  };
};

/**
 * Calcula o lucro e margem dado um preço de venda manual
 */
export const calculateProfitFromPrice = (price: number, params: MercadoLivreParams): CalculationResult => {
  const {
    costPrice,
    packagingCost,
    shippingCost,
    listingType,
    categoryRate,
    gatewayFee,
    adsCost,
    otherCosts,
    otherVariableRate
  } = params;

  const baseCosts = costPrice + packagingCost + shippingCost + adsCost + otherCosts;
  const fixedFee = getFixedFee(price, listingType);
  const commissionAmount = price * (categoryRate / 100);
  const gatewayAmount = price * (gatewayFee / 100);
  const otherVariableAmount = price * (otherVariableRate / 100);
  
  const totalFees = commissionAmount + fixedFee + gatewayAmount + otherVariableAmount;
  const netProfit = price - baseCosts - totalFees;
  const actualMargin = (netProfit / price) * 100;

  let taxDesc = '';
  if (listingType === 'gratis') {
    taxDesc = 'Grátis (0%)';
  } else {
    taxDesc = `${categoryRate}% Comissão`;
    if (fixedFee > 0) {
      taxDesc += ` + R$ ${fixedFee.toFixed(2)} (Fixo)`;
    }
    if (price >= 79 && shippingCost > 0) {
       taxDesc += ` + Frete Grátis Pago`;
    }
  }

  return {
    suggestedPrice: price, // Neste caso é o preço manual
    netProfit,
    actualMargin,
    totalFees,
    fixedFee,
    commissionAmount,
    taxDescription: taxDesc
  };
};
