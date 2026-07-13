
import { supabase } from '@/lib/supabase';
import type { ProductItem, ProductVariationRecord } from '@/types/calculator';
import { parseCurrency } from '@/utils/currency';

// Batch IDs into chunks to avoid URL length limits (PostgREST IN clause)
async function batchInQuery<T>(
  table: string,
  column: string,
  ids: string[],
  selectCols: string,
  chunkSize = 50
): Promise<T[]> {
  const results: T[] = [];
  for (let i = 0; i < ids.length; i += chunkSize) {
    const chunk = ids.slice(i, i + chunkSize);
    const { data } = await supabase.from(table).select(selectCols).in(column, chunk);
    if (data) results.push(...(data as T[]));
  }
  return results;
}

type ProductRow = {
  id: string;
  organization_id?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  name: string;
  sku?: string | null;
  description?: string | null;
  price?: number | null;
  cost_price?: number | null;
  supplier_name?: string | null;
  supplier_id?: string | null;
  account_holder?: string | null;
  account_type?: string | null;
  variations?: ProductVariationRecord[] | null;
  image_url?: string | null;
  color_hex?: string | null;
  net_revenue?: number | null;
  marketplace?: string | null;
  marketplace_id?: string | null;
  margin_status?: string | null;
  stock_quantity?: number | null;
  amazon_plan?: string | null;
  amazon_category?: string | null;
  ml_category?: string | null;
  ad_type?: string | null;
  has_reputation?: boolean | null;
  reputation_level?: string | null;
  ml_shipping_cost?: number | null;
  shipping_option?: string | null;
  marketplace_shipping_cost?: number | null;
  enjoei_ad_type?: string | null;
  enjoei_inactivity_months?: string | null;
  peso?: number | null;
  largura?: number | null;
  altura?: number | null;
  profundidade?: number | null;
  unidade_medida?: string | null;
  operation_mode?: string | null;
  gateway_method?: string | null;
  gateway_bank?: string | null;
  gateway_fee_value?: number | null;
  gateway_fee_type?: string | null;
  gateway_installments?: number | null;
  supplier_fee_type?: string | null;
  supplier_fee_value?: number | null;
  supplier_gateway_fee_type?: string | null;
  supplier_gateway_fee_value?: number | null;
  supplier_gateway_fee_percent?: number | null;
  supplier_gateway_fee_fixed?: number | null;
  video_generation_llm?: string | null;
  is_new_product?: string | null;
  defective_product?: string | null;
  facebook_delivery?: string | null;
  organic_channels?: string[] | null;
  organic_channel_links?: Record<string, string> | null;
  organic_channel_names?: Record<string, string> | null;
  promo_video_url?: string | null;
  promo_video_copy?: string | null;
  promo_video_channels?: string[] | null;
  promo_video_channel_links?: Record<string, string> | null;
  promo_video_channel_names?: Record<string, string> | null;
  promo_video_channel_copies?: Record<string, string> | null;
  additional_videos?: Array<{ id: string; url: string; copy: string }> | null;
  shopee_use_ads?: boolean | null;
  shopee_ads_cpc?: number | null;
  shopee_daily_budget?: number | null;
  shopee_sales_quantity?: number | null;
  shopee_total_budget?: number | null;
  shopee_start_date?: string | null;
  shopee_end_date?: string | null;
  shopee_ad_type?: string | null;
  shopee_bid_type?: string | null;
  shopee_keywords?: string[] | null;
  shopee_max_cpc?: number | null;
  shopee_store_coupon_enabled?: boolean | null;
  shopee_store_coupon_value?: number | null;
  shopee_store_coupon_type?: string | null;
  shopee_product_coupon_enabled?: boolean | null;
  shopee_product_coupon_value?: number | null;
  shopee_product_coupon_type?: string | null;
  shopee_follower_coupon_enabled?: boolean | null;
  shopee_follower_coupon_value?: number | null;
  shopee_follower_coupon_type?: string | null;
  shopee_seller_voucher_enabled?: boolean | null;
  shopee_seller_voucher_value?: number | null;
  shopee_seller_voucher_type?: string | null;
  mercado_ads_enabled?: boolean | null;
  mercado_ads_management_mode?: string | null;
  mercado_ads_solution?: string | null;
  mercado_ads_selection?: string | null;
  mercado_ads_daily_budget?: number | null;
  mercado_ads_acos_target?: number | null;
  mercado_ads_sales_quantity?: number | null;
  mercado_ads_cpc?: number | null;
  mercado_ads_conversion_rate?: number | null;
  campaign_name?: string | null;
  campaign_objective?: string | null;
  budget_type?: string | null;
  conversion?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  investment_value?: number | null;
  audience_location?: string | null;
  audience_age?: string | null;
  audience_gender?: string | null;
  audience_interests?: string | null;
  audience_behavior?: string | null;
  placement?: string | null;
  ad_text?: string | null;
  ad_title?: string | null;
  ad_media?: string | null;
  ad_cta?: string | null;
  ad_url?: string | null;
  ad_redirect_url?: string | null;
  instagram_account?: string | null;
  instant_form?: boolean | null;
  tiktok_ads_enabled?: boolean | null;
  tiktok_ad_format?: string | null;
  tiktok_audience?: string | null;
  tiktok_campaign_objective?: string | null;
  tiktok_daily_budget?: number | null;
  tiktok_campaign_id?: string | null;
  roi_target?: number | null;
  tiktok_promo_product_value?: number | null;
  tiktok_promo_product_type?: string | null;
  tiktok_promo_product_until?: string | null;
  tiktok_promo_new_customer_value?: number | null;
  tiktok_promo_new_customer_type?: string | null;
  tiktok_promo_shipping_value?: number | null;
  tiktok_promo_shipping_type?: string | null;
  tiktok_cpa?: number | null;
  tiktok_ads_sales_quantity?: number | null;
  tiktok_cpm?: number | null;
  tiktok_ctr?: number | null;
  tiktok_cvr?: number | null;
  tiktok_catalog_id?: string | null;
  tiktok_sfp_enabled?: boolean | null;
  influencers?: Array<{
    id: string;
    name: string;
    instagram?: string;
    tiktok?: string;
    twitter?: string;
    percentage: string;
  }> | null;
  affiliates?: Array<{
    id: string;
    name: string;
    percentage: string;
  }> | null;
};

type BlingProductRow = {
  id: string;
  organization_id?: string | null;
  bling_id?: number | null;
  name?: string | null;
  sku?: string | null;
  stock_quantity?: number | null;
  image_url?: string | null;
  cost_price?: number | null;
  sale_price?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
  image_url1?: string | null;
  image_url2?: string | null;
  image_url3?: string | null;
  image_url4?: string | null;
  image_url5?: string | null;
  image_url6?: string | null;
  image_url7?: string | null;
  image_url8?: string | null;
  image_url9?: string | null;
  image_url10?: string | null;
  id_categoria?: string | null;
  id_fornecedor?: string | null;
  ncm?: string | null;
  video_url?: string | null;
  variacao_nome?: string | null;
  peso?: number | null;
  largura?: number | null;
  altura?: number | null;
  profundidade?: number | null;
  unidade_medida?: string | null;
  sku_fornecedor?: string | null;
  descricao?: string | null;
  itens_por_caixa?: number | null;
  ean?: string | null;
  localizacao?: string | null;
  grupo_produto_id?: string | null;
  situacao?: string | null;
  id_produto_pai?: number | null;
};

export type BlingProduct = {
  id: string;
  blingId?: number | null;
  name: string;
  sku: string;
  stockQuantity: number;
  imageUrl: string;
  costPrice: number;
  salePrice: number;
  createdAt?: string | null;
  updatedAt?: string | null;
  categoryId?: string | null;
  supplierId?: string | null;
  description?: string | null;
  variationName?: string | null;
  supplierSku?: string | null;
  status?: string | null;
};

type ProductPayload = {
  organization_id?: string | null;
  name: string;
  sku?: string | null;
  description?: string | null;
  price?: string | number | null;
  cost_price?: string | number | null;
  supplier_name?: string | null;
  supplier_id?: string | null;
  account_holder?: string | null;
  account_type?: string | null;
  variations?: ProductVariationRecord[] | null;
  image_url?: string | null;
  net_revenue?: string | number | null;
  marketplace?: string | null;
  marketplace_id?: string | null;
  margin_status?: string | null;
  color_hex?: string | null;
  stock_quantity?: number | null;
  amazon_plan?: string | null;
  amazon_category?: string | null;
  ml_category?: string | null;
  ad_type?: string | null;
  has_reputation?: boolean | null;
  reputation_level?: string | null;
  ml_shipping_cost?: string | number | null;
  shipping_option?: string | null;
  marketplace_shipping_cost?: string | number | null;
  enjoei_ad_type?: string | null;
  enjoei_inactivity_months?: string | null;
  peso?: number | null;
  largura?: number | null;
  altura?: number | null;
  profundidade?: number | null;
  unidade_medida?: string | null;
  operation_mode?: string | null;
  gateway_method?: string | null;
  gateway_bank?: string | null;
  gateway_fee_value?: number | null;
  gateway_fee_type?: string | null;
  gateway_installments?: number | null;
  supplier_fee_type?: string | null;
  supplier_fee_value?: number | null;
  supplier_gateway_fee_type?: string | null;
  supplier_gateway_fee_value?: number | null;
  supplier_gateway_fee_percent?: number | null;
  supplier_gateway_fee_fixed?: number | null;
  video_generation_llm?: string | null;
  is_new_product?: string | null;
  defective_product?: string | null;
  facebook_delivery?: string | null;
  organic_channels?: string[] | null;
  organic_channel_links?: Record<string, string> | null;
  organic_channel_names?: Record<string, string> | null;
  promo_video_url?: string | null;
  promo_video_copy?: string | null;
  promo_video_channels?: string[] | null;
  promo_video_channel_links?: Record<string, string> | null;
  promo_video_channel_names?: Record<string, string> | null;
  promo_video_channel_copies?: Record<string, string> | null;
  additional_videos?: Array<{ id: string; url: string; copy: string }> | null;
  shopee_use_ads?: boolean | null;
  shopee_ads_cpc?: number | null;
  shopee_daily_budget?: number | null;
  shopee_sales_quantity?: number | null;
  shopee_total_budget?: number | null;
  shopee_start_date?: string | null;
  shopee_end_date?: string | null;
  shopee_ad_type?: string | null;
  shopee_bid_type?: string | null;
  shopee_keywords?: string[] | null;
  shopee_max_cpc?: number | null;
  shopee_store_coupon_enabled?: boolean | null;
  shopee_store_coupon_value?: number | null;
  shopee_store_coupon_type?: string | null;
  shopee_product_coupon_enabled?: boolean | null;
  shopee_product_coupon_value?: number | null;
  shopee_product_coupon_type?: string | null;
  shopee_follower_coupon_enabled?: boolean | null;
  shopee_follower_coupon_value?: number | null;
  shopee_follower_coupon_type?: string | null;
  shopee_seller_voucher_enabled?: boolean | null;
  shopee_seller_voucher_value?: number | null;
  shopee_seller_voucher_type?: string | null;
  mercado_ads_enabled?: boolean | null;
  mercado_ads_management_mode?: string | null;
  mercado_ads_solution?: string | null;
  mercado_ads_selection?: string | null;
  mercado_ads_daily_budget?: number | null;
  mercado_ads_acos_target?: number | null;
  mercado_ads_sales_quantity?: number | null;
  mercado_ads_cpc?: number | null;
  mercado_ads_conversion_rate?: number | null;
  campaign_name?: string | null;
  campaign_objective?: string | null;
  budget_type?: string | null;
  conversion?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  investment_value?: number | null;
  audience_location?: string | null;
  audience_age?: string | null;
  audience_gender?: string | null;
  audience_interests?: string | null;
  audience_behavior?: string | null;
  placement?: string | null;
  ad_text?: string | null;
  ad_title?: string | null;
  ad_media?: string | null;
  ad_cta?: string | null;
  ad_url?: string | null;
  ad_redirect_url?: string | null;
  instagram_account?: string | null;
  instant_form?: boolean | null;
  tiktok_ads_enabled?: boolean | null;
  tiktok_ad_format?: string | null;
  tiktok_audience?: string | null;
  tiktok_campaign_objective?: string | null;
  tiktok_daily_budget?: number | null;
  tiktok_campaign_id?: string | null;
  roi_target?: number | null;
  tiktok_promo_product_value?: number | null;
  tiktok_promo_product_type?: string | null;
  tiktok_promo_product_until?: string | null;
  tiktok_promo_new_customer_value?: number | null;
  tiktok_promo_new_customer_type?: string | null;
  tiktok_promo_shipping_value?: number | null;
  tiktok_promo_shipping_type?: string | null;
  tiktok_cpa?: number | null;
  tiktok_ads_sales_quantity?: number | null;
  tiktok_cpm?: number | null;
  tiktok_ctr?: number | null;
  tiktok_cvr?: number | null;
  tiktok_catalog_id?: string | null;
  tiktok_sfp_enabled?: boolean | null;
  influencers?: Array<{
    id: string;
    name: string;
    instagram?: string;
    tiktok?: string;
    twitter?: string;
    percentage: string;
  }> | null;
  affiliates?: Array<{
    id: string;
    name: string;
    percentage: string;
  }> | null;
};

