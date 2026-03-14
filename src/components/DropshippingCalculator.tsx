'use client';
import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import type { MouseEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Calculator, TrendingUp, Package, DollarSign, AlertCircle, Plus, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Checkbox } from "./ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import logo from '../imgs/Logonome-alobexpress.png';
import videoBackground from '../video/dollar-animate-real.mp4?url';
import wooCommerceLogo from '../imgs/free-woocommerce-icon-svg-download-png-226060.webp';
import shopeeLogo from '../imgs/18790-256x256x32.png';
import amazonLogo from '../imgs/amazon.jpg';
import sheinLogo from '../imgs/shein.svg';
import enjoeiLogo from '../imgs/enjoei.svg';
import tiktokLogo from '../imgs/tiktok-shop-seller-cent-icon-filled-256.png';
import mercadoLivreLogo from '../imgs/mercadolivre.svg';
import olxLogo from '../imgs/olx.png';
import { CollapsibleSection } from './ui/CollapsibleSection';
import { GradientButton } from './ui/GradientButton';
import { TrafficConfig } from './calculator/TrafficConfig';
import { GatewayConfig } from './calculator/GatewayConfig';
import { ResultsPanel } from './calculator/ResultsPanel';
import { ShopeeConfig } from './calculator/ShopeeConfig';
import { MercadoLivreConfig } from './calculator/MercadoLivreConfig';
import { TikTokConfig } from './calculator/TikTokConfig';
import { EnjoeiConfig } from './calculator/EnjoeiConfig';
import { AmazonConfig } from './calculator/AmazonConfig';
import { MarketplaceConfig } from './calculator/MarketplaceConfig';
import { ProductInfo } from './calculator/ProductInfo';
import { ProductCard } from './calculator/ProductCard';
import { ProductsLoaded } from './ProductsLoaded';
import { EditProductDialog } from './calculator/EditProductDialog';
import { useDropshippingCalculator } from '../hooks/useDropshippingCalculator';
import { ProfitProjection } from './calculator/ProfitProjection';
import { ProductService } from '../services/productService';
import type { BlingProductItem } from '@/hooks/useProductsBling';
import { ReferenceService, type Supplier, type AccountHolder, type Marketplace } from '../services/referenceService';
import { useSettings } from '../contexts/SettingsContext';
import type { CalculationResult, ProductItem } from '../types/calculator';
import { formatCurrency, handleCurrencyChange, parseCurrency } from '../utils/currency';
import { supabase } from '@/lib/supabase';
import { useMultipleProductsSalesStats } from '../hooks/useMultipleProductsSalesStats';
import { useProfitAnalysis } from '../hooks/sales/useProfitAnalysis';
import { useTopProfitableProducts } from '../hooks/sales/useTopProfitableProducts';
import { useCustomerLifetimeValue } from '../hooks/sales/useCustomerLifetimeValue';
import { MarketplacePerformanceCard } from './sales/MarketplacePerformanceCard';
import { useGeneralFinancialSummary } from '../hooks/useSalesStats';
import ElectricBorder from './ui/electric-border';
import { toast } from 'sonner';

gsap.registerPlugin(useGSAP);

let blingCategoryMapPromise: Promise<Record<string, string>> | null = null;
const normalizeCategoryText = (value: string) => value
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '');
const parseBlingCategoryMap = (text: string) => {
  const entries: Record<string, string> = {};
  text.split(/\r?\n/).forEach((line) => {
    const match = line.match(/^(.*)\((\d+)\)\s*$/);
    if (!match) return;
    const label = match[1]?.trim();
    const id = match[2];
    if (label && id) {
      entries[id] = label;
    }
  });
  return entries;
};
const loadBlingCategoryMap = async () => {
  if (blingCategoryMapPromise) return blingCategoryMapPromise;
  blingCategoryMapPromise = fetch(new URL('../maps/bling-bluesoft.txt', import.meta.url))
    .then((response) => response.text())
    .then((text) => parseBlingCategoryMap(text))
    .catch(() => ({}));
  return blingCategoryMapPromise;
};
const mapBlingCategoryToMlKey = (label: string) => {
  if (!label) return '';
  const normalized = normalizeCategoryText(label);
  const matchers: Array<{ key: string; patterns: string[] }> = [
    { key: 'celulares', patterns: ['celular', 'smartphone', 'telefone'] },
    { key: 'informatica', patterns: ['informatica', 'computador', 'notebook', 'periferico'] },
    { key: 'relogios', patterns: ['relogio', 'relógio', 'pulseira'] },
    { key: 'calcados', patterns: ['calcado', 'calçado', 'sapato', 'tenis', 'tênis'] },
    { key: 'eletronicos', patterns: ['eletronico', 'eletrônico', 'audio', 'áudio', 'video', 'vídeo', 'tv', 'camera', 'câmera', 'videogame'] },
    { key: 'moda', patterns: ['moda', 'vestuario', 'vestuário', 'acessorio', 'acessório', 'joia', 'bijuteria', 'bolsa'] },
    { key: 'casa', patterns: ['casa', 'decoracao', 'decoração', 'cozinha', 'jardim', 'iluminacao', 'iluminação', 'luminaria', 'luminária', 'utensilio', 'utensílio'] },
    { key: 'moveis', patterns: ['movel', 'móvel', 'moveis', 'móveis'] },
    { key: 'beleza', patterns: ['beleza', 'cuidado pessoal', 'cuidados pessoal', 'cuidados pessoais', 'higiene', 'higiene pessoal', 'barbearia', 'cabelo', 'maquiagem', 'massagem', 'perfumaria', 'cosmetico', 'cosmeticos', 'skincare', 'estetica', 'dermocosmetico', 'dermocosmeticos'] },
    { key: 'esportes', patterns: ['esporte', 'fitness', 'lazer'] },
    { key: 'brinquedos', patterns: ['brinquedo', 'infantil', 'bebe', 'bebê'] },
    { key: 'ferramentas', patterns: ['ferramenta'] },
    { key: 'pet', patterns: ['pet', 'animal'] },
    { key: 'livros', patterns: ['livro'] },
    { key: 'automotivo', patterns: ['auto', 'carro', 'moto', 'automot'] }
  ];
  const matched = matchers.find((matcher) => matcher.patterns.some((pattern) => normalized.includes(pattern)));
  return matched?.key ?? '';
};

const SYSTEM_SLUG_MAP: Record<string, string> = {
  'Mercado Livre': 'mercadolivre',
  'Shopee': 'shopee',
  'TikTok': 'tiktok',
  'Site Próprio': 'wordpress',
  'Enjoei': 'enjoei',
  'Amazon': 'amazon',
  'Shein': 'shein',
  'OLX': 'olx'
};

