import { useEffect, useRef, useState } from 'react';
import { formatCompactCurrency, formatCurrency, parseCurrency } from '@/utils/currency';
import type { ProductItem } from '@/types/calculator';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import marketplaceWordpressLogo from '@/imgs/free-woocommerce-icon-svg-download-png-226060.webp';
import marketplaceMercadoLivreLogo from '@/imgs/mercadolivre.svg';
import marketplaceTiktokLogo from '@/imgs/tiktok-shop-seller-cent-icon-filled-256.png';
import marketplaceEnjoeiLogo from '@/imgs/enjoei.svg';
import marketplaceAmazonLogo from '@/imgs/amazon.jpg';
import marketplaceShopeeLogo from '@/imgs/18790-256x256x32.png';
import marketplaceSheinLogo from '@/imgs/shein.svg';
import { gsap } from 'gsap';
import { siFacebook, siInstagram, siKuaishou, siShopee, siTiktok, siWhatsapp, siYoutube, siMercadopago } from 'simple-icons/icons';
import { useProductSalesStats } from '@/hooks/useProductSalesStats';
import { calculateMetrics } from '@/services/pricingService';

interface ProfitProjectionProps {
  product: ProductItem | null;
  onNext?: () => void;
  onPrev?: () => void;
}

type OrganicChannelIcon = {
  hex: string;
  path: string;
};

type OrganicChannelOption = {
  key: string;
  label: string;
  icon?: OrganicChannelIcon;
};