const isMissingColumnError = (error: { code?: string | number | null; message?: string | null }) => {
  const normalizedCode = error?.code != null ? String(error.code) : '';
  if (normalizedCode === '42703' || normalizedCode === 'PGRST204') return true;
  if (error?.message && error.message.toLowerCase().includes('does not exist')) return true;
  return false;
};

const getMissingColumnName = (message?: string | null) => {
  if (!message) return '';
  const quoted = message.match(/'([^']+)'/);
  if (quoted?.[1]) return quoted[1];
  const quotedAlt = message.match(/"([^"]+)"/);
  if (quotedAlt?.[1]) return quotedAlt[1];
  const columnMatch = message.match(/column\s+([a-zA-Z0-9_.]+)/i);
  if (columnMatch?.[1]) {
    const parts = columnMatch[1].split('.');
    return parts[parts.length - 1] ?? columnMatch[1];
  }
  return '';
};

const removeColumnFromSelect = (columns: string, columnToRemove: string) => {
  if (!columnToRemove) return columns;
  return columns
    .split(',')
    .map((column) => column.trim())
    .filter((column) => column && column !== columnToRemove)
    .join(',');
};

const applyMissingColumnFallback = async (
  executor: (payload: ProductPayload, columns: string) => PromiseLike<{ data: unknown; error: { code?: string | number | null; message?: string | null } | null }>,
  payload: ProductPayload,
  columns: string
) => {
  const currentPayload = { ...payload } as ProductPayload;
  let currentColumns = columns;
  const removedColumns: string[] = [];
  let lastError: { code?: string | number | null; message?: string | null } | null = null;

  for (let attempt = 0; attempt < 100; attempt += 1) {
    const { data, error } = await executor(currentPayload, currentColumns);
    if (!error) {
      return { data: data as ProductRow | null, columns: currentColumns, removedColumns };
    }
    if (!isMissingColumnError(error)) {
      throw error;
    }
    const missingColumn = getMissingColumnName(error.message);
    if (!missingColumn) {
      throw error;
    }
    if (!removedColumns.includes(missingColumn)) {
      removedColumns.push(missingColumn);
    }
    
    // Group removal logic
    const isMercadoAds = mercadoAdsColumnList.includes(missingColumn);
    const isDimension = dimensionColumnList.includes(missingColumn);
    const isReputation = ['has_reputation', 'reputation_level'].includes(missingColumn);

    if (isMercadoAds) {
      mercadoAdsColumnList.forEach(col => {
        if (!removedColumns.includes(col)) removedColumns.push(col);
        delete currentPayload[col as keyof ProductPayload];
        currentColumns = removeColumnFromSelect(currentColumns, col);
      });
    } else if (isDimension) {
      dimensionColumnList.forEach(col => {
        if (!removedColumns.includes(col)) removedColumns.push(col);
        delete currentPayload[col as keyof ProductPayload];
        currentColumns = removeColumnFromSelect(currentColumns, col);
      });
    } else if (isReputation) {
      ['has_reputation', 'reputation_level'].forEach(col => {
        if (!removedColumns.includes(col)) removedColumns.push(col);
        delete currentPayload[col as keyof ProductPayload];
        currentColumns = removeColumnFromSelect(currentColumns, col);
      });
    } else {
      // Standard single column removal
      const hadColumn = Object.prototype.hasOwnProperty.call(currentPayload, missingColumn);
      if (hadColumn) {
        delete currentPayload[missingColumn as keyof ProductPayload];
      }
      const nextColumns = removeColumnFromSelect(currentColumns, missingColumn);
      if (!hadColumn && nextColumns === currentColumns) {
        throw error;
      }
      currentColumns = nextColumns;
    }
    lastError = error;
  }

  throw lastError ?? new Error('Missing column fallback failed');
};

const getDefaultMarketplaceImage = (value: string | null | undefined) => {
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

const resolveProductImageUrl = (value: string | null | undefined, marketplace: string | null | undefined) => {
  const normalized = (value ?? '').trim();
  if (!normalized) return getDefaultMarketplaceImage(marketplace);
  if (normalized.includes('placehold.co') && !normalized.includes('text=')) {
    return getDefaultMarketplaceImage(marketplace);
  }
  if (/^(https?:)?\/\//i.test(normalized) || normalized.startsWith('data:') || normalized.startsWith('blob:')) {
    return normalized;
  }
  if (/^(@\/|\/?src\/|\/?imgs\/|\/?video\/)/.test(normalized)) {
    try {
      const relativePath = normalized
        .replace(/^@\//, '')
        .replace(/^\/?src\//, '')
        .replace(/^\/+/, '');
      return new URL(`../${relativePath}`, import.meta.url).href;
    } catch {
      return getDefaultMarketplaceImage(marketplace);
    }
  }
  return normalized;
};

const REPUTATION_CACHE_KEY = 'productReputationCache';
const MELI_PLUS_CACHE_KEY = 'productMeliPlusCache';
const MERCADO_ADS_SUPPORT_KEY = 'productMercadoAdsSupport';
const DIMENSION_SUPPORT_KEY = 'productDimensionSupport';

type ReputationCacheEntry = {
  hasReputation: boolean;
  reputationLevel?: ProductItem['reputationLevel'];
};
type MeliPlusCacheEntry = {
  meliPlus: boolean;
};

const readSupportCache = (key: string): boolean | null => {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return null;
    return raw === 'true';
  } catch {
    return null;
  }
};

const writeSupportCache = (key: string, value: boolean) => {
  try {
    localStorage.setItem(key, String(value));
  } catch {
    // ignore
  }
};

const readReputationCache = (): Record<string, ReputationCacheEntry> => {
  try {
    const raw = localStorage.getItem(REPUTATION_CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};
    return parsed as Record<string, ReputationCacheEntry>;
  } catch {
    return {};
  }
};

const writeReputationCache = (cache: Record<string, ReputationCacheEntry>) => {
  try {
    localStorage.setItem(REPUTATION_CACHE_KEY, JSON.stringify(cache));
  } catch {
    return;
  }
};
const readMeliPlusCache = (): Record<string, MeliPlusCacheEntry> => {
  try {
    const raw = localStorage.getItem(MELI_PLUS_CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};
    return parsed as Record<string, MeliPlusCacheEntry>;
  } catch {
    return {};
  }
};
const writeMeliPlusCache = (cache: Record<string, MeliPlusCacheEntry>) => {
  try {
    localStorage.setItem(MELI_PLUS_CACHE_KEY, JSON.stringify(cache));
  } catch {
    return;
  }
};

const setReputationCacheForProduct = (
  id: string,
  hasReputation: boolean,
  reputationLevel?: ProductItem['reputationLevel']
) => {
  const cache = readReputationCache();
  cache[id] = { hasReputation, reputationLevel };
  writeReputationCache(cache);
};

const applyReputationCache = (products: ProductItem[]) => {
  const cache = readReputationCache();
  return products.map((product) => {
    const cached = cache[product.id];
    if (!cached) return product;
    return {
      ...product,
      hasReputation: cached.hasReputation,
      reputationLevel: cached.reputationLevel
    };
  });
};
const setMeliPlusCacheForProduct = (id: string, meliPlus: boolean) => {
  const cache = readMeliPlusCache();
  cache[id] = { meliPlus };
  writeMeliPlusCache(cache);
};
const applyMeliPlusCache = (products: ProductItem[]) => {
  const cache = readMeliPlusCache();
  return products.map((product) => {
    const cached = cache[product.id];
    if (!cached) return product;
    return {
      ...product,
      meliPlus: cached.meliPlus
    };
  });
};

const formatDateToUtcMinus3 = (value?: string | null) => {
  if (!value) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  const adjusted = new Date(parsed.getTime() - 3 * 60 * 60 * 1000);
  return adjusted.toISOString().slice(0, 10);
};

const formatDateTimeToUtcPlus3 = (value?: string | null) => {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  const adjusted = new Date(parsed.getTime() + 3 * 60 * 60 * 1000);
  return adjusted.toISOString();
};

const enrichVariationsWithImages = async (products: ProductItem[]): Promise<ProductItem[]> => {
  // Collect all product SKUs that have variations
  const productsWithVariations = products.filter(p => p.variations && p.variations.length > 0 && p.sku);

  if (productsWithVariations.length === 0) {
    return products;
  }

  // Get the product IDs from products_bling for these SKUs
  const productSkus = productsWithVariations.map(p => p.sku).filter(Boolean) as string[];
  const { data: blingParentData } = await supabase
    .from('products_bling')
    .select('id, sku')
    .in('sku', productSkus);

  if (!blingParentData || blingParentData.length === 0) {
    return products;
  }

  // Create map: parent SKU -> parent product_id
  const skuToProductId = new Map<string, string>();
  blingParentData.forEach((item: { id: string; sku: string }) => {
    skuToProductId.set(item.sku, item.id);
  });

  // Fetch all variations for these parent products using the product_id FK
  const parentProductIds = Array.from(skuToProductId.values());
  const { data: blingData } = await supabase
    .from('products_variations_bling')
    .select('sku, name, image_url1, image_url2, image_url3, variacao_nome, product_id')
    .in('product_id', parentProductIds)
    .not('variacao_nome', 'is', null)
    .neq('variacao_nome', '');
  
  if (!blingData || blingData.length === 0) {
    return products;
  }

  // Create a map: parent SKU -> array of variation data
  const variationsByParentSku = new Map<string, Array<{ sku: string; variacao_nome: string; imageUrl: string }>>();
  
  blingData.forEach((item: { sku: string; name?: string; image_url1?: string; image_url2?: string; image_url3?: string; variacao_nome?: string; product_id: string }) => {
    const imageUrl = item.image_url1 || item.image_url2 || item.image_url3;
    if (!item.variacao_nome) return;
    
    // Find parent SKU by looking up the product_id
    const parentSku = Array.from(skuToProductId.entries()).find(([, id]) => id === item.product_id)?.[0];
    
    if (!parentSku) return;
    
    if (!variationsByParentSku.has(parentSku)) {
      variationsByParentSku.set(parentSku, []);
    }
    
    variationsByParentSku.get(parentSku)!.push({
      sku: item.sku,
      variacao_nome: item.variacao_nome,
      imageUrl: imageUrl || ''
    });
  });

  // Helper function to normalize variation names for matching
  const normalizeVariationName = (name: string): string => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/\s+/g, ' ')
      .trim();
  };

  // Helper function to extract color and size from variation name
  const parseVariationName = (name: string): { color?: string; size?: string } => {
    const normalized = normalizeVariationName(name);
    // Split by common separators: -, ;, comma, or space
    const parts = normalized.split(/\s*[-;,]\s*/).map(p => p.trim()).filter(p => p.length > 0);
    
    let color: string | undefined;
    let size: string | undefined;
    
    parts.forEach(part => {
      const trimmed = part.trim();
      // Check if it's a size (P, M, G, GG, Unico, numeric like 38/39/40, or sizes with slash like 34/35)
      if (/^(p|m|g|gg|xg|xxg|pp|pequeno|medio|grande|unico|\d+\/\d+|\d+)$/i.test(trimmed)) {
        size = trimmed;
      } else if (trimmed.length > 0) {
        // Everything else is considered color (can be multi-word like "Verde �gua e Preto")
        if (color) {
          // If we already have a color, append this part (handles multi-word colors)
          color = color + ' ' + trimmed;
        } else {
          color = trimmed;
        }
      }
    });
    
    return { color, size };
  };

  // Helper function to parse Bling variation name format "Cor:Branco;Tamanho:P"
  const parseBlingVariationName = (variacaoNome: string): { color?: string; size?: string } => {
    const normalized = normalizeVariationName(variacaoNome);
    let color: string | undefined;
    let size: string | undefined;
    
    // Extract color (everything after "cor:" until semicolon or end)
    const colorMatch = normalized.match(/cor:\s*([^;]+)/);
    if (colorMatch) {
      color = colorMatch[1].trim();
    }
    
    // Extract size (everything after "tamanho:" until semicolon or end)
    const sizeMatch = normalized.match(/tamanho:\s*([^;]+)/);
    if (sizeMatch) {
      size = sizeMatch[1].trim();
    }
    
    return { color, size };
  };

  // Map images back to variations
  return products.map(product => {
    if (!product.variations || product.variations.length === 0 || !product.sku) {
      return product;
    }

    const blingVariations = variationsByParentSku.get(product.sku);
    if (!blingVariations || blingVariations.length === 0) {
      return product;
    }

    const enrichedVariations = product.variations.map(variation => {
      let imageUrl = variation.imageUrl as string | undefined;
      let sku = variation.sku as string | undefined;
      
      if (variation.name) {
        // Parse the variation name from products table (e.g., "P - Branco", "G - Preto", "Unico - Preto", "Preto")
        const parsed = parseVariationName(variation.name);
        
        // Find matching Bling variation
        const match = blingVariations.find(bv => {
          const blingParsed = parseBlingVariationName(bv.variacao_nome);
          
          // Match logic:
          // 1. If both have color AND size, both must match
          // 2. If only color exists (no size), match by color only
          // 3. If only size exists (no color), match by size only
          
          const hasColorInBoth = parsed.color && blingParsed.color;
          const hasSizeInBoth = parsed.size && blingParsed.size;
          
          if (hasColorInBoth && hasSizeInBoth) {
            // Both color and size must match
            return parsed.color === blingParsed.color && parsed.size === blingParsed.size;
          } else if (hasColorInBoth && !hasSizeInBoth) {
            // Only color needs to match
            return parsed.color === blingParsed.color;
          } else if (!hasColorInBoth && hasSizeInBoth) {
            // Only size needs to match
            return parsed.size === blingParsed.size;
          }
          
          return false;
        });
        
        if (match) {
          if (!imageUrl) {
            imageUrl = match.imageUrl;
          }
          if (!sku) {
            sku = match.sku;
          }
        }
      }

      return {
        ...variation,
        imageUrl: imageUrl || undefined,
        sku: sku || undefined
      };
    });

    return {
      ...product,
      variations: enrichedVariations
    };
  });
};

