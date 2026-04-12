import { useState, useMemo, useEffect, useCallback } from 'react';
import type { CalculationResult, Variation, Influencer, Affiliate } from '../types/calculator';
import { calculateMetrics, shopeeCategories } from '../services/pricingService';
import { handleCurrencyChange, parseCurrency } from '../utils/currency';

const DRAFT_STORAGE_KEY = 'dropshipping_product_draft_v1';

type ProductDraft = {
  productName?: string;
  productSku?: string;
  stockQuantity?: string;
  weight?: string;
  width?: string;
  height?: string;
  depth?: string;
  unitOfMeasure?: string;
  productImage?: string;
  supplierName?: string;
  supplier_id?: string;
  costPrice?: string;
  manualSellingPrice?: string;
  packagingCost?: string;
  markupMultiplier?: string;
  hasVariations?: boolean;
  variations?: Variation[];
  variationType?: Variation['variationType'];
  variationName?: string;
  variationSku?: string;
  variationStock?: string;
  variationCost?: string;
  variationMarkup?: string;
  supplierFeeType?: 'percent' | 'fixed';
  supplierFeePercent?: string;
  supplierFixedFee?: string;
  supplierGatewayFeeType?: 'percent' | 'fixed';
  supplierGatewayFee?: string;
  supplierGatewayFixedFee?: string;
  gatewayFeeType?: 'percent' | 'fixed';
  gatewayFee?: string;
  gatewayFixedFee?: string;
  accountHolder?: string;
  accountType?: 'cpf' | 'cnpj';
  adType?: string;
  category?: string;
  marketplace?: string;
  marketplace_id?: string;
  mlShippingCost?: string;
  hasReputation?: boolean;
  meliPlus?: boolean;
  facebookDelivery?: 'entrega' | 'retirada';
  shopeeStoreCouponEnabled?: boolean;
  shopeeStoreCouponValue?: string;
  shopeeStoreCouponType?: 'percent' | 'fixed';
  shopeeProductCouponEnabled?: boolean;
  shopeeProductCouponValue?: string;
  shopeeProductCouponType?: 'percent' | 'fixed';
  shopeeFollowerCouponEnabled?: boolean;
  shopeeFollowerCouponValue?: string;
  shopeeFollowerCouponType?: 'percent' | 'fixed';
  shopeeSellerVoucherEnabled?: boolean;
  shopeeSellerVoucherValue?: string;
  shopeeSellerVoucherType?: 'percent' | 'fixed';
  shopeeSellerType?: 'cpf' | 'cnpj';
  shopeeTotalBudget?: string;
  shopeeStartDate?: string;
  shopeeEndDate?: string;
  shopeeAdType?: string;
  shopeeBidType?: string;
  shopeeKeywordInput?: string;
  shopeeKeywords?: string[];
  shopeeMaxCpc?: string;
  mercadoAdsEnabled?: boolean;
  mercadoAdsManagementMode?: 'automatico' | 'personalizado';
  mercadoAdsSolution?: 'product_ads' | 'display_ads' | 'brand_ads';
  mercadoAdsSelection?: string;
  mercadoAdsDailyBudget?: string;
  mercadoAdsAcosTarget?: string;
  mercadoAdsSalesQuantity?: string;
  mercadoAdsCpc?: string;
  mercadoAdsConversionRate?: string;
  mercadoAdsBudgetType?: 'diaria';
  tiktokAdsEnabled?: boolean;
  tiktokAdFormat?: string;
  tiktokAudience?: string;
  tiktokCampaignObjective?: string;
  tiktokDailyBudget?: string;
  tiktokCPA?: string;
  tiktokAdsSalesQuantity?: string;
  tiktokCPM?: string;
  tiktokCTR?: string;
  tiktokCVR?: string;
  tiktokCatalogId?: string;
  tiktokSfpEnabled?: boolean;
  organicChannels?: string[];
  organicChannelLinks?: Record<string, string>;
  organicChannelNames?: Record<string, string>;
  influencers?: Influencer[];
  affiliates?: Affiliate[];
  deliveryMode?: string;
  deliveryLogistics?: string;
  productCondition?: string;
  productDescription?: string;
  extraCommission?: string;
};

const isFeeType = (value: unknown): value is 'percent' | 'fixed' => value === 'percent' || value === 'fixed';
const isAccountType = (value: unknown): value is 'cpf' | 'cnpj' => value === 'cpf' || value === 'cnpj';
type VariationCalculation = Variation & { metrics: CalculationResult };

