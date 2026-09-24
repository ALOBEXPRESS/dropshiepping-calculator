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

  // Status and color metadata based on margin
  const getMarginMeta = () => {
    if (!calculations) {
      return {
        badge: 'Calculando',
        badgeClass: 'bg-muted text-muted-foreground border-border',
        profitColor: 'text-muted-foreground',
        marginColor: 'text-muted-foreground',
      };
    }

    const { marginStatus, actualMargin, recommendedMargin } = calculations;
    const currentMargin = typeof actualMargin === 'string' 
      ? parseFloat(actualMargin.replace(',', '.')) 
      : Number(actualMargin);
    const recommended = Number(recommendedMargin) || 25;

    if (marginStatus === 'negative' || currentMargin < 0) {
      return {
        badge: 'Prejuízo / Margem Negativa',
        badgeClass: 'bg-destructive/15 text-destructive border-destructive/30',
        profitColor: 'text-destructive',
        marginColor: 'text-destructive',
      };
    }

    if (currentMargin >= recommended + 5) {
      return {
        badge: 'Alta Rentabilidade',
        badgeClass: 'bg-brand/15 text-brand border-brand/30',
        profitColor: 'text-brand',
        marginColor: 'text-brand',
      };
    }

    if (currentMargin >= recommended) {
      return {
        badge: 'Margem Saudável',
        badgeClass: 'bg-success/15 text-success border-success/30',
        profitColor: 'text-success',
        marginColor: 'text-success',
      };
    }

    return {
      badge: 'Margem Baixa',
      badgeClass: 'bg-warning/15 text-warning border-warning/30',
      profitColor: 'text-warning',
      marginColor: 'text-warning',
    };
  };

  const meta = getMarginMeta();

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
      className="rounded-2xl border border-border bg-card text-card-foreground shadow-2xl overflow-hidden transition-all duration-300"
    >
      {/* Header */}
      <CardHeader className="p-4 sm:p-5 border-b border-border bg-muted/20 flex flex-row items-center justify-between gap-3 space-y-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-9 w-9 rounded-xl bg-brand/10 text-brand flex items-center justify-center shrink-0 border border-brand/20">
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
        <div className="rounded-xl p-4 sm:p-5 border border-border bg-muted/30 relative overflow-hidden">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs uppercase font-bold tracking-wider text-muted-foreground">
              Preço de Venda Sugerido
            </span>
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${meta.badgeClass}`}>
              {meta.badge}
            </span>
          </div>

          <div className="flex items-baseline gap-1 my-1">
            <span className="text-lg sm:text-xl font-bold text-muted-foreground">R$</span>
            <span className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-foreground tabular-nums">
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
          <div className="rounded-xl p-3.5 sm:p-4 border border-border bg-card shadow-sm">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
              Lucro Líquido
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-xs sm:text-sm font-bold text-muted-foreground">R$</span>
              <span className={`text-xl sm:text-2xl lg:text-3xl font-black tracking-tight tabular-nums ${meta.profitColor}`}>
                {formatMoney(calculations.netRevenue)}
              </span>
            </div>
          </div>

          <div className="rounded-xl p-3.5 sm:p-4 border border-border bg-card shadow-sm text-right">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
              Margem Real
            </p>
            <div className="flex items-baseline justify-end">
              <span className={`text-xl sm:text-2xl lg:text-3xl font-black tracking-tight tabular-nums ${meta.marginColor}`}>
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