const mapProductRow = (item: ProductRow): ProductItem => ({
  id: item.id,
  createdAt: formatDateTimeToUtcPlus3(item.created_at ?? ''),
  updatedAt: formatDateTimeToUtcPlus3(item.updated_at ?? ''),
  name: item.name,
  sku: item.sku ?? '',
  description: item.description ?? '',
  sellingPrice: item.price ?? 0,
  costPrice: item.cost_price ?? 0,
  supplierName: item.supplier_name ?? '',
  supplier_id: item.supplier_id ?? undefined,
  accountHolder: item.account_holder ?? '',
  accountType: item.account_type ?? '',
  variations: (item.variations || []) as ProductVariationRecord[],
  imageUrl: resolveProductImageUrl(item.image_url, item.marketplace),
  colorHex: item.color_hex || '#000000',
  netRevenue: item.net_revenue ?? 0,
  marketplace: item.marketplace ?? '',
  marketplace_id: item.marketplace_id ?? undefined,
  marginStatus: item.margin_status ?? '',
  stockQuantity: item.stock_quantity ?? 0,
  meliPlus: false,
  amazonPlan: item.amazon_plan ?? '',
  amazonCategory: item.amazon_category ?? '',
  mlCategory: item.ml_category ?? '',
  adType: (item.ad_type ?? '') as ProductItem['adType'],
  hasReputation: item.has_reputation ?? false,
  reputationLevel: (item.reputation_level ?? undefined) as ProductItem['reputationLevel'] | undefined,
  mlShippingCost: item.ml_shipping_cost != null ? String(item.ml_shipping_cost) : '',
  shippingOption: (item.shipping_option ?? '') as ProductItem['shippingOption'],
  marketplaceShippingCost: item.marketplace_shipping_cost != null ? String(item.marketplace_shipping_cost) : '',
  enjoeiAdType: item.enjoei_ad_type ?? '',
  enjoeiInactivityMonths: item.enjoei_inactivity_months ?? '',
  weight: item.peso ?? undefined,
  width: item.largura ?? undefined,
  height: item.altura ?? undefined,
  depth: item.profundidade ?? undefined,
  unitOfMeasure: item.unidade_medida ?? undefined,
  operationMode: (item.operation_mode ?? '') as ProductItem['operationMode'],
  gatewayMethod: (item.gateway_method ?? '') as ProductItem['gatewayMethod'],
  gatewayBank: item.gateway_bank ?? '',
  gatewayFeeValue: item.gateway_fee_value != null ? String(item.gateway_fee_value) : '',
  gatewayFeeType: (item.gateway_fee_type ?? 'percent') as 'percent' | 'fixed',
  gatewayInstallments: item.gateway_installments != null ? String(item.gateway_installments) : '1',
  supplierFeeType: (item.supplier_fee_type ?? 'percent') as 'percent' | 'fixed',
  supplierFeeValue: item.supplier_fee_value != null ? String(item.supplier_fee_value) : '',
  supplierGatewayFeeType: (item.supplier_gateway_fee_type ?? 'fixed') as 'percent' | 'fixed',
  supplierGatewayFeeValue: item.supplier_gateway_fee_value != null ? String(item.supplier_gateway_fee_value) : '',
  videoGenerationLlm: (item.video_generation_llm ?? '') as ProductItem['videoGenerationLlm'],
  isNewProduct: (item.is_new_product ?? undefined) as ProductItem['isNewProduct'] | undefined,
  defectiveProduct: (item.defective_product ?? undefined) as ProductItem['defectiveProduct'] | undefined,
  facebookDelivery: (item.facebook_delivery ?? undefined) as ProductItem['facebookDelivery'] | undefined,
  organicChannels: item.organic_channels ?? [],
  organicChannelLinks: item.organic_channel_links ?? {},
  organicChannelNames: item.organic_channel_names ?? {},
  promoVideoUrl: item.promo_video_url ?? '',
  promoVideoCopy: item.promo_video_copy ?? '',
  promoVideoChannels: item.promo_video_channels ?? [],
  promoVideoChannelLinks: item.promo_video_channel_links ?? {},
  promoVideoChannelNames: item.promo_video_channel_names ?? {},
  promoVideoChannelCopies: item.promo_video_channel_copies ?? {},
  additionalVideos: item.additional_videos ?? [],
  shopeeUseAds: item.shopee_use_ads ?? false,
  shopeeAdsCpc: item.shopee_ads_cpc != null ? String(item.shopee_ads_cpc) : '',
  shopeeDailyBudget: item.shopee_daily_budget != null ? String(item.shopee_daily_budget) : '',
  shopeeSalesQuantity: item.shopee_sales_quantity != null ? String(item.shopee_sales_quantity) : '',
  shopeeTotalBudget: item.shopee_total_budget != null ? String(item.shopee_total_budget) : '',
  shopeeStartDate: formatDateToUtcMinus3(item.shopee_start_date ?? ''),
  shopeeEndDate: formatDateToUtcMinus3(item.shopee_end_date ?? ''),
  shopeeAdType: item.shopee_ad_type ?? '',
  shopeeBidType: item.shopee_bid_type ?? '',
  shopeeKeywords: item.shopee_keywords ?? [],
  shopeeMaxCpc: item.shopee_max_cpc != null ? String(item.shopee_max_cpc) : '',
  shopeeStoreCouponEnabled: item.shopee_store_coupon_enabled ?? false,
  shopeeStoreCouponValue: item.shopee_store_coupon_value != null ? String(item.shopee_store_coupon_value) : '',
  shopeeStoreCouponType: (item.shopee_store_coupon_type ?? undefined) as ProductItem['shopeeStoreCouponType'] | undefined,
  shopeeProductCouponEnabled: item.shopee_product_coupon_enabled ?? false,
  shopeeProductCouponValue: item.shopee_product_coupon_value != null ? String(item.shopee_product_coupon_value) : '',
  shopeeProductCouponType: (item.shopee_product_coupon_type ?? undefined) as ProductItem['shopeeProductCouponType'] | undefined,
  shopeeFollowerCouponEnabled: item.shopee_follower_coupon_enabled ?? false,
  shopeeFollowerCouponValue: item.shopee_follower_coupon_value != null ? String(item.shopee_follower_coupon_value) : '',
  shopeeFollowerCouponType: (item.shopee_follower_coupon_type ?? undefined) as ProductItem['shopeeFollowerCouponType'] | undefined,
  shopeeSellerVoucherEnabled: item.shopee_seller_voucher_enabled ?? false,
  shopeeSellerVoucherValue: item.shopee_seller_voucher_value != null ? String(item.shopee_seller_voucher_value) : '',
  shopeeSellerVoucherType: (item.shopee_seller_voucher_type ?? undefined) as ProductItem['shopeeSellerVoucherType'] | undefined,
  tiktokAdsEnabled: item.tiktok_ads_enabled ?? false,
  tiktokAdFormat: (item.tiktok_ad_format ?? undefined) as ProductItem['tiktokAdFormat'] | undefined,
  tiktokAudience: item.tiktok_audience ?? '',
  tiktokCampaignObjective: (item.tiktok_campaign_objective ?? undefined) as ProductItem['tiktokCampaignObjective'] | undefined,
  tiktokDailyBudget: item.tiktok_daily_budget != null ? String(item.tiktok_daily_budget) : '',
  tiktokCampaignId: item.tiktok_campaign_id ?? undefined,
  roiTarget: item.roi_target != null ? String(item.roi_target) : '',
  tiktokPromoProductValue: item.tiktok_promo_product_value != null ? String(item.tiktok_promo_product_value) : '',
  tiktokPromoProductType: (item.tiktok_promo_product_type ?? 'fixed') as 'fixed' | 'percent',
  tiktokPromoProductUntil: item.tiktok_promo_product_until ?? '',
  tiktokPromoNewCustomerValue: item.tiktok_promo_new_customer_value != null ? String(item.tiktok_promo_new_customer_value) : '',
  tiktokPromoNewCustomerType: (item.tiktok_promo_new_customer_type ?? 'fixed') as 'fixed' | 'percent',
  tiktokPromoShippingValue: item.tiktok_promo_shipping_value != null ? String(item.tiktok_promo_shipping_value) : '',
  tiktokPromoShippingType: (item.tiktok_promo_shipping_type ?? 'fixed') as 'fixed' | 'percent',
  tiktokCPA: item.tiktok_cpa != null ? String(item.tiktok_cpa) : '',
  tiktokAdsSalesQuantity: item.tiktok_ads_sales_quantity != null ? String(item.tiktok_ads_sales_quantity) : '',
  tiktokCPM: item.tiktok_cpm != null ? String(item.tiktok_cpm) : '',
  tiktokCTR: item.tiktok_ctr != null ? String(item.tiktok_ctr) : '',
  tiktokCVR: item.tiktok_cvr != null ? String(item.tiktok_cvr) : '',
  tiktokCatalogId: item.tiktok_catalog_id ?? '',
  tiktokSfpEnabled: item.tiktok_sfp_enabled ?? false,
  mercadoAdsEnabled: item.mercado_ads_enabled ?? false,
  mercadoAdsManagementMode: (item.mercado_ads_management_mode ?? undefined) as ProductItem['mercadoAdsManagementMode'] | undefined,
  mercadoAdsSolution: (item.mercado_ads_solution ?? undefined) as ProductItem['mercadoAdsSolution'] | undefined,
  mercadoAdsSelection: item.mercado_ads_selection ?? '',
  mercadoAdsDailyBudget: item.mercado_ads_daily_budget != null ? String(item.mercado_ads_daily_budget) : '',
  mercadoAdsAcosTarget: item.mercado_ads_acos_target != null ? String(item.mercado_ads_acos_target) : '',
  mercadoAdsSalesQuantity: item.mercado_ads_sales_quantity != null ? String(item.mercado_ads_sales_quantity) : '',
  mercadoAdsCpc: item.mercado_ads_cpc != null ? String(item.mercado_ads_cpc) : '',
  mercadoAdsConversionRate: item.mercado_ads_conversion_rate != null ? String(item.mercado_ads_conversion_rate) : '',
  campaignName: item.campaign_name ?? '',
  campaignObjective: item.campaign_objective ?? '',
  budgetType: item.budget_type ?? '',
  conversion: item.conversion ?? '',
  startDate: formatDateToUtcMinus3(item.start_date ?? ''),
  endDate: formatDateToUtcMinus3(item.end_date ?? ''),
  investmentValue: item.investment_value ?? '',
  audienceLocation: item.audience_location ?? '',
  audienceAge: item.audience_age ?? '',
  audienceGender: item.audience_gender ?? '',
  audienceInterests: item.audience_interests ?? '',
  audienceBehavior: item.audience_behavior ?? '',
  placement: item.placement ?? '',
  adText: item.ad_text ?? '',
  adTitle: item.ad_title ?? '',
  adMedia: item.ad_media ?? '',
  adCta: item.ad_cta ?? '',
  adUrl: item.ad_url ?? '',
  adRedirectUrl: item.ad_redirect_url ?? '',
  instagramAccount: item.instagram_account ?? '',
  instantForm: item.instant_form ?? false,
  influencers: item.influencers ?? [],
  affiliates: item.affiliates ?? [],
});

