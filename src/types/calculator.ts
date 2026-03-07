export interface Influencer {
  id: string;
  name: string;
  instagram?: string;
  tiktok?: string;
  twitter?: string;
  percentage: string;
}

export interface Affiliate {
  id: string;
  name: string;
  percentage: string;
}

export interface TaxRate {
  rate: number;
  name: string;
}

export interface TaxCategory {
  [key: string]: TaxRate;
}

export interface MercadoLivreTaxes {
  [key: string]: TaxCategory;
}

export interface Variation {
  id: string;
  variationType: 'color' | 'size';
  name: string;
  sku?: string;
  stockQuantity?: string;
  cost: string;
  markup: string;
  manualPrice?: string;
  manualPriceLocked?: boolean;
}

export interface ProductVariationRecord {
  id?: string;
  variationType?: 'color' | 'size';
  name?: string;
  sku?: string;
  stockQuantity?: string | number;
  cost?: string | number;
  markup?: string | number;
  manualPrice?: string | number;
  suggestedPrice?: string | number;
  netRevenue?: string | number;
  margin?: string | number;
  imageUrl?: string;
}

export interface ProductItem {
  id: string;
  name: string;
  imageUrl: string;
  createdAt?: string;
  updatedAt?: string;
  sku?: string;
  description?: string;
  sellingPrice?: string | number;
  costPrice?: string | number;
  supplierName?: string;
  supplier_id?: string;
  marketplace?: string;
  marketplace_id?: string;
  netRevenue?: string | number;
  colorHex: string;
  marginStatus?: string;
  accountHolder?: string;
  accountType?: string;
  stockQuantity?: number;
  amazonPlan?: string;
  amazonCategory?: string;
  adType?: 'gratis' | 'classico' | 'premium';
  mlShippingCost?: string;
  shippingOption?: 'with' | 'without';
  marketplaceShippingCost?: string;
  enjoeiAdType?: string;
  enjoeiInactivityMonths?: string;
  weight?: string | number;
  width?: string | number;
  height?: string | number;
  depth?: string | number;
  unitOfMeasure?: string;
  organizationId?: string;
  variations?: ProductVariationRecord[];
  trafficMode?: 'paid' | 'organic';
  organicChannels?: string[];
  organicChannelNames?: Record<string, string>;
  organicChannelLinks?: Record<string, string>;
  paidTraffic?: string | number;
  operationMode?: 'dropshipping' | 'armazem_alob';
  gatewayMethod?: 'pix' | 'credit' | 'debit';
  gatewayBank?: string;
  meliPlus?: boolean;
  hasReputation?: boolean;
  reputationLevel?: 'negative' | 'average' | 'positive' | 'excellent';
  videoGenerationLlm?: 'veo3' | 'sora2' | 'grok' | 'wan2' | 'copia' | 'kling' | 'runway' | 'luma' | 'pika25' | 'seedance';
  targetAudienceAge?: string;
  targetAudienceLocation?: string;
  targetAudienceInterests?: string;
  targetAudienceBehaviors?: string;
  adPlacement?: 'feed_fb' | 'feed_ig' | 'reels' | 'stories' | 'audience_network';
  adFormat?: 'image' | 'video' | 'carousel';
  isNewProduct?: 'sim' | 'nao';
  defectiveProduct?: 'sim' | 'nao';
  facebookDelivery?: 'entrega' | 'retirada';
  shopeeUseAds?: boolean;
  shopeeAdsCpc?: string | number;
  shopeeDailyBudget?: string | number;
  shopeeSalesQuantity?: string | number;
  shopeeTotalBudget?: string | number;
  shopeeStartDate?: string;
  shopeeEndDate?: string;
  shopeeAdType?: string;
  shopeeBidType?: string;
  shopeeKeywords?: string[];
  shopeeMaxCpc?: string | number;
  mercadoAdsEnabled?: boolean;
  mercadoAdsManagementMode?: 'automatico' | 'personalizado';
  mercadoAdsSolution?: 'product_ads' | 'display_ads' | 'brand_ads';
  mercadoAdsSelection?: string;
  mercadoAdsDailyBudget?: string | number;
  mercadoAdsAcosTarget?: string | number;
  mercadoAdsSalesQuantity?: string | number;
  mercadoAdsCpc?: string | number;
  mercadoAdsConversionRate?: string | number;
  shopeeStoreCouponEnabled?: boolean;
  shopeeStoreCouponValue?: string | number;
  shopeeStoreCouponType?: 'percent' | 'fixed';
  shopeeProductCouponEnabled?: boolean;
  shopeeProductCouponValue?: string | number;
  shopeeProductCouponType?: 'percent' | 'fixed';
  shopeeFollowerCouponEnabled?: boolean;
  shopeeFollowerCouponValue?: string | number;
  shopeeFollowerCouponType?: 'percent' | 'fixed';
  shopeeSellerVoucherEnabled?: boolean;
  shopeeSellerVoucherValue?: string | number;
  shopeeSellerVoucherType?: 'percent' | 'fixed';
  campaignName?: string;
  campaignObjective?: string;
  budgetType?: string;
  conversion?: string;
  startDate?: string;
  endDate?: string;
  investmentValue?: string | number;
  audienceLocation?: string;
  audienceAge?: string;
  audienceGender?: string;
  audienceInterests?: string;
  audienceBehavior?: string;
  placement?: string;
  adText?: string;
  adTitle?: string;
  adMedia?: string;
  adCta?: string;
  adUrl?: string;
  adRedirectUrl?: string;
  instagramAccount?: string;
  instantForm?: boolean;
  tiktokAdsEnabled?: boolean;
  tiktokAdFormat?: 'in_feed' | 'top_view' | 'spark_ads' | 'hashtag_challenge' | 'shopping_ads';
  tiktokAudience?: string;
  tiktokCampaignObjective?: 'reach' | 'traffic' | 'conversions' | 'app_install' | 'video_shopping';
  tiktokDailyBudget?: string | number;
  tiktokCPA?: string | number;
  tiktokAdsSalesQuantity?: string | number;
  tiktokCPM?: string | number;
  tiktokCTR?: string | number;
  tiktokCVR?: string | number;
  tiktokCatalogId?: string;
  influencers?: Influencer[];
  affiliates?: Affiliate[];
  influencer_id?: string;
  promoVideoUrl?: string;
  promoVideoCopy?: string;
  promoVideoChannels?: string[]; // Array de canais selecionados
  promoVideoChannelLinks?: Record<string, string>; // Links por canal
  promoVideoChannelNames?: Record<string, string>; // Nomes de grupos por canal
}

