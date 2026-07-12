
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ReferenceService, type Supplier, type AccountHolder, type Marketplace } from '@/services/referenceService';
import { productPromotionalContentService } from '@/services/productPromotionalContentService';
import { useSettings } from '@/contexts/SettingsContext';
import { calculateMetrics } from '@/services/pricingService';
import { mercadoLivreTaxes } from '@/services/pricingService';
import { formatCurrency, handleCurrencyChange, parseCurrency } from '@/utils/currency';
import type { ProductItem } from '../../types/calculator';
import { AlertCircle, TrendingUp, X, Instagram, Music, Twitter } from "lucide-react";
import { useInfluencers } from '@/hooks/useInfluencers';
import { useAffiliates } from '@/hooks/useAffiliates';
import { ProductVariationsSection } from './ProductVariationsSection';
import { TikTokCampaignSection } from './TikTokCampaignSection';
import { supabase } from '@/lib/supabase';

interface EditProductDialogProps {
  product: ProductItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedProduct: ProductItem) => void;
  mode?: 'edit' | 'duplicate';
}

type EditProductFormData = {
  name: string;
  description: string;
  imageUrl: string;
  sku: string;
  stockQuantity: string;
  marketplace: string;
  adType: ProductItem['adType'];
  enjoeiAdType: ProductItem['enjoeiAdType'];
  supplierName: string;
  mlCategory: string;
  weight: string;
  width: string;
  height: string;
  depth: string;
  accountHolder: string;
  accountType: string;
  sellingPrice: string | number;
  costPrice: string | number;
  mlShippingCost: string;
  marketplaceShippingCost: string;
  operationMode: ProductItem['operationMode'] | '';
  gatewayMethod: ProductItem['gatewayMethod'] | '';
  gatewayBank: ProductItem['gatewayBank'] | '';
  gatewayFeeValue: string;
  gatewayFeeType: 'percent' | 'fixed';
  gatewayInstallments: string;
  supplierFeeType: 'percent' | 'fixed';
  supplierFeeValue: string;
  supplierGatewayFeeType: 'percent' | 'fixed';
  supplierGatewayFeeValue: string;
  shopeeFreeShipping: boolean;
  shippingFee: string;
  videoGenerationLlm: ProductItem['videoGenerationLlm'] | '';
  targetAudienceAge: string;
  targetAudienceLocation: string;
  targetAudienceInterests: string;
  targetAudienceBehaviors: string;
  adPlacement: ProductItem['adPlacement'] | '';
  adFormat: ProductItem['adFormat'] | '';
  isNewProduct: ProductItem['isNewProduct'] | '';
  defectiveProduct: ProductItem['defectiveProduct'] | '';
  facebookDelivery: ProductItem['facebookDelivery'] | undefined;
  hasReputation: boolean;
  reputationLevel: ProductItem['reputationLevel'] | undefined;
  shopeeUseAds: boolean;
  shopeeAdsCpc: string;
  shopeeDailyBudget: string;
  shopeeSalesQuantity: string;
  shopeeTotalBudget: string;
  shopeeStartDate: string;
  shopeeEndDate: string;
  shopeeAdType: string;
  shopeeBidType: string;
  shopeeKeywords: string[];
  shopeeMaxCpc: string;
  shopeeStoreCouponEnabled: boolean;
  shopeeStoreCouponValue: string;
  shopeeStoreCouponType: 'percent' | 'fixed';
  shopeeProductCouponEnabled: boolean;
  shopeeProductCouponValue: string;
  shopeeProductCouponType: 'percent' | 'fixed';
  shopeeFollowerCouponEnabled: boolean;
  shopeeFollowerCouponValue: string;
  shopeeFollowerCouponType: 'percent' | 'fixed';
  shopeeSellerVoucherEnabled: boolean;
  shopeeSellerVoucherValue: string;
  shopeeSellerVoucherType: 'percent' | 'fixed';
  mercadoAdsEnabled: boolean;
  mercadoAdsManagementMode: 'automatico' | 'personalizado';
  mercadoAdsSolution: 'product_ads' | 'display_ads' | 'brand_ads';
  mercadoAdsSelection: string;
  mercadoAdsDailyBudget: string;
  mercadoAdsAcosTarget: string;
  mercadoAdsSalesQuantity: string;
  mercadoAdsCpc: string;
  mercadoAdsConversionRate: string;
  tiktokAdsEnabled: boolean;
  tiktokAdFormat: ProductItem['tiktokAdFormat'] | '';
  tiktokAudience: string;
  tiktokCampaignObjective: ProductItem['tiktokCampaignObjective'] | '';
  tiktokDailyBudget: string;
  tiktokCampaignId: string;
  roiTarget: string;
  tiktokPromoProductValue: string;
  tiktokPromoProductType: 'fixed' | 'percent';
  tiktokPromoProductUntil: string;
  tiktokPromoNewCustomerValue: string;
  tiktokPromoNewCustomerType: 'fixed' | 'percent';
  tiktokPromoShippingValue: string;
  tiktokPromoShippingType: 'fixed' | 'percent';
  tiktokCPA: string;
  tiktokAdsSalesQuantity: string;
  tiktokCPM: string;
  tiktokCTR: string;
  tiktokCVR: string;
  tiktokCatalogId: string;
  tiktokSfpEnabled: boolean;
  campaignName: string;
  campaignObjective: string;
  budgetType: string;
  conversion: string;
  startDate: string;
  endDate: string;
  investmentValue: string;
  audienceLocation: string;
  audienceAge: string;
  audienceGender: string;
  audienceInterests: string;
  audienceBehavior: string;
  placement: string;
  adText: string;
  adTitle: string;
  adMedia: string;
  adCta: string;
  adUrl: string;
  adRedirectUrl: string;
  instagramAccount: string;
  instantForm: boolean;
  organicChannels: string[];
  organicChannelLinks: Record<string, string>;
  organicChannelNames: Record<string, string>;
  influencers: Array<{
    id: string;
    name: string;
    instagram?: string;
    tiktok?: string;
    twitter?: string;
    percentage: string;
  }>;
  affiliates: Array<{
    id: string;
    name: string;
    percentage: string;
  }>;
  promoVideoUrl: string;
  promoVideoCopy: string;
  promoVideoChannels: string[];
  promoVideoChannelLinks: Record<string, string>;
  promoVideoChannelNames: Record<string, string>;
  promoVideoChannelCopies: Record<string, string>;
  additionalVideos: Array<{
    id: string;
    url: string;
    copy: string;
  }>;
  lowestMarketplacePrice: string;
};