export function ProfitProjection({ product, onNext, onPrev }: ProfitProjectionProps) {
  const [impressions, setImpressions] = useState('');
  const [clicks, setClicks] = useState('');
  const [sales, setSales] = useState('');
  const [cpcEstimado, setCpcEstimado] = useState('');
  const [productVideos, setProductVideos] = useState('');
  const [activeChannelIndex, setActiveChannelIndex] = useState(0);
  const [currentVariationIndex, setCurrentVariationIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const channelBadgeRef = useRef<HTMLDivElement | null>(null);
  const navDirectionRef = useRef<'next' | 'prev' | null>(null);
  const channelNavDirectionRef = useRef<'next' | 'prev' | null>(null);
  const prevProductIdRef = useRef<string | null>(null);
  
  // Buscar estatísticas de vendas do produto
  const { stats: salesStats } = useProductSalesStats(product?.id);
  
  useEffect(() => {
    if (!product?.id) return;
    const container = containerRef.current;
    if (!container) return;
    if (prevProductIdRef.current === null) {
      prevProductIdRef.current = product.id;
      return;
    }
    const direction = navDirectionRef.current;
    const fromX = direction === 'prev' ? -40 : direction === 'next' ? 40 : 0;
    gsap.fromTo(
      container,
      { x: fromX, opacity: 0.6 },
      { x: 0, opacity: 1, duration: 0.35, ease: 'power2.out', clearProps: 'all' }
    );
    prevProductIdRef.current = product.id;
  }, [product?.id]);

  const handlePrev = () => {
    navDirectionRef.current = 'prev';
    onPrev?.();
  };

  const handleNext = () => {
    navDirectionRef.current = 'next';
    onNext?.();
  };

  // Variation navigation handlers
  const variations = product?.variations ?? [];
  const hasVariations = variations.length > 0;
  const slides = hasVariations
    ? [{ kind: 'cover' as const }, ...variations.map((variation) => ({ kind: 'variation' as const, variation }))]
    : [{ kind: 'cover' as const }];
  
  const safeVariationIndex = currentVariationIndex >= slides.length ? 0 : currentVariationIndex;
  const activeVariationIndex = safeVariationIndex;
  const currentSlide = slides[activeVariationIndex] ?? slides[0];
  const currentVariation = currentSlide.kind === 'variation' ? currentSlide.variation : null;
  
  const displayImage = currentSlide.kind === 'variation' && currentVariation?.imageUrl 
    ? currentVariation.imageUrl 
    : product?.imageUrl || 'https://placehold.co/300x300';

  const handleVariationPrev = () => {
    if (slides.length <= 1) return;
    setCurrentVariationIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleVariationNext = () => {
    if (slides.length <= 1) return;
    setCurrentVariationIndex((prev) => (prev + 1) % slides.length);
  };

  const organicChannelOptions: OrganicChannelOption[] = [
    { key: 'youtube_shorts', label: 'Youtube Shorts', icon: siYoutube },
    { key: 'instagram_reels', label: 'Instagram Reels', icon: siInstagram },
    { key: 'tiktok', label: 'Tiktok', icon: siTiktok },
    { key: 'shopee_video', label: 'Shopee Vídeo', icon: siShopee },
    { key: 'kaway_video', label: 'Kaway Video', icon: siKuaishou },
    { key: 'whatsapp', label: 'WhatsApp', icon: siWhatsapp },
    { key: 'facebook_group', label: 'Grupo do Facebook', icon: siFacebook }
  ];
  const organicChannelMap = new Map(organicChannelOptions.map((option) => [option.key, option]));
  const organicChannelKeys = Array.from(
    new Set([
      ...(product?.organicChannels ?? []),
      ...Object.keys(product?.organicChannelLinks ?? {}),
      ...Object.keys(product?.organicChannelNames ?? {})
    ])
  ).filter(Boolean);

  const mercadoAdsEnabled = Boolean(
    product?.mercadoAdsEnabled
    || product?.mercadoAdsDailyBudget
    || product?.mercadoAdsAcosTarget
    || product?.mercadoAdsSelection
    || product?.mercadoAdsSalesQuantity
    || product?.mercadoAdsCpc
    || product?.mercadoAdsConversionRate
  );
  const tiktokAdsEnabled = Boolean(
    product?.tiktokAdsEnabled
    || product?.tiktokDailyBudget
    || product?.tiktokCPA
    || product?.tiktokAdsSalesQuantity
  );
  const shopeeAdsEnabled = Boolean(
    product?.shopeeUseAds
    || product?.shopeeTotalBudget
    || product?.shopeeDailyBudget
    || product?.shopeeStartDate
    || product?.shopeeEndDate
    || product?.shopeeMaxCpc
    || (Array.isArray(product?.shopeeKeywords) && product.shopeeKeywords.length > 0)
  );

  const adsChannels = [];
  if (mercadoAdsEnabled && product?.marketplace === 'mercadolivre') {
    adsChannels.push({ key: 'mercado_ads', label: 'Mercado Ads', icon: siMercadopago });
  }
  if (tiktokAdsEnabled && product?.marketplace === 'tiktok') {
    adsChannels.push({ key: 'tiktok_ads', label: 'TikTok Ads', icon: siTiktok });
  }
  if (shopeeAdsEnabled && product?.marketplace === 'shopee') {
    adsChannels.push({ key: 'shopee_ads', label: 'Shopee Ads', icon: siShopee });
  }

  const organicChannelsList = organicChannelKeys.map((key) => {
    const option = organicChannelMap.get(key);
    const customLabel = product?.organicChannelNames?.[key];
    if (option) {
      return { ...option, label: customLabel || option.label };
    }
    return { key, label: customLabel || key };
  });

  const selectedChannels = [...adsChannels, ...organicChannelsList];
  const channelCount = selectedChannels.length;
  const safeChannelIndex = channelCount === 0 ? 0 : activeChannelIndex % channelCount;
  const activeChannel = selectedChannels[safeChannelIndex];
  const activeChannelKey = activeChannel?.key ?? '';
  const hasChannels = selectedChannels.length > 0;
  const handleChannelPrev = () => {
    if (!hasChannels) return;
    channelNavDirectionRef.current = 'prev';
    setActiveChannelIndex((index) => (index - 1 + selectedChannels.length) % selectedChannels.length);
  };
  const handleChannelNext = () => {
    if (!hasChannels) return;
    channelNavDirectionRef.current = 'next';
    setActiveChannelIndex((index) => (index + 1) % selectedChannels.length);
  };
  useEffect(() => {
    if (!activeChannelKey) return;
    const badge = channelBadgeRef.current;
    if (!badge) return;
    const direction = channelNavDirectionRef.current;
    const fromX = direction === 'prev' ? -30 : direction === 'next' ? 30 : 0;
    gsap.fromTo(
      badge,
      { x: fromX, opacity: 0.6 },
      { x: 0, opacity: 1, duration: 0.3, ease: 'power2.out', clearProps: 'all' }
    );
  }, [activeChannelKey]);

  if (!product) {
    return (
      <div className="rounded-lg bg-white/15 p-4">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs uppercase font-semibold tracking-wide text-white">Projeção de lucros</p>
        </div>
        <div className="text-center py-8 text-white/40">
          <p>Nenhum produto selecionado para projeção</p>
        </div>
      </div>
    );
  }

  const price = parseCurrency(product.sellingPrice || 0);
  const cost = parseCurrency(product.costPrice || 0);

  // Recalculate profit in real-time (same logic as ProductCard) to include affiliates/influencers
  const netRevenue = (() => {
    const mp = product.marketplace || '';
    const sp = parseCurrency(product.sellingPrice ?? 0);
    const cp = parseCurrency(product.costPrice ?? 0);
    if (!mp || (sp <= 0 && cp <= 0)) {
      const stored = product.netRevenue;
      return stored !== undefined && stored !== null && stored !== '' ? parseCurrency(stored) : (price - cost);
    }
    const supplierFeeType = product.supplierFeeType || 'percent';
    const supplierFeeValue = parseCurrency(product.supplierFeeValue ?? 0);
    const supplierGatewayFeeType = product.supplierGatewayFeeType || 'fixed';
    const supplierGatewayFeeValue = parseCurrency(product.supplierGatewayFeeValue ?? 0);
    const supplierGatewayFeePercent = supplierGatewayFeeType === 'percent' ? supplierGatewayFeeValue : 0;
    const supplierGatewayFixedFee = supplierGatewayFeeType === 'fixed' ? supplierGatewayFeeValue : 0;
    const adType = product.adType || 'classico';
    const enjoeiAdType = product.enjoeiAdType || 'classico';
    const category = product.mlCategory || (product as { category?: string }).category || 'eletronicos';
    const accountType = (product.accountType || 'cnpj') as 'cpf' | 'cnpj';
    const shippingOption = product.shippingOption || 'with';
    const mlShipping = parseCurrency(product.mlShippingCost ?? 0);
    const marketplaceShipping = parseCurrency(product.marketplaceShippingCost ?? 0);
    const amazonPlan = product.amazonPlan === 'profissional' ? 'profissional' : 'individual';
    const gatewayFeeType = product.gatewayFeeType || 'percent';
    const gatewayFeeRaw = parseCurrency(product.gatewayFeeValue ?? 0);
    const gatewayFeePercent = gatewayFeeType === 'percent' ? gatewayFeeRaw : 0;
    const gatewayFixedFee = gatewayFeeType === 'fixed' ? gatewayFeeRaw : 0;
    try {
      const metrics = calculateMetrics(
        cp, 0, supplierFeeValue, 0, mp, category, adType, shippingOption, accountType,
        0, false, 0, 0, 0, gatewayFeePercent, sp, 0, 0, 0, marketplaceShipping, 0, 0, 0, mlShipping,
        'percent', gatewayFixedFee, 0, 0, enjoeiAdType, 0,
        product.gatewayBank || '', product.gatewayMethod || '', '', '',
        product.meliPlus ?? false, supplierFeeType, supplierGatewayFeePercent, supplierGatewayFixedFee,
        supplierGatewayFeeType, amazonPlan, category, 0,
        0, 0, 0, 0, 'fixed', 'fixed', 'fixed', 'fixed', 0,
        product.influencers || [], product.affiliates || []
      );
      return parseFloat(String(metrics.netRevenue ?? '0'));
    } catch {
      const stored = product.netRevenue;
      return stored !== undefined && stored !== null && stored !== '' ? parseCurrency(stored) : (price - cost);
    }
  })();
  
  // Use lucro real das vendas se disponível, senão use netRevenue estimado
  const estimatedProfitPerUnit = salesStats.totalSales > 0 
    ? (salesStats.totalProfit / salesStats.totalSales) 
    : netRevenue;

  const scenarios = [
    { units: 50, label: 'VENDER 50 UN' },
    { units: 100, label: 'VENDER 100 UN' },
    { units: 200, label: 'VENDER 200 UN' },
    { units: 300, label: 'VENDER 300 UN' },
    { units: 400, label: 'VENDER 400 UN' },
    { units: 500, label: 'VENDER 500 UN' },
  ];

  const isOrganic = product.trafficMode === 'organic';
  const investmentValue = parseCurrency(product.investmentValue ?? 0);
  const paidTraffic = parseCurrency(product.paidTraffic ?? 0);
  const trafficCost = isOrganic ? 0 : (investmentValue > 0 ? investmentValue : paidTraffic);
  const isPaidTraffic = product.trafficMode === 'paid';
  const disabledInputClass = isPaidTraffic ? 'bg-gray-100 text-gray-500' : 'bg-white';
  const inputSizeClass = 'h-7 text-sm';
  const parseNumber = (value: string) => parseFloat(value.replace(',', '.')) || 0;
  const ctrValue = impressions && clicks && parseNumber(impressions) > 0
    ? ((parseNumber(clicks) / parseNumber(impressions)) * 100).toFixed(2)
    : '0.00';
  const ctrEstimatedValue = ctrValue;
  const marketplaceKey = (product.marketplace || '').toLowerCase().replace(/\s/g, '');
  const formatDateToBr = (value?: string) => {
    if (!value) return '';
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return value;
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [year, month, day] = value.split('-');
      return `${day}/${month}/${year}`;
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    const iso = parsed.toISOString().slice(0, 10);
    const [year, month, day] = iso.split('-');
    return `${day}/${month}/${year}`;
  };
  const shopeeTotalBudget = parseCurrency(product?.shopeeTotalBudget ?? 0);
  const shopeeDailyBudget = parseCurrency(product?.shopeeDailyBudget ?? 0);
  const shopeeMaxCpc = parseCurrency(product?.shopeeMaxCpc ?? 0);

  const mercadoAdsDailyBudget = parseCurrency(product?.mercadoAdsDailyBudget ?? 0);
  const mercadoAdsAcosTarget = parseCurrency(product?.mercadoAdsAcosTarget ?? 0);
  const mercadoAdsSalesQuantity = parseCurrency(product?.mercadoAdsSalesQuantity ?? 0);
  const mercadoAdsCpc = parseCurrency(product?.mercadoAdsCpc ?? 0);
  const mercadoAdsConversionRate = parseCurrency(product?.mercadoAdsConversionRate ?? 0);

  const tiktokDailyBudget = parseCurrency(product?.tiktokDailyBudget ?? 0);
  const tiktokCPA = parseCurrency(product?.tiktokCPA ?? 0);
  const tiktokCPM = parseCurrency(product?.tiktokCPM ?? 0);
  const tiktokCTR = parseCurrency(product?.tiktokCTR ?? 0);
  const tiktokCVR = parseCurrency(product?.tiktokCVR ?? 0);


  const getTiktokAdFormatLabel = (value?: string) => {
    switch(value) {
      case 'in_feed': return 'In-Feed Ads';
      case 'top_view': return 'TopView';
      case 'spark_ads': return 'Spark Ads';
      case 'hashtag_challenge': return 'Hashtag Challenge';
      case 'shopping_ads': return 'Video Shopping Ads';
      default: return value || '-';
    }
  };

  const getTiktokObjectiveLabel = (value?: string) => {
    switch(value) {
      case 'conversions': return 'Conversões';
      case 'video_shopping': return 'Video Shopping';
      case 'traffic': return 'Tráfego';
      case 'reach': return 'Alcance';
      case 'app_install': return 'Instalação de App';
      default: return value || '-';
    }
  };
  const marketplaceLogos: Record<string, string> = {
    wordpress: marketplaceWordpressLogo,
    siteproprio: marketplaceWordpressLogo,
    mercadolivre: marketplaceMercadoLivreLogo,
    tiktok: marketplaceTiktokLogo,
    tiktokshop: marketplaceTiktokLogo,
    enjoei: marketplaceEnjoeiLogo,
    amazon: marketplaceAmazonLogo,
    shopee: marketplaceShopeeLogo,
    shein: marketplaceSheinLogo,
    facebook: 'https://cdn.simpleicons.org/facebook/1877F2'
  };
  const marketplaceLogo = marketplaceLogos[marketplaceKey];
  const marketingTitle = product.name ? `Marketing - ${product.name}` : 'Marketing';

  return (
    <div ref={containerRef} className="h-full rounded-b-2xl rounded-t-none bg-[#FF3366] p-6 text-white shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <span className="text-xs font-bold uppercase tracking-wider opacity-90">PROJEÇÃO DE LUCROS</span>
        <div className="flex items-center gap-2">
           <button onClick={handlePrev} className="p-1 hover:bg-white/20 rounded-full transition-colors">
              <ChevronLeft className="w-4 h-4" />
           </button>
           <span className="text-xs font-medium truncate max-w-[200px] bg-black/20 px-3 py-1 rounded-full">
             {product.name}
           </span>
           <button onClick={handleNext} className="p-1 hover:bg-white/20 rounded-full transition-colors">
              <ChevronRight className="w-4 h-4" />
           </button>
        </div>
      </div>

      <h2 className="text-2xl font-bold mb-2 leading-tight">
        {product.name}
      </h2>
      
      <div className="flex items-center gap-3 mb-6">
        <div className="inline-flex items-center gap-2 rounded-lg bg-black/20 px-3 py-1.5 backdrop-blur-sm">
          <span className="text-xs font-medium text-white/90">Vendas:</span>
          <span className="text-sm font-bold text-white">{salesStats.totalSales}</span>
        </div>
        {adsChannels.length > 0 ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-black/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white/90">
            {adsChannels[0].label}
          </span>
        ) : null}
      </div>

      <div className="flex flex-col md:flex-row gap-6 mb-8">
        <div className="relative w-full max-w-[250px] md:max-w-none mx-auto md:mx-0 md:w-1/3 aspect-square rounded-xl overflow-hidden bg-white flex-shrink-0 group">
          <img 
            src={displayImage} 
            alt={product.name} 
            className="w-full h-full object-contain p-2"
          />
          {slides.length > 1 && (
            <>
              <button
                onClick={handleVariationPrev}
                className="absolute left-0 top-0 bottom-0 bg-black/30 hover:bg-black/50 text-white px-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={handleVariationNext}
                className="absolute right-0 top-0 bottom-0 bg-black/30 hover:bg-black/50 text-white px-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}
        </div>
        
        <div className="flex-1 grid grid-cols-1 gap-4">
             <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold opacity-70 mb-1 uppercase">{product.supplierName || 'FORNECEDOR'}</p>
                  <p className="text-xs font-medium uppercase">{product.accountHolder || 'N/A'} - {product.accountType || 'N/A'}</p>
                </div>
                {marketplaceLogo ? (
                  <img
                    src={marketplaceLogo}
                    alt={`Logo ${product.marketplace || 'marketplace'}`}
                    className="h-12 w-12 object-contain rounded-md bg-white/90 p-1"
                  />
                ) : null}
             </div>
             
             <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#B91C1C] rounded-xl p-2 flex flex-col justify-center items-center text-center shadow-inner">
                    <p className="text-[10px] uppercase font-bold opacity-70 mb-1 text-white">PREÇO DE VENDA</p>
                    <p className="text-xl font-bold text-white">R$ {formatCompactCurrency(price)}</p>
                </div>
                
                <div className="bg-[#B91C1C] rounded-xl p-2 flex flex-col justify-center items-center text-center shadow-inner">
                    <p className="text-[10px] uppercase font-bold opacity-70 mb-1 text-white">{isOrganic ? 'TRÁFEGO ORGÂNICO' : 'TRÁFEGO PAGO'}</p>
                    <p className="text-xl font-bold text-white">R$ {formatCompactCurrency(trafficCost)}</p>
                </div>

                <div className={`${estimatedProfitPerUnit < 3 ? 'bg-red-600' : estimatedProfitPerUnit < 8 ? 'bg-yellow-500' : estimatedProfitPerUnit < 13 ? 'bg-green-600' : 'bg-blue-600'} rounded-xl p-2 flex flex-col justify-center items-center text-center shadow-inner`}>
                    <p className="text-[10px] uppercase font-bold opacity-70 mb-0.5">LUCRO ESTIMADO</p>
                    <p className="text-lg font-bold text-white">R$ {formatCompactCurrency(estimatedProfitPerUnit)}</p>
                </div>
                
                <div className="bg-white/10 rounded-xl p-2 flex flex-col justify-center items-center text-center shadow-inner">
                    <p className="text-[10px] uppercase font-bold opacity-70 mb-0.5">PREÇO DE COMPRA</p>
                    <p className="text-sm font-bold">R$ {formatCompactCurrency(cost)}</p>
                </div>
             </div>
        </div>
      </div>

      {/* Estatísticas Reais de Vendas */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
          <p className="text-xs font-bold opacity-70 mb-2 uppercase text-white">Total de vendas</p>
          <p className="text-2xl font-bold text-white">R$ {formatCompactCurrency(salesStats.totalRevenue)}</p>
          <p className="text-xs opacity-70 mt-1 text-white">{salesStats.totalSales} {salesStats.totalSales === 1 ? 'pedido' : 'pedidos'}</p>
        </div>
        <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
          <p className="text-xs font-bold opacity-70 mb-2 uppercase text-white">Total de lucro</p>
          <p className="text-2xl font-bold text-white">R$ {formatCompactCurrency(salesStats.totalProfit)}</p>
          <p className="text-xs opacity-70 mt-1 text-white">Receita: R$ {formatCompactCurrency(salesStats.totalRevenue)}</p>
        </div>
        <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
          <p className="text-xs font-bold opacity-70 mb-2 uppercase text-white">Total de custo</p>
          <p className="text-2xl font-bold text-white">R$ {formatCompactCurrency(salesStats.totalCost)}</p>
          <p className="text-xs opacity-70 mt-1 text-white">Custo real dos produtos vendidos</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {scenarios.map((scenario) => (
          <div key={scenario.units} className="bg-white/10 rounded-xl p-3 text-center hover:bg-white/20 transition-colors cursor-default flex flex-col items-center justify-center">
            <p className="text-[10px] font-bold uppercase opacity-70 mb-2 whitespace-nowrap">{scenario.label}</p>
            <div className="flex flex-col items-center leading-none">
                <span className="text-xs font-bold opacity-80 mb-1">R$</span>
                <span className="text-lg font-bold">{formatCompactCurrency(estimatedProfitPerUnit * scenario.units).replace('R$ ', '')}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-xl bg-[#CC2952] p-4">
        <p className="text-xs uppercase font-semibold tracking-wide text-white mb-3">{marketingTitle}</p>
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={handleChannelPrev}
            disabled={!hasChannels || selectedChannels.length === 1}
            className="p-1 rounded-full bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4 text-white" />
          </button>
          <div ref={channelBadgeRef} className="flex-1 flex justify-center">
            {activeChannel ? (
              <span className="inline-flex items-center gap-2 rounded-full bg-black/20 px-3 py-1 text-xs font-semibold">
                {activeChannel.icon ? (
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/90">
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill={`#${activeChannel.icon.hex}`} aria-hidden="true">
                      <path d={activeChannel.icon.path} />
                    </svg>
                  </span>
                ) : null}
                {activeChannel.label}
              </span>
            ) : (
              <span className="text-xs text-white/70">Sem canais configurados</span>
            )}
          </div>
          <button
            type="button"
            onClick={handleChannelNext}
            disabled={!hasChannels || selectedChannels.length === 1}
            className="p-1 rounded-full bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-40"
          >
            <ChevronRight className="w-4 h-4 text-white" />
          </button>
        </div>

        {activeChannelKey === 'mercado_ads' && mercadoAdsEnabled ? (
          <div className="rounded-xl bg-black p-4">
            <p className="text-xs uppercase font-semibold tracking-wide text-white mb-3">Mercado Livre Ads</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-white/90">
              <div>Ativo: <span className="font-semibold text-white">{product.mercadoAdsEnabled ? 'Sim' : 'Não'}</span></div>
              <div>Modo de gestão: <span className="font-semibold text-white">{product.mercadoAdsManagementMode === 'personalizado' ? 'Personalizado' : 'Automático'}</span></div>
              <div>Solução: <span className="font-semibold text-white">{product.mercadoAdsSolution === 'display_ads' ? 'Display Ads' : product.mercadoAdsSolution === 'brand_ads' ? 'Brand Ads' : 'Product Ads'}</span></div>
              <div>Seleção: <span className="font-semibold text-white">{product.mercadoAdsSelection || '-'}</span></div>
              <div>Orçamento diário: <span className="font-semibold text-white">R$ {formatCurrency(mercadoAdsDailyBudget || 0) || '0,00'}</span></div>
              <div>CPC Médio: <span className="font-semibold text-white">R$ {formatCurrency(mercadoAdsCpc || 0) || '0,00'}</span></div>
              <div>ACOS alvo: <span className="font-semibold text-white">{mercadoAdsAcosTarget ? `${mercadoAdsAcosTarget}%` : '-'}</span></div>
              <div>Conversão estimada: <span className="font-semibold text-white">{mercadoAdsConversionRate ? `${mercadoAdsConversionRate}%` : '-'}</span></div>
              <div>Vendas esperadas: <span className="font-semibold text-white">{mercadoAdsSalesQuantity || 0}</span></div>
            </div>
          </div>
        ) : activeChannelKey === 'shopee_ads' && shopeeAdsEnabled ? (
          <div className="rounded-xl bg-[#B3254C] p-4">
            <p className="text-xs uppercase font-semibold tracking-wide text-white mb-3">Shopee Ads</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-white/90">
              <div>Ativo: <span className="font-semibold text-white">{product.shopeeUseAds ? 'Sim' : 'Não'}</span></div>
              <div>Tipo de anúncio: <span className="font-semibold text-white">{product.shopeeAdType || '-'}</span></div>
              <div>Tipo de lance: <span className="font-semibold text-white">{product.shopeeBidType || '-'}</span></div>
              <div>Orçamento total: <span className="font-semibold text-white">R$ {formatCurrency(shopeeTotalBudget || 0) || '0,00'}</span></div>
              <div>Data inicial: <span className="font-semibold text-white">{formatDateToBr(product.shopeeStartDate) || '-'}</span></div>
              <div>Data final: <span className="font-semibold text-white">{formatDateToBr(product.shopeeEndDate) || '-'}</span></div>
              <div>Orçamento diário: <span className="font-semibold text-white">R$ {formatCurrency(shopeeDailyBudget || 0) || '0,00'}</span></div>
              <div>CPC máximo: <span className="font-semibold text-white">R$ {formatCurrency(shopeeMaxCpc || 0) || '0,00'}</span></div>
              <div className="sm:col-span-2">Palavras-chave: <span className="font-semibold text-white">{Array.isArray(product.shopeeKeywords) && product.shopeeKeywords.length > 0 ? product.shopeeKeywords.join(', ') : '-'}</span></div>
            </div>
          </div>
        ) : activeChannelKey === 'tiktok_ads' && tiktokAdsEnabled ? (
          <div className="rounded-xl bg-black p-4 border border-white/20">
            <p className="text-xs uppercase font-semibold tracking-wide text-white mb-3">TikTok Ads</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-white/90">
              <div>Ativo: <span className="font-semibold text-white">{product.tiktokAdsEnabled ? 'Sim' : 'Não'}</span></div>
              <div>Formato: <span className="font-semibold text-white">{getTiktokAdFormatLabel(product.tiktokAdFormat)}</span></div>
              <div>Objetivo: <span className="font-semibold text-white">{getTiktokObjectiveLabel(product.tiktokCampaignObjective)}</span></div>
              <div>Público: <span className="font-semibold text-white">{product.tiktokAudience || '-'}</span></div>
              <div>Orçamento diário: <span className="font-semibold text-white">R$ {formatCurrency(tiktokDailyBudget || 0) || '0,00'}</span></div>
              <div>CPA Alvo: <span className="font-semibold text-white">R$ {formatCurrency(tiktokCPA || 0) || '0,00'}</span></div>
              <div>CPM: <span className="font-semibold text-white">R$ {formatCurrency(tiktokCPM || 0) || '0,00'}</span></div>
              <div>CTR: <span className="font-semibold text-white">{formatCurrency(tiktokCTR || 0) || '0,00'}%</span></div>
              <div>CVR: <span className="font-semibold text-white">{formatCurrency(tiktokCVR || 0) || '0,00'}%</span></div>
              <div>Vendas esperadas: <span className="font-semibold text-white">{product.tiktokAdsSalesQuantity || 0}</span></div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] uppercase text-white/70 mb-1">Impressão</p>
              <Input
                type="text"
                inputMode="decimal"
                value={impressions}
                onChange={(e) => setImpressions(e.target.value.replace(/[^\d.,]/g, ''))}
                placeholder="0"
                className={`${inputSizeClass} ${disabledInputClass}`}
                readOnly={isPaidTraffic}
              />
            </div>
            <div>
              <p className="text-[10px] uppercase text-white/70 mb-1">CPC Estimado</p>
              <Input
                type="text"
                inputMode="decimal"
                value={cpcEstimado}
                onChange={(e) => setCpcEstimado(e.target.value.replace(/[^\d.,]/g, ''))}
                placeholder="0,00"
                className={`${inputSizeClass} ${disabledInputClass}`}
                readOnly={isPaidTraffic}
              />
            </div>
            <div>
              <p className="text-[10px] uppercase text-white/70 mb-1">Cliques</p>
              <Input
                type="text"
                inputMode="decimal"
                value={clicks}
                onChange={(e) => setClicks(e.target.value.replace(/[^\d.,]/g, ''))}
                placeholder="0"
                className={`${inputSizeClass} ${disabledInputClass}`}
                readOnly={isPaidTraffic}
              />
            </div>
            <div>
              <p className="text-[10px] uppercase text-white/70 mb-1">CTR (%)</p>
              <Input
                value={ctrValue}
                readOnly
                className={`${inputSizeClass} bg-gray-100 text-gray-500`}
              />
            </div>
            <div>
              <p className="text-[10px] uppercase text-white/70 mb-1">CTR Estimado (%)</p>
              <Input
                value={ctrEstimatedValue}
                readOnly
                className={`${inputSizeClass} bg-gray-100 text-gray-500`}
              />
            </div>
            <div>
              <p className="text-[10px] uppercase text-white/70 mb-1">Vendas</p>
              <Input
                type="text"
                inputMode="decimal"
                value={sales}
                onChange={(e) => setSales(e.target.value.replace(/[^\d.,]/g, ''))}
                placeholder="0"
                className={`${inputSizeClass} bg-gray-100 text-gray-500`}
                readOnly
              />
            </div>
            <div className="sm:col-span-1">
              <p className="text-[10px] uppercase text-white/70 mb-1">Vídeos do Produto</p>
              <Input
                type="text"
                inputMode="decimal"
                value={productVideos}
                onChange={(e) => setProductVideos(e.target.value.replace(/[^\d.,]/g, ''))}
                placeholder="0"
                className={`${inputSizeClass} ${disabledInputClass}`}
                readOnly={isPaidTraffic}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