const mapBlingProductRow = (item: BlingProductRow): BlingProduct => ({
  id: item.id,
  blingId: item.bling_id ?? null,
  name: item.name ?? '',
  sku: item.sku ?? '',
  stockQuantity: item.stock_quantity ?? 0,
  imageUrl: item.image_url1 || '',
  costPrice: item.cost_price ?? 0,
  salePrice: item.sale_price ?? 0,
  createdAt: item.created_at ?? null,
  updatedAt: item.updated_at ?? null,
  categoryId: item.id_categoria ?? null,
  supplierId: item.id_fornecedor ?? null,
  description: item.descricao ?? null,
  variationName: null, // Removido: agora s� temos produtos pai
  supplierSku: item.sku_fornecedor ?? null,
  status: item.situacao ?? null
});

const legacyProductSelectColumns = [
  'id',
  'organization_id',
  'created_at',
  'updated_at',
  'name',
  'sku',
  'description',
  'price',
  'cost_price',
  'supplier_name',
  'account_holder',
  'account_type',
  'variations',
  'image_url',
  'color_hex',
  'net_revenue',
  'marketplace',
  'margin_status',
  'stock_quantity',
  'amazon_plan',
  'amazon_category',
  'ad_type',
  'ml_shipping_cost',
  'shipping_option',
  'marketplace_shipping_cost',
  'enjoei_ad_type',
  'enjoei_inactivity_months',
  'operation_mode',
  'gateway_method',
  'gateway_bank',
  'video_generation_llm',
].join(',');

const dimensionColumnList = ['peso', 'largura', 'altura', 'profundidade', 'unidade_medida'];
const mercadoAdsColumnList = [
  'mercado_ads_enabled',
  'mercado_ads_management_mode',
  'mercado_ads_solution',
  'mercado_ads_selection',
  'mercado_ads_daily_budget',
  'mercado_ads_acos_target',
  'mercado_ads_sales_quantity',
  'mercado_ads_cpc',
  'mercado_ads_conversion_rate'
];

const productSelectColumnList = [
  'id',
  'organization_id',
  'created_at',
  'updated_at',
  'name',
  'sku',
  'description',
  'price',
  'cost_price',
  'supplier_name',
  'supplier_id',
  'account_holder',
  'account_type',
  'variations',
  'image_url',
  'color_hex',
  'net_revenue',
  'marketplace',
  'marketplace_id',
  'margin_status',
  'stock_quantity',
  'amazon_plan',
  'amazon_category',
  'ml_category',
  'ad_type',
  'has_reputation',
  'reputation_level',
  'ml_shipping_cost',
  'shipping_option',
  'marketplace_shipping_cost',
  'enjoei_ad_type',
  'enjoei_inactivity_months',
  ...dimensionColumnList,
  'operation_mode',
  'gateway_method',
  'gateway_bank',
  'gateway_fee_value',
  'gateway_fee_type',
  'gateway_installments',
  'supplier_fee_type',
  'supplier_fee_value',
  'supplier_gateway_fee_type',
  'supplier_gateway_fee_value',
  'video_generation_llm',
  'is_new_product',
  'defective_product',
  'facebook_delivery',
  'organic_channels',
  'organic_channel_links',
  'organic_channel_names',
  'promo_video_url',
  'promo_video_copy',
  'promo_video_channels',
  'promo_video_channel_links',
  'promo_video_channel_names',
  'promo_video_channel_copies',
  'additional_videos',
  'shopee_use_ads',
  'shopee_ads_cpc',
  'shopee_daily_budget',
  'shopee_sales_quantity',
  'shopee_total_budget',
  'shopee_start_date',
  'shopee_end_date',
  'shopee_ad_type',
  'shopee_bid_type',
  'shopee_keywords',
  'shopee_max_cpc',
  'shopee_store_coupon_enabled',
  'shopee_store_coupon_value',
  'shopee_store_coupon_type',
  'shopee_product_coupon_enabled',
  'shopee_product_coupon_value',
  'shopee_product_coupon_type',
  'shopee_follower_coupon_enabled',
  'shopee_follower_coupon_value',
  'shopee_follower_coupon_type',
  'shopee_seller_voucher_enabled',
  'shopee_seller_voucher_value',
  'shopee_seller_voucher_type',
  'mercado_ads_enabled',
  'mercado_ads_management_mode',
  'mercado_ads_solution',
  'mercado_ads_selection',
  'mercado_ads_daily_budget',
  'mercado_ads_acos_target',
  'mercado_ads_sales_quantity',
  'mercado_ads_cpc',
  'mercado_ads_conversion_rate',
  'campaign_name',
  'campaign_objective',
  'budget_type',
  'conversion',
  'start_date',
  'end_date',
  'investment_value',
  'audience_location',
  'audience_age',
  'audience_gender',
  'audience_interests',
  'audience_behavior',
  'placement',
  'ad_text',
  'ad_title',
  'ad_media',
  'ad_cta',
  'ad_url',
  'ad_redirect_url',
  'instagram_account',
  'instant_form',
  'tiktok_ads_enabled',
  'tiktok_ad_format',
  'tiktok_audience',
  'tiktok_campaign_objective',
  'tiktok_daily_budget',
  'tiktok_campaign_id',
  'roi_target',
  'tiktok_promo_product_value',
  'tiktok_promo_product_type',
  'tiktok_promo_product_until',
  'tiktok_promo_new_customer_value',
  'tiktok_promo_new_customer_type',
  'tiktok_promo_shipping_value',
  'tiktok_promo_shipping_type',
  'tiktok_cpa',
  'tiktok_ads_sales_quantity',
  'tiktok_cpm',
  'tiktok_ctr',
  'tiktok_cvr',
  'tiktok_catalog_id',
  'influencers',
  'affiliates',
];

const productSelectColumns = productSelectColumnList.join(',');
const productSelectColumnsWithoutReputation = productSelectColumnList
  .filter((column) => column !== 'has_reputation' && column !== 'reputation_level')
  .join(',');
const productSelectColumnsWithoutDimensions = productSelectColumnList
  .filter((column) => !dimensionColumnList.includes(column))
  .join(',');
const productSelectColumnsWithoutReputationOrDimensions = productSelectColumnList
  .filter((column) => column !== 'has_reputation' && column !== 'reputation_level')
  .filter((column) => !dimensionColumnList.includes(column))
  .join(',');

let supportsReputationColumns: boolean | null = null;
let supportsDimensionColumns: boolean | null = readSupportCache(DIMENSION_SUPPORT_KEY);
let supportsMercadoAdsColumns: boolean | null = readSupportCache(MERCADO_ADS_SUPPORT_KEY);
let dimensionProbeAttempted = false;

const probeDimensionColumns = async (organizationId?: string) => {
  if (supportsDimensionColumns !== false || dimensionProbeAttempted) return;
  dimensionProbeAttempted = true;
  const base = supabase.from('products').select('id,peso').limit(1);
  const probe = organizationId ? await base.eq('organization_id', organizationId) : await base;
  if (!probe.error) {
    supportsDimensionColumns = true;
    writeSupportCache(DIMENSION_SUPPORT_KEY, true);
    return;
  }
  if (!isMissingColumnError(probe.error)) {
    throw probe.error;
  }
};

