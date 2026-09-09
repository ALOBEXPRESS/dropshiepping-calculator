import React, { useEffect, useRef, useState } from 'react';
import { Trash2, Edit2, ChevronLeft, ChevronRight, RefreshCw, Loader2, DollarSign } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import ElectricBorder from '@/components/ui/ElectricBorder';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { ProductItem } from '../../types/calculator';
import meliPlusLogo from '../../imgs/pill-meliplus@3x.png';
import reputationExcellentIllustration from '../../imgs/ilustracao-reputacao-mercado-livre.png';
import wooCommerceLogo from '../../imgs/free-woocommerce-icon-svg-download-png-226060.webp';
import androidLogo from '../../imgs/android.png';
import shopeeLogo from '../../imgs/18790-256x256x32.png';
import amazonLogo from '../../imgs/amazon.jpg';
import sheinLogo from '../../imgs/shein.svg';
import enjoeiLogo from '../../imgs/enjoei.svg';
import tiktokLogo from '../../imgs/tiktok-shop-seller-cent-icon-filled-256.png';
import mercadoLivreLogo from '../../imgs/mercadolivre.svg';
import freeShippingLogo from '../../imgs/fretegratis.svg';
import shopeeCouponBadge from '../../imgs/cupom-shopee.webp';
import grokLogo from '../../imgs/Grok-feb-2025-logo.svg.png';
import veo3Logo from '../../imgs/Google-Veo-3-1024x576.webp';
import sora2Logo from '../../imgs/sora2.webp';
import wan2Logo from '../../imgs/Wan2.png';
import copiaLogo from '../../imgs/pirata.svg';
import klingLogo from '../../imgs/kling-color.png';
import runwayLogo from '../../imgs/runway.png';
import pikaLogo from '../../imgs/pika.webp';
import lumaLogo from '../../imgs/luma.png';
import seedanceLogo from '../../imgs/seedance.png';
import shopeeAdsMoney from '../../imgs/3d-render-realistic-currency-money-brazil-200-reais.png';
import dollarImage from '../../imgs/dólar.png';
import commissionIcon from '../../imgs/comission.png';
import olxLogo from '../../imgs/olx.png';
import tiktokOff5 from '../../imgs/5OFF.png';
import tiktokOff10 from '../../imgs/10OFF.png';
import tiktokOff15 from '../../imgs/15OFF.png';
import tiktokOff20 from '../../imgs/20OFF.png';
import tiktokOff25 from '../../imgs/25OFF.png';
import tiktokOff30 from '../../imgs/30OFF.png';
import tiktokOff35 from '../../imgs/35OFF.png';
import tiktokOff40 from '../../imgs/40OFF.png';
import { parseCurrency } from '../../utils/currency';
import { calculateMetrics } from '../../services/pricingService';
import { useTiktokCommission } from '../../hooks/useTiktokCommission';
import { AnimatedCard } from '../ui/AnimatedCard';
import gsap from 'gsap';
import { useProductSalesStats } from '../../hooks/useProductSalesStats';

// Componente separado para painel de vídeo promocional
interface PromoVideoPanelProps {
  channelKey: string;
  product: ProductItem;
  channelBadges: Record<string, { label: string; bgColor: string; textColor: string }>;
  cardPanelsCount: number;
}

