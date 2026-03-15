import React, { useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { TrendingUp } from 'lucide-react';
import contactBg from '../../imgs/contactbg.jpg';
import type { CalculationResult } from '../../types/calculator';
import { formatCurrency } from '../../utils/currency';
import gsap from 'gsap';

interface ResultsPanelProps {
  calculations: CalculationResult | null;
  marketplace: string;
  productName: string;
  competitorDiscount: string;
  setCompetitorDiscount: (value: string) => void;
  children?: React.ReactNode;
  onClose?: () => void;
}

export const ResultsPanel: React.FC<ResultsPanelProps> = ({
  calculations,
  marketplace,
  productName,
  competitorDiscount,
  setCompetitorDiscount,
  children,
  onClose
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  if (!calculations) return null;

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
                            <p className={`text-sm mb-1 font-bold ${styles.text}`}>Seu Preço</p>
                            <p className={`text-3xl font-bold ${styles.accent}`}>R$ {formatMoney(calculations.manualPrice)}</p>
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