export const EditProductDialog: React.FC<EditProductDialogProps> = ({ product, isOpen, onClose, onSave, mode = 'edit' }) => {
  const { organizationId } = useSettings();
  const { influencers: influencersDB, loading: loadingInfluencers } = useInfluencers(organizationId ?? undefined);
  const { affiliates: affiliatesDB, loading: loadingAffiliates } = useAffiliates(organizationId ?? undefined);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [accountHolders, setAccountHolders] = useState<AccountHolder[]>([]);
  const [marketplaces, setMarketplaces] = useState<Marketplace[]>([]);
  const [isInvestModalOpen, setIsInvestModalOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [accountHolderWarning, setAccountHolderWarning] = useState('');
  const [sellingPriceWarning, setSellingPriceWarning] = useState('');
  const submitLabel = mode === 'duplicate' ? 'Duplicar' : 'Salvar alterações';
  const duplicateSuffix = mode === 'duplicate'
    ? (product?.id ? product.id.replace(/-/g, '').slice(0, 4).toUpperCase() : 'COPY')
    : '';
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
    return '';
  };
  const formatDateToIso = (value?: string) => {
    if (!value) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
      const [day, month, year] = value.split('/');
      return `${year}-${month}-${day}`;
    }
    return '';
  };
  const normalizeMarketplaceValue = (value?: string | null) => {
    if (!value) return '';
    const normalized = value.trim().toLowerCase();
    const deaccented = normalized.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const compact = deaccented.replace(/\s/g, '');
    const mapped: Record<string, string> = {
      'mercadolivre': 'mercadolivre',
      'mercado livre': 'mercadolivre',
      'ml': 'mercadolivre',
      'shopee': 'shopee',
      'tiktok': 'tiktok',
      'tiktokshop': 'tiktok',
      'siteproprio': 'wordpress',
      'site proprio': 'wordpress',
      'wordpress': 'wordpress',
      'enjoei': 'enjoei',
      'amazon': 'amazon',
      'shein': 'shein',
      'facebook': 'facebook',
      'olx': 'olx'
    };
    return mapped[deaccented] ?? mapped[compact] ?? compact;
  };
  const buildFormData = (source: ProductItem | null): EditProductFormData => {
    const baseName = source?.name || '';
    const baseSku = source?.sku || '';
    const resolvedName = mode === 'duplicate' && baseName ? `${baseName} (Cópia)` : baseName;
    const resolvedSku = mode === 'duplicate' && baseSku ? `${baseSku}-COPIA-${duplicateSuffix}` : baseSku;
    return ({
      name: resolvedName,
      description: source?.description || '',
      imageUrl: source?.imageUrl || '',
      sku: resolvedSku,
      stockQuantity: source?.stockQuantity !== undefined && source?.stockQuantity !== null ? String(source.stockQuantity) : '0',
    marketplace: normalizeMarketplaceValue(source?.marketplace) || '',
    adType: source?.adType || 'classico',
    enjoeiAdType: source?.enjoeiAdType || 'classico',
    supplierName: source?.supplierName || '',
    mlCategory: source?.mlCategory || '',
    weight: source?.weight !== undefined && source?.weight !== null ? String(source.weight) : '',
    width: source?.width !== undefined && source?.width !== null ? String(source.width) : '',
    height: source?.height !== undefined && source?.height !== null ? String(source.height) : '',
    depth: source?.depth !== undefined && source?.depth !== null ? String(source.depth) : '',
    accountHolder: source?.accountHolder || '',
    accountType: source?.accountType ?? 'cpf',
    sellingPrice: source?.sellingPrice || '',
    costPrice: source?.costPrice || '',
    mlShippingCost: source?.mlShippingCost || '',
    marketplaceShippingCost: source?.marketplaceShippingCost || '',
    operationMode: source?.operationMode || '',
    gatewayMethod: source?.gatewayMethod || '',
    gatewayBank: source?.gatewayBank || '',
    gatewayFeeValue: source?.gatewayFeeValue !== undefined && source?.gatewayFeeValue !== null ? String(source.gatewayFeeValue) : '',
    gatewayFeeType: source?.gatewayFeeType || 'percent',
    gatewayInstallments: source?.gatewayInstallments !== undefined && source?.gatewayInstallments !== null ? String(source.gatewayInstallments) : '1',
    supplierFeeType: source?.supplierFeeType || 'percent',
    supplierFeeValue: source?.supplierFeeValue !== undefined && source?.supplierFeeValue !== null ? String(source.supplierFeeValue) : '',
    supplierGatewayFeeType: source?.supplierGatewayFeeType || 'fixed',
    supplierGatewayFeeValue: source?.supplierGatewayFeeValue !== undefined && source?.supplierGatewayFeeValue !== null ? String(source.supplierGatewayFeeValue) : '',
    shopeeFreeShipping: source?.shippingOption === 'with',
    shippingFee: source?.marketplaceShippingCost !== undefined && source?.marketplaceShippingCost !== null ? String(source.marketplaceShippingCost) : '',
    videoGenerationLlm: source?.videoGenerationLlm || '',
    targetAudienceAge: source?.targetAudienceAge || '',
    targetAudienceLocation: source?.targetAudienceLocation || '',
    targetAudienceInterests: source?.targetAudienceInterests || '',
    targetAudienceBehaviors: source?.targetAudienceBehaviors || '',
    adPlacement: source?.adPlacement || '',
    adFormat: source?.adFormat || '',
    isNewProduct: source?.isNewProduct || '',
    defectiveProduct: source?.defectiveProduct || '',
    facebookDelivery: source?.facebookDelivery ?? undefined,
    hasReputation: source?.hasReputation ?? false,
    reputationLevel: source?.reputationLevel ?? undefined,
    shopeeUseAds: source?.shopeeUseAds ?? false,
    shopeeAdsCpc: source?.shopeeAdsCpc !== undefined && source?.shopeeAdsCpc !== null ? String(source.shopeeAdsCpc) : '0',
    shopeeDailyBudget: source?.shopeeDailyBudget !== undefined && source?.shopeeDailyBudget !== null ? String(source.shopeeDailyBudget) : '',
    shopeeSalesQuantity: source?.shopeeSalesQuantity !== undefined && source?.shopeeSalesQuantity !== null ? String(source.shopeeSalesQuantity) : '0',
    shopeeTotalBudget: source?.shopeeTotalBudget !== undefined && source?.shopeeTotalBudget !== null ? String(source.shopeeTotalBudget) : '',
    shopeeStartDate: formatDateToBr(source?.shopeeStartDate || ''),
    shopeeEndDate: formatDateToBr(source?.shopeeEndDate || ''),
    shopeeAdType: source?.shopeeAdType || 'descoberta',
    shopeeBidType: source?.shopeeBidType || 'automatico',
    shopeeKeywords: Array.isArray(source?.shopeeKeywords) ? source?.shopeeKeywords : [],
    shopeeMaxCpc: source?.shopeeMaxCpc !== undefined && source?.shopeeMaxCpc !== null ? String(source.shopeeMaxCpc) : '',
    shopeeStoreCouponEnabled: source?.shopeeStoreCouponEnabled ?? false,
    shopeeStoreCouponValue: source?.shopeeStoreCouponValue !== undefined && source?.shopeeStoreCouponValue !== null ? String(source.shopeeStoreCouponValue) : '',
    shopeeStoreCouponType: source?.shopeeStoreCouponType || 'percent',
    shopeeProductCouponEnabled: source?.shopeeProductCouponEnabled ?? false,
    shopeeProductCouponValue: source?.shopeeProductCouponValue !== undefined && source?.shopeeProductCouponValue !== null ? String(source.shopeeProductCouponValue) : '',
    shopeeProductCouponType: source?.shopeeProductCouponType || 'percent',
    shopeeFollowerCouponEnabled: source?.shopeeFollowerCouponEnabled ?? false,
    shopeeFollowerCouponValue: source?.shopeeFollowerCouponValue !== undefined && source?.shopeeFollowerCouponValue !== null ? String(source.shopeeFollowerCouponValue) : '',
    shopeeFollowerCouponType: source?.shopeeFollowerCouponType || 'percent',
    shopeeSellerVoucherEnabled: source?.shopeeSellerVoucherEnabled ?? false,
    shopeeSellerVoucherValue: source?.shopeeSellerVoucherValue !== undefined && source?.shopeeSellerVoucherValue !== null ? String(source.shopeeSellerVoucherValue) : '',
    shopeeSellerVoucherType: source?.shopeeSellerVoucherType || 'percent',
    mercadoAdsEnabled: source?.mercadoAdsEnabled ?? false,
    mercadoAdsManagementMode: source?.mercadoAdsManagementMode || 'automatico',
    mercadoAdsSolution: source?.mercadoAdsSolution || 'product_ads',
    mercadoAdsSelection: source?.mercadoAdsSelection || '',
    mercadoAdsDailyBudget: source?.mercadoAdsDailyBudget !== undefined && source?.mercadoAdsDailyBudget !== null ? String(source.mercadoAdsDailyBudget) : '',
    mercadoAdsAcosTarget: source?.mercadoAdsAcosTarget !== undefined && source?.mercadoAdsAcosTarget !== null ? String(source.mercadoAdsAcosTarget) : '',
    mercadoAdsSalesQuantity: source?.mercadoAdsSalesQuantity !== undefined && source?.mercadoAdsSalesQuantity !== null ? String(source.mercadoAdsSalesQuantity) : '',
    mercadoAdsCpc: source?.mercadoAdsCpc !== undefined && source?.mercadoAdsCpc !== null ? String(source.mercadoAdsCpc) : '',
    mercadoAdsConversionRate: source?.mercadoAdsConversionRate !== undefined && source?.mercadoAdsConversionRate !== null ? String(source.mercadoAdsConversionRate) : '',
    tiktokAdsEnabled: source?.tiktokAdsEnabled ?? false,
    tiktokAdFormat: source?.tiktokAdFormat || 'in_feed',
    tiktokAudience: source?.tiktokAudience || '',
    tiktokCampaignObjective: source?.tiktokCampaignObjective || 'conversions',
    tiktokDailyBudget: source?.tiktokDailyBudget !== undefined && source?.tiktokDailyBudget !== null ? String(source.tiktokDailyBudget) : '',
    tiktokCampaignId: (source as { tiktokCampaignId?: string })?.tiktokCampaignId || '',
    roiTarget: (source as { roiTarget?: number | string })?.roiTarget != null ? String((source as { roiTarget?: number | string }).roiTarget) : '',
    tiktokPromoProductValue: (source as { tiktokPromoProductValue?: string })?.tiktokPromoProductValue || '',
    tiktokPromoProductType: ((source as { tiktokPromoProductType?: string })?.tiktokPromoProductType as 'fixed' | 'percent') || 'fixed',
    tiktokPromoProductUntil: (source as { tiktokPromoProductUntil?: string })?.tiktokPromoProductUntil || '',
    tiktokPromoNewCustomerValue: (source as { tiktokPromoNewCustomerValue?: string })?.tiktokPromoNewCustomerValue || '',
    tiktokPromoNewCustomerType: ((source as { tiktokPromoNewCustomerType?: string })?.tiktokPromoNewCustomerType as 'fixed' | 'percent') || 'fixed',
    tiktokPromoShippingValue: (source as { tiktokPromoShippingValue?: string })?.tiktokPromoShippingValue || '',
    tiktokPromoShippingType: ((source as { tiktokPromoShippingType?: string })?.tiktokPromoShippingType as 'fixed' | 'percent') || 'fixed',
    tiktokCPA: source?.tiktokCPA !== undefined && source?.tiktokCPA !== null ? String(source.tiktokCPA) : '',
    tiktokAdsSalesQuantity: source?.tiktokAdsSalesQuantity !== undefined && source?.tiktokAdsSalesQuantity !== null ? String(source.tiktokAdsSalesQuantity) : '',
    tiktokCPM: source?.tiktokCPM !== undefined && source?.tiktokCPM !== null ? String(source.tiktokCPM) : '',
    tiktokCTR: source?.tiktokCTR !== undefined && source?.tiktokCTR !== null ? String(source.tiktokCTR) : '',
    tiktokCVR: source?.tiktokCVR !== undefined && source?.tiktokCVR !== null ? String(source.tiktokCVR) : '',
    tiktokCatalogId: source?.tiktokCatalogId || '',
    tiktokSfpEnabled: source?.tiktokSfpEnabled ?? false,
    campaignName: source?.campaignName || '',
    campaignObjective: source?.campaignObjective || '',
    budgetType: source?.budgetType || '',
    conversion: source?.conversion || '',
    startDate: formatDateToBr(source?.startDate || ''),
    endDate: formatDateToBr(source?.endDate || ''),
    investmentValue: source?.investmentValue !== undefined && source?.investmentValue !== null ? String(source.investmentValue) : '',
    audienceLocation: source?.audienceLocation || '',
    audienceAge: source?.audienceAge || '',
    audienceGender: source?.audienceGender || '',
    audienceInterests: source?.audienceInterests || '',
    audienceBehavior: source?.audienceBehavior || '',
    placement: source?.placement || '',
    adText: source?.adText || '',
    adTitle: source?.adTitle || '',
    adMedia: source?.adMedia || '',
    adCta: source?.adCta || '',
    adUrl: source?.adUrl || '',
    adRedirectUrl: source?.adRedirectUrl || '',
    instagramAccount: source?.instagramAccount || '',
    instantForm: source?.instantForm ?? false,
    organicChannels: Array.isArray(source?.organicChannels)
      ? source?.organicChannels.filter((item): item is string => typeof item === 'string')
      : [],
    organicChannelLinks: source?.organicChannelLinks ?? {},
    organicChannelNames: source?.organicChannelNames ?? {},
    influencers: Array.isArray(source?.influencers) ? source.influencers : [],
    affiliates: Array.isArray(source?.affiliates) ? source.affiliates : [],
    promoVideoUrl: source?.promoVideoUrl || '',
    promoVideoCopy: source?.promoVideoCopy || '',
    promoVideoChannels: Array.isArray(source?.promoVideoChannels) ? source.promoVideoChannels : [],
    promoVideoChannelLinks: source?.promoVideoChannelLinks || {},
    promoVideoChannelNames: source?.promoVideoChannelNames || {},
    promoVideoChannelCopies: source?.promoVideoChannelCopies || {},
    additionalVideos: Array.isArray(source?.additionalVideos) ? source.additionalVideos : [],
    lowestMarketplacePrice: source?.lowestMarketplacePrice !== undefined && source?.lowestMarketplacePrice !== null ? String(source.lowestMarketplacePrice) : '',
    });
  };
  const [formData, setFormData] = useState<EditProductFormData>(() => buildFormData(product));
  const [shopeeKeywordInput, setShopeeKeywordInput] = useState('');
  const [orgImpressions] = useState('');
  const [orgClicks] = useState('');
  const [orgSales] = useState('');
  const [extraImageUrls, setExtraImageUrls] = useState<string[]>([]);
  // Enriched variations with images fetched from products_variations_bling
  const [enrichedVariations, setEnrichedVariations] = useState<import('@/types/calculator').ProductVariationRecord[]>([]);
  const dragIndexRef = useRef<number | null>(null);

  // Fetch extra image URLs from products_bling when dialog opens
  useEffect(() => {
    if (!product?.sku || !isOpen) return;
    const sku = product.sku;
    supabase
      .from('products_bling')
      .select('image_url,image_url1,image_url2,image_url3,image_url4,image_url5,image_url6,image_url7,image_url8,image_url9,image_url10')
      .eq('sku', sku)
      .limit(1)
      .single()
      .then(({ data }) => {
        if (!data) return;
        const raw = [
          data.image_url, data.image_url1, data.image_url2, data.image_url3,
          data.image_url4, data.image_url5, data.image_url6, data.image_url7,
          data.image_url8, data.image_url9, data.image_url10,
        ];
        // Sanitize: some fields may be JSON strings like [{"link":"https://..."}]
        const urls = raw
          .flatMap((u) => {
            if (!u || typeof u !== 'string' || !u.trim()) return [];
            const trimmed = u.trim();
            // Try to parse as JSON array of {link: string}
            if (trimmed.startsWith('[')) {
              try {
                const parsed = JSON.parse(trimmed) as Array<{ link?: string; url?: string }>;
                return parsed.map((item) => item.link || item.url || '').filter(Boolean);
              } catch { /* not JSON */ }
            }
            // Try to parse as JSON object
            if (trimmed.startsWith('{')) {
              try {
                const parsed = JSON.parse(trimmed) as { link?: string; url?: string };
                return [parsed.link || parsed.url || ''].filter(Boolean);
              } catch { /* not JSON */ }
            }
            return [trimmed];
          })
          .filter((u) => u.startsWith('http'));
        // Deduplicate
        setExtraImageUrls([...new Set(urls)]);
      });
  }, [product?.sku, isOpen]);

  // Fetch variation images from products_variations_bling when dialog opens
  useEffect(() => {
    const variations = product?.variations;
    if (!variations || variations.length === 0 || !isOpen) {
      setEnrichedVariations([]);
      return;
    }
    // Already have images — no need to fetch
    const alreadyHasImages = variations.some((v) => v.imageUrl || (v.imageUrls && v.imageUrls.length > 0));
    if (alreadyHasImages) {
      setEnrichedVariations(variations);
      return;
    }
    const skus = variations.map((v) => v.sku).filter(Boolean) as string[];
    if (skus.length === 0) {
      setEnrichedVariations(variations);
      return;
    }
    supabase
      .from('products_variations_bling')
      .select('sku, image_url1, image_url2, image_url3, image_url4, image_url5')
      .in('sku', skus)
      .then(({ data }) => {
        if (!data || data.length === 0) {
          setEnrichedVariations(variations);
          return;
        }
        type BlingVarRow = { sku: string; image_url1?: string | null; image_url2?: string | null; image_url3?: string | null; image_url4?: string | null; image_url5?: string | null };
        const imagesBySku: Record<string, string[]> = {};
        for (const row of data as BlingVarRow[]) {
          const imgs = [row.image_url1, row.image_url2, row.image_url3, row.image_url4, row.image_url5]
            .filter((u): u is string => !!u && u.startsWith('http'));
          if (imgs.length > 0) imagesBySku[row.sku] = imgs;
        }
        const enriched = variations.map((v) => {
          if (!v.sku || v.imageUrl || (v.imageUrls && v.imageUrls.length > 0)) return v;
          const imgs = imagesBySku[v.sku];
          if (!imgs) return v;
          return { ...v, imageUrl: imgs[0], imageUrls: imgs };
        });
        setEnrichedVariations(enriched);
      });
  }, [product?.variations, isOpen]);
  const videoModelLabels: Record<NonNullable<ProductItem['videoGenerationLlm']>, string> = {
    veo3: 'Veo3',
    sora2: 'Sora2',
    grok: 'Grok',
    wan2: 'Wan 2',
    copia: 'Cópia',
    kling: 'Kling',
    runway: 'Runway',
    luma: 'Luma',
    pika25: 'Pika 2.5',
    seedance: 'Seedance'
  };
  const hasShopeeAdsData = Boolean(
    formData.shopeeTotalBudget
    || formData.shopeeDailyBudget
    || formData.shopeeStartDate
    || formData.shopeeEndDate
    || formData.shopeeMaxCpc
    || (Array.isArray(formData.shopeeKeywords) && formData.shopeeKeywords.length > 0)
  );
  const shouldShowShopeeAdsFields = formData.shopeeUseAds || hasShopeeAdsData;
  const hasMercadoAdsData = Boolean(
    formData.mercadoAdsDailyBudget
    || formData.mercadoAdsAcosTarget
    || formData.mercadoAdsSelection
    || formData.mercadoAdsSalesQuantity
    || formData.mercadoAdsCpc
    || formData.mercadoAdsConversionRate
  );
  const shouldShowMercadoAdsFields = formData.mercadoAdsEnabled || hasMercadoAdsData;

  const getDefaultMarketplaceImage = (value: string | undefined) => {
    switch (value) {
      case 'enjoei':
        return 'https://placehold.co/300x300?text=ENJOEI';
      case 'shein':
        return 'https://placehold.co/300x300?text=SHEIN';
      case 'mercadolivre':
        return 'https://placehold.co/300x300?text=ML';
      case 'amazon':
        return 'https://placehold.co/600x400?text=AM';
      case 'shopee':
        return 'https://placehold.co/600x400?text=Shopee';
      case 'tiktok':
        return 'https://placehold.co/600x400?text=TikTok';
      case 'wordpress':
        return 'https://placehold.co/600x400?text=SITE';
      case 'facebook':
        return 'https://placehold.co/600x400?text=Facebook';
      case 'olx':
        return 'https://placehold.co/600x400?text=OLX';
      default:
        return 'https://placehold.co/100x100?text=No+Image';
    }
  };
  const formatMoney = (value: string | number) => formatCurrency(value);
  const formatPercent = (value: string | number, digits: number = 1) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (Number.isNaN(num)) return '0';
    return num.toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits });
  };

  // Fetch references
  useEffect(() => {
    if (isOpen) {
        const loadReferences = async () => {
            try {
                const [suppliersData, holdersData, marketplacesData] = await Promise.all([
                    ReferenceService.getSuppliers(organizationId || undefined),
                    ReferenceService.getAccountHolders(organizationId || undefined),
                    ReferenceService.getMarketplaces(organizationId || undefined)
                ]);

                // Filter duplicates by name, preferring the first one found
                // (Assuming backend returns consistent order, or we accept either)
                const uniqueSuppliers = suppliersData.reduce((acc, current) => {
                    if (!acc.find(item => item.name === current.name)) {
                        acc.push(current);
                    }
                    return acc;
                }, [] as Supplier[]);

                const uniqueHolders = holdersData.reduce((acc, current) => {
                    if (!acc.find(item => item.name === current.name)) {
                        acc.push(current);
                    }
                    return acc;
                }, [] as AccountHolder[]);

                setSuppliers(uniqueSuppliers);
                setAccountHolders(uniqueHolders);
                setMarketplaces(marketplacesData);
            } catch (error) {
                console.error("Error loading references:", error);
            }
        };
        loadReferences();
    }
  }, [isOpen, organizationId]);

  const handleChange = <K extends keyof typeof formData>(field: K, value: (typeof formData)[K]) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'accountHolder' && value) {
        setAccountHolderWarning('');
      }
      if (field === 'isNewProduct' && value === 'sim') {
        next.defectiveProduct = '';
      }
      if (field === 'sellingPrice' || field === 'marketplace') {
        setSellingPriceWarning('');
      }
      // Auto-fill supplier fee defaults when supplier changes
      if (field === 'supplierName') {
        const normalized = (value as string).trim().toLowerCase();
        if (normalized === 'dogama') {
          next.supplierFeeType = 'percent';
          next.supplierFeeValue = '6';
          next.supplierGatewayFeeType = 'percent';
          next.supplierGatewayFeeValue = '2';
        } else if (normalized === 'tyr' || normalized === 'tyr (yeizidrop)') {
          next.supplierFeeType = 'percent';
          next.supplierFeeValue = '0';
          next.supplierGatewayFeeType = 'fixed';
          next.supplierGatewayFeeValue = '0';
        }
      }
      return next;
    });
  };

  const isValidImageUrl = (url: string) => new Promise<boolean>((resolve) => {
    if (!url.trim()) {
      resolve(false);
      return;
    }
    const img = new Image();
    const timer = setTimeout(() => {
      img.onload = null;
      img.onerror = null;
      resolve(false);
    }, 4000);
    img.onload = () => {
      clearTimeout(timer);
      img.onload = null;
      img.onerror = null;
      resolve(true);
    };
    img.onerror = () => {
      clearTimeout(timer);
      img.onload = null;
      img.onerror = null;
      resolve(false);
    };
    img.referrerPolicy = 'no-referrer';
    img.src = url;
  });

  const getUpdatedMetrics = () => {
    if (!formData.marketplace) return null;
    const sellingPrice = parseCurrency(formData.sellingPrice);
    const costPrice = parseCurrency(formData.costPrice);
    if (sellingPrice <= 0 && costPrice <= 0) return null;
    const adType = formData.adType || product?.adType || 'classico';
    const enjoeiAdType = formData.enjoeiAdType || product?.enjoeiAdType || 'classico';
    const amazonPlan = product?.amazonPlan === 'profissional' ? 'profissional' : 'individual';
    const mlShippingCost = parseCurrency(formData.mlShippingCost);
    const marketplaceShippingCost = parseCurrency(
      formData.marketplace === 'shopee' ? '0' : (formData.shippingFee || formData.marketplaceShippingCost)
    );
    const categoryValue = formData.mlCategory || (product as { category?: string })?.category || 'eletronicos';
    const accountTypeValue = (formData.accountType || product?.accountType || 'cnpj') as 'cpf' | 'cnpj';
    const shippingOption = formData.shopeeFreeShipping ? 'with' : 'without';
    const isMercadoLivre = formData.marketplace === 'mercadolivre';
    // TikTok commission from settings marketplaces, fallback to 6%
    const tiktokMarketplace = marketplaces.find(m => m.name?.toLowerCase() === 'tiktok');
    const tiktokCommVal = tiktokMarketplace?.commission_rate ?? 6;
    const isShopee = formData.marketplace === 'shopee';
    const adsEnabled = isMercadoLivre
      ? Boolean(formData.mercadoAdsEnabled || formData.mercadoAdsDailyBudget || formData.mercadoAdsSalesQuantity)
      : isShopee
        ? Boolean(formData.shopeeUseAds) // Respeitar apenas o checkbox
        : false;
    const cpc = isMercadoLivre
      ? parseCurrency(formData.mercadoAdsCpc ?? 0)
      : (formData.shopeeUseAds ? 0 : parseCurrency(formData.shopeeAdsCpc ?? 0));
    const conversionRate = isMercadoLivre
      ? (parseCurrency(formData.mercadoAdsConversionRate ?? 0) / 100)
      : 0;
    const dailyBudget = isMercadoLivre
      ? parseCurrency(formData.mercadoAdsDailyBudget ?? 0)
      : parseCurrency(formData.shopeeDailyBudget ?? 0);
    const salesQuantity = isMercadoLivre
      ? parseCurrency(formData.mercadoAdsSalesQuantity ?? 0)
      : parseCurrency(formData.shopeeSalesQuantity ?? 0);
    const paidTrafficValue = product?.trafficMode === 'paid' ? parseCurrency(product?.paidTraffic ?? 0) : 0;
    const shopeeStoreCoupon = formData.shopeeStoreCouponEnabled ? parseCurrency(formData.shopeeStoreCouponValue ?? 0) : 0;
    const shopeeProductCoupon = formData.shopeeProductCouponEnabled ? parseCurrency(formData.shopeeProductCouponValue ?? 0) : 0;
    const shopeeFollowerCoupon = formData.shopeeFollowerCouponEnabled ? parseCurrency(formData.shopeeFollowerCouponValue ?? 0) : 0;
    const shopeeSellerVoucher = formData.shopeeSellerVoucherEnabled ? parseCurrency(formData.shopeeSellerVoucherValue ?? 0) : 0;
    const supplierFeeType = formData.supplierFeeType || 'percent';
    const supplierFeeValue = parseCurrency(formData.supplierFeeValue ?? 0);
    const supplierGatewayFeeType = formData.supplierGatewayFeeType || 'fixed';
    const supplierGatewayFeeValue = parseCurrency(formData.supplierGatewayFeeValue ?? 0);
    const supplierGatewayFeePercent = supplierGatewayFeeType === 'percent' ? supplierGatewayFeeValue : 0;
    const supplierGatewayFixedFee = supplierGatewayFeeType === 'fixed' ? supplierGatewayFeeValue : 0;
    const gatewayFeeVal = parseCurrency(formData.gatewayFeeValue ?? 0);
    const gatewayFeeType = formData.gatewayFeeType || 'percent';
    const gatewayFeePercent = gatewayFeeType === 'percent' ? gatewayFeeVal : 0;
    const gatewayFixedFeeVal = gatewayFeeType === 'fixed' ? gatewayFeeVal : 0;

    return calculateMetrics(
      costPrice,
      0,
      supplierFeeValue,
      0,
      formData.marketplace,
      categoryValue,
      adType,
      shippingOption,
      accountTypeValue,
      0,
      adsEnabled,
      cpc,
      dailyBudget,
      salesQuantity,
      gatewayFeePercent,
      sellingPrice,
      0,
      0,
      tiktokCommVal,
      marketplaceShippingCost,
      0,
      0,
      paidTrafficValue,
      mlShippingCost,
      'percent',
      gatewayFixedFeeVal,
      0,
      0,
      enjoeiAdType,
      0,
      formData.gatewayBank || product?.gatewayBank || '',
      formData.gatewayMethod || product?.gatewayMethod || '',
      '',
      '',
      product?.meliPlus ?? false,
      supplierFeeType,
      supplierGatewayFeePercent,
      supplierGatewayFixedFee,
      supplierGatewayFeeType,
      amazonPlan,
      categoryValue,
      0,
      shopeeStoreCoupon,
      shopeeProductCoupon,
      shopeeFollowerCoupon,
      shopeeSellerVoucher,
      formData.shopeeStoreCouponType || product?.shopeeStoreCouponType || 'fixed',
      formData.shopeeProductCouponType || product?.shopeeProductCouponType || 'fixed',
      formData.shopeeFollowerCouponType || product?.shopeeFollowerCouponType || 'fixed',
      formData.shopeeSellerVoucherType || product?.shopeeSellerVoucherType || 'fixed',
      conversionRate
    , [], formData.affiliates
    );
  };

   
  const organicMetrics = useMemo(() => getUpdatedMetrics(), [
    getUpdatedMetrics,
  ]);
  const organicSuggestedPrice = parseFloat(organicMetrics?.suggestedPrice ?? '0');
  const organicAdsCostPerSale = parseFloat(organicMetrics?.adsCostPerSale ?? '0');



  // Always prefer organicMetrics (recalculated from pricingService) which correctly
  // deducts cost, commissions and fees. Fall back to stored netRevenue only when
  // organicMetrics is unavailable (no marketplace/price set yet).
  const organicNetRevenueBase = organicMetrics
    ? parseFloat(String(organicMetrics.netRevenue ?? '0'))
    : parseFloat(String(product?.netRevenue ?? '0'));

  // organicMetrics already calculates correctly using shippingOption from formData.shopeeFreeShipping
  // so we just use organicNetRevenueBase directly — no manual override needed.
  const organicNetRevenue = organicNetRevenueBase;

  const organicVideoCost = 0;

  const handleSave = async () => {
    if (!product) return;
    
    console.log('=== DEBUG SAVE ===');
    console.log('promoVideoChannels:', formData.promoVideoChannels);
    console.log('promoVideoChannelLinks:', formData.promoVideoChannelLinks);
    console.log('promoVideoChannelNames:', formData.promoVideoChannelNames);
    
    const trimmedImageUrl = formData.imageUrl.trim();
    const hasValidImage = trimmedImageUrl ? await isValidImageUrl(trimmedImageUrl) : false;
    const resolvedImageUrl = hasValidImage
      ? trimmedImageUrl
      : getDefaultMarketplaceImage(formData.marketplace || product.marketplace);
    const originalSelling = parseCurrency(product.sellingPrice ?? 0);
    const originalCost = parseCurrency(product.costPrice ?? 0);
    const originalShipping = product.marketplace === 'mercadolivre'
      ? parseCurrency(product.mlShippingCost ?? 0)
      : parseCurrency(product.marketplaceShippingCost ?? 0);
    const nextMarketplace = formData.marketplace || product.marketplace || '';
    const nextSelling = parseCurrency(formData.sellingPrice);
    const nextCost = parseCurrency(formData.costPrice);
    const nextShipping = nextMarketplace === 'mercadolivre'
      ? parseCurrency(formData.mlShippingCost)
      : parseCurrency(formData.marketplaceShippingCost);
    const sameMarketplace = nextMarketplace === (product.marketplace || '');
    const sameAdType = nextMarketplace === 'mercadolivre'
      ? (formData.adType || product.adType || 'classico') === (product.adType || 'classico')
      : true;
    const sameEnjoeiAdType = nextMarketplace === 'enjoei'
      ? (formData.enjoeiAdType || product.enjoeiAdType || 'classico') === (product.enjoeiAdType || 'classico')
      : true;
    if (nextMarketplace === 'mercadolivre' && nextSelling < 8) {
      setSellingPriceWarning('O preço de venda precisa ser maior que R$8,00');
      return;
    }
    const shouldPreserveMetrics = sameMarketplace && nextSelling === originalSelling && nextCost === originalCost && nextShipping === originalShipping && sameAdType && sameEnjoeiAdType;
    const metrics = shouldPreserveMetrics ? null : getUpdatedMetrics();
    const savedNetRevenue = shouldPreserveMetrics
      ? product.netRevenue
      : (parseFloat(String(metrics?.netRevenue ?? product.netRevenue)));
    const isShopee = nextMarketplace === 'shopee';
    const isMercadoLivre = nextMarketplace === 'mercadolivre';
    const shopeeStartDateIso = formatDateToIso(formData.shopeeStartDate);
    const shopeeEndDateIso = formatDateToIso(formData.shopeeEndDate);
    // Respeitar a escolha do usuário: só usar ads se o checkbox estiver marcado
    const shouldUseShopeeAds = isShopee && formData.shopeeUseAds;
    const hasMercadoAdsData = Boolean(
      formData.mercadoAdsDailyBudget
      || formData.mercadoAdsAcosTarget
      || formData.mercadoAdsSelection
      || formData.mercadoAdsSalesQuantity
    );
    const shouldUseMercadoAds = isMercadoLivre && (formData.mercadoAdsEnabled || hasMercadoAdsData);
    const normalizedTiktokAdFormat = formData.tiktokAdFormat || undefined;
    const normalizedTiktokObjective = formData.tiktokCampaignObjective || undefined;
    const updated = {
      ...product,
      ...formData,
      stockQuantity: parseInt(formData.stockQuantity) || 0,
      imageUrl: resolvedImageUrl,
      operationMode: formData.operationMode || product.operationMode,
      gatewayMethod: formData.gatewayMethod || product.gatewayMethod,
      gatewayBank: formData.gatewayBank || product.gatewayBank,
      gatewayFeeValue: formData.gatewayFeeValue || product.gatewayFeeValue,
      gatewayFeeType: formData.gatewayFeeType || product.gatewayFeeType || 'percent',
      gatewayInstallments: formData.gatewayInstallments || product.gatewayInstallments,
      videoGenerationLlm: formData.videoGenerationLlm || product.videoGenerationLlm,
      marketplace: nextMarketplace,
      supplierName: formData.supplierName || product.supplierName,
      mlCategory: formData.mlCategory || undefined,
      adType: isMercadoLivre ? formData.adType : undefined,
      hasReputation: isMercadoLivre ? formData.hasReputation : undefined,
      reputationLevel: isMercadoLivre && formData.hasReputation ? (formData.reputationLevel || 'positive') : undefined,
      enjoeiAdType: nextMarketplace === 'enjoei' ? formData.enjoeiAdType : undefined,
      facebookDelivery: nextMarketplace === 'facebook' ? formData.facebookDelivery : undefined,
      netRevenue: savedNetRevenue,
      marginStatus: shouldPreserveMetrics ? product.marginStatus : (metrics?.marginStatus ?? product.marginStatus),
      adPlacement: formData.adPlacement || undefined,
      adFormat: formData.adFormat || undefined,
      isNewProduct: formData.isNewProduct || undefined,
      defectiveProduct: formData.defectiveProduct || undefined,
      shopeeUseAds: isShopee ? shouldUseShopeeAds : undefined,
      shopeeAdsCpc: isShopee ? formData.shopeeAdsCpc : undefined,
      shopeeDailyBudget: isShopee ? formData.shopeeDailyBudget : undefined,
      shopeeSalesQuantity: isShopee ? formData.shopeeSalesQuantity : undefined,
      shopeeTotalBudget: isShopee ? formData.shopeeTotalBudget : undefined,
      shopeeStartDate: isShopee ? (shopeeStartDateIso || undefined) : undefined,
      shopeeEndDate: isShopee ? (shopeeEndDateIso || undefined) : undefined,
      shopeeAdType: isShopee ? formData.shopeeAdType : undefined,
      shopeeBidType: isShopee ? formData.shopeeBidType : undefined,
      shopeeKeywords: isShopee ? formData.shopeeKeywords : undefined,
      shopeeMaxCpc: isShopee ? formData.shopeeMaxCpc : undefined,
      shopeeStoreCouponEnabled: isShopee ? formData.shopeeStoreCouponEnabled : undefined,
      shopeeStoreCouponValue: isShopee ? formData.shopeeStoreCouponValue : undefined,
      shopeeStoreCouponType: isShopee ? formData.shopeeStoreCouponType : undefined,
      shopeeProductCouponEnabled: isShopee ? formData.shopeeProductCouponEnabled : undefined,
      shopeeProductCouponValue: isShopee ? formData.shopeeProductCouponValue : undefined,
      shopeeProductCouponType: isShopee ? formData.shopeeProductCouponType : undefined,
      shopeeFollowerCouponEnabled: isShopee ? formData.shopeeFollowerCouponEnabled : undefined,
      shopeeFollowerCouponValue: isShopee ? formData.shopeeFollowerCouponValue : undefined,
      shopeeFollowerCouponType: isShopee ? formData.shopeeFollowerCouponType : undefined,
      shopeeSellerVoucherEnabled: isShopee ? formData.shopeeSellerVoucherEnabled : undefined,
      shopeeSellerVoucherValue: isShopee ? formData.shopeeSellerVoucherValue : undefined,
      shopeeSellerVoucherType: isShopee ? formData.shopeeSellerVoucherType : undefined,
      mercadoAdsEnabled: isMercadoLivre ? shouldUseMercadoAds : undefined,
      mercadoAdsManagementMode: isMercadoLivre ? formData.mercadoAdsManagementMode : undefined,
      mercadoAdsSolution: isMercadoLivre ? formData.mercadoAdsSolution : undefined,
      mercadoAdsSelection: isMercadoLivre ? formData.mercadoAdsSelection : undefined,
      mercadoAdsDailyBudget: isMercadoLivre ? formData.mercadoAdsDailyBudget : undefined,
      mercadoAdsAcosTarget: isMercadoLivre ? formData.mercadoAdsAcosTarget : undefined,
      mercadoAdsSalesQuantity: isMercadoLivre ? formData.mercadoAdsSalesQuantity : undefined,
      mercadoAdsCpc: isMercadoLivre ? formData.mercadoAdsCpc : undefined,
      mercadoAdsConversionRate: isMercadoLivre ? formData.mercadoAdsConversionRate : undefined,
      tiktokCPA: formData.tiktokCPA,
      tiktokAdsSalesQuantity: formData.tiktokAdsSalesQuantity,
      tiktokAdFormat: normalizedTiktokAdFormat,
      tiktokCampaignObjective: normalizedTiktokObjective,
      tiktokCPM: formData.tiktokCPM,
      tiktokCTR: formData.tiktokCTR,
      tiktokCVR: formData.tiktokCVR,
      tiktokCatalogId: formData.tiktokCatalogId,
      campaignName: formData.campaignName,
      campaignObjective: formData.campaignObjective,
      budgetType: formData.budgetType,
      conversion: formData.conversion,
      startDate: formatDateToIso(formData.startDate),
      endDate: formatDateToIso(formData.endDate),
      investmentValue: parseCurrency(formData.investmentValue),
      paidTraffic: parseCurrency(formData.investmentValue),
      audienceLocation: formData.audienceLocation,
      audienceAge: formData.audienceAge,
      audienceGender: formData.audienceGender,
      audienceInterests: formData.audienceInterests,
      audienceBehavior: formData.audienceBehavior,
      placement: formData.placement,
      adText: formData.adText,
      adTitle: formData.adTitle,
      adMedia: formData.adMedia,
      adCta: formData.adCta,
      adUrl: formData.adUrl,
      adRedirectUrl: formData.adRedirectUrl,
      instagramAccount: formData.instagramAccount,
      instantForm: formData.instantForm,
      organicChannels: formData.organicChannels,
      organicChannelLinks: formData.organicChannelLinks,
      organicChannelNames: formData.organicChannelNames,
      influencers: formData.influencers,
      affiliates: formData.affiliates,
      promoVideoUrl: formData.promoVideoUrl,
      promoVideoCopy: formData.promoVideoCopy,
      promoVideoChannels: formData.promoVideoChannels,
      promoVideoChannelLinks: formData.promoVideoChannelLinks,
      promoVideoChannelNames: formData.promoVideoChannelNames,
      promoVideoChannelCopies: formData.promoVideoChannelCopies,
      additionalVideos: formData.additionalVideos,
      shippingOption: (formData.shopeeFreeShipping ? 'with' : 'without') as 'with' | 'without',
      marketplaceShippingCost: formData.marketplace === 'shopee' ? undefined : formData.shippingFee,
      lowestMarketplacePrice: parseCurrency(formData.lowestMarketplacePrice),
    };
    
    console.log('=== UPDATED PRODUCT ===');
    console.log('promoVideoChannels:', updated.promoVideoChannels);
    console.log('promoVideoChannelLinks:', updated.promoVideoChannelLinks);
    console.log('promoVideoChannelNames:', updated.promoVideoChannelNames);
    
    onSave(updated);
    
    // Dual-write: Salvar conteúdo promocional na nova tabela normalizada
    try {
      if (product.organizationId) {
        await productPromotionalContentService.upsert(
          product.id,
          product.organizationId,
          {
            promoVideoUrl: formData.promoVideoUrl,
            promoVideoCopy: formData.promoVideoCopy,
            promoVideoChannels: formData.promoVideoChannels,
            promoVideoChannelLinks: formData.promoVideoChannelLinks,
            promoVideoChannelNames: formData.promoVideoChannelNames,
            organicChannels: formData.organicChannels,
            organicChannelLinks: formData.organicChannelLinks,
            organicChannelNames: formData.organicChannelNames
          }
        );
        console.log('✅ Conteúdo promocional salvo na tabela normalizada');
      }
    } catch (error) {
      console.error('❌ Erro ao salvar conteúdo promocional:', error);
      // Não bloqueia o fluxo - o produto já foi salvo
    }
    
    onClose();
  };

  const handleInvestSave = () => {
    if (!product) return;
    const updated = {
      ...product,
      targetAudienceAge: formData.targetAudienceAge,
      targetAudienceLocation: formData.targetAudienceLocation,
      targetAudienceInterests: formData.targetAudienceInterests,
      targetAudienceBehaviors: formData.targetAudienceBehaviors,
      adPlacement: formData.adPlacement || undefined,
      adFormat: formData.adFormat || undefined,
    };
    onSave(updated);
    setIsInvestModalOpen(false);
  };

  const marketplaceOptions = [
    { value: 'mercadolivre', label: 'Mercado Livre' },
    { value: 'shopee', label: 'Shopee' },
    { value: 'tiktok', label: 'TikTok Shop' },
    { value: 'wordpress', label: 'Site Próprio' },
    { value: 'enjoei', label: 'Enjoei' },
    { value: 'amazon', label: 'Amazon' },
    { value: 'shein', label: 'Shein' },
    { value: 'facebook', label: 'Facebook' },
    { value: 'olx', label: 'OLX' }
  ];
  const customMarketplaceOptions = marketplaces
    .filter((mp) => !marketplaceOptions.some((option) => option.value === mp.name.toLowerCase().replace(/\s/g, '')))
    .map((mp) => ({
      value: mp.name.toLowerCase().replace(/\s/g, ''),
      label: mp.name
    }));
  const allMarketplaceOptions = [...marketplaceOptions, ...customMarketplaceOptions];
  const marketplaceLabel = allMarketplaceOptions.find((option) => option.value === formData.marketplace)?.label || formData.marketplace || 'Marketplace';
  const couponPlaceholder = (type: 'fixed' | 'percent') => type === 'percent' ? '0' : '0,00';
  const couponSuffix = (type: 'fixed' | 'percent') => type === 'percent' ? '%' : 'R$';

  const handleMarketplaceChange = (value: string) => {
    setFormData((prev) => {
      const next = { ...prev, marketplace: value };
      if (value === 'mercadolivre' && !prev.adType) {
        next.adType = 'classico';
      }
      if (value === 'enjoei' && !prev.enjoeiAdType) {
        next.enjoeiAdType = 'classico';
      }
      if (value === 'facebook' && !prev.facebookDelivery) {
        next.facebookDelivery = 'entrega';
      }
      setSellingPriceWarning('');
      return next;
    });
  };

  const handleShopeeKeywordAdd = () => {
    const value = shopeeKeywordInput.trim();
    if (!value) return;
    const entries = value.split(',').map((item) => item.trim()).filter(Boolean);
    setFormData((prev) => {
      const merged = [...prev.shopeeKeywords, ...entries].filter((item, index, arr) => arr.indexOf(item) === index);
      return { ...prev, shopeeKeywords: merged };
    });
    setShopeeKeywordInput('');
  };

  const handleShopeeKeywordRemove = (keyword: string) => {
    setFormData((prev) => ({ ...prev, shopeeKeywords: prev.shopeeKeywords.filter((item) => item !== keyword) }));
  };

  const handleReputationChange = (value: 'none' | 'positive') => {
    setFormData((prev) => ({
      ...prev,
      hasReputation: value !== 'none',
      reputationLevel: value === 'none' ? undefined : 'positive'
    }));
  };

  const canSelectAccountDetails = Boolean(formData.accountHolder);
  const supplierOptions = formData.supplierName && !suppliers.some((supplier) => supplier.name === formData.supplierName)
    ? [{ id: `current-${formData.supplierName}`, name: formData.supplierName }, ...suppliers]
    : suppliers;
  const steps = [
    {
      title: 'Identificação do Produto',
      description: 'Tudo que define o que é o produto'
    },
    {
      title: 'Estrutura Comercial',
      description: 'Como esse produto será vendido'
    },
    {
      title: `Marketing ${marketplaceLabel}`,
      description: 'Informações de anúncios e cupons'
    },
    {
      title: 'Tráfego Orgânico',
      description: 'Desempenho e projeções'
    },
    {
      title: 'Tráfego Pago',
      description: 'Investimento e campanha'
    },
    {
      title: 'Financeiro',
      description: 'Só números, sem distração'
    }
  ];

  return (
    <>
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        setIsInvestModalOpen(false);
        onClose();
      }
    }}>
      <DialogContent className="sm:max-w-[920px] max-h-[85vh] overflow-y-auto overflow-x-hidden bg-gray-50 dark:bg-gray-900">
        <DialogHeader>
          <DialogTitle>Editar Produto</DialogTitle>
          <DialogDescription>
            Faça as alterações e salve quando terminar.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4 sm:grid-cols-[220px_1fr]">
          <div className="flex flex-col gap-2">
            <p className="text-xs uppercase font-semibold tracking-wide text-muted-foreground">Etapas</p>
            {steps.map((item, index) => {
              const isActive = step === index;
              return (
                <button
                  key={item.title}
                  type="button"
                  onClick={() => setStep(index)}
                  className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                    isActive
                      ? 'border-[#fe2c55] bg-[#fe2c55]/10 text-[#fe2c55]'
                      : 'border-border bg-background text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <span className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold ${
                    isActive ? 'border-[#fe2c55] text-[#fe2c55]' : 'border-border text-muted-foreground'
                  }`}>
                    {index + 1}
                  </span>
                  <span className="font-medium">{item.title}</span>
                </button>
              );
            })}
          </div>
          <div className="space-y-5">
            <div>
              <h3 className="text-base font-semibold text-foreground">{steps[step]?.title}</h3>
              <p className="text-xs text-muted-foreground">{steps[step]?.description}</p>
            </div>
            <div className="space-y-6">
              {step === 0 && (
                <>
                  {/* Seção de Variações - Movida para o topo */}
                  {product?.variations && product.variations.length > 0 && (
                    <div className="pb-6 border-b border-gray-200 dark:border-zinc-700">
                      <ProductVariationsSection 
                        variations={enrichedVariations.length > 0 ? enrichedVariations : product.variations}
                        onSelectVariation={(variation) => {
                          // Preencher os campos do formulário com os dados da variação
                          setFormData(prev => ({
                            ...prev,
                            imageUrl: variation.imageUrl || prev.imageUrl || '',
                            sku: variation.sku || prev.sku || '',
                            stockQuantity: String(variation.stockQuantity ?? prev.stockQuantity ?? ''),
                            costPrice: String(variation.cost ?? prev.costPrice ?? ''),
                            // Mantém o preço atual se a variação não tiver preço próprio
                            sellingPrice: String(variation.manualPrice || variation.suggestedPrice || prev.sellingPrice || ''),
                            weight: String(variation.weight ?? prev.weight ?? ''),
                            width: String(variation.width ?? prev.width ?? ''),
                            height: String(variation.height ?? prev.height ?? ''),
                            depth: String(variation.depth ?? prev.depth ?? ''),
                          }));
                        }}
                      />
                    </div>
                  )}

                  {/* Campos Básicos - Layout vertical limpo */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-medium dark:text-white">
                        Nome do Produto
                      </Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="imageUrl" className="text-sm font-medium dark:text-white">
                        URL da Imagem
                      </Label>
                      <Input
                        id="imageUrl"
                        type="url"
                        value={formData.imageUrl}
                        onChange={(e) => handleChange('imageUrl', e.target.value)}
                        className="w-full"
                        placeholder="https://"
                      />
                      {/* Preview da imagem principal */}
                      {formData.imageUrl && (
                        <div className="mt-2">
                          <img
                            src={formData.imageUrl}
                            alt="Preview do produto"
                            className="h-24 w-24 rounded-lg object-cover border border-gray-200 dark:border-zinc-700"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                        </div>
                      )}
                      {/* Outras imagens do produto pai (Bling) — só para produtos SEM variações */}
                      {extraImageUrls.length > 0 && !(product?.variations && product.variations.length > 0) && (
                        <div className="mt-4 rounded-lg border border-zinc-700 bg-zinc-900/50 p-3 space-y-3">
                          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
                            Imagens do Bling — arraste para reordenar, clique para usar
                          </p>
                          {/* Thumbnails com drag-and-drop */}
                          <div className="flex flex-wrap gap-2">
                            {extraImageUrls.map((url, idx) => (
                              <button
                                key={url}
                                type="button"
                                draggable
                                onDragStart={() => { dragIndexRef.current = idx; }}
                                onDragOver={(e) => { e.preventDefault(); }}
                                onDrop={(e) => {
                                  e.preventDefault();
                                  const from = dragIndexRef.current;
                                  if (from === null || from === idx) return;
                                  setExtraImageUrls(prev => {
                                    const next = [...prev];
                                    const [moved] = next.splice(from, 1);
                                    next.splice(idx, 0, moved);
                                    // Auto-set cover: always use position 0 after reorder
                                    setTimeout(() => handleChange('imageUrl', next[0]), 0);
                                    return next;
                                  });
                                  dragIndexRef.current = null;
                                }}
                                onDragEnd={() => { dragIndexRef.current = null; }}
                                onClick={() => handleChange('imageUrl', url)}
                                title={`Imagem ${idx + 1} — arraste para reordenar`}
                                className={`relative h-14 w-14 shrink-0 rounded-md overflow-hidden border-2 transition-all cursor-grab active:cursor-grabbing focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                  formData.imageUrl === url
                                    ? 'border-blue-500 ring-2 ring-blue-500/40'
                                    : 'border-zinc-600 hover:border-blue-400'
                                }`}
                              >
                                <img
                                  src={url}
                                  alt={`Imagem ${idx + 1}`}
                                  className="h-full w-full object-cover pointer-events-none"
                                  onError={(e) => { (e.target as HTMLImageElement).closest('button')!.style.display = 'none'; }}
                                />
                                <span className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-[8px] text-center py-0.5 pointer-events-none">
                                  {idx + 1}
                                </span>
                                {/* drag handle indicator */}
                                <span className="absolute top-0.5 right-0.5 text-white/60 text-[8px] pointer-events-none">⠿</span>
                              </button>
                            ))}
                          </div>
                          {/* Links copiáveis — ordem sincronizada com thumbnails */}
                          <div className="space-y-1.5">
                            {extraImageUrls.map((url, idx) => (
                              <div key={url} className="flex items-center gap-2 min-w-0">
                                <span className="text-[10px] font-mono text-zinc-500 shrink-0 w-8">
                                  #{idx + 1}
                                </span>
                                <input
                                  readOnly
                                  value={url}
                                  onClick={(e) => (e.target as HTMLInputElement).select()}
                                  className="flex-1 min-w-0 text-[11px] font-mono text-blue-400 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 cursor-pointer focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40"
                                  title="Clique para selecionar e copiar"
                                />
                                <button
                                  type="button"
                                  onClick={() => navigator.clipboard.writeText(url)}
                                  className="shrink-0 text-[10px] text-zinc-400 hover:text-white bg-zinc-700 hover:bg-zinc-600 rounded px-2 py-1 transition-colors"
                                  title="Copiar URL"
                                >
                                  Copiar
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="sku" className="text-sm font-medium dark:text-white">
                          SKU
                        </Label>
                        <Input
                          id="sku"
                          value={formData.sku}
                          onChange={(e) => handleChange('sku', e.target.value)}
                          className="w-full"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="stockQuantity" className="text-sm font-medium dark:text-white">
                          Estoque
                        </Label>
                        <Input
                          id="stockQuantity"
                          type="number"
                          inputMode="numeric"
                          min="0"
                          value={formData.stockQuantity}
                          onChange={(e) => handleChange('stockQuantity', e.target.value)}
                          className="w-full"
                          placeholder="Quantidade"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description" className="text-sm font-medium dark:text-white">
                        Descrição
                      </Label>
                      <textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => handleChange('description', e.target.value)}
                        className="w-full min-h-[80px] px-3 py-2 text-sm rounded-md border border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
                        placeholder="Descrição detalhada do produto..."
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="marketplace" className="text-sm font-medium text-red-500 dark:text-red-400">
                          Marketplace
                        </Label>
                        <Select value={formData.marketplace} onValueChange={handleMarketplaceChange}>
                          <SelectTrigger className="w-full border-red-500 focus:border-red-500">
                            <SelectValue placeholder="Selecione o marketplace" />
                          </SelectTrigger>
                          <SelectContent>
                            {allMarketplaceOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="supplier" className="text-sm font-medium dark:text-white">
                          Fornecedor
                        </Label>
                        <Select
                            value={formData.supplierName}
                            onValueChange={(val) => handleChange('supplierName', val)}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Selecione o fornecedor" />
                            </SelectTrigger>
                            <SelectContent>
                                {supplierOptions.map(supplier => (
                                    <SelectItem key={supplier.id} value={supplier.name}>
                                        {supplier.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="mlCategory" className="text-sm font-medium dark:text-white">
                        Categoria do produto
                      </Label>
                      <Select
                        value={formData.mlCategory || ''}
                        onValueChange={(val) => handleChange('mlCategory', val)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione a categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(mercadoLivreTaxes.classico).map(([key, tax]) => (
                            <SelectItem key={key} value={key}>
                              {tax.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium dark:text-white">
                        Dimensões
                      </Label>
                      <div className="grid grid-cols-4 gap-3">
                        <div>
                          <Label htmlFor="weight" className="text-xs text-gray-500 dark:text-gray-400 mb-1">Peso (kg)</Label>
                          <Input
                            id="weight"
                            type="text"
                            inputMode="decimal"
                            value={formData.weight}
                            onChange={(e) => handleCurrencyChange(e, (val) => handleChange('weight', val))}
                            placeholder="0.3"
                            className="w-full"
                          />
                        </div>
                        <div>
                          <Label htmlFor="width" className="text-xs text-gray-500 dark:text-gray-400 mb-1">Largura (cm)</Label>
                          <Input
                            id="width"
                            type="text"
                            inputMode="decimal"
                            value={formData.width}
                            onChange={(e) => handleCurrencyChange(e, (val) => handleChange('width', val))}
                            placeholder="12"
                            className="w-full"
                          />
                        </div>
                        <div>
                          <Label htmlFor="height" className="text-xs text-gray-500 dark:text-gray-400 mb-1">Altura (cm)</Label>
                          <Input
                            id="height"
                            type="text"
                            inputMode="decimal"
                            value={formData.height}
                            onChange={(e) => handleCurrencyChange(e, (val) => handleChange('height', val))}
                            placeholder="8"
                            className="w-full"
                          />
                        </div>
                        <div>
                          <Label htmlFor="depth" className="text-xs text-gray-500 dark:text-gray-400 mb-1">Profundidade (cm)</Label>
                          <Input
                            id="depth"
                            type="text"
                            inputMode="decimal"
                            value={formData.depth}
                            onChange={(e) => handleCurrencyChange(e, (val) => handleChange('depth', val))}
                            placeholder="5"
                            className="w-full"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
              {step === 1 && (
                <>
                  {formData.marketplace === 'mercadolivre' && (
                    <div className="grid gap-2">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="adType" className="text-right dark:text-white">
                          Tipo de Anúncio
                        </Label>
                        <Select value={formData.adType} onValueChange={(val) => handleChange('adType', val as ProductItem['adType'])}>
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="gratis">Grátis (0% — sem visibilidade)</SelectItem>
                            <SelectItem value="classico">
                              Clássico — {((mercadoLivreTaxes.classico[formData.mlCategory || 'eletronicos']?.rate ?? mercadoLivreTaxes.classico['eletronicos'].rate))}% comissão
                            </SelectItem>
                            <SelectItem value="premium">
                              Premium — {((mercadoLivreTaxes.premium[formData.mlCategory || 'eletronicos']?.rate ?? mercadoLivreTaxes.premium['eletronicos'].rate))}% comissão
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {formData.adType && formData.adType !== 'gratis' && (
                        <div className="grid grid-cols-4">
                          <div className="col-span-3 col-start-2">
                            <div className="flex items-center gap-2 rounded-md bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 px-3 py-1.5">
                              <span className="text-[11px] font-semibold text-yellow-700 dark:text-yellow-400">
                                Comissão ML:
                              </span>
                              <span className="text-[11px] font-bold text-yellow-800 dark:text-yellow-300">
                                {formData.adType === 'classico'
                                  ? (mercadoLivreTaxes.classico[formData.mlCategory || 'eletronicos']?.rate ?? mercadoLivreTaxes.classico['eletronicos'].rate)
                                  : (mercadoLivreTaxes.premium[formData.mlCategory || 'eletronicos']?.rate ?? mercadoLivreTaxes.premium['eletronicos'].rate)
                                }%
                              </span>
                              <span className="text-[10px] text-yellow-600 dark:text-yellow-500">
                                ({mercadoLivreTaxes.classico[formData.mlCategory || 'eletronicos']?.name ?? 'categoria'})
                                {formData.adType === 'premium' ? ' + 12x sem juros' : ''}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right dark:text-white">
                          Reputação
                        </Label>
                        <Select
                          value={formData.hasReputation ? 'positive' : 'none'}
                          onValueChange={(val) => handleReputationChange(val as 'none' | 'positive')}
                        >
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Selecione a reputação" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="positive">Reputação verde</SelectItem>
                            <SelectItem value="none">Sem reputação</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                  {formData.marketplace === 'enjoei' && (
                    <div className="grid gap-2">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="enjoeiAdType" className="text-right dark:text-white">
                          Tipo de Anúncio
                        </Label>
                        <Select value={formData.enjoeiAdType} onValueChange={(val) => handleChange('enjoeiAdType', val as ProductItem['enjoeiAdType'])}>
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="classico">Clássico (12% + taxa fixa)</SelectItem>
                            <SelectItem value="turbinado">Turbinado (18% + taxa fixa)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-4">
                        <div className="col-span-3 col-start-2 text-[10px] text-gray-500 dark:text-gray-400">
                          {formData.enjoeiAdType === 'turbinado'
                            ? 'Maior visibilidade. Comissão maior.'
                            : 'Exposição padrão. Comissão menor.'}
                        </div>
                      </div>
                    </div>
                  )}
                  {formData.marketplace === 'facebook' && (
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label className="text-right dark:text-white">
                        Forma de entrega
                      </Label>
                      <Select
                        value={formData.facebookDelivery}
                        onValueChange={(val) => handleChange('facebookDelivery', val as ProductItem['facebookDelivery'])}
                      >
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Selecione a entrega" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="entrega">Entrega</SelectItem>
                          <SelectItem value="retirada">Retirada</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right dark:text-white">
                      Modalidade
                    </Label>
                    <Select
                      value={formData.operationMode}
                      onValueChange={(val) => handleChange('operationMode', val as ProductItem['operationMode'])}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Selecione a modalidade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dropshipping">Dropshipping</SelectItem>
                        <SelectItem value="armazem_alob">Estoque Próprio</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {formData.operationMode === 'armazem_alob' && (
                    <>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right dark:text-white">Produto novo</Label>
                        <Select
                          value={formData.isNewProduct}
                          onValueChange={(val) => handleChange('isNewProduct', val as ProductItem['isNewProduct'])}
                        >
                          <SelectTrigger
                            className={`col-span-3 ${!canSelectAccountDetails ? 'opacity-50 cursor-not-allowed' : ''}`}
                            aria-disabled={!canSelectAccountDetails}
                            onMouseDown={(event) => {
                              if (canSelectAccountDetails) {
                                setAccountHolderWarning('');
                                return;
                              }
                              event.preventDefault();
                              event.stopPropagation();
                              setAccountHolderWarning('Você precisa selecionar um Títular da Conta');
                            }}
                          >
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sim">Sim</SelectItem>
                            <SelectItem value="nao">Não</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {formData.isNewProduct === 'nao' && (
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label className="text-right dark:text-white">Produto com defeito</Label>
                          <Select
                            value={formData.defectiveProduct}
                            onValueChange={(val) => handleChange('defectiveProduct', val as ProductItem['defectiveProduct'])}
                          >
                            <SelectTrigger
                              className={`col-span-3 ${!canSelectAccountDetails ? 'opacity-50 cursor-not-allowed' : ''}`}
                              aria-disabled={!canSelectAccountDetails}
                              onMouseDown={(event) => {
                                if (canSelectAccountDetails) {
                                  setAccountHolderWarning('');
                                  return;
                                }
                                event.preventDefault();
                                event.stopPropagation();
                                setAccountHolderWarning('Você precisa selecionar um Títular da Conta');
                              }}
                            >
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="sim">Sim</SelectItem>
                              <SelectItem value="nao">Não</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </>
                  )}
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="holder" className="text-right dark:text-white">
                      Titular
                    </Label>
                    <Select
                        value={formData.accountHolder}
                        onValueChange={(val) => handleChange('accountHolder', val)}
                    >
                        <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Selecione o titular" />
                        </SelectTrigger>
                        <SelectContent>
                            {accountHolders.map(holder => (
                                <SelectItem key={holder.id} value={holder.name}>
                                    {holder.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                  </div>
                  {accountHolderWarning && (
                    <div className="col-span-4 text-[12px] text-red-600">{accountHolderWarning}</div>
                  )}
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="type" className="text-right dark:text-white">
                      Tipo de Conta
                    </Label>
                    <Select 
                      value={formData.accountType} 
                      onValueChange={(val) => handleChange('accountType', val)}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cpf">CPF</SelectItem>
                        <SelectItem value="cnpj">CNPJ</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right dark:text-gray-200">
                      Video Model
                    </Label>
                    <Select
                      value={formData.videoGenerationLlm || undefined}
                      onValueChange={(val) => handleChange('videoGenerationLlm', val as ProductItem['videoGenerationLlm'])}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Selecione o LLM" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sora2">Sora2</SelectItem>
                        <SelectItem value="wan2">Wan 2</SelectItem>
                        <SelectItem value="grok">Grok</SelectItem>
                        <SelectItem value="veo3">Veo3</SelectItem>
                        <SelectItem value="copia">Cópia</SelectItem>
                        <SelectItem value="kling">Kling</SelectItem>
                        <SelectItem value="runway">Runway</SelectItem>
                        <SelectItem value="luma">Luma</SelectItem>
                        <SelectItem value="pika25">Pika 2.5</SelectItem>
                        <SelectItem value="seedance">Seedance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="lowestMarketplacePrice" className="text-right dark:text-white">
                      Menor Preço {marketplaceLabel}
                    </Label>
                    <Input
                      id="lowestMarketplacePrice"
                      type="text"
                      value={formData.lowestMarketplacePrice}
                      onChange={(e) => handleCurrencyChange(e, (val) => handleChange('lowestMarketplacePrice', val))}
                      className="col-span-3"
                      placeholder="R$ 0,00"
                    />
                  </div>
                </>
              )}
              {step === 2 && (
                <>
                  {formData.marketplace === 'shopee' && (
                    <div className="grid gap-4">
                      <div className="text-sm font-semibold text-gray-800 dark:text-white">
                        Shopee Ads
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right dark:text-white">Calcular Shopee Ads</Label>
                        <div className="col-span-3 flex items-center gap-3">
                          <Checkbox
                            checked={formData.shopeeUseAds}
                            onCheckedChange={(checked) => handleChange('shopeeUseAds', checked as boolean)}
                          />
                          <span className="text-xs text-muted-foreground">Ativar cálculo de anúncios</span>
                        </div>
                      </div>
                      {shouldShowShopeeAdsFields && (
                        <>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right dark:text-white">Tipo de Anúncio</Label>
                            <Select value={formData.shopeeAdType} onValueChange={(val) => handleChange('shopeeAdType', val)}>
                              <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Selecione o tipo" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="descoberta">Descoberta</SelectItem>
                                <SelectItem value="busca">Busca</SelectItem>
                                <SelectItem value="loja">Loja</SelectItem>
                                <SelectItem value="produto">Produto</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right dark:text-white">Tipo de Lance</Label>
                            <Select value={formData.shopeeBidType} onValueChange={(val) => handleChange('shopeeBidType', val)}>
                              <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Selecione o lance" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="automatico">Automático</SelectItem>
                                <SelectItem value="manual">Manual</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right dark:text-white">Orçamento Total</Label>
                            <Input
                              type="text"
                              inputMode="decimal"
                              value={formData.shopeeTotalBudget}
                              onChange={(e) => handleCurrencyChange(e, (val) => handleChange('shopeeTotalBudget', val))}
                              className="col-span-3"
                              placeholder="0,00"
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right dark:text-white">Data Inicial</Label>
                            <Input
                              inputMode="numeric"
                              value={formData.shopeeStartDate}
                              onChange={(e) => handleChange('shopeeStartDate', formatDateInputBr(e.target.value))}
                              className="col-span-3"
                              placeholder="dd/mm/aaaa"
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right dark:text-white">Data Final</Label>
                            <Input
                              inputMode="numeric"
                              value={formData.shopeeEndDate}
                              onChange={(e) => handleChange('shopeeEndDate', formatDateInputBr(e.target.value))}
                              className="col-span-3"
                              placeholder="dd/mm/aaaa"
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right dark:text-white">Orçamento Diário</Label>
                            <Input
                              type="text"
                              inputMode="decimal"
                              value={formData.shopeeDailyBudget}
                              onChange={(e) => handleCurrencyChange(e, (val) => handleChange('shopeeDailyBudget', val))}
                              className="col-span-3"
                              placeholder="0,00"
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right dark:text-white">CPC Ads</Label>
                            <Input
                              type="text"
                              inputMode="decimal"
                              value="0"
                              className="col-span-3 bg-gray-100 text-gray-600"
                              placeholder="0"
                              disabled
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right dark:text-white">CPC Máximo</Label>
                            <Input
                              type="text"
                              inputMode="decimal"
                              value={formData.shopeeMaxCpc}
                              onChange={(e) => handleCurrencyChange(e, (val) => handleChange('shopeeMaxCpc', val))}
                              className="col-span-3"
                              placeholder="0,00"
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right dark:text-white">Quantidade de Vendas</Label>
                            <Input
                              type="text"
                              inputMode="numeric"
                              value="0"
                              className="col-span-3 bg-gray-100 text-gray-600"
                              placeholder="0"
                              disabled
                            />
                          </div>
                          <div className="grid grid-cols-4 items-start gap-4">
                            <Label className="text-right dark:text-white">Palavras-chave</Label>
                            <div className="col-span-3 space-y-2">
                              <div className="flex gap-2">
                                <Input
                                  type="text"
                                  value={shopeeKeywordInput}
                                  onChange={(e) => setShopeeKeywordInput(e.target.value)}
                                  placeholder="Ex: camisa, algodão"
                                />
                                <Button type="button" size="sm" variant="secondary" onClick={handleShopeeKeywordAdd}>
                                  Adicionar
                                </Button>
                              </div>
                              {formData.shopeeKeywords.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                  {formData.shopeeKeywords.map((keyword) => (
                                    <button
                                      type="button"
                                      key={keyword}
                                      onClick={() => handleShopeeKeywordRemove(keyword)}
                                      className="text-[10px] px-2 py-1 rounded-full bg-white border border-gray-200 text-gray-600 hover:border-red-300 hover:text-red-500"
                                    >
                                      {keyword}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </>
                      )}
                      <div className="grid grid-cols-4 items-start gap-4">
                        <Label className="text-right dark:text-white">Cupons</Label>
                        <div className="col-span-3 space-y-3">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">Cupom da Loja</span>
                              <Checkbox
                                checked={formData.shopeeStoreCouponEnabled}
                                onCheckedChange={(checked) => handleChange('shopeeStoreCouponEnabled', checked as boolean)}
                              />
                            </div>
                            {formData.shopeeStoreCouponEnabled && (
                              <div className="grid grid-cols-3 gap-2">
                                <Select
                                  value={formData.shopeeStoreCouponType}
                                  onValueChange={(val) => handleChange('shopeeStoreCouponType', val as 'percent' | 'fixed')}
                                >
                                  <SelectTrigger className="h-8 text-xs">
                                    <SelectValue placeholder="Tipo" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="fixed">R$</SelectItem>
                                    <SelectItem value="percent">%</SelectItem>
                                  </SelectContent>
                                </Select>
                                <div className="col-span-2 relative">
                                  <Input
                                    type="text"
                                    inputMode="decimal"
                                    value={formData.shopeeStoreCouponValue}
                                    onChange={(e) => handleCurrencyChange(e, (val) => handleChange('shopeeStoreCouponValue', val))}
                                    placeholder={couponPlaceholder(formData.shopeeStoreCouponType)}
                                    className="h-8 text-sm pl-7"
                                  />
                                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                                    {couponSuffix(formData.shopeeStoreCouponType)}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">Cupom do Produto</span>
                              <Checkbox
                                checked={formData.shopeeProductCouponEnabled}
                                onCheckedChange={(checked) => handleChange('shopeeProductCouponEnabled', checked as boolean)}
                              />
                            </div>
                            {formData.shopeeProductCouponEnabled && (
                              <div className="grid grid-cols-3 gap-2">
                                <Select
                                  value={formData.shopeeProductCouponType}
                                  onValueChange={(val) => handleChange('shopeeProductCouponType', val as 'percent' | 'fixed')}
                                >
                                  <SelectTrigger className="h-8 text-xs">
                                    <SelectValue placeholder="Tipo" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="fixed">R$</SelectItem>
                                    <SelectItem value="percent">%</SelectItem>
                                  </SelectContent>
                                </Select>
                                <div className="col-span-2 relative">
                                  <Input
                                    type="text"
                                    inputMode="decimal"
                                    value={formData.shopeeProductCouponValue}
                                    onChange={(e) => handleCurrencyChange(e, (val) => handleChange('shopeeProductCouponValue', val))}
                                    placeholder={couponPlaceholder(formData.shopeeProductCouponType)}
                                    className="h-8 text-sm pl-7"
                                  />
                                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                                    {couponSuffix(formData.shopeeProductCouponType)}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">Cupom de Seguidor</span>
                              <Checkbox
                                checked={formData.shopeeFollowerCouponEnabled}
                                onCheckedChange={(checked) => handleChange('shopeeFollowerCouponEnabled', checked as boolean)}
                              />
                            </div>
                            {formData.shopeeFollowerCouponEnabled && (
                              <div className="grid grid-cols-3 gap-2">
                                <Select
                                  value={formData.shopeeFollowerCouponType}
                                  onValueChange={(val) => handleChange('shopeeFollowerCouponType', val as 'percent' | 'fixed')}
                                >
                                  <SelectTrigger className="h-8 text-xs">
                                    <SelectValue placeholder="Tipo" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="fixed">R$</SelectItem>
                                    <SelectItem value="percent">%</SelectItem>
                                  </SelectContent>
                                </Select>
                                <div className="col-span-2 relative">
                                  <Input
                                    type="text"
                                    inputMode="decimal"
                                    value={formData.shopeeFollowerCouponValue}
                                    onChange={(e) => handleCurrencyChange(e, (val) => handleChange('shopeeFollowerCouponValue', val))}
                                    placeholder={couponPlaceholder(formData.shopeeFollowerCouponType)}
                                    className="h-8 text-sm pl-7"
                                  />
                                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                                    {couponSuffix(formData.shopeeFollowerCouponType)}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">Voucher do Vendedor</span>
                              <Checkbox
                                checked={formData.shopeeSellerVoucherEnabled}
                                onCheckedChange={(checked) => handleChange('shopeeSellerVoucherEnabled', checked as boolean)}
                              />
                            </div>
                            {formData.shopeeSellerVoucherEnabled && (
                              <div className="grid grid-cols-3 gap-2">
                                <Select
                                  value={formData.shopeeSellerVoucherType}
                                  onValueChange={(val) => handleChange('shopeeSellerVoucherType', val as 'percent' | 'fixed')}
                                >
                                  <SelectTrigger className="h-8 text-xs">
                                    <SelectValue placeholder="Tipo" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="fixed">R$</SelectItem>
                                    <SelectItem value="percent">%</SelectItem>
                                  </SelectContent>
                                </Select>
                                <div className="col-span-2 relative">
                                  <Input
                                    type="text"
                                    inputMode="decimal"
                                    value={formData.shopeeSellerVoucherValue}
                                    onChange={(e) => handleCurrencyChange(e, (val) => handleChange('shopeeSellerVoucherValue', val))}
                                    placeholder={couponPlaceholder(formData.shopeeSellerVoucherType)}
                                    className="h-8 text-sm pl-7"
                                  />
                                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                                    {couponSuffix(formData.shopeeSellerVoucherType)}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  {formData.marketplace === 'mercadolivre' && (
                    <div className="mt-4 grid gap-4">
                      <div className="text-sm font-semibold text-gray-800 dark:text-white">
                        Mercado Ads
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right dark:text-white">Calcular Mercado Ads</Label>
                        <div className="col-span-3 flex items-center gap-3">
                          <Checkbox
                            checked={formData.mercadoAdsEnabled}
                            onCheckedChange={(checked) => handleChange('mercadoAdsEnabled', checked as boolean)}
                          />
                          <span className="text-xs text-muted-foreground">Ativar cálculo de anúncios</span>
                        </div>
                      </div>
                      {shouldShowMercadoAdsFields && (
                        <>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right dark:text-white">Modo de Gestão</Label>
                            <Select value={formData.mercadoAdsManagementMode} onValueChange={(val) => handleChange('mercadoAdsManagementMode', val as EditProductFormData['mercadoAdsManagementMode'])}>
                              <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Selecione o modo" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="automatico">Automático</SelectItem>
                                <SelectItem value="personalizado">Personalizado</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right dark:text-white">Solução</Label>
                            <Select value={formData.mercadoAdsSolution} onValueChange={(val) => handleChange('mercadoAdsSolution', val as EditProductFormData['mercadoAdsSolution'])}>
                              <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Selecione a solução" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="product_ads">Product Ads</SelectItem>
                                <SelectItem value="display_ads">Display Ads</SelectItem>
                                <SelectItem value="brand_ads">Brand Ads</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right dark:text-white">Seleção</Label>
                            <Input
                              type="text"
                              value={formData.mercadoAdsSelection}
                              onChange={(e) => handleChange('mercadoAdsSelection', e.target.value)}
                              className="col-span-3"
                              placeholder="Produto, catálogo ou campanha"
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right dark:text-white">Orçamento Diário</Label>
                            <Input
                              type="text"
                              inputMode="decimal"
                              value={formData.mercadoAdsDailyBudget}
                              onChange={(e) => handleCurrencyChange(e, (val) => handleChange('mercadoAdsDailyBudget', val))}
                              className="col-span-3"
                              placeholder="0,00"
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right dark:text-white">ACOS Alvo (%)</Label>
                            <Input
                              type="text"
                              inputMode="decimal"
                              value={formData.mercadoAdsAcosTarget}
                              onChange={(e) => handleCurrencyChange(e, (val) => handleChange('mercadoAdsAcosTarget', val))}
                              className="col-span-3"
                              placeholder="0"
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right dark:text-white">Vendas Esperadas</Label>
                            <Input
                              type="text"
                              inputMode="numeric"
                              value={formData.mercadoAdsSalesQuantity}
                              onChange={(e) => handleChange('mercadoAdsSalesQuantity', e.target.value.replace(/\D/g, ''))}
                              className="col-span-3"
                              placeholder="0"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  )}
                  {formData.marketplace === 'tiktok' && (
                    <TikTokCampaignSection
                      formData={formData}
                      handleChange={handleChange}
                      handleCurrencyChange={handleCurrencyChange}
                      organizationId={organizationId}
                    />
                  )}
                </>
              )}
              {step === 3 && (
                <div className="bg-[#DCFCE7] rounded-xl p-4 border border-white dark:border-zinc-800 shadow-md animate-fadeIn text-black">
                  <div className="flex items-center gap-2 mb-3 border-b border-white dark:border-zinc-800 pb-2">
                    <TrendingUp className="w-5 h-5 text-black" />
                    <h3 className="font-bold text-lg text-black">Tráfego Orgânico</h3>
                  </div>
                  
                  {/* Video Model - Dropdown */}
                  <div className="mb-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-black uppercase">Video Model</p>
                      <Select
                        value={formData.videoGenerationLlm || undefined}
                        onValueChange={(val) => handleChange('videoGenerationLlm', val as ProductItem['videoGenerationLlm'])}
                      >
                        <SelectTrigger className="w-[200px] h-7 text-xs">
                          <SelectValue placeholder="Selecione o modelo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sora2">Sora2</SelectItem>
                          <SelectItem value="wan2">Wan 2</SelectItem>
                          <SelectItem value="grok">Grok</SelectItem>
                          <SelectItem value="veo3">Veo3</SelectItem>
                          <SelectItem value="copia">Cópia</SelectItem>
                          <SelectItem value="kling">Kling</SelectItem>
                          <SelectItem value="runway">Runway</SelectItem>
                          <SelectItem value="luma">Luma</SelectItem>
                          <SelectItem value="pika25">Pika 2.5</SelectItem>
                          <SelectItem value="seedance">Seedance</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {formData.videoGenerationLlm && videoModelLabels[formData.videoGenerationLlm] && (
                      <p className="text-[10px] text-gray-600 italic">
                        Modelo selecionado: {videoModelLabels[formData.videoGenerationLlm]}
                      </p>
                    )}
                  </div>

                  {/* Vídeo Promocional */}
                  <div className="mb-4 space-y-2">
                    <p className="text-xs font-bold text-black uppercase">Vídeo Promocional</p>
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-xs text-black font-bold block">Canais</label>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { value: 'youtube_shorts', label: 'Youtube Shorts' },
                            { value: 'kaway_video', label: 'Kaway Video' },
                            { value: 'tiktok', label: 'Tiktok' },
                            { value: 'instagram_reels', label: 'Instagram Reels' },
                            { value: 'whatsapp', label: 'WhatsApp' },
                            { value: 'grupo_facebook', label: 'Grupo Facebook' },
                            { value: 'shopee_video', label: 'Shopee Video' }
                          ].map((channel) => {
                            const isSelected = formData.promoVideoChannels.includes(channel.value);
                            return (
                              <button
                                key={channel.value}
                                type="button"
                                onClick={() => {
                                  if (isSelected) {
                                    // Remover canal
                                    const newChannels = formData.promoVideoChannels.filter(c => c !== channel.value);
                                    const newLinks = { ...formData.promoVideoChannelLinks };
                                    const newNames = { ...formData.promoVideoChannelNames };
                                    delete newLinks[channel.value];
                                    delete newNames[channel.value];
                                    setFormData(prev => ({
                                      ...prev,
                                      promoVideoChannels: newChannels,
                                      promoVideoChannelLinks: newLinks,
                                      promoVideoChannelNames: newNames
                                    }));
                                  } else {
                                    // Adicionar canal
                                    setFormData(prev => ({
                                      ...prev,
                                      promoVideoChannels: [...prev.promoVideoChannels, channel.value]
                                    }));
                                  }
                                }}
                                className={`h-10 rounded-lg border-2 text-xs font-bold transition-all ${
                                  isSelected 
                                    ? 'bg-black text-white border-black' 
                                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                                }`}
                              >
                                {channel.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      
                      {/* Campos dinâmicos para cada canal selecionado */}
                      {formData.promoVideoChannels.map((channelKey) => {
                        const channelLabel = {
                          youtube_shorts: 'Youtube Shorts',
                          kaway_video: 'Kaway Video',
                          tiktok: 'Tiktok',
                          instagram_reels: 'Instagram Reels',
                          whatsapp: 'WhatsApp',
                          grupo_facebook: 'Grupo Facebook',
                          shopee_video: 'Shopee Video'
                        }[channelKey] || channelKey;
                        
                        const isGroupChannel = channelKey === 'whatsapp' || channelKey === 'grupo_facebook';
                        
                        return (
                          <div key={channelKey} className="p-3 bg-white/70 rounded-lg border border-gray-200 space-y-2">
                            <p className="text-xs font-bold text-black">{channelLabel}</p>
                            
                            {isGroupChannel && (
                              <div className="space-y-1">
                                <label className="text-xs text-black font-semibold block">
                                  Nome do grupo {channelKey === 'whatsapp' ? 'WhatsApp' : 'Facebook'}
                                </label>
                                <Input
                                  type="text"
                                  value={formData.promoVideoChannelNames[channelKey] || ''}
                                  onChange={(e) => {
                                    setFormData(prev => ({
                                      ...prev,
                                      promoVideoChannelNames: {
                                        ...prev.promoVideoChannelNames,
                                        [channelKey]: e.target.value
                                      }
                                    }));
                                  }}
                                  placeholder="Nome do grupo"
                                  className="h-8 bg-white text-gray-900 placeholder:text-gray-400"
                                />
                              </div>
                            )}
                            
                            <div className="space-y-1">
                              <label className="text-xs text-black font-semibold block">
                                {isGroupChannel ? `Link do grupo ${channelKey === 'whatsapp' ? 'WhatsApp' : 'Facebook'}` : `Link ${channelLabel}`}
                              </label>
                              <Input
                                type="url"
                                value={formData.promoVideoChannelLinks[channelKey] || ''}
                                onChange={(e) => {
                                  setFormData(prev => ({
                                    ...prev,
                                    promoVideoChannelLinks: {
                                      ...prev.promoVideoChannelLinks,
                                      [channelKey]: e.target.value
                                    }
                                  }));
                                }}
                                placeholder="https://"
                                className="h-8 bg-white !text-gray-900 placeholder:text-gray-400 border-gray-300"
                              />
                            </div>
                            
                            <div className="space-y-1">
                              <label className="text-xs text-black font-semibold block">Copy</label>
                              <textarea
                                value={formData.promoVideoChannelCopies[channelKey] || ''}
                                onChange={(e) => {
                                  setFormData(prev => ({
                                    ...prev,
                                    promoVideoChannelCopies: {
                                      ...prev.promoVideoChannelCopies,
                                      [channelKey]: e.target.value
                                    }
                                  }));
                                }}
                                placeholder="Texto do vídeo..."
                                rows={3}
                                className="w-full px-3 py-2 text-xs bg-white text-gray-900 placeholder:text-gray-400 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          </div>
                        );
                      })}
                      
                      {/* Seção Novo Vídeo */}
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200 space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-blue-900">Novo Vídeo</p>
                          <button
                            type="button"
                            onClick={() => {
                              if (formData.additionalVideos.length >= 5) {
                                alert('Você pode adicionar no máximo 5 vídeos adicionais.');
                                return;
                              }
                              setFormData(prev => ({
                                ...prev,
                                additionalVideos: [
                                  ...prev.additionalVideos,
                                  {
                                    id: `video-${Date.now()}`,
                                    url: '',
                                    copy: ''
                                  }
                                ]
                              }));
                            }}
                            disabled={formData.additionalVideos.length >= 5}
                            className={`px-3 py-1 text-xs font-bold text-white rounded-md transition-colors ${
                              formData.additionalVideos.length >= 5
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                          >
                            + Adicionar Vídeo {formData.additionalVideos.length > 0 && `(${formData.additionalVideos.length}/5)`}
                          </button>
                        </div>
                        
                        {formData.additionalVideos.map((video, index) => (
                          <div key={video.id} className="p-3 bg-white rounded-lg border border-blue-300 space-y-2">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-bold text-gray-700">Vídeo {index + 1}</p>
                              <button
                                type="button"
                                onClick={() => {
                                  setFormData(prev => ({
                                    ...prev,
                                    additionalVideos: prev.additionalVideos.filter(v => v.id !== video.id)
                                  }));
                                }}
                                className="text-xs text-red-600 hover:text-red-800 font-semibold"
                              >
                                Remover
                              </button>
                            </div>
                            
                            <div className="space-y-1">
                              <label className="text-xs text-black font-semibold block">URL do Vídeo</label>
                              <Input
                                type="url"
                                value={video.url}
                                onChange={(e) => {
                                  setFormData(prev => ({
                                    ...prev,
                                    additionalVideos: prev.additionalVideos.map(v =>
                                      v.id === video.id ? { ...v, url: e.target.value } : v
                                    )
                                  }));
                                }}
                                placeholder="https://"
                                className="h-8 bg-white text-gray-900 placeholder:text-gray-400"
                              />
                            </div>
                            
                            <div className="space-y-1">
                              <label className="text-xs text-black font-semibold block">Copy</label>
                              <textarea
                                value={video.copy}
                                onChange={(e) => {
                                  setFormData(prev => ({
                                    ...prev,
                                    additionalVideos: prev.additionalVideos.map(v =>
                                      v.id === video.id ? { ...v, copy: e.target.value } : v
                                    )
                                  }));
                                }}
                                placeholder="Texto do vídeo..."
                                rows={3}
                                className="w-full px-3 py-2 text-xs bg-white text-gray-900 placeholder:text-gray-400 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="space-y-1">
                        <label htmlFor="promoVideoUrl-organic" className="text-xs text-black font-bold block">URL do Vídeo (iframe ou URL direta)</label>
                        <textarea
                          id="promoVideoUrl-organic"
                          value={formData.promoVideoUrl}
                          onChange={(e) => handleChange('promoVideoUrl', e.target.value)}
                          className="w-full min-h-[70px] rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder="Cole aqui o código iframe ou URL do vídeo"
                        />
                        <p className="text-[10px] text-gray-600">
                          Aceita iframe do Streamable ou URL direta de vídeo
                        </p>
                      </div>
                      <div className="space-y-1">
                        <label htmlFor="promoVideoCopy-organic" className="text-xs text-black font-bold block">Copy do Vídeo</label>
                        <textarea
                          id="promoVideoCopy-organic"
                          value={formData.promoVideoCopy}
                          onChange={(e) => handleChange('promoVideoCopy', e.target.value)}
                          className="w-full min-h-[50px] rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder="Texto descritivo do vídeo"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Influencers Section - DROPDOWN */}
                  <div className="mb-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-black uppercase">Marketing de Influencer</p>
                      <Select 
                        disabled={loadingInfluencers}
                        onValueChange={(influencerId) => {
                          const influencer = influencersDB.find(inf => inf.id === influencerId);
                          if (influencer && !formData.influencers.some(inf => inf.name === influencer.name)) {
                            setFormData(prev => ({
                              ...prev,
                              influencers: [...prev.influencers, {
                                id: crypto.randomUUID(),
                                name: influencer.name,
                                instagram: influencer.instagram || '',
                                tiktok: influencer.tiktok || '',
                                twitter: influencer.twitter || '',
                                percentage: influencer.percentage.toString()
                              }]
                            }));
                          }
                        }}
                      >
                        <SelectTrigger className="w-[200px] h-7 text-xs">
                          <SelectValue placeholder={loadingInfluencers ? "Carregando..." : "Selecionar influencer"} />
                        </SelectTrigger>
                        <SelectContent>
                          {influencersDB
                            .filter(inf => !formData.influencers.some(selected => selected.name === inf.name))
                            .map(inf => (
                              <SelectItem key={inf.id} value={inf.id}>
                                {inf.name}
                              </SelectItem>
                            ))
                          }
                          {influencersDB.filter(inf => !formData.influencers.some(selected => selected.name === inf.name)).length === 0 && (
                            <SelectItem value="none" disabled>
                              {loadingInfluencers ? "Carregando..." : "Nenhum influencer disponível"}
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {formData.influencers.length === 0 ? (
                      <p className="text-xs text-black italic">Nenhum influencer selecionado.</p>
                    ) : (
                      <div className="space-y-2">
                        {formData.influencers.map((influencer) => (
                          <div key={influencer.id} className="bg-white/70 dark:bg-gray-800/70 rounded-md p-3 border border-gray-200 dark:border-gray-700 relative">
                            <button
                              type="button"
                              onClick={() => {
                                setFormData(prev => ({
                                  ...prev,
                                  influencers: prev.influencers.filter(inf => inf.id !== influencer.id)
                                }));
                              }}
                              className="absolute top-2 right-2 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400"
                            >
                              <X className="w-4 h-4" />
                            </button>
                            
                            <p className="font-semibold text-sm pr-6 text-gray-900 dark:text-gray-100">{influencer.name}</p>
                            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 flex gap-2">
                              {influencer.instagram && (
                                <span className="flex items-center gap-1">
                                  <Instagram className="w-3 h-3" /> {influencer.instagram}
                                </span>
                              )}
                              {influencer.tiktok && (
                                <span className="flex items-center gap-1">
                                  <Music className="w-3 h-3" /> {influencer.tiktok}
                                </span>
                              )}
                              {influencer.twitter && (
                                <span className="flex items-center gap-1">
                                  <Twitter className="w-3 h-3" /> {influencer.twitter}
                                </span>
                              )}
                            </div>
                            
                            <div className="mt-2">
                              <Label className="text-xs text-gray-700 dark:text-gray-200">Porcentagem</Label>
                              <div className="relative mt-1">
                                <Input
                                  value={influencer.percentage}
                                  onChange={(e) => {
                                    setFormData(prev => ({
                                      ...prev,
                                      influencers: prev.influencers.map(inf =>
                                        inf.id === influencer.id
                                          ? { ...inf, percentage: e.target.value }
                                          : inf
                                      )
                                    }));
                                  }}
                                  className="h-8 text-xs pr-8 bg-white dark:bg-gray-800 dark:text-white dark:border-gray-700"
                                />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs">%</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Affiliates Section - DROPDOWN */}
                  <div className="mb-4 space-y-2">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <p className="text-xs font-bold text-black uppercase">Marketing de Afiliado</p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={loadingAffiliates || affiliatesDB.filter(aff => !formData.affiliates.some(s => s.name === aff.name) && (!aff.marketplace_name || aff.marketplace_name.toLowerCase() === (formData.marketplace || '').toLowerCase())).length === 0}
                          onClick={() => {
                            const remaining = affiliatesDB.filter(aff => !formData.affiliates.some(s => s.name === aff.name) && (!aff.marketplace_name || aff.marketplace_name.toLowerCase() === (formData.marketplace || '').toLowerCase()));
                            setFormData(prev => ({
                              ...prev,
                              affiliates: [
                                ...prev.affiliates,
                                ...remaining.map(aff => ({
                                  id: crypto.randomUUID(),
                                  name: aff.name,
                                  percentage: (aff.marketplace_commission_rate ?? aff.percentage ?? 0).toString(),
                                  marketplaceName: aff.marketplace_name ?? undefined
                                }))
                              ]
                            }));
                          }}
                          className="h-7 px-2 text-xs rounded border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600"
                        >
                          Adicionar todos
                        </button>
                        <Select 
                          disabled={loadingAffiliates}
                          onValueChange={(affiliateId) => {
                            const affiliate = affiliatesDB.find(aff => aff.id === affiliateId);
                            if (affiliate && !formData.affiliates.some(aff => aff.name === affiliate.name)) {
                              setFormData(prev => ({
                                ...prev,
                                affiliates: [...prev.affiliates, {
                                  id: crypto.randomUUID(),
                                  name: affiliate.name,
                                  percentage: (affiliate.marketplace_commission_rate ?? affiliate.percentage ?? 0).toString(),
                                  marketplaceName: affiliate.marketplace_name ?? undefined
                                }]
                              }));
                            }
                          }}
                        >
                          <SelectTrigger className="w-[200px] h-7 text-xs">
                            <SelectValue placeholder={loadingAffiliates ? "Carregando..." : "Selecionar afiliado"} />
                          </SelectTrigger>
                          <SelectContent>
                            {affiliatesDB
                              .filter(aff => !formData.affiliates.some(selected => selected.name === aff.name) && (!aff.marketplace_name || aff.marketplace_name.toLowerCase() === (formData.marketplace || '').toLowerCase()))
                              .map(aff => (
                                <SelectItem key={aff.id} value={aff.id}>
                                  {aff.name}
                                </SelectItem>
                              ))
                            }
                            {affiliatesDB.filter(aff => !formData.affiliates.some(selected => selected.name === aff.name) && (!aff.marketplace_name || aff.marketplace_name.toLowerCase() === (formData.marketplace || '').toLowerCase())).length === 0 && (
                              <SelectItem value="none" disabled>
                                {loadingAffiliates ? "Carregando..." : "Nenhum afiliado disponível"}
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    {formData.affiliates.length === 0 ? (
                      <p className="text-xs text-black italic">Nenhum afiliado selecionado.</p>
                    ) : (
                      <div className="space-y-2">
                        {formData.affiliates.map((affiliate) => (
                          <div key={affiliate.id} className="bg-white/70 dark:bg-gray-800/70 rounded-md p-3 border border-gray-200 dark:border-gray-700 relative">
                            <button
                              type="button"
                              onClick={() => {
                                setFormData(prev => ({
                                  ...prev,
                                  affiliates: prev.affiliates.filter(aff => aff.id !== affiliate.id)
                                }));
                              }}
                              className="absolute top-2 right-2 text-gray-600 hover:text-red-500 dark:text-gray-200 dark:hover:text-red-400"
                            >
                              <X className="w-4 h-4" />
                            </button>
                            
                            <p className="font-semibold text-sm pr-6 text-gray-900 dark:text-gray-100">{affiliate.name}</p>
                            
                            <div className="mt-2">
                              <Label className="text-xs text-gray-700 dark:text-gray-200">Porcentagem</Label>
                              <div className="relative mt-1">
                                <Input
                                  value={affiliate.percentage}
                                  onChange={(e) => {
                                    setFormData(prev => ({
                                      ...prev,
                                      affiliates: prev.affiliates.map(aff =>
                                        aff.id === affiliate.id
                                          ? { ...aff, percentage: e.target.value }
                                          : aff
                                      )
                                    }));
                                  }}
                                  className="h-8 text-xs pr-8 bg-white dark:bg-gray-800 dark:text-white dark:border-gray-700"
                                />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500 dark:text-gray-200">%</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-y-2 text-sm mb-4">
                    <div className="col-span-2 md:col-span-1">
                      <span className="text-gray-700">🎥 Custo/vídeo:</span>
                      <span className="font-bold ml-1">$ {formatMoney(organicVideoCost)}</span>
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <span className="text-gray-700">👁️ Impressões:</span>
                      <span className="font-bold ml-1">{orgImpressions || '0'}</span>
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <span className="text-gray-700">🖱️ Cliques:</span>
                      <span className="font-bold ml-1">{orgClicks || '0'}</span>
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <span className="text-gray-700">🛒 Vendas:</span>
                      <span className="font-bold ml-1">{orgSales || '0'}</span>
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <span className="text-gray-700">📊 CTR:</span>
                      <span className="font-bold ml-1">
                        {formatPercent(orgImpressions && orgClicks && parseFloat(orgImpressions) > 0 ? ((parseFloat(orgClicks) / parseFloat(orgImpressions)) * 100) : 0, 2)}%
                      </span>
                    </div>
                  </div>

                  <div className="bg-gray-900 rounded-lg p-3 border border-gray-700 mb-3">
                    <p className="text-xs font-bold text-white mb-2 border-b border-gray-600 pb-1">CUSTOS</p>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-300">💵 CPC Orgânico:</span>
                      <span className="font-bold text-green-400">
                        {parseFloat(orgClicks) > 0
                          ? `R$ ${formatMoney((organicAdsCostPerSale * parseFloat(orgSales || '0')) / parseFloat(orgClicks))} por clique`
                          : 'R$ 0,00 por clique'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-300">🎯 CPA Orgânico:</span>
                      <span className="font-bold text-green-400">R$ {formatMoney(organicAdsCostPerSale)} por venda</span>
                    </div>
                  </div>

                  <div className="bg-gray-900 rounded-lg p-3 border border-gray-700 mb-3 mt-3">
                    <p className="text-xs font-bold text-white mb-2 border-b border-gray-600 pb-1">PROJEÇÃO DE CONVERSÃO (Simulação)</p>
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-800 border-b border-gray-700 h-8">
                          <TableHead className="text-xs font-bold text-gray-300 h-8 p-1 text-center">Conv.</TableHead>
                          <TableHead className="text-xs font-bold text-gray-300 h-8 p-1 text-center">Vendas</TableHead>
                          <TableHead className="text-xs font-bold text-gray-300 h-8 p-1 text-center">Fat.</TableHead>
                          <TableHead className="text-xs font-bold text-gray-300 h-8 p-1 text-center">Lucro</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {[0.5, 1.0, 1.5, 2.0, 3.0].map((rate) => {
                          const clicksVal = parseFloat(orgClicks) || 0;
                          if (clicksVal === 0) return null;
                          const projSales = Math.floor(clicksVal * (rate / 100));
                          if (projSales === 0) return null;
                          const projRevenue = projSales * organicSuggestedPrice;
                          const currentCPA = organicAdsCostPerSale || 0;
                          const profitPerUnitBeforeAds = organicNetRevenue + currentCPA;
                          const totalOrgCost = currentCPA * (parseFloat(orgSales) || 0);
                          const totalProfit = (projSales * profitPerUnitBeforeAds) - totalOrgCost;
                          return (
                            <TableRow key={rate} className="hover:bg-gray-800/50 h-8 border-b border-gray-700">
                              <TableCell className="text-center text-xs p-1">{rate}%</TableCell>
                              <TableCell className="text-center text-xs p-1">{projSales}</TableCell>
                              <TableCell className="text-center text-xs p-1">R$ {projRevenue.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</TableCell>
                              <TableCell className={`text-center text-xs p-1 font-bold ${totalProfit > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                R$ {totalProfit.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                    {(!orgClicks || parseFloat(orgClicks) === 0) && (
                      <p className="text-[10px] text-center text-gray-500 mt-1">Insira cliques para ver a projeção</p>
                    )}
                  </div>

                  <div className="bg-yellow-50 p-2 rounded border border-yellow-100 flex gap-2 items-start">
                    <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-yellow-800">
                      <p className="font-bold">Tráfego orgânico pode não ser gratuito</p>
                      <p>Você pode ter que pagar a ferramentas de conteúdo com o tempo.</p>
                    </div>
                  </div>
                </div>
              )}
              {step === 4 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-md animate-fadeIn text-black dark:text-white space-y-4 h-full overflow-y-auto">
                  <div className="flex items-center gap-2 mb-3 border-b border-gray-200 dark:border-gray-700 pb-2">
                    <TrendingUp className="w-5 h-5 text-green-700" />
                    <h3 className="font-bold text-lg text-gray-800 dark:text-gray-200">Tráfego Pago</h3>
                  </div>

                  {/* Campanha */}
                  <div>
                    <p className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-2">Campanha</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label htmlFor="campaignName" className="text-gray-700 dark:text-gray-200">Nome da Campanha</Label>
                        <Input 
                          id="campaignName" 
                          value={formData.campaignName} 
                          onChange={(e) => handleChange('campaignName', e.target.value)} 
                          className="bg-white dark:bg-gray-800 dark:text-white dark:border-gray-700"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="campaignObjective" className="text-gray-700 dark:text-gray-200">Objetivo</Label>
                        <Input 
                          id="campaignObjective" 
                          value={formData.campaignObjective} 
                          onChange={(e) => handleChange('campaignObjective', e.target.value)} 
                          className="bg-white dark:bg-gray-800 dark:text-white dark:border-gray-700"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="budgetType" className="text-gray-700 dark:text-gray-200">Tipo de Orçamento</Label>
                        <Select value={formData.budgetType} onValueChange={(value) => handleChange('budgetType', value)}>
                          <SelectTrigger id="budgetType" className="bg-white dark:bg-gray-800 dark:text-white dark:border-gray-700">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="diario">Diário</SelectItem>
                            <SelectItem value="total">Total</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="investmentValue" className="text-gray-700 dark:text-gray-200">Investimento (R$)</Label>
                        <Input 
                          id="investmentValue" 
                          value={formData.investmentValue} 
                          onChange={(e) => handleChange('investmentValue', formatCurrency(e.target.value))} 
                          className="bg-white dark:bg-gray-800 dark:text-white dark:border-gray-700"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Conjunto */}
                  <div>
                    <p className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-2">Conjunto</p>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <Label htmlFor="conversion" className="text-gray-700 dark:text-gray-200">Conversão</Label>
                        <Select value={formData.conversion} onValueChange={(value) => handleChange('conversion', value)}>
                          <SelectTrigger id="conversion" className="bg-white dark:bg-gray-800 dark:text-white dark:border-gray-700">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="site">Site</SelectItem>
                            <SelectItem value="whatsapp">WhatsApp</SelectItem>
                            <SelectItem value="app">App</SelectItem>
                            <SelectItem value="messenger">Messenger</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="startDate" className="text-gray-700 dark:text-gray-200">Data Início</Label>
                        <Input 
                          id="startDate" 
                          placeholder="DD/MM/YYYY"
                          value={formData.startDate} 
                          onChange={(e) => handleChange('startDate', formatDateInputBr(e.target.value))} 
                          className="bg-white dark:bg-gray-800 dark:text-white dark:border-gray-700"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="endDate" className="text-gray-700 dark:text-gray-200">Data Fim</Label>
                        <Input 
                          id="endDate" 
                          placeholder="DD/MM/YYYY"
                          value={formData.endDate} 
                          onChange={(e) => handleChange('endDate', formatDateInputBr(e.target.value))} 
                          className="bg-white dark:bg-gray-800 dark:text-white dark:border-gray-700"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Público */}
                  <div>
                    <p className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-2">Público</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label htmlFor="audienceLocation" className="text-gray-700 dark:text-gray-200">Localização</Label>
                        <Input 
                          id="audienceLocation" 
                          value={formData.audienceLocation} 
                          onChange={(e) => handleChange('audienceLocation', e.target.value)} 
                          className="bg-white dark:bg-gray-800 dark:text-white dark:border-gray-700"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="audienceAge" className="text-gray-700 dark:text-gray-200">Idade</Label>
                        <Input 
                          id="audienceAge" 
                          value={formData.audienceAge} 
                          onChange={(e) => handleChange('audienceAge', e.target.value)} 
                          className="bg-white dark:bg-gray-800 dark:text-white dark:border-gray-700"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="audienceGender" className="text-gray-700 dark:text-gray-200">Gênero</Label>
                        <Select value={formData.audienceGender} onValueChange={(value) => handleChange('audienceGender', value)}>
                          <SelectTrigger id="audienceGender" className="bg-white dark:bg-gray-800 dark:text-white dark:border-gray-700">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="todos">Todos</SelectItem>
                            <SelectItem value="homens">Homens</SelectItem>
                            <SelectItem value="mulheres">Mulheres</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="audienceInterests" className="text-gray-700 dark:text-gray-200">Interesses</Label>
                        <Input 
                          id="audienceInterests" 
                          value={formData.audienceInterests} 
                          onChange={(e) => handleChange('audienceInterests', e.target.value)} 
                          className="bg-white dark:bg-gray-800 dark:text-white dark:border-gray-700"
                        />
                      </div>
                      <div className="col-span-2 space-y-1">
                        <Label htmlFor="audienceBehavior" className="text-gray-700 dark:text-gray-200">Comportamento</Label>
                        <Input 
                          id="audienceBehavior" 
                          value={formData.audienceBehavior} 
                          onChange={(e) => handleChange('audienceBehavior', e.target.value)} 
                          className="bg-white dark:bg-gray-800 dark:text-white dark:border-gray-700"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Posicionamento */}
                  <div>
                    <p className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-2">Posicionamento</p>
                    <div className="space-y-1">
                        <Label htmlFor="placement" className="text-gray-700 dark:text-gray-200">Local</Label>
                        <Select value={formData.placement} onValueChange={(value) => handleChange('placement', value)}>
                          <SelectTrigger id="placement" className="bg-white dark:bg-gray-800 dark:text-white dark:border-gray-700">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="stories">Stories</SelectItem>
                            <SelectItem value="reels">Reels</SelectItem>
                            <SelectItem value="feed_face">Feed Facebook</SelectItem>
                            <SelectItem value="feed_insta">Feed Instagram</SelectItem>
                          </SelectContent>
                        </Select>
                    </div>
                  </div>

                  {/* Anúncio */}
                  <div>
                    <p className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-2">Anúncio</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2 space-y-1">
                        <Label htmlFor="adTitle" className="text-gray-700 dark:text-gray-200">Título</Label>
                        <Input 
                          id="adTitle" 
                          value={formData.adTitle} 
                          onChange={(e) => handleChange('adTitle', e.target.value)} 
                          className="bg-white dark:bg-gray-800 dark:text-white dark:border-gray-700"
                        />
                      </div>
                      <div className="col-span-2 space-y-1">
                        <Label htmlFor="adText" className="text-gray-700 dark:text-gray-200">Texto Principal</Label>
                        <Input 
                          id="adText" 
                          value={formData.adText} 
                          onChange={(e) => handleChange('adText', e.target.value)} 
                          className="bg-white dark:bg-gray-800 dark:text-white dark:border-gray-700"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="adMedia" className="text-gray-700 dark:text-gray-200">Mídia</Label>
                         <Select value={formData.adMedia} onValueChange={(value) => handleChange('adMedia', value)}>
                          <SelectTrigger id="adMedia" className="bg-white dark:bg-gray-800 dark:text-white dark:border-gray-700">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="imagem">Imagem</SelectItem>
                            <SelectItem value="video">Vídeo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="adCta">CTA (Botão)</Label>
                        <Select value={formData.adCta} onValueChange={(value) => handleChange('adCta', value)}>
                          <SelectTrigger id="adCta">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="saiba_mais">Saiba Mais</SelectItem>
                            <SelectItem value="comprar_agora">Comprar Agora</SelectItem>
                            <SelectItem value="cadastre_se">Cadastre-se</SelectItem>
                            <SelectItem value="fale_conosco">Fale Conosco</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2 space-y-1">
                        <Label htmlFor="adUrl">URL de Destino</Label>
                        <Input id="adUrl" value={formData.adUrl} onChange={(e) => handleChange('adUrl', e.target.value)} />
                      </div>
                      <div className="col-span-2 space-y-1">
                        <Label htmlFor="adRedirectUrl">URL de Redirecionamento (Opcional)</Label>
                        <Input id="adRedirectUrl" value={formData.adRedirectUrl} onChange={(e) => handleChange('adRedirectUrl', e.target.value)} />
                      </div>
                    </div>
                  </div>

                  {/* Identidade */}
                  <div>
                    <p className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-2">Identidade</p>
                    <div className="grid grid-cols-2 gap-4 items-end">
                      <div className="space-y-1">
                        <Label htmlFor="instagramAccount" className="text-gray-700 dark:text-gray-200">Conta do Instagram</Label>
                        <Input 
                          id="instagramAccount" 
                          value={formData.instagramAccount} 
                          onChange={(e) => handleChange('instagramAccount', e.target.value)} 
                          className="bg-white dark:bg-gray-800 dark:text-white dark:border-gray-700"
                        />
                      </div>
                      <div className="flex items-center space-x-2 pb-2">
                        <Checkbox 
                          id="instantForm" 
                          checked={formData.instantForm} 
                          onCheckedChange={(checked) => handleChange('instantForm', checked === true)} 
                        />
                        <Label htmlFor="instantForm" className="text-gray-700 dark:text-gray-200">Formulário Instantâneo</Label>
                      </div>
                    </div>
                  </div>

                  {/* Vídeo Promocional */}
                  <div>
                    <p className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-2">Vídeo Promocional</p>
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <Label htmlFor="promoVideoUrl" className="text-gray-700 dark:text-gray-200">URL do Vídeo (iframe ou URL direta)</Label>
                        <textarea
                          id="promoVideoUrl"
                          value={formData.promoVideoUrl}
                          onChange={(e) => handleChange('promoVideoUrl', e.target.value)}
                          className="w-full min-h-[80px] rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="Cole aqui o código iframe ou URL do vídeo"
                        />
                        <p className="text-[10px] text-gray-500 dark:text-gray-400">
                          Aceita iframe do Streamable ou URL direta de vídeo
                        </p>
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="promoVideoCopy" className="text-gray-700 dark:text-gray-200">Copy do Vídeo</Label>
                        <textarea
                          id="promoVideoCopy"
                          value={formData.promoVideoCopy}
                          onChange={(e) => handleChange('promoVideoCopy', e.target.value)}
                          className="w-full min-h-[60px] rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="Texto descritivo do vídeo"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {step === 5 && (
                <>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="price" className="text-right dark:text-white">Venda</Label>
                    <Input id="price" type="number" value={formData.sellingPrice} onChange={(e) => handleChange('sellingPrice', e.target.value)} className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="cost" className="text-right dark:text-white">Custo</Label>
                    <Input id="cost" type="number" value={formData.costPrice} onChange={(e) => handleChange('costPrice', e.target.value)} className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="profit" className="text-right dark:text-white">Lucro</Label>
                    <div className="col-span-3 space-y-1">
                      <Input
                        id="profit"
                        type="text"
                        value={formatCurrency(Number.isFinite(organicNetRevenue) ? organicNetRevenue : 0)}
                        className="col-span-3"
                        disabled
                      />
                      {organicMetrics && (
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">
                            {organicMetrics.taxDescription}
                          </p>
                          {formData.marketplace === 'mercadolivre' && formData.adType && formData.adType !== 'gratis' && (
                            <p className="text-[11px] font-semibold text-yellow-600 dark:text-yellow-400">
                              Comissão ML ({formData.adType === 'classico' ? 'Clássico' : 'Premium'}):&nbsp;
                              {formData.adType === 'classico'
                                ? (mercadoLivreTaxes.classico[formData.mlCategory || 'eletronicos']?.rate ?? mercadoLivreTaxes.classico['eletronicos'].rate)
                                : (mercadoLivreTaxes.premium[formData.mlCategory || 'eletronicos']?.rate ?? mercadoLivreTaxes.premium['eletronicos'].rate)
                              }% já descontado no lucro
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  {formData.marketplace === 'mercadolivre' && (
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="mlShippingCost" className="text-right dark:text-white">Frete</Label>
                      <Input
                        id="mlShippingCost"
                        type="text"
                        inputMode="decimal"
                        value={formData.mlShippingCost}
                        onChange={(e) => handleCurrencyChange(e, (val) => handleChange('mlShippingCost', val))}
                        className="col-span-3"
                        placeholder="0,00"
                      />
                    </div>
                  )}
                  {['tiktok', 'wordpress', 'enjoei', 'amazon', 'shein'].includes(formData.marketplace) && (
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="marketplaceShippingCost" className="text-right dark:text-white">Frete</Label>
                      <Input
                        id="marketplaceShippingCost"
                        type="text"
                        inputMode="decimal"
                        value={formData.marketplaceShippingCost}
                        onChange={(e) => handleCurrencyChange(e, (val) => handleChange('marketplaceShippingCost', val))}
                        className="col-span-3"
                        placeholder="0,00"
                      />
                    </div>
                  )}
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right dark:text-white">
                      Pagamento
                    </Label>
                    <Select
                      value={formData.gatewayMethod}
                      onValueChange={(val) => handleChange('gatewayMethod', val as ProductItem['gatewayMethod'])}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Selecione o pagamento" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pix">Pix</SelectItem>
                        <SelectItem value="credit">Crédito</SelectItem>
                        <SelectItem value="debit">Débito</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right dark:text-white">
                      Banco
                    </Label>
                    <Select
                      value={formData.gatewayBank}
                      onValueChange={(val) => handleChange('gatewayBank', val)}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Selecione o banco" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="picpay">PicPay</SelectItem>
                        <SelectItem value="paypal">PayPal</SelectItem>
                        <SelectItem value="mercadopago">Mercado Pago</SelectItem>
                        <SelectItem value="stripe">Stripe</SelectItem>
                        <SelectItem value="bradesco">Bradesco</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {/* Taxa de Gateway Compra */}
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right dark:text-white">
                      Taxa de Gateway Compra
                    </Label>
                    <div className="col-span-3 flex gap-2">
                      <div className="flex rounded-md overflow-hidden border border-input">
                        <button
                          type="button"
                          className={`px-3 py-2 text-sm font-medium transition-colors ${formData.gatewayFeeType === 'percent' ? 'bg-primary text-primary-foreground' : 'bg-background text-foreground hover:bg-muted'}`}
                          onClick={() => handleChange('gatewayFeeType', 'percent')}
                        >%</button>
                        <button
                          type="button"
                          className={`px-3 py-2 text-sm font-medium transition-colors ${formData.gatewayFeeType === 'fixed' ? 'bg-primary text-primary-foreground' : 'bg-background text-foreground hover:bg-muted'}`}
                          onClick={() => handleChange('gatewayFeeType', 'fixed')}
                        >R$</button>
                      </div>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder={formData.gatewayFeeType === 'percent' ? 'Ex: 4.29' : 'Ex: 2.50'}
                        value={formData.gatewayFeeValue}
                        onChange={(e) => handleChange('gatewayFeeValue', e.target.value)}
                      />
                    </div>
                  </div>
                  {/* Parcelas */}
                  {(formData.gatewayBank === 'picpay' || formData.gatewayBank === 'nubank' || formData.gatewayBank === 'bradesco' || formData.gatewayBank === 'paypal') && formData.gatewayMethod === 'credit' && (
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label className="text-right dark:text-white">Parcelas</Label>
                      <div className="col-span-3">
                        <Input
                          type="number"
                          min="1"
                          max="12"
                          value={formData.gatewayInstallments}
                          onChange={(e) => handleChange('gatewayInstallments', e.target.value)}
                        />
                        <p className="text-[10px] text-muted-foreground mt-1">Taxa aumenta com parcelas</p>
                      </div>
                    </div>
                  )}
                  {/* Taxa do Fornecedor */}
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right dark:text-white">
                      Taxa do Fornecedor
                    </Label>
                    <div className="col-span-3 flex gap-2">
                      <div className="flex rounded-md overflow-hidden border border-input">
                        <button
                          type="button"
                          className={`px-3 py-2 text-sm font-medium transition-colors ${formData.supplierFeeType === 'percent' ? 'bg-primary text-primary-foreground' : 'bg-background text-foreground hover:bg-muted'}`}
                          onClick={() => handleChange('supplierFeeType', 'percent')}
                        >%</button>
                        <button
                          type="button"
                          className={`px-3 py-2 text-sm font-medium transition-colors ${formData.supplierFeeType === 'fixed' ? 'bg-primary text-primary-foreground' : 'bg-background text-foreground hover:bg-muted'}`}
                          onClick={() => handleChange('supplierFeeType', 'fixed')}
                        >R$</button>
                      </div>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder={formData.supplierFeeType === 'percent' ? 'Ex: 5' : 'Ex: 10.00'}
                        value={formData.supplierFeeValue}
                        onChange={(e) => handleChange('supplierFeeValue', e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>
                  {/* Taxa de Gateway Fornecedor */}
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right dark:text-white">
                      Taxa de Gateway Fornecedor
                    </Label>
                    <div className="col-span-3 flex gap-2">
                      <div className="flex rounded-md overflow-hidden border border-input">
                        <button
                          type="button"
                          className={`px-3 py-2 text-sm font-medium transition-colors ${formData.supplierGatewayFeeType === 'percent' ? 'bg-primary text-primary-foreground' : 'bg-background text-foreground hover:bg-muted'}`}
                          onClick={() => handleChange('supplierGatewayFeeType', 'percent')}
                        >%</button>
                        <button
                          type="button"
                          className={`px-3 py-2 text-sm font-medium transition-colors ${formData.supplierGatewayFeeType === 'fixed' ? 'bg-primary text-primary-foreground' : 'bg-background text-foreground hover:bg-muted'}`}
                          onClick={() => handleChange('supplierGatewayFeeType', 'fixed')}
                        >R$</button>
                      </div>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder={formData.supplierGatewayFeeType === 'percent' ? 'Ex: 2' : 'Ex: 5.00'}
                        value={formData.supplierGatewayFeeValue}
                        onChange={(e) => handleChange('supplierGatewayFeeValue', e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>
                  
                  {/* Taxa de serviço do SFP (TikTok) */}
                  {formData.marketplace === 'tiktok' && formData.tiktokSfpEnabled && (
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label className="text-right dark:text-white">
                        Taxa de serviço do SFP
                      </Label>
                      <div className="col-span-3 flex items-center gap-2">
                        <div className="flex-1 px-3 py-2 bg-muted rounded-md text-sm">
                          6% sobre o preço de venda
                        </div>
                        <img 
                          src="/src/imgs/fretegratis.svg" 
                          alt="Frete Grátis" 
                          className="h-6 w-auto"
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* Frete Grátis (Shopee) ou campo Frete (outros) */}
                  {formData.marketplace === 'shopee' ? (
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label className="text-right dark:text-white">Frete Grátis</Label>
                      <div className="col-span-3 flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleChange('shopeeFreeShipping', !formData.shopeeFreeShipping)}
                          className={`w-6 h-6 rounded flex items-center justify-center border-2 transition-colors ${formData.shopeeFreeShipping ? 'bg-[#fe2c55] border-[#fe2c55]' : 'bg-transparent border-gray-400'}`}
                        >
                          {formData.shopeeFreeShipping && (
                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                        <span className="text-sm text-muted-foreground">
                          Programa de Frete Grátis — adicional de 6%
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="shippingFee" className="text-right dark:text-white">Frete</Label>
                      <Input
                        id="shippingFee"
                        type="text"
                        inputMode="decimal"
                        value={formData.shippingFee}
                        onChange={(e) => handleCurrencyChange(e, (val) => handleChange('shippingFee', val))}
                        className="col-span-3"
                        placeholder="0,00"
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
        {sellingPriceWarning && (
          <div className="text-sm text-red-600 mb-3 text-right">
            {sellingPriceWarning}
          </div>
        )}
        <DialogFooter>
          <Button type="button" variant="outline" className="dark:text-white" onClick={onClose}>Cancelar</Button>
          <Button type="submit" className="dark:text-black" onClick={handleSave}>{submitLabel}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    <Dialog open={isInvestModalOpen} onOpenChange={setIsInvestModalOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Investir</DialogTitle>
          <DialogDescription>
            Preencha os dados de público e posicionamentos.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-4 text-center dark:text-white">Seção Público</h3>
          </div>
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-4 text-center dark:text-white">Seção Posicionamentos</h3>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" className="dark:text-white" onClick={() => setIsInvestModalOpen(false)}>Cancelar</Button>
          <Button type="button" className="dark:text-black" onClick={handleInvestSave}>Salvar investimentos</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
};