const PromoVideoPanel: React.FC<PromoVideoPanelProps> = ({ channelKey, product, channelBadges, cardPanelsCount }) => {
  const channelLabel = {
    youtube_shorts: 'YouTube Shorts',
    kaway_video: 'Kaway Video',
    tiktok: 'TikTok',
    instagram_reels: 'Instagram Reels',
    whatsapp: 'WhatsApp',
    grupo_facebook: 'Grupo Facebook',
    shopee_video: 'Shopee Video'
  }[channelKey] || channelKey;
  
  const channelBadgeInfo = channelBadges[channelKey];
  const videoLink = product.promoVideoChannelLinks?.[channelKey] || '';
  const groupName = product.promoVideoChannelNames?.[channelKey] || '';
  const isGroupChannel = channelKey === 'whatsapp' || channelKey === 'grupo_facebook';
  
  // Extrair URL do iframe ou usar URL direta
  const iframeMatch = videoLink.match(/src=["']([^"']+)["']/);
  const videoUrl = iframeMatch && iframeMatch[1] ? iframeMatch[1] : videoLink;
  
  // Detectar se é TikTok e extrair video ID
  const isTikTok = videoUrl.includes('tiktok.com');
  
  // Extrair video ID do TikTok
  let tiktokVideoId = '';
  if (isTikTok) {
    const tiktokMatch = videoUrl.match(/\/video\/(\d+)/);
    if (tiktokMatch && tiktokMatch[1]) {
      tiktokVideoId = tiktokMatch[1];
    }
  }
  
  const isIframe = videoLink.includes('<iframe') || videoLink.includes('streamable.com');
  const useTikTokEmbed = isTikTok && tiktokVideoId;
  
  return (
    <div className="min-w-0 flex-shrink-0 px-2 flex flex-col justify-start" style={{ width: `${100 / cardPanelsCount}%` }}>
      <div className="w-full rounded-xl border border-border p-3">
        {/* Container para TikTok embed ajustado (180x315) */}
        <div className="mx-auto mb-6" style={{ width: '184px' }}>
          <ElectricBorder
            color="#fe2c55"
            speed={1}
            chaos={0.05}
            thickness={2}
            style={{ borderRadius: 12 }}
          >
            <div className="relative overflow-hidden rounded-lg" style={{ width: '180px', height: '315px', background: 'transparent' }}>
          {useTikTokEmbed ? (
            // TikTok iframe direto usando oembed
            <iframe
              src={`https://www.tiktok.com/embed/v2/${tiktokVideoId}`}
              allow="encrypted-media;"
              allowFullScreen
              className="absolute inset-0 h-full w-full border-none"
              style={{ 
                border: 'none', 
                width: '100%', 
                height: '100%', 
                position: 'absolute', 
                left: 0, 
                top: 0, 
                overflow: 'hidden',
                borderRadius: '0.5rem'
              }}
              title={`Vídeo ${channelLabel}`}
              loading="lazy"
              scrolling="no"
            />
          ) : isIframe ? (
            <iframe
              src={videoUrl}
              allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 h-full w-full border-none"
              style={{ 
                border: 'none', 
                width: '100%', 
                height: '100%', 
                position: 'absolute', 
                left: 0, 
                top: 0, 
                overflow: 'hidden',
                borderRadius: '0.5rem'
              }}
              title={`Vídeo ${channelLabel}`}
              loading="lazy"
              scrolling="no"
            />
          ) : (
            <video
              src={videoUrl}
              autoPlay
              loop
              muted
              playsInline
              controls={false}
              className="absolute inset-0 h-full w-full object-cover bg-black"
              onError={(e) => {
                const target = e.target as HTMLVideoElement;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent) {
                  parent.innerHTML = '<div class="absolute inset-0 flex items-center justify-center text-[10px] text-muted-foreground">Erro ao carregar vídeo</div>';
                }
              }}
            />
          )}
          
          {/* Overlay clicável para abrir vídeo em nova aba */}
          <a
            href={videoLink}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute inset-0 z-20 cursor-pointer"
            title={`Abrir vídeo no ${channelLabel}`}
          />
          
          {/* Badge do Canal */}
          {channelBadgeInfo && (
            <div className={`absolute top-2 right-2 ${channelBadgeInfo.bgColor} ${channelBadgeInfo.textColor} px-2 py-1 rounded-md text-[10px] font-bold shadow-lg z-30`}>
              {channelBadgeInfo.label}
            </div>
          )}
        </div>
        </ElectricBorder>
        </div>
        
        {/* Informações do Canal */}
        <div className="space-y-3">
          {isGroupChannel && groupName && (
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-muted-foreground uppercase">Nome do Grupo</span>
              <span className="text-xs font-semibold text-foreground">{groupName}</span>
            </div>
          )}
          {product.promoVideoChannelCopies && product.promoVideoChannelCopies[channelKey] && (
            <div className="flex flex-col gap-2">
              <span className="text-[10px] text-muted-foreground uppercase">Copy</span>
              <p className="text-xs text-foreground leading-relaxed max-h-48 overflow-y-auto p-2 bg-muted/30 rounded-md">{product.promoVideoChannelCopies[channelKey]}</p>
            </div>
          )}
          <div className="flex gap-4">
            <div className="flex flex-col gap-1 flex-1">
              <span className="text-[10px] text-muted-foreground uppercase">Canal</span>
              <span className="text-xs font-semibold text-foreground">{channelLabel}</span>
            </div>
            {product.videoGenerationLlm && (
              <div className="flex flex-col gap-1 flex-1">
                <span className="text-[10px] text-muted-foreground uppercase">Model Video</span>
                <span className="text-xs font-semibold text-foreground">
                  {product.videoGenerationLlm === 'veo3' && 'Veo3'}
                  {product.videoGenerationLlm === 'sora2' && 'Sora2'}
                  {product.videoGenerationLlm === 'grok' && 'Grok'}
                  {product.videoGenerationLlm === 'wan2' && 'Wan 2'}
                  {product.videoGenerationLlm === 'copia' && 'Cópia'}
                  {product.videoGenerationLlm === 'kling' && 'Kling'}
                  {product.videoGenerationLlm === 'runway' && 'Runway'}
                  {product.videoGenerationLlm === 'pika25' && 'Pika 2.5'}
                  {product.videoGenerationLlm === 'luma' && 'Luma'}
                  {product.videoGenerationLlm === 'seedance' && 'Seedance'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

interface ProductCardProps {
  product: ProductItem;
  onDelete: (id: string) => void;
  onEdit: (product: ProductItem) => void;
  onBlingUpdate: (product: ProductItem) => void;
  isUpdatingBling?: boolean;
  onInvestSave: (product: ProductItem) => void;
  organizationId?: string;
}

export const ProductCard: React.FC<ProductCardProps> = React.memo(({ product, onDelete, onEdit, onBlingUpdate, isUpdatingBling, onInvestSave, organizationId }) => {
  const [currentVarIndex, setCurrentVarIndex] = useState(0);
  const [isInvestOpen, setIsInvestOpen] = useState(false);
  const [isInvestReadonly, setIsInvestReadonly] = useState(false);
  const [isBlingConfirmOpen, setIsBlingConfirmOpen] = useState(false);
  const [investStep, setInvestStep] = useState(0);
  
  // Campanhas existentes para seleção no modal Investir
  const [availableCampaigns, setAvailableCampaigns] = useState<Array<{
    id: string;
    name: string;
    objective: string;
    budget_type: string;
    budget_amount: number | null;
    campaign_ad_sets?: Array<{
      id: string;
      name: string | null;
      conversion_type: string | null;
      traffic_destination: string | null;
      optimization_goal: string | null;
      target_cost_per_result: number | null;
      start_date: string | null;
      end_date: string | null;
      audience_mode: string | null;
      saved_audience_name: string | null;
      audience_location: string | null;
      audience_age: string | null;
      audience_gender: string | null;
      audience_interests: string | null;
      audience_behavior: string | null;
      ad_media_url: string | null;
      ad_redirect_url: string | null;
      ad_text: string | null;
      ad_title: string | null;
      ad_cta: string | null;
      ad_media_type: string | null;
    }>;
    campaign_products?: Array<{ marketing_cost_override: number | null }>;
  }>>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
  
  // Buscar vendas reais do produto
  const { stats: salesStats } = useProductSalesStats(product.id);
  const tiktokCommission = useTiktokCommission();
  
  const [investData, setInvestData] = useState({
    campaignName: '',
    campaignObjective: '',
    budgetType: '',
    // step 1 — Nível de Conjunto
    trafficDestination: '',       // site | tiktok_shop | app
    optimizationGoal: '',         // click | landing_page_view | engagement_session
    targetCostPerResult: '',      // custo alvo por resultado (opcional)
    startDate: new Date().toLocaleDateString('pt-BR'),
    endDate: '',
    investmentValue: '',
    // ad sets da campanha selecionada (read-only display)
    adSetsDisplay: [] as Array<{ id: string; name: string | null; budget?: number | null }>,
    audienceLocation: '',
    audienceAge: '',
    audienceGender: '',
    audienceInterests: '',
    audienceBehavior: '',
    audienceMode: 'auto' as 'auto' | 'manual' | 'saved',
    savedAudienceName: '',
    placement: '',
    adText: '',
    adTitle: '',
    adMedia: '',
    adCta: '',
    adUrl: '',
    adRedirectUrl: '',
    instagramAccount: '',
    instantForm: false
  });
  const [cardPanelIndex, setCardPanelIndex] = useState(0);
  const cardSliderRef = useRef<HTMLDivElement | null>(null);
  const variations = product.variations ?? [];
  const normalizedVariations = variations.map((variation) => ({
    ...variation,
    variationType: variation.variationType ?? 'size'
  }));
  const hasVariations = normalizedVariations.length > 0;
  const slides = hasVariations
    ? [{ kind: 'cover' as const }, ...normalizedVariations.map((variation) => ({ kind: 'variation' as const, variation }))]
    : [{ kind: 'cover' as const }];
  const activeIndex = currentVarIndex >= slides.length ? 0 : currentVarIndex;
  const currentSlide = slides[activeIndex] ?? slides[0];
  const currentData = currentSlide.kind === 'variation' ? currentSlide.variation : null;
  const currentColorLabel = currentSlide.kind === 'variation' && currentData?.variationType === 'color'
    ? (currentData?.name ?? '')
    : '';
  const normalizeColorLabel = (value?: string) => {
    if (!value) return '';
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/^cor\s*[:-]?\s*/g, '')
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };
  const colorSwatchMap: Record<string, React.CSSProperties> = {
    branco: { backgroundColor: '#ffffff' },
    preto: { backgroundColor: '#111827' },
    vermelho: { backgroundColor: '#ef4444' },
    laranja: { backgroundColor: '#f97316' },
    amarelo: { backgroundColor: '#facc15' },
    azul: { backgroundColor: '#3b82f6' },
    'azul claro': { backgroundColor: '#60a5fa' },
    verde: { backgroundColor: '#22c55e' },
    rosa: { backgroundColor: '#f472b6' },
    'rosa chiclete': { backgroundColor: '#ff4dd2' },
    roxo: { backgroundColor: '#a855f7' },
    lilas: { backgroundColor: '#c084fc' },
    cinza: { backgroundColor: '#9ca3af' },
    marrom: { backgroundColor: '#8b5e3c' },
    pink: { backgroundColor: '#ec4899' },
    bege: { backgroundColor: '#d6c4a8' }
  };
  const getColorSwatchStyle = (value?: string): React.CSSProperties => {
    const normalized = normalizeColorLabel(value);
    if (!normalized) return { backgroundColor: '#e5e7eb' };
    if (normalized.includes('sortida')) {
      return { backgroundImage: 'conic-gradient(#ef4444, #f97316, #facc15, #22c55e, #3b82f6, #a855f7, #ef4444)' };
    }
    if (normalized.includes('bege') && normalized.includes('preto')) {
      return { backgroundImage: 'linear-gradient(135deg, #d6c4a8 0%, #d6c4a8 50%, #111827 50%, #111827 100%)' };
    }
    if (normalized.includes('azul') && normalized.includes('claro')) {
      return colorSwatchMap['azul claro'];
    }
    if (normalized.includes('rosa') && normalized.includes('chiclete')) {
      return colorSwatchMap['rosa chiclete'];
    }
    const direct = colorSwatchMap[normalized];
    if (direct) return direct;
    const matched = Object.entries(colorSwatchMap).find(([key]) => normalized.includes(key));
    if (matched) return matched[1];
    return { backgroundColor: '#e5e7eb' };
  };
  
  // Variation data fallback to product main data if missing (e.g. image)
  const displayImage = currentSlide.kind === 'variation' && currentData?.imageUrl 
    ? currentData.imageUrl 
    : product.imageUrl;
  const displayName = currentSlide.kind === 'variation'
    ? `${product.name} - ${currentData?.name ?? ''}`.trim()
    : product.name;
  const displaySku = currentSlide.kind === 'variation' && currentData?.sku
    ? currentData.sku
    : product.sku;
  
  // Check if we should show variation image instead of color swatch
  const shouldShowVariationImage = currentSlide.kind === 'variation' && currentData?.imageUrl;
  
  // Metrics
  const sellingPrice = currentSlide.kind === 'variation'
    ? currentData?.manualPrice ?? currentData?.suggestedPrice
    : product.sellingPrice;
  const costPrice = currentSlide.kind === 'variation' ? currentData?.cost : product.costPrice;
  const netRevenue = currentSlide.kind === 'variation' ? currentData?.netRevenue : product.netRevenue;
  const stockQuantity = typeof product.stockQuantity === 'number' && Number.isFinite(product.stockQuantity)
    ? product.stockQuantity
    : 0;

  // Recalculate profit in real-time for the main product to avoid stale DB values
  const calculatedNetRevenue = (() => {
    if (currentSlide.kind === 'variation') {
      return typeof netRevenue === 'number' ? netRevenue : parseFloat(netRevenue as string);
    }
    const mp = product.marketplace || '';
    const sp = parseCurrency(product.sellingPrice ?? 0);
    const cp = parseCurrency(product.costPrice ?? 0);
    if (!mp || (sp <= 0 && cp <= 0)) {
      return typeof netRevenue === 'number' ? netRevenue : parseFloat(netRevenue as string);
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
        0, false, 0, 0, 0, gatewayFeePercent, sp, 0, 0, tiktokCommission, marketplaceShipping, 0, 0, 0, mlShipping,
        'percent', gatewayFixedFee, 0, 0, enjoeiAdType, 0,
        product.gatewayBank || '', product.gatewayMethod || '', '', '',
        product.meliPlus ?? false, supplierFeeType, supplierGatewayFeePercent, supplierGatewayFixedFee,
        supplierGatewayFeeType, amazonPlan, category, 0,
        (product.shopeeStoreCouponEnabled ? parseCurrency(product.shopeeStoreCouponValue ?? 0) : 0),
        (product.shopeeProductCouponEnabled ? parseCurrency(product.shopeeProductCouponValue ?? 0) : 0),
        (product.shopeeFollowerCouponEnabled ? parseCurrency(product.shopeeFollowerCouponValue ?? 0) : 0),
        (product.shopeeSellerVoucherEnabled ? parseCurrency(product.shopeeSellerVoucherValue ?? 0) : 0),
        (product.shopeeStoreCouponType || 'fixed') as 'fixed' | 'percent',
        (product.shopeeProductCouponType || 'fixed') as 'fixed' | 'percent',
        (product.shopeeFollowerCouponType || 'fixed') as 'fixed' | 'percent',
        (product.shopeeSellerVoucherType || 'fixed') as 'fixed' | 'percent',
        0,
        product.influencers || [], product.affiliates || [],
        product.tiktokSfpEnabled ?? false,
        parseCurrency(product.tiktokPromoProductValue ?? 0),
        product.tiktokPromoProductType || 'fixed'
      );
      return parseFloat(String(metrics.netRevenue ?? '0'));
    } catch {
      return typeof netRevenue === 'number' ? netRevenue : parseFloat(netRevenue as string);
    }
  })();

  const profitValue = Number.isFinite(calculatedNetRevenue) ? calculatedNetRevenue : 0;
  const profitBadgeClass = Number.isFinite(profitValue)
    ? profitValue < 3
      ? 'bg-red-600'
      : profitValue < 8
        ? 'bg-yellow-500'
        : profitValue < 13
          ? 'bg-green-600'
          : 'bg-blue-600'
    : 'bg-red-600';
  const profitTextClass = Number.isFinite(profitValue)
    ? profitValue < 3
      ? 'text-red-600'
      : profitValue < 8
        ? 'text-yellow-500'
        : profitValue < 13
          ? 'text-green-600'
          : 'text-blue-600'
    : 'text-red-600';
  
  const handlePrevVar = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentVarIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleNextVar = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentVarIndex((prev) => (prev + 1) % slides.length);
  };

  const formatMoney = (val: string | number | undefined) => {
      const num = parseCurrency(val ?? 0);
      return `R$ ${num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };
  const formatDateInputBr = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 8);
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
  };
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
  const formatDateToIso = (value?: string) => {
    if (!value) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
      const [day, month, year] = value.split('/');
      return `${year}-${month}-${day}`;
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toISOString().slice(0, 10);
  };

  const getMarketplaceLabel = (value: string | undefined) => {
    if (!value) return '';
    switch(value) {
      case 'mercadolivre': return <span className="text-yellow-500">Mercado Livre</span>;
      case 'shopee': return <span className="text-orange-500">Shopee</span>;
      case 'tiktok': return <span className="text-[#FF3366]">TikTok</span>;
      case 'wordpress': return <span className="text-[#9C5D90]">Site Próprio</span>;
      case 'enjoei': return <span className="text-[#61005D]">Enjoei</span>;
      case 'shein': return 'Shein';
      case 'amazon': return 'Amazon';
      case 'facebook': return 'Facebook';
      case 'olx': return 'OLX';
      default: return value.charAt(0).toUpperCase() + value.slice(1);
    }
  };
  const getOperationModeLabel = (value: ProductItem['operationMode']) => {
    if (value === 'armazem_alob') return 'Estoque Próprio';
    if (value === 'dropshipping') return 'Dropshiepping';
    return '-';
  };
  const getGatewayMethodLabel = (method: ProductItem['gatewayMethod'], bank: ProductItem['gatewayBank']) => {
    if (method === 'pix') return 'Pix';
    if (method === 'debit') return 'Débito';
    if (method === 'credit') return bank && ['picpay', 'nubank'].includes(bank) ? 'Pix Crédito' : 'Crédito';
    return '-';
  };
  const showMeliPlus = product.marketplace === 'mercadolivre' && product.meliPlus;
  const showReputationIllustration = product.marketplace === 'mercadolivre' && product.hasReputation;
  const hasAnyShopeeCoupon = product.marketplace === 'shopee' && (
    product.shopeeStoreCouponEnabled ||
    product.shopeeProductCouponEnabled ||
    product.shopeeFollowerCouponEnabled ||
    product.shopeeSellerVoucherEnabled
  );
  
  // Debug: Log coupon status for Shopee products
  if (product.marketplace === 'shopee' && product.sku === 'C1259') {
    console.log('Product C1259 Shopee Coupons:', {
      marketplace: product.marketplace,
      shopeeStoreCouponEnabled: product.shopeeStoreCouponEnabled,
      shopeeProductCouponEnabled: product.shopeeProductCouponEnabled,
      shopeeFollowerCouponEnabled: product.shopeeFollowerCouponEnabled,
      shopeeSellerVoucherEnabled: product.shopeeSellerVoucherEnabled,
      hasAnyShopeeCoupon
    });
  }
  
  const marketplaceShippingValue = parseCurrency(product.marketplaceShippingCost ?? 0);
  const showFreeShippingIcon = (product.marketplace === 'mercadolivre' && (product.meliPlus || parseCurrency(product.mlShippingCost ?? 0) > 0))
    || (product.marketplace === 'shopee' && product.shippingOption === 'with')
    || (product.marketplace === 'tiktok' && product.tiktokSfpEnabled)
    || (['tiktok', 'wordpress', 'enjoei', 'amazon', 'shein'].includes(product.marketplace ?? '') && marketplaceShippingValue > 0);
  const hasShopeeAdsInvestment = product.marketplace === 'shopee'
    && product.shopeeUseAds
    && (
      parseCurrency(product.shopeeTotalBudget ?? 0) > 0
      || parseCurrency(product.shopeeDailyBudget ?? 0) > 0
      || parseCurrency(product.shopeeMaxCpc ?? 0) > 0
      || Boolean(product.shopeeStartDate)
      || Boolean(product.shopeeEndDate)
    );
  const shopeeAdsBudget = hasShopeeAdsInvestment ? parseCurrency(product.shopeeTotalBudget ?? 0) : 0;
  const netRevenueAdjusted = calculatedNetRevenue - shopeeAdsBudget;
  const marketplaceIcons: Record<string, string> = {
    wordpress: wooCommerceLogo,
    shopee: shopeeLogo,
    tiktok: tiktokLogo,
    amazon: amazonLogo,
    shein: sheinLogo,
    enjoei: enjoeiLogo,
    mercadolivre: mercadoLivreLogo,
    facebook: 'https://cdn.simpleicons.org/facebook/1877F2',
    olx: olxLogo
  };
  const marketplaceAltLabels: Record<string, string> = {
    wordpress: 'WooCommerce',
    shopee: 'Shopee',
    tiktok: 'TikTok Shop',
    amazon: 'Amazon',
    shein: 'Shein',
    enjoei: 'Enjoei',
    mercadolivre: 'Mercado Livre',
    facebook: 'Facebook',
    olx: 'OLX',
  };
  const marketplaceIcon = product.marketplace ? marketplaceIcons[product.marketplace] : undefined;
  const marketplaceIconAlt = product.marketplace ? marketplaceAltLabels[product.marketplace] ?? 'Marketplace' : 'Marketplace';
  const showMarketplaceIcon = Boolean(marketplaceIcon);
  const videoGenerationIcons: Partial<Record<NonNullable<ProductItem['videoGenerationLlm']>, { src: string; alt: string }>> = {
    veo3: { src: veo3Logo, alt: 'Veo3' },
    sora2: { src: sora2Logo, alt: 'Sora2' },
    grok: { src: grokLogo, alt: 'Grok' },
    wan2: { src: wan2Logo, alt: 'Wan 2' },
    copia: { src: copiaLogo, alt: 'Cópia' },
    kling: { src: klingLogo, alt: 'Kling' },
    runway: { src: runwayLogo, alt: 'Runway' },
    pika25: { src: pikaLogo, alt: 'Pika 2.5' },
    luma: { src: lumaLogo, alt: 'Luma' },
    seedance: { src: seedanceLogo, alt: 'Seedance' }
  };
  const videoGenerationIcon = product.videoGenerationLlm ? videoGenerationIcons[product.videoGenerationLlm] : undefined;
  
  // Mapeamento de canais para badges
  const channelBadges: Record<string, { label: string; bgColor: string; textColor: string }> = {
    youtube_shorts: { label: 'YouTube Shorts', bgColor: 'bg-red-600', textColor: 'text-white' },
    kaway_video: { label: 'Kaway Video', bgColor: 'bg-purple-600', textColor: 'text-white' },
    tiktok: { label: 'TikTok', bgColor: 'bg-black', textColor: 'text-white' },
    instagram_reels: { label: 'Instagram Reels', bgColor: 'bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600', textColor: 'text-white' },
    whatsapp: { label: 'WhatsApp', bgColor: 'bg-green-600', textColor: 'text-white' },
    grupo_facebook: { label: 'Grupo Facebook', bgColor: 'bg-blue-600', textColor: 'text-white' },
    shopee_video: { label: 'Shopee Video', bgColor: 'bg-orange-600', textColor: 'text-white' }
  };
  
  const paymentMethodIcons: Record<NonNullable<ProductItem['gatewayMethod']>, { src: string; alt: string }> = {
    pix: { src: 'https://commons.wikimedia.org/wiki/Special:FilePath/Pix_(Brazil)_logo.svg', alt: 'Pix' },
    credit: { src: 'https://raw.githubusercontent.com/payrexx/payment-logos/main/assets/card-icons/card_visa.svg', alt: 'Crédito' },
    debit: { src: 'https://raw.githubusercontent.com/payrexx/payment-logos/main/assets/card-icons/card_visa_electron.svg', alt: 'Débito' }
  };
  const paymentMethodIcon = product.gatewayMethod ? paymentMethodIcons[product.gatewayMethod] : undefined;
  const bankLogoMap: Record<string, { src: string; label: string; className: string }> = {
    mercadopago: { src: 'https://cdn.simpleicons.org/mercadopago/009EE3', label: 'Mercado Pago', className: 'h-6 w-auto object-contain' },
    nubank: { src: 'https://cdn.simpleicons.org/nubank/820AD1', label: 'Nubank', className: 'h-6 w-auto object-contain' },
    picpay: { src: 'https://cdn.simpleicons.org/picpay/11C76F', label: 'PicPay', className: 'h-6 w-auto object-contain' },
    paypal: { src: 'https://cdn.simpleicons.org/paypal/003087', label: 'PayPal', className: 'h-6 w-auto object-contain' },
    stripe: { src: 'https://cdn.simpleicons.org/stripe/635BFF', label: 'Stripe', className: 'h-6 w-auto object-contain' },
    bradesco: { src: 'https://commons.wikimedia.org/wiki/Special:FilePath/Banco_Bradesco_logo.svg', label: 'Bradesco', className: 'h-6 w-auto object-contain' }
  };
  const bankIcon = product.gatewayBank ? bankLogoMap[product.gatewayBank] : undefined;

  const handleInvestChange = <K extends keyof typeof investData>(field: K, value: (typeof investData)[K]) => {
    setInvestData((prev) => ({ ...prev, [field]: value }));
  };
  const handleInvestSave = () => {
    // Normalizar investmentValue de BRL string para número
    const investValueNormalized = investData.investmentValue.replace('.', '').replace(',', '.');
    onInvestSave({
      ...product,
      campaignName: investData.campaignName,
      campaignObjective: investData.campaignObjective,
      budgetType: investData.budgetType,
      conversion: investData.trafficDestination,
      startDate: formatDateToIso(investData.startDate),
      endDate: formatDateToIso(investData.endDate),
      investmentValue: investValueNormalized,
      paidTraffic: investValueNormalized,
      trafficMode: 'paid',
      audienceLocation: investData.audienceLocation,
      audienceAge: investData.audienceAge,
      audienceGender: investData.audienceGender,
      audienceInterests: investData.audienceInterests,
      audienceBehavior: investData.audienceBehavior,
      placement: investData.placement,
      adText: investData.adText,
      adTitle: investData.adTitle,
      adMedia: investData.adMedia,
      adCta: investData.adCta,
      adUrl: investData.adUrl,
      adRedirectUrl: investData.adRedirectUrl,
      instagramAccount: investData.instagramAccount,
      instantForm: investData.instantForm
    });
    
    // Resetar todos os campos para permitir novo investimento
    setInvestData({
      campaignName: '',
      campaignObjective: '',
      budgetType: '',
      trafficDestination: '',
      optimizationGoal: '',
      targetCostPerResult: '',
      startDate: new Date().toLocaleDateString('pt-BR'),
      endDate: '',
      investmentValue: '',
      adSetsDisplay: [],
      audienceLocation: '',
      audienceAge: '',
      audienceGender: '',
      audienceInterests: '',
      audienceBehavior: '',
      audienceMode: 'auto',
      savedAudienceName: '',
      placement: '',
      adText: '',
      adTitle: '',
      adMedia: '',
      adCta: '',
      adUrl: '',
      adRedirectUrl: '',
      instagramAccount: '',
      instantForm: false
    });
    
    // Voltar para o primeiro step
    setInvestStep(0);
    setSelectedCampaignId('');
    setIsInvestOpen(false);
  };
  const investSteps = [
    'Nível de Campanha',
    'Nível de Conjunto',
    'Público',
    'Posicionamento',
    'Nível de Anúncio',
    'Identidade'
  ];
  const isLastInvestStep = investStep === investSteps.length - 1;
  const isNonEmpty = (value: string) => value.trim().length > 0;
  const isValidBrDate = (value: string) => /^\d{2}\/\d{2}\/\d{4}$/.test(value);
  const isStepValid = (step: number) => {
    if (step === 0) {
      return isNonEmpty(investData.campaignName)
        && isNonEmpty(investData.campaignObjective)
        && isNonEmpty(investData.budgetType);
    }
    if (step === 1) {
      const invVal = investData.investmentValue.replace(',', '.').replace(/[^0-9.]/g, '');
      return isNonEmpty(investData.trafficDestination)
        && isValidBrDate(investData.startDate)
        && (!investData.endDate || isValidBrDate(investData.endDate))
        && parseFloat(invVal) > 0;
    }
    if (step === 2) {
      if (investData.audienceMode === 'auto') return true;
      if (investData.audienceMode === 'saved') return isNonEmpty(investData.savedAudienceName);
      // manual
      return isNonEmpty(investData.audienceLocation)
        && isNonEmpty(investData.audienceAge)
        && isNonEmpty(investData.audienceGender)
        && isNonEmpty(investData.audienceInterests)
        && isNonEmpty(investData.audienceBehavior);
    }
    if (step === 3) {
      return isNonEmpty(investData.trafficDestination);
    }
    if (step === 4) {
      return isNonEmpty(investData.adMedia)
        && isNonEmpty(investData.adUrl);
    }
    if (step === 5) {
      return isNonEmpty(investData.instagramAccount);
    }
    return true;
  };
  const isCurrentStepValid = isStepValid(investStep);
  const hasValue = (value?: string | number | boolean) => {
    if (value === undefined || value === null) return false;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value > 0;
    const strValue = String(value).trim();
    return strValue !== '' && strValue !== '0';
  };
  // Painel de investimento existe se campanha vinculada com valores mínimos
  const hasCompleteInvestData = hasValue(product.campaignName)
    && hasValue(product.investmentValue)
    && hasValue(product.adMedia)
    && hasValue(product.adUrl);
  const hasTrafficInvestment = hasValue(product.campaignName) && parseCurrency(product.investmentValue ?? 0) > 0;
  const showMoneyBorder = hasShopeeAdsInvestment || hasTrafficInvestment;
  const hasAffiliateCommission = Array.isArray(product.affiliates) && product.affiliates.length > 0;
  
  // Verificar quantos canais com links foram configurados
  const promoVideoChannelsWithLinks = (product.promoVideoChannels || []).filter(
    channel => product.promoVideoChannelLinks && product.promoVideoChannelLinks[channel]
  );
  
  // Sempre mostrar o painel de investimento para permitir múltiplos investimentos
  const showInvestPanel = true;
  // Vídeos adicionais
  const additionalVideos = product.additionalVideos || [];
  // 1 tela de produto + N telas de vídeo (uma por canal) + M vídeos adicionais + 1 tela de investimento
  const cardPanelsCount = 1 + promoVideoChannelsWithLinks.length + additionalVideos.length + (showInvestPanel ? 1 : 0);
  const canNavigateToStep = (targetIndex: number) => {
    if (targetIndex <= investStep) return true;
    for (let i = 0; i < targetIndex; i += 1) {
      if (!isStepValid(i)) return false;
    }
    return true;
  };
  const getInvestDataFromProduct = () => ({
    campaignName: product.campaignName ?? '',
    campaignObjective: product.campaignObjective ?? '',
    budgetType: product.budgetType ?? '',
    trafficDestination: product.conversion ?? '',
    optimizationGoal: '',
    targetCostPerResult: '',
    startDate: formatDateToBr(product.startDate ?? ''),
    endDate: formatDateToBr(product.endDate ?? ''),
    investmentValue: product.investmentValue != null ? String(product.investmentValue) : '',
    adSetsDisplay: [] as Array<{ id: string; name: string | null; budget?: number | null }>,
    audienceLocation: product.audienceLocation ?? '',
    audienceAge: product.audienceAge ?? '',
    audienceGender: product.audienceGender ?? '',
    audienceInterests: product.audienceInterests ?? '',
    audienceBehavior: product.audienceBehavior ?? '',
    audienceMode: 'auto' as 'auto' | 'manual' | 'saved',
    savedAudienceName: '',
    placement: product.placement ?? '',
    adText: product.adText ?? '',
    adTitle: product.adTitle ?? '',
    adMedia: product.adMedia ?? '',
    adCta: product.adCta ?? '',
    adUrl: product.adUrl ?? '',
    adRedirectUrl: product.adRedirectUrl ?? '',
    instagramAccount: product.instagramAccount ?? '',
    instantForm: product.instantForm ?? false
  });
  const paidTrafficBudgetLabel = product.budgetType === 'diario'
    ? 'Diário'
    : product.budgetType === 'total'
      ? 'Total'
      : product.budgetType || '-';
  const paidTrafficInvestmentValue = product.investmentValue != null && String(product.investmentValue).trim() !== ''
    ? formatMoney(product.investmentValue)
    : '-';
  const paidTrafficPeriodLabel = product.startDate && product.endDate
    ? `${formatDateToBr(product.startDate)} - ${formatDateToBr(product.endDate)}`
    : '-';
  const paidTrafficConversionLabel = product.conversion === 'site'
    ? 'Site'
    : product.conversion === 'tiktok_shop'
      ? 'Loja TikTok'
      : product.conversion === 'app'
        ? 'App'
        : product.conversion || '-';
  const adImageUrl = product.adMedia === 'imagem' ? product.adUrl : '';
  const adVideoUrl = product.adMedia === 'video' ? product.adUrl : '';
  
  // Extrair TikTok video ID de qualquer formato (URL direta, blockquote, iframe)
  const extractTikTokVideoId = (input: string): string => {
    // data-video-id="ID" (blockquote)
    const dvid = input.match(/data-video-id=["'](\d+)["']/);
    if (dvid) return dvid[1];
    // cite="https://www.tiktok.com/@x/video/ID"
    const cite = input.match(/cite=["'][^"']*\/video\/(\d+)/);
    if (cite) return cite[1];
    // https://www.tiktok.com/@x/video/ID ou /video/ID
    const url = input.match(/\/video\/(\d+)/);
    if (url) return url[1];
    return '';
  };

  // Função para extrair URL do iframe ou retornar a URL direta
  const extractVideoUrl = (input: string | undefined): string => {
    if (!input) return '';
    // iframe src
    const iframeMatch = input.match(/src=["']([^"']+)["']/);
    if (iframeMatch && iframeMatch[1]) return iframeMatch[1];
    // URL direta
    return input;
  };

  const adVideoRaw = adVideoUrl || '';
  const tiktokVideoId = adVideoRaw.includes('tiktok.com') ? extractTikTokVideoId(adVideoRaw) : '';
  const processedVideoUrl = tiktokVideoId
    ? `https://www.tiktok.com/embed/v2/${tiktokVideoId}`
    : extractVideoUrl(adVideoUrl);
  // TikTok embed via iframe/v2 — treat as iframe
  const isIframeEmbed = tiktokVideoId
    ? true
    : (adVideoRaw.includes('<iframe') || adVideoRaw.includes('streamable.com'));
  
  const adAspectClass = product.placement === 'stories' || product.placement === 'reels'
    ? 'aspect-[9/16]'
    : product.placement === 'feed_face'
      ? 'aspect-[1.91/1]'
      : product.placement === 'feed_insta'
        ? 'aspect-[4/5]'
        : 'aspect-[4/5]';
  const handlePrevCardPanel = () => {
    setCardPanelIndex((prev) => (prev - 1 + cardPanelsCount) % cardPanelsCount);
  };
  const handleNextCardPanel = () => {
    setCardPanelIndex((prev) => (prev + 1) % cardPanelsCount);
  };

  if (cardPanelIndex >= cardPanelsCount) {
    setCardPanelIndex(0);
  }

  useEffect(() => {
    const slider = cardSliderRef.current;
    if (!slider) return;
    const panelShift = 100 / cardPanelsCount;
    gsap.to(slider, {
      xPercent: -panelShift * cardPanelIndex,
      duration: 0.55,
      ease: 'power2.out'
    });
  }, [cardPanelIndex, cardPanelsCount]);

  return (
    <>
    <style>{`
      /* TikTok Embed Nativo - Dimensões exatas 193x334 */
      .tiktok-wrapper {
        width: 193px !important;
        height: 334px !important;
        max-width: 193px !important;
        max-height: 334px !important;
        overflow: hidden !important;
        position: relative !important;
      }
      
      .tiktok-wrapper .tiktok-embed {
        max-width: 193px !important;
        min-width: 193px !important;
        width: 193px !important;
        height: 334px !important;
        margin: 0 !important;
        padding: 0 !important;
        border-radius: 0.5rem !important;
        overflow: hidden !important;
      }
      
      /* Forçar dimensões do iframe interno do TikTok */
      .tiktok-wrapper .tiktok-embed iframe,
      .tiktok-wrapper iframe {
        width: 193px !important;
        height: 334px !important;
        max-width: 193px !important;
        max-height: 334px !important;
        border-radius: 0.5rem !important;
        transform: scale(1) !important;
      }
      
      /* Esconder elementos extras do TikTok que podem quebrar o layout */
      .tiktok-wrapper .tiktok-embed > div:not(iframe) {
        display: none !important;
      }
      
      /* Fallback para iframes do TikTok sem wrapper */
      iframe[src*="tiktok.com/embed"] {
        border-radius: 0.5rem !important;
        background: #000 !important;
        object-fit: cover !important;
      }
    `}</style>
    <div style={{ opacity: 1, visibility: 'visible' }}>
      <AnimatedCard className="rounded-xl p-4 shadow-sm relative group h-full flex flex-col justify-between min-w-0 backdrop-blur-xl bg-white dark:bg-gray-900 border border-white/20 dark:border-gray-700/20" data-product-id={product.id}>
      {isUpdatingBling && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-2 rounded-xl bg-background/80 backdrop-blur-sm">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
          <span className="text-xs text-muted-foreground">Atualizando no Bling...</span>
        </div>
      )}
      {(promoVideoChannelsWithLinks.length > 0 || hasCompleteInvestData) && (
        <div className="absolute left-2 right-2 top-1/2 z-10 flex -translate-y-1/2 items-center justify-between pointer-events-none">
          <button
            type="button"
            onClick={handlePrevCardPanel}
            className="pointer-events-none opacity-0 group-hover:pointer-events-auto group-hover:opacity-100 h-8 w-8 rounded-full border border-border bg-background/80 text-muted-foreground shadow-sm backdrop-blur transition-opacity hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4 mx-auto" />
          </button>
          <button
            type="button"
            onClick={handleNextCardPanel}
            className="pointer-events-none opacity-0 group-hover:pointer-events-auto group-hover:opacity-100 h-8 w-8 rounded-full border border-border bg-background/80 text-muted-foreground shadow-sm backdrop-blur transition-opacity hover:text-foreground"
          >
            <ChevronRight className="h-4 w-4 mx-auto" />
          </button>
        </div>
      )}
      <div className="overflow-hidden">
        <div ref={cardSliderRef} className="flex min-w-0" style={{ width: `${cardPanelsCount * 100}%` }}>
          <div className="min-w-0 flex-shrink-0" style={{ width: `${100 / cardPanelsCount}%` }}>
            <div className="flex flex-col items-center gap-4 min-h-[220px]">
              <div className="h-4 text-[10px] font-semibold text-muted-foreground">
                {currentSlide.kind === 'variation' ? (
                  `Tipo da variação: ${currentData?.variationType === 'color' ? 'Cor' : 'Tamanho'}`
                ) : (
                  <span className="opacity-0">Tipo da variação: Cor</span>
                )}
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="relative">
                  <div className={`h-36 w-36 flex-shrink-0 overflow-hidden rounded-lg border ${showMoneyBorder ? 'border-green-500 bg-green-50' : 'border-border bg-muted'} relative group/image bg-white`}>
                    {shouldShowVariationImage ? (
                      <img src={displayImage} alt={displayName} className="h-full w-full object-contain p-1" loading="lazy" />
                    ) : currentColorLabel ? (
                      <div className="h-full w-full" style={getColorSwatchStyle(currentColorLabel)} />
                    ) : (
                      <img src={displayImage} alt={displayName} className="h-full w-full object-contain p-1" loading="lazy" />
                    )}
                    {hasShopeeAdsInvestment && (
                      <img
                        src={shopeeAdsMoney}
                        alt="Investimento Shopee Ads"
                        className="absolute left-1/2 top-1/2 w-24 -translate-x-1/2 -translate-y-1/2 -rotate-45 opacity-90 drop-shadow-md pointer-events-none"
                      />
                    )}
                    {hasTrafficInvestment && (
                      <img
                        src={dollarImage}
                        alt="Investimento em Tráfego"
                        className="absolute left-1/2 top-1/2 z-10 w-12 -translate-x-1/2 -translate-y-1/2 opacity-95 drop-shadow-lg pointer-events-none"
                      />
                    )}
                    {hasAffiliateCommission && (
                      <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none">
                        <div className="w-full h-14" style={{ background: 'linear-gradient(to top, black, transparent)' }} />
                        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex items-center justify-center">
                          <img
                            src={commissionIcon}
                            alt="Comissão de Afiliado"
                            className="w-14 h-14 object-contain drop-shadow-lg"
                          />
                        </div>
                      </div>
                    )}
                    {slides.length > 1 && (
                      <>
                        <button
                          onClick={handlePrevVar}
                          className="absolute left-0 top-0 bottom-0 bg-black/30 hover:bg-black/50 text-white px-0.5 opacity-0 group-hover/image:opacity-100 transition-opacity flex items-center justify-center"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          onClick={handleNextVar}
                          className="absolute right-0 top-0 bottom-0 bg-black/30 hover:bg-black/50 text-white px-0.5 opacity-0 group-hover/image:opacity-100 transition-opacity flex items-center justify-center"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                        <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-[8px] text-white text-center py-0.5">
                          {activeIndex + 1}/{slides.length}
                        </div>
                      </>
                    )}
                  </div>
                  <span className={`absolute -right-2 -top-2 h-3 w-3 rounded-full border-2 border-white ${profitBadgeClass}`} />
                  {(showMarketplaceIcon || showMeliPlus || showFreeShippingIcon) && (
                    <div className="absolute -right-2 top-3 flex flex-col items-end gap-1">
                      {showMarketplaceIcon && (
                        <img src={marketplaceIcon} alt={marketplaceIconAlt} className="h-6 w-6 object-contain" loading="lazy" />
                      )}
                      {showFreeShippingIcon && (
                        <img src={freeShippingLogo} alt="Frete grátis" className="h-6 w-auto object-contain" loading="lazy" />
                      )}
                      {showMeliPlus && (
                        <img src={meliPlusLogo} alt="Meli+" className="h-4 w-auto object-contain" loading="lazy" />
                      )}
                    </div>
                  )}
                  {/* adType badge for Mercado Livre */}
                  {product.marketplace?.toLowerCase() === 'mercadolivre' && product.adType && product.adType !== 'gratis' && (() => {
                    const adTypeBadge: Record<string, { label: string; color: string }> = {
                      classico: { label: 'CLÁSSICO', color: 'bg-yellow-500 text-black' },
                      premium:  { label: 'PREMIUM',  color: 'bg-blue-600 text-white' },
                    };
                    const badge = adTypeBadge[product.adType];
                    if (!badge) return null;
                    return (
                      <div className={`absolute -left-2 -top-2 z-20 rounded px-1.5 py-0.5 text-[9px] font-bold tracking-wide shadow ${badge.color}`}>
                        {badge.label}
                      </div>
                    );
                  })()}
                  {product.marketplace?.toLowerCase() === 'mercadolivre' && (!product.adType || product.adType === 'gratis') && (
                    <div className="absolute -left-2 -top-2 z-20 rounded px-1.5 py-0.5 text-[9px] font-bold tracking-wide shadow bg-gray-500 text-white">
                      GRÁTIS
                    </div>
                  )}
                  {showReputationIllustration && (
                    <div className="absolute -left-2 top-3">
                      <img
                        src={reputationExcellentIllustration}
                        alt="Reputação Mercado Livre"
                        className="h-10 w-auto object-contain drop-shadow-md"
                      />
                    </div>
                  )}
                  {hasAnyShopeeCoupon && (
                    <div className="absolute -left-2 top-3">
                      <img
                        src={shopeeCouponBadge}
                        alt="Cupom Shopee"
                        className="h-12 w-auto object-contain drop-shadow-md"
                        loading="lazy"
                      />
                    </div>
                  )}
                  {/* TikTok discount badge */}
                  {product.marketplace === 'tiktok' && (() => {
                    const promoVal = parseCurrency(product.tiktokPromoProductValue ?? 0);
                    if (promoVal <= 0) return null;
                    // Resolve effective percent
                    const sp = parseCurrency(product.sellingPrice ?? 0);
                    const effectivePct = product.tiktokPromoProductType === 'percent'
                      ? promoVal
                      : sp > 0 ? Math.round((promoVal / sp) * 100) : 0;
                    // Map to nearest badge (5,10,15,20,25,30,35,40)
                    const offBadges: Record<number, string> = {
                      5: tiktokOff5, 10: tiktokOff10, 15: tiktokOff15, 20: tiktokOff20,
                      25: tiktokOff25, 30: tiktokOff30, 35: tiktokOff35, 40: tiktokOff40,
                    };
                    const steps = [5, 10, 15, 20, 25, 30, 35, 40];
                    const nearest = steps.reduce((prev, cur) =>
                      Math.abs(cur - effectivePct) < Math.abs(prev - effectivePct) ? cur : prev
                    );
                    const badgeSrc = effectivePct >= 5 ? offBadges[nearest] : null;
                    if (!badgeSrc) return null;
                    return (
                      <div className="absolute -left-2 top-3 z-20 pointer-events-none">
                        <img
                          src={badgeSrc}
                          alt={`${nearest}% OFF`}
                          className="h-14 w-auto object-contain drop-shadow-lg"
                          loading="lazy"
                        />
                      </div>
                    );
                  })()}
                </div>
              </div>
              <div className="h-6 flex items-center gap-2">
                {videoGenerationIcon ? (
                  <img src={videoGenerationIcon.src} alt={videoGenerationIcon.alt} className="h-6 w-auto object-contain" loading="lazy" />
                ) : (
                  <span className="opacity-0">icon</span>
                )}
                {bankIcon ? (
                  <img src={bankIcon.src} alt={bankIcon.label} className={bankIcon.className} loading="lazy" />
                ) : (
                  <span className="opacity-0">icon</span>
                )}
                {paymentMethodIcon ? (
                  <img src={paymentMethodIcon.src} alt={paymentMethodIcon.alt} className="h-5 w-auto object-contain" loading="lazy" />
                ) : (
                  <span className="opacity-0">icon</span>
                )}
              </div>
              <div className="h-20 flex flex-col items-center justify-center gap-1">
                <p className="text-base font-bold font-inter text-foreground text-center max-w-[160px] truncate uppercase mt-0 px-2">
                  {displayName || '-'}
                </p>
                {/* SKU do produto ou variação */}
                {displaySku && (
                  <p className="text-[10px] text-muted-foreground font-semibold leading-none">
                    SKU: {displaySku}
                  </p>
                )}
                <p className="text-[10px] text-muted-foreground font-semibold leading-none">
                  Vendas: {salesStats.totalQuantity}
                </p>
                {shopeeAdsBudget > 0 && (
                  <p className="text-[10px] text-muted-foreground font-semibold leading-none">
                    Shopee Ads: {formatMoney(shopeeAdsBudget)}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-muted-foreground min-h-[170px]">
              <div>
                <p className="text-[10px] uppercase text-muted-foreground">Preço</p>
                <p className="font-semibold text-foreground">{formatMoney(sellingPrice)}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-muted-foreground">Custo</p>
                <p className="font-semibold text-foreground">{formatMoney(costPrice)}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-muted-foreground">Lucro</p>
                <p className={`font-semibold ${profitTextClass}`}>
                  {formatMoney(netRevenueAdjusted)}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-muted-foreground">Marketplace</p>
                <p className="font-semibold text-foreground truncate">{getMarketplaceLabel(product.marketplace)}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-muted-foreground">Forn.</p>
                <p className="font-semibold text-foreground truncate">{product.supplierName || '-'}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-muted-foreground">Titular</p>
                <p className="font-semibold text-foreground truncate">{product.accountHolder || '-'}</p>
              </div>
              <div className="col-span-1">
                <p className="text-[10px] uppercase text-muted-foreground whitespace-nowrap">Conta</p>
                <p className="font-semibold text-foreground truncate">{product.accountType ? product.accountType.toUpperCase() : '-'}</p>
              </div>
              <div className="col-span-1">
                <p className="text-[10px] uppercase text-muted-foreground whitespace-nowrap">Estoque</p>
                <p className="font-semibold text-foreground truncate">{stockQuantity}</p>
              </div>
              <div className="col-span-1">
                <p className="text-[10px] uppercase text-muted-foreground whitespace-nowrap">Modalidade</p>
                <p className="font-semibold text-foreground truncate">{getOperationModeLabel(product.operationMode)}</p>
              </div>
              <div className="col-span-1">
                <p className="text-[10px] uppercase text-muted-foreground whitespace-nowrap">Pagamento</p>
                <p className="font-semibold text-foreground truncate">{getGatewayMethodLabel(product.gatewayMethod, product.gatewayBank)}</p>
              </div>
              
              {/* Copy do primeiro vídeo promocional (se existir) */}
              {promoVideoChannelsWithLinks.length > 0 && product.promoVideoChannelCopies && product.promoVideoChannelCopies[promoVideoChannelsWithLinks[0]] && (
                <div className="col-span-2 mt-2">
                  <p className="text-[10px] uppercase text-muted-foreground mb-1">Copy Vídeo</p>
                  <p className="text-[10px] text-foreground leading-relaxed line-clamp-3">
                    {product.promoVideoChannelCopies[promoVideoChannelsWithLinks[0]]}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Telas 2+: Vídeos Promocionais (uma por canal) */}
          {promoVideoChannelsWithLinks.map((channelKey) => (
            <PromoVideoPanel
              key={channelKey}
              channelKey={channelKey}
              product={product}
              channelBadges={channelBadges}
              cardPanelsCount={cardPanelsCount}
            />
          ))}
          
          {/* Vídeos Adicionais */}
          {additionalVideos.map((video, index) => (
            <div key={video.id} className="min-w-0 flex-shrink-0 px-2 flex flex-col justify-start" style={{ width: `${100 / cardPanelsCount}%` }}>
              <div className="w-full rounded-xl border border-border p-3">
                {/* Container para vídeo adicional (180x318) */}
                <div className="mx-auto mb-6" style={{ width: '184px' }}>
                  <ElectricBorder
                    color="#fe2c55"
                    speed={1}
                    chaos={0.05}
                    thickness={2}
                    style={{ borderRadius: 12 }}
                  >
                    <div className="relative overflow-hidden rounded-lg" style={{ width: '180px', height: '315px', background: 'transparent' }}>
                  {(() => {
                    const videoUrl = video.url;
                    const isTikTok = videoUrl.includes('tiktok.com');
                    const tiktokMatch = videoUrl.match(/\/video\/(\d+)/);
                    const tiktokVideoId = tiktokMatch && tiktokMatch[1] ? tiktokMatch[1] : '';
                    const useTikTokEmbed = isTikTok && tiktokVideoId;
                    const isIframe = videoUrl.includes('<iframe') || videoUrl.includes('streamable.com');
                    const iframeMatch = videoUrl.match(/src=["']([^"']+)["']/);
                    const extractedUrl = iframeMatch && iframeMatch[1] ? iframeMatch[1] : videoUrl;
                    
                    if (useTikTokEmbed) {
                      return (
                        <iframe
                          src={`https://www.tiktok.com/embed/v2/${tiktokVideoId}`}
                          allow="encrypted-media;"
                          allowFullScreen
                          className="absolute inset-0 h-full w-full border-none"
                          style={{ 
                            border: 'none', 
                            width: '100%', 
                            height: '100%', 
                            position: 'absolute', 
                            left: 0, 
                            top: 0, 
                            overflow: 'hidden',
                            borderRadius: '0.5rem'
                          }}
                          title={`Vídeo Adicional ${index + 1}`}
                          loading="lazy"
                          scrolling="no"
                        />
                      );
                    } else if (isIframe) {
                      return (
                        <iframe
                          src={extractedUrl}
                          allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                          allowFullScreen
                          className="absolute inset-0 h-full w-full border-none"
                          style={{ 
                            border: 'none', 
                            width: '100%', 
                            height: '100%', 
                            position: 'absolute', 
                            left: 0, 
                            top: 0, 
                            overflow: 'hidden',
                            borderRadius: '0.5rem'
                          }}
                          title={`Vídeo Adicional ${index + 1}`}
                          loading="lazy"
                          scrolling="no"
                        />
                      );
                    } else {
                      return (
                        <video
                          src={extractedUrl}
                          autoPlay
                          loop
                          muted
                          playsInline
                          controls={false}
                          className="absolute inset-0 h-full w-full object-cover bg-black"
                          onError={(e) => {
                            const target = e.target as HTMLVideoElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              parent.innerHTML = '<div class="absolute inset-0 flex items-center justify-center text-[10px] text-muted-foreground">Erro ao carregar vídeo</div>';
                            }
                          }}
                        />
                      );
                    }
                  })()}
                  
                  {/* Overlay clicável para abrir vídeo em nova aba */}
                  <a
                    href={video.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute inset-0 z-20 cursor-pointer"
                    title="Abrir vídeo em nova aba"
                  />
                  
                  {/* Badge do Canal (detectar automaticamente) */}
                  {(() => {
                    const videoUrl = video.url;
                    let channelBadge = { label: 'Vídeo', bgColor: 'bg-purple-600', textColor: 'text-white' };
                    
                    if (videoUrl.includes('tiktok.com')) {
                      channelBadge = { label: 'TikTok', bgColor: 'bg-black', textColor: 'text-white' };
                    } else if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
                      channelBadge = { label: 'YouTube', bgColor: 'bg-red-600', textColor: 'text-white' };
                    } else if (videoUrl.includes('instagram.com')) {
                      channelBadge = { label: 'Instagram', bgColor: 'bg-gradient-to-r from-purple-600 to-pink-600', textColor: 'text-white' };
                    } else if (videoUrl.includes('streamable.com')) {
                      channelBadge = { label: 'Streamable', bgColor: 'bg-blue-600', textColor: 'text-white' };
                    }
                    
                    return (
                      <div className={`absolute top-2 right-2 ${channelBadge.bgColor} ${channelBadge.textColor} px-2 py-1 rounded-md text-[10px] font-bold shadow-lg z-30`}>
                        {channelBadge.label}
                      </div>
                    );
                  })()}
                </div>
                </ElectricBorder>
                </div>
                
                {/* Informações do Vídeo Adicional */}
                <div className="space-y-3">
                  {video.copy && (
                    <div className="flex flex-col gap-2">
                      <span className="text-[10px] text-muted-foreground uppercase">Copy</span>
                      <p className="text-xs text-foreground leading-relaxed max-h-48 overflow-y-auto p-2 bg-muted/30 rounded-md">{video.copy}</p>
                    </div>
                  )}
                  <div className="flex gap-4">
                    <div className="flex flex-col gap-1 flex-1">
                      <span className="text-[10px] text-muted-foreground uppercase">Canal</span>
                      <span className="text-xs font-semibold text-foreground">
                        {(() => {
                          const videoUrl = video.url;
                          if (videoUrl.includes('tiktok.com')) return 'TikTok';
                          if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) return 'YouTube';
                          if (videoUrl.includes('instagram.com')) return 'Instagram';
                          if (videoUrl.includes('streamable.com')) return 'Streamable';
                          return 'Outro';
                        })()}
                      </span>
                    </div>
                    {product.videoGenerationLlm && (
                      <div className="flex flex-col gap-1 flex-1">
                        <span className="text-[10px] text-muted-foreground uppercase">Model Video</span>
                        <span className="text-xs font-semibold text-foreground">
                          {product.videoGenerationLlm === 'veo3' && 'Veo3'}
                          {product.videoGenerationLlm === 'sora2' && 'Sora2'}
                          {product.videoGenerationLlm === 'grok' && 'Grok'}
                          {product.videoGenerationLlm === 'wan2' && 'Wan 2'}
                          {product.videoGenerationLlm === 'copia' && 'Cópia'}
                          {product.videoGenerationLlm === 'kling' && 'Kling'}
                          {product.videoGenerationLlm === 'runway' && 'Runway'}
                          {product.videoGenerationLlm === 'pika25' && 'Pika 2.5'}
                          {product.videoGenerationLlm === 'luma' && 'Luma'}
                          {product.videoGenerationLlm === 'seedance' && 'Seedance'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Última Tela: Investimento */}
          {showInvestPanel && (
            <div className="min-w-0 flex-shrink-0 pl-4 flex flex-col justify-center" style={{ width: `${100 / cardPanelsCount}%` }}>
              <div className="w-full rounded-xl border border-border p-3">
                {hasCompleteInvestData ? (
                  <ElectricBorder
                    color="#16a34a"
                    speed={1}
                    chaos={0.05}
                    thickness={2}
                    style={{ borderRadius: 12 }}
                  >
                    <div className={`relative mx-auto w-full max-w-[280px] overflow-hidden rounded-lg bg-background ${adAspectClass}`}>
                      {processedVideoUrl && isIframeEmbed ? (
                        <iframe
                          src={processedVideoUrl}
                          allow="fullscreen;autoplay"
                          allowFullScreen
                          className="absolute inset-0 h-full w-full border-none"
                          style={{ border: 'none', width: '100%', height: '100%', position: 'absolute', left: 0, top: 0, overflow: 'hidden' }}
                          title="Vídeo do anúncio"
                        />
                      ) : processedVideoUrl ? (
                        <video
                          src={processedVideoUrl}
                          autoPlay
                          loop
                          muted
                          playsInline
                          className="absolute inset-0 h-full w-full object-cover bg-black"
                          onError={(e) => {
                            const target = e.target as HTMLVideoElement;
                            target.style.display = 'none';
                            // show product image as fallback
                            const parent = target.parentElement;
                            if (parent && displayImage) {
                              const img = document.createElement('img');
                              img.src = displayImage;
                              img.alt = displayName;
                              img.className = 'absolute inset-0 h-full w-full object-contain bg-white';
                              parent.appendChild(img);
                            }
                          }}
                        />
                      ) : adImageUrl ? (
                        <img src={adImageUrl} alt="Imagem do anúncio" className="absolute inset-0 h-full w-full object-contain bg-white" loading="lazy" />
                      ) : (
                        /* Sem mídia configurada — mostrar imagem do produto */
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-3 bg-background">
                          {displayImage && (
                            <img src={displayImage} alt={displayName} className="h-24 w-24 object-contain" loading="lazy" />
                          )}
                          <p className="text-center text-[10px] text-muted-foreground font-medium">{product.campaignName}</p>
                        </div>
                      )}
                    </div>
                  </ElectricBorder>
                ) : (
                  <div className={`relative mx-auto w-full max-w-[280px] overflow-hidden rounded-lg bg-background ${adAspectClass}`}>
                    <div className="absolute inset-0 flex items-center justify-center px-4 py-8">
                      <p className="text-center text-sm font-bold text-gray-900 dark:text-white leading-relaxed">
                        Clique em Investir para<br />adicionar campanha
                      </p>
                    </div>
                  </div>
                )}
                <div className="mt-4 grid grid-cols-2 gap-3 text-[10px] text-muted-foreground">
                  <div className="flex flex-col gap-1">
                    <span>Orçamento</span>
                    <span className="font-semibold text-foreground">{paidTrafficBudgetLabel}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span>Investimento</span>
                    <span className="font-semibold text-foreground">{paidTrafficInvestmentValue}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span>Nome</span>
                    <span className="font-semibold text-foreground">{product.campaignName || '-'}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span>Objetivo</span>
                    <span className="font-semibold text-foreground">{product.campaignObjective || '-'}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span>Conversão</span>
                    <span className="font-semibold text-foreground">{paidTrafficConversionLabel}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span>Período</span>
                    <span className="font-semibold text-foreground">{paidTrafficPeriodLabel}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span>Localização</span>
                    <span className="font-semibold text-foreground">{product.audienceLocation || '-'}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span>Idade</span>
                    <span className="font-semibold text-foreground">{product.audienceAge || '-'}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span>Interesses</span>
                    <span className="font-semibold text-foreground">{product.audienceInterests || '-'}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span>Gênero</span>
                    <span className="font-semibold text-foreground">{product.audienceGender || '-'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          onClick={() => onEdit(product)}
          className="inline-flex items-center justify-center gap-1 whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-3.5 [&_svg]:shrink-0 border bg-background shadow-sm rounded-md px-2 h-8 w-full text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-100 dark:bg-white dark:border-gray-200 dark:hover:bg-gray-50"
        >
          <Edit2 className="w-3.5 h-3.5 mr-1" />
          Editar
        </button>
        <button
          onClick={() => onDelete(product.id)}
          className="inline-flex items-center justify-center gap-1 whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-3.5 [&_svg]:shrink-0 border bg-background shadow-sm rounded-md px-2 h-8 w-full text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border-red-100 dark:bg-white dark:border-gray-200 dark:hover:bg-gray-50"
        >
          <Trash2 className="w-3.5 h-3.5 mr-1" />
          Excluir
        </button>
        <button
          onClick={() => setIsBlingConfirmOpen(true)}
          disabled={isUpdatingBling}
          title="Atualizar produto no Bling"
          className="inline-flex items-center justify-center gap-1 whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-3.5 [&_svg]:shrink-0 border bg-background shadow-sm rounded-md px-2 h-8 w-full text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-50 border-amber-100 dark:bg-white dark:border-gray-200 dark:hover:bg-gray-50"
        >
          {isUpdatingBling
            ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
            : <RefreshCw className="w-3.5 h-3.5 mr-1" />}
          Atualizar
        </button>

        <AlertDialog open={isBlingConfirmOpen} onOpenChange={setIsBlingConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar atualização</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que você quer atualizar o produto{' '}
                <strong>{product.name}</strong> do marketplace{' '}
                <strong>{product.marketplace}</strong>, titular{' '}
                <strong>{product.accountHolder}</strong> e tipo de conta{' '}
                <strong>{product.accountType?.toUpperCase()}</strong>?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Não</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  setIsBlingConfirmOpen(false);
                  onBlingUpdate(product);
                }}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                Sim, atualizar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <button
          onClick={() => {
            const hasCampaign = hasValue(product.campaignName);
            if (hasCampaign) {
              // Somente leitura — mostrar resumo da campanha
              setIsInvestReadonly(true);
              setIsInvestOpen(true);
              return;
            }
            setInvestData(getInvestDataFromProduct());
            setInvestStep(0);
            setSelectedCampaignId('');
            // Fetch campanhas existentes
            if (organizationId) {
              supabase
                .from('campaigns')
                .select('id, name, objective, budget_type, budget_amount, campaign_ad_sets(id, name, conversion_type, traffic_destination, optimization_goal, target_cost_per_result, start_date, end_date, audience_mode, saved_audience_name, audience_location, audience_age, audience_gender, audience_interests, audience_behavior, ad_media_url, ad_redirect_url, ad_text, ad_title, ad_cta, ad_media_type), campaign_products(marketing_cost_override)')
                .eq('organization_id', organizationId)
                .order('updated_at', { ascending: false })
                .then(({ data }) => {
                  if (data) {
                    // Última campanha selecionada (persistida em localStorage) aparece primeiro
                    const lastId = localStorage.getItem(`lastCampaignId_${organizationId}`);
                    const sorted = lastId
                      ? [...data].sort((a, b) => (a.id === lastId ? -1 : b.id === lastId ? 1 : 0))
                      : data;
                    setAvailableCampaigns(sorted as typeof availableCampaigns);
                  }
                });
            }
            setIsInvestReadonly(false);
            setIsInvestOpen(true);
          }}
          className="inline-flex items-center justify-center gap-1 whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border bg-background shadow-sm rounded-md px-2 h-8 w-full text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border-emerald-100 dark:bg-white dark:border-gray-200 dark:hover:bg-gray-50"
        >
          <DollarSign className="w-3.5 h-3.5 mr-1" />
          {hasValue(product.campaignName) ? 'Ver Campanha' : 'Investir'}
        </button>
      </div>
    </AnimatedCard>
    </div>
    <Dialog open={isInvestOpen} onOpenChange={(open) => {
      setIsInvestOpen(open);
      if (!open) {
        setInvestStep(0);
      }
    }}>
      <DialogContent className="sm:max-w-[900px]">
        <DialogHeader>
          <DialogTitle>{isInvestReadonly ? 'Campanha Vinculada' : 'Investir'}</DialogTitle>
          <DialogDescription>
            {isInvestReadonly
              ? 'Resumo da campanha. Para editar, acesse a página Campanhas.'
              : 'Preencha os dados da campanha'}
          </DialogDescription>
        </DialogHeader>

        {/* ── MODO SOMENTE LEITURA ── */}
        {isInvestReadonly && (
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ['Campanha', product.campaignName],
                ['Objetivo', product.campaignObjective],
                ['Orçamento', product.budgetType === 'diario' ? 'Diário' : product.budgetType === 'total' ? 'Total' : product.budgetType],
                ['Destino', product.conversion === 'tiktok_shop' ? 'Loja TikTok' : product.conversion === 'app' ? 'App' : product.conversion === 'site' ? 'Site' : product.conversion],
                ['Investimento', product.investmentValue ? `R$ ${parseCurrency(product.investmentValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'],
                ['Período', product.startDate && product.endDate ? `${formatDateToBr(product.startDate)} - ${formatDateToBr(product.endDate)}` : '-'],
                ['Mídia', product.adMedia],
                ['CTA', product.adCta],
                ['Texto', product.adText],
                ['Título', product.adTitle],
                ['Link Mídia', product.adUrl],
                ['URL Redirect', product.adRedirectUrl],
              ].filter(([, v]) => v).map(([label, value]) => (
                <div key={label as string} className="flex flex-col gap-0.5">
                  <span className="text-[10px] uppercase text-muted-foreground">{label}</span>
                  <span className="text-xs font-medium text-foreground truncate">{value || '-'}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2 pt-2">
              <a
                href="/campanhas"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-md bg-orange-500 hover:bg-orange-600 text-white text-xs font-medium px-3 py-2 transition-colors"
              >
                Editar na página Campanhas ↗
              </a>
              <button
                type="button"
                onClick={() => {
                  // Limpar campanha vinculada e abrir modal de edição
                  setIsInvestReadonly(false);
                  setInvestData(getInvestDataFromProduct());
                  setInvestStep(0);
                  setSelectedCampaignId('');
                  if (organizationId) {
                    supabase
                      .from('campaigns')
                      .select('id, name, objective, budget_type, budget_amount, campaign_ad_sets(id, name, conversion_type, traffic_destination, optimization_goal, target_cost_per_result, start_date, end_date, audience_mode, saved_audience_name, audience_location, audience_age, audience_gender, audience_interests, audience_behavior, ad_media_url, ad_redirect_url, ad_text, ad_title, ad_cta, ad_media_type), campaign_products(marketing_cost_override)')
                      .eq('organization_id', organizationId)
                      .order('updated_at', { ascending: false })
                      .then(({ data }) => {
                        if (data) {
                          const lastId = localStorage.getItem(`lastCampaignId_${organizationId}`);
                          const sorted = lastId
                            ? [...data].sort((a, b) => (a.id === lastId ? -1 : b.id === lastId ? 1 : 0))
                            : data;
                          setAvailableCampaigns(sorted as typeof availableCampaigns);
                        }
                      });
                  }
                }}
                className="inline-flex items-center gap-1 rounded-md border border-border bg-background text-xs font-medium px-3 py-2 hover:bg-muted transition-colors"
              >
                Vincular outra campanha
              </button>
            </div>
          </div>
        )}

        {/* ── MODO EDIÇÃO ── */}
        {!isInvestReadonly && (
        <div className="grid gap-6 py-2 md:grid-cols-[220px_1fr]">
          <aside className="rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900 p-3">
            <div className="text-xs font-semibold text-gray-700 dark:text-gray-200 mb-3">Etapas</div>
            <div className="flex flex-col gap-1">
              {investSteps.map((label, index) => {
                const isActive = investStep === index;
                const isDone = investStep > index;
                const canNavigate = canNavigateToStep(index);
                return (
                  <button
                    key={label}
                    onClick={() => canNavigate && setInvestStep(index)}
                    disabled={!canNavigate}
                    className={`flex items-center gap-2 rounded-md px-2 py-2 text-left text-xs font-medium transition-colors ${isActive ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' : isDone ? 'text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800'} ${canNavigate ? '' : 'opacity-50 cursor-not-allowed'}`}
                  >
                    <span className={`flex h-6 w-6 items-center justify-center rounded-full border text-[11px] font-semibold ${isActive ? 'border-purple-400 dark:border-purple-500 bg-white dark:bg-zinc-800 text-purple-700 dark:text-purple-300' : isDone ? 'border-green-400 dark:border-green-500 bg-white dark:bg-zinc-800 text-green-700 dark:text-green-400' : 'border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-gray-700 dark:text-gray-300'}`}>
                      {index + 1}
                    </span>
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          </aside>

          <div className="rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4">
            {investStep === 0 && (
              <div className="grid gap-3">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Nível de Campanha</h3>
                
                {/* Selecionar campanha existente */}
                {availableCampaigns.length > 0 && (
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right text-gray-700 dark:text-gray-200">Campanha existente</Label>
                    <Select
                      value={selectedCampaignId}
                      onValueChange={(val) => {
                        setSelectedCampaignId(val);
                        if (val) {
                          const camp = availableCampaigns.find((c) => c.id === val);
                          if (camp) {
                            if (organizationId) {
                              localStorage.setItem(`lastCampaignId_${organizationId}`, val);
                            }
                            // Mapear objective do DB para os valores do select local
                            const objectiveMap: Record<string, string> = {
                              reach: 'reconhecimento',
                              traffic: 'trafego',
                              video_views: 'engajamento',
                              community_interaction: 'engajamento',
                              lead_generation: 'cadastros',
                              app_promotion: 'promocao_app',
                              sales: 'vendas',
                            };
                            // Mapear budget_type do DB
                            const budgetMap: Record<string, string> = {
                              daily: 'diario',
                              lifetime: 'total',
                            };
                            // Pegar dados do primeiro ad set para pré-preencher step 1
                            const firstAdSet = camp.campaign_ad_sets?.[0];
                            const destMap: Record<string, string> = {
                              tiktok_shop: 'tiktok_shop',
                              app: 'app',
                              site: 'site',
                            };
                            const optMap: Record<string, string> = {
                              click: 'click',
                              landing_page_view: 'landing_page_view',
                              engagement_session: 'engagement_session',
                            };
                            // Custo total = marketing_cost_override do primeiro produto vinculado
                            const totalCost = camp.campaign_products?.[0]?.marketing_cost_override ?? null;
                            // Orçamento diário por grupo = budget_amount da campanha
                            const budgetPerGroup = camp.budget_amount;
                            const adSetsWithBudget = (camp.campaign_ad_sets ?? []).map(a => ({
                              id: a.id,
                              name: a.name,
                              budget: budgetPerGroup,
                            }));
                            setInvestData(prev => ({
                              ...prev,
                              campaignName: camp.name,
                              campaignObjective: objectiveMap[camp.objective] ?? camp.objective,
                              budgetType: budgetMap[camp.budget_type] ?? camp.budget_type,
                              adSetsDisplay: adSetsWithBudget,
                              trafficDestination: firstAdSet ? (destMap[firstAdSet.traffic_destination ?? ''] ?? firstAdSet.traffic_destination ?? '') : prev.trafficDestination,
                              optimizationGoal: firstAdSet ? (optMap[firstAdSet.optimization_goal ?? ''] ?? firstAdSet.optimization_goal ?? '') : prev.optimizationGoal,
                              targetCostPerResult: firstAdSet?.target_cost_per_result != null
                                ? firstAdSet.target_cost_per_result.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                : prev.targetCostPerResult,
                              startDate: firstAdSet?.start_date ? formatDateToBr(firstAdSet.start_date) : prev.startDate,
                              endDate: firstAdSet?.end_date ? formatDateToBr(firstAdSet.end_date) : prev.endDate,
                              investmentValue: totalCost != null
                                ? totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                : prev.investmentValue,
                              // Audiência do primeiro ad set
                              audienceMode: (firstAdSet?.audience_mode as 'auto' | 'manual' | 'saved' | null) ?? 'auto',
                              savedAudienceName: firstAdSet?.saved_audience_name ?? '',
                              audienceLocation: firstAdSet?.audience_location ?? prev.audienceLocation,
                              audienceAge: firstAdSet?.audience_age ?? prev.audienceAge,
                              audienceGender: firstAdSet?.audience_gender ?? prev.audienceGender,
                              audienceInterests: firstAdSet?.audience_interests ?? prev.audienceInterests,
                              audienceBehavior: firstAdSet?.audience_behavior ?? prev.audienceBehavior,
                              // Nível de Anúncio do primeiro ad set
                              adText: firstAdSet?.ad_text ?? prev.adText,
                              adTitle: firstAdSet?.ad_title ?? prev.adTitle,
                              adMedia: firstAdSet?.ad_media_type ?? prev.adMedia,
                              adCta: firstAdSet?.ad_cta ?? prev.adCta,
                              adUrl: firstAdSet?.ad_media_url ?? prev.adUrl,
                              adRedirectUrl: firstAdSet?.ad_redirect_url ?? prev.adRedirectUrl,
                            }));
                          }
                        }
                      }}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Selecione uma campanha criada" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableCampaigns.map((camp) => (
                          <SelectItem key={camp.id} value={camp.id}>{camp.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right text-gray-700 dark:text-gray-200">Nome da Campanha</Label>
                  <Input
                    value={investData.campaignName}
                    onChange={(e) => handleInvestChange('campaignName', e.target.value)}
                    className="col-span-3"
                    readOnly={!!selectedCampaignId}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right text-gray-700 dark:text-gray-200">Objetivo</Label>
                  {selectedCampaignId ? (
                    <div className="col-span-3 px-3 py-2 rounded-md border border-border bg-muted text-sm text-foreground">
                      {investData.campaignObjective || '-'}
                    </div>
                  ) : (
                    <Select value={investData.campaignObjective} onValueChange={(val) => handleInvestChange('campaignObjective', val)}>
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="reconhecimento">Reconhecimento</SelectItem>
                        <SelectItem value="trafego">Tráfego</SelectItem>
                        <SelectItem value="engajamento">Engajamento</SelectItem>
                        <SelectItem value="cadastros">Cadastros</SelectItem>
                        <SelectItem value="promocao_app">Promoção do app</SelectItem>
                        <SelectItem value="vendas">Vendas</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right text-gray-700 dark:text-gray-200">Orçamento</Label>
                  {selectedCampaignId ? (
                    <div className="col-span-3 px-3 py-2 rounded-md border border-border bg-muted text-sm text-foreground">
                      {investData.budgetType === 'diario' ? 'Diário' : investData.budgetType === 'total' ? 'Total' : investData.budgetType || '-'}
                    </div>
                  ) : (
                    <Select value={investData.budgetType} onValueChange={(val) => handleInvestChange('budgetType', val)}>
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="diario">Diário</SelectItem>
                        <SelectItem value="total">Total</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
            )}

            {investStep === 1 && (
              <div className="grid gap-3">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Nível de Conjunto</h3>
                
                {/* Grupos de anúncios da campanha (read-only) */}
                {investData.adSetsDisplay.length > 0 && (
                  <div className="grid grid-cols-4 items-start gap-4">
                    <Label className="text-right text-gray-700 dark:text-gray-200 pt-2">Grupos de Anúncios</Label>
                    <div className="col-span-3 flex flex-col gap-2">
                      {investData.adSetsDisplay.map((as) => (
                        <div key={as.id} className="flex items-center justify-between rounded-md bg-muted border border-border px-3 py-1.5">
                          <span className="text-xs text-foreground truncate mr-2">{as.name || as.id.slice(0, 8)}</span>
                          {as.budget != null && (
                            <span className="text-xs font-semibold text-emerald-500 shrink-0">
                              R$ {Number(as.budget).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/dia
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right text-gray-700 dark:text-gray-200">Destino</Label>
                  <Select value={investData.trafficDestination} onValueChange={(val) => handleInvestChange('trafficDestination', val)}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tiktok_shop">Loja do TikTok</SelectItem>
                      <SelectItem value="app">Aplicativo</SelectItem>
                      <SelectItem value="site">Site</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right text-gray-700 dark:text-gray-200">Objetivo de Otimização</Label>
                  <Select value={investData.optimizationGoal} onValueChange={(val) => handleInvestChange('optimizationGoal', val)}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="click">Clique</SelectItem>
                      <SelectItem value="landing_page_view">Visualização de Página de Destino</SelectItem>
                      <SelectItem value="engagement_session">Sessão de Engajamento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right text-gray-700 dark:text-gray-200">
                    Custo Alvo por Resultado <span className="text-[10px] text-muted-foreground">(opcional)</span>
                  </Label>
                  <div className="col-span-3 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">R$</span>
                    <Input
                      inputMode="decimal"
                      value={investData.targetCostPerResult}
                      onChange={(e) => {
                        // só dígitos e vírgula
                        const raw = e.target.value.replace(/\./g, '').replace(/[^0-9,]/g, '');
                        handleInvestChange('targetCostPerResult', raw);
                      }}
                      onBlur={() => {
                        const raw = investData.targetCostPerResult.replace(',', '.');
                        const num = parseFloat(raw);
                        if (!isNaN(num)) {
                          handleInvestChange('targetCostPerResult', num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
                        }
                      }}
                      className="pl-9"
                      placeholder="0,00"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right text-gray-700 dark:text-gray-200">Cronograma</Label>
                  <div className="col-span-3 grid grid-cols-2 gap-2">
                    <Input
                      inputMode="numeric"
                      placeholder="dd/mm/aaaa"
                      value={investData.startDate}
                      onChange={(e) => handleInvestChange('startDate', formatDateInputBr(e.target.value))}
                      className={investData.startDate && !isValidBrDate(investData.startDate) ? "border-red-500" : ""}
                    />
                    <Input
                      inputMode="numeric"
                      placeholder="dd/mm/aaaa"
                      value={investData.endDate}
                      onChange={(e) => handleInvestChange('endDate', formatDateInputBr(e.target.value))}
                      className={investData.endDate && !isValidBrDate(investData.endDate) ? "border-red-500" : ""}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right text-gray-700 dark:text-gray-200">Investimento</Label>
                  <div className="col-span-3 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">R$</span>
                    <Input
                      inputMode="decimal"
                      value={investData.investmentValue}
                      onChange={(e) => {
                        // só dígitos e vírgula, sem ponto
                        const raw = e.target.value.replace(/\./g, '').replace(/[^0-9,]/g, '');
                        handleInvestChange('investmentValue', raw);
                      }}
                      onBlur={() => {
                        const raw = investData.investmentValue.replace(',', '.');
                        const num = parseFloat(raw);
                        if (!isNaN(num)) {
                          handleInvestChange('investmentValue', num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
                        }
                      }}
                      className="pl-9"
                      placeholder="0,00"
                    />
                  </div>
                </div>
              </div>
            )}

            {investStep === 2 && (
              <div className="grid gap-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Público</h3>
                
                {/* Modo de Audiência — 3 botões */}
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label className="text-right text-gray-700 dark:text-gray-200 pt-2">Modo de Audiência</Label>
                  <div className="col-span-3 flex gap-2">
                    {(['auto', 'manual', 'saved'] as const).map((mode) => {
                      const labels = { auto: 'Automático (Smart+)', manual: 'Manual', saved: 'Audiência Salva' };
                      const isActive = investData.audienceMode === mode;
                      return (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => handleInvestChange('audienceMode', mode)}
                          className={`flex-1 rounded-md border px-3 py-2 text-xs font-medium transition-colors ${isActive ? 'bg-orange-500 border-orange-500 text-white' : 'border-border bg-background text-foreground hover:bg-muted'}`}
                        >
                          {labels[mode]}
                        </button>
                      );
                    })}
                  </div>
                </div>
                
                {/* Auto: info box */}
                {investData.audienceMode === 'auto' && (
                  <div className="grid grid-cols-4 gap-4">
                    <div className="col-start-2 col-span-3 rounded-md border border-border bg-muted p-3 text-xs text-muted-foreground">
                      🤖 <strong>Smart+ — Audiência Automática</strong><br />
                      O algoritmo define automaticamente a melhor audiência. Nenhuma configuração manual necessária.
                    </div>
                  </div>
                )}
                
                {/* Saved: nome da audiência */}
                {investData.audienceMode === 'saved' && (
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right text-gray-700 dark:text-gray-200">Audiência Salva</Label>
                    <Input
                      value={investData.savedAudienceName}
                      onChange={(e) => handleInvestChange('savedAudienceName', e.target.value)}
                      className="col-span-3"
                      placeholder="Nome da audiência salva"
                    />
                  </div>
                )}
                
                {/* Manual: campos completos */}
                {investData.audienceMode === 'manual' && (
                  <>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label className="text-right text-gray-700 dark:text-gray-200">Localização</Label>
                      <Input
                        value={investData.audienceLocation}
                        onChange={(e) => handleInvestChange('audienceLocation', e.target.value)}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label className="text-right text-gray-700 dark:text-gray-200">Idade</Label>
                      <Input
                        value={investData.audienceAge}
                        onChange={(e) => handleInvestChange('audienceAge', e.target.value)}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label className="text-right text-gray-700 dark:text-gray-200">Gênero</Label>
                      <Select value={investData.audienceGender} onValueChange={(val) => handleInvestChange('audienceGender', val)}>
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos</SelectItem>
                          <SelectItem value="male">Masculino</SelectItem>
                          <SelectItem value="female">Feminino</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label className="text-right text-gray-700 dark:text-gray-200">Interesses</Label>
                      <Input
                        value={investData.audienceInterests}
                        onChange={(e) => handleInvestChange('audienceInterests', e.target.value)}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label className="text-right text-gray-700 dark:text-gray-200">Comportamento</Label>
                      <Input
                        value={investData.audienceBehavior}
                        onChange={(e) => handleInvestChange('audienceBehavior', e.target.value)}
                        className="col-span-3"
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            {investStep === 3 && (
              <div className="grid gap-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Posicionamento</h3>
                <div>
                  <p className="text-xs text-muted-foreground mb-3">Local de Exibição</p>
                  <div className="grid grid-cols-3 gap-3">
                    {([
                      { value: 'site', label: 'Site', img: wooCommerceLogo },
                      { value: 'app', label: 'App', img: androidLogo },
                      { value: 'tiktok_shop', label: 'Loja TikTok', img: tiktokLogo },
                    ] as const).map((opt) => {
                      const isSelected = investData.trafficDestination === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => handleInvestChange('trafficDestination', isSelected ? '' : opt.value)}
                          className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                            isSelected
                              ? 'border-orange-500 bg-orange-500/10 ring-1 ring-orange-500/50'
                              : 'border-border bg-muted/30 hover:border-muted-foreground'
                          }`}
                        >
                          <div className="w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center bg-white p-1">
                            <img src={opt.img} alt={opt.label} className="w-full h-full object-contain" />
                          </div>
                          <span className={`text-xs font-medium ${isSelected ? 'text-orange-500' : 'text-foreground'}`}>
                            {opt.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {investStep === 4 && (
              <div className="grid gap-3">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Nível de Anúncio</h3>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right text-gray-700 dark:text-gray-200">Texto Principal</Label>
                  <Input
                    value={investData.adText}
                    onChange={(e) => handleInvestChange('adText', e.target.value)}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right text-gray-700 dark:text-gray-200">Título</Label>
                  <Input
                    value={investData.adTitle}
                    onChange={(e) => handleInvestChange('adTitle', e.target.value)}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right text-gray-700 dark:text-gray-200">Mídia</Label>
                  <Select value={investData.adMedia} onValueChange={(val) => handleInvestChange('adMedia', val)}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="imagem">Imagem</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right text-gray-700 dark:text-gray-200">CTA</Label>
                  <Input
                    value={investData.adCta}
                    onChange={(e) => handleInvestChange('adCta', e.target.value)}
                    className="col-span-3"
                  />
                </div>
                {investData.adMedia ? (
                  <div className="grid grid-cols-4 items-start gap-4">
                    <Label className="text-right text-gray-700 dark:text-gray-200 pt-2">
                      {investData.adMedia === 'imagem' ? 'Link da imagem' : 'Link do vídeo'}
                    </Label>
                    <div className="col-span-3">
                      <textarea
                        value={investData.adUrl}
                        onChange={(e) => handleInvestChange('adUrl', e.target.value)}
                        rows={3}
                        placeholder={investData.adMedia === 'video'
                          ? 'URL do TikTok, iframe ou blockquote embed'
                          : 'https://'}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                      />
                      {investData.adMedia === 'video' && (
                        <p className="text-[11px] text-muted-foreground mt-1">Cole URL direta, &lt;blockquote&gt; ou &lt;iframe&gt; do TikTok.</p>
                      )}
                    </div>
                  </div>
                ) : null}
                {investData.adMedia ? (
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right text-gray-700 dark:text-gray-200">Url de redirect</Label>
                    <Input
                      type="url"
                      value={investData.adRedirectUrl}
                      onChange={(e) => handleInvestChange('adRedirectUrl', e.target.value)}
                      className="col-span-3"
                      placeholder="https://"
                    />
                  </div>
                ) : null}
              </div>
            )}

            {investStep === 5 && (
              <div className="grid gap-3">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Identidade</h3>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right text-gray-700 dark:text-gray-200">Conta instagram</Label>
                  <Input
                    value={investData.instagramAccount}
                    onChange={(e) => handleInvestChange('instagramAccount', e.target.value)}
                    className="col-span-3"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`instant-form-${product.id}`}
                    checked={investData.instantForm}
                    onCheckedChange={(checked) => handleInvestChange('instantForm', Boolean(checked))}
                  />
                  <Label htmlFor={`instant-form-${product.id}`} className="text-gray-700 dark:text-gray-200">Formulário instânio</Label>
                </div>
              </div>
            )}
          </div>
        </div>
        )} {/* end !isInvestReadonly */}
        {!isInvestReadonly && (
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsInvestOpen(false)}>Cancelar</Button>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              disabled={investStep === 0}
              onClick={() => setInvestStep((prev) => Math.max(0, prev - 1))}
            >
              Voltar
            </Button>
            {isLastInvestStep ? (
              <Button onClick={handleInvestSave} disabled={!isCurrentStepValid}>Investir</Button>
            ) : (
              <Button onClick={() => setInvestStep((prev) => Math.min(investSteps.length - 1, prev + 1))} disabled={!isCurrentStepValid}>
                Próximo
              </Button>
            )}
          </div>
        </DialogFooter>
        )}
        {isInvestReadonly && (
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsInvestOpen(false)}>Fechar</Button>
        </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
    </>
  );
}, (prevProps, nextProps) => {
  // Comparação customizada: só re-renderizar se o produto.id mudou ou se as funções mudaram
  return prevProps.product.id === nextProps.product.id &&
         prevProps.onDelete === nextProps.onDelete &&
         prevProps.onEdit === nextProps.onEdit &&
         prevProps.onBlingUpdate === nextProps.onBlingUpdate &&
         prevProps.isUpdatingBling === nextProps.isUpdatingBling &&
         prevProps.onInvestSave === nextProps.onInvestSave &&
         prevProps.organizationId === nextProps.organizationId;
});