const stripReputationFields = (payload: ProductPayload): ProductPayload => {
  const rest = { ...payload };
  delete rest.has_reputation;
  delete rest.reputation_level;
  return rest;
};

/*
const stripMercadoAdsFields = (payload: ProductPayload): ProductPayload => {
  const rest = { ...payload };
  delete rest.mercado_ads_enabled;
  delete rest.mercado_ads_management_mode;
  delete rest.mercado_ads_solution;
  delete rest.mercado_ads_selection;
  delete rest.mercado_ads_daily_budget;
  delete rest.mercado_ads_acos_target;
  delete rest.mercado_ads_sales_quantity;
  delete rest.mercado_ads_cpc;
  delete rest.mercado_ads_conversion_rate;
  return rest;
};
*/

const stripLegacyFields = (payload: ProductPayload): ProductPayload => {
  const rest = { ...payload };
  delete rest.is_new_product;
  delete rest.defective_product;
  delete rest.facebook_delivery;
  delete rest.description;
  return rest;
};

const stripDimensionFields = (payload: ProductPayload): ProductPayload => {
  const rest = { ...payload };
  delete rest.peso;
  delete rest.largura;
  delete rest.altura;
  delete rest.profundidade;
  delete rest.unidade_medida;
  return rest;
};

export const ProductService = {
  async getAll(organizationId?: string): Promise<ProductItem[]> {
    await probeDimensionColumns(organizationId);
    const selectColumns = supportsReputationColumns === false && supportsDimensionColumns === false
      ? productSelectColumnsWithoutReputationOrDimensions
      : supportsReputationColumns === false
        ? productSelectColumnsWithoutReputation
        : supportsDimensionColumns === false
          ? productSelectColumnsWithoutDimensions
          : productSelectColumns;
    // Order by updated_at first (most recently updated products appear first)
    const base = supabase.from('products').select(selectColumns).order('updated_at', { ascending: false });
    const primary = organizationId ? base.eq('organization_id', organizationId) : base;
    const { data, error } = await primary;
    if (!error) {
      if (supportsReputationColumns === null && selectColumns === productSelectColumns) {
        supportsReputationColumns = true;
      }
      if (supportsDimensionColumns === null && selectColumns === productSelectColumns) {
        supportsDimensionColumns = true;
      }
      const mapped = ((data || []) as unknown as ProductRow[]).map(mapProductRow);
      const withReputation = supportsReputationColumns === false ? applyReputationCache(mapped) : mapped;
      const withMeliPlus = applyMeliPlusCache(withReputation);
      
      // Buscar contagem de vendas para cada produto
      const productIds = withMeliPlus.map(p => p.id);
      const productSkus = withMeliPlus.map(p => p.sku).filter((s): s is string => Boolean(s));
      const salesCountMap = new Map<string, number>();
      
      if (productIds.length > 0 || productSkus.length > 0) {
        // Query by product_id FK
        const salesByIdData = await batchInQuery<{ product_id: string; quantity: number }>(
          'bling_order_items', 'product_id', productIds, 'product_id, quantity'
        );
        salesByIdData.forEach((item: { product_id: string; quantity: number }) => {
            if (item.product_id) {
              const currentCount = salesCountMap.get(item.product_id) || 0;
              salesCountMap.set(item.product_id, currentCount + (item.quantity || 0));
            }
          });

        // Query by code/SKU field as fallback (only for products not found by FK)
        if (productSkus.length > 0) {
          const salesBySkuData = await batchInQuery<{ code: string; quantity: number; product_id: string | null }>(
            'bling_order_items', 'code', productSkus, 'code, quantity, product_id'
          );
          {
            // Map SKU back to product ID
            const skuToIdMap = new Map<string, string>();
            withMeliPlus.forEach((product) => {
              if (product.sku) {
                skuToIdMap.set(product.sku, product.id);
              }
            });

            salesBySkuData.forEach((item: { code: string; quantity: number; product_id: string | null }) => {
              if (item.code) {
                const productId = skuToIdMap.get(item.code);
                // Only count if not already counted by product_id
                if (productId && !item.product_id) {
                  const currentCount = salesCountMap.get(productId) || 0;
                  salesCountMap.set(productId, currentCount + (item.quantity || 0));
                }
              }
            });
          }
        }
      }
      
      // Adicionar contagem de vendas aos produtos
      const productsWithSales = withMeliPlus.map(product => ({
        ...product,
        shopeeSalesQuantity: salesCountMap.get(product.id) || 0
      }));
      
      // Enrich variations with images from products_bling
      return await enrichVariationsWithImages(productsWithSales);
    }
    if (!isMissingColumnError(error)) throw error;
    const fallbackConfigs = [
      supportsDimensionColumns !== false && selectColumns !== productSelectColumnsWithoutDimensions
        ? { columns: supportsReputationColumns === false ? productSelectColumnsWithoutReputationOrDimensions : productSelectColumnsWithoutDimensions, setDimensionUnsupported: true }
        : null,
      supportsReputationColumns !== false && selectColumns !== productSelectColumnsWithoutReputation
        ? { columns: supportsDimensionColumns === false ? productSelectColumnsWithoutReputationOrDimensions : productSelectColumnsWithoutReputation, setReputationUnsupported: true }
        : null,
      { columns: productSelectColumnsWithoutReputationOrDimensions, setReputationUnsupported: true, setDimensionUnsupported: true }
    ].filter(Boolean) as Array<{ columns: string; setReputationUnsupported?: boolean; setDimensionUnsupported?: boolean }>;

    for (const fallbackConfig of fallbackConfigs) {
      if (fallbackConfig.columns === selectColumns) continue;
      const fallbackBase = supabase
        .from('products')
        .select(fallbackConfig.columns)
        .order('updated_at', { ascending: false });
      const fallback = organizationId ? await fallbackBase.eq('organization_id', organizationId) : await fallbackBase;
      if (!fallback.error) {
        if (fallbackConfig.setReputationUnsupported) {
          supportsReputationColumns = false;
        }
        if (fallbackConfig.setDimensionUnsupported) {
        supportsDimensionColumns = false;
      }
      const mapped = ((fallback.data || []) as unknown as ProductRow[]).map(mapProductRow);
        const withReputation = supportsReputationColumns === false ? applyReputationCache(mapped) : mapped;
        const withMeliPlus = applyMeliPlusCache(withReputation);
        
        // Buscar contagem de vendas para cada produto (fallback)
        const productIds = withMeliPlus.map(p => p.id);
        const productSkus = withMeliPlus.map(p => p.sku).filter((s): s is string => Boolean(s));
        const salesCountMap = new Map<string, number>();
        
        if (productIds.length > 0 || productSkus.length > 0) {
          // Query by product_id FK
          const salesByIdData = await batchInQuery<{ product_id: string; quantity: number }>(
            'bling_order_items', 'product_id', productIds, 'product_id, quantity'
          );
          salesByIdData.forEach((item: { product_id: string; quantity: number }) => {
              if (item.product_id) {
                const currentCount = salesCountMap.get(item.product_id) || 0;
                salesCountMap.set(item.product_id, currentCount + (item.quantity || 0));
              }
            });

          // Query by code/SKU field as fallback (only for products not found by FK)
          if (productSkus.length > 0) {
            const salesBySkuData = await batchInQuery<{ code: string; quantity: number; product_id: string | null }>(
              'bling_order_items', 'code', productSkus, 'code, quantity, product_id'
            );
            {
              // Map SKU back to product ID
              const skuToIdMap = new Map<string, string>();
              withMeliPlus.forEach((product) => {
                if (product.sku) {
                  skuToIdMap.set(product.sku, product.id);
                }
              });

              salesBySkuData.forEach((item: { code: string; quantity: number; product_id: string | null }) => {
                if (item.code) {
                  const productId = skuToIdMap.get(item.code);
                  // Only count if not already counted by product_id
                  if (productId && !item.product_id) {
                    const currentCount = salesCountMap.get(productId) || 0;
                    salesCountMap.set(productId, currentCount + (item.quantity || 0));
                  }
                }
              });
            }
          }
        }
        
        const productsWithSales = withMeliPlus.map(product => ({
          ...product,
          shopeeSalesQuantity: salesCountMap.get(product.id) || 0
        }));
        
        // Enrich variations with images from products_bling
        return await enrichVariationsWithImages(productsWithSales);
      }
      if (!isMissingColumnError(fallback.error)) throw fallback.error;
    }

    const legacyBase = supabase
      .from('products')
      .select(legacyProductSelectColumns)
      .order('updated_at', { ascending: false });
    const legacy = organizationId ? await legacyBase.eq('organization_id', organizationId) : await legacyBase;
    if (legacy.error) throw legacy.error;
    supportsReputationColumns = false;
    supportsDimensionColumns = false;
    const mapped = ((legacy.data || []) as unknown as ProductRow[]).map(mapProductRow);
    const withMeliPlus = applyMeliPlusCache(applyReputationCache(mapped));
    
    // Buscar contagem de vendas para cada produto (legacy)
    const productIds = withMeliPlus.map(p => p.id);
    const productSkus = withMeliPlus.map(p => p.sku).filter((s): s is string => Boolean(s));
    const salesCountMap = new Map<string, number>();
    
    if (productIds.length > 0 || productSkus.length > 0) {
      // Query by product_id FK
      const salesByIdData = await batchInQuery<{ product_id: string; quantity: number }>(
        'bling_order_items', 'product_id', productIds, 'product_id, quantity'
      );
      salesByIdData.forEach((item: { product_id: string; quantity: number }) => {
          if (item.product_id) {
            const currentCount = salesCountMap.get(item.product_id) || 0;
            salesCountMap.set(item.product_id, currentCount + (item.quantity || 0));
          }
        });

      // Query by code/SKU field as fallback (only for products not found by FK)
      if (productSkus.length > 0) {
        const salesBySkuData = await batchInQuery<{ code: string; quantity: number; product_id: string | null }>(
          'bling_order_items', 'code', productSkus, 'code, quantity, product_id'
        );
        {
          // Map SKU back to product ID
          const skuToIdMap = new Map<string, string>();
          withMeliPlus.forEach((product) => {
            if (product.sku) {
              skuToIdMap.set(product.sku, product.id);
            }
          });

          salesBySkuData.forEach((item: { code: string; quantity: number; product_id: string | null }) => {
            if (item.code) {
              const productId = skuToIdMap.get(item.code);
              // Only count if not already counted by product_id
              if (productId && !item.product_id) {
                const currentCount = salesCountMap.get(productId) || 0;
                salesCountMap.set(productId, currentCount + (item.quantity || 0));
              }
            }
          });
        }
      }
    }
    
    const productsWithSales = withMeliPlus.map(product => ({
      ...product,
      shopeeSalesQuantity: salesCountMap.get(product.id) || 0
    }));
    
    // Enrich variations with images from products_bling
    return await enrichVariationsWithImages(productsWithSales);
  },

  async getBlingProducts(organizationId?: string): Promise<BlingProduct[]> {
    let query = supabase
      .from('products_bling')
      .select('id,bling_id,name,sku,stock_quantity,image_url,image_url1,cost_price,sale_price,created_at,updated_at,id_categoria,id_fornecedor,descricao,sku_fornecedor,situacao')
      .order('updated_at', { ascending: false });

    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return ((data || []) as unknown as BlingProductRow[]).map(mapBlingProductRow);
  },

  async create(product: Omit<ProductItem, 'id'>): Promise<ProductItem> {
    const _sgfv = (product.supplierGatewayFeeValue !== undefined && product.supplierGatewayFeeValue !== null && product.supplierGatewayFeeValue !== "") ? Number(product.supplierGatewayFeeValue) : 0;
    const insertPayload: ProductPayload = {
      organization_id: product.organizationId,
      name: product.name,
      sku: product.sku,
      description: product.description ?? null,
      price: product.sellingPrice,
      cost_price: product.costPrice,
      supplier_name: product.supplierName,
      account_holder: product.accountHolder,
      account_type: product.accountType,
      variations: product.variations,
      image_url: product.imageUrl,
      net_revenue: product.netRevenue,
      marketplace: product.marketplace,
      margin_status: product.marginStatus,
      color_hex: product.colorHex,
      stock_quantity: product.stockQuantity,
      amazon_plan: product.amazonPlan,
      amazon_category: product.amazonCategory,
      ml_category: product.mlCategory ?? null,
      ad_type: product.adType,
      has_reputation: product.hasReputation ?? false,
      reputation_level: product.hasReputation ? product.reputationLevel ?? null : null,
      ml_shipping_cost: product.mlShippingCost !== undefined && product.mlShippingCost !== null && product.mlShippingCost !== ''
        ? parseCurrency(product.mlShippingCost)
        : null,
      shipping_option: product.shippingOption,
      marketplace_shipping_cost: product.marketplaceShippingCost !== undefined && product.marketplaceShippingCost !== null && product.marketplaceShippingCost !== ''
        ? parseCurrency(product.marketplaceShippingCost)
        : null,
      enjoei_ad_type: product.enjoeiAdType,
      enjoei_inactivity_months: product.enjoeiInactivityMonths,
      peso: product.weight !== undefined && product.weight !== null && product.weight !== ''
        ? parseCurrency(product.weight)
        : null,
      largura: product.width !== undefined && product.width !== null && product.width !== ''
        ? parseCurrency(product.width)
        : null,
      altura: product.height !== undefined && product.height !== null && product.height !== ''
        ? parseCurrency(product.height)
        : null,
      profundidade: product.depth !== undefined && product.depth !== null && product.depth !== ''
        ? parseCurrency(product.depth)
        : null,
      unidade_medida: product.unitOfMeasure ?? null,
      operation_mode: product.operationMode,
      gateway_method: product.gatewayMethod,
      gateway_bank: product.gatewayBank,
      gateway_fee_value: (product.gatewayFeeValue !== undefined && product.gatewayFeeValue !== null && product.gatewayFeeValue !== "") ? Number(product.gatewayFeeValue) : null,
      gateway_fee_type: product.gatewayFeeType ?? null,
      gateway_installments: (product.gatewayInstallments !== undefined && product.gatewayInstallments !== null && product.gatewayInstallments !== "") ? Number(product.gatewayInstallments) : null,
      supplier_fee_type: product.supplierFeeType ?? null,
      supplier_fee_value: (product.supplierFeeValue !== undefined && product.supplierFeeValue !== null && product.supplierFeeValue !== "") ? Number(product.supplierFeeValue) : null,
      supplier_gateway_fee_type: product.supplierGatewayFeeType ?? null,
      supplier_gateway_fee_value: (product.supplierGatewayFeeValue !== undefined && product.supplierGatewayFeeValue !== null && product.supplierGatewayFeeValue !== "") ? Number(product.supplierGatewayFeeValue) : null,
      supplier_gateway_fee_percent: product.supplierGatewayFeeType === 'percent' ? _sgfv : 0,
      supplier_gateway_fee_fixed: product.supplierGatewayFeeType === 'fixed' ? _sgfv : 0,
      video_generation_llm: product.videoGenerationLlm,
      organic_channels: product.organicChannels ?? null,
      organic_channel_links: product.organicChannelLinks ?? null,
      organic_channel_names: product.organicChannelNames ?? null,
      promo_video_url: product.promoVideoUrl ?? null,
      promo_video_copy: product.promoVideoCopy ?? null,
      promo_video_channels: product.promoVideoChannels ?? null,
      promo_video_channel_links: product.promoVideoChannelLinks ?? null,
      promo_video_channel_names: product.promoVideoChannelNames ?? null,
      promo_video_channel_copies: product.promoVideoChannelCopies ?? null,
      additional_videos: product.additionalVideos ?? null,
      shopee_use_ads: product.shopeeUseAds ?? null,
      shopee_ads_cpc: product.shopeeAdsCpc !== undefined && product.shopeeAdsCpc !== null && product.shopeeAdsCpc !== ''
        ? parseCurrency(product.shopeeAdsCpc)
        : null,
      shopee_daily_budget: product.shopeeDailyBudget !== undefined && product.shopeeDailyBudget !== null && product.shopeeDailyBudget !== ''
        ? parseCurrency(product.shopeeDailyBudget)
        : null,
      shopee_sales_quantity: product.shopeeSalesQuantity !== undefined && product.shopeeSalesQuantity !== null && product.shopeeSalesQuantity !== ''
        ? Number(product.shopeeSalesQuantity)
        : null,
      shopee_total_budget: product.shopeeTotalBudget !== undefined && product.shopeeTotalBudget !== null && product.shopeeTotalBudget !== ''
        ? parseCurrency(product.shopeeTotalBudget)
        : null,
      shopee_start_date: product.shopeeStartDate ? product.shopeeStartDate : null,
      shopee_end_date: product.shopeeEndDate ? product.shopeeEndDate : null,
      shopee_ad_type: product.shopeeAdType ?? null,
      shopee_bid_type: product.shopeeBidType ?? null,
      shopee_keywords: product.shopeeKeywords ?? null,
      shopee_max_cpc: product.shopeeMaxCpc !== undefined && product.shopeeMaxCpc !== null && product.shopeeMaxCpc !== ''
        ? parseCurrency(product.shopeeMaxCpc)
        : null,
      shopee_store_coupon_enabled: product.shopeeStoreCouponEnabled ?? null,
      shopee_store_coupon_value: product.shopeeStoreCouponValue !== undefined && product.shopeeStoreCouponValue !== null && product.shopeeStoreCouponValue !== ''
        ? parseCurrency(product.shopeeStoreCouponValue)
        : null,
      shopee_store_coupon_type: product.shopeeStoreCouponType ?? null,
      shopee_product_coupon_enabled: product.shopeeProductCouponEnabled ?? null,
      shopee_product_coupon_value: product.shopeeProductCouponValue !== undefined && product.shopeeProductCouponValue !== null && product.shopeeProductCouponValue !== ''
        ? parseCurrency(product.shopeeProductCouponValue)
        : null,
      shopee_product_coupon_type: product.shopeeProductCouponType ?? null,
      shopee_follower_coupon_enabled: product.shopeeFollowerCouponEnabled ?? null,
      shopee_follower_coupon_value: product.shopeeFollowerCouponValue !== undefined && product.shopeeFollowerCouponValue !== null && product.shopeeFollowerCouponValue !== ''
        ? parseCurrency(product.shopeeFollowerCouponValue)
        : null,
      shopee_follower_coupon_type: product.shopeeFollowerCouponType ?? null,
      shopee_seller_voucher_enabled: product.shopeeSellerVoucherEnabled ?? null,
      shopee_seller_voucher_value: product.shopeeSellerVoucherValue !== undefined && product.shopeeSellerVoucherValue !== null && product.shopeeSellerVoucherValue !== ''
        ? parseCurrency(product.shopeeSellerVoucherValue)
        : null,
      shopee_seller_voucher_type: product.shopeeSellerVoucherType ?? null,
      tiktok_ads_enabled: product.tiktokAdsEnabled ?? null,
      tiktok_ad_format: product.tiktokAdFormat ?? null,
      tiktok_audience: product.tiktokAudience ?? null,
      tiktok_campaign_objective: product.tiktokCampaignObjective ?? null,
      tiktok_daily_budget: product.tiktokDailyBudget !== undefined && product.tiktokDailyBudget !== null && product.tiktokDailyBudget !== ''
        ? parseCurrency(product.tiktokDailyBudget)
        : null,
      tiktok_campaign_id: (product as {tiktokCampaignId?: string}).tiktokCampaignId || null,
      roi_target: (product as {roiTarget?: string}).roiTarget ? parseFloat(String((product as {roiTarget?: string}).roiTarget).replace(',', '.')) || null : null,
      tiktok_promo_product_value: (product as {tiktokPromoProductValue?: string}).tiktokPromoProductValue ? parseFloat(String((product as {tiktokPromoProductValue?: string}).tiktokPromoProductValue).replace(',', '.')) || null : null,
      tiktok_promo_product_type: (product as {tiktokPromoProductType?: string}).tiktokPromoProductType || null,
      tiktok_promo_product_until: (product as {tiktokPromoProductUntil?: string}).tiktokPromoProductUntil || null,
      tiktok_promo_new_customer_value: (product as {tiktokPromoNewCustomerValue?: string}).tiktokPromoNewCustomerValue ? parseFloat(String((product as {tiktokPromoNewCustomerValue?: string}).tiktokPromoNewCustomerValue).replace(',', '.')) || null : null,
      tiktok_promo_new_customer_type: (product as {tiktokPromoNewCustomerType?: string}).tiktokPromoNewCustomerType || null,
      tiktok_promo_shipping_value: (product as {tiktokPromoShippingValue?: string}).tiktokPromoShippingValue ? parseFloat(String((product as {tiktokPromoShippingValue?: string}).tiktokPromoShippingValue).replace(',', '.')) || null : null,
      tiktok_promo_shipping_type: (product as {tiktokPromoShippingType?: string}).tiktokPromoShippingType || null,
      tiktok_cpa: product.tiktokCPA !== undefined && product.tiktokCPA !== null && product.tiktokCPA !== ''
        ? parseCurrency(product.tiktokCPA)
        : null,
      tiktok_ads_sales_quantity: product.tiktokAdsSalesQuantity !== undefined && product.tiktokAdsSalesQuantity !== null && product.tiktokAdsSalesQuantity !== ''
        ? Number(product.tiktokAdsSalesQuantity)
        : null,
      tiktok_cpm: product.tiktokCPM !== undefined && product.tiktokCPM !== null && product.tiktokCPM !== ''
        ? parseCurrency(product.tiktokCPM)
        : null,
      tiktok_ctr: product.tiktokCTR !== undefined && product.tiktokCTR !== null && product.tiktokCTR !== ''
        ? parseCurrency(product.tiktokCTR)
        : null,
      tiktok_cvr: product.tiktokCVR !== undefined && product.tiktokCVR !== null && product.tiktokCVR !== ''
        ? parseCurrency(product.tiktokCVR)
        : null,
      tiktok_catalog_id: product.tiktokCatalogId ?? null,
      tiktok_sfp_enabled: product.tiktokSfpEnabled ?? null,
      mercado_ads_enabled: product.mercadoAdsEnabled ?? null,
      mercado_ads_management_mode: product.mercadoAdsManagementMode ?? null,
      mercado_ads_solution: product.mercadoAdsSolution ?? null,
      mercado_ads_selection: product.mercadoAdsSelection ?? null,
      mercado_ads_daily_budget: product.mercadoAdsDailyBudget !== undefined && product.mercadoAdsDailyBudget !== null && product.mercadoAdsDailyBudget !== ''
        ? parseCurrency(product.mercadoAdsDailyBudget)
        : null,
      mercado_ads_acos_target: product.mercadoAdsAcosTarget !== undefined && product.mercadoAdsAcosTarget !== null && product.mercadoAdsAcosTarget !== ''
        ? parseCurrency(product.mercadoAdsAcosTarget)
        : null,
      mercado_ads_sales_quantity: product.mercadoAdsSalesQuantity !== undefined && product.mercadoAdsSalesQuantity !== null && product.mercadoAdsSalesQuantity !== ''
        ? Number(product.mercadoAdsSalesQuantity)
        : null,
      mercado_ads_cpc: product.mercadoAdsCpc !== undefined && product.mercadoAdsCpc !== null && product.mercadoAdsCpc !== ''
        ? parseCurrency(product.mercadoAdsCpc)
        : null,
      mercado_ads_conversion_rate: product.mercadoAdsConversionRate !== undefined && product.mercadoAdsConversionRate !== null && product.mercadoAdsConversionRate !== ''
        ? parseCurrency(product.mercadoAdsConversionRate)
        : null,
      campaign_name: product.campaignName,
      campaign_objective: product.campaignObjective,
      budget_type: product.budgetType,
      conversion: product.conversion,
      start_date: product.startDate ? product.startDate : null,
      end_date: product.endDate ? product.endDate : null,
      investment_value: product.investmentValue !== undefined && product.investmentValue !== null && product.investmentValue !== ''
        ? parseCurrency(product.investmentValue)
        : null,
      audience_location: product.audienceLocation,
      audience_age: product.audienceAge,
      audience_gender: product.audienceGender,
      audience_interests: product.audienceInterests,
      audience_behavior: product.audienceBehavior,
      placement: product.placement,
      ad_text: product.adText,
      ad_title: product.adTitle,
      ad_media: product.adMedia,
      ad_cta: product.adCta,
      ad_url: product.adUrl,
      ad_redirect_url: product.adRedirectUrl,
      instagram_account: product.instagramAccount,
      instant_form: product.instantForm ?? false,
      influencers: product.influencers ?? null,
      affiliates: product.affiliates ?? null,
    };
    let initialPayload = { ...insertPayload };
    if (supportsReputationColumns === false) initialPayload = stripReputationFields(initialPayload);
    if (supportsDimensionColumns === false) initialPayload = stripDimensionFields(initialPayload);
    // Force try Mercado Ads fields initially to allow schema updates to take effect without clearing cache manually
    // if (supportsMercadoAdsColumns === false) initialPayload = stripMercadoAdsFields(initialPayload);
    
    if (supportsReputationColumns === false || supportsDimensionColumns === false) {
      initialPayload = stripLegacyFields(initialPayload);
    }

    let initialSelectColumnsList = productSelectColumnList;
    if (supportsReputationColumns === false) initialSelectColumnsList = initialSelectColumnsList.filter(c => !['has_reputation', 'reputation_level'].includes(c));
    if (supportsDimensionColumns === false) initialSelectColumnsList = initialSelectColumnsList.filter(c => !dimensionColumnList.includes(c));
    // if (supportsMercadoAdsColumns === false) initialSelectColumnsList = initialSelectColumnsList.filter(c => !mercadoAdsColumnList.includes(c));
    const initialSelectColumns = initialSelectColumnsList.join(',');

    const executor = async (payload: ProductPayload, columns: string) => await supabase
      .from('products')
      .insert(payload)
      .select(columns)
      .single();
    const { data, removedColumns, columns: usedColumns } = await applyMissingColumnFallback(
      executor,
      initialPayload,
      initialSelectColumns
    );
    if (removedColumns.some((column) => dimensionColumnList.includes(column))) {
      supportsDimensionColumns = false;
      writeSupportCache(DIMENSION_SUPPORT_KEY, false);
    }
    if (removedColumns.some((column) => mercadoAdsColumnList.includes(column))) {
      supportsMercadoAdsColumns = false;
      writeSupportCache(MERCADO_ADS_SUPPORT_KEY, false);
    }
    if (removedColumns.includes('has_reputation') || removedColumns.includes('reputation_level')) {
      supportsReputationColumns = false;
    }
    if (supportsReputationColumns === null && usedColumns === initialSelectColumns && !removedColumns.includes('has_reputation') && !removedColumns.includes('reputation_level')) {
      supportsReputationColumns = true;
    }
    if (supportsDimensionColumns === null && usedColumns === initialSelectColumns && !removedColumns.some((column) => dimensionColumnList.includes(column))) {
      supportsDimensionColumns = true;
      writeSupportCache(DIMENSION_SUPPORT_KEY, true);
    }
    if (supportsMercadoAdsColumns !== true && usedColumns === initialSelectColumns && !removedColumns.some((column) => mercadoAdsColumnList.includes(column))) {
      supportsMercadoAdsColumns = true;
      writeSupportCache(MERCADO_ADS_SUPPORT_KEY, true);
    }
    const mapped = mapProductRow(data as unknown as ProductRow);
    if (supportsReputationColumns === false) {
      setReputationCacheForProduct(mapped.id, product.hasReputation ?? false, product.reputationLevel);
      setMeliPlusCacheForProduct(mapped.id, product.meliPlus ?? false);
      return {
        ...mapped,
        hasReputation: product.hasReputation ?? false,
        reputationLevel: product.reputationLevel,
        meliPlus: product.meliPlus ?? false
      };
    }
    setMeliPlusCacheForProduct(mapped.id, product.meliPlus ?? false);
    return {
      ...mapped,
      meliPlus: product.meliPlus ?? false
    };
  },

  async update(product: ProductItem): Promise<ProductItem> {
    const _sgfv = (product.supplierGatewayFeeValue !== undefined && product.supplierGatewayFeeValue !== null && product.supplierGatewayFeeValue !== "") ? Number(product.supplierGatewayFeeValue) : 0;
    const updatePayload: ProductPayload = {
      name: product.name,
      sku: product.sku,
      price: product.sellingPrice,
      cost_price: product.costPrice,
      supplier_name: product.supplierName,
      account_holder: product.accountHolder,
      account_type: product.accountType,
      variations: product.variations,
      image_url: product.imageUrl,
      net_revenue: product.netRevenue,
      marketplace: product.marketplace,
      margin_status: product.marginStatus,
      color_hex: product.colorHex,
      stock_quantity: product.stockQuantity,
      amazon_plan: product.amazonPlan,
      amazon_category: product.amazonCategory,
      ml_category: product.mlCategory ?? null,
      ad_type: product.adType,
      has_reputation: product.hasReputation ?? false,
      reputation_level: product.hasReputation ? product.reputationLevel ?? null : null,
      ml_shipping_cost: product.mlShippingCost !== undefined && product.mlShippingCost !== null && product.mlShippingCost !== ''
        ? parseCurrency(product.mlShippingCost)
        : null,
      shipping_option: product.shippingOption,
      marketplace_shipping_cost: product.marketplaceShippingCost !== undefined && product.marketplaceShippingCost !== null && product.marketplaceShippingCost !== ''
        ? parseCurrency(product.marketplaceShippingCost)
        : null,
      enjoei_ad_type: product.enjoeiAdType,
      enjoei_inactivity_months: product.enjoeiInactivityMonths,
      peso: product.weight !== undefined && product.weight !== null && product.weight !== ''
        ? parseCurrency(product.weight)
        : null,
      largura: product.width !== undefined && product.width !== null && product.width !== ''
        ? parseCurrency(product.width)
        : null,
      altura: product.height !== undefined && product.height !== null && product.height !== ''
        ? parseCurrency(product.height)
        : null,
      profundidade: product.depth !== undefined && product.depth !== null && product.depth !== ''
        ? parseCurrency(product.depth)
        : null,
      unidade_medida: product.unitOfMeasure ?? null,
      operation_mode: product.operationMode,
      gateway_method: product.gatewayMethod,
      gateway_bank: product.gatewayBank,
      gateway_fee_value: (product.gatewayFeeValue !== undefined && product.gatewayFeeValue !== null && product.gatewayFeeValue !== "") ? Number(product.gatewayFeeValue) : null,
      gateway_fee_type: product.gatewayFeeType ?? null,
      gateway_installments: (product.gatewayInstallments !== undefined && product.gatewayInstallments !== null && product.gatewayInstallments !== "") ? Number(product.gatewayInstallments) : null,
      supplier_fee_type: product.supplierFeeType ?? null,
      supplier_fee_value: (product.supplierFeeValue !== undefined && product.supplierFeeValue !== null && product.supplierFeeValue !== "") ? Number(product.supplierFeeValue) : null,
      supplier_gateway_fee_type: product.supplierGatewayFeeType ?? null,
      supplier_gateway_fee_value: (product.supplierGatewayFeeValue !== undefined && product.supplierGatewayFeeValue !== null && product.supplierGatewayFeeValue !== "") ? Number(product.supplierGatewayFeeValue) : null,
      supplier_gateway_fee_percent: product.supplierGatewayFeeType === 'percent' ? _sgfv : 0,
      supplier_gateway_fee_fixed: product.supplierGatewayFeeType === 'fixed' ? _sgfv : 0,
      video_generation_llm: product.videoGenerationLlm,
      organic_channels: product.organicChannels ?? null,
      organic_channel_links: product.organicChannelLinks ?? null,
      organic_channel_names: product.organicChannelNames ?? null,
      promo_video_url: product.promoVideoUrl ?? null,
      promo_video_copy: product.promoVideoCopy ?? null,
      promo_video_channels: product.promoVideoChannels ?? null,
      promo_video_channel_links: product.promoVideoChannelLinks ?? null,
      promo_video_channel_names: product.promoVideoChannelNames ?? null,
      promo_video_channel_copies: product.promoVideoChannelCopies ?? null,
      additional_videos: product.additionalVideos ?? null,
      shopee_use_ads: product.shopeeUseAds ?? null,
      shopee_ads_cpc: product.shopeeAdsCpc !== undefined && product.shopeeAdsCpc !== null && product.shopeeAdsCpc !== ''
        ? parseCurrency(product.shopeeAdsCpc)
        : null,
      shopee_daily_budget: product.shopeeDailyBudget !== undefined && product.shopeeDailyBudget !== null && product.shopeeDailyBudget !== ''
        ? parseCurrency(product.shopeeDailyBudget)
        : null,
      shopee_sales_quantity: product.shopeeSalesQuantity !== undefined && product.shopeeSalesQuantity !== null && product.shopeeSalesQuantity !== ''
        ? Number(product.shopeeSalesQuantity)
        : null,
      shopee_total_budget: product.shopeeTotalBudget !== undefined && product.shopeeTotalBudget !== null && product.shopeeTotalBudget !== ''
        ? parseCurrency(product.shopeeTotalBudget)
        : null,
      shopee_start_date: product.shopeeStartDate ? product.shopeeStartDate : null,
      shopee_end_date: product.shopeeEndDate ? product.shopeeEndDate : null,
      shopee_ad_type: product.shopeeAdType ?? null,
      shopee_bid_type: product.shopeeBidType ?? null,
      shopee_keywords: product.shopeeKeywords ?? null,
      shopee_max_cpc: product.shopeeMaxCpc !== undefined && product.shopeeMaxCpc !== null && product.shopeeMaxCpc !== ''
        ? parseCurrency(product.shopeeMaxCpc)
        : null,
      shopee_store_coupon_enabled: product.shopeeStoreCouponEnabled ?? null,
      shopee_store_coupon_value: product.shopeeStoreCouponValue !== undefined && product.shopeeStoreCouponValue !== null && product.shopeeStoreCouponValue !== ''
        ? parseCurrency(product.shopeeStoreCouponValue)
        : null,
      shopee_store_coupon_type: product.shopeeStoreCouponType ?? null,
      shopee_product_coupon_enabled: product.shopeeProductCouponEnabled ?? null,
      shopee_product_coupon_value: product.shopeeProductCouponValue !== undefined && product.shopeeProductCouponValue !== null && product.shopeeProductCouponValue !== ''
        ? parseCurrency(product.shopeeProductCouponValue)
        : null,
      shopee_product_coupon_type: product.shopeeProductCouponType ?? null,
      shopee_follower_coupon_enabled: product.shopeeFollowerCouponEnabled ?? null,
      shopee_follower_coupon_value: product.shopeeFollowerCouponValue !== undefined && product.shopeeFollowerCouponValue !== null && product.shopeeFollowerCouponValue !== ''
        ? parseCurrency(product.shopeeFollowerCouponValue)
        : null,
      shopee_follower_coupon_type: product.shopeeFollowerCouponType ?? null,
      shopee_seller_voucher_enabled: product.shopeeSellerVoucherEnabled ?? null,
      shopee_seller_voucher_value: product.shopeeSellerVoucherValue !== undefined && product.shopeeSellerVoucherValue !== null && product.shopeeSellerVoucherValue !== ''
        ? parseCurrency(product.shopeeSellerVoucherValue)
        : null,
      shopee_seller_voucher_type: product.shopeeSellerVoucherType ?? null,
      tiktok_ads_enabled: product.tiktokAdsEnabled ?? null,
      tiktok_ad_format: product.tiktokAdFormat ?? null,
      tiktok_audience: product.tiktokAudience ?? null,
      tiktok_campaign_objective: product.tiktokCampaignObjective ?? null,
      tiktok_daily_budget: product.tiktokDailyBudget !== undefined && product.tiktokDailyBudget !== null && product.tiktokDailyBudget !== ''
        ? parseCurrency(product.tiktokDailyBudget)
        : null,
      tiktok_campaign_id: (product as {tiktokCampaignId?: string}).tiktokCampaignId || null,
      roi_target: (product as {roiTarget?: string}).roiTarget ? parseFloat(String((product as {roiTarget?: string}).roiTarget).replace(',', '.')) || null : null,
      tiktok_promo_product_value: (product as {tiktokPromoProductValue?: string}).tiktokPromoProductValue ? parseFloat(String((product as {tiktokPromoProductValue?: string}).tiktokPromoProductValue).replace(',', '.')) || null : null,
      tiktok_promo_product_type: (product as {tiktokPromoProductType?: string}).tiktokPromoProductType || null,
      tiktok_promo_product_until: (product as {tiktokPromoProductUntil?: string}).tiktokPromoProductUntil || null,
      tiktok_promo_new_customer_value: (product as {tiktokPromoNewCustomerValue?: string}).tiktokPromoNewCustomerValue ? parseFloat(String((product as {tiktokPromoNewCustomerValue?: string}).tiktokPromoNewCustomerValue).replace(',', '.')) || null : null,
      tiktok_promo_new_customer_type: (product as {tiktokPromoNewCustomerType?: string}).tiktokPromoNewCustomerType || null,
      tiktok_promo_shipping_value: (product as {tiktokPromoShippingValue?: string}).tiktokPromoShippingValue ? parseFloat(String((product as {tiktokPromoShippingValue?: string}).tiktokPromoShippingValue).replace(',', '.')) || null : null,
      tiktok_promo_shipping_type: (product as {tiktokPromoShippingType?: string}).tiktokPromoShippingType || null,
      tiktok_cpa: product.tiktokCPA !== undefined && product.tiktokCPA !== null && product.tiktokCPA !== ''
        ? parseCurrency(product.tiktokCPA)
        : null,
      tiktok_ads_sales_quantity: product.tiktokAdsSalesQuantity !== undefined && product.tiktokAdsSalesQuantity !== null && product.tiktokAdsSalesQuantity !== ''
        ? Number(product.tiktokAdsSalesQuantity)
        : null,
      tiktok_cpm: product.tiktokCPM !== undefined && product.tiktokCPM !== null && product.tiktokCPM !== ''
        ? parseCurrency(product.tiktokCPM)
        : null,
      tiktok_ctr: product.tiktokCTR !== undefined && product.tiktokCTR !== null && product.tiktokCTR !== ''
        ? parseCurrency(product.tiktokCTR)
        : null,
      tiktok_cvr: product.tiktokCVR !== undefined && product.tiktokCVR !== null && product.tiktokCVR !== ''
        ? parseCurrency(product.tiktokCVR)
        : null,
      tiktok_catalog_id: product.tiktokCatalogId ?? null,
      tiktok_sfp_enabled: product.tiktokSfpEnabled ?? null,
      mercado_ads_enabled: product.mercadoAdsEnabled ?? null,
      mercado_ads_management_mode: product.mercadoAdsManagementMode ?? null,
      mercado_ads_solution: product.mercadoAdsSolution ?? null,
      mercado_ads_selection: product.mercadoAdsSelection ?? null,
      mercado_ads_daily_budget: product.mercadoAdsDailyBudget !== undefined && product.mercadoAdsDailyBudget !== null && product.mercadoAdsDailyBudget !== ''
        ? parseCurrency(product.mercadoAdsDailyBudget)
        : null,
      mercado_ads_acos_target: product.mercadoAdsAcosTarget !== undefined && product.mercadoAdsAcosTarget !== null && product.mercadoAdsAcosTarget !== ''
        ? parseCurrency(product.mercadoAdsAcosTarget)
        : null,
      mercado_ads_sales_quantity: product.mercadoAdsSalesQuantity !== undefined && product.mercadoAdsSalesQuantity !== null && product.mercadoAdsSalesQuantity !== ''
        ? Number(product.mercadoAdsSalesQuantity)
        : null,
      mercado_ads_cpc: product.mercadoAdsCpc !== undefined && product.mercadoAdsCpc !== null && product.mercadoAdsCpc !== ''
        ? parseCurrency(product.mercadoAdsCpc)
        : null,
      mercado_ads_conversion_rate: product.mercadoAdsConversionRate !== undefined && product.mercadoAdsConversionRate !== null && product.mercadoAdsConversionRate !== ''
        ? parseCurrency(product.mercadoAdsConversionRate)
        : null,
      campaign_name: product.campaignName,
      campaign_objective: product.campaignObjective,
      budget_type: product.budgetType,
      conversion: product.conversion,
      start_date: product.startDate ? product.startDate : null,
      end_date: product.endDate ? product.endDate : null,
      investment_value: product.investmentValue !== undefined && product.investmentValue !== null && product.investmentValue !== ''
        ? parseCurrency(product.investmentValue)
        : null,
      audience_location: product.audienceLocation,
      audience_age: product.audienceAge,
      audience_gender: product.audienceGender,
      audience_interests: product.audienceInterests,
      audience_behavior: product.audienceBehavior,
      placement: product.placement,
      ad_text: product.adText,
      ad_title: product.adTitle,
      ad_media: product.adMedia,
      ad_cta: product.adCta,
      ad_url: product.adUrl,
      ad_redirect_url: product.adRedirectUrl,
      instagram_account: product.instagramAccount,
      instant_form: product.instantForm ?? false,
      influencers: product.influencers ?? null,
      affiliates: product.affiliates ?? null,
    };
    let initialPayload = { ...updatePayload };
    if (supportsReputationColumns === false) initialPayload = stripReputationFields(initialPayload);
    if (supportsDimensionColumns === false) initialPayload = stripDimensionFields(initialPayload);
    // Force try Mercado Ads fields initially to allow schema updates to take effect without clearing cache manually
    // if (supportsMercadoAdsColumns === false) initialPayload = stripMercadoAdsFields(initialPayload);
    if (supportsReputationColumns === false || supportsDimensionColumns === false || supportsMercadoAdsColumns === false) {
      initialPayload = stripLegacyFields(initialPayload);
    }

    let initialSelectColumnsList = productSelectColumnList;
    if (supportsReputationColumns === false) initialSelectColumnsList = initialSelectColumnsList.filter(c => !['has_reputation', 'reputation_level'].includes(c));
    if (supportsDimensionColumns === false) initialSelectColumnsList = initialSelectColumnsList.filter(c => !dimensionColumnList.includes(c));
    // if (supportsMercadoAdsColumns === false) initialSelectColumnsList = initialSelectColumnsList.filter(c => !mercadoAdsColumnList.includes(c));
    const initialSelectColumns = initialSelectColumnsList.join(',');

    const executor = async (payload: ProductPayload, columns: string) => await supabase
      .from('products')
      .update(payload)
      .eq('id', product.id)
      .select(columns)
      .single();
    
    console.log('[ProductService] Update Payload:', JSON.stringify(initialPayload));

    const { data, removedColumns, columns: usedColumns } = await applyMissingColumnFallback(
      executor,
      initialPayload,
      initialSelectColumns
    );
    if (removedColumns.some((column) => dimensionColumnList.includes(column))) {
      supportsDimensionColumns = false;
      writeSupportCache(DIMENSION_SUPPORT_KEY, false);
    }
    if (removedColumns.some((column) => mercadoAdsColumnList.includes(column))) {
      supportsMercadoAdsColumns = false;
      writeSupportCache(MERCADO_ADS_SUPPORT_KEY, false);
    }
    if (removedColumns.includes('has_reputation') || removedColumns.includes('reputation_level')) {
      supportsReputationColumns = false;
    }
    if (supportsReputationColumns === null && usedColumns === initialSelectColumns && !removedColumns.includes('has_reputation') && !removedColumns.includes('reputation_level')) {
      supportsReputationColumns = true;
    }
    if (supportsDimensionColumns === null && usedColumns === initialSelectColumns && !removedColumns.some((column) => dimensionColumnList.includes(column))) {
      supportsDimensionColumns = true;
      writeSupportCache(DIMENSION_SUPPORT_KEY, true);
    }
    if (supportsMercadoAdsColumns !== true && usedColumns === initialSelectColumns && !removedColumns.some((column) => mercadoAdsColumnList.includes(column))) {
      supportsMercadoAdsColumns = true;
      writeSupportCache(MERCADO_ADS_SUPPORT_KEY, true);
    }
    const mapped = mapProductRow(data as unknown as ProductRow);
    if (supportsReputationColumns === false) {
      setReputationCacheForProduct(mapped.id, product.hasReputation ?? false, product.reputationLevel);
      setMeliPlusCacheForProduct(mapped.id, product.meliPlus ?? false);
      return {
        ...mapped,
        hasReputation: product.hasReputation ?? false,
        reputationLevel: product.reputationLevel,
        meliPlus: product.meliPlus ?? false
      };
    }
    setMeliPlusCacheForProduct(mapped.id, product.meliPlus ?? false);
    return {
      ...mapped,
      meliPlus: product.meliPlus ?? false
    };
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};