export interface CalculationResult {
  cost: number;
  packagingCost: string;
  supplierFeeCost: string;
  supplierGatewayCost: string;
  emergencyReserve: string;
  totalCost: number;
  suggestedPrice: string;
  suggestedPriceRaw: number;
  marketplaceFee: string;
  marketplaceCost: string;
  fixedFee: string;
  gatewayCost: string;
  gatewayFee: number;
  paidTrafficCost: string;
  paidTrafficFee: number;
  paidTrafficType: 'percent' | 'fixed';
  paidTrafficGatewayCost: string;
  adsCostPerSale: string;
  totalCPA: string;
  totalFees: string;
  shopeeStoreCoupon: string;
  shopeeProductCoupon: string;
  shopeeFollowerCoupon: string;
  shopeeSellerVoucher: string;
  shopeeCouponTotal: string;
  netRevenue: string;
  actualMargin: string;
  recommendedMargin: number;
  taxDescription: string;
  manualPrice: number;
  discountApplied: number;
  increaseApplied: number;
  discountPercent: number;
  recommendedValue: string;
  competitor: number;
  breakevenCPA: string;
  reverseCR: string;
  marginStatus: string;
  returnRate: number;
  lossPerReturn: string;
  influencerCost: string;
  affiliateCost: string;
  totalInfluencerPercent: number;
  totalAffiliatePercent: number;
}

export interface ShopeeCategory {
    name: string;
    avgCPC: number;
    avgCR: number;
}

export interface AiModel {
    name: string;
    costPerSec: number;
}

export interface KiePlan {
    name: string;
    price: number;
    credits: number;
}