const DropshippingCalculator = ({ viewMode = 'full' }: { viewMode?: 'full' | 'products' }) => {
  const container = useRef<HTMLDivElement>(null);
  const prevCalculations = useRef<CalculationResult | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const e2eSearch = new URLSearchParams(location.search).get('e2e') === 'true' ? '?e2e=true' : '';
  
  const {
    productName, setProductName,
    hasVariations, setHasVariations,
    variations, setVariations,
    variationType, setVariationType,
    variationName, setVariationName,
    variationSku, setVariationSku,
    variationStock, setVariationStock,
    variationCost, setVariationCost,
    variationMarkup, setVariationMarkup,
    supplierName,
    supplier_id, setSupplier_id,
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
    gatewayFeeType, setGatewayFeeType,
    markupMultiplier, setMarkupMultiplier,
    extraCommission, setExtraCommission,
    marketplace,
    // marketplace_id and setMarketplace_id reserved for future use
    tiktokCommission, setTiktokCommission,
    wordpressShipping, setWordpressShipping,
    amazonPlan, setAmazonPlan,
    amazonCategory, setAmazonCategory,
    competitorPrice, setCompetitorPrice,
    competitorMarkup, setCompetitorMarkup,
    category, setCategory,
    shippingOption, setShippingOption,
    shopeeSellerType,
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
    trafficMode,
    organicSubMode, setOrganicSubMode,
    orgImpressions, setOrgImpressions,
    orgClicks, setOrgClicks,
    orgSales, setOrgSales,
    orgFreq, setOrgFreq,
    organicChannels, setOrganicChannels,
    organicChannelLinks, setOrganicChannelLinks,
    organicChannelNames, setOrganicChannelNames,
    orgCostVideo, setOrgCostVideo,
    selectedAiModel, setSelectedAiModel,
    selectedKiePlan, setSelectedKiePlan,
    currentCredits, setCurrentCredits,
    videoDuration, setVideoDuration,
    organicApi, setOrganicApi,
    useUploadPostFree, setUseUploadPostFree,
    competitorDiscount, setCompetitorDiscount,
    operationMode,
    deliveryMode,
    deliveryLogistics, setDeliveryLogistics,
    productCondition, setProductCondition,
    productDescription, setProductDescription,
    emergencyReserve, setEmergencyReserve,
    workingCapital, setWorkingCapital,
    returnRate, setReturnRate,
    paidTraffic, setPaidTraffic,
    paidTrafficType, setPaidTrafficType,
    gatewayBank,
    gatewayMethod,
    gatewayInstallments,
    useShopeeAds,
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
    paidTrafficGatewayBank,
    paidTrafficGatewayMethod,
    paidTrafficGatewayInstallments,
    handleTrafficModeChange,
    paidTrafficGatewayFee,
    setPaidTrafficGatewayFee,
    paidTrafficGatewayFeeType, setPaidTrafficGatewayFeeType,
    paidTrafficGatewayFixedFee,
    handleShopeeAdsChange,
    handleShopeeCategoryChange,
    enjoeiAdType, setEnjoeiAdType,
    enjoeiInactivityMonths, setEnjoeiInactivityMonths,
    addVariation,
    removeVariation,
    updateVariation,
    updateAllVariationsMarkup,
    calculations,
    variationCalculations,
    gatewayFixedFee,
    productImage, setProductImage,
    productSku, setProductSku,
    stockQuantity, setStockQuantity,
    weight, setWeight,
    width, setWidth,
    height, setHeight,
    depth, setDepth,
    unitOfMeasure, setUnitOfMeasure,
    handleSupplierChange,
    resetProductDraft,
    paidConversionRate, setPaidConversionRate,
    paidCtr, setPaidCtr,
    selectedInfluencerId, setSelectedInfluencerId,
    videoGenerationLlm, setVideoGenerationLlm,
    videoGenerationPlan, setVideoGenerationPlan,
    productFilters, setProductFilters,
    influencers, setInfluencers,
    affiliates, setAffiliates
  } = useDropshippingCalculator();

  const { organizationId, workingCapital: contextWorkingCapital, emergencyReserve: contextEmergencyReserve, capitalMarketing: contextCapitalMarketing, grossInvestment: contextGrossInvestment, lastUpdated } = useSettings();

  const [suppliersList, setSuppliersList] = useState<Supplier[]>([]);
  const [marketplacesList, setMarketplacesList] = useState<Marketplace[]>([]);
  const [accountHoldersList, setAccountHoldersList] = useState<AccountHolder[]>([]);
  const isAbortError = (error: unknown) =>
    (error instanceof DOMException && error.name === 'AbortError')
    || (error instanceof Error && error.name === 'AbortError');

  // Helper functions to find IDs from names/slugs
  const findMarketplaceId = useCallback((slug: string): string | undefined => {
    if (!slug) return undefined;
    const normalized = slug.toLowerCase().trim();
    return marketplacesList.find(m => m.name.toLowerCase() === normalized)?.id;
  }, [marketplacesList]);

  const findSupplierId = useCallback((name: string): string | undefined => {
    if (!name) return undefined;
    const normalized = name.toLowerCase().trim();
    return suppliersList.find(s => s.name.toLowerCase() === normalized)?.id;
  }, [suppliersList]);

  useEffect(() => {
    if (organizationId) {
      ReferenceService.getSuppliers(organizationId)
        .then((list) => {
          const unique = list.reduce((acc, current) => {
            if (!acc.some((item) => item.name.toLowerCase() === current.name.toLowerCase())) {
              acc.push(current);
            }
            return acc;
          }, [] as Supplier[]);
          setSuppliersList(unique);
        })
        .catch((error) => {
          if (!isAbortError(error)) console.error(error);
        });
      ReferenceService.getMarketplaces(organizationId)
        .then(setMarketplacesList)
        .catch((error) => {
          if (!isAbortError(error)) console.error(error);
        });
      ReferenceService.getAccountHolders(organizationId)
        .then(setAccountHoldersList)
        .catch((error) => {
          if (!isAbortError(error)) console.error(error);
        });
    }
  }, [organizationId, lastUpdated]);

  // When suppliersList loads, apply supplier defaults if supplier_id is already set
  useEffect(() => {
    if (suppliersList.length > 0 && supplier_id) {
      const found = suppliersList.find(s => s.id === supplier_id);
      if (found) {
        handleSupplierChange(found.name);
      }
    }
  // handleSupplierChange and supplier_id are intentionally omitted: we only want
  // this to run when the suppliers list first loads, not on every supplier change.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suppliersList]);

  const handleResetProductDraft = useCallback((silent?: boolean) => {
    resetProductDraft(silent);
    setLastFilledBlingIds([]);
    setLastFilledBlingSku('');
  }, [resetProductDraft]);

  useEffect(() => {
    console.log('[Auth Listener] Setting up auth state change listener');
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[Auth Listener] Auth event:', event, 'Session:', session ? 'exists' : 'null');
      
      // IMPORTANTE: Não resetar em SIGNED_IN pois pode ser renovação de token
      // Apenas resetar em SIGNED_OUT (logout real)
      if (event === 'SIGNED_OUT') {
        console.log('[Auth Listener] User signed out, resetting draft');
        handleResetProductDraft(true);
      }
    });

    return () => {
      console.log('[Auth Listener] Cleaning up auth listener');
      subscription.unsubscribe();
    };
  }, [handleResetProductDraft]);

  // Sync settings from context
  useEffect(() => {
    if (contextWorkingCapital) setWorkingCapital(formatCurrency(contextWorkingCapital));
    if (contextEmergencyReserve) setEmergencyReserve(formatCurrency(contextEmergencyReserve));
  }, [contextWorkingCapital, contextEmergencyReserve, setWorkingCapital, setEmergencyReserve]);

  const readRegisteredBlingIds = () => {
    if (typeof window === 'undefined') return new Set<string>();
    try {
      const stored = localStorage.getItem('registeredBlingIds');
      if (!stored) return new Set<string>();
      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) return new Set<string>();
      return new Set(parsed.filter((id) => typeof id === 'string'));
    } catch {
      return new Set<string>();
    }
  };

  const readRegisteredBlingBySku = () => {
    if (typeof window === 'undefined') return {};
    try {
      const stored = localStorage.getItem('registeredBlingBySku');
      if (!stored) return {};
      const parsed = JSON.parse(stored);
      if (!parsed || typeof parsed !== 'object') return {};
      return Object.entries(parsed).reduce<Record<string, string[]>>((acc, [key, value]) => {
        if (Array.isArray(value)) {
          acc[key] = value.filter((id) => typeof id === 'string');
        }
        return acc;
      }, {});
    } catch {
      return {};
    }
  };

  const [products, setProducts] = useState<ProductItem[]>([]);
  const [showProductsList, setShowProductsList] = useState(true);
  const showOnlyProducts = viewMode === 'products';
  const [isProductsLoading, setIsProductsLoading] = useState(true);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [maxPricePage, setMaxPricePage] = useState(1);
  const [maxProfitPage, setMaxProfitPage] = useState(1);
  const [selectedProductIndex, setSelectedProductIndex] = useState(0);
  const [projectionSearch, setProjectionSearch] = useState('');
  const [isGlobalSummaryOpen, setIsGlobalSummaryOpen] = useState(false);
  /*
  const [productFilters, setProductFilters] = useState({
    marketplace: 'all',
    supplier: '',
    cnpj: '',
    holder: '',
    accountType: 'all',
    videoModel: 'all'
  });
  */
  const [registeredBlingIds, setRegisteredBlingIds] = useState<Set<string>>(() => readRegisteredBlingIds());
  const [registeredBlingBySku, setRegisteredBlingBySku] = useState<Record<string, string[]>>(() => readRegisteredBlingBySku());
  const [lastFilledBlingIds, setLastFilledBlingIds] = useState<string[]>([]);
  const [lastFilledBlingSku, setLastFilledBlingSku] = useState('');

  // Hook para buscar resumo financeiro real do Bling
  const { summary: blingFinancialSummary } = useGeneralFinancialSummary();

  // Hook para análise de lucro detalhada (breakdown de custos)
  const { data: profitAnalysis } = useProfitAnalysis(organizationId ?? '');
  // Hook para produtos mais lucrativos
  const { products: topProducts, loading: topProductsLoading } = useTopProfitableProducts(organizationId ?? '', 5);
  // Hook para Customer Lifetime Value (só KPIs, sem Top 10)
  const { data: clvData, loading: clvLoading } = useCustomerLifetimeValue(organizationId ?? '');

  const handleNavigateToProducts = useCallback((event: MouseEvent<HTMLElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest('button, a, input, select, textarea')) {
      return;
    }
    navigate({ pathname: '/produtos', search: e2eSearch });
  }, [navigate, e2eSearch]);
  const handleNavigateToProductsButton = useCallback(() => {
    setIsGlobalSummaryOpen(true);
  }, []);


  useEffect(() => {
    localStorage.setItem('registeredBlingIds', JSON.stringify(Array.from(registeredBlingIds)));
  }, [registeredBlingIds]);

  useEffect(() => {
    localStorage.setItem('registeredBlingBySku', JSON.stringify(registeredBlingBySku));
  }, [registeredBlingBySku]);

  // DESABILITADO: Não sincronizar automaticamente registeredBlingIds com registeredBlingBySku
  // Isso causava produtos novos do Bling aparecerem como "Cadastrado" quando tinham o mesmo SKU
  // de um produto já cadastrado. Agora apenas adicionamos IDs quando o produto é preenchido.
  /*
  useEffect(() => {
    const nextRegisteredBlingIds = new Set<string>(
      Object.values(registeredBlingBySku).flat().filter((id) => typeof id === 'string')
    );
    setRegisteredBlingIds(nextRegisteredBlingIds);
  }, [registeredBlingBySku]);
  */

  const pageSize = 6; // 3 linhas x 2 colunas = 6 produtos por página
  const prevProductIds = useRef<Set<string>>(new Set());

  // Edit State
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editSessionId, setEditSessionId] = useState(0);
  const [editMode, setEditMode] = useState<'edit' | 'duplicate'>('edit');

  const paidTrafficInvestment = Number(calculations?.paidTrafficCost || 0);
  const shopeeTotalBudgetValue = useShopeeAds ? parseCurrency(shopeeTotalBudget || 0) : 0;
  const marketingCapitalValue = parseCurrency(contextCapitalMarketing || 0);
  const totalMarketingInvestment = paidTrafficInvestment + shopeeTotalBudgetValue;
  const remainingMarketingCapital = Math.max(marketingCapitalValue - totalMarketingInvestment, 0);
  const availableShopeeBudget = Math.max(marketingCapitalValue - paidTrafficInvestment, 0);

  const handleProductsResponse = useCallback((list: ProductItem[]) => {
    setProducts(list);
    setCurrentPage(1);
    setIsProductsLoading(false);
    setSelectedProductIndex((prev) => {
      if (list.length === 0) return 0;
      return Math.min(prev, list.length - 1);
    });
  }, []);

  const loadProducts = useCallback(async () => {
    console.log('[DEBUG Products Page] loadProducts called, organizationId:', organizationId);
    setIsProductsLoading(true);
    try {
      const list = await ProductService.getAll(organizationId ?? undefined);
      console.log('[DEBUG Products Page] Products fetched:', list.length, 'products');
      handleProductsResponse(list);
      
      // Sincronizar registeredBlingBySku com produtos reais
      // Remover SKUs que não existem mais na tabela products
      const existingSkus = new Set(list.map(p => p.sku?.trim()).filter(Boolean));
      setRegisteredBlingBySku((prev) => {
        const cleaned: Record<string, string[]> = {};
        let hasChanges = false;
        
        for (const [sku, ids] of Object.entries(prev)) {
          if (existingSkus.has(sku)) {
            cleaned[sku] = ids;
          } else {
            hasChanges = true;
            // Remover IDs do registeredBlingIds também
            setRegisteredBlingIds((prevIds) => {
              const next = new Set(prevIds);
              ids.forEach(id => next.delete(id));
              return next;
            });
          }
        }
        
        return hasChanges ? cleaned : prev;
      });
    } catch (error: unknown) {
      console.error('Error loading products:', error);
      toast.error('Erro ao carregar produtos', {
        description: 'Não foi possível carregar os produtos.',
      });
    } finally {
      setIsProductsLoading(false);
    }
  }, [organizationId, handleProductsResponse]);

  const handleEditProductClick = (product: ProductItem) => {
      setEditingProduct(product);
      setEditMode('edit');
      setEditSessionId(Date.now());
      setIsEditModalOpen(true);
  };

  const handleSaveEditProduct = (updatedProduct: ProductItem) => {
    if (editMode === 'duplicate') {
      const payload = { ...updatedProduct };
      delete (payload as Partial<ProductItem>).id;
      void handleUpsertProduct(payload);
      return;
    }
    void handleUpsertProduct(updatedProduct);
  };
  const handleInvestSaveProduct = (updatedProduct: ProductItem) => {
    void handleUpsertProduct(updatedProduct);
  };

  const handleDuplicateProductClick = (product: ProductItem) => {
      setEditingProduct(product);
      setEditMode('duplicate');
      setEditSessionId(Date.now());
      setIsEditModalOpen(true);
  };

  // New state for Profit Pricing Overlay
  const showProfitOverlay = Boolean(costPrice && parseCurrency(costPrice) > 0);

  useGSAP(() => {
    // Animate Profit Pricing Overlay
    if (showProfitOverlay) {
        gsap.fromTo(".profit-overlay-animate", 
            { opacity: 0, scale: 0.95, y: 20 },
            { opacity: 1, scale: 1, y: 0, duration: 0.5, ease: "back.out(1.7)" }
        );
    }
  }, { scope: container, dependencies: [showProfitOverlay] });

  const handleUpsertProduct = async (payload: ProductItem | Partial<ProductItem>) => {
    const toastId = toast.loading('Salvando produto...');
    setIsProductsLoading(true);

    try {
      if (payload.id) {
        await ProductService.update(payload as ProductItem);
      } else {
        await ProductService.create(payload as Omit<ProductItem, 'id'>);
      }
      
      const list = await ProductService.getAll(organizationId ?? undefined);
      handleProductsResponse(list);
      setShowProductsList(true);
      toast.success('Produto salvo com sucesso!', { id: toastId });
    } catch (error: unknown) {
      console.log('Error upserting product details:', JSON.stringify(error, null, 2));
      setIsProductsLoading(false);
      const msg = error instanceof Error ? error.message : "Não foi possível salvar o produto.";
      toast.error('Erro ao salvar produto', {
        id: toastId,
        description: msg,
        action: {
          label: 'Tentar novamente',
          onClick: () => handleUpsertProduct(payload),
        },
      });
    }
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

  const handleSaveProduct = async () => {
    const missingFields: string[] = [];
    const normalizedSku = productSku.trim();
    if (!productName) missingFields.push('Nome do Produto');
    if (!normalizedSku) missingFields.push('SKU do Produto');
    if (!supplierName && !supplier_id) missingFields.push('Fornecedor');
    if (!costPrice || parseCurrency(costPrice) <= 0) missingFields.push('Preço de Custo do Fornecedor');
    // Quantidade em estoque is optional now
    if (stockQuantity !== '' && (Number.isNaN(Number(stockQuantity)) || Number(stockQuantity) < 0)) {
      missingFields.push('Quantidade em estoque (número válido)');
    }

    if (missingFields.length > 0) {
      toast.error('Campos obrigatórios faltando', {
        description: `Preencha: ${missingFields.join(', ')}.`,
      });
      return;
    }
    if (!calculations) {
      toast.error('Cálculo necessário', {
        description: 'Preencha o preço de custo para calcular antes de salvar.',
      });
      return;
    }
    
    const getColorHex = () => {
      if (calculations.marginStatus === 'negative') return '#DC2928';
      if (calculations.marginStatus === 'low') return '#FACC15';
      return '#16A34A';
    };
    const resolvedImageUrl = productImage.trim() || getDefaultMarketplaceImage(marketplace);
    const manualSellingValue = parseCurrency(manualSellingPrice);
    const suggestedSellingValue = parseCurrency(calculations.suggestedPrice);
    const resolvedSellingPrice = manualSellingValue > 0 ? manualSellingValue : suggestedSellingValue;
    if (marketplace === 'mercadolivre' && resolvedSellingPrice < 8) {
      toast.error('Preço inválido', {
        description: 'O preço de venda precisa ser maior que R$8,00',
      });
      return;
    }

    const conditionPayload = operationMode === 'armazem_alob'
      ? productCondition === 'novo'
        ? { isNewProduct: 'sim', defectiveProduct: 'nao' }
        : productCondition === 'usado'
          ? { isNewProduct: 'nao', defectiveProduct: 'nao' }
          : productCondition === 'defeito'
            ? { isNewProduct: 'nao', defectiveProduct: 'sim' }
            : { isNewProduct: undefined, defectiveProduct: undefined }
      : { isNewProduct: undefined, defectiveProduct: undefined };

    const shopeeStartDateIso = formatDateToIso(shopeeStartDate);
    const shopeeEndDateIso = formatDateToIso(shopeeEndDate);
    // Respeitar apenas a escolha explícita do usuário no checkbox
    const shouldUseShopeeAds = marketplace === 'shopee' && useShopeeAds;
    
    // Find IDs for marketplace and supplier (Fase 3: Normalização)
    const resolvedMarketplaceId = findMarketplaceId(marketplace);
    const resolvedSupplierId = findSupplierId(supplierName);
    
    const payload = {
      organizationId,
      name: productName,
      sku: normalizedSku,
      description: productDescription || undefined,
      imageUrl: resolvedImageUrl,
      stockQuantity: Number(stockQuantity),
      weight: weight || undefined,
      width: width || undefined,
      height: height || undefined,
      depth: depth || undefined,
      unitOfMeasure: unitOfMeasure || undefined,
      sellingPrice: resolvedSellingPrice,
      costPrice: parseCurrency(costPrice),
      supplierName: supplierName || suppliersList.find(s => s.id === supplier_id)?.name || '',
      supplier_id: resolvedSupplierId || supplier_id,
      marketplace,
      marketplace_id: resolvedMarketplaceId,
      amazonPlan: marketplace === 'amazon' ? amazonPlan : undefined,
      amazonCategory: marketplace === 'amazon' ? amazonCategory : undefined,
      adType: marketplace === 'mercadolivre' ? adType : undefined,
      hasReputation: marketplace === 'mercadolivre' ? hasReputation : false,
      reputationLevel: marketplace === 'mercadolivre' && hasReputation ? reputationLevel : undefined,
      mlShippingCost: marketplace === 'mercadolivre' ? mlShippingCost : undefined,
      shippingOption: marketplace === 'shopee' ? shippingOption : undefined,
      shopeeUseAds: marketplace === 'shopee' ? shouldUseShopeeAds : undefined,
      shopeeAdsCpc: marketplace === 'shopee' ? adsCPC : undefined,
      shopeeDailyBudget: marketplace === 'shopee' ? dailyBudget : undefined,
      shopeeSalesQuantity: marketplace === 'shopee' ? salesQuantity : undefined,
      shopeeTotalBudget: marketplace === 'shopee' ? shopeeTotalBudget : undefined,
      shopeeStartDate: marketplace === 'shopee' ? (shopeeStartDateIso || undefined) : undefined,
      shopeeEndDate: marketplace === 'shopee' ? (shopeeEndDateIso || undefined) : undefined,
      shopeeAdType: marketplace === 'shopee' ? shopeeAdType : undefined,
      shopeeBidType: marketplace === 'shopee' ? shopeeBidType : undefined,
      shopeeKeywords: marketplace === 'shopee' ? shopeeKeywords : undefined,
      shopeeMaxCpc: marketplace === 'shopee' ? shopeeMaxCpc : undefined,
      shopeeStoreCouponEnabled: marketplace === 'shopee' ? shopeeStoreCouponEnabled : undefined,
      shopeeStoreCouponValue: marketplace === 'shopee' ? shopeeStoreCouponValue : undefined,
      shopeeStoreCouponType: marketplace === 'shopee' ? shopeeStoreCouponType : undefined,
      shopeeProductCouponEnabled: marketplace === 'shopee' ? shopeeProductCouponEnabled : undefined,
      shopeeProductCouponValue: marketplace === 'shopee' ? shopeeProductCouponValue : undefined,
      shopeeProductCouponType: marketplace === 'shopee' ? shopeeProductCouponType : undefined,
      shopeeFollowerCouponEnabled: marketplace === 'shopee' ? shopeeFollowerCouponEnabled : undefined,
      shopeeFollowerCouponValue: marketplace === 'shopee' ? shopeeFollowerCouponValue : undefined,
      shopeeFollowerCouponType: marketplace === 'shopee' ? shopeeFollowerCouponType : undefined,
      shopeeSellerVoucherEnabled: marketplace === 'shopee' ? shopeeSellerVoucherEnabled : undefined,
      shopeeSellerVoucherValue: marketplace === 'shopee' ? shopeeSellerVoucherValue : undefined,
      shopeeSellerVoucherType: marketplace === 'shopee' ? shopeeSellerVoucherType : undefined,
      marketplaceShippingCost: ['tiktok', 'wordpress', 'enjoei', 'amazon', 'shein'].includes(marketplace) ? wordpressShipping : undefined,
      facebookDelivery: marketplace === 'facebook' ? facebookDelivery : undefined,
      enjoeiAdType: marketplace === 'enjoei' ? enjoeiAdType : undefined,
      enjoeiInactivityMonths: marketplace === 'enjoei' ? enjoeiInactivityMonths : undefined,
      trafficMode,
      organicChannels,
      organicChannelLinks,
      organicChannelNames,
      influencers,
      affiliates,
      influencer_id: selectedInfluencerId || undefined,
      paidTraffic,
      // Mapear canais orgânicos para campos de vídeo promocional
      promoVideoChannels: organicChannels,
      promoVideoChannelLinks: organicChannelLinks,
      promoVideoChannelNames: organicChannelNames,
      operationMode,
      gatewayMethod,
      gatewayBank,
      meliPlus,
      videoGenerationLlm,
      supplierFeeType: supplierFeeType || 'percent',
      supplierFeeValue: supplierFeeType === 'percent' ? supplierFeePercent : supplierFixedFee,
      supplierGatewayFeeType: supplierGatewayFeeType || 'fixed',
      supplierGatewayFeeValue: supplierGatewayFeeType === 'percent' ? supplierGatewayFee : supplierGatewayFixedFee,
      netRevenue: parseCurrency(calculations.netRevenue),
      colorHex: getColorHex(),
      marginStatus: calculations.marginStatus,
      accountHolder,
      accountType,
      variations: variations.map(v => ({
        name: v.name,
        cost: v.cost,
        markup: v.markup,
        variationType: v.variationType,
        stockQuantity: v.stockQuantity,
        suggestedPrice: variationCalculations.find(vc => vc.id === v.id)?.metrics.suggestedPrice || '0',
        manualPrice: v.manualPrice,
        netRevenue: variationCalculations.find(vc => vc.id === v.id)?.metrics.netRevenue || '0',
        margin: variationCalculations.find(vc => vc.id === v.id)?.metrics.actualMargin || '0',
      })),
      ...conditionPayload
    };
    const shouldRegisterBlingProduct = lastFilledBlingIds.length > 0 && normalizedSku === lastFilledBlingSku;

    const toastId = toast.loading('Salvando produto...');
    setIsSavingProduct(true);
    try {
      await ProductService.create(payload as unknown as Omit<ProductItem, 'id'>);
      const list = await ProductService.getAll(organizationId ?? undefined);
      handleProductsResponse(list);
      toast.success('Produto salvo com sucesso!', { id: toastId });
      if (shouldRegisterBlingProduct) {
        setRegisteredBlingIds((prev) => {
          const next = new Set(prev);
          lastFilledBlingIds.forEach((id) => next.add(id));
          return next;
        });
        setRegisteredBlingBySku((prev) => ({
          ...prev,
          [normalizedSku]: lastFilledBlingIds
        }));
        setLastFilledBlingIds([]);
        setLastFilledBlingSku('');
      }
      setProductName('');
      setProductSku('');
      setStockQuantity('');
      setProductImage('');
    setWeight('');
    setWidth('');
    setHeight('');
    setDepth('');
    setUnitOfMeasure('');
      setProductDescription('');
      setCostPrice('');
      setVariations([]);
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error('Erro ao salvar produto', {
        id: toastId,
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        action: {
          label: 'Tentar novamente',
          onClick: () => handleSaveProduct(),
        },
      });
    } finally {
      setIsSavingProduct(false);
    }
  };
  const isSaveDisabled = !productName.trim()
    || !productSku.trim()
    || (!supplierName && !supplier_id)
    || !costPrice
    || parseCurrency(costPrice) <= 0;

  const formatMoney = (value: string | number) => formatCurrency(value);
  const variationMarkupOptions = [
    { value: '0', label: '0' },
    { value: '1', label: '1.0x' },
    { value: '1,25', label: '1.25x' },
    { value: '1,5', label: '1.50x' },
    { value: '1,75', label: '1.75x' },
    { value: '2', label: '2.0x' },
    { value: '3', label: '3.0x' },
    { value: '4', label: '4.0x' },
    { value: '5', label: '5.0x' }
  ];
  const formatPercent = (value: string | number, digits: number = 1) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (Number.isNaN(num)) return '0';
    return num.toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits });
  };
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
  const getMarketplaceName = (value: string | undefined) => {
    if (!value) return 'Outros';
    switch (value) {
      case 'mercadolivre': return 'Mercado Livre';
      case 'shopee': return 'Shopee';
      case 'tiktok': return 'TikTok';
      case 'wordpress': return 'Site Próprio';
      case 'enjoei': return 'Enjoei';
      case 'amazon': return 'Amazon';
      case 'shein': return 'Shein';
      case 'facebook': return 'Facebook';
      case 'olx': return 'OLX';
      default: return value.charAt(0).toUpperCase() + value.slice(1);
    }
  };
  const formatMarketplaceDisplayLabel = (label: string) => {
    if (label === 'Mercado Livre' || label.toLowerCase().includes('mercado')) return 'ML';
    return label;
  };

  const normalizeText = (value: string) => value.trim().toLowerCase();
  const globalSearch = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('q')?.trim() ?? '';
  }, [location.search]);
  const normalizedGlobalSearch = normalizeText(globalSearch);
  useEffect(() => {
    if (globalSearch) {
      setCurrentPage(1);
    }
  }, [globalSearch]);
  const handleProductFilterChange = (field: keyof typeof productFilters, value: string) => {
    setProductFilters((prev) => ({ ...prev, [field]: value }));
    setCurrentPage(1);
  };
  const parseVariationInfo = (value: string | null | undefined) => {
    const raw = (value ?? '').trim();
    if (!raw) {
      return { color: '', size: '', raw: '' };
    }
    const parts = raw.split(';').map((part) => part.trim()).filter(Boolean);
    let color = '';
    let size = '';
    parts.forEach((part) => {
      const lower = part.toLowerCase();
      if (lower.startsWith('cor')) {
        const parsed = part.split(':').slice(1).join(':').trim();
        color = parsed || part.replace(/cor/i, '').trim();
      }
      if (lower.startsWith('tamanho')) {
        const parsed = part.split(':').slice(1).join(':').trim();
        size = parsed || part.replace(/tamanho/i, '').trim();
      }
    });
    return { color, size, raw };
  };
  const handleManualSellingPriceChange = handleFloatInput((value) => {
    setManualSellingPrice(value);
    setVariations((prev) => {
      if (prev.length === 0) return prev;
      let changed = false;
      const next = prev.map((item) => {
        if (item.manualPriceLocked) return item;
        if (item.manualPrice === value) return item;
        changed = true;
        return { ...item, manualPrice: value };
      });
      return changed ? next : prev;
    });
  });
  const handleCostPriceChange = handleFloatInput((value) => {
    setCostPrice(value);
    setVariations((prev) => {
      if (prev.length === 0) return prev;
      let changed = false;
      const next = prev.map((item) => {
        if (item.cost === value) return item;
        changed = true;
        return { ...item, cost: value };
      });
      return changed ? next : prev;
    });
  });
  const handleFillFromBlingProduct = async (product: BlingProductItem, productVariations: BlingProductItem[]) => {
    const salePriceValue = product.salePrice !== null && product.salePrice !== undefined
      ? formatCurrency(product.salePrice)
      : '';
    setProductName(product.name || '');
    setProductSku(product.sku || '');
    setStockQuantity(product.stockQuantity !== null && product.stockQuantity !== undefined ? String(product.stockQuantity) : '');
    setProductImage(product.imageUrl || '');
    setProductDescription(product.description || '');
    setWeight(product.weight !== null && product.weight !== undefined ? formatCurrency(product.weight) : '');
    setWidth(product.width !== null && product.width !== undefined ? formatCurrency(product.width) : '');
    setHeight(product.height !== null && product.height !== undefined ? formatCurrency(product.height) : '');
    setDepth(product.depth !== null && product.depth !== undefined ? formatCurrency(product.depth) : '');
    const normalizedUnit = (product.unitOfMeasure ?? '').trim();
    const resolvedUnit = normalizedUnit === '' || normalizedUnit === '\'' ? 'cm' : normalizedUnit;
    setUnitOfMeasure(resolvedUnit);
    setLastFilledBlingSku(product.sku || '');
    setLastFilledBlingIds([product.id, ...productVariations.map((variation) => variation.id)]);
    if (product.supplierSku === 'ALOBEXPRESS_01') {
      handleSupplierChange('ALOBEXPRESS');
    } else if (product.supplierSku === 'ALOBFOR_DROP_01') {
      handleSupplierChange('Tyr');
    } else {
      handleSupplierChange('');
    }
    if (productVariations.length > 0) {
      const variationInfos = productVariations.map((variation) => parseVariationInfo(variation.variationName || variation.name || ''));
      const hasSize = variationInfos.some((info) => info.size);
      const hasColor = variationInfos.some((info) => info.color);
      const variationTypeValue = hasSize ? 'size' : (hasColor ? 'color' : 'size');
      setVariationType(variationTypeValue);
      setHasVariations(true);
      setVariations(productVariations.map((variation) => {
        const info = parseVariationInfo(variation.variationName || variation.name || '');
        const variationLabel = info.size && info.color
          ? `${info.size} - ${info.color}`
          : (info.size || info.color || variation.variationName || variation.name || '');
        return {
          id: `${variation.id}-${Date.now()}`,
          variationType: variationTypeValue,
          name: variationLabel,
          sku: variation.sku || '',
          stockQuantity: variation.stockQuantity !== null && variation.stockQuantity !== undefined
            ? String(variation.stockQuantity)
            : '',
          cost: variation.costPrice !== null && variation.costPrice !== undefined
            ? formatCurrency(variation.costPrice)
            : (product.costPrice !== null && product.costPrice !== undefined ? formatCurrency(product.costPrice) : ''),
          markup: markupMultiplier || '',
          manualPrice: salePriceValue || undefined,
          manualPriceLocked: false
        };
      }));
    } else {
      setHasVariations(false);
      setVariations([]);
    }
    setCostPrice(product.costPrice !== null && product.costPrice !== undefined ? formatCurrency(product.costPrice) : '');
    setManualSellingPrice(salePriceValue);
    if (product.categoryId && (marketplace === 'mercadolivre' || !marketplace)) {
      const map = await loadBlingCategoryMap();
      const label = map[String(product.categoryId)] ?? '';
      const mappedCategory = mapBlingCategoryToMlKey(label);
      if (mappedCategory) {
        setCategory(mappedCategory);
      }
    }
    toast.success('Produto carregado na calculadora', {
      description: 'Os dados do produto foram preenchidos com sucesso.',
    });
  };

  const handleUpdateFromBlingProduct = async (blingProduct: BlingProductItem, blingVariations: BlingProductItem[]) => {
    try {
      // Encontrar o produto na tabela products pelo SKU
      const productSku = blingProduct.sku?.trim();
      if (!productSku) {
        toast.error('SKU não encontrado', {
          description: 'O produto do Bling não possui SKU para atualização.',
        });
        return;
      }

      // Buscar o produto existente
      const existingProduct = products.find(p => p.sku?.trim() === productSku);
      if (!existingProduct) {
        toast.error('Produto não encontrado', {
          description: `Nenhum produto com SKU "${productSku}" foi encontrado na aba Produtos.`,
        });
        return;
      }

      // Preparar dados atualizados do Bling
      const updatedData = {
        name: blingProduct.name || existingProduct.name,
        image_url: blingProduct.imageUrl || existingProduct.imageUrl,
        description: blingProduct.description || existingProduct.description,
        stock_quantity: blingProduct.stockQuantity ?? existingProduct.stockQuantity,
        cost_price: blingProduct.costPrice ?? existingProduct.costPrice,
        peso: blingProduct.weight ?? existingProduct.weight,
        largura: blingProduct.width ?? existingProduct.width,
        altura: blingProduct.height ?? existingProduct.height,
        profundidade: blingProduct.depth ?? existingProduct.depth,
        unidade_medida: blingProduct.unitOfMeasure || existingProduct.unitOfMeasure,
      };

      // Atualizar no banco de dados
      const { error } = await supabase
        .from('products')
        .update(updatedData)
        .eq('id', existingProduct.id);

      if (error) {
        console.error('Erro ao atualizar produto:', error);
        toast.error('Erro ao atualizar', {
          description: 'Não foi possível atualizar o produto no banco de dados.',
        });
        return;
      }

      // Atualizar variações se existirem
      if (blingVariations.length > 0 && existingProduct.variations && existingProduct.variations.length > 0) {
        const updatedVariations = existingProduct.variations.map((existingVar) => {
          // Encontrar variação correspondente no Bling pelo SKU
          const blingVar = blingVariations.find(bv => bv.sku?.trim() === existingVar.sku?.toString().trim());
          if (blingVar) {
            return {
              ...existingVar,
              stockQuantity: blingVar.stockQuantity ?? existingVar.stockQuantity,
              cost: blingVar.costPrice ?? existingVar.cost,
              imageUrl: blingVar.imageUrl || existingVar.imageUrl,
            };
          }
          return existingVar;
        });

        // Atualizar variações no banco
        const { error: varError } = await supabase
          .from('products')
          .update({ variations: updatedVariations })
          .eq('id', existingProduct.id);

        if (varError) {
          console.error('Erro ao atualizar variações:', varError);
        }
      }

      // Recarregar produtos
      await loadProducts();

      toast.success('Produto atualizado', {
        description: `O produto "${blingProduct.name}" foi atualizado com sucesso.`,
      });
    } catch (error) {
      console.error('Erro ao atualizar produto:', error);
      toast.error('Erro inesperado', {
        description: 'Ocorreu um erro ao atualizar o produto.',
      });
    }
  };

  const getProductUpdatedTimestamp = (product: ProductItem) => {
    const baseValue = product.updatedAt || product.createdAt || '';
    if (!baseValue) return 0;
    const parsed = Date.parse(baseValue);
    return Number.isNaN(parsed) ? 0 : parsed;
  };
  const effectiveProducts = useMemo(
    () => [...products].sort((a, b) => getProductUpdatedTimestamp(b) - getProductUpdatedTimestamp(a)),
    [products]
  );
  const shouldShowProductsLoading = isProductsLoading && effectiveProducts.length === 0;
  const filteredProducts = useMemo(() => {
    return effectiveProducts.filter((product) => {
      const marketplaceValue = product.marketplace ?? '';
      const supplierValue = product.supplierName ?? '';
      const holderValue = product.accountHolder ?? '';
      const accountTypeValue = (product.accountType ?? '').toLowerCase();
      const productNameValue = product.name ?? '';
      const skuValue = product.sku ?? '';
      const matchesMarketplace = productFilters.marketplace === 'all' || marketplaceValue === productFilters.marketplace;
      const matchesSupplier = !productFilters.supplier || normalizeText(supplierValue).includes(normalizeText(productFilters.supplier));
      const matchesHolder = !productFilters.holder || normalizeText(holderValue).includes(normalizeText(productFilters.holder));
      const matchesAccountType = productFilters.accountType === 'all' || accountTypeValue === productFilters.accountType;
      const matchesCnpj = !productFilters.cnpj || (accountTypeValue === 'cnpj' && normalizeText(holderValue).includes(normalizeText(productFilters.cnpj)));
      const matchesVideoModel = productFilters.videoModel === 'all'
        || (product.videoGenerationLlm ?? '') === productFilters.videoModel;
      
      const stock = product.stockQuantity ?? 0;

      const matchesStock = productFilters.stockFilter === 'all'
        || (productFilters.stockFilter === 'with_stock' && stock > 0)
        || (productFilters.stockFilter === 'without_stock' && stock <= 0);

      const matchesSearch = !normalizedGlobalSearch
        || normalizeText(productNameValue).includes(normalizedGlobalSearch)
        || normalizeText(skuValue).includes(normalizedGlobalSearch)
        || normalizeText(supplierValue).includes(normalizedGlobalSearch)
        || normalizeText(holderValue).includes(normalizedGlobalSearch);
      return matchesMarketplace && matchesSupplier && matchesHolder && matchesAccountType && matchesCnpj && matchesVideoModel && matchesStock && matchesSearch;
    }).sort((a, b) => {
        if (productFilters.priceSort === 'all') return 0;
        
        const priceA = parseCurrency(String(a.sellingPrice ?? 0));
        const priceB = parseCurrency(String(b.sellingPrice ?? 0));
        const costA = parseCurrency(String(a.costPrice ?? 0));
        const costB = parseCurrency(String(b.costPrice ?? 0));

        switch (productFilters.priceSort) {
            case 'min_price': return priceA - priceB;
            case 'max_price': return priceB - priceA;
            case 'min_cost': return costA - costB;
            case 'max_cost': return costB - costA;
            default: return 0;
        }
    });
  }, [effectiveProducts, productFilters, normalizedGlobalSearch]);
  const registeredProductSkus = useMemo(() => {
    const next = new Set<string>();
    products.forEach((product) => {
      if (product.sku) {
        next.add(normalizeText(product.sku));
      }
      product.variations?.forEach((variation) => {
        if (variation.sku) {
          next.add(normalizeText(String(variation.sku)));
        }
      });
    });
    return next;
  }, [products]);
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const pagedProducts = filteredProducts.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  
  // Ref para controlar se a animação já foi executada para a página atual
  const animatedPagesRef = useRef<Set<string>>(new Set());
  
  // Animar produtos quando filtros mudam ou página muda
  useEffect(() => {
    const productCards = document.querySelectorAll('[data-product-id]');
    if (productCards.length === 0) return;
    
    // Criar uma chave única para a combinação de filtros + página
    const filterKey = JSON.stringify({
      filters: productFilters,
      page: currentPage,
      productsCount: pagedProducts.length
    });
    
    // Se já animamos esta combinação, não animar novamente
    if (animatedPagesRef.current.has(filterKey)) {
      return;
    }
    
    // Marcar como animado
    animatedPagesRef.current.add(filterKey);
    
    // Limpar animações antigas se houver muitas chaves (evitar memory leak)
    if (animatedPagesRef.current.size > 50) {
      const keysArray = Array.from(animatedPagesRef.current);
      animatedPagesRef.current = new Set(keysArray.slice(-25));
    }
    
    gsap.fromTo(
      productCards,
      {
        opacity: 0,
        y: 30,
        scale: 0.95
      },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.5,
        stagger: 0.1,
        ease: 'power2.out',
        clearProps: 'all'
      }
    );
  }, [pagedProducts, productFilters, currentPage]);
  
  const marketplaceTotals = useMemo(() => {
    return effectiveProducts.reduce<Record<string, number>>((acc, product) => {
      const label = getMarketplaceName(product.marketplace);
      acc[label] = (acc[label] || 0) + 1;
      return acc;
    }, {});
  }, [effectiveProducts]);
  const systemMarketplaceOptions = useMemo(() => ([
    { value: 'mercadolivre', label: 'Mercado Livre' },
    { value: 'shopee', label: 'Shopee' },
    { value: 'tiktok', label: 'TikTok' },
    { value: 'wordpress', label: 'Site Próprio' },
    { value: 'enjoei', label: 'Enjoei' },
    { value: 'amazon', label: 'Amazon' },
    { value: 'shein', label: 'Shein' },
    { value: 'facebook', label: 'Facebook' },
    { value: 'olx', label: 'OLX' }
  ]), []);
  const dbMarketplaceOptions = useMemo(() => {
    return marketplacesList.map((mp) => {
      const value = mp.is_system
        ? (SYSTEM_SLUG_MAP[mp.name] || mp.name.toLowerCase())
        : mp.name.toLowerCase().replace(/\s/g, '');
      return { value, label: mp.name };
    });
  }, [marketplacesList]);
  const productMarketplaceOptions = useMemo(() => {
    return Array.from(new Set(effectiveProducts.map((product) => product.marketplace).filter((value): value is string => Boolean(value))))
      .map((value) => ({ value, label: getMarketplaceName(value) }));
  }, [effectiveProducts]);
  const marketplaceFilterOptions = useMemo(() => {
    return [...systemMarketplaceOptions, ...dbMarketplaceOptions, ...productMarketplaceOptions].reduce<{ value: string; label: string }[]>((acc, option) => {
      if (acc.some((item) => item.value === option.value)) {
        return acc;
      }
      acc.push(option);
      return acc;
    }, []);
  }, [dbMarketplaceOptions, productMarketplaceOptions, systemMarketplaceOptions]);
  const videoModelOptions = useMemo(() => ([
    { value: 'all', label: 'Todos' },
    { value: 'veo3', label: 'Veo3' },
    { value: 'grok', label: 'Grok' },
    { value: 'sora2', label: 'Sora2' },
    { value: 'wan2', label: 'Wan 2' },
    { value: 'copia', label: 'Cópia' },
    { value: 'kling', label: 'Kling' },
    { value: 'runway', label: 'Runway' },
    { value: 'luma', label: 'Luma' },
    { value: 'pika25', label: 'Pika 2.5' },
    { value: 'seedance', label: 'Seedance' }
  ]), []);
  const priceFilterOptions = useMemo(() => ([
    { value: 'all', label: 'Todos' },
    { value: 'min_price', label: 'Menor Preço Venda' },
    { value: 'max_price', label: 'Maior Preço Venda' },
    { value: 'min_cost', label: 'Menor Preço Custo' },
    { value: 'max_cost', label: 'Maior Preço Custo' }
  ]), []);
  const stockFilterOptions = useMemo(() => ([
    { value: 'all', label: 'Todos' },
    { value: 'with_stock', label: 'Com estoque' },
    { value: 'without_stock', label: 'Sem estoque' }
  ]), []);
  const marketplaceIcons: Record<string, { src: string; alt: string }> = {
    wordpress: { src: wooCommerceLogo, alt: 'WooCommerce' },
    shopee: { src: shopeeLogo, alt: 'Shopee' },
    tiktok: { src: tiktokLogo, alt: 'TikTok Shop' },
    amazon: { src: amazonLogo, alt: 'Amazon' },
    shein: { src: sheinLogo, alt: 'Shein' },
    enjoei: { src: enjoeiLogo, alt: 'Enjoei' },
    mercadolivre: { src: mercadoLivreLogo, alt: 'Mercado Livre' },
    facebook: { src: 'https://cdn.simpleicons.org/facebook/1877F2', alt: 'Facebook' },
    olx: { src: olxLogo, alt: 'OLX' }
  };
  
  const marketplaceMaxProfitProducts = useMemo(() => {
    return effectiveProducts.reduce<Record<string, { productId: string; profit: number; price: number; cost: number; imageUrl: string; name: string; accountHolder?: string; accountType?: string; amazonPlan?: string; amazonCategory?: string; enjoeiAdType?: string; enjoeiInactivityMonths?: string }>>((acc, product) => {
      const label = getMarketplaceName(product.marketplace);
      const productProfit = typeof product.netRevenue === 'number' ? product.netRevenue : parseCurrency(String(product.netRevenue ?? 0));
      const productPrice = parseCurrency(String(product.sellingPrice ?? 0));
      const productCost = parseCurrency(String(product.costPrice ?? 0));
      
      if (!acc[label] || productProfit >= acc[label].profit) {
        acc[label] = {
          productId: product.id,
          profit: productProfit,
          price: productPrice,
          cost: productCost,
          imageUrl: product.imageUrl || getDefaultMarketplaceImage(product.marketplace),
          name: product.name || '',
          accountHolder: product.accountHolder,
          accountType: product.accountType,
          amazonPlan: product.amazonPlan,
          amazonCategory: product.amazonCategory,
          enjoeiAdType: product.enjoeiAdType,
          enjoeiInactivityMonths: product.enjoeiInactivityMonths
        };
      }
      return acc;
    }, {});
  }, [effectiveProducts]);
  const marketplaceMaxProducts = useMemo(() => {
    return effectiveProducts.reduce<Record<string, { productId: string; price: number; cost: number; imageUrl: string; name: string; accountHolder?: string; accountType?: string; amazonPlan?: string; amazonCategory?: string; enjoeiAdType?: string; enjoeiInactivityMonths?: string }>>((acc, product) => {
      const label = getMarketplaceName(product.marketplace);
      const productPrice = parseCurrency(String(product.sellingPrice ?? 0));
      const productCost = parseCurrency(String(product.costPrice ?? 0));
      if (!acc[label] || productPrice >= acc[label].price) {
        acc[label] = {
          productId: product.id,
          price: productPrice,
          cost: productCost,
          imageUrl: product.imageUrl || getDefaultMarketplaceImage(product.marketplace),
          name: product.name || '',
          accountHolder: product.accountHolder,
          accountType: product.accountType,
          amazonPlan: product.amazonPlan,
          amazonCategory: product.amazonCategory,
          enjoeiAdType: product.enjoeiAdType,
          enjoeiInactivityMonths: product.enjoeiInactivityMonths
        };
      }
      return acc;
    }, {});
  }, [effectiveProducts]);

  const maxMarketplaceEntriesPerPage = 2;
  const marketplaceMaxProductsEntries = Object.entries(marketplaceMaxProducts);
  const marketplaceMaxProductsPages = Math.max(1, Math.ceil(marketplaceMaxProductsEntries.length / maxMarketplaceEntriesPerPage));
  const marketplaceMaxProductsPageItems = marketplaceMaxProductsEntries.slice(
    (maxPricePage - 1) * maxMarketplaceEntriesPerPage,
    maxPricePage * maxMarketplaceEntriesPerPage
  );

  const marketplaceMaxProfitEntries = Object.entries(marketplaceMaxProfitProducts);
  const marketplaceMaxProfitPages = Math.max(1, Math.ceil(marketplaceMaxProfitEntries.length / maxMarketplaceEntriesPerPage));
  const marketplaceMaxProfitPageItems = marketplaceMaxProfitEntries.slice(
    (maxProfitPage - 1) * maxMarketplaceEntriesPerPage,
    maxProfitPage * maxMarketplaceEntriesPerPage
  );

  // Buscar vendas de todos os produtos exibidos nos cards
  const allProductIds = useMemo(() => {
    const ids: string[] = [];
    marketplaceMaxProductsPageItems.forEach(([, item]) => {
      if (item.productId) ids.push(item.productId);
    });
    marketplaceMaxProfitPageItems.forEach(([, item]) => {
      if (item.productId) ids.push(item.productId);
    });
    return [...new Set(ids)]; // Remove duplicatas
  }, [marketplaceMaxProductsPageItems, marketplaceMaxProfitPageItems]);

  const { salesCounts } = useMultipleProductsSalesStats(allProductIds);

  useEffect(() => {
    setMaxPricePage((page) => Math.min(page, Math.max(1, Math.ceil(marketplaceMaxProductsEntries.length / maxMarketplaceEntriesPerPage))));
  }, [marketplaceMaxProductsEntries.length]);

  useEffect(() => {
    setMaxProfitPage((page) => Math.min(page, Math.max(1, Math.ceil(marketplaceMaxProfitEntries.length / maxMarketplaceEntriesPerPage))));
  }, [marketplaceMaxProfitEntries.length]);
  
  const filteredProjectionProducts = useMemo(() => {
    return effectiveProducts.filter((product) => {
      if (!projectionSearch) return true;
      const search = normalizeText(projectionSearch);
      const nameMatch = normalizeText(product.name || '').includes(search);
      const skuMatch = normalizeText(product.sku || '').includes(search);
      return nameMatch || skuMatch;
    });
  }, [effectiveProducts, projectionSearch]);
  const safeSelectedProductIndex = filteredProjectionProducts.length === 0
    ? 0
    : Math.min(selectedProductIndex, filteredProjectionProducts.length - 1);
  const selectedProduct = filteredProjectionProducts[safeSelectedProductIndex];
  const globalSummaryMetrics = useMemo(() => {
    // Usar dados reais do Bling se disponíveis
    const totalSales = blingFinancialSummary.total_sales;
    const totalProfit = blingFinancialSummary.total_profit;
    const totalExpenses = blingFinancialSummary.estimated_expenses;
    
    // Calcular taxa de inatividade do Enjoei
    const enjoeiProducts = effectiveProducts.filter(p => p.marketplace === 'enjoei');
    const enjoeiAccounts = new Set(enjoeiProducts.map(p => p.accountHolder));
    let inactivityFee = 0;
    enjoeiAccounts.forEach(holder => {
      const holderProducts = enjoeiProducts.filter(p => p.accountHolder === holder);
      let maxMonths = 0;
      holderProducts.forEach(p => {
        const m = parseInt(p.enjoeiInactivityMonths || '0');
        if (m > maxMonths) maxMonths = m;
      });
      if (maxMonths >= 6) inactivityFee += 29.99;
      else if (maxMonths >= 2) inactivityFee += 14.99;
    });
    
    return { totalSales, totalProfit, totalExpenses, inactivityFee };
  }, [effectiveProducts, blingFinancialSummary]);
  const globalSummaryOverview = (
    <>
      <div className="rounded-lg bg-black/20 border border-white/10 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-black/30 rounded-lg p-3 border border-white/5 dark:border-zinc-800/40">
              <p className="text-xs text-white/60 uppercase mb-1">Lucro</p>
              <p className="text-base font-bold text-white whitespace-nowrap">R$ {formatMoney(globalSummaryMetrics.totalProfit)}</p>
              {globalSummaryMetrics.inactivityFee > 0 && (
                <p className="text-[10px] text-red-300 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Deduzido R$ {formatMoney(globalSummaryMetrics.inactivityFee)} (Inatividade)
                </p>
              )}
            </div>
            <div className="bg-black/30 rounded-lg p-3 border border-white/5 dark:border-zinc-800/40">
              <p className="text-xs text-white/60 uppercase mb-1">Total de Vendas</p>
              <p className="text-base font-bold text-white whitespace-nowrap">{globalSummaryMetrics.totalSales}</p>
            </div>
          </div>
          <div className="bg-black/30 rounded-lg p-3 border border-white/5 dark:border-zinc-800/40">
            <p className="text-xs text-white/60 uppercase mb-1">Total de Despesas</p>
            <p className="text-base font-bold text-white whitespace-nowrap">R$ {formatMoney(globalSummaryMetrics.totalExpenses)}</p>
          </div>
        </div>
      </div>

      {/* Customer Lifetime Value — KPIs */}
      <div className="rounded-xl bg-black/25 border border-white/10 p-4 mt-4 backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 rounded-lg bg-blue-500/20 border border-blue-400/30">
            <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <p className="text-xs uppercase font-bold tracking-widest text-white">Customer Lifetime Value</p>
            <p className="text-[10px] text-white/40">Análise de valor dos clientes</p>
          </div>
        </div>
        {clvLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => <div key={i} className="h-16 rounded-lg bg-white/10 animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-black/30 border border-blue-400/20 rounded-lg p-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <DollarSign className="w-3 h-3 text-blue-400" aria-hidden="true" />
                <p className="text-[10px] text-white/50 uppercase tracking-wide">LTV Médio</p>
              </div>
              <p className="text-sm font-bold text-white">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(clvData.avgLifetimeValue)}</p>
            </div>
            <div className="bg-black/30 border border-green-400/20 rounded-lg p-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <svg className="w-3 h-3 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <p className="text-[10px] text-white/50 uppercase tracking-wide">Ticket Médio</p>
              </div>
              <p className="text-sm font-bold text-white">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(clvData.avgOrderValue)}</p>
            </div>
            <div className="bg-black/30 border border-purple-400/20 rounded-lg p-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <TrendingUp className="w-3 h-3 text-purple-400" aria-hidden="true" />
                <p className="text-[10px] text-white/50 uppercase tracking-wide">Pedidos/Cliente</p>
              </div>
              <p className="text-sm font-bold text-white">{clvData.avgOrdersPerCustomer.toFixed(1)}</p>
            </div>
            <div className="bg-black/30 border border-[#fe2c55]/20 rounded-lg p-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <svg className="w-3 h-3 text-[#fe2c55]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p className="text-[10px] text-white/50 uppercase tracking-wide">Taxa Recompra</p>
              </div>
              <p className="text-sm font-bold text-white">{clvData.repeatCustomerRate.toFixed(1)}%</p>
            </div>
          </div>
        )}
      </div>

      <div className="my-6 border-t border-white/30" />
      {/* Análise de Lucro + Produtos Mais Lucrativos — grid 2 colunas */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-6">
      {/* Análise de Lucro - Breakdown de Custos */}
      <div className="rounded-xl bg-black/25 border border-white/10 p-4 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs uppercase font-bold tracking-widest text-white flex items-center gap-2">
            <DollarSign className="w-3.5 h-3.5 text-white/80" />
            Análise de Lucro
          </p>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
            profitAnalysis.profitMargin >= 20
              ? 'bg-green-400/20 text-green-300 border-green-400/30'
              : profitAnalysis.profitMargin >= 15
              ? 'bg-[#fe2c55]/20 text-[#fe2c55] border-[#fe2c55]/30'
              : 'bg-red-400/20 text-red-200 border-red-400/30'
          }`}>
            {profitAnalysis.profitMargin.toFixed(1)}% margem
          </span>
        </div>

        {/* Stacked progress bar */}
        <div
          className="relative h-9 rounded-full overflow-hidden bg-white/10 mb-2"
          role="img"
          aria-label={`Custo ${profitAnalysis.costPercentage.toFixed(1)}%, Comissão ${profitAnalysis.commissionPercentage.toFixed(1)}%, Lucro ${profitAnalysis.profitPercentage.toFixed(1)}%`}
        >
          <div
            className="absolute h-full bg-blue-500 transition-all duration-700 flex items-center justify-center"
            style={{ width: `${profitAnalysis.costPercentage}%` }}
          >
            {profitAnalysis.costPercentage > 12 && (
              <span className="text-white text-[10px] font-bold drop-shadow">{profitAnalysis.costPercentage.toFixed(1)}%</span>
            )}
          </div>
          <div
            className="absolute h-full bg-orange-500 transition-all duration-700 flex items-center justify-center"
            style={{ left: `${profitAnalysis.costPercentage}%`, width: `${profitAnalysis.commissionPercentage}%` }}
          >
            {profitAnalysis.commissionPercentage > 6 && (
              <span className="text-white text-[10px] font-bold drop-shadow">{profitAnalysis.commissionPercentage.toFixed(1)}%</span>
            )}
          </div>
          <div
            className="absolute h-full bg-green-500 transition-all duration-700 flex items-center justify-center"
            style={{ left: `${profitAnalysis.costPercentage + profitAnalysis.commissionPercentage}%`, width: `${profitAnalysis.profitPercentage}%` }}
          >
            {profitAnalysis.profitPercentage > 8 && (
              <span className="text-white text-[10px] font-bold drop-shadow">{profitAnalysis.profitPercentage.toFixed(1)}%</span>
            )}
          </div>
        </div>

        {/* Legenda */}
        <div className="flex items-center justify-center gap-4 text-[10px] mb-4">
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500" /><span className="text-white/80">Custo ({profitAnalysis.costPercentage.toFixed(1)}%)</span></div>
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-orange-500" /><span className="text-white/80">Comissão ({profitAnalysis.commissionPercentage.toFixed(1)}%)</span></div>
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-green-500" /><span className="text-white/80">Lucro ({profitAnalysis.profitPercentage.toFixed(1)}%)</span></div>
        </div>

        {/* Grid de valores — fundo escuro para contraste */}
        <div className="grid grid-cols-3 gap-2 text-xs mb-3">
          <div className="bg-black/30 border border-white/10 rounded-lg p-2.5 text-center">
            <p className="text-white/50 mb-1 uppercase tracking-wide text-[9px]">Custo</p>
            <p className="font-bold text-white text-sm">R$ {formatMoney(profitAnalysis.totalCost)}</p>
          </div>
          <div className="bg-black/30 border border-white/10 rounded-lg p-2.5 text-center">
            <p className="text-white/50 mb-1 uppercase tracking-wide text-[9px]">Comissão</p>
            <p className="font-bold text-white text-sm">R$ {formatMoney(profitAnalysis.totalCommissions)}</p>
          </div>
          <div className="bg-black/30 border border-green-400/20 rounded-lg p-2.5 text-center">
            <p className="text-white/50 mb-1 uppercase tracking-wide text-[9px]">Lucro</p>
            <p className="font-bold text-green-300 text-sm">R$ {formatMoney(profitAnalysis.totalProfit)}</p>
          </div>
        </div>

        {/* Alerta de margem */}
        {profitAnalysis.profitMargin < 20 && profitAnalysis.totalRevenue > 0 && (
          <div className={`rounded-lg p-2.5 text-[10px] flex items-start gap-2 mb-3 ${
            profitAnalysis.profitMargin < 15
              ? 'bg-red-900/40 border border-red-400/40 text-red-200'
              : 'bg-[#fe2c55]/20 border border-[#fe2c55]/40 text-pink-200'
          }`}>
            <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
            <span>
              {profitAnalysis.profitMargin < 15
                ? `Margem crítica! ${profitAnalysis.profitMargin.toFixed(1)}% está abaixo do mínimo recomendado (15%).`
                : `Margem de ${profitAnalysis.profitMargin.toFixed(1)}%. Ideal seria acima de 20% para maior sustentabilidade.`}
            </span>
          </div>
        )}

        {/* Frete e outras despesas */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/10 text-[11px]">
          <div className="flex justify-between items-center">
            <span className="text-white/50">Frete Total</span>
            <span className="font-semibold text-white">R$ {formatMoney(profitAnalysis.totalShipping)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-white/50">Outras Despesas</span>
            <span className="font-semibold text-white">R$ {formatMoney(profitAnalysis.totalExpenses)}</span>
          </div>
        </div>
      </div>

      {/* Produtos Mais Lucrativos */}
      <div className="flex flex-col gap-4">
      <div className="rounded-xl bg-black/25 border border-white/10 p-4 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs uppercase font-bold tracking-widest text-white flex items-center gap-2">
            <TrendingUp className="w-3.5 h-3.5 text-white/80" />
            Produtos Mais Lucrativos
          </p>
          <span className="text-xs text-white/50">Top 5</span>
        </div>

        {topProductsLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 rounded-lg bg-white/10 animate-pulse" />
            ))}
          </div>
        ) : topProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-white/40">
            <Package className="w-8 h-8 mb-2" />
            <p className="text-xs">Nenhum dado disponível</p>
          </div>
        ) : (
          <div className="space-y-2">
            {topProducts.map((product, index) => {
              const rankColors = [
                { bg: 'bg-[#fe2c55]/20', border: 'border-[#fe2c55]/40', text: 'text-[#fe2c55]', dot: 'bg-gradient-to-br from-[#fe2c55] to-[#d91c42]' },
                { bg: 'bg-zinc-400/15', border: 'border-zinc-400/30', text: 'text-zinc-300', dot: 'bg-gradient-to-br from-zinc-300 to-zinc-500' },
                { bg: 'bg-orange-400/15', border: 'border-orange-400/30', text: 'text-orange-300', dot: 'bg-gradient-to-br from-orange-400 to-orange-600' },
                { bg: 'bg-white/5', border: 'border-white/10', text: 'text-white/60', dot: 'bg-white/30' },
                { bg: 'bg-white/5', border: 'border-white/10', text: 'text-white/60', dot: 'bg-white/30' },
              ];
              const rank = rankColors[index] ?? rankColors[4];
              return (
                <div key={product.productName} className={`flex items-center gap-3 rounded-lg p-2.5 border ${rank.bg} ${rank.border}`}>
                  {/* Rank badge */}
                  <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-black text-white ${rank.dot}`}>
                    {index + 1}
                  </div>
                  {/* Imagem ou placeholder */}
                  {product.productImageUrl ? (
                    <img src={product.productImageUrl} alt={product.productName} className="w-8 h-8 rounded object-cover flex-shrink-0 border border-white/10" />
                  ) : (
                    <div className="w-8 h-8 rounded bg-white/10 flex-shrink-0 flex items-center justify-center">
                      <Package className="w-4 h-4 text-white/30" />
                    </div>
                  )}
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white truncate">{product.productName}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-white/50">{product.totalQuantity} vendas</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${rank.bg} ${rank.border} ${rank.text}`}>
                        {product.avgMargin.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  {/* Lucro */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-bold text-green-300">R$ {formatMoney(product.totalProfit)}</p>
                    <p className="text-[10px] text-white/40">lucro</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {/* Performance por Marketplace */}
      <div className="rounded-xl overflow-hidden">
        <MarketplacePerformanceCard organizationId={organizationId ?? ''} />
      </div>
      </div>{/* fim col2 flex */}
      </div>{/* fim grid 2 colunas análise + produtos */}

      <div className="grid gap-6 xl:grid-cols-2 mb-6">
        <div className="rounded-lg bg-black/20 border border-white/10 p-3 h-full flex flex-col">
          <div className="space-y-3 flex-1">
            <div className="rounded-lg bg-black/20 border border-white/10 p-3">
              <p className="text-xs uppercase font-semibold tracking-wide">Total de produtos por marketplace</p>
              <div className="mt-2 space-y-1 text-sm">
                {Object.keys(marketplaceTotals).length === 0 ? (
                  <span className="text-white/80">Nenhum produto cadastrado</span>
                ) : (
                  Object.entries(marketplaceTotals).map(([label, total]) => (
                    <div key={label} className="flex items-center justify-between">
                      <span>{label}</span>
                      <span className="font-bold">{total}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="rounded-lg bg-black/20 border border-white/10 p-3">
              <p className="text-xs uppercase font-semibold tracking-wide">Capital de giro disponível</p>
              <p className="mt-2 text-lg font-bold">R$ {formatMoney(parseCurrency(workingCapital || 0))}</p>
            </div>
            <div className="rounded-lg bg-black/20 border border-white/10 p-3">
              <p className="text-xs uppercase font-semibold tracking-wide">Reserva de emergência</p>
              <p className="mt-2 text-lg font-bold">R$ {formatMoney(parseCurrency(emergencyReserve || 0))}</p>
            </div>
            <div className="rounded-lg bg-black/20 border border-white/10 p-3">
              <p className="text-xs uppercase font-semibold tracking-wide">Capital de Marketing</p>
              <p className="mt-2 text-lg font-bold">R$ {formatMoney(remainingMarketingCapital)}</p>
              <p className="mt-1 text-[10px] text-white/80">Investimento total: R$ {formatMoney(totalMarketingInvestment)}</p>
            </div>
            <div className="my-6 border-t border-white/30" />
            <div className="rounded-lg bg-black/20 border border-white/10 p-3">
              <p className="text-xs uppercase font-semibold tracking-wide">Investimento Bruto</p>
              <p className="mt-2 text-lg font-bold">R$ {formatMoney(parseCurrency(contextGrossInvestment || 0))}</p>
            </div>
            <div className="rounded-lg bg-black/20 border border-white/10 p-3">
              <p className="text-xs uppercase font-semibold tracking-wide">Investimento Líquido</p>
              <p className="mt-2 text-lg font-bold">R$ {formatMoney(0)}</p>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-4 h-full">
          <div className="rounded-lg bg-black/30 p-3 flex-1">
            <p className="text-xs uppercase font-semibold tracking-wide mb-3">Maior preço por marketplace</p>
            <div className="space-y-2 text-sm">
              {Object.keys(marketplaceMaxProducts).length === 0 ? (
                <span className="text-white/80">Sem preços para exibir</span>
              ) : (
                marketplaceMaxProductsPageItems.map(([label, item]) => (
                  <div key={label} className="flex items-center gap-3 border-b border-white/10 dark:border-zinc-800/50 pb-2 last:border-0 hover:bg-white/5 p-2 rounded-lg transition-colors">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name || label} className="h-20 w-20 flex-shrink-0 rounded-md object-cover border border-white/20 dark:border-zinc-800/60" />
                    ) : (
                      <div className="h-20 w-20 flex-shrink-0 rounded-md border border-white/20 dark:border-zinc-800/60 bg-white/10" />
                    )}
                    <div className="flex-1 min-w-0 grid grid-cols-2 gap-4 items-center">
                      <div className="flex flex-col justify-center transition-all duration-200 max-md:opacity-0 max-md:invisible max-md:max-h-0 max-md:overflow-hidden">
                        <p className="text-xs font-bold text-white truncate mb-0.5" title={item.name}>{item.name ? item.name : '-'}</p>
                        <p className="text-[10px] text-white/60 leading-tight block whitespace-nowrap" title={label}>
                          {formatMarketplaceDisplayLabel(label)}
                        </p>
                        {item.accountHolder && (
                          <p className="text-[10px] text-white/60 leading-tight block whitespace-nowrap mt-0.5">
                            {item.accountHolder.split(' ')[0]} - {
                              label === 'amazon'
                                ? (item.amazonPlan === 'individual' ? 'Individual' : 'Profissional')
                                : label === 'enjoei'
                                  ? (item.enjoeiAdType === 'turbinado' ? 'Turbinado' : 'Clássico')
                                  : (item.accountType || 'CPF').toUpperCase()
                            }
                          </p>
                        )}
                        <p className="text-xs font-bold text-white whitespace-nowrap mt-1">R$ {formatMoney(item.price)}</p>
                        <p className="text-[10px] text-white/80 whitespace-nowrap">
                          Vendas: {salesCounts[item.productId] || 0}
                        </p>
                      </div>
                      <div className="text-right" />
                    </div>
                  </div>
                ))
              )}
            </div>
            {marketplaceMaxProductsPages > 1 && (
              <div className="mt-2 flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-6 w-6 border-white/20 bg-white/10 text-white hover:bg-white/20"
                  disabled={maxPricePage === 1}
                  onClick={() => setMaxPricePage((page) => Math.max(1, page - 1))}
                >
                  <ChevronLeft className="h-3 w-3" />
                </Button>
                <span className="text-[10px] text-white/80">
                  {maxPricePage} / {marketplaceMaxProductsPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-6 w-6 border-white/20 bg-white/10 text-white hover:bg-white/20"
                  disabled={maxPricePage === marketplaceMaxProductsPages}
                  onClick={() => setMaxPricePage((page) => Math.min(marketplaceMaxProductsPages, page + 1))}
                >
                  <ChevronRight className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
          <div className="rounded-lg bg-black/30 p-3 flex-1">
            <p className="text-xs uppercase font-semibold tracking-wide mb-3">Maior lucro por marketplace</p>
            <div className="space-y-2 text-sm">
              {Object.keys(marketplaceMaxProfitProducts).length === 0 ? (
                <span className="text-white/80">Sem dados de lucro para exibir</span>
              ) : (
                marketplaceMaxProfitPageItems.map(([label, item]) => (
                  <div key={label} className="flex items-center gap-3 border-b border-white/10 dark:border-zinc-800/50 pb-2 last:border-0 hover:bg-white/5 p-2 rounded-lg transition-colors">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name || label} className="h-20 w-20 flex-shrink-0 rounded-md object-cover border border-white/20 dark:border-zinc-800/60" />
                    ) : (
                      <div className="h-20 w-20 flex-shrink-0 rounded-md border border-white/20 dark:border-zinc-800/60 bg-white/10" />
                    )}
                    <div className="flex-1 min-w-0 grid grid-cols-2 gap-4 items-center">
                      <div className="flex flex-col justify-center transition-all duration-200 max-md:opacity-0 max-md:invisible max-md:max-h-0 max-md:overflow-hidden">
                        <p className="text-xs font-bold text-white truncate mb-0.5" title={item.name}>{item.name ? item.name : '-'}</p>
                        <p className="text-[10px] text-white/60 leading-tight block whitespace-nowrap" title={label}>
                          {formatMarketplaceDisplayLabel(label)}
                        </p>
                        {item.accountHolder && (
                          <p className="text-[10px] text-white/60 leading-tight block whitespace-nowrap mt-0.5">
                            {item.accountHolder.split(' ')[0]} - {
                              label === 'amazon'
                                ? (item.amazonPlan === 'individual' ? 'Individual' : 'Profissional')
                                : label === 'enjoei'
                                  ? (item.enjoeiAdType === 'turbinado' ? 'Turbinado' : 'Clássico')
                                  : (item.accountType || 'CPF').toUpperCase()
                            }
                          </p>
                        )}
                        <p className="text-xs font-bold text-white whitespace-nowrap mt-1">R$ {formatMoney(item.profit)}</p>
                        <p className="text-[10px] text-white/80 whitespace-nowrap">
                          Vendas: {salesCounts[item.productId] || 0}
                        </p>
                      </div>
                      <div className="text-right" />
                    </div>
                  </div>
                ))
              )}
            </div>
            {marketplaceMaxProfitPages > 1 && (
              <div className="mt-2 flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-6 w-6 border-white/20 bg-white/10 text-white hover:bg-white/20"
                  disabled={maxProfitPage === 1}
                  onClick={() => setMaxProfitPage((page) => Math.max(1, page - 1))}
                >
                  <ChevronLeft className="h-3 w-3" />
                </Button>
                <span className="text-[10px] text-white/80">
                  {maxProfitPage} / {marketplaceMaxProfitPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-6 w-6 border-white/20 bg-white/10 text-white hover:bg-white/20"
                  disabled={maxProfitPage === marketplaceMaxProfitPages}
                  onClick={() => setMaxProfitPage((page) => Math.min(marketplaceMaxProfitPages, page + 1))}
                >
                  <ChevronRight className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );

  // Persist selected product in Profit Projection
  useEffect(() => {
    if (selectedProduct?.id) {
      localStorage.setItem('lastSelectedProductId', selectedProduct.id);
    }
  }, [selectedProduct?.id]);

  useEffect(() => {
    if (effectiveProducts.length > 0) {
      const lastId = localStorage.getItem('lastSelectedProductId');
      if (lastId) {
        const index = filteredProjectionProducts.findIndex(p => p.id === lastId);
        if (index !== -1) {
          setSelectedProductIndex(index);
        }
      }
    }
  }, [effectiveProducts, filteredProjectionProducts]); // Re-run when products load

  const handleDeleteProduct = async (productId: string) => {
    const toastId = toast.loading('Excluindo produto...');
    setIsProductsLoading(true);
    const productToDelete = products.find((product) => product.id === productId);
    const skuKey = productToDelete?.sku?.trim();

    try {
      await ProductService.delete(productId);
      const list = await ProductService.getAll(organizationId ?? undefined);
      handleProductsResponse(list);
      
      // Remover do registeredBlingBySku se tiver SKU
      if (skuKey && registeredBlingBySku[skuKey]) {
        const idsToRemove = registeredBlingBySku[skuKey];
        setRegisteredBlingIds((prev) => {
          const next = new Set(prev);
          idsToRemove.forEach((id) => next.delete(id));
          return next;
        });
        setRegisteredBlingBySku((prev) => {
          const next = { ...prev };
          delete next[skuKey];
          return next;
        });
      }
      toast.success('Produto excluído com sucesso!', { id: toastId });
    } catch (error: unknown) {
      setIsProductsLoading(false);
      const msg = error instanceof Error ? error.message : "Não foi possível excluir o produto.";
      toast.error('Erro ao excluir produto', {
        id: toastId,
        description: msg,
      });
    }
  };

  const handleDeleteProductAnimated = (productId: string) => {
    const target = `[data-product-id="${productId}"]`;
    const element = container.current?.querySelector(target);
    
    if (!element) {
      void handleDeleteProduct(productId);
      return;
    }
    
    // Animação de saída aprimorada (Slide Out + Fade + Scale)
    gsap.to(target, {
      opacity: 0,
      x: -50,
      height: 0,
      marginBottom: 0,
      padding: 0,
      scale: 0.9,
      duration: 0.4,
      ease: "power2.inOut",
      onComplete: () => { void handleDeleteProduct(productId); }
    });
  };

  useEffect(() => {
    // if (!effectiveAccessToken) return;
    console.log('[DEBUG Products Page] useEffect triggered, organizationId:', organizationId);
    if (!organizationId) {
      console.log('[DEBUG Products Page] No organizationId, skipping loadProducts');
      return;
    }
    const timeoutId = window.setTimeout(() => {
      console.log('[DEBUG Products Page] Calling loadProducts...');
      void loadProducts();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [organizationId, loadProducts]);

  useEffect(() => {
    const previousIds = prevProductIds.current;
    const currentIds = new Set(effectiveProducts.map((product) => product.id));
    const newIds = effectiveProducts
      .filter((product) => !previousIds.has(product.id))
      .map((product) => `[data-product-id="${product.id}"]`);

    if (newIds.length > 0) {
      gsap.fromTo(newIds, {
        opacity: 0,
        y: 16,
        scale: 0.97
      }, {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.35,
        ease: "back.out(1.7)",
        clearProps: "all"
      });
    }

    prevProductIds.current = currentIds;
  }, [effectiveProducts]);

  useGSAP(() => {
    // Animate Result Cards on Calculation Update
    if (calculations) {
      if (!prevCalculations.current) {
        // First time appearance (Entrance) - Right to Left
        gsap.from(".result-card-animate", {
          x: 100,
          opacity: 0,
          duration: 0.6,
          ease: "power3.out",
          clearProps: "all"
        });
      } else {
        // Update - Subtle scale
        gsap.from(".result-card-animate", {
          scale: 0.98,
          duration: 0.2,
          ease: "power2.out",
          clearProps: "all"
        });
      }
    }
    prevCalculations.current = calculations;
  }, { scope: container, dependencies: [calculations] });

  // Track if initial animations have run
  const hasAnimatedRef = useRef(false);

  useGSAP(() => {
    // Only run animations on first mount
    if (hasAnimatedRef.current) return;
    hasAnimatedRef.current = true;

    // Animate Header
    gsap.from(".header-animate", {
      y: -30,
      opacity: 0,
      duration: 0.8,
      ease: "power3.out"
    });

    // Animate Main Cards and Sections
    gsap.from(".animate-on-scroll", {
      y: 50,
      opacity: 0,
      duration: 0.8,
      stagger: 0.2,
      ease: "power3.out",
      delay: 0.2
    });

    // Animate Form Elements with Fade In
    gsap.from(".animate-fadeIn", {
        opacity: 0,
        x: -20,
        duration: 0.5,
        stagger: 0.1,
        ease: "power2.out",
        delay: 0.5
    });
  }, { scope: container });

  return (
    <div className="min-h-screen bg-black relative overflow-hidden font-sans" ref={container}>
      <Dialog open={isGlobalSummaryOpen} onOpenChange={setIsGlobalSummaryOpen}>
        <DialogContent className="max-w-5xl bg-[#0d0d0d] text-white border border-white/10 max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-0 flex-shrink-0">
            <DialogTitle>Resumo Financeiro Geral</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 px-6 pb-6 scrollbar-thin scrollbar-thumb-white/30 scrollbar-track-white/10 hover:scrollbar-thumb-white/50">
            {globalSummaryOverview}
          </div>
        </DialogContent>
      </Dialog>
      {/* Video Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
         <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black z-10" />
         <video
            autoPlay
            loop
            muted
            playsInline
            preload="none"
            className="w-full h-full object-cover opacity-30 mix-blend-overlay"
            src={videoBackground}
          />
       </div>

      <div className="relative z-10 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
        <div className="grid md:grid-cols-2 gap-4 items-center mb-8 header-animate">
          <div className="flex justify-center md:justify-start">
             <img 
                src={logo} 
                alt="Alob Express" 
                className="h-12 w-auto object-contain glitch-hover cursor-pointer" 
                onClick={() => window.location.reload()} 
             />
          </div>
          <div className="text-center md:text-right">
             <p className="text-gray-300 text-xl font-medium font-iceland">Calculadora de Precificação Dropshipping Nacional <span className="text-sm text-gray-500 font-normal">v2.8.0</span></p>
             <p className="text-sm text-gray-400 mt-1">Taxas reais atualizadas de Marketplaces 2026</p>
          </div>
        </div>

        {!showOnlyProducts && (
        <div className="flex justify-end mb-6">
          <Button
            type="button"
            onClick={handleNavigateToProductsButton}
            className="
              relative overflow-hidden
              bg-[#fe2c55] hover:bg-[#d91c42] text-white font-semibold text-xs uppercase tracking-wide px-4 py-2 h-8
              before:absolute before:inset-0
              before:bg-gradient-to-r before:from-transparent before:via-white/30 before:to-transparent
              before:translate-x-[-200%]
              hover:before:translate-x-[200%]
              before:transition-transform before:duration-700
              hover:shadow-lg hover:shadow-[#fe2c55]/50
              transition-shadow duration-300
            "
          >
            Resumo Financeiro Geral
          </Button>
        </div>
        )}
        {!showOnlyProducts && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Painel de Entrada */}
            <Card className="shadow-xl animate-on-scroll backdrop-blur-xl bg-white/95 dark:bg-gray-900/95 border border-white/20 dark:border-gray-700/20 will-change-transform">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <div className="flex flex-row items-center gap-2">
                   <Calculator className="w-6 h-6 text-blue-600" />
                   <CardTitle className="text-2xl font-bold text-gray-800 dark:text-white font-iceland">Dados do Produto</CardTitle>
                </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => handleResetProductDraft()}
                  size="sm"
                  variant="outline"
                  className="border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-zinc-700 dark:text-white dark:hover:bg-zinc-800"
                >
                  Resetar
                </Button>
                <GradientButton
                  onClick={handleSaveProduct}
                  disabled={isSaveDisabled}
                  loading={isSavingProduct}
                  icon={<Plus className="w-4 h-4" />}
                  className="min-h-[44px]"
                >
                  Adicionar
                </GradientButton>
              </div>
            </CardHeader>
            <CardContent className="space-y-5 pt-4">
              {/* Feedback Messages - Agora usando Toasts (Sonner) */}
              <ProductInfo 
                productName={productName}
                setProductName={setProductName}
                productImage={productImage}
                setProductImage={setProductImage}
                productDescription={productDescription}
                setProductDescription={setProductDescription}
                productSku={productSku}
                setProductSku={setProductSku}
                stockQuantity={stockQuantity}
                setStockQuantity={setStockQuantity}
                weight={weight}
                setWeight={setWeight}
                width={width}
                setWidth={setWidth}
                height={height}
                setHeight={setHeight}
                depth={depth}
                setDepth={setDepth}
                operationMode={operationMode}
                handleOperationModeChange={handleOperationModeChange}
                returnRate={returnRate}
                setReturnRate={setReturnRate}
                handleFloatInput={handleFloatInput}
                deliveryMode={deliveryMode}
                handleDeliveryModeChange={handleDeliveryModeChange}
                deliveryLogistics={deliveryLogistics}
                setDeliveryLogistics={setDeliveryLogistics}
                productCondition={productCondition}
                setProductCondition={setProductCondition}
                marketplace={marketplace}
                accountHolder={accountHolder}
                setAccountHolder={setAccountHolder}
                accountType={accountType}
                setAccountType={setAccountType}
                supplierName={supplierName}
                supplier_id={supplier_id}
                setSupplier_id={setSupplier_id}
                handleSupplierChange={handleSupplierChange}
                suppliersList={suppliersList}
                accountHoldersList={accountHoldersList}
              />
              <MarketplaceConfig 
                marketplace={marketplace}
                handleMarketplaceChange={handleMarketplaceChange}
                marketplacesList={marketplacesList}
              />
              {marketplace === 'facebook' && (
                <div className="grid w-full max-w-sm items-center gap-1.5 animate-fadeIn">
                  <Label className="text-sm font-semibold text-gray-800 dark:text-white">
                    Forma de entrega
                  </Label>
                  <Select value={facebookDelivery} onValueChange={(val) => setFacebookDelivery(val as 'entrega' | 'retirada')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a entrega" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="entrega">Entrega</SelectItem>
                      <SelectItem value="retirada">Retirada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}



              <div className="grid w-full max-w-sm items-center gap-1.5 animate-fadeIn mt-6">
                <Label htmlFor="costPrice" className="text-base font-bold !text-red-500">
                  Preço de Custo do Fornecedor
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-semibold">
                    R$
                  </span>
                  <Input
                    id="costPrice"
                    type="text"
                    inputMode="decimal"
                    value={costPrice}
                    onChange={handleCostPriceChange}
                    className="pl-10 text-xl font-bold border border-red-400 focus:border-red-500"
                    placeholder="0,00"
                    step="0.01"
                  />
                </div>
              </div>

              {/* Preço de Venda Manual */}
              <div className="grid w-full max-w-sm items-center gap-1.5 animate-fadeIn">
                <Label htmlFor="manualSellingPrice" className="text-base font-bold !text-blue-600">
                  Preço de venda
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-semibold">
                    R$
                  </span>
                  <Input
                    id="manualSellingPrice"
                    type="text"
                    inputMode="decimal"
                    value={manualSellingPrice}
                    onChange={handleManualSellingPriceChange}
                    className="pl-10 text-xl border border-blue-400 focus:border-blue-600 font-bold"
                    placeholder="0,00"
                    step="0.01"
                  />
                </div>
              </div>

              {/* Markup */}
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label className="text-sm font-semibold text-gray-800 dark:text-white">
                  Markup
                </Label>
                <Select value={markupMultiplier} onValueChange={setMarkupMultiplier}>
                  <SelectTrigger id="markupMultiplier">
                    <SelectValue placeholder="Selecione o markup" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="-3,0">-3.00x (Markup Negativo)</SelectItem>
                    <SelectItem value="-2,0">-2.00x (Markup Negativo)</SelectItem>
                    <SelectItem value="-1,5">-1.50x (Markup Negativo)</SelectItem>
                    <SelectItem value="-1,25">-1.25x (Markup Negativo)</SelectItem>
                    <SelectItem value="0">0 (Automático / Margem Recomendada)</SelectItem>
                    <SelectItem value="1">1.0x</SelectItem>
                    <SelectItem value="1,25">1.25x</SelectItem>
                    <SelectItem value="1,5">1.5x</SelectItem>
                    <SelectItem value="1,75">1.75x</SelectItem>
                    <SelectItem value="2">2.0x</SelectItem>
                    <SelectItem value="3">3.0x</SelectItem>
                    <SelectItem value="4">4.0x</SelectItem>
                    <SelectItem value="5">5.0x</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-gray-500">Define o preço sugerido multiplicando o custo.</p>
              </div>

              {/* Variações Checkbox */}
              <div className="flex items-center space-x-2 bg-gray-50 p-3 rounded-lg border border-gray-100 dark:bg-[#FF3366]">
                <Checkbox 
                  id="hasVariations" 
                  checked={hasVariations}
                  onCheckedChange={(checked) => setHasVariations(checked as boolean)}
                />
                <Label htmlFor="hasVariations" className="font-bold !text-gray-800 cursor-pointer dark:!text-white">
                  É produto com variação?
                </Label>
              </div>

              {/* Área de Variações */}
              {hasVariations && (
                <div className="space-y-3 animate-fadeIn">
                  <div className="grid grid-cols-6 gap-2">
                    <Select value={variationType} onValueChange={(val) => setVariationType(val as 'color' | 'size')}>
                      <SelectTrigger className="text-xs">
                        <SelectValue placeholder="Tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="color">Cor</SelectItem>
                        <SelectItem value="size">Tamanho</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input 
                      placeholder={variationType === 'color' ? 'Cor (ex: #FF0000)' : 'Tamanho (ex: P)'}
                      value={variationName}
                      onChange={(e) => setVariationName(e.target.value)}
                      className="text-xs"
                    />
                    <Input 
                      placeholder="SKU Variação"
                      value={variationSku}
                      onChange={(e) => setVariationSku(e.target.value)}
                      className="text-xs"
                    />
                    <Input 
                      type="number"
                      inputMode="numeric"
                      placeholder="Estoque"
                      value={variationStock}
                      onChange={(e) => setVariationStock(e.target.value)}
                      className="text-xs"
                    />
                    <Input 
                      type="text"
                      inputMode="decimal" 
                      placeholder="Custo (R$)" 
                      value={variationCost}
                      onChange={(e) => handleCurrencyChange(e, setVariationCost)}
                      className="text-xs"
                    />
                    <Input 
                      type="text"
                      inputMode="decimal" 
                      placeholder="Markup" 
                      value={variationMarkup}
                      onChange={(e) => handleCurrencyChange(e, setVariationMarkup)}
                      className="text-xs"
                    />
                  </div>
                  <Button onClick={addVariation} size="sm" className="w-full bg-[#d91c42] hover:bg-[#b91536]">
                    <Plus className="w-4 h-4 mr-2" /> Adicionar Variação
                  </Button>

                  {variations.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-[10px] text-gray-500 font-semibold">
                        Tipo da variação: {variationType === 'color' ? 'Cor' : 'Tamanho'}
                      </div>
                      <div className="border rounded-md overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50">
                            <TableHead className="h-8 text-xs">Variação</TableHead>
                            <TableHead className="h-8 text-xs">SKU</TableHead>
                            <TableHead className="h-8 text-xs">Estoque</TableHead>
                            <TableHead className="h-8 text-xs">Custo</TableHead>
                            <TableHead className="h-8 text-xs">Preço Venda (Opcional)</TableHead>
                            <TableHead className="h-8 text-xs">Markup</TableHead>
                            <TableHead className="h-8 text-xs w-8"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {variations.map((v) => (
                            <TableRow key={v.id}>
                              <TableCell className="py-2 text-xs font-medium">{v.name}</TableCell>
                              <TableCell className="py-2 text-xs">{v.sku || '-'}</TableCell>
                              <TableCell className="py-2 text-xs">{v.stockQuantity || '-'}</TableCell>
                              <TableCell className="py-2 text-xs">R$ {v.cost}</TableCell>
                              <TableCell className="py-2">
                                {v.manualPrice ? (
                                  <div className="text-[11px] font-semibold text-gray-700">
                                    Preço de venda R$ {v.manualPrice}
                                  </div>
                                ) : null}
                                <Input 
                                  className={v.manualPrice ? "mt-1 h-7 w-24 text-xs bg-background" : "h-7 w-24 text-xs bg-background"} 
                                  placeholder="0,00"
                                  value={v.manualPrice || ''}
                                  onChange={(e) => handleCurrencyChange(e, (val) => {
                                    const shouldLock = parseCurrency(val) > 0;
                                    updateVariation(v.id, { manualPrice: val, manualPriceLocked: shouldLock });
                                  })}
                                />
                              </TableCell>
                              <TableCell className="py-2">
                                <Select value={v.markup} onValueChange={(val) => updateAllVariationsMarkup(val)}>
                                  <SelectTrigger className="h-7 w-24 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {variationMarkupOptions.map((option) => (
                                      <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell className="py-2">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-6 w-6 text-red-500 hover:text-red-700"
                                  onClick={() => removeVariation(v.id)}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Marketplace selection handled above */}

              {/* Preço Mínimo Concorrente */}
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="competitorPrice" className="text-sm font-semibold text-gray-800 dark:text-white">
                  Preço Mínimo Concorrente ({
                    marketplace === 'shopee' ? 'Shopee' : 
                    marketplace === 'mercadolivre' ? 'Mercado Livre' : 
                    marketplace === 'enjoei' ? 'Enjoei' : 
                    marketplace === 'tiktok' ? 'Tiktok Shop' : 'Marketplaces'
                  })
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-semibold">
                    R$
                  </span>
                  <Input
                    id="competitorPrice"
                    type="text"
                    inputMode="decimal"
                    value={competitorPrice}
                    onChange={handleFloatInput(setCompetitorPrice)}
                    className="pl-10 text-lg border-orange-200"
                    placeholder="0,00"
                    step="0.01"
                  />
                </div>
              </div>

              {/* Competitor Markup */}
              {competitorPrice && (
                  <div className="grid w-full max-w-sm items-center gap-1.5 animate-fadeIn mt-1">
                    <Label className="text-sm font-semibold text-gray-800 dark:text-white">
                      Markup sobre Concorrente
                    </Label>
                    <Select value={competitorMarkup} onValueChange={setCompetitorMarkup}>
                      <SelectTrigger className="bg-orange-50 border-orange-200">
                        <SelectValue placeholder="Selecione o markup" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">0 (Automático)</SelectItem>
                        <SelectItem value="-1.5">-1.50x (Mais barato)</SelectItem>
                        <SelectItem value="-1.25">-1.25x (Mais barato)</SelectItem>
                        <SelectItem value="-1.10">-1.10x (Mais barato)</SelectItem>
                        <SelectItem value="-1.05">-1.05x (Mais barato)</SelectItem>
                        <SelectItem value="1">Igual (1.0x)</SelectItem>
                        <SelectItem value="1.05">1.05x (Mais caro)</SelectItem>
                        <SelectItem value="1.10">1.10x (Mais caro)</SelectItem>
                        <SelectItem value="1.25">1.25x (Mais caro)</SelectItem>
                        <SelectItem value="1.5">1.50x (Mais caro)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
              )}

              {/* Configuração de Gateway de Pagamento */}
              <GatewayConfig
                gatewayBank={gatewayBank}
                handleGatewayBankChange={handleGatewayBankChange}
                gatewayMethod={gatewayMethod}
                handleGatewayMethodChange={handleGatewayMethodChange}
                gatewayInstallments={gatewayInstallments}
                handleGatewayInstallmentsChange={handleGatewayInstallmentsChange}
                gatewayFee={gatewayFee}
                setGatewayFee={setGatewayFee}
                gatewayFeeType={gatewayFeeType}
                setGatewayFeeType={setGatewayFeeType}
                gatewayFixedFee={gatewayFixedFee}
                idPrefix="mainGateway"
                gatewayCost={formatMoney(calculations?.gatewayCost || 0)}
              />

              {/* Seletor de Tráfego: Pago vs Orgânico */}
              <TrafficConfig
                trafficMode={trafficMode}
                handleTrafficModeChange={handleTrafficModeChange}
              paidTraffic={paidTraffic}
              setPaidTraffic={setPaidTraffic}
              paidTrafficType={paidTrafficType}
              setPaidTrafficType={setPaidTrafficType}
              organicSubMode={organicSubMode}
              setOrganicSubMode={setOrganicSubMode}
                organicApi={organicApi}
                setOrganicApi={setOrganicApi}
                orgImpressions={orgImpressions}
                setOrgImpressions={setOrgImpressions}
                orgClicks={orgClicks}
                setOrgClicks={setOrgClicks}
                orgSales={orgSales}
                setOrgSales={setOrgSales}
                orgFreq={orgFreq}
                setOrgFreq={setOrgFreq}
                organicChannels={organicChannels}
                setOrganicChannels={setOrganicChannels}
                organicChannelLinks={organicChannelLinks}
                setOrganicChannelLinks={setOrganicChannelLinks}
                organicChannelNames={organicChannelNames}
                setOrganicChannelNames={setOrganicChannelNames}
                orgCostVideo={orgCostVideo}
                setOrgCostVideo={setOrgCostVideo}
                useUploadPostFree={useUploadPostFree}
                setUseUploadPostFree={setUseUploadPostFree}
                selectedKiePlan={selectedKiePlan}
                setSelectedKiePlan={setSelectedKiePlan}
                currentCredits={currentCredits}
                setCurrentCredits={setCurrentCredits}
                selectedAiModel={selectedAiModel}
                setSelectedAiModel={setSelectedAiModel}
                videoDuration={videoDuration}
                setVideoDuration={setVideoDuration}
                // Paid Traffic Gateway Props
                paidTrafficGatewayBank={paidTrafficGatewayBank}
                handlePaidTrafficGatewayBankChange={handlePaidTrafficGatewayBankChange}
                paidTrafficGatewayMethod={paidTrafficGatewayMethod}
                handlePaidTrafficGatewayMethodChange={handlePaidTrafficGatewayMethodChange}
                paidTrafficGatewayInstallments={paidTrafficGatewayInstallments}
                handlePaidTrafficGatewayInstallmentsChange={handlePaidTrafficGatewayInstallmentsChange}
                paidTrafficGatewayFee={paidTrafficGatewayFee}
                setPaidTrafficGatewayFee={setPaidTrafficGatewayFee}
                paidTrafficGatewayFeeType={paidTrafficGatewayFeeType}
                setPaidTrafficGatewayFeeType={setPaidTrafficGatewayFeeType}
                paidTrafficGatewayFixedFee={paidTrafficGatewayFixedFee}
                selectedInfluencerId={selectedInfluencerId}
                setSelectedInfluencerId={setSelectedInfluencerId}
                videoGenerationLlm={videoGenerationLlm}
                setVideoGenerationLlm={setVideoGenerationLlm}
                videoGenerationPlan={videoGenerationPlan}
                setVideoGenerationPlan={setVideoGenerationPlan}
                
                // Paid Metrics Inputs
                paidConversionRate={paidConversionRate}
                setPaidConversionRate={setPaidConversionRate}
                paidCtr={paidCtr}
                setPaidCtr={setPaidCtr}
                adsCPC={adsCPC}
                setAdsCPC={setAdsCPC}
                influencers={influencers}
                setInfluencers={setInfluencers}
                affiliates={affiliates}
                setAffiliates={setAffiliates}
              />




              {/* Taxa de Gateway do Fornecedor */}
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="supplierGatewayFeeValue" className="text-sm font-semibold text-gray-800 dark:text-white">
                    Taxa de Gateway do Fornecedor
                  </Label>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant={supplierGatewayFeeType === 'percent' ? 'default' : 'outline'}
                      onClick={() => setSupplierGatewayFeeType('percent')}
                      className={`h-6 text-xs ${supplierGatewayFeeType === 'percent' ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}`}
                    >
                      %
                    </Button>
                    <Button
                      size="sm"
                      variant={supplierGatewayFeeType === 'fixed' ? 'default' : 'outline'}
                      onClick={() => setSupplierGatewayFeeType('fixed')}
                      className={`h-6 text-xs ${supplierGatewayFeeType === 'fixed' ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}`}
                    >
                      R$
                    </Button>
                  </div>
                </div>
                <div className="relative">
                   {supplierGatewayFeeType === 'fixed' && (
                     <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-semibold">
                       R$
                     </span>
                   )}
                   <Input
                    id="supplierGatewayFeeValue"
                    type="text"
                    inputMode="decimal"
                    value={supplierGatewayFeeType === 'percent' ? supplierGatewayFee : supplierGatewayFixedFee}
                    onChange={(e) => handleCurrencyChange(e, supplierGatewayFeeType === 'percent' ? setSupplierGatewayFee : setSupplierGatewayFixedFee)}
                    placeholder="0,00"
                    className={supplierGatewayFeeType === 'fixed' ? 'pl-8' : ''}
                   />
                   {supplierGatewayFeeType === 'percent' && (
                     <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-semibold">
                       %
                     </span>
                   )}
                </div>
              </div>

              {/* Custos Extras - Only show in non-dropshipping mode */}
              {operationMode !== 'dropshipping' && (
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="packagingCost" className="text-sm font-semibold text-gray-800">
                  Custos embalagem + impressão + Transporte
                </Label>
                <div className="relative">
                   <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                   <Input
                    id="packagingCost"
                    type="text"
                    inputMode="decimal"
                    className="pl-8"
                    value={packagingCost}
                    onChange={(e) => handleCurrencyChange(e, setPackagingCost)}
                    placeholder="0,00"
                   />
                </div>
              </div>
              )}

              <div className="grid w-full max-w-sm items-center gap-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="supplierFeeValue" className="text-sm font-semibold text-gray-800 dark:text-white">
                    Taxa do fornecedor
                  </Label>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant={supplierFeeType === 'percent' ? 'default' : 'outline'}
                      onClick={() => setSupplierFeeType('percent')}
                      className={`h-6 text-xs ${supplierFeeType === 'percent' ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}`}
                    >
                      %
                    </Button>
                    <Button
                      size="sm"
                      variant={supplierFeeType === 'fixed' ? 'default' : 'outline'}
                      onClick={() => setSupplierFeeType('fixed')}
                      className={`h-6 text-xs ${supplierFeeType === 'fixed' ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}`}
                    >
                      R$
                    </Button>
                  </div>
                </div>
                <div className="relative">
                   {supplierFeeType === 'fixed' && (
                     <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-semibold">
                       R$
                     </span>
                   )}
                   <Input
                    id="supplierFeeValue"
                    type="text"
                    inputMode="decimal"
                    value={supplierFeeType === 'percent' ? supplierFeePercent : supplierFixedFee}
                    onChange={(e) => handleCurrencyChange(e, supplierFeeType === 'percent' ? setSupplierFeePercent : setSupplierFixedFee)}
                    placeholder="0,00"
                    className={supplierFeeType === 'fixed' ? 'pl-8' : ''}
                   />
                   {supplierFeeType === 'percent' && (
                     <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-semibold">
                       %
                     </span>
                   )}
                </div>
              </div>




              {/* Opções específicas por marketplace */}
              <ShopeeConfig
                marketplace={marketplace}
                category={category}
                handleShopeeCategoryChange={handleShopeeCategoryChange}
                extraCommission={extraCommission}
                setExtraCommission={setExtraCommission}
                shippingOption={shippingOption}
                setShippingOption={setShippingOption}
                shopeeSellerType={shopeeSellerType}
                shopeeStoreCouponEnabled={shopeeStoreCouponEnabled}
                setShopeeStoreCouponEnabled={setShopeeStoreCouponEnabled}
                shopeeStoreCouponValue={shopeeStoreCouponValue}
                setShopeeStoreCouponValue={setShopeeStoreCouponValue}
                shopeeStoreCouponType={shopeeStoreCouponType}
                setShopeeStoreCouponType={setShopeeStoreCouponType}
                shopeeProductCouponEnabled={shopeeProductCouponEnabled}
                setShopeeProductCouponEnabled={setShopeeProductCouponEnabled}
                shopeeProductCouponValue={shopeeProductCouponValue}
                setShopeeProductCouponValue={setShopeeProductCouponValue}
                shopeeProductCouponType={shopeeProductCouponType}
                setShopeeProductCouponType={setShopeeProductCouponType}
                shopeeFollowerCouponEnabled={shopeeFollowerCouponEnabled}
                setShopeeFollowerCouponEnabled={setShopeeFollowerCouponEnabled}
                shopeeFollowerCouponValue={shopeeFollowerCouponValue}
                setShopeeFollowerCouponValue={setShopeeFollowerCouponValue}
                shopeeFollowerCouponType={shopeeFollowerCouponType}
                setShopeeFollowerCouponType={setShopeeFollowerCouponType}
                shopeeSellerVoucherEnabled={shopeeSellerVoucherEnabled}
                setShopeeSellerVoucherEnabled={setShopeeSellerVoucherEnabled}
                shopeeSellerVoucherValue={shopeeSellerVoucherValue}
                setShopeeSellerVoucherValue={setShopeeSellerVoucherValue}
                shopeeSellerVoucherType={shopeeSellerVoucherType}
                setShopeeSellerVoucherType={setShopeeSellerVoucherType}
                useShopeeAds={useShopeeAds}
                handleShopeeAdsChange={handleShopeeAdsChange}
                adsCPC={adsCPC}
                setAdsCPC={setAdsCPC}
                dailyBudget={dailyBudget}
                setDailyBudget={setDailyBudget}
                salesQuantity={salesQuantity}
                setSalesQuantity={setSalesQuantity}
                shopeeTotalBudget={shopeeTotalBudget}
                setShopeeTotalBudget={setShopeeTotalBudget}
                shopeeStartDate={shopeeStartDate}
                setShopeeStartDate={setShopeeStartDate}
                shopeeEndDate={shopeeEndDate}
                setShopeeEndDate={setShopeeEndDate}
                shopeeAdType={shopeeAdType}
                setShopeeAdType={setShopeeAdType}
                shopeeBidType={shopeeBidType}
                setShopeeBidType={setShopeeBidType}
                shopeeKeywordInput={shopeeKeywordInput}
                setShopeeKeywordInput={setShopeeKeywordInput}
                shopeeKeywords={shopeeKeywords}
                setShopeeKeywords={setShopeeKeywords}
                shopeeMaxCpc={shopeeMaxCpc}
                setShopeeMaxCpc={setShopeeMaxCpc}
                availableMarketingCapital={availableShopeeBudget}
                remainingMarketingCapital={remainingMarketingCapital}
              />

              <MercadoLivreConfig
                marketplace={marketplace}
                hasReputation={hasReputation}
                setHasReputation={setHasReputation}
                reputationLevel={reputationLevel}
                setReputationLevel={setReputationLevel}
                adType={adType}
                setAdType={setAdType}
                category={category}
                setCategory={setCategory}
                meliPlus={meliPlus}
                setMeliPlus={setMeliPlus}
                mlShippingCost={mlShippingCost}
                setMlShippingCost={setMlShippingCost}
                mercadoAdsEnabled={mercadoAdsEnabled}
                setMercadoAdsEnabled={setMercadoAdsEnabled}
                mercadoAdsManagementMode={mercadoAdsManagementMode}
                setMercadoAdsManagementMode={setMercadoAdsManagementMode}
                mercadoAdsSolution={mercadoAdsSolution}
                setMercadoAdsSolution={setMercadoAdsSolution}
                mercadoAdsSelection={mercadoAdsSelection}
                setMercadoAdsSelection={setMercadoAdsSelection}
                mercadoAdsDailyBudget={mercadoAdsDailyBudget}
                setMercadoAdsDailyBudget={setMercadoAdsDailyBudget}
                mercadoAdsAcosTarget={mercadoAdsAcosTarget}
                setMercadoAdsAcosTarget={setMercadoAdsAcosTarget}
                mercadoAdsSalesQuantity={mercadoAdsSalesQuantity}
                setMercadoAdsSalesQuantity={setMercadoAdsSalesQuantity}
                mercadoAdsCpc={mercadoAdsCpc}
                setMercadoAdsCpc={setMercadoAdsCpc}
                mercadoAdsConversionRate={mercadoAdsConversionRate}
                setMercadoAdsConversionRate={setMercadoAdsConversionRate}
                mercadoAdsBudgetType={mercadoAdsBudgetType}
                setMercadoAdsBudgetType={setMercadoAdsBudgetType}
                handleFloatInput={handleFloatInput}
              />

              <TikTokConfig
                marketplace={marketplace}
                tiktokCommission={tiktokCommission}
                setTiktokCommission={setTiktokCommission}
                marketplaceShippingCost={wordpressShipping}
                setMarketplaceShippingCost={setWordpressShipping}
                tiktokAdsEnabled={tiktokAdsEnabled}
                setTiktokAdsEnabled={setTiktokAdsEnabled}
                tiktokAdFormat={tiktokAdFormat}
                setTiktokAdFormat={setTiktokAdFormat}
                tiktokAudience={tiktokAudience}
                setTiktokAudience={setTiktokAudience}
                tiktokCampaignObjective={tiktokCampaignObjective}
                setTiktokCampaignObjective={setTiktokCampaignObjective}
                tiktokDailyBudget={tiktokDailyBudget}
                setTiktokDailyBudget={setTiktokDailyBudget}
                tiktokCPA={tiktokCPA}
                setTiktokCPA={setTiktokCPA}
                tiktokAdsSalesQuantity={tiktokAdsSalesQuantity}
                setTiktokAdsSalesQuantity={setTiktokAdsSalesQuantity}
                tiktokCPM={tiktokCPM}
                setTiktokCPM={setTiktokCPM}
                tiktokCTR={tiktokCTR}
                setTiktokCTR={setTiktokCTR}
                tiktokCVR={tiktokCVR}
                setTiktokCVR={setTiktokCVR}
                tiktokCatalogId={tiktokCatalogId}
                setTiktokCatalogId={setTiktokCatalogId}
              />

              <EnjoeiConfig
                marketplace={marketplace}
                enjoeiAdType={enjoeiAdType}
                setEnjoeiAdType={setEnjoeiAdType}
                enjoeiInactivityMonths={enjoeiInactivityMonths}
                setEnjoeiInactivityMonths={setEnjoeiInactivityMonths}
                marketplaceShippingCost={wordpressShipping}
                setMarketplaceShippingCost={setWordpressShipping}
              />

              <AmazonConfig
                marketplace={marketplace}
                amazonPlan={amazonPlan}
                setAmazonPlan={setAmazonPlan}
                amazonCategory={amazonCategory}
                setAmazonCategory={setAmazonCategory}
                marketplaceShippingCost={wordpressShipping}
                setMarketplaceShippingCost={setWordpressShipping}
              />

              {['wordpress', 'shein'].includes(marketplace) && (
                <div className="grid w-full max-w-sm items-center gap-1.5 animate-fadeIn">
                   <Label htmlFor="wordpressShipping" className="text-sm font-semibold text-gray-800">
                     Valor do Frete (R$)
                   </Label>
                   <div className="relative">
                      <Input
                       id="wordpressShipping"
                        type="text"
                        inputMode="decimal"
                       value={wordpressShipping}
                        onChange={(e) => handleCurrencyChange(e, setWordpressShipping)}
                        placeholder="0,00"
                      />
                   </div>
                </div>
              )}

            </CardContent>
          </Card>

          <div className="relative">
            <div className={`transition-all duration-300 ${showProfitOverlay ? 'scale-[0.95] opacity-60 blur-[1px] max-h-[280px] overflow-hidden' : ''}`}>
              <ProductsLoaded
                organizationId={organizationId}
                onFill={handleFillFromBlingProduct}
                onUpdate={handleUpdateFromBlingProduct}
                registeredBlingIds={registeredBlingIds}
                registeredSkus={registeredProductSkus}
              />
            </div>

            {showProfitOverlay ? (
            <div className="absolute inset-0 z-20 profit-overlay-animate overflow-y-auto">
              <ResultsPanel
                calculations={calculations}
                marketplace={marketplace}
                productName={productName}
                competitorDiscount={competitorDiscount}
                setCompetitorDiscount={setCompetitorDiscount}
                onClose={() => {
                    setCostPrice('');
                    setShowProductsList(true);
                }}
                >
                {/* ... (Existing ResultsPanel Children) ... */}




                {/* Comparativo Rápido */}
                {calculations && (
                  <>
                <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl p-4 shadow-lg text-white mt-4 border border-gray-700">
                    <h3 className="font-bold text-base mb-3 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-yellow-400" />
                        COMPARATIVO RÁPIDO
                    </h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-300">Tráfego Pago (Ref):</span>
                            <span className="font-bold">CPA ≈ R$ {formatMoney((parseFloat(calculations.suggestedPrice) * 0.3) || 45)} (Est. 30%)</span> 
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-300">Seu Cenário ({trafficMode === 'paid' ? 'Pago' : 'Orgânico'}):</span>
                            <span className={`font-bold ${trafficMode === 'organic' ? 'text-green-400' : 'text-yellow-400'}`}>
                                CPA = R$ {formatMoney(calculations.totalCPA)}
                            </span>
                        </div>
                        
                        {trafficMode === 'organic' && (
                            <div className="mt-3 pt-3 border-t border-gray-600">
                                <p className="text-green-300 font-bold flex items-center gap-2">
                                    💡 Economia Estimada: R$ {formatMoney(Math.max(0, ((parseFloat(calculations.suggestedPrice) * 0.3) - (parseFloat(calculations.totalCPA) || 0))))} por venda
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Detalhamento */}
                <div className="space-y-3 mt-4">
                  <div className={`flex justify-between items-center py-2 border-b ${
                      ['low', 'excellent'].includes(calculations.marginStatus) ? 'border-black/10' : 'border-white/20 dark:border-zinc-800/60'
                  }`}>
                    <span className={['low', 'excellent'].includes(calculations.marginStatus) ? 'text-black' : 'text-white/80'}>Custos Embalagem</span>
                    <span className={`font-semibold ${
                        ['low', 'excellent'].includes(calculations.marginStatus) ? 'text-black' : 'text-red-200'
                    }`}>
                        {parseFloat(calculations.packagingCost) > 0 
                            ? `- R$ ${formatMoney(calculations.packagingCost)}` 
                            : `R$ ${formatMoney(calculations.packagingCost)}`
                        }
                    </span>
                  </div>

                  <div className={`flex justify-between items-center py-2 border-b ${
                      ['low', 'excellent'].includes(calculations.marginStatus) ? 'border-black/10' : 'border-white/20 dark:border-zinc-800/60'
                  }`}>
                    <span className={['low', 'excellent'].includes(calculations.marginStatus) ? 'text-black' : 'text-white/80'}>
                      {supplierFeeType === 'percent'
                        ? `Taxa do Fornecedor (${formatPercent(parseFloat(supplierFeePercent) || 0, 1)}%)`
                        : 'Taxa do Fornecedor'}
                    </span>
                    <span className={`font-semibold ${
                        ['low', 'excellent'].includes(calculations.marginStatus) ? 'text-black' : 'text-red-200'
                    }`}>
                        {parseFloat(calculations.supplierFeeCost) > 0 
                            ? `- R$ ${formatMoney(calculations.supplierFeeCost)}` 
                            : `R$ ${formatMoney(calculations.supplierFeeCost)}`
                        }
                    </span>
                  </div>

                  {/* Marketing de Influencer */}
                  {influencers && influencers.length > 0 && parseFloat(calculations.influencerCost || '0') > 0 && (
                    <div className={`flex justify-between items-center py-2 border-b ${
                        ['low', 'excellent'].includes(calculations.marginStatus) ? 'border-black/10' : 'border-white/20 dark:border-zinc-800/60'
                    }`}>
                      <span className={['low', 'excellent'].includes(calculations.marginStatus) ? 'text-black' : 'text-white/80'}>
                        Marketing Influencer ({formatPercent(calculations.totalInfluencerPercent || 0, 1)}%)
                      </span>
                      <span className={`font-semibold ${
                          ['low', 'excellent'].includes(calculations.marginStatus) ? 'text-black' : 'text-red-200'
                      }`}>- R$ {formatMoney(calculations.influencerCost)}</span>
                    </div>
                  )}

                  {/* Marketing de Afiliado */}
                  {affiliates && affiliates.length > 0 && parseFloat(calculations.affiliateCost || '0') > 0 && (
                    <div className={`flex justify-between items-center py-2 border-b ${
                        ['low', 'excellent'].includes(calculations.marginStatus) ? 'border-black/10' : 'border-white/20 dark:border-zinc-800/60'
                    }`}>
                      <span className={['low', 'excellent'].includes(calculations.marginStatus) ? 'text-black' : 'text-white/80'}>
                        Marketing Afiliado ({formatPercent(calculations.totalAffiliatePercent || 0, 1)}%)
                      </span>
                      <span className={`font-semibold ${
                          ['low', 'excellent'].includes(calculations.marginStatus) ? 'text-black' : 'text-red-200'
                      }`}>- R$ {formatMoney(calculations.affiliateCost)}</span>
                    </div>
                  )}

                  <div className={`flex justify-between items-center py-2 border-b ${
                      ['low', 'excellent'].includes(calculations.marginStatus) ? 'border-black/10' : 'border-white/20 dark:border-zinc-800/60'
                  }`}>
                    <span className={['low', 'excellent'].includes(calculations.marginStatus) ? 'text-black' : 'text-white/80'}>Taxa Marketplace ({formatPercent(calculations.marketplaceFee, 0)}%)</span>
                    <span className={`font-semibold ${
                        ['low', 'excellent'].includes(calculations.marginStatus) ? 'text-black' : 'text-red-200'
                    }`}>- R$ {formatMoney(calculations.marketplaceCost)}</span>
                  </div>

                  <div className={`flex justify-between items-center py-2 border-b ${
                      ['low', 'excellent'].includes(calculations.marginStatus) ? 'border-black/10' : 'border-white/20 dark:border-zinc-800/60'
                  }`}>
                    <span className={['low', 'excellent'].includes(calculations.marginStatus) ? 'text-black' : 'text-white/80'}>Taxa de Gateway - Compra</span>
                    <span className={`font-semibold ${
                        ['low', 'excellent'].includes(calculations.marginStatus) ? 'text-black' : 'text-red-200'
                    }`}>- R$ {formatMoney(calculations.gatewayCost)}</span>
                  </div>

                  <div className={`flex justify-between items-center py-2 border-b ${
                      ['low', 'excellent'].includes(calculations.marginStatus) ? 'border-black/10' : 'border-white/20 dark:border-zinc-800/60'
                  }`}>
                    <span className={['low', 'excellent'].includes(calculations.marginStatus) ? 'text-black' : 'text-white/80'}>Taxa de Gateway - Fornecedor</span>
                    <span className={`font-semibold ${
                        ['low', 'excellent'].includes(calculations.marginStatus) ? 'text-black' : 'text-red-200'
                    }`}>- R$ {formatMoney(calculations.supplierGatewayCost)}</span>
                  </div>

                  {parseFloat(calculations.paidTrafficCost) > 0 && (
                     <div className={`flex justify-between items-center py-2 border-b ${
                        ['low', 'excellent'].includes(calculations.marginStatus) ? 'border-black/10' : 'border-white/20 dark:border-zinc-800/60'
                    }`}>
                        <span className={['low', 'excellent'].includes(calculations.marginStatus) ? 'text-black' : 'text-white/80'}>Investimento Tráfego</span>
                        <span className={`font-semibold ${
                            ['low', 'excellent'].includes(calculations.marginStatus) ? 'text-black' : 'text-red-200'
                        }`}>- R$ {formatMoney(calculations.paidTrafficCost)}</span>
                    </div>
                  )}

                  {parseFloat(calculations.paidTrafficGatewayCost) > 0 && (
                     <div className={`flex justify-between items-center py-2 border-b ${
                        ['low', 'excellent'].includes(calculations.marginStatus) ? 'border-black/10' : 'border-white/20 dark:border-zinc-800/60'
                    }`}>
                        <span className={['low', 'excellent'].includes(calculations.marginStatus) ? 'text-black' : 'text-white/80'}>Taxa de Gateway -&gt; Tráfego Pago</span>
                        <span className={`font-semibold ${
                            ['low', 'excellent'].includes(calculations.marginStatus) ? 'text-black' : 'text-red-200'
                        }`}>- R$ {formatMoney(calculations.paidTrafficGatewayCost)}</span>
                    </div>
                  )}

                  {parseFloat(calculations.fixedFee) > 0 && (
                    <div className={`flex justify-between items-center py-2 border-b ${
                        ['low', 'excellent'].includes(calculations.marginStatus) ? 'border-black/10' : 'border-white/20 dark:border-zinc-800/60'
                    }`}>
                      <span className={['low', 'excellent'].includes(calculations.marginStatus) ? 'text-black' : 'text-white/80'}>Taxa Fixa</span>
                      <span className={`font-semibold ${
                          ['low', 'excellent'].includes(calculations.marginStatus) ? 'text-black' : 'text-red-200'
                      }`}>- R$ {formatMoney(calculations.fixedFee)}</span>
                    </div>
                  )}

                  {parseFloat(calculations.shopeeStoreCoupon) > 0 && (
                    <div className={`flex justify-between items-center py-2 border-b ${
                        ['low', 'excellent'].includes(calculations.marginStatus) ? 'border-black/10' : 'border-white/20 dark:border-zinc-800/60'
                    }`}>
                      <span className={['low', 'excellent'].includes(calculations.marginStatus) ? 'text-black' : 'text-white/80'}>Cupom de Loja</span>
                      <span className={`font-semibold ${
                          ['low', 'excellent'].includes(calculations.marginStatus) ? 'text-black' : 'text-red-200'
                      }`}>- R$ {formatMoney(calculations.shopeeStoreCoupon)}</span>
                    </div>
                  )}

                  {parseFloat(calculations.shopeeProductCoupon) > 0 && (
                    <div className={`flex justify-between items-center py-2 border-b ${
                        ['low', 'excellent'].includes(calculations.marginStatus) ? 'border-black/10' : 'border-white/20 dark:border-zinc-800/60'
                    }`}>
                      <span className={['low', 'excellent'].includes(calculations.marginStatus) ? 'text-black' : 'text-white/80'}>Cupom de Produto</span>
                      <span className={`font-semibold ${
                          ['low', 'excellent'].includes(calculations.marginStatus) ? 'text-black' : 'text-red-200'
                      }`}>- R$ {formatMoney(calculations.shopeeProductCoupon)}</span>
                    </div>
                  )}

                  {parseFloat(calculations.shopeeFollowerCoupon) > 0 && (
                    <div className={`flex justify-between items-center py-2 border-b ${
                        ['low', 'excellent'].includes(calculations.marginStatus) ? 'border-black/10' : 'border-white/20 dark:border-zinc-800/60'
                    }`}>
                      <span className={['low', 'excellent'].includes(calculations.marginStatus) ? 'text-black' : 'text-white/80'}>Cupom de Seguidor</span>
                      <span className={`font-semibold ${
                          ['low', 'excellent'].includes(calculations.marginStatus) ? 'text-black' : 'text-red-200'
                      }`}>- R$ {formatMoney(calculations.shopeeFollowerCoupon)}</span>
                    </div>
                  )}

                  {parseFloat(calculations.shopeeSellerVoucher) > 0 && (
                    <div className={`flex justify-between items-center py-2 border-b ${
                        ['low', 'excellent'].includes(calculations.marginStatus) ? 'border-black/10' : 'border-white/20 dark:border-zinc-800/60'
                    }`}>
                      <span className={['low', 'excellent'].includes(calculations.marginStatus) ? 'text-black' : 'text-white/80'}>Voucher de Vendedor</span>
                      <span className={`font-semibold ${
                          ['low', 'excellent'].includes(calculations.marginStatus) ? 'text-black' : 'text-red-200'
                      }`}>- R$ {formatMoney(calculations.shopeeSellerVoucher)}</span>
                    </div>
                  )}

                  {((marketplace === 'mercadolivre' && parseCurrency(mlShippingCost) > 0)
                    || (['wordpress', 'tiktok', 'enjoei', 'amazon', 'shein'].includes(marketplace) && parseCurrency(wordpressShipping) > 0)) && (
                    <div className={`flex justify-between items-center py-2 border-b ${
                        ['low', 'excellent'].includes(calculations.marginStatus) ? 'border-black/10' : 'border-white/20 dark:border-zinc-800/60'
                    }`}>
                      <span className={['low', 'excellent'].includes(calculations.marginStatus) ? 'text-black' : 'text-white/80'}>
                        Frete ({getMarketplaceName(marketplace)})
                      </span>
                      <span className={`font-semibold ${
                          ['low', 'excellent'].includes(calculations.marginStatus) ? 'text-black' : 'text-red-200'
                      }`}>- R$ {formatMoney(marketplace === 'mercadolivre' ? parseCurrency(mlShippingCost) : parseCurrency(wordpressShipping))}</span>
                    </div>
                  )}

                  {parseFloat(calculations.adsCostPerSale) > 0 && (
                    <>
                      <div className={`flex justify-between items-center py-2 border-b ${
                          ['low', 'excellent'].includes(calculations.marginStatus) ? 'border-black/10' : 'border-white/20 dark:border-zinc-800/60'
                      }`}>
                        <span className={['low', 'excellent'].includes(calculations.marginStatus) ? 'text-black' : 'text-white/80'}>
                          {marketplace === 'mercadolivre'
                            ? 'Custo Mercado Ads (Est.)'
                            : marketplace === 'tiktok'
                              ? 'Custo TikTok Ads (Est.)'
                              : marketplace === 'shopee'
                                ? 'Custo Shopee Ads (Est.)'
                                : `Custo Ads (${getMarketplaceName(marketplace)})`}
                        </span>
                        <span className={`font-semibold ${
                            ['low', 'excellent'].includes(calculations.marginStatus) ? 'text-black' : 'text-red-200'
                        }`}>- R$ {formatMoney(calculations.adsCostPerSale)}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-white/20 dark:border-zinc-800/60 bg-white/5 px-2 rounded">
                        <span className="text-white/80 text-sm">CPA (Custo por Aquisição)</span>
                        <span className="font-semibold text-white">R$ {formatMoney(calculations.adsCostPerSale)}</span>
                      </div>
                    </>
                  )}

                  <div className={`flex justify-between items-center py-2 border-b ${
                      ['low', 'excellent'].includes(calculations.marginStatus) ? 'border-black/10' : 'border-white/20 dark:border-zinc-800/60'
                  }`}>
                    <span className={['low', 'excellent'].includes(calculations.marginStatus) ? 'text-black' : 'text-white/80'}>Total de Taxas e Custos</span>
                    <span className={`font-semibold ${
                        ['low', 'excellent'].includes(calculations.marginStatus) ? 'text-black' : 'text-red-200'
                    }`}>- R$ {formatMoney(calculations.totalFees)}</span>
                  </div>

                  <div className={`flex justify-between items-center py-4 rounded-lg px-4 mt-2 border shadow-lg animate-on-scroll ${
                     calculations.marginStatus === 'negative' ? 'bg-red-600 border-red-500' :
                     calculations.marginStatus === 'excellent' ? 'bg-[#16A34A] border-green-600' :
                     'bg-[#DCFCE7] border-green-200'
                   }`}>
                     <span className={`font-bold font-iceland text-xl ${
                         calculations.marginStatus === 'negative' || calculations.marginStatus === 'excellent' ? 'text-white' : 'text-black'
                     }`}>Lucro Líquido</span>
                     <span className={`text-4xl font-bold ${
                         calculations.marginStatus === 'negative' || calculations.marginStatus === 'excellent' ? 'text-white' : 'text-black'
                     }`}>R$ {formatMoney(calculations.netRevenue)}</span>
                   </div>
                  <p className={`text-xs mt-1 font-semibold ${
                     ['negative', 'low', 'excellent'].includes(calculations.marginStatus)
                       ? 'text-white'
                       : 'text-green-800'
                   }`}>
                     {calculations.marginStatus === 'negative'
                        ? 'Resultado negativo. Ajuste preço ou custos.'
                        : calculations.marginStatus === 'low'
                          ? 'Lucro abaixo do recomendado.'
                          : calculations.marginStatus === 'excellent'
                            ? 'Lucro acima do recomendado.'
                            : 'Lucro dentro do recomendado.'}
                   </p>

                   <div className={`flex justify-between items-center py-4 rounded-lg px-4 border shadow-lg animate-on-scroll ${
                     calculations.marginStatus === 'negative' ? 'bg-red-600 border-red-500' :
                     calculations.marginStatus === 'excellent' ? 'bg-[#16A34A] border-green-600' :
                     'bg-[#DCFCE7] border-green-200'
                   }`}>
                     <span className={`font-bold font-iceland text-xl ${
                         calculations.marginStatus === 'negative' || calculations.marginStatus === 'excellent' ? 'text-white' : 'text-black'
                     }`}>Margem de Lucro</span>
                     <span className={`text-4xl font-bold ${
                         calculations.marginStatus === 'negative' || calculations.marginStatus === 'excellent' ? 'text-white' : 'text-black'
                     }`}>{formatPercent(calculations.actualMargin, 1)}%</span>
                   </div>
                  <p className={`text-xs mt-1 font-semibold ${
                     ['negative', 'low', 'excellent'].includes(calculations.marginStatus)
                       ? 'text-white'
                       : 'text-green-800'
                   }`}>
                     {calculations.marginStatus === 'negative'
                        ? 'Margem negativa. Reavalie a precificação.'
                        : calculations.marginStatus === 'low'
                          ? 'Margem abaixo da recomendação.'
                          : calculations.marginStatus === 'excellent'
                            ? 'Margem acima da recomendação.'
                            : 'Margem dentro da recomendação.'}
                   </p>
                </div>

                {/* Resultado das Variações - Logo abaixo de Lucro e Margem */}
                {variationCalculations.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-lg font-bold text-white mb-3">Variações do Produto ({variationCalculations.length})</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fadeIn max-h-[600px] overflow-y-auto pr-2">
                        {variationCalculations.map((v) => {
                          const manualPriceValue = parseCurrency(v.manualPrice || 0);
                          const hasManualPrice = manualPriceValue > 0;

                          return (
                             <Card key={v.id} className="bg-gradient-to-r from-gray-700 to-gray-800 border-none shadow-xl text-white">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-lg font-bold">{v.name}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between py-1">
                                            <span className="text-white/80">{hasManualPrice ? 'Preço de Venda' : 'Preço Sugerido'}</span>
                                            <span className="font-bold">R$ {formatMoney(hasManualPrice ? manualPriceValue : v.metrics.suggestedPrice)}</span>
                                        </div>
                                        <div className="flex justify-between py-1 font-bold border-t border-white/20 dark:border-zinc-800/60 pt-2">
                                            <span>Lucro Líquido</span>
                                            <span className="text-green-300">R$ {formatMoney(v.metrics.netRevenue)}</span>
                                        </div>
                                        <div className="flex justify-between py-1 font-bold">
                                            <span>Margem</span>
                                            <span className="text-green-300">{formatPercent(v.metrics.actualMargin, 1)}%</span>
                                        </div>
                                    </div>
                                </CardContent>
                             </Card>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* Recomendação */}
                <div className="bg-black backdrop-blur-sm rounded-xl p-4 border border-yellow-400/30 mt-4">
                  <div className="flex gap-2">
                    <AlertCircle className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-white mb-1">Margem Recomendada</p>
                      <p className="text-sm text-white/90">
                        Para produtos nesta faixa de preço (R$ {formatMoney(calculations.totalCost)}), 
                        recomendamos uma margem de <strong>{formatPercent(calculations.recommendedMargin, 0)}%</strong> para cobrir custos operacionais e garantir lucratividade.
                      </p>
                    </div>
                  </div>
                </div>
                

                
                
                {(() => {
                  const adsEnabled = marketplace === 'mercadolivre'
                    ? mercadoAdsEnabled
                    : marketplace === 'tiktok'
                      ? tiktokAdsEnabled
                      : marketplace === 'shopee'
                        ? useShopeeAds
                        : false;
                  if (!adsEnabled) return null;
                  const isMercadoLivre = marketplace === 'mercadolivre';
                  const adsLabel = marketplace === 'mercadolivre'
                    ? 'Mercado Ads'
                    : marketplace === 'tiktok'
                      ? 'TikTok Ads'
                      : marketplace === 'shopee'
                        ? 'Shopee Ads'
                        : `${getMarketplaceName(marketplace)} Ads`;
                  const adsBudget = marketplace === 'mercadolivre'
                    ? parseCurrency(mercadoAdsDailyBudget)
                    : marketplace === 'tiktok'
                      ? parseCurrency(tiktokDailyBudget)
                      : parseCurrency(dailyBudget);
                  const mercadoAdsCpcValue = parseCurrency(mercadoAdsCpc);
                  const mercadoAdsConversionValue = parseCurrency(mercadoAdsConversionRate);

                  return (
                <div className="bg-white rounded-xl overflow-hidden shadow-sm mt-4 text-gray-800">
                    <div className="bg-black p-2 text-center">
                        <p className="text-white font-bold">Projeção de CPA - {adsLabel}</p>
                    </div>
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-gray-100 hover:bg-gray-100 border-b border-gray-200">
                                <TableHead className="text-center font-bold text-gray-900 h-8">Unidades Vendidas</TableHead>
                                <TableHead className="text-center font-bold text-gray-900 h-8">Visualizações (Est.)</TableHead>
                                <TableHead className="text-center font-bold text-gray-900 h-8">CPA Projetado</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {[10, 25, 50, 100, 250, 500, 1000].map((qty) => {
                              const conversionRate = mercadoAdsConversionValue / 100;
                              const actualCpa = conversionRate > 0 ? (mercadoAdsCpcValue / conversionRate) : 0;
                              
                              // CPA based on Budget distribution
                              const budgetCpa = qty > 0 ? (adsBudget / qty) : 0;
                              
                              // Estimated Clicks = Sales / Conversion
                              const estimatedClicks = conversionRate > 0 ? Math.ceil(qty / conversionRate) : 0;
                              
                              // Estimated Impressions (Assuming 1% CTR default if unknown, or just showing -)
                              // User asked for "Visualizações", but we lack CTR. 
                              // We will show estimated clicks as a proxy or "-" if not possible.
                              // Actually, let's just show "-" if we can't calculate impressions accurately.
                              // But user specifically asked for the column.
                              // Let's use a placeholder calculation: Clicks / 0.01 (1% CTR benchmark)
                              const benchmarkCtr = 0.01;
                              const estimatedImpressions = Math.ceil(estimatedClicks / benchmarkCtr);

                              const displayCpa = isMercadoLivre ? budgetCpa : (qty > 0 ? adsBudget / qty : 0);
                              
                              // Traffic Limit Validation
                              // Max Sales = Budget / ActualCpa
                              const maxSales = actualCpa > 0 ? Math.floor(adsBudget / actualCpa) : 0;
                              const isTrafficLimited = isMercadoLivre && qty > maxSales;

                              return (
                                <TableRow key={qty} className="hover:bg-gray-50 border-b border-gray-100 last:border-0">
                                    <TableCell className="text-center py-2 font-medium">
                                        <span className="font-bold">{qty}</span>
                                    </TableCell>
                                    <TableCell className="text-center py-2 text-gray-600">
                                        {isMercadoLivre && conversionRate > 0 ? (
                                            <span title="Baseado em CTR de referência de 1%">{estimatedImpressions.toLocaleString()}</span>
                                        ) : '-'}
                                    </TableCell>
                                    <TableCell className="text-center py-2 font-bold text-gray-900">
                                        <div className="flex flex-col items-center">
                                            <span className={isTrafficLimited ? "text-red-500" : "text-green-600"}>
                                                R$ {formatMoney(displayCpa)}
                                            </span>
                                            {isTrafficLimited && (
                                                <span className="text-[10px] text-red-400 font-normal">
                                                    (Max: {maxSales} un.)
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )})}
                        </TableBody>
                    </Table>
                </div>
                  );
                })()}

                {/* Tabela de Lucro por Unidade */}
                <div className="bg-white rounded-xl overflow-hidden shadow-sm mt-4 text-gray-800">
                    <div className="bg-green-600 p-2 text-center">
                        <p className="text-white font-bold">Projeção de Lucro</p>
                    </div>
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-green-100 hover:bg-green-100 border-b border-green-200">
                                <TableHead className="text-center font-bold text-green-800 h-8">Unidades Vendidas</TableHead>
                                <TableHead className="text-center font-bold text-green-800 h-8">Lucro Estimado</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {[10, 25, 50, 100, 250, 500, 1000].map((qty) => (
                                <TableRow key={qty} className="hover:bg-green-50 border-b border-gray-100 last:border-0">
                                    <TableCell className="text-center py-2 font-medium">
                                        <span className="font-bold">{qty}</span>
                                    </TableCell>
                                    <TableCell className="text-center py-2 font-bold text-green-700">
                                        R$ {(parseFloat(calculations.netRevenue) * qty).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {/* Tabela de Perdas Estimadas */}
                <div className="bg-white rounded-xl overflow-hidden shadow-sm mt-4 text-gray-800">
                    <div className="bg-red-600 p-2 text-center">
                        <p className="text-white font-bold">Projeção de Perdas</p>
                    </div>
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-red-100 hover:bg-red-100 border-b border-red-200">
                                <TableHead className="text-center font-bold text-red-800 h-8">Unidades Devolvidas</TableHead>
                                <TableHead className="text-center font-bold text-red-800 h-8">Perdas Estimadas</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {[10, 25, 50, 100, 250, 500, 1000].map((qty) => {
                                // Calculate returned units based on return rate
                                const returnedUnits = Math.round(qty * (calculations.returnRate / 100));
                                // Calculate loss: returned units * loss per return
                                const totalLoss = returnedUnits * parseFloat(calculations.lossPerReturn);
                                
                                return (
                                <TableRow key={qty} className="hover:bg-red-50 border-b border-gray-100 last:border-0">
                                    <TableCell className="text-center py-2 font-medium">
                                        <span className="font-bold">{returnedUnits}</span>
                                    </TableCell>
                                    <TableCell className="text-center py-2 font-bold text-red-700">
                                        - R$ {totalLoss.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </TableCell>
                                </TableRow>
                            )})}
                        </TableBody>
                    </Table>
                    {parseFloat(calculations.emergencyReserve) > 0 && (
                        <div className="p-3 bg-red-50 border-t border-red-100 text-center text-xs text-red-800">
                            <span className="font-bold">Reserva de Emergência Disponível (Total):</span> R$ {(parseFloat(calculations.emergencyReserve) * 50).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (para 50 unidades)
                        </div>
                    )}
                </div>
                  </>
                )}

                {/* Infraestrutura Técnica (Tráfego Orgânico) - MOVED HERE */}
                {trafficMode === 'organic' && (
                  <div className="bg-white rounded-xl overflow-hidden shadow-sm mt-4 text-gray-800 border border-gray-200">
                     <div className="bg-indigo-600 p-2 text-center">
                        <p className="text-white font-bold flex items-center justify-center gap-2">
                            <Package className="w-4 h-4" />
                            Infraestrutura Técnica Disponível
                        </p>
                     </div>
                     <div className="p-4 space-y-4">
                        <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                           <h4 className="font-bold text-indigo-900 text-sm mb-2">N8N Workflow 1 - Criação de Conteúdo + Postagem</h4>
                           <div className="text-xs text-indigo-800 space-y-1">
                              <p><strong>Fluxo:</strong> Buscar Produtos → Criar Prompt (UGC) → Gemini (Grátis) → Criar Vídeo → Upload Múltiplo</p>
                              <p><strong>Ferramentas:</strong> n8n + API Gemini + MindVideo/Kie.ai</p>
                              <p className="mt-1 font-mono bg-white/50 p-1 rounded inline-block">
                                 Schedule → Code JS → AI Agent → HTTP Request → Wait → Upload Video
                              </p>
                           </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <h4 className="font-bold text-gray-800 text-xs mb-2">Plataformas Suportadas (Grátis)</h4>
                                <ul className="text-xs space-y-1">
                                    <li className="flex items-center gap-1 text-green-700"><span className="text-green-500">✅</span> Pinterest</li>
                                    <li className="flex items-center gap-1 text-green-700"><span className="text-green-500">✅</span> Instagram</li>
                                    <li className="flex items-center gap-1 text-green-700"><span className="text-green-500">✅</span> Facebook</li>
                                    <li className="flex items-center gap-1 text-green-700"><span className="text-green-500">✅</span> YouTube</li>
                                    <li className="flex items-center gap-1 text-green-700"><span className="text-green-500">✅</span> X (Twitter)</li>
                                    <li className="flex items-center gap-1 text-green-700"><span className="text-green-500">✅</span> Threads</li>
                                    <li className="flex items-center gap-1 text-red-500 opacity-70"><span className="text-red-500">❌</span> TikTok (Apenas pago)</li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-800 text-xs mb-2">Serviço de Postagem</h4>
                                <div className="bg-gray-50 p-2 rounded border border-gray-100">
                                    <p className="font-bold text-xs">upload-post.com</p>
                                    <p className="text-[10px] text-gray-500 mt-1">Plano Gratuito (Inicial):</p>
                                    <ul className="text-[10px] text-gray-600 mt-1 list-disc pl-3">
                                        <li>5 Perfis Sociais</li>
                                        <li>300 min API FFmpeg/mês</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                        
                        <div className="mt-4 pt-4 border-t border-indigo-100 space-y-3">
                            <div>
                                <h4 className="font-bold text-gray-800 text-xs mb-1">Plano Gratuito Inicial</h4>
                                <p className="text-[10px] text-gray-600">
                                    Ideal para começar. O TikTok não está disponível na versão free. Considere upgrade futuro conforme a necessidade de escalar.
                                </p>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2">
                                <div className="bg-gray-50 p-2 rounded border border-gray-200">
                                    <p className="font-bold text-xs text-blue-600">Basic (€19/mês)</p>
                                    <p className="text-[10px] text-gray-500">20 Perfis, 600 min/mês</p>
                                </div>
                                <div className="bg-gray-50 p-2 rounded border border-gray-200">
                                    <p className="font-bold text-xs text-purple-600">Pro (€49/mês)</p>
                                    <p className="text-[10px] text-gray-500">50 Perfis, 1500 min/mês</p>
                                </div>
                            </div>
                        </div>
                     </div>
                  </div>
                )}
              </ResultsPanel>
            </div>
          ) : null}
          </div>

        </div>
        )}
        {showOnlyProducts ? (
          <>
            {/* Debug logs for products page */}
            {console.log('[DEBUG Products Page] Rendering products page:', {
              showOnlyProducts,
              isProductsLoading,
              productsLength: products.length,
              effectiveProductsLength: effectiveProducts.length,
              filteredProductsLength: filteredProducts.length,
              pagedProductsLength: pagedProducts.length,
              shouldShowProductsLoading,
              currentPage,
              totalPages,
              productFilters,
              organizationId
            })}
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="bg-[#0d0d0d] text-white rounded-xl p-5 shadow-lg border border-white/10 flex flex-col">
              <ElectricBorder color="#fe2c55" speed={0.8} chaos={0.1} borderRadius={16} className="flex flex-col flex-1">
                <div className="rounded-lg p-0 flex flex-col flex-1 h-full">
                  <div className="flex items-center justify-between p-4 bg-[#FF3366]/80 rounded-t-2xl">
                    <div className="w-full">
                      <Input
                        value={projectionSearch}
                        onChange={(event) => {
                          setProjectionSearch(event.target.value);
                          setSelectedProductIndex(0);
                        }}
                        placeholder="🔍 Buscar produtos"
                        className="bg-white/20 border-white/30 text-white placeholder:text-white/80 h-9 text-sm font-medium focus-visible:ring-white/50 focus-visible:border-white/60"
                      />
                    </div>
                  </div>

                  <ProfitProjection
                    product={isProductsLoading && effectiveProducts.length === 0 ? null : (selectedProduct ?? null)}
                    onNext={() => setSelectedProductIndex((safeSelectedProductIndex + 1) % filteredProjectionProducts.length)}
                    onPrev={() => setSelectedProductIndex((safeSelectedProductIndex - 1 + filteredProjectionProducts.length) % filteredProjectionProducts.length)}
                  />
                </div>
              </ElectricBorder>
            </div>
            {showProductsList ? (
              <ElectricBorder
                color="#1a1a1a"
                speed={0.8}
                chaos={0.1}
                borderRadius={16}
              >
                <Card id="produtos" className="shadow-xl animate-on-scroll backdrop-blur-xl bg-white/95 dark:bg-gray-900/95 border border-white/20 dark:border-gray-700/20 will-change-transform">
                  <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2 cursor-pointer" onClick={handleNavigateToProducts}>
                    <div className="flex flex-row items-center gap-2">
                      <Package className="w-6 h-6 text-[#fe2c55]" />
                      <CardTitle className="tracking-tight text-2xl font-bold text-gray-800 dark:text-white font-iceland">Produtos adicionados</CardTitle>
                    </div>
                  </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: 'all', label: 'Todos' },
                      ...marketplaceFilterOptions
                    ].map((mp) => {
                      const isActive = productFilters.marketplace === mp.value;
                      const icon = marketplaceIcons[mp.value];
                      return (
                        <button
                          key={mp.value}
                          type="button"
                          onClick={() => handleProductFilterChange('marketplace', mp.value)}
                          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${isActive ? 'bg-white text-black border-white' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 dark:bg-zinc-900 dark:text-white dark:border-zinc-700 dark:hover:bg-zinc-800'}`}
                        >
                          {icon ? <img src={icon.src} alt={icon.alt} className="h-4 w-4 object-contain" /> : null}
                          <span>{mp.label}</span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    <Select value={productFilters.videoModel || "all"} onValueChange={(value) => handleProductFilterChange('videoModel', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Modelo de Vídeo" />
                      </SelectTrigger>
                      <SelectContent>
                        {videoModelOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={productFilters.priceSort || "all"} onValueChange={(value) => handleProductFilterChange('priceSort', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Ordenar por Preço" />
                      </SelectTrigger>
                      <SelectContent>
                        {priceFilterOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={productFilters.stockFilter || "all"} onValueChange={(value) => handleProductFilterChange('stockFilter', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Filtrar por Estoque" />
                      </SelectTrigger>
                      <SelectContent>
                        {stockFilterOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={productFilters.supplier || "all"} onValueChange={(value) => handleProductFilterChange('supplier', value === "all" ? "" : value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Fornecedor" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        {suppliersList.map((s) => (
                          <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={productFilters.accountType || "all"} onValueChange={(value) => handleProductFilterChange('accountType', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Tipo de Conta" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="cpf">CPF</SelectItem>
                        <SelectItem value="cnpj">CNPJ</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={productFilters.holder || "all"} onValueChange={(value) => handleProductFilterChange('holder', value === "all" ? "" : value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Titular" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        {accountHoldersList.map((h) => (
                          <SelectItem key={h.id} value={h.name}>{h.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {shouldShowProductsLoading ? (
                    <div className="text-sm text-gray-500">Carregando produtos...</div>
                  ) : effectiveProducts.length === 0 ? (
                    <div className="text-sm text-gray-500">Nenhum produto adicionado ainda.</div>
                  ) : filteredProducts.length === 0 ? (
                    <div className="text-sm text-gray-500">Nenhum produto encontrado com os filtros atuais.</div>
                  ) : (
                    <>
                      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                        {pagedProducts.map((product) => (
                          <ProductCard
                            key={product.id}
                            product={product}
                            onDelete={handleDeleteProductAnimated}
                            onEdit={handleEditProductClick}
                            onDuplicate={handleDuplicateProductClick}
                            onInvestSave={handleInvestSaveProduct}
                          />
                        ))}
                      </div>
                      {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 pt-6">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>

                          <div className="flex items-center gap-1">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                              <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={`
                                  h-8 w-8 rounded-md text-xs font-medium transition-colors
                                  ${currentPage === page
                                    ? 'bg-pink-600 text-white shadow-sm'
                                    : 'bg-transparent text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'}
                                `}
                              >
                                {page}
                              </button>
                            ))}
                          </div>

                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
              </ElectricBorder>

            ) : null}

          {/* Produtos do Bling - Only show in calculator mode, not in products page */}
          {!showOnlyProducts && (
            <div className="mt-6">
              <ProductsLoaded
                organizationId={organizationId}
                onFill={handleFillFromBlingProduct}
                onUpdate={handleUpdateFromBlingProduct}
                registeredBlingIds={registeredBlingIds}
                registeredSkus={registeredProductSkus}
              />
            </div>
          )}
        </div>
        ) : null}

              {!showOnlyProducts && (
              <CollapsibleSection title="Taxas dos Marketplaces (Referência)" icon={<AlertCircle className="w-6 h-6 text-blue-600" />}>
                <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-700">
                  <div className="bg-white rounded-lg p-4 border border-pink-100">
                    <h5 className="font-bold text-[#fe2c55] mb-2">📦 Mercado Livre Clássico</h5>
                    <ul className="space-y-1 ml-4">
                      <li>• <strong>Comissão:</strong> 10% a 14% sobre o valor da venda (varia por categoria)</li>
                      <li>• <strong>Custo Fixo:</strong> Hoje varia por faixa de preço.</li>
                      <li>• <strong>Frete Grátis:</strong> Políticas de frete grátis mudaram e agora são mais flexíveis.</li>
                      <li>• <strong>Visibilidade:</strong> Alta</li>
                      <li>• <strong>Parcelamento:</strong> Não inclui parcelamento sem juros</li>
                    </ul>
                  </div>
                  
                  <div className="bg-white rounded-lg p-4 border border-pink-100">
                    <h5 className="font-bold text-[#fe2c55] mb-2">⭐ Anúncio Premium (Mercado Livre)</h5>
                    <ul className="space-y-1 ml-4">
                      <li>• <strong>Comissão:</strong> 15% a 19% sobre o valor da venda (varia por categoria)</li>
                      <li>• <strong>Custo Fixo:</strong> Hoje varia por faixa de preço.</li>
                      <li>• <strong>Visibilidade:</strong> Máxima - destaque e prioridade nas buscas</li>
                      <li>• <strong>Parcelamento:</strong> Até 12x sem juros para o comprador</li>
                      <li>• <strong>Benefício:</strong> Maior conversão de vendas pela visibilidade</li>
                    </ul>
                  </div>

                  <div className="bg-white rounded-lg p-4 border border-pink-100">
                    <h5 className="font-bold text-[#fe2c55] mb-2">📦 Amazon</h5>
                    <ul className="space-y-1 ml-4">
                      <li>• <strong>1. Comissão de Venda (Taxa de Referência):</strong> A Amazon cobra uma comissão sobre o valor total da venda (preço do item + frete + embalagem para presente).
                        <ul className="ml-4 mt-1 list-disc text-xs text-gray-600">
                           <li><strong>Porcentagem:</strong> Geralmente entre 10% e 15% para a maioria das categorias.</li>
                           <li><strong>Comissão mínima:</strong> Se o valor calculado da comissão for muito baixo, aplica-se uma comissão mínima de R$ 1,00 por item.</li>
                        </ul>
                      </li>
                      <li className="mt-2">• <strong>2. Taxa Fixa por Item (Plano Individual):</strong> A taxa fixa depende do seu plano de vendedor:
                        <ul className="ml-4 mt-1 list-disc text-xs text-gray-600">
                           <li><strong>Plano Individual:</strong> R$ 2,00 por item vendido (além da comissão de 10-15%).</li>
                           <li><strong>Plano Profissional:</strong> Não tem taxa fixa por item (apenas a comissão de 10-15%). Em vez disso, paga-se uma mensalidade de R$ 19,00.</li>
                        </ul>
                      </li>
                      <li className="mt-2">• <strong>3. Outras Taxas Possíveis:</strong>
                        <ul className="ml-4 mt-1 list-disc text-xs text-gray-600">
                           <li><strong>Logística (FBA/DBA):</strong> Se você utilizar a logística da Amazon para enviar os produtos, haverá taxas de manuseio e frete, que variam conforme o peso e tamanho do produto.</li>
                           <li><strong>Parcelamento:</strong> Se o vendedor oferecer parcelamento sem juros, pode haver uma taxa adicional de 1,5% sobre o valor total da venda.</li>
                        </ul>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-white rounded-lg p-4 border border-pink-100">
                    <h5 className="font-bold text-[#fe2c55] mb-2">🛍️ Shopee</h5>
                    <ul className="space-y-1 ml-4">
                      <li>• <strong>Com Frete Grátis:</strong> 14% comissão + 6% frete + R$ 4 fixo*</li>
                      <li>• <strong>Sem Frete Grátis:</strong> 12% comissão + 2% transação + R$ 4 fixo*</li>
                      <li>• <strong>*Produtos abaixo de R$ 8:</strong> Taxa fixa é 50% do valor do item (não R$ 4)</li>
                    </ul>
                  </div>

                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-gray-800 font-semibold mb-2">💡 Dicas Importantes:</p>
                    <ul className="space-y-1 ml-4 text-gray-700">
                      <li>• O custo fixo varia conforme o preço: R$ 6,00 (até R$ 40), R$ 6,50 (R$ 40-60), R$ 6,75 (R$ 60-79)</li>
                      <li>• A margem recomendada já considera custos operacionais e embalagem</li>
                      <li>• No Mercado Livre, o Premium tem maior custo mas gera mais vendas pela visibilidade</li>
                      <li>• Valores atualizados conforme políticas de 2024 dos marketplaces</li>
                    </ul>
                  </div>
                </div>
              </CollapsibleSection>
              )}
          <footer className="mt-12 pt-8 border-t border-white/10 dark:border-zinc-800/50 text-center pb-4">
            <p className="text-gray-400 text-sm font-medium font-iceland tracking-wide">Desenvolvido por: Jonatan Renan</p>
            <p className="text-gray-600 text-xs mt-1">Alob Express © todos os direitos reservados</p>
          </footer>
        </div>
      </div>
      <EditProductDialog
        key={editSessionId}
        product={editingProduct}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditMode('edit');
        }}
        onSave={handleSaveEditProduct}
        mode={editMode}
      />
    </div>
  );
};

export default DropshippingCalculator;
