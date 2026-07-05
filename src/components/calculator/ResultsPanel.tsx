import React, { useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { TrendingUp, Loader2, Package, AlertCircle } from 'lucide-react';
import contactBg from '../../imgs/contactbg.jpg';
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
        case 'tiktok': return 'TikTok';
        case 'wordpress': return 'Site Próprio';
        case 'facebook': return 'Facebook';
        case 'olx': return 'OLX';
        default: return slug.charAt(0).toUpperCase() + slug.slice(1);
    }
  };

  const marketplaceName = getMarketplaceName(marketplace);

  // Determine background color based on logic
  const getBackgroundColor = () => {
    if (!calculations) return '#16A34A'; // Default/Initial -> Green
    
    // Rule: Based on margin status and price
    const { marginStatus, actualMargin, recommendedMargin } = calculations;
    
    // Negative -> Red
    if (marginStatus === 'negative') return '#DC2928';

    // Parse margin (format is usually "XX,X" or "XX.X")
    const currentMargin = typeof actualMargin === 'string' 
        ? parseFloat(actualMargin.replace(',', '.')) 
        : Number(actualMargin);

    const recommended = Number(recommendedMargin) || 25; // Default to 25 if missing

    // Blue: Margin >= Recommended + 5%
    if (currentMargin >= (recommended + 5)) {
        return '#25f4ee'; // Cyan/Blue
    }

    // Green: Margin >= Recommended
    if (currentMargin >= recommended) {
        return '#16A34A'; // Green
    }

    // Yellow: Positive but below recommended
    return '#FFA500';
  };

  const bgColor = getBackgroundColor();
  const formatMoney = (value: string | number) => formatCurrency(value);
  const formatPercent = (value: string | number, digits: number = 1) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (Number.isNaN(num)) return '0';
    return num.toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits });
  };

  // Determine styles based on margin status for text contrast
  const getStatusStyles = () => {
    const defaultLight = {
      text: 'text-black',
      subText: 'text-black/80',
      accent: 'text-black',
      inputBorder: 'border-black/20 text-black placeholder-black/50',
      border: 'border-black/10'
    };

    const defaultDark = {
        bg: '', 
        border: 'border-zinc-800/60',
        text: 'text-white',
        subText: 'text-white/90',
        accent: 'text-white', 
        inputBorder: 'border-zinc-700 text-white placeholder-white/50'
    };

    if (!calculations) return defaultDark; // Green needs white text

    const bg = getBackgroundColor();

    // Green (#16A34A) or Red (#DC2928) -> Dark Background -> White Text
    if (bg === '#16A34A' || bg === '#DC2928') {
        return defaultDark;
    }

    // Cyan (#25f4ee) or Orange (#FFA500) -> Light Background -> Black Text
    return defaultLight;
  };

  const styles = getStatusStyles();

  const handleClose = () => {
    if (!onClose) return;

    if (cardRef.current) {
        gsap.to(cardRef.current, {
            opacity: 0,
            y: 20,
            scale: 0.95,
            duration: 0.3,
            ease: "back.in(1.7)",
            onComplete: onClose
        });
    } else {
        onClose();
    }
  };

  return (
    <Card ref={cardRef} className="bg-transparent border-none shadow-xl relative overflow-hidden" style={{ opacity: 1, visibility: 'visible' }}>
        <div className="absolute inset-0 z-0">
            <img src={contactBg} alt="Background" className="w-full h-full object-cover opacity-20" />
            <div className="absolute inset-0 bg-black/10" />
        </div>
        <div className="relative z-10">
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-4">
          <div className="flex flex-row items-center gap-2">
            <TrendingUp className="w-6 h-6 text-white" />
            <CardTitle className="text-2xl font-bold text-white font-iceland">
              Resultado da Precificação - {marketplaceName}
            </CardTitle>
          </div>
          {onClose ? (
            <button
              type="button"
              onClick={handleClose}
              className="text-white/80 hover:text-white text-lg font-bold leading-none"
            >
              ✕
            </button>
          ) : null}
        </CardHeader>
        <CardContent className="p-0">
        {calculations ? (
          <div 
            className={`w-full p-6 rounded-b-xl result-card-content ${styles.text}`}
            style={{ 
              backgroundColor: bgColor,
              transition: 'background-color 0.5s ease-in-out'
            }}
          >
           <div className="space-y-4 result-card-animate">
            {/* Preço de Venda Sugerido */}
            <div>
                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                    <div>
                        <p className={`text-lg mb-1 font-iceland font-bold ${styles.text}`}>Preço de Venda Sugerido</p>
                        
                        {productName && (
                            <p className={`text-lg font-semibold mb-1 ${styles.text}`}>{productName}</p>
                        )}
                        
                        <p className={`text-5xl font-bold ${styles.text}`}>R$ {formatMoney(calculations.suggestedPrice)}</p>
                        
                        <p className={`text-xs mt-2 font-medium ${styles.subText}`}>{calculations.taxDescription}</p>
                        
                        {Number(calculations.gatewayCost) > 0 && (
                            <div className="flex justify-between items-center mt-2 border-t border-black/10 pt-1 gap-2">
                                <span className={`text-xs font-bold ${styles.subText}`}>Taxa Gateway:</span>
                                <span className={`text-xs font-bold ${styles.text}`}>R$ {formatMoney(calculations.gatewayCost)}</span>
                            </div>
                        )}

                        {Number(calculations.paidTrafficCost) > 0 && (
                            <div className="flex justify-between items-center mt-2 border-t border-black/10 pt-1 gap-2">
                                <span className={`text-xs font-bold ${styles.subText}`}>Investimento Tráfego:</span>
                                <span className={`text-xs font-bold ${styles.text}`}>R$ {formatMoney(calculations.paidTrafficCost)}</span>
                            </div>
                        )}
                        
                        {Number(calculations.paidTrafficGatewayCost) > 0 && (
                            <div className="flex justify-between items-center mt-2 border-t border-black/10 pt-1 gap-2">
                                <span className={`text-xs font-bold ${styles.subText}`}>Taxa Gateway Tráfego:</span>
                                <span className={`text-xs font-bold ${styles.text}`}>R$ {formatMoney(calculations.paidTrafficGatewayCost)}</span>
                            </div>
                        )}

                        {marketplace === 'mercadolivre' && productPrice !== undefined && productPrice < 79.00 && Number(calculations.fixedFee) > 0 && (
                            <div className="flex justify-between items-center mt-2 border-t border-black/10 pt-1 gap-2">
                                <div className="flex items-center gap-1">
                                    <span className={`text-xs font-bold ${styles.subText}`}>Taxa Fixa:</span>
                                    <div className="relative group">
                                        <span className={`text-xs cursor-help ${styles.subText}`}>ⓘ</span>
                                        <div className={`absolute left-0 bottom-full mb-2 w-64 p-3 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 ${
                                            calculations.marginStatus === 'negative' 
                                                ? 'bg-zinc-800 border border-zinc-700 text-white' 
                                                : 'bg-white border border-black/20 text-black'
                                        }`}>
                                            <p className={`text-xs font-bold mb-2 ${
                                                calculations.marginStatus === 'negative' ? 'text-white' : 'text-black'
                                            }`}>Faixas de Taxa Fixa do Mercado Livre:</p>
                                            <ul className={`text-xs space-y-1 ${
                                                calculations.marginStatus === 'negative' ? 'text-white/90' : 'text-black/80'
                                            }`}>
                                                <li>• &lt; R$ 12,50: R$ 0,00 (isento)</li>
                                                <li>• R$ 12,50 - R$ 29,00: R$ 6,25</li>
                                                <li>• R$ 29,01 - R$ 50,00: R$ 6,50</li>
                                                <li>• R$ 50,01 - R$ 78,99: R$ 6,75</li>
                                                <li>• ≥ R$ 79,00: R$ 0,00 (isento, mas com frete grátis)</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                                <span className={`text-xs font-bold ${styles.text}`}>R$ {formatMoney(calculations.fixedFee)}</span>
                            </div>
                        )}

                        {Number(calculations.influencerCost) > 0 && (
                            <div className="flex justify-between items-center mt-2 border-t border-black/10 pt-1 gap-2">
                                <span className={`text-xs font-bold ${styles.subText}`}>Influencer ({formatPercent(calculations.totalInfluencerPercent || 0, 1)}%):</span>
                                <span className={`text-xs font-bold ${styles.text}`}>R$ {formatMoney(calculations.influencerCost)}</span>
                            </div>
                        )}

                        {Number(calculations.affiliateCost) > 0 && (
                            <div className="flex justify-between items-center mt-2 border-t border-black/10 pt-1 gap-2">
                                <span className={`text-xs font-bold ${styles.subText}`}>Afiliado ({formatPercent(calculations.totalAffiliatePercent || 0, 1)}%):</span>
                                <span className={`text-xs font-bold ${styles.text}`}>R$ {formatMoney(calculations.affiliateCost)}</span>
                            </div>
                        )}
                    </div>
                    {calculations.manualPrice > 0 && (
                         <div className="text-left md:text-right">
                            <p className="text-sm mb-1 font-bold text-black">Seu Preço</p>
                            <p className="text-3xl font-bold text-black">R$ {formatMoney(calculations.manualPrice)}</p>
                         </div>
                    )}
                </div>

                {/* Profit & Margin Display */}
                <div className={`mt-4 pt-4 border-t ${
                    calculations.marginStatus === 'negative' ? 'border-zinc-800/60' : 'border-black/10'
                } grid grid-cols-2 gap-4`}>
                    <div>
                        <p className={`text-sm font-bold ${styles.subText}`}>Lucro Líquido</p>
                        <p className={`text-2xl font-bold ${styles.accent}`}>
                            R$ {formatMoney(calculations.netRevenue)}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className={`text-sm font-bold ${styles.subText}`}>Margem</p>
                        <p className={`text-2xl font-bold ${styles.accent}`}>
                            {formatPercent(calculations.actualMargin)}%
                        </p>
                    </div>
                </div>
                
                {calculations.manualPrice > 0 && (
                    <div className={`mt-4 pt-4 border-t flex flex-col md:flex-row justify-between items-center gap-2 ${
                        calculations.marginStatus === 'negative' ? 'border-zinc-800/60' : 'border-black/10'
                    }`}>
                        <div>
                            <p className={`text-xs font-bold ${styles.subText}`}>
                                {calculations.increaseApplied > 0 ? 'Acréscimo Aplicado' : 'Desconto Aplicado'} ({formatPercent(Math.abs(calculations.discountPercent), 1)}%)
                            </p>
                            <p className={`font-bold ${
                                (calculations.marginStatus === 'negative' || calculations.marginStatus === 'low')
                                    ? (calculations.discountApplied < 0 ? 'text-green-300' : 'text-white')
                                    : (calculations.discountApplied < 0 ? 'text-green-700' : 'text-black')
                            }`}>
                                R$ {formatMoney(calculations.increaseApplied > 0 ? calculations.increaseApplied : Math.abs(calculations.discountApplied))}
                            </p>
                        </div>
                        <div className="text-left md:text-right">
                            <p className={`text-xs font-bold ${styles.subText}`}>
                                Valor Recomendado {marketplaceName}
                            </p>
                            <p className={`font-bold text-lg ${styles.text}`}>R$ {formatMoney(calculations.recommendedValue)}</p>
                        </div>
                    </div>
                )}
                
                {calculations.competitor > 0 && !calculations.manualPrice && (
                    <div className={`mt-4 pt-4 border-t ${
                        calculations.marginStatus === 'negative' ? 'border-zinc-800/60' : 'border-black/10'
                    }`}>
                         <div className="flex flex-col md:flex-row justify-between items-center gap-2">
                            <div className="text-left">
                                <p className={`text-xs font-bold ${styles.subText}`}>
                                    Valor Recomendado {marketplaceName}
                                </p>
                                <p className={`font-bold text-lg ${styles.text}`}>R$ {formatMoney(calculations.recommendedValue)}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                 <Label htmlFor="competitorMarkup" className={`text-xs font-bold ${styles.subText}`}>Desconto p/ Ganhar:</Label>
                                 <div className="flex items-center gap-2">
                                     <span className={`text-xs font-bold ${styles.subText}`}>- R$</span>
                                     <Input 
                                        id="competitorDiscount"
                                        type="number" 
                                        value={competitorDiscount} 
                                        onChange={(e) => setCompetitorDiscount(e.target.value)} 
                                        step="0.50"
                                        className={`h-8 w-20 text-xs bg-transparent border font-bold ${styles.inputBorder}`}
                                     />
                                 </div>
                            </div>
                         </div>
                         <p className={`text-[10px] mt-1 text-right ${
                            calculations.marginStatus === 'negative' ? 'text-white/70' : 'text-black/50'
                         }`}>
                            O valor recomendado é sempre menor que o concorrente. uma margem de (aproximadamente) 25%
                         </p>
                    </div>
                )}
                
                {/* Shipping Section - Only for Mercado Livre with price >= R$ 79.00 and dimensions filled */}
                {shouldShowShipping && (
                  <div className={`mt-4 pt-4 border-t ${
                    calculations.marginStatus === 'negative' ? 'border-zinc-800/60' : 'border-black/10'
                  }`}>
                    <div className="flex items-center gap-2 mb-3">
                      <Package className={`w-5 h-5 ${styles.text}`} />
                      <h4 className={`text-lg font-bold ${styles.text}`}>Cálculo de Frete</h4>
                    </div>
                    
                    <p className={`text-xs mb-3 ${styles.subText}`}>
                      Produtos acima de R$ 79,00 no Mercado Livre têm frete grátis obrigatório pago pelo vendedor.
                    </p>

                    {/* Region Selection */}
                    <div className="mb-4">
                      <Label className={`text-sm font-bold mb-2 block ${styles.text}`}>
                        Selecione a Região de Destino:
                      </Label>
                      <div className="space-y-2">
                        {supplierLocation && SHIPPING_REGIONS[supplierLocation] && 
                          Object.entries(SHIPPING_REGIONS[supplierLocation]).map(([key, region]) => (
                            <label 
                              key={key} 
                              className={`flex items-center space-x-2 cursor-pointer p-2 rounded ${
                                selectedRegion === key 
                                  ? (calculations.marginStatus === 'negative' ? 'bg-white/10' : 'bg-black/5')
                                  : ''
                              }`}
                            >
                              <input
                                type="radio"
                                name="shipping-region"
                                value={key}
                                checked={selectedRegion === key}
                                onChange={(e) => handleRegionChange(e.target.value)}
                                className="w-4 h-4"
                              />
                              <span className={`text-sm ${styles.text}`}>
                                {key} - {region.name}
                              </span>
                            </label>
                          ))
                        }
                      </div>
                    </div>

                    {/* Loading State */}
                    {loadingShipping && (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className={`w-6 h-6 animate-spin ${styles.text}`} />
                        <span className={`ml-2 text-sm ${styles.text}`}>Calculando frete...</span>
                      </div>
                    )}

                    {/* Error State */}
                    {shippingError && (
                      <div className={`flex items-start gap-2 p-3 rounded-lg mb-4 ${
                        calculations.marginStatus === 'negative' 
                          ? 'bg-red-900/30 border border-red-700' 
                          : 'bg-red-100 border border-red-300'
                      }`}>
                        <AlertCircle className={`w-5 h-5 flex-shrink-0 ${
                          calculations.marginStatus === 'negative' ? 'text-red-400' : 'text-red-600'
                        }`} />
                        <div>
                          <p className={`text-sm font-bold ${
                            calculations.marginStatus === 'negative' ? 'text-red-300' : 'text-red-700'
                          }`}>
                            Erro ao calcular frete
                          </p>
                          <p className={`text-xs ${
                            calculations.marginStatus === 'negative' ? 'text-red-400' : 'text-red-600'
                          }`}>
                            {shippingError}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Shipping Methods */}
                    {!loadingShipping && shippingOptions.length > 0 && (
                      <div className="mb-4">
                        <Label className={`text-sm font-bold mb-2 block ${styles.text}`}>
                          Selecione a Modalidade de Envio:
                        </Label>
                        <div className="space-y-2">
                          {shippingOptions.map((option, index) => (
                            <label
                              key={index}
                              className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer ${
                                selectedShippingMethod === option.name
                                  ? (calculations.marginStatus === 'negative' 
                                      ? 'border-white bg-white/10' 
                                      : 'border-black bg-black/5')
                                  : (calculations.marginStatus === 'negative'
                                      ? 'border-zinc-700 bg-zinc-800/30'
                                      : 'border-black/20 bg-white/50')
                              }`}
                            >
                              <div className="flex items-center space-x-2 flex-1">
                                <input
                                  type="radio"
                                  name="shipping-method"
                                  value={option.name}
                                  checked={selectedShippingMethod === option.name}
                                  onChange={(e) => handleShippingMethodChange(e.target.value)}
                                  className="w-4 h-4"
                                />
                                <div className="flex justify-between items-center flex-1">
                                  <span className={`font-bold text-sm ${styles.text}`}>{option.name}</span>
                                  <div className="text-right">
                                    <div className={`font-bold ${styles.accent}`}>
                                      {formatShippingPrice(option.price)}
                                    </div>
                                    <div className={`text-xs ${styles.subText}`}>
                                      {formatDeliveryTime(option.deliveryTime)}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Selected Shipping Info */}
                    {selectedShippingMethod && (
                      <div className={`p-3 rounded-lg ${
                        calculations.marginStatus === 'negative'
                          ? 'bg-green-900/30 border border-green-700'
                          : 'bg-green-100 border border-green-300'
                      }`}>
                        <p className={`text-sm font-bold ${
                          calculations.marginStatus === 'negative' ? 'text-green-300' : 'text-green-700'
                        }`}>
                          ✓ Frete selecionado: {selectedShippingMethod}
                        </p>
                        <p className={`text-xs ${
                          calculations.marginStatus === 'negative' ? 'text-green-400' : 'text-green-600'
                        }`}>
                          O custo de frete foi incluído no cálculo de lucro e margem.
                        </p>
                      </div>
                    )}
                  </div>
                )}
                
                {children}
            </div>
          </div>
          </div>
        ) : (
            <div className="flex justify-center items-center h-40">
                <p className="text-white/50">Preencha os dados para calcular</p>
            </div>
        )}
        </CardContent>
        </div>
    </Card>
  );
};