export const useDropshippingCalculator = () => {
  const getTodayLocalISO = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - offset).toISOString().slice(0, 10);
  };
  const getDeliveryModeForMarketplace = (mkt: string) => {
    switch (mkt) {
      case 'mercadolivre': return 'mercado_envios';
      case 'shopee': return 'shopee_express';
      case 'tiktok': return 'jet_express';
      case 'olx':
      case 'enjoei':
        return 'jadlog';
      default: return 'entrega_maos';
    }
  };

  const [draft] = useState<ProductDraft>(() => {
    if (typeof window === 'undefined' || !('localStorage' in window)) return {};
    try {
      const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
      if (!raw) {
        console.log('[Draft Load] No draft found in localStorage');
        return {};
      }
      const parsed = JSON.parse(raw) as ProductDraft;
      console.log('[Draft Load] Loaded from localStorage:', DRAFT_STORAGE_KEY, parsed);
      // Migração: gateway do fornecedor sempre fixed R$2
      if (parsed && parsed.supplierGatewayFeeType === 'percent') {
        parsed.supplierGatewayFeeType = 'fixed';
        parsed.supplierGatewayFixedFee = '2';
        parsed.supplierGatewayFee = '0';
      }
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      console.log('[Draft Load] Error parsing draft, clearing localStorage');
      window.localStorage.removeItem(DRAFT_STORAGE_KEY);
      return {};
    }
  });

  const initialMarketplace = typeof draft.marketplace === 'string' ? draft.marketplace : 'mercadolivre';
  const [productName, setProductName] = useState(() => typeof draft.productName === 'string' ? draft.productName : '');
  const [hasVariations, setHasVariations] = useState(() => typeof draft.hasVariations === 'boolean' ? draft.hasVariations : false);
  const [variations, setVariations] = useState<Variation[]>(() => Array.isArray(draft.variations) ? draft.variations : []);
  const [variationType, setVariationType] = useState<Variation['variationType']>(() => (
    draft.variationType === 'color' || draft.variationType === 'size' ? draft.variationType : 'size'
  ));
  const [variationName, setVariationName] = useState(() => typeof draft.variationName === 'string' ? draft.variationName : '');
  const [variationSku, setVariationSku] = useState(() => typeof draft.variationSku === 'string' ? draft.variationSku : '');
  const [variationStock, setVariationStock] = useState(() => typeof draft.variationStock === 'string' ? draft.variationStock : '');
  const [variationCost, setVariationCost] = useState(() => typeof draft.variationCost === 'string' ? draft.variationCost : '');
  const [variationMarkup, setVariationMarkup] = useState(() => typeof draft.variationMarkup === 'string' ? draft.variationMarkup : '1,5');

  const [supplierName, setSupplierName] = useState(() => typeof draft.supplierName === 'string' ? draft.supplierName : '');
  const [supplier_id, setSupplier_id] = useState(() => typeof draft.supplier_id === 'string' ? draft.supplier_id : '');
  const [supplierFixedFee, setSupplierFixedFee] = useState(() => typeof draft.supplierFixedFee === 'string' ? draft.supplierFixedFee : '0');
  const [costPrice, setCostPrice] = useState(() => typeof draft.costPrice === 'string' ? draft.costPrice : '');
  const [manualSellingPrice, setManualSellingPrice] = useState(() => typeof draft.manualSellingPrice === 'string' ? draft.manualSellingPrice : '');
  const [packagingCost, setPackagingCost] = useState(() => typeof draft.packagingCost === 'string' ? draft.packagingCost : '0');
  const [supplierFeePercent, setSupplierFeePercent] = useState(() => typeof draft.supplierFeePercent === 'string' ? draft.supplierFeePercent : '0');
  const [supplierFeeType, setSupplierFeeType] = useState<'percent' | 'fixed'>(() => isFeeType(draft.supplierFeeType) ? draft.supplierFeeType : 'percent');
  const [supplierGatewayFee, setSupplierGatewayFee] = useState(() => typeof draft.supplierGatewayFee === 'string' ? draft.supplierGatewayFee : '0');
  const [supplierGatewayFixedFee, setSupplierGatewayFixedFee] = useState(() => typeof draft.supplierGatewayFixedFee === 'string' ? draft.supplierGatewayFixedFee : '2');
  const [supplierGatewayFeeType, setSupplierGatewayFeeType] = useState<'percent' | 'fixed'>(() => isFeeType(draft.supplierGatewayFeeType) ? draft.supplierGatewayFeeType : 'fixed');
  const [gatewayFee, setGatewayFee] = useState(() => typeof draft.gatewayFee === 'string' ? draft.gatewayFee : '0');
  const [gatewayFixedFee, setGatewayFixedFee] = useState(() => typeof draft.gatewayFixedFee === 'string' ? draft.gatewayFixedFee : '0');
  const [gatewayFeeType, setGatewayFeeType] = useState<'percent' | 'fixed'>(() => isFeeType(draft.gatewayFeeType) ? draft.gatewayFeeType : 'fixed');
  const [markupMultiplier, setMarkupMultiplier] = useState(() => typeof draft.markupMultiplier === 'string' ? draft.markupMultiplier : '0');
  const [extraCommission, setExtraCommission] = useState(() => typeof draft.extraCommission === 'string' ? draft.extraCommission : (initialMarketplace === 'shopee' ? '14' : ''));
  
  const [marketplace, setMarketplace] = useState(initialMarketplace);
  const [marketplace_id, setMarketplace_id] = useState(() => typeof draft.marketplace_id === 'string' ? draft.marketplace_id : '');
  const [tiktokCommission, setTiktokCommission] = useState('6');
  const [wordpressShipping, setWordpressShipping] = useState('0');
  const [amazonPlan, setAmazonPlan] = useState<'individual' | 'profissional'>('individual');
  const [amazonCategory, setAmazonCategory] = useState('eletronicos');
  const [customCommission, setCustomCommission] = useState(0);
  const [competitorPrice, setCompetitorPrice] = useState('');
  const [competitorMarkup, setCompetitorMarkup] = useState('1,10');
  
  const [category, setCategory] = useState(() => typeof draft.category === 'string' ? draft.category : 'eletronicos');
  const [shippingOption, setShippingOption] = useState('with'); // Para Shopee
  const [shopeeSellerType, setShopeeSellerType] = useState<'cpf' | 'cnpj'>(() => (draft.shopeeSellerType === 'cpf' || draft.shopeeSellerType === 'cnpj') ? draft.shopeeSellerType : 'cpf');
  const [shopeeStoreCouponEnabled, setShopeeStoreCouponEnabled] = useState(() => typeof draft.shopeeStoreCouponEnabled === 'boolean' ? draft.shopeeStoreCouponEnabled : false);
  const [shopeeStoreCouponValue, setShopeeStoreCouponValue] = useState(() => typeof draft.shopeeStoreCouponValue === 'string' ? draft.shopeeStoreCouponValue : '');
  const [shopeeStoreCouponType, setShopeeStoreCouponType] = useState<'percent' | 'fixed'>(() => isFeeType(draft.shopeeStoreCouponType) ? draft.shopeeStoreCouponType : 'percent');
  const [shopeeProductCouponEnabled, setShopeeProductCouponEnabled] = useState(() => typeof draft.shopeeProductCouponEnabled === 'boolean' ? draft.shopeeProductCouponEnabled : false);
  const [shopeeProductCouponValue, setShopeeProductCouponValue] = useState(() => typeof draft.shopeeProductCouponValue === 'string' ? draft.shopeeProductCouponValue : '');
  const [shopeeProductCouponType, setShopeeProductCouponType] = useState<'percent' | 'fixed'>(() => isFeeType(draft.shopeeProductCouponType) ? draft.shopeeProductCouponType : 'percent');
  const [shopeeFollowerCouponEnabled, setShopeeFollowerCouponEnabled] = useState(() => typeof draft.shopeeFollowerCouponEnabled === 'boolean' ? draft.shopeeFollowerCouponEnabled : false);
  const [shopeeFollowerCouponValue, setShopeeFollowerCouponValue] = useState(() => typeof draft.shopeeFollowerCouponValue === 'string' ? draft.shopeeFollowerCouponValue : '');
  const [shopeeFollowerCouponType, setShopeeFollowerCouponType] = useState<'percent' | 'fixed'>(() => isFeeType(draft.shopeeFollowerCouponType) ? draft.shopeeFollowerCouponType : 'percent');
  const [shopeeSellerVoucherEnabled, setShopeeSellerVoucherEnabled] = useState(() => typeof draft.shopeeSellerVoucherEnabled === 'boolean' ? draft.shopeeSellerVoucherEnabled : false);
  const [shopeeSellerVoucherValue, setShopeeSellerVoucherValue] = useState(() => typeof draft.shopeeSellerVoucherValue === 'string' ? draft.shopeeSellerVoucherValue : '');
  const [shopeeSellerVoucherType, setShopeeSellerVoucherType] = useState<'percent' | 'fixed'>(() => isFeeType(draft.shopeeSellerVoucherType) ? draft.shopeeSellerVoucherType : 'percent');
  const [deliveryMode, setDeliveryMode] = useState(() => typeof draft.deliveryMode === 'string' ? draft.deliveryMode : getDeliveryModeForMarketplace(initialMarketplace));
  const [deliveryLogistics, setDeliveryLogistics] = useState(() => typeof draft.deliveryLogistics === 'string' ? draft.deliveryLogistics : '');
  const [productCondition, setProductCondition] = useState(() => typeof draft.productCondition === 'string' ? draft.productCondition : '');
  const [productDescription, setProductDescription] = useState(() => typeof draft.productDescription === 'string' ? draft.productDescription : '');
  const [accountType, setAccountType] = useState<'cpf' | 'cnpj'>(() => isAccountType(draft.accountType) ? draft.accountType : 'cnpj'); // Generic account type for all marketplaces
  const [accountHolder, setAccountHolder] = useState(() => typeof draft.accountHolder === 'string' ? draft.accountHolder : '');
  const [adType, setAdType] = useState(() => typeof draft.adType === 'string' ? draft.adType : 'classico'); // Para Mercado Livre
  const [enjoeiAdType, setEnjoeiAdType] = useState('classico'); // Para Enjoei
  const [enjoeiInactivityMonths, setEnjoeiInactivityMonths] = useState('0'); // Para Enjoei
  const [mlShippingCost, setMlShippingCost] = useState(() => typeof draft.mlShippingCost === 'string' ? draft.mlShippingCost : '0'); // Custo de Frete (Pago pelo vendedor)
  const [hasReputation, setHasReputation] = useState(() => typeof draft.hasReputation === 'boolean' ? draft.hasReputation : false);
  const [reputationLevel, setReputationLevel] = useState('positive'); // 'negative' | 'average' | 'positive' | 'excellent'
  const [meliPlus, setMeliPlus] = useState(() => typeof draft.meliPlus === 'boolean' ? draft.meliPlus : false);
  const [facebookDelivery, setFacebookDelivery] = useState<'entrega' | 'retirada'>(() =>
    draft.facebookDelivery === 'retirada' ? 'retirada' : 'entrega'
  );

  const [trafficMode, setTrafficMode] = useState<'paid' | 'organic'>('organic');
  const [organicSubMode, setOrganicSubMode] = useState<'manual' | 'automated'>('manual');
  
  // Organic Inputs
  const [orgFreq, setOrgFreq] = useState('');
  const [orgImpressions, setOrgImpressions] = useState('');
  const [orgClicks, setOrgClicks] = useState('');
  const [orgSales, setOrgSales] = useState('');
  const [organicChannels, setOrganicChannels] = useState<string[]>(() =>
    Array.isArray(draft.organicChannels) ? draft.organicChannels.filter((item): item is string => typeof item === 'string') : []
  );
  const [organicChannelLinks, setOrganicChannelLinks] = useState<Record<string, string>>(() =>
    draft.organicChannelLinks && typeof draft.organicChannelLinks === 'object' ? draft.organicChannelLinks : {}
  );
  const [organicChannelNames, setOrganicChannelNames] = useState<Record<string, string>>(() =>
    draft.organicChannelNames && typeof draft.organicChannelNames === 'object' ? draft.organicChannelNames : {}
  );
  
  const [influencers, setInfluencers] = useState<Influencer[]>(() => 
    Array.isArray(draft.influencers) ? draft.influencers : []
  );
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  
  const [orgCostVideo, setOrgCostVideo] = useState(''); // Only used if ChatGPT
  const [orgKieCost, setOrgKieCost] = useState(''); // Deprecated
  const [orgKieCredits, setOrgKieCredits] = useState(''); // Deprecated
  
  // New AI and Plan States
  const [selectedAiModel, setSelectedAiModel] = useState('sora_2'); 
  const [selectedKiePlan, setSelectedKiePlan] = useState('5');

  const [currentCredits, setCurrentCredits] = useState('1000');
  const [videoDuration, setVideoDuration] = useState('10');

  // Supplier fee defaults are applied at initialization time via useState initializers above
  
  // Selected Influencer for Video Generation
  const [selectedInfluencerId, setSelectedInfluencerId] = useState<string | null>(null);
  
  // Video Generation LLM Specifics
  const [videoGenerationLlm, setVideoGenerationLlm] = useState<'veo3' | 'sora2' | 'grok' | 'wan2' | 'copia' | 'kling' | 'runway' | 'luma' | 'pika25' | 'seedance' | null>('sora2');
  const [videoGenerationPlan, setVideoGenerationPlan] = useState<'free' | 'paid' | null>('free');

  const [productFilters, setProductFilters] = useState<{
    marketplace: string;
    supplier: string;
    holder: string;
    accountType: string;
    cnpj: string;
    videoModel: string;
    priceSort: string;
    stockFilter: string;
    affiliateFilter: string;
    categoryFilter: string;
    minProfit: string;
    maxProfit: string;
    minPrice: string;
  }>(() => {
    if (typeof window === 'undefined' || !('localStorage' in window)) {
      return {
        marketplace: 'all', supplier: '', holder: '', accountType: 'all',
        cnpj: '', videoModel: 'all', priceSort: 'all', stockFilter: 'all',
        affiliateFilter: 'all', categoryFilter: 'all', minProfit: '', maxProfit: '', minPrice: ''
      };
    }
    try {
      const saved = window.localStorage.getItem('product_filters_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        console.log('[Filters Load] Loaded from localStorage:', parsed);
        return { affiliateFilter: 'all', categoryFilter: 'all', minProfit: '', maxProfit: '', minPrice: '', ...parsed };
      }
    } catch (error) {
      console.log('[Filters Load] Error loading filters:', error);
    }
    return {
      marketplace: 'all', supplier: '', holder: '', accountType: 'all',
      cnpj: '', videoModel: 'all', priceSort: 'all', stockFilter: 'all',
      affiliateFilter: 'all', categoryFilter: 'all', minProfit: '', maxProfit: '', minPrice: ''
    };
  });

  // Organic Options
  const [organicApi, setOrganicApi] = useState<'gemini' | 'chatgpt'>('gemini');
  const [useUploadPostFree, setUseUploadPostFree] = useState(true);

  const [competitorDiscount, setCompetitorDiscount] = useState('1,00');

  const [productImage, setProductImage] = useState(() => typeof draft.productImage === 'string' ? draft.productImage : '');
  const [productSku, setProductSku] = useState(() => typeof draft.productSku === 'string' ? draft.productSku : '');
  const [stockQuantity, setStockQuantity] = useState(() => typeof draft.stockQuantity === 'string' ? draft.stockQuantity : '');
  const [weight, setWeight] = useState(() => typeof draft.weight === 'string' ? draft.weight : '');
  const [width, setWidth] = useState(() => typeof draft.width === 'string' ? draft.width : '');
  const [height, setHeight] = useState(() => typeof draft.height === 'string' ? draft.height : '');
  const [depth, setDepth] = useState(() => typeof draft.depth === 'string' ? draft.depth : '');
  const [unitOfMeasure, setUnitOfMeasure] = useState(() => typeof draft.unitOfMeasure === 'string' ? draft.unitOfMeasure : '');

  // New States for Mode and Logic
  const [operationMode, setOperationMode] = useState('dropshipping'); // Default 'dropshipping'
  const [emergencyReserve, setEmergencyReserve] = useState('3.000,00');
  const [workingCapital, setWorkingCapital] = useState('500,00');
  const [returnRate, setReturnRate] = useState('33,33'); // Default 33,33%
  const [paidTraffic, setPaidTraffic] = useState('0'); // New Paid Traffic State
  const [paidTrafficType, setPaidTrafficType] = useState<'percent' | 'fixed'>('percent');

  // Payment Gateway Configuration
  const [gatewayBank, setGatewayBank] = useState('picpay'); // Default to PicPay
  const [gatewayMethod, setGatewayMethod] = useState('pix');
  const [gatewayInstallments, setGatewayInstallments] = useState('1');

  // Paid Traffic Gateway Configuration
  const [paidTrafficGatewayBank, setPaidTrafficGatewayBank] = useState('picpay');
  const [paidTrafficGatewayMethod, setPaidTrafficGatewayMethod] = useState('credit');
  const [paidTrafficGatewayInstallments, setPaidTrafficGatewayInstallments] = useState('1');
  const [paidTrafficGatewayFee, setPaidTrafficGatewayFee] = useState('0');
  const [paidTrafficGatewayFixedFee, setPaidTrafficGatewayFixedFee] = useState('0');
  const [paidTrafficGatewayFeeType, setPaidTrafficGatewayFeeType] = useState<'percent' | 'fixed'>('fixed');


  const [useShopeeAds, setUseShopeeAds] = useState(false);
  const [adsCPC, setAdsCPC] = useState('0');
  const [dailyBudget, setDailyBudget] = useState('');
  const [salesQuantity, setSalesQuantity] = useState('0');
  const [shopeeTotalBudget, setShopeeTotalBudget] = useState(() => typeof draft.shopeeTotalBudget === 'string' ? draft.shopeeTotalBudget : '');
  const [shopeeStartDate, setShopeeStartDate] = useState(() => (
    typeof draft.shopeeStartDate === 'string' && draft.shopeeStartDate
      ? draft.shopeeStartDate
      : getTodayLocalISO()
  ));
  const [shopeeEndDate, setShopeeEndDate] = useState(() => typeof draft.shopeeEndDate === 'string' ? draft.shopeeEndDate : '');
  const [shopeeAdType, setShopeeAdType] = useState(() => typeof draft.shopeeAdType === 'string' ? draft.shopeeAdType : 'descoberta');
  const [shopeeBidType, setShopeeBidType] = useState(() => typeof draft.shopeeBidType === 'string' ? draft.shopeeBidType : 'automatico');
  const [shopeeKeywordInput, setShopeeKeywordInput] = useState(() => typeof draft.shopeeKeywordInput === 'string' ? draft.shopeeKeywordInput : '');
  const [shopeeKeywords, setShopeeKeywords] = useState<string[]>(() => Array.isArray(draft.shopeeKeywords) ? draft.shopeeKeywords.filter((item): item is string => typeof item === 'string') : []);
  const [shopeeMaxCpc, setShopeeMaxCpc] = useState(() => typeof draft.shopeeMaxCpc === 'string' ? draft.shopeeMaxCpc : '');
  const [mercadoAdsEnabled, setMercadoAdsEnabled] = useState(() => draft.mercadoAdsEnabled === true);
  const [mercadoAdsManagementMode, setMercadoAdsManagementMode] = useState<'automatico' | 'personalizado'>(() => (
    draft.mercadoAdsManagementMode === 'personalizado' ? 'personalizado' : 'automatico'
  ));
  const [mercadoAdsSolution, setMercadoAdsSolution] = useState<'product_ads' | 'display_ads' | 'brand_ads'>(() => (
    draft.mercadoAdsSolution === 'display_ads' || draft.mercadoAdsSolution === 'brand_ads' ? draft.mercadoAdsSolution : 'product_ads'
  ));
  const [mercadoAdsSelection, setMercadoAdsSelection] = useState(() => typeof draft.mercadoAdsSelection === 'string' ? draft.mercadoAdsSelection : '');
  const [mercadoAdsDailyBudget, setMercadoAdsDailyBudget] = useState(() => typeof draft.mercadoAdsDailyBudget === 'string' ? draft.mercadoAdsDailyBudget : '');
  const [mercadoAdsAcosTarget, setMercadoAdsAcosTarget] = useState(() => typeof draft.mercadoAdsAcosTarget === 'string' ? draft.mercadoAdsAcosTarget : '');
  const [mercadoAdsSalesQuantity, setMercadoAdsSalesQuantity] = useState(() => typeof draft.mercadoAdsSalesQuantity === 'string' ? draft.mercadoAdsSalesQuantity : '');
  const [mercadoAdsCpc, setMercadoAdsCpc] = useState(() => typeof draft.mercadoAdsCpc === 'string' ? draft.mercadoAdsCpc : '');
  const [mercadoAdsConversionRate, setMercadoAdsConversionRate] = useState(() => typeof draft.mercadoAdsConversionRate === 'string' ? draft.mercadoAdsConversionRate : '');
  const [mercadoAdsBudgetType, setMercadoAdsBudgetType] = useState<'diaria'>(() => (
    draft.mercadoAdsBudgetType === 'diaria' ? 'diaria' : 'diaria'
  ));
  
  // TikTok Ads Configuration
  const [tiktokAdsEnabled, setTiktokAdsEnabled] = useState(() => Boolean(draft.tiktokAdsEnabled));
  const [tiktokAdFormat, setTiktokAdFormat] = useState(() => typeof draft.tiktokAdFormat === 'string' ? draft.tiktokAdFormat : 'in_feed');
  const [tiktokAudience, setTiktokAudience] = useState(() => typeof draft.tiktokAudience === 'string' ? draft.tiktokAudience : '');
  const [tiktokCampaignObjective, setTiktokCampaignObjective] = useState(() => typeof draft.tiktokCampaignObjective === 'string' ? draft.tiktokCampaignObjective : 'conversions');
  const [tiktokDailyBudget, setTiktokDailyBudget] = useState(() => typeof draft.tiktokDailyBudget === 'string' ? draft.tiktokDailyBudget : '');
  const [tiktokCPA, setTiktokCPA] = useState(() => typeof draft.tiktokCPA === 'string' ? draft.tiktokCPA : '');
  const [tiktokAdsSalesQuantity, setTiktokAdsSalesQuantity] = useState(() => typeof draft.tiktokAdsSalesQuantity === 'string' ? draft.tiktokAdsSalesQuantity : '');
  const [tiktokCPM, setTiktokCPM] = useState(() => typeof draft.tiktokCPM === 'string' ? draft.tiktokCPM : '');
  const [tiktokCTR, setTiktokCTR] = useState(() => typeof draft.tiktokCTR === 'string' ? draft.tiktokCTR : '1,00');
  const [tiktokCVR, setTiktokCVR] = useState(() => typeof draft.tiktokCVR === 'string' ? draft.tiktokCVR : '1,50');
  const [tiktokCatalogId, setTiktokCatalogId] = useState(() => typeof draft.tiktokCatalogId === 'string' ? draft.tiktokCatalogId : '');
  const [tiktokSfpEnabled, setTiktokSfpEnabled] = useState(() => typeof draft.tiktokSfpEnabled === 'boolean' ? draft.tiktokSfpEnabled : false);

  // Paid Traffic Metrics
  const [paidConversionRate, setPaidConversionRate] = useState('1,5');
  const [paidCtr, setPaidCtr] = useState('1,0');

  // Monitor component lifecycle and localStorage
  useEffect(() => {
    console.log('[Hook Lifecycle] Component mounted/updated');
    console.log('[Hook Lifecycle] Current localStorage value:', localStorage.getItem(DRAFT_STORAGE_KEY));
    
    // Check if data persists when window loses/gains focus
    const handleVisibilityChange = () => {
      console.log('[Hook Lifecycle] Visibility changed:', document.hidden ? 'hidden' : 'visible');
      if (!document.hidden) {
        const stored = localStorage.getItem(DRAFT_STORAGE_KEY);
        console.log('[Hook Lifecycle] localStorage on visibility change:', stored);
      }
    };
    
    const handleFocus = () => {
      console.log('[Hook Lifecycle] Window focused');
      const stored = localStorage.getItem(DRAFT_STORAGE_KEY);
      console.log('[Hook Lifecycle] localStorage on focus:', stored);
    };
    
    const handleBlur = () => {
      console.log('[Hook Lifecycle] Window blurred');
      const stored = localStorage.getItem(DRAFT_STORAGE_KEY);
      console.log('[Hook Lifecycle] localStorage on blur:', stored);
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
    
    return () => {
      console.log('[Hook Lifecycle] Component unmounting');
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  useEffect(() => {
    const draft: ProductDraft = {
      productName,
      productSku,
      stockQuantity,
      weight,
      width,
      height,
      depth,
      unitOfMeasure,
      productImage,
      supplierName,
      supplier_id,
      costPrice,
      manualSellingPrice,
      packagingCost,
      markupMultiplier,
      hasVariations,
      variations,
      variationType,
      variationName,
      variationSku,
      variationStock,
      variationCost,
      variationMarkup,
      supplierFeeType,
      supplierFeePercent,
      supplierFixedFee,
      supplierGatewayFeeType,
      supplierGatewayFee,
      supplierGatewayFixedFee,
      gatewayFeeType,
      gatewayFee,
      gatewayFixedFee,
      accountHolder,
      accountType,
      adType,
      category,
      marketplace,
      mlShippingCost,
      hasReputation,
      meliPlus,
      facebookDelivery,
      shopeeStoreCouponEnabled,
      shopeeStoreCouponValue,
      shopeeStoreCouponType,
      shopeeProductCouponEnabled,
      shopeeProductCouponValue,
      shopeeProductCouponType,
      shopeeFollowerCouponEnabled,
      shopeeFollowerCouponValue,
      shopeeFollowerCouponType,
      shopeeSellerVoucherEnabled,
      shopeeSellerVoucherValue,
      shopeeSellerVoucherType,
      shopeeSellerType,
      shopeeTotalBudget,
      shopeeStartDate,
      shopeeEndDate,
      shopeeAdType,
      shopeeBidType,
      shopeeKeywordInput,
      shopeeKeywords,
      shopeeMaxCpc,
      mercadoAdsEnabled,
      mercadoAdsManagementMode,
      mercadoAdsSolution,
      mercadoAdsSelection,
      mercadoAdsDailyBudget,
      mercadoAdsAcosTarget,
      mercadoAdsSalesQuantity,
      mercadoAdsCpc,
      mercadoAdsConversionRate,
      mercadoAdsBudgetType,
      tiktokAdsEnabled,
      tiktokAdFormat,
      tiktokAudience,
      tiktokCampaignObjective,
      tiktokDailyBudget,
      tiktokCPA,
      tiktokAdsSalesQuantity,
      tiktokCPM,
      tiktokCTR,
      tiktokCVR,
      tiktokCatalogId,
      tiktokSfpEnabled,
      organicChannels,
      organicChannelLinks,
      organicChannelNames,
      influencers,
      affiliates,
      deliveryMode,
      deliveryLogistics,
      productCondition,
      productDescription,
      extraCommission
    };
    console.log('[Draft Save] Saving to localStorage:', DRAFT_STORAGE_KEY, draft);
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
  }, [
    productName,
    productSku,
    stockQuantity,
    weight,
    width,
    height,
    depth,
    unitOfMeasure,
    productImage,
    supplierName,
    supplier_id,
    costPrice,
    manualSellingPrice,
    packagingCost,
    markupMultiplier,
    hasVariations,
    variations,
    variationType,
    variationName,
    variationSku,
    variationStock,
    variationCost,
    variationMarkup,
    supplierFeeType,
    supplierFeePercent,
    supplierFixedFee,
    supplierGatewayFeeType,
    supplierGatewayFee,
    supplierGatewayFixedFee,
    gatewayFeeType,
    gatewayFee,
    gatewayFixedFee,
    accountHolder,
    accountType,
    adType,
    category,
    marketplace,
    mlShippingCost,
    hasReputation,
    meliPlus,
    facebookDelivery,
    shopeeStoreCouponEnabled,
    shopeeStoreCouponValue,
    shopeeStoreCouponType,
    shopeeProductCouponEnabled,
    shopeeProductCouponValue,
    shopeeProductCouponType,
    shopeeFollowerCouponEnabled,
    shopeeFollowerCouponValue,
    shopeeFollowerCouponType,
    shopeeSellerVoucherEnabled,
    shopeeSellerVoucherValue,
    shopeeSellerVoucherType,
    shopeeSellerType,
    shopeeTotalBudget,
    shopeeStartDate,
    shopeeEndDate,
    shopeeAdType,
    shopeeBidType,
    shopeeKeywordInput,
    shopeeKeywords,
    shopeeMaxCpc,
    mercadoAdsEnabled,
    mercadoAdsManagementMode,
    mercadoAdsSolution,
    mercadoAdsSelection,
    mercadoAdsDailyBudget,
    mercadoAdsAcosTarget,
    mercadoAdsSalesQuantity,
    mercadoAdsCpc,
    mercadoAdsConversionRate,
    mercadoAdsBudgetType,
    tiktokAdsEnabled,
    tiktokAdFormat,
    tiktokAudience,
    tiktokCampaignObjective,
    tiktokDailyBudget,
    tiktokCPA,
    tiktokAdsSalesQuantity,
    tiktokCPM,
    tiktokCTR,
    tiktokCVR,
    tiktokCatalogId,
    tiktokSfpEnabled,
    organicChannels,
    organicChannelLinks,
    organicChannelNames,
    influencers,
    affiliates,
    deliveryMode,
    deliveryLogistics,
    productCondition,
    productDescription,
    extraCommission
  ]);

  // Helper for mobile float inputs (comma/dot)
  const handleFloatInput = (setter: (val: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    handleCurrencyChange(e, setter);
  };

  const calculateGatewayFee = (bank: string, method: string, installmentsStr: string, isPaidTraffic: boolean = false) => {
    let fee = 0;
    let fixed = 0;
    const installments = parseInt(installmentsStr) || 1;

    // Paid Traffic Specific Rules
    if (isPaidTraffic) {
        if (method === 'pix') return { fee: 0, fixed: 0 };
    }

    if (['picpay', 'nubank', 'bradesco'].includes(bank)) {
        // Default values
        fee = 0;
        fixed = 0;

        if (bank === 'picpay') {
            if (method === 'credit' || method === 'credit_sight' || method === 'credit_parc') {
                // PicPay Pix com crédito: taxas crescentes por parcela
                const picpayRates: Record<number, number> = {
                    1: 4.29, 2: 6.78, 3: 8.28, 4: 9.78, 5: 13.86,
                    6: 14.86, 7: 15.86, 8: 16.86, 9: 17.86, 10: 18.86,
                    11: 19.86, 12: 20.86
                };
                fee = picpayRates[Math.min(installments, 12)] ?? 4.29;
                fixed = 0;
            } else if (method === 'pix') {
                fee = 0;
                fixed = 0;
            } else if (method === 'debit') {
                fee = 1.99;
                fixed = 0;
            }
        } else if (bank === 'nubank') {
             // Nubank: Pix com crédito (8.99% a.m.) -> Changed to min 3.99% a.m.
             if (method === 'credit' || method === 'credit_sight' || method === 'credit_parc') {
                 const effectiveInstallments = method === 'credit_sight' ? 1 : installments;
                 fee = 3.99 * effectiveInstallments; // Simple multiplication for now
             } else if (method === 'pix') {
                 fee = 0;
             } else if (method === 'debit') {
                 fee = 0.89;
             }
        } else if (bank === 'bradesco') {
             // Bradesco: Cartão de Crédito (Standard)
             if (method === 'credit' || method === 'credit_sight' || method === 'credit_parc') {
                 const effectiveInstallments = method === 'credit_sight' ? 1 : installments;
                 fee = 3.99 * effectiveInstallments;
             } else if (method === 'pix') {
                 fee = 0;
             } else if (method === 'debit') {
                 fee = 1.99;
             }
        }
    } else if (bank === 'mercadopago') {
      switch (method) {
        case 'pix': fee = 0.49; break;
        case 'credit': fee = 4.99; break;
        case 'debit': fee = 1.99; break;
        default: fee = 4.99;
      }
    } else if (bank === 'paypal') {
        // Nacional: 4.79% + R$ 0.60
        fee = 4.79; 
        fixed = 0.60;
        if (installments > 1) {
            fee += (installments * 1.92);
        }
    } else if (bank === 'stripe') {
        // 3.99% + R$ 0.39
        fee = 3.99;
        fixed = 0.39;
    }
    return { fee, fixed };
  };

  const updateGatewayFees = (bank: string, method: string, installments: string) => {
    const { fee, fixed } = calculateGatewayFee(bank, method, installments, false);
    if (bank === 'picpay' && method === 'credit') {
      setGatewayFeeType('percent');
      setGatewayFee(fee.toString().replace('.', ','));
      setGatewayFixedFee('0');
      return;
    }
    if (bank === 'picpay' && method === 'pix') {
      setGatewayFeeType('percent');
      setGatewayFee('0');
      setGatewayFixedFee('0');
      return;
    }
    setGatewayFee(fee.toString());
    setGatewayFixedFee(fixed.toString());
  };

  const handleGatewayBankChange = (bank: string) => {
    setGatewayBank(bank);
    // If switching to PicPay/Nubank/Bradesco, default to Credit
    const defaultMethod = bank === 'picpay'
      ? 'pix'
      : ['nubank', 'bradesco', 'paypal', 'stripe'].includes(bank)
        ? 'credit'
        : 'pix';
    setGatewayMethod(defaultMethod);
    updateGatewayFees(bank, defaultMethod, gatewayInstallments);
  };

  const handleGatewayMethodChange = (method: string) => {
    setGatewayMethod(method);
    // If switching to Credit, default to 1 installment if not set (already '1' in state)
    updateGatewayFees(gatewayBank, method, gatewayInstallments);
  };

  const handleGatewayInstallmentsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setGatewayInstallments(val);
    updateGatewayFees(gatewayBank, gatewayMethod, val);
  };

  const updatePaidTrafficGatewayFees = (bank: string, method: string, installments: string) => {
    const { fee, fixed } = calculateGatewayFee(bank, method, installments, true);
    if (bank === 'picpay' && method === 'credit') {
      setPaidTrafficGatewayFeeType('fixed');
      setPaidTrafficGatewayFee('1,00');
      setPaidTrafficGatewayFixedFee('0');
      return;
    }
    if (bank === 'picpay' && method === 'pix') {
      setPaidTrafficGatewayFeeType('percent');
      setPaidTrafficGatewayFee('0');
      setPaidTrafficGatewayFixedFee('0');
      return;
    }
    setPaidTrafficGatewayFee(fee.toString());
    setPaidTrafficGatewayFixedFee(fixed.toString());
  };

  const handlePaidTrafficGatewayBankChange = (bank: string) => {
    setPaidTrafficGatewayBank(bank);
    // Default to Credit for Paid Traffic banks usually
    const defaultMethod = ['nubank', 'bradesco', 'paypal', 'stripe'].includes(bank) ? 'credit' : 'pix';
    setPaidTrafficGatewayMethod(defaultMethod);
    updatePaidTrafficGatewayFees(bank, defaultMethod, paidTrafficGatewayInstallments);
  };

  const handlePaidTrafficGatewayMethodChange = (method: string) => {
    setPaidTrafficGatewayMethod(method);
    updatePaidTrafficGatewayFees(paidTrafficGatewayBank, method, paidTrafficGatewayInstallments);
  };

  const handlePaidTrafficGatewayInstallmentsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPaidTrafficGatewayInstallments(val);
    updatePaidTrafficGatewayFees(paidTrafficGatewayBank, paidTrafficGatewayMethod, val);
  };

  const handleSupplierChange = (name: string) => {
    setSupplierName(name);
    const normalized = name.trim().toLowerCase();
    if (normalized === 'tyr' || normalized === 'tyr (yeizidrop)') {
      setSupplierFeeType('percent');
      setSupplierFeePercent('0');
      setSupplierFixedFee('0');
    } else if (normalized === 'dogama') {
      setSupplierFeeType('percent');
      setSupplierFeePercent('6');
      setSupplierFixedFee('0');
      setSupplierGatewayFeeType('fixed');
      setSupplierGatewayFee('0');
      setSupplierGatewayFixedFee('2');
    } else if (normalized === 'yeizidrop' || normalized === 'dsers') {
      setSupplierFeePercent('0');
      setSupplierFixedFee('0');
    } else {
      setSupplierFeePercent('0');
      setSupplierFixedFee('0');
    }
  };

  const handleDeliveryModeChange = (mode: string) => {
    setDeliveryMode(mode);
    if (mode !== 'correios' && mode !== 'mais_envios') {
      setDeliveryLogistics('');
    }
  };

  const handleOperationModeChange = (mode: string) => {
    setOperationMode(mode);
    if (mode === 'armazem_alob') {
      handleDeliveryModeChange(getDeliveryModeForMarketplace(marketplace));
      
      // Auto-select PicPay and Pix for "Estoque Próprio"
      setGatewayBank('picpay');
      setGatewayMethod('pix');
      updateGatewayFees('picpay', 'pix', gatewayInstallments);
      setPackagingCost('2,00');
    }
    if (mode === 'dropshipping') {
      setPackagingCost('0');
    }
  };

  const handleMarketplaceChange = (mkt: string) => {
    setMarketplace(mkt);
    if (operationMode === 'armazem_alob') {
      handleDeliveryModeChange(getDeliveryModeForMarketplace(mkt));
    }
    if (mkt === 'facebook') {
      setFacebookDelivery('entrega');
    }
    if (mkt === 'shopee' && !extraCommission) {
      setExtraCommission('14');
    }
  };

  const handleTrafficModeChange = (mode: 'paid' | 'organic') => {
      setTrafficMode(mode);
      if (mode === 'paid') {
          // Defaults for Paid Traffic: PicPay, Credit, 1 Installment
          const defaultBank = 'picpay';
          const defaultMethod = 'credit';
          const defaultInstallments = '1';
          
          setPaidTrafficGatewayBank(defaultBank);
          setPaidTrafficGatewayMethod(defaultMethod);
          setPaidTrafficGatewayInstallments(defaultInstallments);
          
          updatePaidTrafficGatewayFees(defaultBank, defaultMethod, defaultInstallments);
      }
  };

  const handleShopeeAdsChange = (checked: boolean) => {
      setUseShopeeAds(checked);
      if (checked) {
          setAdsCPC('0');
          setSalesQuantity('0');
      }
  };

  const handleShopeeCategoryChange = (cat: string) => {
    setCategory(cat);
    const catData = shopeeCategories[cat];
    if (catData && !useShopeeAds) {
      setAdsCPC('0');
    }
  };

  const resetProductDraft = useCallback((clearStorage: boolean = true) => {
    if (clearStorage) {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    }
    setProductName('');
    setProductSku('');
    setStockQuantity('');
    setWeight('');
    setWidth('');
    setHeight('');
    setDepth('');
    setUnitOfMeasure('');
    setProductImage('');
    setSupplierName('');
    setSupplierFeeType('percent');
    setSupplierFeePercent('0');
    setSupplierFixedFee('0');
    setSupplierGatewayFeeType('fixed');
    setSupplierGatewayFee('0');
    setSupplierGatewayFixedFee('2');
    setGatewayFeeType('fixed');
    setGatewayFee('0');
    setGatewayFixedFee('0');
    setCostPrice('');
    setManualSellingPrice('');
    setDeliveryMode('mercado_envios');
    setDeliveryLogistics('');
    setProductCondition('');
    setProductDescription('');
    setMlShippingCost('0');
    setHasReputation(false);
    setMeliPlus(false);
    setExtraCommission('');
    setShopeeStoreCouponEnabled(false);
    setShopeeStoreCouponValue('');
    setShopeeStoreCouponType('fixed');
    setShopeeProductCouponEnabled(false);
    setShopeeProductCouponValue('');
    setShopeeProductCouponType('fixed');
    setShopeeFollowerCouponEnabled(false);
    setShopeeFollowerCouponValue('');
    setShopeeFollowerCouponType('fixed');
    setShopeeSellerVoucherEnabled(false);
    setShopeeSellerVoucherValue('');
    setShopeeSellerVoucherType('fixed');
    setShopeeTotalBudget('');
    setShopeeStartDate('');
    setShopeeEndDate('');
    setShopeeAdType('descoberta');
    setShopeeBidType('automatico');
    setShopeeKeywordInput('');
    setShopeeKeywords([]);
    setShopeeMaxCpc('');
    setMercadoAdsCpc('');
    setMercadoAdsConversionRate('');
    setMercadoAdsBudgetType('diaria');
    setOrganicChannels([]);
    setOrganicChannelLinks({});
    setOrganicChannelNames({});
    setFacebookDelivery('entrega');
    setHasVariations(false);
    setVariations([]);
    setVariationType('size');
    setVariationName('');
    setVariationSku('');
    setVariationStock('');
    setVariationCost('');
    setVariationMarkup('1,5');
    setInfluencers([]);
    setAffiliates([]);
  }, []);

  const addVariation = () => {
    const effectiveMarkup = variationMarkup || markupMultiplier;
    const effectiveCost = variationCost || costPrice;
    const effectiveManualPrice = manualSellingPrice || '';

    if (variationName && effectiveCost && effectiveMarkup) {
      setVariations([...variations, {
        id: Date.now().toString(),
        variationType,
        name: variationName,
        sku: variationSku,
        stockQuantity: variationStock,
        cost: effectiveCost,
        markup: effectiveMarkup,
        manualPrice: effectiveManualPrice || undefined,
        manualPriceLocked: false
      }]);
      setVariationName('');
      setVariationSku('');
      setVariationStock('');
      setVariationCost('');
      setVariationMarkup('');
    }
  };

  const removeVariation = (id: string) => {
    setVariations(variations.filter(v => v.id !== id));
  };

  const updateVariation = (id: string, updates: Partial<Variation>) => {
    setVariations(variations.map(v => v.id === id ? { ...v, ...updates } : v));
  };

  const updateAllVariationsMarkup = (markup: string) => {
    setVariations((prev) => prev.map((v) => ({ ...v, markup })));
    setVariationMarkup(markup);
  };

  const calculations = useMemo<CalculationResult | null>(() => {
    const cost = parseCurrency(costPrice) || 0;
    const sFixed = parseCurrency(supplierFixedFee) || 0;
    const pkg = operationMode === 'dropshipping' ? 0 : (parseCurrency(packagingCost) || 0);
    const supplierFee = supplierFeeType === 'fixed' ? sFixed : (parseCurrency(supplierFeePercent) || 0);
    if (cost === 0 && !hasVariations) return null;

    const markupMult = parseCurrency(markupMultiplier);
    const extra = parseCurrency(extraCommission) || 0;
    const adsEnabled = marketplace === 'mercadolivre' 
      ? mercadoAdsEnabled 
      : marketplace === 'tiktok'
        ? tiktokAdsEnabled
        : useShopeeAds;
    
    const tiktokCpaVal = parseCurrency(tiktokCPA) || 0;
    const tiktokSalesVal = parseCurrency(tiktokAdsSalesQuantity) || 0;
    const tiktokBudgetVal = parseCurrency(tiktokDailyBudget) || 0;
    const tiktokCpmVal = parseCurrency(tiktokCPM) || 0;
    const tiktokCtrVal = parseCurrency(tiktokCTR) || 0;
    const tiktokCvrVal = parseCurrency(tiktokCVR) || 0;
    
    let tiktokFinalBudget = tiktokBudgetVal;
    if (tiktokCpaVal > 0 && tiktokSalesVal > 0) {
      tiktokFinalBudget = tiktokCpaVal * tiktokSalesVal;
    } else if (tiktokCpmVal > 0 && tiktokCtrVal > 0 && tiktokCvrVal > 0 && tiktokSalesVal > 0) {
        const requiredClicks = tiktokSalesVal / (tiktokCvrVal / 100);
        const requiredImpressions = requiredClicks / (tiktokCtrVal / 100);
        tiktokFinalBudget = (requiredImpressions / 1000) * tiktokCpmVal;
    }

    const cpc = marketplace === 'mercadolivre' ? (parseCurrency(mercadoAdsCpc) || 0) : (useShopeeAds ? 0 : (parseCurrency(adsCPC) || 0));
    const conversionRate = marketplace === 'mercadolivre' ? ((parseCurrency(mercadoAdsConversionRate) || 0) / 100) : 0;
    const budget = marketplace === 'mercadolivre'
      ? (parseCurrency(mercadoAdsDailyBudget) || 0)
      : marketplace === 'tiktok'
        ? tiktokFinalBudget
        : (parseCurrency(dailyBudget) || 0);
    const sales = marketplace === 'mercadolivre'
      ? (parseCurrency(mercadoAdsSalesQuantity) || 0)
      : marketplace === 'tiktok'
        ? tiktokSalesVal
        : (parseCurrency(salesQuantity) || 0);
    const gatewayFeeValue = parseCurrency(gatewayFee) || 0;
    const manual = parseCurrency(manualSellingPrice) || 0;
    const competitor = parseCurrency(competitorPrice) || 0;
    const compMarkup = parseCurrency(competitorMarkup) || 1.1;
    const tiktokComm = parseCurrency(tiktokCommission) || 6;
    const wpShipping = parseCurrency(wordpressShipping) || 0;
    const emergency = operationMode === 'dropshipping' ? (parseCurrency(emergencyReserve) || 0) : 0;
    const rRate = parseCurrency(returnRate) || 33.33;
    // Only include paid traffic cost if Traffic Mode is 'paid'
    const pTraffic = trafficMode === 'paid' ? (parseCurrency(paidTraffic) || 0) : 0;
    const mlShipping = parseCurrency(mlShippingCost) || 0;
    const gatewayFixedBase = parseCurrency(gatewayFixedFee) || 0;
    const gatewayPercent = gatewayFeeType === 'percent' ? gatewayFeeValue : 0;
    const gatewayFixed = (gatewayFeeType === 'fixed' ? gatewayFeeValue : 0) + gatewayFixedBase;
    // PicPay PIX override: only zero out if user hasn't manually set a fee
    const gatewayOverride = gatewayBank === 'picpay' && gatewayMethod === 'pix' && gatewayFeeValue === 0 && gatewayFixedBase === 0;
    const gatewayPercentFinal = gatewayOverride ? 0 : gatewayPercent;
    const gatewayFixedFinal = gatewayOverride ? 0 : gatewayFixed;
    const ptGatewayFeeValue = trafficMode === 'paid' ? (parseCurrency(paidTrafficGatewayFee) || 0) : 0;
    const ptGatewayFixedBase = trafficMode === 'paid' ? (parseCurrency(paidTrafficGatewayFixedFee) || 0) : 0;
    const ptGatewayPercent = paidTrafficGatewayFeeType === 'percent' ? ptGatewayFeeValue : 0;
    const ptGatewayFixed = (paidTrafficGatewayFeeType === 'fixed' ? ptGatewayFeeValue : 0) + ptGatewayFixedBase;
    const ptGatewayOverride = paidTrafficGatewayBank === 'picpay' && paidTrafficGatewayMethod === 'pix';
    const ptGatewayPercentFinal = ptGatewayOverride ? 0 : ptGatewayPercent;
    const ptGatewayFixedFinal = ptGatewayOverride ? 0 : ptGatewayFixed;
    const enjoeiType = enjoeiAdType;
    const enjoeiInactivity = parseCurrency(enjoeiInactivityMonths) || 0;
    const supplierGatewayFeeValue = parseCurrency(supplierGatewayFee) || 0;
    const supplierGatewayFixedBase = parseCurrency(supplierGatewayFixedFee) || 0;
    const supplierGatewayPercent = supplierGatewayFeeType === 'percent' ? supplierGatewayFeeValue : 0;
    const supplierGatewayFixed = supplierGatewayFeeType === 'fixed' ? supplierGatewayFixedBase : 0;
    const shopeeStoreCoupon = shopeeStoreCouponEnabled ? (parseCurrency(shopeeStoreCouponValue) || 0) : 0;
    const shopeeProductCoupon = shopeeProductCouponEnabled ? (parseCurrency(shopeeProductCouponValue) || 0) : 0;
    const shopeeFollowerCoupon = shopeeFollowerCouponEnabled ? (parseCurrency(shopeeFollowerCouponValue) || 0) : 0;
    const shopeeSellerVoucher = shopeeSellerVoucherEnabled ? (parseCurrency(shopeeSellerVoucherValue) || 0) : 0;

    return calculateMetrics(
        cost, pkg, supplierFee, markupMult, marketplace, category, adType, shippingOption, shopeeSellerType, extra, adsEnabled, cpc, budget, sales, gatewayPercentFinal, manual, competitor, compMarkup, tiktokComm, wpShipping, emergency, rRate, pTraffic, mlShipping, paidTrafficType, gatewayFixedFinal, ptGatewayPercentFinal, ptGatewayFixedFinal, enjoeiType, enjoeiInactivity, gatewayBank, gatewayMethod, paidTrafficGatewayBank, paidTrafficGatewayMethod, meliPlus, supplierFeeType, supplierGatewayPercent, supplierGatewayFixed, supplierGatewayFeeType, amazonPlan, amazonCategory, customCommission, shopeeStoreCoupon, shopeeProductCoupon, shopeeFollowerCoupon, shopeeSellerVoucher, shopeeStoreCouponType, shopeeProductCouponType, shopeeFollowerCouponType, shopeeSellerVoucherType, conversionRate, influencers, affiliates, tiktokSfpEnabled
    );
  }, [costPrice, packagingCost, supplierFixedFee, supplierFeePercent, markupMultiplier, extraCommission, adsCPC, dailyBudget, salesQuantity, gatewayFee, gatewayFixedFee, gatewayFeeType, manualSellingPrice, competitorPrice, competitorMarkup, tiktokCommission, wordpressShipping, operationMode, emergencyReserve, returnRate, paidTraffic, mlShippingCost, hasVariations, marketplace, category, adType, shippingOption, shopeeSellerType, useShopeeAds, paidTrafficType, paidTrafficGatewayFee, paidTrafficGatewayFixedFee, paidTrafficGatewayFeeType, enjoeiAdType, enjoeiInactivityMonths, trafficMode, gatewayBank, gatewayMethod, paidTrafficGatewayBank, paidTrafficGatewayMethod, meliPlus, supplierGatewayFee, supplierGatewayFixedFee, supplierGatewayFeeType, supplierFeeType, amazonPlan, amazonCategory, customCommission, shopeeStoreCouponEnabled, shopeeStoreCouponValue, shopeeStoreCouponType, shopeeProductCouponEnabled, shopeeProductCouponValue, shopeeProductCouponType, shopeeFollowerCouponEnabled, shopeeFollowerCouponValue, shopeeFollowerCouponType, shopeeSellerVoucherEnabled, shopeeSellerVoucherValue, shopeeSellerVoucherType, mercadoAdsEnabled, mercadoAdsDailyBudget, mercadoAdsSalesQuantity, mercadoAdsCpc, mercadoAdsConversionRate,
    tiktokAdsEnabled, tiktokDailyBudget, tiktokAdsSalesQuantity, tiktokCPA, tiktokCPM, tiktokCTR, tiktokCVR, tiktokSfpEnabled, influencers, affiliates]);

  const variationCalculations = useMemo<VariationCalculation[]>(() => {
      const sFixed = parseCurrency(supplierFixedFee) || 0;
      const pkg = operationMode === 'dropshipping' ? sFixed : (parseCurrency(packagingCost) || 0);
      const supplierFee = supplierFeeType === 'fixed' ? sFixed : (parseCurrency(supplierFeePercent) || 0);
      const extra = parseCurrency(extraCommission) || 0;
      const adsEnabled = marketplace === 'mercadolivre' 
        ? mercadoAdsEnabled 
        : marketplace === 'tiktok'
          ? tiktokAdsEnabled
          : useShopeeAds;
      
      const tiktokCpaVal = parseCurrency(tiktokCPA) || 0;
      const tiktokSalesVal = parseCurrency(tiktokAdsSalesQuantity) || 0;
      const tiktokBudgetVal = parseCurrency(tiktokDailyBudget) || 0;
      const tiktokCpmVal = parseCurrency(tiktokCPM) || 0;
      const tiktokCtrVal = parseCurrency(tiktokCTR) || 0;
      const tiktokCvrVal = parseCurrency(tiktokCVR) || 0;
      
      let tiktokFinalBudget = tiktokBudgetVal;
      if (tiktokCpaVal > 0 && tiktokSalesVal > 0) {
        tiktokFinalBudget = tiktokCpaVal * tiktokSalesVal;
      } else if (tiktokCpmVal > 0 && tiktokCtrVal > 0 && tiktokCvrVal > 0 && tiktokSalesVal > 0) {
          const requiredClicks = tiktokSalesVal / (tiktokCvrVal / 100);
          const requiredImpressions = requiredClicks / (tiktokCtrVal / 100);
          tiktokFinalBudget = (requiredImpressions / 1000) * tiktokCpmVal;
      }

      const cpc = marketplace === 'mercadolivre' ? (parseCurrency(mercadoAdsCpc) || 0) : (useShopeeAds ? 0 : (parseCurrency(adsCPC) || 0));
      const conversionRate = marketplace === 'mercadolivre' ? ((parseCurrency(mercadoAdsConversionRate) || 0) / 100) : 0;
      const budget = marketplace === 'mercadolivre'
        ? (parseCurrency(mercadoAdsDailyBudget) || 0)
        : marketplace === 'tiktok'
          ? tiktokFinalBudget
          : (parseCurrency(dailyBudget) || 0);
      const sales = marketplace === 'mercadolivre'
        ? (parseCurrency(mercadoAdsSalesQuantity) || 0)
        : marketplace === 'tiktok'
          ? tiktokSalesVal
          : (parseCurrency(salesQuantity) || 0);
      const gatewayFeeValue = parseCurrency(gatewayFee) || 0;
      const competitor = parseCurrency(competitorPrice) || 0;
      const compMarkup = parseCurrency(competitorMarkup) || 1.1;
      const tiktokComm = parseCurrency(tiktokCommission) || 6;
      const wpShipping = parseCurrency(wordpressShipping) || 0;
      const emergency = operationMode === 'dropshipping' ? (parseCurrency(emergencyReserve) || 0) : 0;
      const rRate = parseCurrency(returnRate) || 33.33;
      // Only include paid traffic cost if Traffic Mode is 'paid'
      const pTraffic = trafficMode === 'paid' ? (parseCurrency(paidTraffic) || 0) : 0;
      const mlShipping = parseCurrency(mlShippingCost) || 0;
      const gatewayFixedBase = parseCurrency(gatewayFixedFee) || 0;
      const gatewayPercent = gatewayFeeType === 'percent' ? gatewayFeeValue : 0;
      const gatewayFixed = (gatewayFeeType === 'fixed' ? gatewayFeeValue : 0) + gatewayFixedBase;
      const gatewayOverride = gatewayBank === 'picpay' && gatewayMethod === 'pix';
      const gatewayPercentFinal = gatewayOverride ? 0 : gatewayPercent;
      const gatewayFixedFinal = gatewayOverride ? 0 : gatewayFixed;
      const ptGatewayFeeValue = trafficMode === 'paid' ? (parseCurrency(paidTrafficGatewayFee) || 0) : 0;
      const ptGatewayFixedBase = trafficMode === 'paid' ? (parseCurrency(paidTrafficGatewayFixedFee) || 0) : 0;
      const ptGatewayPercent = paidTrafficGatewayFeeType === 'percent' ? ptGatewayFeeValue : 0;
      const ptGatewayFixed = (paidTrafficGatewayFeeType === 'fixed' ? ptGatewayFeeValue : 0) + ptGatewayFixedBase;
      const ptGatewayOverride = paidTrafficGatewayBank === 'picpay' && paidTrafficGatewayMethod === 'pix';
      const ptGatewayPercentFinal = ptGatewayOverride ? 0 : ptGatewayPercent;
      const ptGatewayFixedFinal = ptGatewayOverride ? 0 : ptGatewayFixed;
      const enjoeiType = enjoeiAdType;
      const enjoeiInactivity = parseCurrency(enjoeiInactivityMonths) || 0;
      const supplierGatewayFeeValue = parseCurrency(supplierGatewayFee) || 0;
      const supplierGatewayFixedBase = parseCurrency(supplierGatewayFixedFee) || 0;
      const supplierGatewayPercent = supplierGatewayFeeType === 'percent' ? supplierGatewayFeeValue : 0;
      const supplierGatewayFixed = supplierGatewayFeeType === 'fixed' ? supplierGatewayFixedBase : 0;
      const shopeeStoreCoupon = shopeeStoreCouponEnabled ? (parseCurrency(shopeeStoreCouponValue) || 0) : 0;
      const shopeeProductCoupon = shopeeProductCouponEnabled ? (parseCurrency(shopeeProductCouponValue) || 0) : 0;
      const shopeeFollowerCoupon = shopeeFollowerCouponEnabled ? (parseCurrency(shopeeFollowerCouponValue) || 0) : 0;
      const shopeeSellerVoucher = shopeeSellerVoucherEnabled ? (parseCurrency(shopeeSellerVoucherValue) || 0) : 0;
      const fallbackManualPrice = parseCurrency(manualSellingPrice) || 0;

      return variations.map(v => {
          const vCost = parseCurrency(v.cost) || 0;
          const vMarkup = parseCurrency(v.markup) || 1.5; 
          const vManualPrice = v.manualPrice ? (parseCurrency(v.manualPrice) || 0) : fallbackManualPrice;
          
          return {
              ...v,
          metrics: calculateMetrics(
              vCost, pkg, supplierFee, vMarkup, marketplace, category, adType, shippingOption, shopeeSellerType, extra, adsEnabled, cpc, budget, sales, gatewayPercentFinal, vManualPrice, competitor, compMarkup, tiktokComm, wpShipping, emergency, rRate, pTraffic, mlShipping, paidTrafficType, gatewayFixedFinal, ptGatewayPercentFinal, ptGatewayFixedFinal, enjoeiType, enjoeiInactivity, gatewayBank, gatewayMethod, paidTrafficGatewayBank, paidTrafficGatewayMethod, meliPlus, supplierFeeType, supplierGatewayPercent, supplierGatewayFixed, supplierGatewayFeeType, amazonPlan, amazonCategory, customCommission, shopeeStoreCoupon, shopeeProductCoupon, shopeeFollowerCoupon, shopeeSellerVoucher, shopeeStoreCouponType, shopeeProductCouponType, shopeeFollowerCouponType, shopeeSellerVoucherType, conversionRate, influencers, affiliates, tiktokSfpEnabled
          )
          };
      });
  }, [variations, packagingCost, supplierFixedFee, supplierFeePercent, marketplace, category, shippingOption, shopeeSellerType, adType, extraCommission, useShopeeAds, adsCPC, dailyBudget, salesQuantity, mercadoAdsEnabled, mercadoAdsDailyBudget, mercadoAdsSalesQuantity, mercadoAdsCpc, mercadoAdsConversionRate, gatewayFee, gatewayFixedFee, gatewayFeeType, competitorPrice, competitorMarkup, tiktokCommission, wordpressShipping, operationMode, emergencyReserve, returnRate, paidTraffic, mlShippingCost, paidTrafficType, paidTrafficGatewayFee, paidTrafficGatewayFixedFee, paidTrafficGatewayFeeType, enjoeiAdType, enjoeiInactivityMonths, trafficMode, gatewayBank, gatewayMethod, paidTrafficGatewayBank, paidTrafficGatewayMethod, meliPlus, supplierGatewayFee, supplierGatewayFixedFee, supplierGatewayFeeType, supplierFeeType, amazonPlan, amazonCategory, customCommission, shopeeStoreCouponEnabled, shopeeStoreCouponValue, shopeeStoreCouponType, shopeeProductCouponEnabled, shopeeProductCouponValue, shopeeProductCouponType, shopeeFollowerCouponEnabled, shopeeFollowerCouponValue, shopeeFollowerCouponType, shopeeSellerVoucherEnabled, shopeeSellerVoucherValue, shopeeSellerVoucherType, manualSellingPrice,
    tiktokAdsEnabled, tiktokDailyBudget, tiktokAdsSalesQuantity, tiktokCPA, tiktokCPM, tiktokCTR, tiktokCVR, tiktokSfpEnabled, influencers, affiliates]);

  // Salvar filtros no localStorage sempre que mudarem
  useEffect(() => {
    if (typeof window !== 'undefined' && 'localStorage' in window) {
      try {
        console.log('[Filters Save] Saving to localStorage:', productFilters);
        window.localStorage.setItem('product_filters_v1', JSON.stringify(productFilters));
      } catch (error) {
        console.log('[Filters Save] Error saving filters:', error);
      }
    }
  }, [productFilters]);

  return {
    productName, setProductName,
    hasVariations, setHasVariations,
    variations, setVariations,
    variationName, setVariationName,
    variationSku, setVariationSku,
    variationStock, setVariationStock,
    variationCost, setVariationCost,
    variationMarkup, setVariationMarkup,
    variationType, setVariationType,
    supplierName, setSupplierName,
    supplier_id, setSupplier_id,
    handleSupplierChange,
    supplierFixedFee, setSupplierFixedFee,
    costPrice, setCostPrice,
    manualSellingPrice, setManualSellingPrice,
    packagingCost, setPackagingCost,
    supplierFeePercent, setSupplierFeePercent,
    supplierFeeType, setSupplierFeeType,
    supplierGatewayFee, setSupplierGatewayFee,
    supplierGatewayFixedFee, setSupplierGatewayFixedFee,
    supplierGatewayFeeType, setSupplierGatewayFeeType,
    gatewayFee, setGatewayFee,
    gatewayFixedFee, setGatewayFixedFee,
    gatewayFeeType, setGatewayFeeType,
    markupMultiplier, setMarkupMultiplier,
    extraCommission, setExtraCommission,
    marketplace, setMarketplace,
    marketplace_id, setMarketplace_id,
    tiktokCommission, setTiktokCommission,
    wordpressShipping, setWordpressShipping,
    amazonPlan, setAmazonPlan,
    amazonCategory, setAmazonCategory,
    customCommission, setCustomCommission,
    competitorPrice, setCompetitorPrice,
    competitorMarkup, setCompetitorMarkup,
    category, setCategory,
    shippingOption, setShippingOption,
    shopeeSellerType, setShopeeSellerType,
    shopeeStoreCouponEnabled, setShopeeStoreCouponEnabled,
    shopeeStoreCouponValue, setShopeeStoreCouponValue,
    shopeeStoreCouponType, setShopeeStoreCouponType,
    shopeeProductCouponEnabled, setShopeeProductCouponEnabled,
    shopeeProductCouponValue, setShopeeProductCouponValue,
    shopeeProductCouponType, setShopeeProductCouponType,
    shopeeFollowerCouponEnabled, setShopeeFollowerCouponEnabled,
    shopeeFollowerCouponValue, setShopeeFollowerCouponValue,
    shopeeFollowerCouponType, setShopeeFollowerCouponType,
    shopeeSellerVoucherEnabled, setShopeeSellerVoucherEnabled,
    shopeeSellerVoucherValue, setShopeeSellerVoucherValue,
    shopeeSellerVoucherType, setShopeeSellerVoucherType,
    accountType, setAccountType,
    accountHolder, setAccountHolder,
    adType, setAdType,
    mlShippingCost, setMlShippingCost,
    hasReputation, setHasReputation,
    reputationLevel, setReputationLevel,
    meliPlus, setMeliPlus,
    facebookDelivery, setFacebookDelivery,
    trafficMode, setTrafficMode,
    organicSubMode, setOrganicSubMode,
    orgFreq, setOrgFreq,
    orgImpressions, setOrgImpressions,
    orgClicks, setOrgClicks,
    orgSales, setOrgSales,
    organicChannels, setOrganicChannels,
    organicChannelLinks, setOrganicChannelLinks,
    organicChannelNames, setOrganicChannelNames,
    influencers, setInfluencers,
    affiliates, setAffiliates,
    orgCostVideo, setOrgCostVideo,
    orgKieCost, setOrgKieCost,
    orgKieCredits, setOrgKieCredits,
    selectedAiModel, setSelectedAiModel,
    selectedKiePlan, setSelectedKiePlan,
    currentCredits, setCurrentCredits,
    videoDuration, setVideoDuration,
    organicApi, setOrganicApi,
    useUploadPostFree, setUseUploadPostFree,
    competitorDiscount, setCompetitorDiscount,
    operationMode, setOperationMode,
    deliveryMode, setDeliveryMode,
    deliveryLogistics, setDeliveryLogistics,
    productCondition, setProductCondition,
    productDescription, setProductDescription,
    emergencyReserve, setEmergencyReserve,
    workingCapital, setWorkingCapital,
    returnRate, setReturnRate,
    paidTraffic, setPaidTraffic,
    paidTrafficType, setPaidTrafficType,
    gatewayBank, setGatewayBank,
    gatewayMethod, setGatewayMethod,
    gatewayInstallments, setGatewayInstallments,
    useShopeeAds, setUseShopeeAds,
    adsCPC, setAdsCPC,
    dailyBudget, setDailyBudget,
    salesQuantity, setSalesQuantity,
    shopeeTotalBudget, setShopeeTotalBudget,
    shopeeStartDate, setShopeeStartDate,
    shopeeEndDate, setShopeeEndDate,
    shopeeAdType, setShopeeAdType,
    shopeeBidType, setShopeeBidType,
    shopeeKeywordInput, setShopeeKeywordInput,
    shopeeKeywords, setShopeeKeywords,
    shopeeMaxCpc, setShopeeMaxCpc,
    mercadoAdsEnabled, setMercadoAdsEnabled,
    mercadoAdsManagementMode, setMercadoAdsManagementMode,
    mercadoAdsSolution, setMercadoAdsSolution,
    mercadoAdsSelection, setMercadoAdsSelection,
    mercadoAdsDailyBudget, setMercadoAdsDailyBudget,
    mercadoAdsAcosTarget, setMercadoAdsAcosTarget,
    mercadoAdsSalesQuantity, setMercadoAdsSalesQuantity,
    mercadoAdsCpc, setMercadoAdsCpc,
    mercadoAdsConversionRate, setMercadoAdsConversionRate,
    mercadoAdsBudgetType, setMercadoAdsBudgetType,
    tiktokAdsEnabled, setTiktokAdsEnabled,
    tiktokAdFormat, setTiktokAdFormat,
    tiktokAudience, setTiktokAudience,
    tiktokCampaignObjective, setTiktokCampaignObjective,
    tiktokDailyBudget, setTiktokDailyBudget,
    tiktokCPA, setTiktokCPA,
    tiktokAdsSalesQuantity, setTiktokAdsSalesQuantity,
    tiktokCPM, setTiktokCPM,
    tiktokCTR, setTiktokCTR,
    tiktokCVR, setTiktokCVR,
    tiktokCatalogId, setTiktokCatalogId,
    tiktokSfpEnabled, setTiktokSfpEnabled,
    handleFloatInput,
    handleOperationModeChange,
    handleDeliveryModeChange,
    handleMarketplaceChange,
    handleGatewayBankChange,
    handleGatewayMethodChange,
    handleGatewayInstallmentsChange,
    handlePaidTrafficGatewayBankChange,
    handlePaidTrafficGatewayMethodChange,
    handlePaidTrafficGatewayInstallmentsChange,
    handleTrafficModeChange, // Added this
    paidTrafficGatewayBank,
    paidTrafficGatewayMethod,
    paidTrafficGatewayInstallments,
    paidTrafficGatewayFee,
    setPaidTrafficGatewayFee,
    paidTrafficGatewayFixedFee,
    paidTrafficGatewayFeeType, setPaidTrafficGatewayFeeType,
    paidConversionRate, setPaidConversionRate,
    paidCtr, setPaidCtr,
    selectedInfluencerId, setSelectedInfluencerId,
    videoGenerationLlm, setVideoGenerationLlm,
    videoGenerationPlan, setVideoGenerationPlan,
    handleShopeeAdsChange,
    handleShopeeCategoryChange,
    enjoeiAdType, setEnjoeiAdType,
    enjoeiInactivityMonths, setEnjoeiInactivityMonths,
    addVariation,
    removeVariation,
    updateVariation,
    updateAllVariationsMarkup,
    productFilters, setProductFilters,
    calculations,
    variationCalculations,
    productImage,
    setProductImage,
    productSku,
    setProductSku,
    stockQuantity,
    setStockQuantity,
    weight,
    setWeight,
    width,
    setWidth,
    height,
    setHeight,
    depth,
    setDepth,
    unitOfMeasure,
    setUnitOfMeasure,
    resetProductDraft
  };
};
