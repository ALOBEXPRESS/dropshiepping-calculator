import React, { useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { TrendingUp, Loader2, Package, AlertCircle, X, CheckCircle2 } from 'lucide-react';
import type { CalculationResult, ShippingOption } from '../../types/calculator';
import { formatCurrency } from '../../utils/currency';
import { calculateShipping, formatShippingPrice, formatDeliveryTime, MelhorEnvioError } from '../../services/melhorEnvioService';
import { SHIPPING_REGIONS, SUPPLIER_ADDRESSES } from '../../services/pricingService';
import gsap from 'gsap';

interface ResultsPanelProps {
  calculations: CalculationResult | null;
  marketplace: string;
  productName: string;
  competitorDiscount: string;
  setCompetitorDiscount: (value: string) => void;
  children?: React.ReactNode;
  onClose?: () => void;
  // Shipping-related props
  productPrice?: number;
  supplierLocation?: string;
  productWeight?: number;
  productHeight?: number;
  productWidth?: number;
  productLength?: number;
  onShippingMethodSelected?: (shippingCost: number, shippingMethod: string, shippingRegion: string) => void;
}

export const ResultsPanel: React.FC<ResultsPanelProps> = ({
  calculations,
  marketplace,
  productName,
  competitorDiscount,
  setCompetitorDiscount,
  children,
  onClose,
  productPrice,
  supplierLocation,
  productWeight,
  productHeight,
  productWidth,
  productLength,
  onShippingMethodSelected
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Shipping state
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [selectedShippingMethod, setSelectedShippingMethod] = useState<string>('');
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [loadingShipping, setLoadingShipping] = useState(false);
  const [shippingError, setShippingError] = useState<string>('');

  if (!calculations) return null;

  // Check if shipping section should be displayed
  const shouldShowShipping = 
    marketplace === 'mercadolivre' && 
    productPrice !== undefined && 
    productPrice >= 79.00 &&
    supplierLocation &&
    productWeight !== undefined &&
    productHeight !== undefined &&
    productWidth !== undefined &&
    productLength !== undefined;

  // Handle region selection
  const handleRegionChange = async (region: string) => {
    setSelectedRegion(region);
    setSelectedShippingMethod('');
    setShippingOptions([]);
    setShippingError('');
    setLoadingShipping(true);

    try {
      // Get supplier address
      const supplierAddress = supplierLocation ? SUPPLIER_ADDRESSES[supplierLocation] : null;
      if (!supplierAddress) {
        throw new Error('Fornecedor não encontrado');
      }

      // Get destination postal code for selected region
      const regionData = supplierLocation ? SHIPPING_REGIONS[supplierLocation]?.[region] : null;
      if (!regionData) {
        throw new Error('Região não encontrada');
      }

      // Call Melhor Envio API
      const options = await calculateShipping(
        supplierAddress.postalCode,
        regionData.postalCode,
        {
          weight: productWeight!,
          height: productHeight!,
          width: productWidth!,
          length: productLength!
        }
      );

      setShippingOptions(options);
    } catch (error) {
      if (error instanceof MelhorEnvioError) {
        setShippingError(error.message);
      } else {
        setShippingError('Erro ao calcular frete. Tente novamente.');
      }
      console.error('Shipping calculation error:', error);
    } finally {
      setLoadingShipping(false);
    }
  };

  // Handle shipping method selection
  const handleShippingMethodChange = (methodName: string) => {
    setSelectedShippingMethod(methodName);
    
    // Find the selected method's price
    const selectedMethod = shippingOptions.find(opt => opt.name === methodName);
    if (selectedMethod && onShippingMethodSelected) {
      onShippingMethodSelected(selectedMethod.price, methodName, selectedRegion);
    }
  };

  const getMarketplaceName = (slug: string) => {
    switch(slug) {
      case 'mercadolivre': return 'Mercado Livre';
      case 'shopee': return 'Shopee';
      case 'tiktok': return 'TikTok Shop';
      case 'wordpress': return 'Site Próprio';
      case 'facebook': return 'Facebook';
      case 'olx': return 'OLX';
      case 'amazon': return 'Amazon';
      case 'enjoei': return 'Enjoei';
      case 'shein': return 'Shein';
      default: return slug ? slug.charAt(0).toUpperCase() + slug.slice(1) : 'Marketplace';
    }
  };

  const marketplaceName = getMarketplaceName(marketplace);

  const formatMoney = (value: string | number) => formatCurrency(value);
  const formatPercent = (value: string | number, digits: number = 1) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (Number.isNaN(num)) return '0';
    return num.toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits });
  };

  // ── Margin theme: drives ALL color of the entire card ─────────────────────
  const getMarginTheme = () => {
    if (!calculations) {
      return {
        key: 'idle',
        badge: 'Calculando',
        cardBg: 'bg-card',
        cardBorder: 'border-border',
        cardGlow: '',
        accentBar: 'bg-muted',
        headerBg: 'bg-muted/20',
        heroBg: 'bg-muted/30',
        heroBorder: 'border-border',
        heroGlow: '',
        badgeBg: 'bg-muted/50 text-muted-foreground border-border',
        kpiColor: 'text-muted-foreground',
        kpiBorder: 'border-border',
        kpiBg: 'bg-card',
      };
    }

    const { marginStatus, actualMargin, recommendedMargin } = calculations;
    const currentMargin = typeof actualMargin === 'string'
      ? parseFloat(actualMargin.replace(',', '.'))
      : Number(actualMargin);
    const recommended = Number(recommendedMargin) || 25;

    // 1. Vermelho — Prejuízo (margem negativa)
    if (marginStatus === 'negative' || currentMargin < 0) {
      return {
        key: 'danger',
        badge: 'Prejuízo',
        cardBg: 'bg-gradient-to-b from-rose-950/80 via-zinc-950/95 to-red-950/50',
        cardBorder: 'border-rose-500/60',
        cardGlow: 'shadow-[0_0_35px_-5px_rgba(244,63,94,0.35),0_0_15px_rgba(244,63,94,0.2)]',
        accentBar: 'bg-gradient-to-r from-rose-600 via-red-500 to-rose-600',
        headerBg: 'bg-rose-500/15',
        heroBg: 'bg-gradient-to-br from-rose-500/20 via-rose-950/40 to-zinc-900/40',
        heroBorder: 'border-rose-500/40',
        heroGlow: 'shadow-[inset_0_1px_0_rgba(244,63,94,0.25)]',
        badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-[0_0_12px_rgba(244,63,94,0.25)]',
        kpiColor: 'text-rose-400',
        kpiBorder: 'border-rose-500/35',
        kpiBg: 'bg-rose-950/40',
      };
    }

    // 2. Azul — Alta Rentabilidade (margem >= recomendada + 5%)
    if (currentMargin >= recommended + 5) {
      return {
        key: 'excellent',
        badge: 'Alta Rentabilidade',
        cardBg: 'bg-gradient-to-b from-cyan-950/80 via-zinc-950/95 to-blue-950/50',
        cardBorder: 'border-cyan-500/60',
        cardGlow: 'shadow-[0_0_35px_-5px_rgba(6,182,212,0.35),0_0_15px_rgba(6,182,212,0.2)]',
        accentBar: 'bg-gradient-to-r from-cyan-500 via-sky-400 to-blue-500',
        headerBg: 'bg-cyan-500/15',
        heroBg: 'bg-gradient-to-br from-cyan-500/20 via-cyan-950/40 to-zinc-900/40',
        heroBorder: 'border-cyan-500/40',
        heroGlow: 'shadow-[inset_0_1px_0_rgba(6,182,212,0.25)]',
        badgeBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.25)]',
        kpiColor: 'text-cyan-400',
        kpiBorder: 'border-cyan-500/35',
        kpiBg: 'bg-cyan-950/40',
      };
    }

    // 3. Verde — Margem Saudável (margem >= recomendada)
    if (currentMargin >= recommended) {
      return {
        key: 'healthy',
        badge: 'Margem Saudável',
        cardBg: 'bg-gradient-to-b from-emerald-950/80 via-zinc-950/95 to-green-950/50',
        cardBorder: 'border-emerald-500/60',
        cardGlow: 'shadow-[0_0_35px_-5px_rgba(16,185,129,0.35),0_0_15px_rgba(16,185,129,0.2)]',
        accentBar: 'bg-gradient-to-r from-emerald-500 via-green-400 to-emerald-500',
        headerBg: 'bg-emerald-500/15',
        heroBg: 'bg-gradient-to-br from-emerald-500/20 via-emerald-950/40 to-zinc-900/40',
        heroBorder: 'border-emerald-500/40',
        heroGlow: 'shadow-[inset_0_1px_0_rgba(16,185,129,0.25)]',
        badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.25)]',
        kpiColor: 'text-emerald-400',
        kpiBorder: 'border-emerald-500/35',
        kpiBg: 'bg-emerald-950/40',
      };
    }

    // 4. Amarelo — Margem Baixa (positiva, porém abaixo da recomendada)
    return {
      key: 'warning',
      badge: 'Margem Baixa',
      cardBg: 'bg-gradient-to-b from-amber-950/80 via-zinc-950/95 to-yellow-950/50',
      cardBorder: 'border-amber-500/60',
      cardGlow: 'shadow-[0_0_35px_-5px_rgba(245,158,11,0.35),0_0_15px_rgba(245,158,11,0.2)]',
      accentBar: 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500',
      headerBg: 'bg-amber-500/15',
      heroBg: 'bg-gradient-to-br from-amber-500/20 via-amber-950/40 to-zinc-900/40',
      heroBorder: 'border-amber-500/40',
      heroGlow: 'shadow-[inset_0_1px_0_rgba(245,158,11,0.25)]',
      badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.25)]',
      kpiColor: 'text-amber-400',
      kpiBorder: 'border-amber-500/35',
      kpiBg: 'bg-amber-950/40',
    };
  };

  const theme = getMarginTheme();

  const handleClose = () => {
    if (!onClose) return;

    if (cardRef.current) {
      gsap.to(cardRef.current, {
        opacity: 0,
        y: 20,
        scale: 0.95,
        duration: 0.25,
        ease: 'power2.in',
        onComplete: onClose
      });
    } else {
      onClose();
    }
  };

  return (
    <Card
      ref={cardRef}
      className={`rounded-2xl border text-card-foreground shadow-2xl overflow-hidden transition-all duration-300 ${theme.cardBg} ${theme.cardBorder} ${theme.cardGlow}`}
    >
      {/* Accent bar — 3px colored line at very top */}
      <div className={`h-[3px] w-full ${theme.accentBar} transition-colors duration-300`} />

      {/* Header */}
      <CardHeader className={`p-4 sm:p-5 border-b border-border flex flex-row items-center justify-between gap-3 space-y-0 transition-colors duration-300 ${theme.headerBg}`}>
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 border transition-colors duration-300 ${theme.kpiBg} ${theme.kpiBorder} ${theme.kpiColor}`}>
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="text-base sm:text-lg font-bold text-foreground font-iceland tracking-tight truncate">
                Resultado da Precificação
              </CardTitle>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border shrink-0">
                {marketplaceName}
              </span>
            </div>
            {productName && (
              <p className="text-xs text-muted-foreground truncate max-w-[280px] sm:max-w-xs mt-0.5">
                {productName}
              </p>
            )}
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={handleClose}
            aria-label="Fechar painel de resultados"
            className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </CardHeader>

      <CardContent className="p-4 sm:p-6 space-y-5">
        {/* Top Hero: Preço de Venda Sugerido */}
        <div className={`rounded-xl p-4 sm:p-5 border relative overflow-hidden transition-colors duration-300 ${theme.heroBg} ${theme.heroBorder} ${theme.heroGlow}`}>
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs uppercase font-bold tracking-wider text-muted-foreground">
              Preço de Venda Sugerido
            </span>
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border transition-colors duration-300 ${theme.badgeBg}`}>
              {theme.badge}
            </span>
          </div>

          <div className="flex items-baseline gap-1 my-1">
            <span className="text-lg sm:text-xl font-bold text-muted-foreground">R$</span>
            <span className={`text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight tabular-nums transition-colors duration-300 ${theme.kpiColor}`}>
              {formatMoney(calculations.suggestedPrice)}
            </span>
          </div>

          {calculations.taxDescription && (
            <p className="text-xs text-muted-foreground mt-1">
              {calculations.taxDescription}
            </p>
          )}

          {/* Subtaxas aplicadas no preço sugerido */}
          <div className="mt-3 pt-3 border-t border-border/60 space-y-1.5 text-xs">
            {Number(calculations.gatewayCost) > 0 && (
              <div className="flex justify-between items-center text-muted-foreground">
                <span>Taxa Gateway:</span>
                <span className="font-semibold text-foreground tabular-nums">R$ {formatMoney(calculations.gatewayCost)}</span>
              </div>
            )}
            {Number(calculations.paidTrafficCost) > 0 && (
              <div className="flex justify-between items-center text-muted-foreground">
                <span>Investimento Tráfego:</span>
                <span className="font-semibold text-foreground tabular-nums">R$ {formatMoney(calculations.paidTrafficCost)}</span>
              </div>
            )}
            {Number(calculations.paidTrafficGatewayCost) > 0 && (
              <div className="flex justify-between items-center text-muted-foreground">
                <span>Taxa Gateway Tráfego:</span>
                <span className="font-semibold text-foreground tabular-nums">R$ {formatMoney(calculations.paidTrafficGatewayCost)}</span>
              </div>
            )}
            {marketplace === 'mercadolivre' && productPrice !== undefined && productPrice < 79.00 && Number(calculations.fixedFee) > 0 && (
              <div className="flex justify-between items-center text-muted-foreground">
                <span>Taxa Fixa (ML):</span>
                <span className="font-semibold text-foreground tabular-nums">R$ {formatMoney(calculations.fixedFee)}</span>
              </div>
            )}
            {Number(calculations.influencerCost) > 0 && (
              <div className="flex justify-between items-center text-muted-foreground">
                <span>Influencer ({formatPercent(calculations.totalInfluencerPercent || 0, 1)}%):</span>
                <span className="font-semibold text-foreground tabular-nums">R$ {formatMoney(calculations.influencerCost)}</span>
              </div>
            )}
            {Number(calculations.affiliateCost) > 0 && (
              <div className="flex justify-between items-center text-muted-foreground">
                <span>Afiliado ({formatPercent(calculations.totalAffiliatePercent || 0, 1)}%):</span>
                <span className="font-semibold text-foreground tabular-nums">R$ {formatMoney(calculations.affiliateCost)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Hero KPIs: Lucro Líquido & Margem Real */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div className={`rounded-xl p-3.5 sm:p-4 border shadow-sm transition-colors duration-300 ${theme.kpiBg} ${theme.kpiBorder}`}>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
              Lucro Líquido
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-xs sm:text-sm font-bold text-muted-foreground">R$</span>
              <span className={`text-xl sm:text-2xl lg:text-3xl font-black tracking-tight tabular-nums transition-colors duration-300 ${theme.kpiColor}`}>
                {formatMoney(calculations.netRevenue)}
              </span>
            </div>
          </div>

          <div className={`rounded-xl p-3.5 sm:p-4 border shadow-sm text-right transition-colors duration-300 ${theme.kpiBg} ${theme.kpiBorder}`}>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
              Margem Real
            </p>
            <div className="flex items-baseline justify-end">
              <span className={`text-xl sm:text-2xl lg:text-3xl font-black tracking-tight tabular-nums transition-colors duration-300 ${theme.kpiColor}`}>
                {formatPercent(calculations.actualMargin)}%
              </span>
            </div>
          </div>
        </div>

        {/* Preço Manual (se definido) */}
        {calculations.manualPrice > 0 && (
          <div className="rounded-xl p-3.5 sm:p-4 border border-border bg-muted/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Seu Preço Manual</p>
              <p className="text-xl font-bold text-foreground tabular-nums">
                R$ {formatMoney(calculations.manualPrice)}
              </p>
            </div>
            <div className="sm:text-right">
              <p className="text-xs font-medium text-muted-foreground">
                {calculations.increaseApplied > 0 ? 'Acréscimo Aplicado' : 'Desconto Aplicado'} ({formatPercent(Math.abs(calculations.discountPercent), 1)}%)
              </p>
              <p className={`text-base font-bold tabular-nums ${
                calculations.discountApplied < 0 ? 'text-success' : 'text-foreground'
              }`}>
                R$ {formatMoney(calculations.increaseApplied > 0 ? calculations.increaseApplied : Math.abs(calculations.discountApplied))}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Recomendado: R$ {formatMoney(calculations.recommendedValue)}
              </p>
            </div>
          </div>
        )}

        {/* Comparação com Concorrente (se preenchido e sem preço manual) */}
        {calculations.competitor > 0 && !calculations.manualPrice && (

          <div className="rounded-xl p-3.5 sm:p-4 border border-border bg-muted/20 space-y-2">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Valor Recomendado {marketplaceName}</p>
                <p className="text-lg font-bold text-foreground tabular-nums">R$ {formatMoney(calculations.recommendedValue)}</p>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="competitorDiscount" className="text-xs font-medium text-muted-foreground">
                  Desconto p/ Ganhar:
                </Label>
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold text-muted-foreground">- R$</span>
                  <Input 
                    id="competitorDiscount"
                    type="number" 
                    value={competitorDiscount} 
                    onChange={(e) => setCompetitorDiscount(e.target.value)} 
                    step="0.50"
                    className="h-8 w-20 text-xs font-bold bg-background border-input tabular-nums"
                  />
                </div>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground text-right">
              O valor recomendado é calculado para ser competitivo garantindo margem saudável.
            </p>
          </div>
        )}

        {/* Shipping Section - Apenas para Mercado Livre com preço >= R$ 79.00 */}
        {shouldShowShipping && (
          <div className="rounded-xl p-4 border border-border bg-muted/20 space-y-3">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-brand" />
              <h4 className="text-sm font-bold text-foreground">Cálculo de Frete (Mercado Livre)</h4>
            </div>
            <p className="text-xs text-muted-foreground">
              Produtos a partir de R$ 79,00 no Mercado Livre possuem frete grátis obrigatório custeado pelo vendedor.
            </p>

            {/* Seleção de Região */}
            <div>
              <Label className="text-xs font-semibold text-foreground mb-2 block">
                Selecione a Região de Destino:
              </Label>
              <div className="space-y-1.5">
                {supplierLocation && SHIPPING_REGIONS[supplierLocation] && 
                  Object.entries(SHIPPING_REGIONS[supplierLocation]).map(([key, region]) => (
                    <label 
                      key={key} 
                      className={`flex items-center space-x-2 cursor-pointer p-2 rounded-lg border text-xs transition-colors ${
                        selectedRegion === key 
                          ? 'border-brand bg-brand/10 text-foreground font-semibold'
                          : 'border-border bg-card text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <input
                        type="radio"
                        name="shipping-region"
                        value={key}
                        checked={selectedRegion === key}
                        onChange={(e) => handleRegionChange(e.target.value)}
                        className="w-3.5 h-3.5 accent-brand"
                      />
                      <span>{key} - {region.name}</span>
                    </label>
                  ))
                }
              </div>
            </div>

            {loadingShipping && (
              <div className="flex items-center justify-center py-3 text-muted-foreground gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-brand" />
                <span className="text-xs font-medium">Calculando frete...</span>
              </div>
            )}

            {shippingError && (
              <div className="flex items-start gap-2 p-3 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Erro ao calcular frete</p>
                  <p className="text-destructive/80">{shippingError}</p>
                </div>
              </div>
            )}

            {!loadingShipping && shippingOptions.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-foreground block">
                  Modalidade de Envio:
                </Label>
                <div className="space-y-1.5">
                  {shippingOptions.map((option, index) => (
                    <label
                      key={index}
                      className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer text-xs transition-colors ${
                        selectedShippingMethod === option.name
                          ? 'border-brand bg-brand/10 text-foreground font-semibold'
                          : 'border-border bg-card text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <div className="flex items-center space-x-2 flex-1">
                        <input
                          type="radio"
                          name="shipping-method"
                          value={option.name}
                          checked={selectedShippingMethod === option.name}
                          onChange={(e) => handleShippingMethodChange(e.target.value)}
                          className="w-3.5 h-3.5 accent-brand"
                        />
                        <span className="font-semibold">{option.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-foreground tabular-nums">
                          {formatShippingPrice(option.price)}
                        </span>
                        <span className="text-[10px] text-muted-foreground ml-1.5">
                          ({formatDeliveryTime(option.deliveryTime)})
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {selectedShippingMethod && (
              <div className="flex items-center gap-2 p-2.5 rounded-lg border border-success/30 bg-success/10 text-success text-xs font-medium">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Frete selecionado: {selectedShippingMethod} (incluído nos cálculos)</span>
              </div>
            )}
          </div>
        )}

        {/* Children (Comparativo rápido, Detalhamento de custos, Vídeos) */}
        {children}
      </CardContent>
    </Card>
  );
};
