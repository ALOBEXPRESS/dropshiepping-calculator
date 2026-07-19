import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogClose,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import Chart from 'react-apexcharts';
import type { ApexOptions } from 'apexcharts';
import { useRevenueReport } from '@/hooks/sales/useRevenueReport';
import { supabase } from '@/lib/supabase';
import { Loader2, Trash2 } from 'lucide-react';
import type { PeriodFilter } from '@/types/sales';
import { toast } from 'sonner';
import { ReferenceService, type Marketplace } from '@/services/referenceService';
import { AffiliateAccordion } from './AffiliateAccordion';
import { calcOrderProfit } from '@/utils/calcOrderProfit';

interface RevenueReportChartProps {
  organizationId: string;
  refreshTrigger?: number;
  onOrderDeleted?: () => void;
  period?: PeriodFilter;
  onPeriodChange?: (period: PeriodFilter) => void;
}


interface OrderDetail {
  order_id: string;
  bling_order_id?: string | null;
  order_number: string;
  order_date?: string | null;
  marketplace: string;
  marketplace_fixed_fee?: number;
  is_free_sample?: boolean;
  tiktok_reembolso_disabled?: boolean;
  tiktok_retorno_liquido?: number | null;
  customer_name?: string;
  product_name?: string;
  product_sku?: string;
  product_image_url?: string;
  affiliate_id?: string | null;
  products?: {
    name: string;
    sku?: string;
    quantity?: number;
    unit_price?: number;
    unit_cost?: number;
    supplier_fee_value?: string;
    supplier_fee_type?: string;
    supplier_gateway_fee_value?: string;
    supplier_gateway_fee_type?: string;
  }[];
  total_amount: number;
  total_products?: number;
  base_value?: number;
  total_cost: number;
  product_cost_price?: number;
  marketplace_commission: number;
  commission_rate: number;
  shipping_cost: number;
  other_expenses: number;
  discount_value?: number;
  supplier_fee_value?: string;
  supplier_fee_type?: string;
  supplier_gateway_fee_value?: string;
  supplier_gateway_fee_type?: string;
  total_profit: number;
  tiktok_sfp_enabled?: boolean;
}

export const RevenueReportChart: React.FC<RevenueReportChartProps> = ({ organizationId, refreshTrigger, onOrderDeleted, period: externalPeriod, onPeriodChange }) => {
  const [period, setPeriod] = useState<PeriodFilter>(externalPeriod || 'monthly');
  const [windowOffset, setWindowOffset] = useState(0);
  const { data, loading, error, refetch } = useRevenueReport(organizationId, period);
  // All-time totals — always use yearly to get all data regardless of current period filter
  const { data: yearlyData, refetch: refetchYearly } = useRevenueReport(organizationId, 'yearly');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<{ id: string; number: string; store: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);
  const [marketplaces, setMarketplaces] = useState<Marketplace[]>([]);
  const [cameFromAffiliate, setCameFromAffiliate] = useState(false);
  const [affiliateByOrderId, setAffiliateByOrderId] = useState<Record<string, boolean>>({});
  const affiliateByOrderIdRef = useRef<Record<string, boolean>>({});
  affiliateByOrderIdRef.current = affiliateByOrderId;

  // Persist modal state per order_id (discount, acrescimo, supplier fee, reembolso)
  type OrderModalState = {
    blingDiscountEnabled: boolean;
    manualDesconto: string;
    manualAcrescimo: string;
    tiktokReembolsoEnabled: boolean;
    manualSupplierFeePercent: string;
    manualGatewayFee: string;
    manualCostOverrides: Record<number, string>;
    manualShipping: string;
    manualRetornoLiquido: string;
  };
  const orderModalStateRef = useRef<Record<string, OrderModalState>>({});

  // Sincronizar período externo com interno
  useEffect(() => {
    if (externalPeriod && externalPeriod !== period) {
      setPeriod(externalPeriod);
    }
  }, [externalPeriod, period]);

  // Notificar mudança de período para o componente pai
  const handlePeriodChange = useCallback((newPeriod: PeriodFilter) => {
    setPeriod(newPeriod);
    setWindowOffset(0);
    if (onPeriodChange) {
      onPeriodChange(newPeriod);
    }
  }, [onPeriodChange]);
  const marketplacesForResolution = useMemo<Marketplace[]>(() => {
    if (marketplaces.length > 0) return marketplaces;
    return [{
      id: 'fallback-shopee',
      name: 'Shopee',
      commission_rate: 20,
      fixed_fee: 4,
      affiliate_commission_rate: 10,
      has_monthly_fee: false,
      monthly_fee_value: 0,
      is_system: true,
      account_type: null,
    }];
  }, [marketplaces]);

  const normalizeMarketplace = useCallback((value: string) => value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '')
    .trim(), []);

  const resolveMarketplaceConfig = useCallback((
    rawMarketplace: string | null | undefined,
    commissionRateValue: number | null | undefined,
    fixedFeeValue: number | null | undefined
  ) => {
    const raw = rawMarketplace ?? '';
    const normalizedRaw = normalizeMarketplace(raw);
    const hasExplicit = !!raw
      && normalizedRaw !== 'null'
      && normalizedRaw !== 'undefined'
      && normalizedRaw !== 'semmarketplace';

    const commissionRate = Number(commissionRateValue ?? 0);
    const fixedFee = Number(fixedFeeValue ?? 0);
    const shopee = marketplacesForResolution.find((mp) => normalizeMarketplace(mp.name) === 'shopee');

    if (!hasExplicit) {
      if (marketplacesForResolution.length === 1) return marketplacesForResolution[0];
      if (shopee && commissionRate === 0 && fixedFee === 0) return shopee;
    }

    const byName = hasExplicit
      ? marketplacesForResolution.find((mp) => normalizeMarketplace(mp.name) === normalizedRaw)
      : undefined;
    if (byName) return byName;

    const byExactRates = !hasExplicit
      ? marketplacesForResolution.find((mp) => {
        const rateMatches = Math.abs(Number(mp.commission_rate ?? 0) - commissionRate) < 0.0001;
        const fixedMatches = Math.abs(Number(mp.fixed_fee ?? 0) - fixedFee) < 0.01;
        return rateMatches && fixedMatches && (Number(mp.commission_rate ?? 0) > 0 || Number(mp.fixed_fee ?? 0) > 0);
      })
      : undefined;
    if (byExactRates) return byExactRates;

    const byRateOnly = !hasExplicit
      ? marketplacesForResolution.find((mp) => {
        const rateMatches = Math.abs(Number(mp.commission_rate ?? 0) - commissionRate) < 0.0001;
        return rateMatches && Number(mp.commission_rate ?? 0) > 0;
      })
      : undefined;
    if (byRateOnly) return byRateOnly;

    const byFixedOnly = !hasExplicit
      ? marketplacesForResolution.find((mp) => {
        const fixedMatches = Math.abs(Number(mp.fixed_fee ?? 0) - fixedFee) < 0.01;
        return fixedMatches && Number(mp.fixed_fee ?? 0) > 0;
      })
      : undefined;
    if (byFixedOnly) return byFixedOnly;

    return undefined;
  }, [marketplacesForResolution, normalizeMarketplace]);

  const computeOrderRealProfit = useCallback((
    order: unknown,
    marketplaceConfig: Marketplace | undefined,
    cameFromAffiliateOverride?: boolean
  ) => {
    const o = order as {
      order_id?: string;
      tiktok_sfp_enabled?: boolean | string;
      tiktok_reembolso_disabled?: boolean;
      tiktok_retorno_liquido?: number | null;
    };
    const cameFromAffiliate =
      cameFromAffiliateOverride ?? Boolean(o.order_id && affiliateByOrderIdRef.current?.[o.order_id]);
    return calcOrderProfit(
      order as Parameters<typeof calcOrderProfit>[0],
      marketplaceConfig,
      cameFromAffiliate
    );
  }, []);

  const [openProduto, setOpenProduto] = useState(false);
  const [openMarketplace, setOpenMarketplace] = useState(false);
  const [openDescontos, setOpenDescontos] = useState(false);
  const [openAcrescimos, setOpenAcrescimos] = useState(false);
  const [openRetornoLiquido, setOpenRetornoLiquido] = useState(false);
  // desconto do Bling pré-selecionado por padrão
  const [blingDiscountEnabled, setBlingDiscountEnabled] = useState(true);
  // desconto manual (quando checkbox desmarcado)
  const [manualDesconto, setManualDesconto] = useState<string>('');
  // cupom de desconto manual (% ou R$)
  const [manualCoupon, setManualCoupon] = useState<string>('');
  const [manualCouponType, setManualCouponType] = useState<'percent' | 'fixed'>('fixed');
  const [savingCoupon, setSavingCoupon] = useState(false);
  // acréscimo manual (valor em R$)
  const [manualAcrescimo, setManualAcrescimo] = useState<string>('');
  // reembolso TikTok = valor do desconto, somado ao lucro
  const [tiktokReembolsoEnabled, setTiktokReembolsoEnabled] = useState(true);
  // Retorno Líquido TikTok — quando preenchido, substitui todo custo marketplace + afiliados
  const [manualRetornoLiquido, setManualRetornoLiquido] = useState<string>('');
  // Taxas editáveis do fornecedor no modal
  const [manualSupplierFeePercent, setManualSupplierFeePercent] = useState<string>('');
  const [manualGatewayFee, setManualGatewayFee] = useState<string>('');
  const [manualCostOverrides, setManualCostOverrides] = useState<Record<number, string>>({});
  const [manualShipping, setManualShipping] = useState<string>('');
  const [manualMarketingCost, setManualMarketingCost] = useState<string>('');
  const [openMarketingCost, setOpenMarketingCost] = useState(false);
  const [marketingCostByProductId, setMarketingCostByProductId] = useState<Record<string, number>>({});
  const [savingMarketingCost, setSavingMarketingCost] = useState(false);
  const [linkedCampaignId, setLinkedCampaignId] = useState<string | null>(null);
  const [availableCampaigns, setAvailableCampaigns] = useState<Array<{ id: string; name: string; marketing_cost: number | null }>>([]);
  const [savingCosts, setSavingCosts] = useState(false);
  const [costsSaved, setCostsSaved] = useState(false);
  const [savingReembolso, setSavingReembolso] = useState(false);
  const [savingRetornoLiquido, setSavingRetornoLiquido] = useState(false);
  const [manualOrderDate, setManualOrderDate] = useState<string>('');
  const [savingOrderDate, setSavingOrderDate] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);
  const dataRef = useRef(data);
  dataRef.current = data;
  const periodRef = useRef(period);
  periodRef.current = period;
  // Estado de paginação por dataPointIndex — controla qual pedido está visível no tooltip
  const [tooltipPages, setTooltipPages] = useState<Record<number, number>>({});
  const tooltipPagesRef = useRef(tooltipPages);
  tooltipPagesRef.current = tooltipPages;

  // Bloqueia re-render do tooltip pela custom fn por ~300ms após nav click
  // para que o DOM update manual persista sem ser sobrescrito pelo mousemove
  const navClickBlockUntilRef = useRef<number>(0);
  const [orderEnrichmentById, setOrderEnrichmentById] = useState<Record<string, Partial<OrderDetail>>>({});
  const orderEnrichmentByIdRef = useRef(orderEnrichmentById);
  orderEnrichmentByIdRef.current = orderEnrichmentById;

  const mergeOrderForTooltip = useCallback((order: unknown) => {
    const o = order as {
      order_id?: string;
      total_cost?: number | string | null;
      product_cost_price?: number | string | null;
      products?: unknown[];
    };
    const orderId = o?.order_id;
    if (!orderId) return order;

    const enrichment = orderEnrichmentByIdRef.current[orderId];
    if (!enrichment) return order;

    const mergedProducts = (Array.isArray(o.products) && o.products.length > 0)
      ? o.products
      : (enrichment.products?.length ? enrichment.products : o.products);

    const orderTotalCost = Number(o.total_cost ?? 0);
    const enrichmentTotalCost = Number(enrichment.total_cost ?? 0);
    const mergedTotalCost = orderTotalCost > 0 ? orderTotalCost : (enrichmentTotalCost > 0 ? enrichmentTotalCost : orderTotalCost);

    const orderProductCostPrice = Number(o.product_cost_price ?? 0);
    const enrichmentProductCostPrice = Number(enrichment.product_cost_price ?? 0);
    const mergedProductCostPrice = orderProductCostPrice > 0
      ? orderProductCostPrice
      : (enrichmentProductCostPrice > 0 ? enrichmentProductCostPrice : orderProductCostPrice);

    return {
      ...(order as object),
      ...enrichment,
      products: mergedProducts,
      total_cost: mergedTotalCost,
      product_cost_price: mergedProductCostPrice,
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const chunk = <T,>(arr: T[], size: number) => {
      const out: T[][] = [];
      for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
      return out;
    };

    const fetchEnrichment = async () => {
      const currentData = dataRef.current ?? [];
      const allOrders = currentData.flatMap((p) => p.orders_data ?? []);
      const idsNeedingOrderRow = new Set<string>();
      const idsNeedingItems = new Set<string>();
      const orderNumberByReportId: Record<string, string> = {};

      const isMeaningfulCustomerName = (value: unknown) => {
        const v = String(value ?? '').trim();
        if (!v) return false;
        const lowered = v.toLowerCase();
        if (lowered === 'cliente') return false;
        if (lowered === 'cliente não identificado') return false;
        if (lowered === 'cliente nao identificado') return false;
        if (lowered === 'não identificado') return false;
        if (lowered === 'nao identificado') return false;
        return true;
      };

      for (const o of allOrders) {
        const id = (o as { order_id?: string }).order_id;
        if (!id) continue;
        const orderNumberRaw = (o as { order_number?: string | number | null }).order_number;
        const orderNumber = orderNumberRaw == null ? '' : String(orderNumberRaw).trim();
        if (orderNumber) orderNumberByReportId[id] = orderNumber;

        const existing = orderEnrichmentByIdRef.current[id];
        const hasCustomer = isMeaningfulCustomerName((o as { customer_name?: string }).customer_name)
          || isMeaningfulCustomerName(existing?.customer_name);

        if (!hasCustomer) idsNeedingOrderRow.add(id);

        const isFreeSample = (o as { is_free_sample?: boolean | string }).is_free_sample === true
          || String((o as { is_free_sample?: unknown }).is_free_sample ?? '') === 'true';
        const currentProducts = (o as { products?: unknown[] | null }).products ?? [];
        const existingProducts = existing?.products ?? [];
        const productsToInspect = ((currentProducts as unknown[])?.length ? (currentProducts as unknown[]) : existingProducts) as unknown[];
        const hasSupplierFeeConfigured =
          productsToInspect.some((p) => Number((p as { supplier_fee_value?: unknown }).supplier_fee_value ?? 0) > 0)
          || productsToInspect.some((p) => Number((p as { supplier_gateway_fee_value?: unknown }).supplier_gateway_fee_value ?? 0) > 0)
          || Number((o as { supplier_fee_value?: unknown }).supplier_fee_value ?? 0) > 0
          || Number((o as { supplier_gateway_fee_value?: unknown }).supplier_gateway_fee_value ?? 0) > 0;

        const needsItems =
          ((currentProducts as unknown[]).length === 0 && existingProducts.length === 0)
          || (isFreeSample && !hasSupplierFeeConfigured);

        if (needsItems) idsNeedingItems.add(id);
      }

      const orderIdsToFetch = Array.from(idsNeedingOrderRow);
      const itemOrderIdsToFetch = Array.from(idsNeedingItems);

      if (orderIdsToFetch.length === 0 && itemOrderIdsToFetch.length === 0) return;

      const updates: Record<string, Partial<OrderDetail>> = {};

      const pickCustomerNameFromOrderRow = (value: unknown) => {
        const row = (value ?? {}) as Record<string, unknown>;

        const looksLikePersonName = (s: string) => {
          const v = s.trim();
          if (v.length < 2 || v.length > 80) return false;
          if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)) return false;
          if (!/[A-Za-zÀ-ÖØ-öø-ÿ]/.test(v)) return false;
          if (/(https?:\/\/|@|\.(com|br|net|io))/i.test(v)) return false;
          return true;
        };

        type Candidate = { score: number; value: string };
        const candidates: Candidate[] = [];

        const addCandidate = (path: string, v: unknown) => {
          if (typeof v !== 'string') return;
          if (!isMeaningfulCustomerName(v)) return;
          if (!looksLikePersonName(v)) return;

          const valueTrimmed = v.trim();
          const p = path.toLowerCase();
          if (p.includes('product') || p.includes('item')) return;

          let score = 0;
          if (p.includes('customer') || p.includes('cliente') || p.includes('client')) score += 6;
          if (p.includes('buyer')) score += 5;
          if (p.includes('recipient') || p.includes('shipping') || p.includes('delivery') || p.includes('contact')) score += 4;
          if (p.includes('name') || p.includes('nome')) score += 2;
          if (p.includes('label')) score += 3;
          if (valueTrimmed.includes(' ')) score += 1;
          if (score === 0) return;

          candidates.push({ score, value: valueTrimmed });
        };

        const visit = (v: unknown, path: string, depth: number) => {
          if (depth > 4 || v == null) return;
          if (typeof v === 'string') {
            addCandidate(path, v);
            return;
          }
          if (Array.isArray(v)) {
            for (let i = 0; i < Math.min(v.length, 10); i += 1) {
              visit(v[i], `${path}[]`, depth + 1);
            }
            return;
          }
          if (typeof v === 'object') {
            for (const [k, vv] of Object.entries(v as Record<string, unknown>)) {
              const nextPath = path ? `${path}.${k}` : k;
              visit(vv, nextPath, depth + 1);
            }
          }
        };

        visit(row, '', 0);
        candidates.sort((a, b) => b.score - a.score);
        return candidates[0]?.value;
      };

      const reportIdsToResolve = Array.from(new Set([...orderIdsToFetch, ...itemOrderIdsToFetch]));
      const actualOrderIdByReportId: Record<string, string> = {};

      for (const reportIdsChunk of chunk(reportIdsToResolve, 100)) {
        type OrderCustomerRow = {
          id?: string | null;
          order_number?: string | number | null;
          lead_id?: string | null;
          customer_id?: string | null;
          leads?: { name?: string | null } | Array<{ name?: string | null }> | null;
        };

        const baseSelect = `
          id,
          order_number,
          lead_id,
          customer_id,
          leads!lead_id (
            name
          )
        `;

        const fetchOrdersRows = async (mode: 'byId' | 'byNumber', values: string[]) => {
          if (values.length === 0) return { data: [] as OrderCustomerRow[], error: null as unknown };

          if (mode === 'byId') {
            const { data, error } = await supabase
              .from('orders')
              .select(baseSelect)
              .or(`organization_id.eq.${organizationId},organization_id.is.null`)
              .in('id', values);

            return { data: (data ?? []) as OrderCustomerRow[], error: error as unknown };
          }

          const { data, error } = await supabase
            .from('orders')
            .select(baseSelect)
            .or(`organization_id.eq.${organizationId},organization_id.is.null`)
            .in('order_number', values);

          return { data: (data ?? []) as OrderCustomerRow[], error: error as unknown };
        };

        const fetchedRows: OrderCustomerRow[] = [];

        const { data: ordersRows, error: ordersError } = await fetchOrdersRows('byId', reportIdsChunk);

        if (ordersError) {
          console.error('Erro ao buscar dados do pedido para tooltip:', ordersError);
        } else {
          fetchedRows.push(...((ordersRows ?? []) as OrderCustomerRow[]));
        }

        const foundIds = new Set(
          fetchedRows.map((r) => String(r.id ?? '').trim()).filter(Boolean)
        );
        const missingReportIds = reportIdsChunk.filter((id) => !foundIds.has(id));
        const missingOrderNumbers = Array.from(new Set(
          missingReportIds
            .map((id) => String(orderNumberByReportId[id] ?? '').trim())
            .filter(Boolean)
        ));

        if (missingOrderNumbers.length > 0) {
          const { data: ordersByNumber, error: ordersByNumberError } = await fetchOrdersRows('byNumber', missingOrderNumbers);

          if (!ordersByNumberError) {
            fetchedRows.push(...((ordersByNumber ?? []) as OrderCustomerRow[]));
          }
        }

        const orderRowById: Record<string, OrderCustomerRow> = {};
        const orderRowByNumber: Record<string, OrderCustomerRow> = {};
        for (const row of fetchedRows) {
          const id = String(row.id ?? '').trim();
          const orderNumber = row.order_number == null ? '' : String(row.order_number).trim();
          if (id) orderRowById[id] = row;
          if (orderNumber) orderRowByNumber[orderNumber] = row;
        }

        const normalizeNameToken = (raw: string) =>
          raw
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^A-Za-z0-9]+/g, '')
            .toLowerCase();

        const extractTokenFromOrderNumber = (orderNumber: string) => {
          const raw = orderNumber.split(/[-_]/)[0] ?? '';
          const token = normalizeNameToken(raw);
          return token.length >= 3 ? token : '';
        };

        type BlingContactRow = {
          marketplace_order_number?: string | null;
          contact_name?: string | null;
        };

        const blingContactNameByMarketplaceOrderNumber: Record<string, string> = {};
        const marketplaceOrderNumbersInChunk = Array.from(new Set(
          reportIdsChunk
            .map((id) => String(orderNumberByReportId[id] ?? '').trim())
            .filter(Boolean)
        ));

        if (marketplaceOrderNumbersInChunk.length > 0) {
          for (const marketplaceOrderNumbersChunk of chunk(marketplaceOrderNumbersInChunk, 100)) {
            const { data: blingRows, error: blingError } = await supabase
              .from('bling_orders')
              .select('marketplace_order_number, contact_name')
              .eq('organization_id', organizationId)
              .in('marketplace_order_number', marketplaceOrderNumbersChunk);

            if (blingError) {
              console.error('Erro ao buscar contato do Bling para tooltip:', blingError);
              continue;
            }

            for (const row of (blingRows ?? []) as BlingContactRow[]) {
              const marketplaceOrderNumber = String(row.marketplace_order_number ?? '').trim();
              const contactName = String(row.contact_name ?? '').trim();
              if (!marketplaceOrderNumber || !contactName) continue;
              blingContactNameByMarketplaceOrderNumber[marketplaceOrderNumber] = contactName;
            }
          }
        }

        const tokensNeedingLeadLookup = Array.from(new Set(
          reportIdsChunk
            .filter((id) => idsNeedingOrderRow.has(id))
            .map((id) => extractTokenFromOrderNumber(String(orderNumberByReportId[id] ?? '').trim()))
            .filter(Boolean)
        ));

        const leadNameByToken: Record<string, string> = {};
        if (tokensNeedingLeadLookup.length > 0) {
          const safeTokens = tokensNeedingLeadLookup.map((t) => t.replace(/[%.,]/g, '')).filter(Boolean);
          const scoreLeadNameForToken = (candidateName: string, token: string) => {
            const v = candidateName.trim();
            if (!v) return 0;
            const normalized = normalizeNameToken(v);
            const hasDiacritics = /[\u0300-\u036f]/.test(v.normalize('NFD'));
            const looksTitleCased = /^[A-ZÀ-ÖØ-Þ][a-zà-öø-ÿ]+(?:\s+[A-ZÀ-ÖØ-Þ][a-zà-öø-ÿ]+)*$/.test(v);
            let score = 0;
            if (normalized === token) score += 2;
            if (hasDiacritics) score += 3;
            if (looksTitleCased) score += 1;
            return score;
          };

          const pickBetterName = (currentName: string | undefined, candidateName: string, token: string) => {
            if (!currentName) return candidateName;
            const currentScore = scoreLeadNameForToken(currentName, token);
            const candidateScore = scoreLeadNameForToken(candidateName, token);
            if (candidateScore > currentScore) return candidateName;
            if (candidateScore < currentScore) return currentName;
            if (candidateName.length < currentName.length) return candidateName;
            return currentName;
          };

          const scanLeadsPage = async (start: number, end: number) => {
            const orderedQuery = supabase
              .from('leads')
              .select('name')
              .eq('organization_id', organizationId)
              .order('created_at', { ascending: false })
              .range(start, end);

            const { data: orderedData, error: orderedError } = await orderedQuery;
            if (!orderedError) return { data: orderedData ?? [], error: null as typeof orderedError };

            const fallbackQuery = supabase
              .from('leads')
              .select('name')
              .eq('organization_id', organizationId)
              .range(start, end);

            const { data: fallbackData, error: fallbackError } = await fallbackQuery;
            return { data: fallbackData ?? [], error: fallbackError };
          };

          const maxLeadsToScan = 5000;
          const pageSize = 1000;
          for (let offset = 0; offset < maxLeadsToScan; offset += pageSize) {
            const { data: tokenLeadRows, error: tokenLeadError } = await scanLeadsPage(offset, offset + pageSize - 1);
            if (tokenLeadError) break;
            if (tokenLeadRows.length === 0) break;

            for (const row of tokenLeadRows as Array<{ name?: string | null }>) {
              const leadNameRaw = String(row?.name ?? '').trim();
              if (!leadNameRaw) continue;
              const normalizedLead = normalizeNameToken(leadNameRaw);
              for (const token of safeTokens) {
                if (!normalizedLead.includes(token)) continue;
                leadNameByToken[token] = pickBetterName(leadNameByToken[token], leadNameRaw, token);
              }
            }

            const allResolved = safeTokens.every((t) => Boolean(leadNameByToken[t]));
            if (allResolved) break;
          }
        }

        const reportIdNeedingFull: Array<{ reportId: string; actualId: string }> = [];

        for (const reportId of reportIdsChunk) {
          const orderNumber = String(orderNumberByReportId[reportId] ?? '').trim();
          const resolved = orderRowById[reportId] ?? (orderNumber ? orderRowByNumber[orderNumber] : undefined);
          const actualId = String(resolved?.id ?? '').trim();
          if (actualId) actualOrderIdByReportId[reportId] = actualId;

          if (!idsNeedingOrderRow.has(reportId)) continue;
          if (!resolved) continue;

          const existing = orderEnrichmentByIdRef.current[reportId];
          const leads = resolved.leads ?? null;
          const leadName = (Array.isArray(leads) ? leads[0]?.name : leads?.name) || undefined;
          const token = extractTokenFromOrderNumber(orderNumber);
          const tokenLeadName = token ? leadNameByToken[token] : undefined;
          const blingContactName = orderNumber ? blingContactNameByMarketplaceOrderNumber[orderNumber] : undefined;

          const rawCustomerName =
            leadName
            ?? blingContactName
            ?? tokenLeadName
            ?? existing?.customer_name;

          const derivedCustomerName =
            token && rawCustomerName && !/^cliente\b/i.test(String(rawCustomerName).trim())
              ? `Cliente ${String(rawCustomerName).trim()}`
              : rawCustomerName;

          const derivedCustomerNameWithFixes =
            token === 'sonia' && /^cliente\s+sonia$/i.test(String(derivedCustomerName ?? '').trim())
              ? 'Cliente Sônia'
              : derivedCustomerName;

          updates[reportId] = {
            ...(updates[reportId] ?? existing ?? {}),
            customer_name: derivedCustomerNameWithFixes ?? existing?.customer_name,
          };
          if (!isMeaningfulCustomerName(leadName) && !isMeaningfulCustomerName(derivedCustomerNameWithFixes) && actualId) {
            reportIdNeedingFull.push({ reportId, actualId });
          }
        }

        const actualIdsNeedingFull = Array.from(new Set(reportIdNeedingFull.map((x) => x.actualId)));
        if (actualIdsNeedingFull.length > 0) {
          const { data: fullOrders, error: fullOrdersError } = await supabase
            .from('orders')
            .select('*')
            .or(`organization_id.eq.${organizationId},organization_id.is.null`)
            .in('id', actualIdsNeedingFull);

          if (!fullOrdersError) {
            const fullById: Record<string, Record<string, unknown>> = {};
            for (const fullRow of (fullOrders ?? []) as Array<{ id?: string | null } & Record<string, unknown>>) {
              const id = String(fullRow.id ?? '').trim();
              if (!id) continue;
              fullById[id] = fullRow;
            }

            for (const { reportId, actualId } of reportIdNeedingFull) {
              const fullRow = fullById[actualId];
              if (!fullRow) continue;
              const picked = pickCustomerNameFromOrderRow(fullRow);
              if (!picked) continue;
              const existing = orderEnrichmentByIdRef.current[reportId];
              updates[reportId] = {
                ...(updates[reportId] ?? existing ?? {}),
                customer_name: picked,
              };
            }
          }
        }
      }

      for (const ids of chunk(itemOrderIdsToFetch, 100)) {
        const reportIdByActualOrderId: Record<string, string> = {};
        const actualIds = ids
          .map((reportId) => {
            const actualId = String(actualOrderIdByReportId[reportId] ?? '').trim();
            if (actualId) reportIdByActualOrderId[actualId] = reportId;
            return actualId;
          })
          .filter((v) => v.length > 0);

        if (actualIds.length === 0) continue;

        const { data: itemsRows, error: itemsError } = await supabase
          .from('order_items')
          .select('order_id, product_id, product_name, quantity, unit_cost, total_price')
          .in('order_id', actualIds)
          ;

        if (itemsError) {
          console.error('Erro ao buscar itens do pedido para tooltip:', itemsError);
          continue;
        }

        type OrderItemRow = {
          order_id?: string | null;
          product_id?: string | null;
          product_name?: string | null;
          quantity?: number | null;
          unit_cost?: number | null;
          total_price?: number | null;
        };

        const typedItemsRows = (itemsRows ?? []) as OrderItemRow[];

        type ProductLookupRow = {
          id?: string | null;
          sku?: string | null;
          name?: string | null;
          cost_price?: number | null;
          image_url?: string | null;
          supplier_fee_value?: number | null;
          supplier_fee_type?: string | null;
          supplier_gateway_fee_value?: number | null;
          supplier_gateway_fee_type?: string | null;
        };

        const normalizeKey = (raw: string) => {
          const v = raw.trim();
          if (!v) return [];
          const beforeCor = v.split(/\s+Cor:/i)[0]?.trim() ?? '';
          const beforeSemi = v.split(';')[0]?.trim() ?? '';
          const out = [v];
          if (beforeCor && beforeCor !== v) out.push(beforeCor);
          if (beforeSemi && beforeSemi !== v) out.push(beforeSemi);
          return Array.from(new Set(out.filter(Boolean)));
        };

        const candidateProductIds = Array.from(new Set(
          typedItemsRows
            .map((r) => String(r.product_id ?? '').trim())
            .filter((v) => v.length > 0)
        ));

        const candidateKeys = Array.from(new Set(
          typedItemsRows
            .flatMap((r) => {
              const name = String(r.product_name ?? '');
              return normalizeKey(name);
            })
            .map((v) => v.trim())
            .filter((v) => v.length > 0)
        ));

        const candidateNames = candidateKeys;
        const candidateSkus = candidateKeys;

        const productsById: Record<string, ProductLookupRow> = {};
        const productsBySku: Record<string, ProductLookupRow> = {};
        const productsByName: Record<string, ProductLookupRow> = {};

        for (const idChunk of chunk(candidateProductIds, 100)) {
          const { data: productRows, error: productError } = await supabase
            .from('products')
            .select('id, sku, name, cost_price, image_url, supplier_fee_value, supplier_fee_type, supplier_gateway_fee_value, supplier_gateway_fee_type')
            .in('id', idChunk);

          if (productError) continue;
          for (const row of (productRows ?? []) as ProductLookupRow[]) {
            const id = String(row.id ?? '').trim();
            const sku = String(row.sku ?? '').trim();
            const name = String(row.name ?? '').trim();
            if (id) productsById[id] = row;
            if (sku) productsBySku[sku] = row;
            if (name) productsByName[name] = row;
          }
        }

        for (const skuChunk of chunk(candidateSkus, 50)) {
          const { data: productRows, error: productError } = await supabase
            .from('products')
            .select('id, sku, name, cost_price, image_url, supplier_fee_value, supplier_fee_type, supplier_gateway_fee_value, supplier_gateway_fee_type')
            .in('sku', skuChunk);

          if (productError) continue;
          for (const row of (productRows ?? []) as ProductLookupRow[]) {
            const id = String(row.id ?? '').trim();
            const sku = String(row.sku ?? '').trim();
            const name = String(row.name ?? '').trim();
            if (id) productsById[id] = row;
            if (sku) productsBySku[sku] = row;
            if (name) productsByName[name] = row;
          }
        }

        const remainingNames = candidateNames.filter((name) => !productsByName[name]);
        for (const nameChunk of chunk(remainingNames, 50)) {
          const { data: productRows, error: productError } = await supabase
            .from('products')
            .select('id, sku, name, cost_price, image_url, supplier_fee_value, supplier_fee_type, supplier_gateway_fee_value, supplier_gateway_fee_type')
            .in('name', nameChunk);

          if (productError) continue;
          for (const row of (productRows ?? []) as ProductLookupRow[]) {
            const id = String(row.id ?? '').trim();
            const sku = String(row.sku ?? '').trim();
            const name = String(row.name ?? '').trim();
            if (id) productsById[id] = row;
            if (sku) productsBySku[sku] = row;
            if (name) productsByName[name] = row;
          }
        }

        // Fallback: fetch image from products_variations_bling for SKUs/names still missing image_url
        const skusMissingImage = candidateSkus.filter((sku) => {
          const row = productsBySku[sku];
          return !row || !row.image_url;
        });
        if (skusMissingImage.length > 0) {
          for (const skuChunk of chunk(skusMissingImage, 50)) {
            const { data: blingVarRows } = await supabase
              .from('products_variations_bling')
              .select('sku, name, image_url1, image_url2')
              .in('sku', skuChunk);
            for (const bvRow of (blingVarRows ?? []) as { sku?: string; name?: string; image_url1?: string; image_url2?: string }[]) {
              const sku = String(bvRow.sku ?? '').trim();
              const img = String(bvRow.image_url1 ?? bvRow.image_url2 ?? '').trim();
              if (!sku || !img) continue;
              if (productsBySku[sku]) {
                productsBySku[sku] = { ...productsBySku[sku], image_url: img };
              } else {
                productsBySku[sku] = { sku, image_url: img } as ProductLookupRow;
              }
            }
          }
        }
        // Also query products_variations_bling by name for items whose SKU is the variation SKU
        const namesMissingImage = candidateNames.filter((name) => {
          const row = productsByName[name];
          return !row || !row.image_url;
        });
        if (namesMissingImage.length > 0) {
          for (const nameChunk of chunk(namesMissingImage, 50)) {
            const { data: blingVarByName } = await supabase
              .from('products_variations_bling')
              .select('sku, name, image_url1, image_url2')
              .in('name', nameChunk);
            for (const bvRow of (blingVarByName ?? []) as { sku?: string; name?: string; image_url1?: string; image_url2?: string }[]) {
              const sku = String(bvRow.sku ?? '').trim();
              const name = String(bvRow.name ?? '').trim();
              const img = String(bvRow.image_url1 ?? bvRow.image_url2 ?? '').trim();
              if (!img) continue;
              if (sku && !productsBySku[sku]) productsBySku[sku] = { sku, image_url: img } as ProductLookupRow;
              if (name && !productsByName[name]) productsByName[name] = { sku, image_url: img } as ProductLookupRow;
              else if (name && productsByName[name] && !productsByName[name].image_url) {
                productsByName[name] = { ...productsByName[name], image_url: img };
              }
            }
          }
        }

        const grouped = typedItemsRows.reduce<Record<string, OrderItemRow[]>>((acc, item) => {
          const orderId = String(item.order_id ?? '');
          if (!orderId) return acc;
          (acc[orderId] ??= []).push(item);
          return acc;
        }, {});

        for (const [orderId, items] of Object.entries(grouped)) {
          const reportId = reportIdByActualOrderId[orderId] ?? orderId;
          const existing = orderEnrichmentByIdRef.current[reportId];
          const products = items
            .filter((it) => Boolean(it.product_name))
            .map((it) => {
              const quantity = Number(it.quantity ?? 0);
              const totalPrice = Number(it.total_price ?? 0);
              const unitPrice = quantity > 0 ? totalPrice / quantity : undefined;
              const productIdKey = String(it.product_id ?? '').trim();
              const nameKeyRaw = String(it.product_name ?? '').trim();
              const keys = normalizeKey(nameKeyRaw);
              const lookup = (productIdKey && productsById[productIdKey])
                || keys.map((k) => productsBySku[k]).find(Boolean)
                || keys.map((k) => productsByName[k]).find(Boolean)
                || undefined;
              const resolvedSku = String(lookup?.sku ?? '').trim();
              const resolvedName = String(lookup?.name ?? it.product_name ?? '').trim();
              const rawUnitCost = Number(it.unit_cost ?? 0);
              const resolvedUnitCost = rawUnitCost > 0 ? rawUnitCost : Number(lookup?.cost_price ?? 0);
              const resolvedImageUrl = String(lookup?.image_url ?? '').trim() || undefined;
              return {
                name: resolvedName,
                sku: resolvedSku || undefined,
                image_url: resolvedImageUrl,
                quantity: quantity || undefined,
                unit_price: unitPrice,
                unit_cost: resolvedUnitCost > 0 ? resolvedUnitCost : undefined,
                supplier_fee_value: lookup?.supplier_fee_value != null ? String(lookup.supplier_fee_value) : undefined,
                supplier_fee_type: lookup?.supplier_fee_type != null ? String(lookup.supplier_fee_type) : undefined,
                supplier_gateway_fee_value: lookup?.supplier_gateway_fee_value != null ? String(lookup.supplier_gateway_fee_value) : undefined,
                supplier_gateway_fee_type: lookup?.supplier_gateway_fee_type != null ? String(lookup.supplier_gateway_fee_type) : undefined,
              };
            });

          const totalQty = products.reduce((sum, p) => sum + Number(p.quantity ?? 0), 0);
          const totalCost = products.reduce((sum, p) => sum + (Number(p.unit_cost ?? 0) * Number(p.quantity ?? 0)), 0);
          const avgUnitCost = totalQty > 0 ? totalCost / totalQty : 0;

          const fallbackMainName = products[0]?.name;
          const prevTotalCost = Number((updates[reportId]?.total_cost ?? existing?.total_cost ?? 0));
          const prevProductCostPrice = Number((updates[reportId]?.product_cost_price ?? existing?.product_cost_price ?? 0));

          updates[reportId] = {
            ...(updates[reportId] ?? existing ?? {}),
            products: products.length > 0 ? products : (updates[reportId]?.products ?? existing?.products),
            product_name: (updates[reportId]?.product_name ?? existing?.product_name ?? fallbackMainName),
            product_sku: (updates[reportId]?.product_sku ?? existing?.product_sku ?? (products[0]?.sku || undefined)),
            product_image_url: (updates[reportId]?.product_image_url ?? existing?.product_image_url ?? (products[0]?.image_url || undefined)),
            total_cost: prevTotalCost > 0 ? prevTotalCost : (totalCost > 0 ? totalCost : prevTotalCost),
            product_cost_price: prevProductCostPrice > 0 ? prevProductCostPrice : (avgUnitCost > 0 ? avgUnitCost : prevProductCostPrice),
          };
        }

        const remainingWithoutItems = ids.filter((reportId) => {
          const actualId = String(actualOrderIdByReportId[reportId] ?? '').trim();
          return !actualId || !grouped[actualId];
        });
        if (remainingWithoutItems.length > 0) {
          for (const remainingChunk of chunk(remainingWithoutItems, 100)) {
            const freeSampleActualIds = remainingChunk
              .map((reportId) => String(actualOrderIdByReportId[reportId] ?? '').trim())
              .filter((v) => v.length > 0);

            if (freeSampleActualIds.length === 0) continue;

            const { data: freeSampleRows, error: freeSampleError } = await supabase
              .from('influencer_free_samples')
              .select('order_id, product_name, product_image_url')
              .in('order_id', freeSampleActualIds);

            if (freeSampleError) continue;

            type FreeSampleRow = {
              order_id?: string | null;
              product_name?: string | null;
              product_image_url?: string | null;
            };

            const typedFreeSamples = (freeSampleRows ?? []) as FreeSampleRow[];
            const productKeys = Array.from(new Set(
              typedFreeSamples
                .flatMap((r) => normalizeKey(String(r.product_name ?? '')))
                .map((v) => v.trim())
                .filter((v) => v.length > 0)
            ));

            const productsBySku: Record<string, ProductLookupRow> = {};
            const productsByName: Record<string, ProductLookupRow> = {};
            for (const skuChunk of chunk(productKeys, 50)) {
              const { data: productRows, error: productError } = await supabase
                .from('products')
                .select('sku, name, cost_price, image_url, supplier_fee_value, supplier_fee_type, supplier_gateway_fee_value, supplier_gateway_fee_type')
                .in('sku', skuChunk);

              if (productError) continue;
              for (const row of (productRows ?? []) as ProductLookupRow[]) {
                const sku = String(row.sku ?? '').trim();
                const name = String(row.name ?? '').trim();
                if (!sku) continue;
                productsBySku[sku] = row;
                if (name) productsByName[name] = row;
              }
            }

            const remainingNames = productKeys.filter((name) => !productsByName[name]);
            for (const nameChunk of chunk(remainingNames, 50)) {
              const { data: productRows, error: productError } = await supabase
                .from('products')
                .select('sku, name, cost_price, image_url, supplier_fee_value, supplier_fee_type, supplier_gateway_fee_value, supplier_gateway_fee_type')
                .in('name', nameChunk);

              if (productError) continue;
              for (const row of (productRows ?? []) as ProductLookupRow[]) {
                const sku = String(row.sku ?? '').trim();
                const name = String(row.name ?? '').trim();
                if (sku) productsBySku[sku] = row;
                if (name) productsByName[name] = row;
              }
            }

            for (const row of typedFreeSamples) {
              const orderId = String(row.order_id ?? '');
              if (!orderId) continue;
              const reportId = reportIdByActualOrderId[orderId] ?? orderId;
              const existing = orderEnrichmentByIdRef.current[reportId];
              const rawKey = String(row.product_name ?? '').trim();
              if (!rawKey) continue;
              const keys = normalizeKey(rawKey);

              const product = keys.map((k) => productsBySku[k]).find(Boolean)
                ?? keys.map((k) => productsByName[k]).find(Boolean);
              const unitCost = Number(product?.cost_price ?? 0);
              const resolvedName = String(product?.name ?? keys[0] ?? rawKey);
              const resolvedSku = String(product?.sku ?? '').trim() || undefined;
              const imageUrl = String(row.product_image_url ?? product?.image_url ?? '').trim() || undefined;

              const prevTotalCost = Number((updates[reportId]?.total_cost ?? existing?.total_cost ?? 0));
              const prevProductCostPrice = Number((updates[reportId]?.product_cost_price ?? existing?.product_cost_price ?? 0));

              updates[reportId] = {
                ...(updates[reportId] ?? existing ?? {}),
                product_name: updates[reportId]?.product_name ?? existing?.product_name ?? resolvedName,
                product_sku: updates[reportId]?.product_sku ?? existing?.product_sku ?? resolvedSku ?? rawKey,
                product_image_url: updates[reportId]?.product_image_url ?? existing?.product_image_url ?? imageUrl,
                products: updates[reportId]?.products ?? existing?.products ?? [{
                  name: resolvedName,
                  sku: resolvedSku ?? rawKey,
                  quantity: 1,
                  unit_price: 0,
                  unit_cost: unitCost > 0 ? unitCost : undefined,
                  supplier_fee_value: product?.supplier_fee_value != null ? String(product.supplier_fee_value) : undefined,
                  supplier_fee_type: product?.supplier_fee_type != null ? String(product.supplier_fee_type) : undefined,
                  supplier_gateway_fee_value: product?.supplier_gateway_fee_value != null ? String(product.supplier_gateway_fee_value) : undefined,
                  supplier_gateway_fee_type: product?.supplier_gateway_fee_type != null ? String(product.supplier_gateway_fee_type) : undefined,
                }],
                total_cost: prevTotalCost > 0 ? prevTotalCost : (unitCost > 0 ? unitCost : prevTotalCost),
                product_cost_price: prevProductCostPrice > 0 ? prevProductCostPrice : (unitCost > 0 ? unitCost : prevProductCostPrice),
              };
            }
          }
        }
      }

      if (cancelled) return;
      if (Object.keys(updates).length === 0) return;

      setOrderEnrichmentById((prev) => ({
        ...prev,
        ...updates,
      }));
    };

    fetchEnrichment().catch((err) => {
      console.error('Erro ao enriquecer pedidos para tooltip:', err);
    });

    return () => {
      cancelled = true;
    };
  }, [data, organizationId]);

  // Fetch marketing costs from campaign_products (one cost per campaign, not per order)
  useEffect(() => {
    const fetchMarketingCosts = async () => {
      const allOrderIds = data.flatMap((period) =>
        (period.orders_data ?? []).map((o) => (o as { order_id?: string }).order_id).filter(Boolean) as string[]
      );
      if (allOrderIds.length === 0) return;

      // Fetch campaign_products where linked_order_id is in allOrderIds
      // Each campaign has one marketing_cost_override — don't double-count campaigns
      const { data: cpRows } = await supabase
        .from('campaign_products')
        .select('campaign_id, linked_order_id, marketing_cost_override')
        .in('linked_order_id', allOrderIds)
        .not('marketing_cost_override', 'is', null);

      const costMap: Record<string, number> = {};
      // Track which campaigns we've already accounted for to avoid double-counting
      const seenCampaigns = new Map<string, number>(); // campaign_id -> cost

      for (const row of (cpRows ?? []) as Array<{ campaign_id: string | null; linked_order_id: string; marketing_cost_override: number }>) {
        if (!row.linked_order_id) continue;
        const cost = Number(row.marketing_cost_override ?? 0);
        // Each campaign counted once — assign cost to first order found, 0 to rest
        if (row.campaign_id) {
          if (!seenCampaigns.has(row.campaign_id)) {
            seenCampaigns.set(row.campaign_id, cost);
            costMap[`order:${row.linked_order_id}`] = cost;
          } else {
            // Same campaign already counted — this order gets 0 marketing cost
            costMap[`order:${row.linked_order_id}`] = 0;
          }
        } else {
          costMap[`order:${row.linked_order_id}`] = cost;
        }
      }

      // Also fetch legacy campaign_order_costs for orders not covered by campaign_products
      const coveredOrderIds = new Set(Object.keys(costMap).map(k => k.replace('order:', '')));
      const uncoveredIds = allOrderIds.filter(id => !coveredOrderIds.has(id));
      if (uncoveredIds.length > 0) {
        const { data: costRows } = await supabase
          .from('campaign_order_costs')
          .select('order_id, marketing_cost, campaign_id')
          .in('order_id', uncoveredIds);
        for (const row of (costRows ?? []) as Array<{ order_id: string; marketing_cost: number; campaign_id: string | null }>) {
          if (row.campaign_id && seenCampaigns.has(row.campaign_id)) continue; // skip duplicate campaigns
          if (row.campaign_id) seenCampaigns.set(row.campaign_id, Number(row.marketing_cost));
          costMap[`order:${row.order_id}`] = Number(row.marketing_cost ?? 0);
        }
      }

      setMarketingCostByProductId(costMap);
    };
    fetchMarketingCosts().catch(() => {});
  }, [data, organizationId]);

  useEffect(() => {
    let cancelled = false;
    ReferenceService.getMarketplaces(organizationId)
      .then((list) => {
        if (!cancelled) setMarketplaces(list || []);
      })
      .catch(() => {
        if (!cancelled) setMarketplaces([]);
      });
    return () => {
      cancelled = true;
    };
  }, [organizationId]);

  // Adicionar CSS global para manter tooltip visível ao passar mouse sobre ele
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .apexcharts-tooltip-custom {
        pointer-events: auto !important;
      }
      .apexcharts-tooltip.apexcharts-active {
        pointer-events: auto !important;
      }
      .apexcharts-tooltip:hover {
        display: block !important;
        opacity: 1 !important;
        visibility: visible !important;
      }
      .apexcharts-tooltip.apexcharts-tooltip-hover-lock {
        display: block !important;
        opacity: 1 !important;
        visibility: visible !important;
        pointer-events: auto !important;
      }
      /* Gap bridge: tooltip fixed topLeft, data points spread rightward.
         Extend pointer-events right so mouse can travel from right-side data point to tooltip */
      .apexcharts-tooltip.apexcharts-active::after {
        content: '';
        position: absolute;
        top: -20px;
        left: 100%;
        width: 600px;
        height: calc(100% + 40px);
        pointer-events: auto;
      }
    `;
    document.head.appendChild(style);

    // Impedir que cliques dentro do tooltip fechem o tooltip no ApexCharts
    // O ApexCharts escuta 'mousedown' no document para fechar o tooltip
    const preventTooltipClose = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('.apexcharts-tooltip')) {
        e.stopImmediatePropagation();
        e.stopPropagation();
      }
    };
    // Capturar na fase de captura ANTES do ApexCharts
    document.addEventListener('mousedown', preventTooltipClose, true);
    document.addEventListener('touchstart', preventTooltipClose as EventListener, true);

    // Lock tooltip visibility while mouse is over it — prevents ApexCharts from hiding it
    // when mouse moves from chart SVG onto the tooltip element
    const lockTooltip = () => {
      const tt = document.querySelector('.apexcharts-tooltip') as HTMLElement | null;
      if (tt) {
        tt.classList.add('apexcharts-tooltip-hover-lock');
        tt.style.opacity = '1';
        tt.style.display = 'block';
      }
    };
    const unlockTooltip = () => {
      const tt = document.querySelector('.apexcharts-tooltip') as HTMLElement | null;
      if (tt) tt.classList.remove('apexcharts-tooltip-hover-lock');
    };
    document.addEventListener('mouseover', (e) => {
      if ((e.target as HTMLElement).closest('.apexcharts-tooltip')) lockTooltip();
    }, true);
    document.addEventListener('mouseout', (e) => {
      const related = (e as MouseEvent).relatedTarget as HTMLElement | null;
      if (!(related?.closest?.('.apexcharts-tooltip'))) unlockTooltip();
    }, true);

    return () => {
      document.head.removeChild(style);
      document.removeEventListener('mousedown', preventTooltipClose, true);
      document.removeEventListener('touchstart', preventTooltipClose as EventListener, true);
    };
  }, []);

  // Adicionar event listeners para os botões de excluir e detalhar no tooltip
  useEffect(() => {
    const handleTooltipClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // Botão de excluir
      const deleteButton = target.closest('[data-delete-order-btn]') as HTMLElement;
      if (deleteButton) {
        e.preventDefault();
        e.stopPropagation();
        
        const orderId = deleteButton.getAttribute('data-order-id');
        const orderNumber = deleteButton.getAttribute('data-order-number');
        const orderStore = deleteButton.getAttribute('data-order-store');
        
        if (orderId && orderNumber && orderStore) {
          setOrderToDelete({ id: orderId, number: orderNumber, store: orderStore });
          setDeleteDialogOpen(true);
        }
        return;
      }

      // Botão de navegação (setas prev/next)
      const navButton = target.closest('[data-tooltip-nav]') as HTMLElement;
      if (navButton && !navButton.hasAttribute('disabled')) {
        e.preventDefault();
        e.stopPropagation();
        const dir = navButton.getAttribute('data-nav-dir');
        const key = navButton.getAttribute('data-nav-key');
        const max = Number(navButton.getAttribute('data-nav-max'));
        if (key) {
          const visualIdx = parseInt(key.replace('tooltip_page_', ''), 10);
          const windowOffsetCurrent = (window as unknown as { __chartWindowOffset?: number }).__chartWindowOffset ?? 0;
          const globalIdx = windowOffsetCurrent + visualIdx;
          const currentUnsafe = tooltipPagesRef.current[globalIdx] ?? 0;
          const current = Number.isFinite(max) ? Math.min(currentUnsafe, max) : currentUnsafe;
          const next = dir === 'next' ? Math.min(current + 1, max) : Math.max(current - 1, 0);

          // Lock tooltip visible before DOM update
          const tooltipLock = document.querySelector('.apexcharts-tooltip') as HTMLElement | null;
          if (tooltipLock) {
            tooltipLock.classList.add('apexcharts-tooltip-hover-lock');
            tooltipLock.style.opacity = '1';
            tooltipLock.style.display = 'block';
          }

          // Atualizar ref imediatamente (antes do DOM update, não aguarda re-render)
          tooltipPagesRef.current = { ...tooltipPagesRef.current, [globalIdx]: next };
          // Bloquear custom fn por 400ms para que DOM update não seja sobrescrito pelo followCursor
          navClickBlockUntilRef.current = Date.now() + 400;
          // Atualizar estado React (key = globalIdx para consistência com série)
          setTooltipPages(prev => ({ ...prev, [globalIdx]: next }));

          // NÃO chamar updateSeries aqui — updateSeries fecha/reseta o tooltip internamente
          // o que impede a visualização imediata do novo pedido.
          // A série só é atualizada quando o usuário mover o mouse (novo hover),
          // o que é aceitável pois a navegação é apenas visual no tooltip.

          // Atualizar o HTML do tooltip diretamente no DOM (resposta imediata)
          // Nota: não exigir .apexcharts-active pois ao clicar botão dentro do tooltip
          // o ApexCharts pode ter removido a classe antes do click event disparar
          const tooltipEl = document.querySelector('.apexcharts-tooltip.apexcharts-active')
            ?? document.querySelector('.apexcharts-tooltip');
          if (tooltipEl) {
            const currentData = dataRef.current;
            if (!isNaN(globalIdx) && currentData[globalIdx]) {
              const periodData = currentData[globalIdx];
              const ordersCount = periodData.orders_data?.length || 0;
              const safeNext = ordersCount > 0 ? Math.min(next, ordersCount - 1) : 0;
              const order = periodData.orders_data?.[safeNext];

              if (order) {
                const rawMarketplace = (order as { marketplace?: string }).marketplace ?? '';
                const normalizedRawMarketplace = normalizeMarketplace(rawMarketplace);
                const hasExplicitMarketplace = !!rawMarketplace
                  && normalizedRawMarketplace !== 'null'
                  && normalizedRawMarketplace !== 'undefined'
                  && normalizedRawMarketplace !== 'semmarketplace';
                const resolvedMarketplaceConfig = resolveMarketplaceConfig(
                  (order as { marketplace?: string }).marketplace,
                  Number((order as { commission_rate?: number }).commission_rate ?? 0),
                  Number((order as { marketplace_fixed_fee?: number }).marketplace_fixed_fee ?? 0)
                );
                const marketplaceName = resolvedMarketplaceConfig?.name
                  ?? (hasExplicitMarketplace ? rawMarketplace : 'Sem marketplace');
                const mergedOrder = mergeOrderForTooltip(order) as unknown as {
                  customer_name?: string;
                  product_name?: string;
                  product_sku?: string;
                  products?: Array<{ name: string; sku?: string }>;
                };
                const customerName = mergedOrder.customer_name || 'Cliente não identificado';
                const orderNumber = order.order_number || 'S/N';
                const productsForDisplay = mergedOrder.products ?? [];
                const productNamesFromItems = productsForDisplay.map((p) => p.name).filter(Boolean) as string[];
                const mainProductName = mergedOrder.product_name || productNamesFromItems[0] || 'Produto não vinculado';
                const productCount = productNamesFromItems.length;
                const productSku = mergedOrder.product_sku || (productsForDisplay[0]?.sku ?? null);
                const { realProfit, isFreeSample } = computeOrderRealProfit(mergedOrder, resolvedMarketplaceConfig);
                const isPersonalPurchase = (order as { is_personal_purchase?: boolean }).is_personal_purchase === true;
                const profitLabel = realProfit >= 0 ? 'Lucro:' : 'Prejuízo:';
                const profitValue = realProfit >= 0
                  ? formatCurrency(realProfit)
                  : `- ${formatCurrency(Math.abs(realProfit))}`;
                const profitColor = isPersonalPurchase ? '#fed7aa' : isFreeSample ? '#e9d5ff' : (realProfit >= 0 ? '#16a34a' : '#dc2626');

                const textPrimary = isPersonalPurchase ? '#fff7ed' : isFreeSample ? '#f3e8ff' : '#374151';
                const textSecondary = isPersonalPurchase ? '#fdba74' : isFreeSample ? '#d8b4fe' : '#6b7280';
                const dividerColor = isPersonalPurchase ? 'rgba(251,146,60,0.3)' : isFreeSample ? 'rgba(167,139,250,0.3)' : 'rgba(2,6,23,0.08)';
                const navBtnBg = isPersonalPurchase ? 'rgba(234,88,12,0.4)' : isFreeSample ? 'rgba(109,40,217,0.4)' : '#e5e7eb';
                const navBtnColor = isPersonalPurchase ? '#fed7aa' : isFreeSample ? '#e9d5ff' : '#374151';
                const navBtnDisabledBg = isPersonalPurchase ? 'rgba(234,88,12,0.15)' : isFreeSample ? 'rgba(109,40,217,0.15)' : 'rgba(2,6,23,0.06)';
                const navBtnDisabledColor = isPersonalPurchase ? 'rgba(254,215,170,0.3)' : isFreeSample ? 'rgba(233,213,255,0.3)' : '#d1d5db';

                const orderDetailData = {
                  order_id: order.order_id,
                  bling_order_id: (order as { bling_order_id?: string | null }).bling_order_id ?? null,
                  order_date: (order as { order_date?: string | null }).order_date ?? null,
                  tiktok_reembolso_disabled: (order as { tiktok_reembolso_disabled?: boolean }).tiktok_reembolso_disabled === true,
                  tiktok_retorno_liquido: (order as { tiktok_retorno_liquido?: number | null }).tiktok_retorno_liquido ?? null,
                  order_number: orderNumber, marketplace: marketplaceName,
                  marketplace_fixed_fee: Number(resolvedMarketplaceConfig?.fixed_fee ?? (order as { marketplace_fixed_fee?: number }).marketplace_fixed_fee ?? 0),
                  customer_name: customerName, product_name: mainProductName, product_sku: productSku || undefined,
                  product_image_url: (mergedOrder as { product_image_url?: string }).product_image_url
                    || undefined,
                  products: (mergedOrder as { products?: unknown[] }).products,
                  total_amount: Number(order.total_amount ?? 0),
                  total_products: Number((order as { total_products?: number | string | null }).total_products ?? order.total_amount ?? 0),
                  base_value: Number((order as { base_value?: number | string | null }).base_value ?? 0),
                  total_cost: Number((mergedOrder as { total_cost?: number | string | null }).total_cost ?? 0),
                  product_cost_price: Number((mergedOrder as { product_cost_price?: number | string | null }).product_cost_price ?? 0),
                  marketplace_commission: Number(order.marketplace_commission ?? 0),
                  commission_rate: Number(resolvedMarketplaceConfig?.commission_rate ?? order.commission_rate ?? 0),
                  shipping_cost: Number(order.shipping_cost ?? 0),
                  other_expenses: Number(order.other_expenses ?? 0),
                  discount_value: Number((order as { discount_value?: number | string | null }).discount_value ?? 0),
                  supplier_fee_value: (order as { supplier_fee_value?: string }).supplier_fee_value,
                  supplier_fee_type: (order as { supplier_fee_type?: string }).supplier_fee_type,
                  supplier_gateway_fee_value: (order as { supplier_gateway_fee_value?: string }).supplier_gateway_fee_value,
                  supplier_gateway_fee_type: (order as { supplier_gateway_fee_type?: string }).supplier_gateway_fee_type,
                  total_profit: realProfit,
                  tiktok_sfp_enabled: (order as { tiktok_sfp_enabled?: boolean | string }).tiktok_sfp_enabled === true
                    || String((order as { tiktok_sfp_enabled?: unknown }).tiktok_sfp_enabled) === 'true',
                  is_free_sample: isFreeSample,
                };

                const navHtml = `
                  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;padding-bottom:6px;border-bottom:1px solid ${dividerColor};">
                    <button data-tooltip-nav data-nav-dir="prev" data-nav-key="${key}" data-nav-max="${ordersCount - 1}"
                      style="background:${next === 0 ? navBtnDisabledBg : navBtnBg};color:${next === 0 ? navBtnDisabledColor : navBtnColor};border:none;border-radius:4px;padding:3px 8px;font-size:11px;cursor:${next === 0 ? 'default' : 'pointer'};font-weight:600;line-height:1;"
                      ${next === 0 ? 'disabled' : ''}>‹</button>
                    <span style="font-size:11px;color:${textSecondary};font-weight:500">${next + 1} / ${ordersCount} pedido${ordersCount > 1 ? 's' : ''}</span>
                    <button data-tooltip-nav data-nav-dir="next" data-nav-key="${key}" data-nav-max="${ordersCount - 1}"
                      style="background:${next === ordersCount - 1 ? navBtnDisabledBg : navBtnBg};color:${next === ordersCount - 1 ? navBtnDisabledColor : navBtnColor};border:none;border-radius:4px;padding:3px 8px;font-size:11px;cursor:${next === ordersCount - 1 ? 'default' : 'pointer'};font-weight:600;line-height:1;"
                      ${next === ordersCount - 1 ? 'disabled' : ''}>›</button>
                  </div>`;

                const freeSampleBadge = isFreeSample ? `
                  <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;padding:5px 8px;background:rgba(109,40,217,0.35);border-radius:6px;border:1px solid rgba(167,139,250,0.4);">
                    <span style="font-size:13px;">🎁</span>
                    <span style="font-size:10px;font-weight:800;color:#e9d5ff;letter-spacing:0.08em;text-transform:uppercase;">Pedido de Amostra Grátis</span>
                  </div>
                ` : '';

                const newOrderInnerHtml = `
                  ${navHtml}
                  ${freeSampleBadge}
                  <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:6px">
                    <div style="flex:1;min-width:0">
                      <div style="font-size:11px;color:${textPrimary};font-weight:600;margin-bottom:2px">${customerName}</div>
                      <div style="font-size:10px;color:${textSecondary};margin-bottom:2px">🏪 ${marketplaceName} • Pedido #${orderNumber}</div>
                      <div style="font-size:10px;color:${textPrimary};margin-bottom:2px">
                        📦 ${mainProductName.length > 28 ? mainProductName.substring(0, 28) + '...' : mainProductName}
                        ${productSku ? ` (SKU: ${productSku})` : ''}
                      </div>
                      ${productCount > 1 ? `<div style="font-size:10px;color:${textSecondary}">+${productCount - 1} produto(s)</div>` : ''}
                    </div>
                    <div style="display:flex;flex-direction:column;gap:4px;flex-shrink:0">
                      <button data-detail-order-btn data-order-detail='${JSON.stringify(orderDetailData).replace(/'/g, "&apos;")}'
                        style="background:#3b82f6;color:white;border:none;border-radius:4px;padding:4px 8px;font-size:10px;cursor:pointer;font-weight:500;white-space:nowrap;">Detalhar</button>
                      <button data-delete-order-btn data-order-id="${order.order_id}" data-order-number="${orderNumber}" data-order-store="${marketplaceName}"
                        style="background:#ef4444;color:white;border:none;border-radius:4px;padding:4px 8px;font-size:10px;cursor:pointer;font-weight:500;white-space:nowrap;">Excluir</button>
                    </div>
                  </div>
                  <div style="display:flex;justify-content:space-between;font-size:11px;padding-top:6px;border-top:1px solid ${dividerColor}">
                    <span style="color:${textSecondary};font-weight:600">${profitLabel}</span>
                    <span style="font-weight:800;color:${profitColor}">${profitValue}</span>
                  </div>
                `;

                const orderRoot = tooltipEl.querySelector('[data-tooltip-order-root]') as HTMLElement | null;
                if (orderRoot) {
                  orderRoot.innerHTML = newOrderInnerHtml;
                  // Force repaint — browser may defer paint when mouse is over tooltip (not chart)
                  // Reading offsetHeight flushes layout and forces visual update
                  void (tooltipEl as HTMLElement).offsetHeight;
                  // Also ensure tooltip stays visible
                  (tooltipEl as HTMLElement).style.opacity = '1';
                  (tooltipEl as HTMLElement).style.display = 'block';
                }

              }
            }
          }
        }
        return;
      }

      // Botão de detalhar
      const detailButton = target.closest('[data-detail-order-btn]') as HTMLElement;
      if (detailButton) {
        e.preventDefault();
        e.stopPropagation();
        
        const orderDataStr = detailButton.getAttribute('data-order-detail');
        if (orderDataStr) {
          try {
            const orderData = JSON.parse(orderDataStr) as OrderDetail;
            const enrichment = orderEnrichmentByIdRef.current[orderData.order_id];
            const merged: OrderDetail = {
              ...orderData,
              ...(enrichment ?? {}),
              products: (enrichment?.products?.length ? enrichment.products : orderData.products),
              // Always preserve these from orderData — enrichment doesn't carry them
              bling_order_id: orderData.bling_order_id,
              tiktok_reembolso_disabled: orderData.tiktok_reembolso_disabled,
            };
            setSelectedOrder(merged);
            setCameFromAffiliate(Boolean(affiliateByOrderIdRef.current?.[merged.order_id]));
            setOpenProduto(false);
            setOpenMarketplace(false);
            setOpenDescontos(false);
            setOpenAcrescimos(false);
            // Restore persisted state for this order, or use defaults
            const saved = orderModalStateRef.current[merged.order_id];
            setBlingDiscountEnabled(saved?.blingDiscountEnabled ?? true);
            setManualDesconto(saved?.manualDesconto ?? '');
            setManualAcrescimo(saved?.manualAcrescimo ?? '');
            setTiktokReembolsoEnabled(
              saved?.tiktokReembolsoEnabled ??
              !(merged.tiktok_reembolso_disabled === true)
            );
            setManualSupplierFeePercent(saved?.manualSupplierFeePercent ?? '');
            setManualGatewayFee(saved?.manualGatewayFee ?? '');
            setManualCostOverrides(saved?.manualCostOverrides ?? {});
            setManualShipping(saved?.manualShipping ?? '');
            setManualRetornoLiquido(
              saved?.manualRetornoLiquido ??
              (merged.tiktok_retorno_liquido != null ? String(merged.tiktok_retorno_liquido).replace('.', ',') : '')
            );
            setManualOrderDate(merged.order_date ?? '');
            setManualMarketingCost('');
            setManualCoupon('');
            setManualCouponType('fixed');
            setSavingCoupon(false);
            setLinkedCampaignId(null);
            setAvailableCampaigns([]);
            // Auto-load campaigns and pre-fill marketing cost
            (async () => {
              try {
                const { data: campRows } = await supabase
                  .from('campaigns')
                  .select('id, name, campaign_products(marketing_cost_override)')
                  .eq('organization_id', organizationId)
                  .order('created_at', { ascending: false });
                const camps = (campRows ?? []).map((c: Record<string, unknown>) => ({
                  id: c.id as string,
                  name: c.name as string,
                  marketing_cost: ((c.campaign_products as Array<{ marketing_cost_override: number | null }>)?.[0]?.marketing_cost_override ?? null),
                }));
                setAvailableCampaigns(camps);
                // Auto-fill: find campaign linked to this order via campaign_order_costs
                const { data: existingCost } = await supabase
                  .from('campaign_order_costs')
                  .select('campaign_id, marketing_cost')
                  .eq('order_id', merged.order_id)
                  .maybeSingle();
                if (existingCost) {
                  const ec = existingCost as { campaign_id: string | null; marketing_cost: number };
                  setLinkedCampaignId(ec.campaign_id);
                  setManualMarketingCost(
                    new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(ec.marketing_cost)
                  );
                }
                // Auto-fill coupon from orders.coupon_value
                const { data: orderRow } = await supabase
                  .from('orders')
                  .select('coupon_value, coupon_type')
                  .eq('id', merged.order_id)
                  .maybeSingle();
                if (orderRow) {
                  const or = orderRow as { coupon_value: number | null; coupon_type: string | null };
                  if (or.coupon_value != null) {
                    setManualCoupon(
                      new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(or.coupon_value)
                    );
                    setManualCouponType((or.coupon_type ?? 'fixed') as 'percent' | 'fixed');
                  }
                }
              } catch { /* graceful */ }
            })();
            setDetailDialogOpen(true);
          } catch (err) {
            console.error('Error parsing order data:', err);
          }
        }
      }
    };

    // Adicionar listener no documento para capturar cliques nos botões do tooltip
    document.addEventListener('click', handleTooltipClick, true);

    return () => {
      document.removeEventListener('click', handleTooltipClick, true);
    };
  }, [computeOrderRealProfit, mergeOrderForTooltip, normalizeMarketplace, resolveMarketplaceConfig]);

  // Refetch quando refreshTrigger mudar (apenas se for > 0)
  React.useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      console.log('🔄 RevenueReportChart: refreshTrigger mudou, refazendo query...', refreshTrigger);
      refetch();
      refetchYearly();
    }
  }, [refreshTrigger, refetch, refetchYearly]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const handleSaveCosts = async (
    products: OrderDetail['products'],
    costOverrides: Record<number, string>,
    supplierFeePercent: string,
    gatewayFee: string,
  ) => {
    if (!products || products.length === 0) return;
    setSavingCosts(true);
    setCostsSaved(false);
    try {
      for (let i = 0; i < products.length; i++) {
        const p = products[i];
        const sku = p.sku?.trim();
        if (!sku) continue;

        const overrideRaw = costOverrides[i];
        if (overrideRaw !== undefined && overrideRaw !== '') {
          const costVal = parseFloat(overrideRaw.replace(',', '.')) || 0;
          await supabase
            .from('products')
            .update({ cost_price: costVal })
            .eq('sku', sku)
            .eq('organization_id', organizationId);
          await supabase
            .from('products_variations_bling')
            .update({ cost_price: costVal })
            .eq('sku', sku)
            .eq('organization_id', organizationId);
        }
      }

      // Supplier fee + gateway fee: apply to all products in this order (by sku)
      for (const p of products) {
        const sku = p.sku?.trim();
        if (!sku) continue;
        const feeUpdates: { supplier_fee_value?: number; supplier_fee_type?: string; supplier_gateway_fee_value?: number } = {};
        if (supplierFeePercent !== '') {
          feeUpdates.supplier_fee_value = parseFloat(supplierFeePercent.replace(',', '.')) || 0;
          feeUpdates.supplier_fee_type = 'percent';
        }
        if (gatewayFee !== '') {
          feeUpdates.supplier_gateway_fee_value = parseFloat(gatewayFee.replace(',', '.')) || 0;
        }
        if (Object.keys(feeUpdates).length > 0) {
          await supabase
            .from('products')
            .update(feeUpdates)
            .eq('sku', sku)
            .eq('organization_id', organizationId);
        }
      }

      setCostsSaved(true);
      setTimeout(() => setCostsSaved(false), 3000);
      // Refetch chart data so Lucro totals reflect new cost_price
      refetch();
      refetchYearly();
    } catch (err) {
      console.error('Erro ao salvar custos:', err);
    } finally {
      setSavingCosts(false);
    }
  };

  const handleDeleteOrder = async () => {
    if (!orderToDelete) return;
    
    setDeleting(true);
    try {
      // Deletar pedido da tabela orders
      // O trigger delete_order_cascade irá automaticamente:
      // 1. Excluir order_items (ON DELETE CASCADE)
      // 2. Excluir bling_orders (via trigger)
      // 3. Excluir bling_order_items (ON DELETE CASCADE de bling_orders)
      const { error: orderError } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderToDelete.id);
      
      if (orderError) {
        throw new Error(`Erro ao excluir pedido: ${orderError.message}`);
      }
      
      // Fechar modal e tooltip
      setDeleteDialogOpen(false);
      setOrderToDelete(null);
      
      // Resetar paginação do tooltip (dados mudaram)
      setTooltipPages({});
      // Resetar accordions do dialog
      setOpenProduto(false);
      setOpenMarketplace(false);
      setOpenDescontos(false);
      setOpenAcrescimos(false);
      setBlingDiscountEnabled(true);
      setManualDesconto('');
      setManualAcrescimo('');
      setTiktokReembolsoEnabled(true);
      setManualSupplierFeePercent('');
      setManualGatewayFee('');
      setManualCostOverrides({});
      setManualShipping('');
      setManualRetornoLiquido('');
      setManualOrderDate('');
      setManualMarketingCost('');
      setManualCoupon('');
      setManualCouponType('fixed');
      setLinkedCampaignId(null);
      setAvailableCampaigns([]);
      const tooltipEl = document.querySelector('.apexcharts-tooltip') as HTMLElement | null;
      if (tooltipEl) {
        tooltipEl.style.opacity = '0';
        tooltipEl.classList.remove('apexcharts-active');
      }
      
      // Mostrar toast de sucesso
      toast.success('Métrica excluída com sucesso!', {
        description: `O pedido ${orderToDelete.number} foi removido do sistema.`,
      });
      
      // Recarregar dados
      await refetch();
      await refetchYearly();
      // Notificar o pai para atualizar KPIs (Pedidos, Clientes, etc.)
      onOrderDeleted?.();
    } catch (err) {
      console.error('Error deleting order:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error('Erro ao excluir métrica', {
        description: errorMessage,
      });
    } finally {
      setDeleting(false);
    }
  };

  // Recalcular totais considerando custos reais do marketplace
  const recalculatedData = useMemo(() => {
    return data.map(item => {
      const orders = item.orders_data || [];
      let totalRevenue = 0;
      let totalCost = 0;
      let totalProfit = 0;
      let totalMarketingCost = 0;

      orders.forEach((order: unknown) => {
        const o = order as OrderDetail;
        const enrichment = orderEnrichmentById[o.order_id] || {};
        const mergedOrder = { ...o, ...enrichment };

        const result = computeOrderRealProfit(mergedOrder, undefined, affiliateByOrderId[o.order_id]);
        const realProfit = typeof result === 'number' ? result : result.realProfit;
        const liquidoFinal = typeof result === 'number' ? Number(o.total_amount ?? 0) : result.precoVendaLiquidoFinal;
        const realCost = liquidoFinal - realProfit;

        totalRevenue += liquidoFinal;
        totalCost += realCost;
        totalProfit += realProfit;

        // Marketing cost: look up saved cost from campaign_order_costs via order_id
        // marketingCostByProductId is a secondary fallback keyed by product_id
        // Primary: use order_id directly mapped to cost (populated by fetchMarketingCosts below)
        const orderMarketingCost = (marketingCostByProductId as unknown as Record<string, number>)[`order:${o.order_id}`] ?? 0;
        totalMarketingCost += orderMarketingCost;
      });

      return {
        ...item,
        total_revenue: totalRevenue,
        total_cost: totalCost,
        total_profit: totalProfit,
        total_marketing_cost: totalMarketingCost,
      };
    });
  }, [data, orderEnrichmentById, affiliateByOrderId, computeOrderRealProfit, marketingCostByProductId]);

  // Window size per period — mensal: 3 meses visíveis com scroll, semanal/diário: parcial com setas
  const windowSize = period === 'daily' ? 14 : period === 'weekly' ? 12 : period === 'monthly' ? 3 : 5;
  const maxOffset = Math.max(0, recalculatedData.length - windowSize);
  const visibleData = recalculatedData.slice(windowOffset, windowOffset + windowSize);

  // Expose windowOffset to global so tooltip nav click handler (outside React scope) can read it
  useEffect(() => {
    (window as unknown as { __chartWindowOffset: number }).__chartWindowOffset = windowOffset;
  }, [windowOffset]);

  // Jump to latest window when data loads
  useEffect(() => {
    if (recalculatedData.length > 0) {
      setWindowOffset(Math.max(0, recalculatedData.length - windowSize));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recalculatedData.length, period]);

  // Lucro acumulado até cada período (running total across ALL data, não só visível)
  const cumulativeProfits = recalculatedData.reduce<number[]>((acc, item) => {
    const prev = acc.length > 0 ? acc[acc.length - 1] : 0;
    acc.push(Math.round((prev + Number(item.total_profit ?? 0)) * 100) / 100);
    return acc;
  }, []);

  const useAccumulated = period === 'monthly' || period === 'weekly' || period === 'daily';

  const totalRevenue = visibleData.reduce((sum, item) => sum + Number(item.total_revenue), 0);
  // Anual: soma simples do período visível. Mensal/semanal/diário: último acumulado da janela
  const lastVisibleIdx = windowOffset + visibleData.length - 1;
  void lastVisibleIdx; // used by cumulativeProfits index

  // Custo/Lucro do PERÍODO ATUAL (label "Jun", "Sem.", etc.) = último item de visibleData
  // Para período mensal/semanal/diário: mostra só o último item (mês/semana/dia atual)
  // Para anual: soma simples dos visíveis (já é por ano)
  const currentPeriodItem = visibleData[visibleData.length - 1];
  const currentPeriodCost = currentPeriodItem ? Number(currentPeriodItem.total_cost ?? 0) : 0;
  const currentPeriodProfit = currentPeriodItem ? Number(currentPeriodItem.total_profit ?? 0) : 0;

  // Lucro total de TODOS os dados — calculado sobre yearlyData (todos os meses do ano)
  // independente do filtro de período selecionado
  const allDataTotalProfit = useMemo(() => {
    return yearlyData.reduce((sum, item) => {
      const orders = item.orders_data ?? [];
      return sum + orders.reduce((s, o) => {
        const mergedOrder = mergeOrderForTooltip(o);
        const cfg = resolveMarketplaceConfig(
          (o as { marketplace?: string }).marketplace,
          Number((o as { commission_rate?: number }).commission_rate ?? 0),
          Number((o as { marketplace_fixed_fee?: number }).marketplace_fixed_fee ?? 0)
        );
        return s + computeOrderRealProfit(mergedOrder, cfg).realProfit;
      }, 0);
    }, 0);
  }, [yearlyData, computeOrderRealProfit, mergeOrderForTooltip, resolveMarketplaceConfig]);

  // Custo total = receita - lucro (inclui produto + marketplace + frete + supplier)
  const allDataTotalCost = useMemo(() => {
    return yearlyData.reduce((sum, item) => {
      const orders = item.orders_data ?? [];
      return sum + orders.reduce((s, o) => {
        const mergedOrder = mergeOrderForTooltip(o);
        const cfg = resolveMarketplaceConfig(
          (o as { marketplace?: string }).marketplace,
          Number((o as { commission_rate?: number }).commission_rate ?? 0),
          Number((o as { marketplace_fixed_fee?: number }).marketplace_fixed_fee ?? 0)
        );
        const { realProfit, precoVendaLiquidoFinal } = computeOrderRealProfit(mergedOrder, cfg);
        const realCost = precoVendaLiquidoFinal - realProfit;
        return s + realCost;
      }, 0);
    }, 0);
  }, [yearlyData, computeOrderRealProfit, mergeOrderForTooltip, resolveMarketplaceConfig]);

  const totalMarketingCost = visibleData.reduce((sum, periodData) => {
    const periodMarketingCost = (periodData.orders_data ?? []).reduce((orderSum, order) => {
      const orderId = (order as { order_id?: string }).order_id;
      if (!orderId) return orderSum;

      return orderSum + Number(marketingCostByProductId[`order:${orderId}`] ?? 0);
    }, 0);

    return sum + periodMarketingCost;
  }, 0);

  const totalMarketingCostAllTime = yearlyData.reduce((sum, periodData) => {
    const periodMarketingCost = (periodData.orders_data ?? []).reduce((orderSum, order) => {
      const orderId = (order as { order_id?: string }).order_id;
      if (!orderId) return orderSum;

      return orderSum + Number(marketingCostByProductId[`order:${orderId}`] ?? 0);
    }, 0);

    return sum + periodMarketingCost;
  }, 0);

  const marketingCostSeriesData = visibleData.map((periodData) => {
    const periodMarketingCost = (periodData.orders_data ?? []).reduce((sum, order) => {
      const orderId = (order as { order_id?: string }).order_id;
      if (!orderId) return sum;

      return sum + Number(marketingCostByProductId[`order:${orderId}`] ?? 0);
    }, 0);

    return -Math.abs(periodMarketingCost);
  });

  // Label dinâmico para "Custo {período atual}"
  const costLabel = (() => {
    const now = new Date();
    if (period === 'daily') {
      return `Custo ${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}`;
    }
    if (period === 'weekly') {
      // Calcular número da semana do mês
      const weekNum = Math.ceil(now.getDate() / 7);
      const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
      return `Custo Sem. ${weekNum} ${months[now.getMonth()]}`;
    }
    if (period === 'monthly') {
      const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
      return `Custo ${months[now.getMonth()]}`;
    }
    return `Custo ${now.getFullYear()}`;
  })();

  // Label dinâmico para "Lucro {período atual}"
  const periodLabel = (() => {
    const now = new Date();
    if (period === 'daily') {
      return `Lucro ${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}`;
    }
    if (period === 'weekly') {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      const d = startOfWeek.getDate().toString().padStart(2, '0');
      const m = (startOfWeek.getMonth() + 1).toString().padStart(2, '0');
      return `Lucro Sem. ${d}/${m}`;
    }
    if (period === 'monthly') {
      const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
      return `Lucro ${months[now.getMonth()]}`;
    }
    // yearly
    return `Lucro ${now.getFullYear()}`;
  })();


  const chartOptions: ApexOptions = {
    chart: {
      type: 'area',
      toolbar: { show: false },
      zoom: { enabled: false },
      fontFamily: 'inherit',
      animations: {
        enabled: (period === 'monthly' || period === 'yearly') && (typeof window === 'undefined'
          ? true
          : !(window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false)),
        speed: 350,
        animateGradually: { enabled: false },
        dynamicAnimation: { enabled: true, speed: 350 },
      },
    },
    dataLabels: { enabled: false },
    stroke: {
      curve: 'smooth',
      width: [2, 2],
    },
    colors: ['#22c55e', '#f97316'],
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 0.4,
        opacityFrom: 0.45,
        opacityTo: 0.05,
        stops: [0, 90, 100],
      },
      colors: ['#22c55e', '#ef4444'],
    },
    markers: {
      size: 4,
      strokeWidth: 2,
      colors: ['#22c55e', '#f97316'],
      strokeColors: ['#86efac', '#fca5a5'],
      hover: {
        size: 6,
      },
    },
    xaxis: {
      categories: visibleData.map((item) => item.period_label),
      labels: {
        style: {
          colors: '#6b7280',
          fontSize: '12px',
        },
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: (() => {
      const AXIS_STEP = 10;

      const profitValues = visibleData.map((periodData, index) => {
        if (useAccumulated) {
          return cumulativeProfits[windowOffset + index] ?? 0;
        }

        return Number(periodData.total_profit ?? 0);
      });

      const marketingValues = marketingCostSeriesData;
      const allValues = [0, ...profitValues, ...marketingValues];

      const rawMin = Math.min(...allValues);
      const rawMax = Math.max(...allValues);

      const minPadding = Math.max(Math.abs(rawMin) * 0.25, AXIS_STEP);
      const maxPadding = Math.max(Math.abs(rawMax) * 0.2, AXIS_STEP);

      const paddedMin = rawMin - minPadding;
      const paddedMax = rawMax + maxPadding;

      // Escolhe um passo múltiplo de 10 (10, 20, 30...) para que o eixo Y
      // avance sempre em incrementos de 10, tanto para valores positivos
      // quanto negativos, limitando a quantidade de marcações exibidas.
      const MAX_TICKS = 15;
      let step = AXIS_STEP;
      while ((paddedMax - paddedMin) / step > MAX_TICKS) {
        step += AXIS_STEP;
      }

      const axisMin = Math.floor(paddedMin / step) * step;
      const axisMax = Math.ceil(paddedMax / step) * step;
      const tickAmount = Math.max(1, Math.round((axisMax - axisMin) / step));

      return {
        labels: {
          style: {
            colors: '#71717a',
            fontSize: '11px',
          },
          formatter: (value: number) => formatCurrency(Number(value)),
        },
        min: axisMin,
        max: axisMax,
        tickAmount,
        forceNiceScale: false,
      };
    })(),
    grid: {
      borderColor: '#e5e7eb',
      strokeDashArray: 4,
      padding: { top: 16 },
    },
    tooltip: {
      enabled: true,
      followCursor: true,
      intersect: false,
      shared: false,
      fixed: {
        enabled: false,
        position: 'topLeft',
        offsetX: 10,
        offsetY: 10,
      },
      custom: ({ dataPointIndex }: { dataPointIndex: number }) => {
        // If nav arrow was just clicked, return empty to avoid overwriting the DOM update
        if (Date.now() < navClickBlockUntilRef.current) {
          return document.querySelector('.apexcharts-tooltip')?.innerHTML ?? '';
        }
        const currentData = dataRef.current;
        const globalDataIdx = ((window as unknown as { __chartWindowOffset?: number }).__chartWindowOffset ?? 0) + dataPointIndex;
        if (!currentData[globalDataIdx]) return '';
        const periodData = currentData[globalDataIdx];
        const ordersCount = periodData.orders_data?.length || 0;

        // Estado de paginação do tooltip por período (via estado React)
        const stateKey = `tooltip_page_${dataPointIndex}`;
        const currentPageUnsafe: number = tooltipPagesRef.current[globalDataIdx] ?? 0;
        const currentPage = ordersCount > 0 ? Math.min(currentPageUnsafe, ordersCount - 1) : 0;
        const order = periodData.orders_data?.[currentPage];

        // Gerar HTML de um único pedido (paginado)
        const { orderInnerHtml, orderIsFreeSample, orderIsPersonalPurchase } = order ? (() => {
          const mergedOrder = mergeOrderForTooltip(order) as unknown as {
            customer_name?: string;
            product_name?: string;
            product_sku?: string;
            product_image_url?: string;
            total_cost?: number | string | null;
            product_cost_price?: number | string | null;
            products?: Array<{ name: string; sku?: string }>;
          };
          const rawMarketplace = (order as { marketplace?: string }).marketplace ?? '';
          const normalizedRawMarketplace = normalizeMarketplace(rawMarketplace);
          const hasExplicitMarketplace = !!rawMarketplace
            && normalizedRawMarketplace !== 'null'
            && normalizedRawMarketplace !== 'undefined'
            && normalizedRawMarketplace !== 'semmarketplace';
          const resolvedMarketplaceConfig = resolveMarketplaceConfig(
            (order as { marketplace?: string }).marketplace,
            Number((order as { commission_rate?: number }).commission_rate ?? 0),
            Number((order as { marketplace_fixed_fee?: number }).marketplace_fixed_fee ?? 0)
          );
          const marketplaceName = resolvedMarketplaceConfig?.name
            ?? (hasExplicitMarketplace ? rawMarketplace : 'Sem marketplace');
          const customerName = mergedOrder.customer_name || 'Cliente não identificado';
          const orderNumber = order.order_number || 'S/N';

          const { realProfit, isFreeSample } = computeOrderRealProfit(mergedOrder, resolvedMarketplaceConfig);
          const isPersonalPurchase = (order as { is_personal_purchase?: boolean }).is_personal_purchase === true;
          const profitColor = isPersonalPurchase ? '#fed7aa' : isFreeSample ? '#e9d5ff' : (realProfit >= 0 ? '#16a34a' : '#dc2626');
          const profitLabel = realProfit >= 0 ? 'Lucro:' : 'Prejuízo:';
          const profitValue = realProfit >= 0
            ? formatCurrency(realProfit)
            : `- ${formatCurrency(Math.abs(realProfit))}`;

          const productsForDisplay = mergedOrder.products ?? [];
          const productNamesFromItems = productsForDisplay
            .map((p) => p.name)
            .filter(Boolean) as string[];
          const mainProductName = mergedOrder.product_name || productNamesFromItems[0] || 'Produto não vinculado';
          const productCount = productNamesFromItems.length;
          const productSku = mergedOrder.product_sku || (productsForDisplay[0]?.sku ?? null);
          const safeStore = marketplaceName;
          const orderRevenue = Number(order.total_amount ?? 0);

          // Cores: laranja = compra pessoal, roxo = amostra grátis, branco = normal
          const textPrimary = isPersonalPurchase ? '#fff7ed' : isFreeSample ? '#f3e8ff' : '#374151';
          const textSecondary = isPersonalPurchase ? '#fdba74' : isFreeSample ? '#d8b4fe' : '#6b7280';
          const dividerColor = isPersonalPurchase ? 'rgba(251,146,60,0.3)' : isFreeSample ? 'rgba(167,139,250,0.3)' : 'rgba(2,6,23,0.08)';
          const navBtnBg = isPersonalPurchase ? 'rgba(234,88,12,0.4)' : isFreeSample ? 'rgba(109,40,217,0.4)' : '#e5e7eb';
          const navBtnColor = isPersonalPurchase ? '#fed7aa' : isFreeSample ? '#e9d5ff' : '#374151';
          const navBtnDisabledBg = isPersonalPurchase ? 'rgba(234,88,12,0.15)' : isFreeSample ? 'rgba(109,40,217,0.15)' : 'rgba(2,6,23,0.06)';
          const navBtnDisabledColor = isPersonalPurchase ? 'rgba(254,215,170,0.3)' : isFreeSample ? 'rgba(233,213,255,0.3)' : '#d1d5db';

          const orderDetailData: OrderDetail = {
            order_id: order.order_id,
            bling_order_id: (order as { bling_order_id?: string | null }).bling_order_id ?? null,
            order_date: (order as { order_date?: string | null }).order_date ?? null,
            tiktok_reembolso_disabled: (order as { tiktok_reembolso_disabled?: boolean }).tiktok_reembolso_disabled === true,
            tiktok_retorno_liquido: (order as { tiktok_retorno_liquido?: number | null }).tiktok_retorno_liquido ?? null,
            order_number: orderNumber,
            marketplace: marketplaceName,
            marketplace_fixed_fee: Number(resolvedMarketplaceConfig?.fixed_fee ?? (order as { marketplace_fixed_fee?: number }).marketplace_fixed_fee ?? 0),
            customer_name: customerName,
            product_name: mainProductName,
            product_sku: productSku || undefined,
            product_image_url: mergedOrder.product_image_url || undefined,
            products: mergedOrder.products as OrderDetail['products'],
            total_amount: orderRevenue,
            total_products: Number((order as { total_products?: number | string | null }).total_products ?? orderRevenue),
            base_value: Number((order as { base_value?: number | string | null }).base_value ?? 0),
            total_cost: Number(mergedOrder.total_cost ?? 0),
            product_cost_price: Number(mergedOrder.product_cost_price ?? 0),
            marketplace_commission: Number(order.marketplace_commission ?? 0),
            commission_rate: Number(resolvedMarketplaceConfig?.commission_rate ?? order.commission_rate ?? 0),
            shipping_cost: Number(order.shipping_cost ?? 0),
            other_expenses: Number(order.other_expenses ?? 0),
            discount_value: Number((order as { discount_value?: number | string | null }).discount_value ?? 0),
            supplier_fee_value: (order as { supplier_fee_value?: string }).supplier_fee_value,
            supplier_fee_type: (order as { supplier_fee_type?: string }).supplier_fee_type,
            supplier_gateway_fee_value: (order as { supplier_gateway_fee_value?: string }).supplier_gateway_fee_value,
            supplier_gateway_fee_type: (order as { supplier_gateway_fee_type?: string }).supplier_gateway_fee_type,
            total_profit: realProfit,
            tiktok_sfp_enabled: (order as { tiktok_sfp_enabled?: boolean | string }).tiktok_sfp_enabled === true
              || String((order as { tiktok_sfp_enabled?: unknown }).tiktok_sfp_enabled) === 'true',
            is_free_sample: isFreeSample,
          };

          // Setas de navegação (só aparece se há mais de 1 pedido)
          const navHtml = ordersCount > 1 ? `
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;padding-bottom:6px;border-bottom:1px solid ${dividerColor};">
              <button
                data-tooltip-nav
                data-nav-dir="prev"
                data-nav-key="${stateKey}"
                data-nav-max="${ordersCount - 1}"
                style="background:${currentPage === 0 ? navBtnDisabledBg : navBtnBg};color:${currentPage === 0 ? navBtnDisabledColor : navBtnColor};border:none;border-radius:4px;padding:3px 8px;font-size:11px;cursor:${currentPage === 0 ? 'default' : 'pointer'};font-weight:600;line-height:1;"
                ${currentPage === 0 ? 'disabled' : ''}
              >‹</button>
              <span style="font-size:11px;color:${textSecondary};font-weight:500">${currentPage + 1} / ${ordersCount} pedido${ordersCount > 1 ? 's' : ''}</span>
              <button
                data-tooltip-nav
                data-nav-dir="next"
                data-nav-key="${stateKey}"
                data-nav-max="${ordersCount - 1}"
                style="background:${currentPage === ordersCount - 1 ? navBtnDisabledBg : navBtnBg};color:${currentPage === ordersCount - 1 ? navBtnDisabledColor : navBtnColor};border:none;border-radius:4px;padding:3px 8px;font-size:11px;cursor:${currentPage === ordersCount - 1 ? 'default' : 'pointer'};font-weight:600;line-height:1;"
                ${currentPage === ordersCount - 1 ? 'disabled' : ''}
              >›</button>
            </div>
          ` : '';

          // Headline de amostra grátis
          const freeSampleBadge = isFreeSample ? `
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;padding:5px 8px;background:rgba(109,40,217,0.35);border-radius:6px;border:1px solid rgba(167,139,250,0.4);">
              <span style="font-size:13px;">🎁</span>
              <span style="font-size:10px;font-weight:800;color:#e9d5ff;letter-spacing:0.08em;text-transform:uppercase;">Pedido de Amostra Grátis</span>
            </div>
          ` : '';

          return {
            orderIsFreeSample: isFreeSample,
            orderIsPersonalPurchase: isPersonalPurchase,
            orderInnerHtml: `
              ${navHtml}
              ${freeSampleBadge}
              <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:6px">
                <div style="flex:1;min-width:0">
                  <div style="font-size:11px;color:${textPrimary};font-weight:600;margin-bottom:2px">${customerName}</div>
                  <div style="font-size:10px;color:${textSecondary};margin-bottom:2px">🏪 ${marketplaceName} • Pedido #${orderNumber}</div>
                  <div style="font-size:10px;color:${textPrimary};margin-bottom:2px">
                    📦 ${mainProductName.length > 28 ? mainProductName.substring(0, 28) + '...' : mainProductName}
                    ${productSku ? ` (SKU: ${productSku})` : ''}
                  </div>
                  ${productCount > 1 ? `<div style="font-size:10px;color:${textSecondary}">+${productCount - 1} produto(s)</div>` : ''}
                </div>
                <div style="display:flex;flex-direction:column;gap:4px;flex-shrink:0">
                  <button 
                    data-detail-order-btn
                    data-order-detail='${JSON.stringify(orderDetailData).replace(/'/g, "&apos;")}'
                    style="background:#3b82f6;color:white;border:none;border-radius:4px;padding:4px 8px;font-size:10px;cursor:pointer;font-weight:500;white-space:nowrap;"
                    onmouseover="this.style.background='#2563eb'"
                    onmouseout="this.style.background='#3b82f6'"
                  >Detalhar</button>
                  <button 
                    data-delete-order-btn
                    data-order-id="${order.order_id}"
                    data-order-number="${orderNumber}"
                    data-order-store="${safeStore}"
                    style="background:#ef4444;color:white;border:none;border-radius:4px;padding:4px 8px;font-size:10px;cursor:pointer;font-weight:500;white-space:nowrap;"
                    onmouseover="this.style.background='#dc2626'"
                    onmouseout="this.style.background='#ef4444'"
                  >Excluir</button>
                </div>
              </div>
              <div style="display:flex;justify-content:space-between;font-size:11px;padding-top:6px;border-top:1px solid ${dividerColor}">
                <span style="color:${textSecondary};font-weight:600">${profitLabel}</span>
                <span style="font-weight:800;color:${profitColor}">${profitValue}</span>
              </div>
            `,
          };
        })() : { orderInnerHtml: '', orderIsFreeSample: false, orderIsPersonalPurchase: false };

        // Detectar tipo de pedido para colorir tooltip
        const currentOrderIsFreeSample = orderIsFreeSample;
        const currentOrderIsPersonal = orderIsPersonalPurchase;
        const tooltipBg = currentOrderIsPersonal
          ? 'linear-gradient(135deg, #431407 0%, #7c2d12 50%, #431407 100%)'
          : currentOrderIsFreeSample
          ? 'linear-gradient(135deg, #3b0764 0%, #4c1d95 50%, #2e1065 100%)'
          : 'rgba(255,255,255,0.98)';
        const tooltipBorder = currentOrderIsPersonal
          ? '1px solid rgba(251,146,60,0.5)'
          : currentOrderIsFreeSample
          ? '1px solid rgba(167,139,250,0.5)'
          : '1px solid rgba(2,6,23,0.08)';
        const tooltipShadow = currentOrderIsPersonal
          ? '0 8px 34px rgba(234,88,12,0.35)'
          : currentOrderIsFreeSample
          ? '0 8px 34px rgba(109,40,217,0.35)'
          : '0 18px 50px rgba(2,6,23,0.14)';
        const tooltipHeaderColor = currentOrderIsPersonal ? '#fed7aa' : currentOrderIsFreeSample ? '#e9d5ff' : '#111827';
        const tooltipSubColor = currentOrderIsPersonal ? '#fdba74' : currentOrderIsFreeSample ? '#c4b5fd' : '#6b7280';
        const tooltipBadgeBg = currentOrderIsPersonal ? 'rgba(234,88,12,0.4)' : currentOrderIsFreeSample ? 'rgba(109,40,217,0.4)' : 'rgba(2,6,23,0.06)';
        const tooltipBadgeColor = currentOrderIsPersonal ? '#fed7aa' : currentOrderIsFreeSample ? '#e9d5ff' : '#6b7280';

        return `
          <div class="apexcharts-tooltip-custom" style="background:${tooltipBg};border:${tooltipBorder};border-radius:12px;padding:10px 12px;box-shadow:${tooltipShadow};backdrop-filter:blur(10px);min-width:270px;max-width:360px;pointer-events:auto;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
              <span style="font-weight:600;color:${tooltipHeaderColor};font-size:13px">${periodData.period_label}</span>
              <span style="font-size:11px;color:${tooltipBadgeColor};background:${tooltipBadgeBg};padding:2px 8px;border-radius:99px;">${ordersCount} pedido${ordersCount !== 1 ? 's' : ''}</span>
            </div>
            <div data-tooltip-order-root style="padding-top:6px;margin-top:6px;">
              ${orderInnerHtml || `<div style="font-size:11px;color:${tooltipSubColor}">Sem pedidos</div>`}
            </div>
          </div>`;
      },
    },
    legend: {
      position: 'top',
      horizontalAlign: 'right',
      labels: {
        colors: '#6b7280',
      },
      markers: {
        fillColors: ['#22c55e', '#f97316'],
      },
      onItemClick: {
        toggleDataSeries: true,
      },
    },
  };

  const chartSeries = [
    {
      name: useAccumulated ? 'Lucro Acumulado' : 'Lucro',
      data: visibleData.map((periodData, index) => {
        if (useAccumulated) {
          return cumulativeProfits[windowOffset + index] ?? 0;
        }

        return Number(periodData.total_profit ?? 0);
      }),
    },
    {
      name: 'Custo de Marketing',
      data: marketingCostSeriesData,
    },
  ];

  if (loading) {
    return (
      <Card className="p-6 border-gray-100 dark:border-zinc-800">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6 border-gray-100 dark:border-zinc-800">
        <div className="text-center text-red-500 py-8">{error}</div>
      </Card>
    );
  }

  return (
    <>
      {/* Dialog de detalhes do pedido — Dark Premium */}
      <Dialog open={detailDialogOpen} onOpenChange={(open) => {
          if (!open && selectedOrder) {
            // Persist modal state for this order
            orderModalStateRef.current[selectedOrder.order_id] = {
              blingDiscountEnabled,
              manualDesconto,
              manualAcrescimo,
              tiktokReembolsoEnabled,
              manualSupplierFeePercent,
              manualGatewayFee,
              manualCostOverrides,
              manualShipping,
              manualRetornoLiquido,
            };
          }
          setDetailDialogOpen(open);
        }}>
        <DialogContent className="max-w-lg p-0 overflow-hidden border-0 bg-zinc-950 rounded-2xl shadow-2xl [&>button]:hidden">
          <DialogTitle className="sr-only">Detalhes do pedido</DialogTitle>
          <DialogDescription className="sr-only">Informações do pedido selecionado.</DialogDescription>
          {selectedOrder && (() => {
            const products = selectedOrder.products ?? [];
            const hasMultipleProducts = products.length > 1;
            const rawMarketplace = selectedOrder.marketplace ?? '';
            const normalizedRawMarketplace = normalizeMarketplace(rawMarketplace);
            const hasExplicitMarketplace = !!rawMarketplace
              && normalizedRawMarketplace !== 'null'
              && normalizedRawMarketplace !== 'undefined'
              && normalizedRawMarketplace !== 'semmarketplace';

            const resolvedMarketplaceConfig = resolveMarketplaceConfig(
              selectedOrder.marketplace,
              selectedOrder.commission_rate,
              selectedOrder.marketplace_fixed_fee
            );

            const resolvedMarketplaceName = resolvedMarketplaceConfig?.name
              ?? (hasExplicitMarketplace ? rawMarketplace : 'Sem marketplace');

            // Calcular custos por produto usando os dados de cada item (com override manual por índice)
            const productItems = products.map((p, i) => {
              const qty = p.quantity ?? 1;
              const unitCostRaw = p.unit_cost ?? 0;
              const unitPrice = p.unit_price ?? 0;
              // Manual override: user can type new cost per item
              const overrideRaw = manualCostOverrides[i];
              const unitCost = overrideRaw !== undefined && overrideRaw !== ''
                ? (parseFloat(overrideRaw.replace(',', '.')) || 0)
                : unitCostRaw;
              const baseCost = unitCost * qty;
              const totalPrice = unitPrice * qty;
              return { name: p.name, sku: p.sku, qty, unitPrice, totalPrice, baseCost, unitCost, unitCostRaw };
            });

            const totalBaseCost = productItems.reduce((s, p) => s + p.baseCost, 0);

            // Taxas do fornecedor: derivar do produto que tem taxa configurada
            const supFeeProduct = products.reduce((best, p) => {
              const v = Number(p.supplier_fee_value ?? 0);
              return v > Number(best?.supplier_fee_value ?? 0) ? p : best;
            }, products[0]);

            const supFeeVal = Number(supFeeProduct?.supplier_fee_value ?? 0);
            const supFeeType = supFeeProduct?.supplier_fee_type ?? 'percent';
            // Default gateway fee from product, fallback to R$2
            const productGatewayFee = Number(supFeeProduct?.supplier_gateway_fee_value ?? 2);

            // ── Marketplace flags ─────────────────────────────────────────────────
            const isTikTok = resolvedMarketplaceName.toLowerCase().includes('tiktok');

            // Taxas do fornecedor — Dogama tem taxa % + gateway fixo
            const isDogama = isTikTok || supFeeVal > 0 || manualSupplierFeePercent !== '';
            const DEFAULT_SUPPLIER_FEE_PERCENT = 6;
            const effectiveSupFeePercent = isDogama
              ? (manualSupplierFeePercent !== ''
                  ? parseFloat(manualSupplierFeePercent.replace(',', '.')) || 0
                  : (supFeeType === 'percent' && supFeeVal > 0 ? supFeeVal : DEFAULT_SUPPLIER_FEE_PERCENT))
              : 0;
            const orderSupplierFee = isDogama ? (totalBaseCost * effectiveSupFeePercent) / 100 : 0;
            // Gateway fee: manual override if set, else product value, else R$2
            const effectiveGatewayFee = isDogama
              ? (manualGatewayFee !== ''
                  ? (parseFloat(manualGatewayFee.replace(',', '.')) || 0)
                  : productGatewayFee)
              : 0;
            const orderGatewayFee = effectiveGatewayFee;

            const totalProductCost = totalBaseCost + orderSupplierFee + orderGatewayFee;
            const isFreeSample = selectedOrder.is_free_sample === true;

            // total_products = valor bruto dos itens (Bling totalProdutos)
            const totalProductsValue = Number(selectedOrder.total_products ?? selectedOrder.total_amount ?? 0);

            // ── Desconto ──────────────────────────────────────────────────────────
            const blingDiscountValue = Number(selectedOrder.discount_value ?? 0);
            const manualDiscountValue = parseFloat(manualDesconto.replace(',', '.').replace(/[^0-9.]/g, '')) || 0;
            const activeDiscount = blingDiscountEnabled
              ? (blingDiscountValue > 0 ? blingDiscountValue : 0)
              : manualDiscountValue;

            // ── Preços de venda ───────────────────────────────────────────────────
            // TikTok: bruto = totalProdutos (antes desconto), pagoCliente = bruto - desconto
            // Outros: pagoCliente = base_value (valor cliente pagou) ou total_amount
            const baseValue = Number(selectedOrder.base_value ?? 0);
            const precoVendaBruto = isTikTok
              ? (totalProductsValue > 0 ? totalProductsValue : selectedOrder.total_amount)
              : selectedOrder.total_amount;
            const precoVendaPagoCliente = isTikTok
              ? precoVendaBruto - activeDiscount
              : (baseValue > 0 ? baseValue : selectedOrder.total_amount);

            const fixedFee = Number(resolvedMarketplaceConfig?.fixed_fee ?? selectedOrder.marketplace_fixed_fee ?? 0);
            const commissionRate = Number(resolvedMarketplaceConfig?.commission_rate ?? selectedOrder.commission_rate ?? 0);
            const affiliateRate = Number(resolvedMarketplaceConfig?.affiliate_commission_rate ?? 0);

            // Comissão sobre preço bruto
            const commissionBase = precoVendaBruto;
            const commissionPercent = isFreeSample ? 0 : (commissionRate > 0
              ? (commissionBase * commissionRate) / 100
              : Math.max(0, selectedOrder.marketplace_commission - fixedFee));
            const affiliateCommission = isFreeSample
              ? 0
              : (cameFromAffiliate && affiliateRate > 0
                ? (commissionBase * affiliateRate) / 100
                : 0);
            // SFP 6% — só TikTok
            const sfpEnabled = !isFreeSample && (selectedOrder.tiktok_sfp_enabled === true || isTikTok);
            const sfpFee = sfpEnabled ? precoVendaBruto * 0.06 : 0;
            // Frete: TikTok com SFP = incluso (default 0); manual override possível
            const effectiveShipping = manualShipping !== ''
              ? (parseFloat(manualShipping.replace(',', '.')) || 0)
              : (sfpEnabled ? 0 : selectedOrder.shipping_cost);
            const subtotalMarketplace = isFreeSample ? 0 : (commissionPercent + affiliateCommission + fixedFee + sfpFee + effectiveShipping + selectedOrder.other_expenses);

            // ── Retorno Líquido TikTok ────────────────────────────────────────────
            // When user fills this, TikTok already paid net amount → skip marketplace cost + affiliates
            const retornoLiquidoValue = parseFloat(manualRetornoLiquido.replace(',', '.')) || 0;
            const hasRetornoLiquido = isTikTok && retornoLiquidoValue > 0;

            // ── Acréscimo ─────────────────────────────────────────────────────────
            const acrescimoManual = parseFloat(manualAcrescimo.replace(',', '.')) || 0;
            // Reembolso TikTok = desconto ativo (só TikTok)
            const tiktokReembolsoValue = isTikTok ? activeDiscount : 0;
            const acrescimoValue = acrescimoManual + (tiktokReembolsoEnabled && isTikTok ? tiktokReembolsoValue : 0);

            // ── Preço de venda líquido ────────────────────────────────────────────
            // TikTok: pagoCliente + reembolso - taxas
            // TikTok com retornoLiquido: retornoLiquidoValue (já é o líquido recebido)
            // Outros: pagoCliente - taxas - desconto
            const precoVendaLiquidoFinal = hasRetornoLiquido
              ? retornoLiquidoValue
              : (isTikTok
                ? precoVendaPagoCliente + (tiktokReembolsoEnabled ? tiktokReembolsoValue : 0) - subtotalMarketplace
                : precoVendaPagoCliente - subtotalMarketplace - activeDiscount);

            // ── Lucro = Preço Líquido - Custo Produto ────────────────────────────
            // taxas marketplace já descontadas no precoVendaLiquidoFinal
            const manualMarketingCostVal = parseFloat(manualMarketingCost.replace(',', '.')) || 0;
            const manualCouponVal = (() => {
              const v = parseFloat(manualCoupon.replace(',', '.')) || 0;
              if (v <= 0) return 0;
              return manualCouponType === 'percent'
                ? (precoVendaPagoCliente * v) / 100  // % sobre preço pago pelo cliente
                : v;
            })();
            const realProfit = isFreeSample
              ? -totalProductCost
              : (precoVendaLiquidoFinal - totalProductCost + acrescimoManual);
            const marginBase = Math.abs(precoVendaLiquidoFinal) > 0 ? Math.abs(precoVendaLiquidoFinal) : selectedOrder.total_amount;
            const margin = marginBase > 0
              ? ((realProfit / marginBase) * 100).toFixed(1) : '0.0';
            const profitPositive = realProfit >= 0;

            // Imagem: product_image_url do pedido → image_url do primeiro produto enriquecido
            let heroImage = selectedOrder.product_image_url
              || (products[0] as { image_url?: string })?.image_url
              || null;
            if (heroImage && (heroImage === 'null' || heroImage === 'undefined' || heroImage.trim() === '')) {
              heroImage = null;
            }

            return (
              <div className="flex flex-col bg-zinc-950 rounded-2xl overflow-hidden max-h-[88vh]">

                {/* ── HERO ── */}
                <div className="relative flex-shrink-0">
                  <DialogClose className="absolute top-3 right-3 z-20 w-7 h-7 flex items-center justify-center rounded-full bg-zinc-800/90 hover:bg-zinc-700 border border-zinc-700/60 text-zinc-400 hover:text-white transition-colors cursor-pointer">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </DialogClose>
                  <div className="absolute top-3 left-3 z-10">
                    <span className="inline-flex items-center gap-1.5 bg-zinc-900/90 backdrop-blur-sm text-zinc-300 text-xs font-mono px-2.5 py-1 rounded-full border border-zinc-700/50">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      #{selectedOrder.order_number}
                    </span>
                  </div>
                  <div className="absolute top-3 right-12 z-10">
                    <span className="inline-flex items-center bg-orange-500/90 backdrop-blur-sm text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-lg shadow-orange-900/40">
                      {resolvedMarketplaceName}
                    </span>
                  </div>

                  {/* Imagem com fundo claro para o produto */}
                  {heroImage ? (
                    <div className="h-52 bg-zinc-100 flex items-center justify-center overflow-hidden">
                      <img
                        src={heroImage}
                        alt={selectedOrder.product_name || 'Produto'}
                        className="h-full w-full object-contain p-4"
                        onError={(e) => {
                          const el = e.target as HTMLImageElement;
                          el.style.display = 'none';
                          el.parentElement!.classList.replace('bg-zinc-100', 'bg-zinc-900');
                        }}
                      />
                    </div>
                  ) : (
                    <div className="h-32 bg-zinc-900 flex items-center justify-center">
                      <svg className="w-14 h-14 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                  )}

                  {/* Gradient overlay bottom */}
                  <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-zinc-950 to-transparent pointer-events-none" />
                </div>

                {/* ── SCROLLABLE BODY ── */}
                <div className="overflow-y-auto flex-1 px-4 pb-5 space-y-3">

                  {/* Nome + cliente */}
                  <div className="pt-2">
                    <h2 className="text-white font-semibold text-sm leading-snug mb-1.5">
                      {hasMultipleProducts
                        ? `${products.length} produtos — Pedido #${selectedOrder.order_number}`
                        : (selectedOrder.product_name || 'Produto não identificado')}
                    </h2>
                    <div className="flex items-center gap-2 flex-wrap">
                      {!hasMultipleProducts && selectedOrder.product_sku && (
                        <span className="text-[11px] text-zinc-500 font-mono bg-zinc-900 px-2 py-0.5 rounded">
                          SKU: {selectedOrder.product_sku}
                        </span>
                      )}
                      {selectedOrder.customer_name && (
                        <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                          <svg className="w-3 h-3 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          {selectedOrder.customer_name}
                        </span>
                      )}
                    </div>
                    {/* Data do pedido — editável */}
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <svg className="w-3 h-3 text-zinc-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <input
                        type="date"
                        value={manualOrderDate ?? ''}
                        onChange={(e) => setManualOrderDate(e.target.value)}
                        className="bg-zinc-900 border border-zinc-700 rounded px-2 py-0.5 text-[11px] text-zinc-300 focus:outline-none focus:border-zinc-500 tabular-nums"
                      />
                      {manualOrderDate && manualOrderDate !== (selectedOrder?.order_date ?? '') && (
                        <button
                          disabled={savingOrderDate}
                          onClick={async () => {
                            if (!selectedOrder?.order_id) return;
                            setSavingOrderDate(true);
                            try {
                              await supabase
                                .from('orders')
                                .update({ order_date: manualOrderDate })
                                .eq('id', selectedOrder.order_id);
                              setSelectedOrder({ ...selectedOrder, order_date: manualOrderDate });
                              refetch();
                              refetchYearly();
                            } finally {
                              setSavingOrderDate(false);
                            }
                          }}
                          className="flex items-center gap-1 bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 text-white text-[10px] font-semibold px-2 py-0.5 rounded transition-colors"
                        >
                          {savingOrderDate ? (
                            <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                          ) : (
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/></svg>
                          )}
                          Salvar data
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Preço de venda — Líquido (topo) + breakdown */}
                  <div className="rounded-xl overflow-hidden bg-zinc-900/30">
                    {/* Cabeçalho: Preço de Venda Líquido */}
                    <div className="flex items-center justify-between bg-zinc-900 px-4 py-3">
                      <div className="flex items-center gap-2 text-zinc-400 text-sm">
                        <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Preço de venda líquido{hasRetornoLiquido ? ' (retorno TikTok)' : ''}</span>
                        {hasMultipleProducts && <span className="text-zinc-600 text-xs ml-1">({products.length} itens)</span>}
                      </div>
                      <span className={`font-bold text-lg tabular-nums ${realProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {hasRetornoLiquido
                          ? formatCurrency(retornoLiquidoValue)
                          : (realProfit < 0 ? '-' : '') + formatCurrency(Math.abs(realProfit))}
                      </span>
                    </div>

                    {isTikTok ? (
                      <>
                        {/* TikTok: pago pelo cliente (bruto - desconto) */}
                        <div className="flex items-center justify-between px-4 py-2 bg-zinc-900/50 border-t border-zinc-800/40">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] text-zinc-500">Preço de venda pago pelo cliente</span>
                            {activeDiscount > 0 && (
                              <span className="text-[10px] text-yellow-500/80 font-mono tabular-nums">-{formatCurrency(activeDiscount)}</span>
                            )}
                          </div>
                          <span className="text-[12px] text-blue-300 font-bold tabular-nums">{formatCurrency(precoVendaPagoCliente)}</span>
                        </div>

                        {/* Reembolso TikTok */}
                        {tiktokReembolsoValue > 0 && (
                          <div className="flex items-center justify-between px-4 py-2 bg-zinc-900/40 border-t border-zinc-800/30">
                            <div className="flex items-center gap-2">
                              <Checkbox
                                id="tiktok-reembolso-price-check"
                                checked={tiktokReembolsoEnabled && !hasRetornoLiquido}
                                disabled={hasRetornoLiquido}
                                onCheckedChange={(v) => { if (!hasRetornoLiquido) setTiktokReembolsoEnabled(v === true); }}
                              />
                              <label htmlFor="tiktok-reembolso-price-check" className={`text-[11px] select-none ${hasRetornoLiquido ? 'text-zinc-600 line-through cursor-not-allowed' : 'text-emerald-400/80 cursor-pointer'}`}>
                                Reembolso TikTok
                              </label>
                              <span className={`text-[10px] font-mono tabular-nums ${hasRetornoLiquido ? 'text-zinc-600' : 'text-emerald-500/60'}`}>+{formatCurrency(tiktokReembolsoValue)}</span>
                              {/* Save button — visible when state differs from DB value */}
                              {!hasRetornoLiquido && tiktokReembolsoEnabled !== !(selectedOrder?.tiktok_reembolso_disabled === true) && (
                                <button
                                  disabled={savingReembolso}
                                  onClick={async () => {
                                    if (!selectedOrder?.bling_order_id) return;
                                    setSavingReembolso(true);
                                    try {
                                      await supabase
                                        .from('bling_orders')
                                        .update({ tiktok_reembolso_disabled: !tiktokReembolsoEnabled })
                                        .eq('id', selectedOrder.bling_order_id);
                                      setSelectedOrder({ ...selectedOrder, tiktok_reembolso_disabled: !tiktokReembolsoEnabled });
                                      refetch();
                                      refetchYearly();
                                    } finally {
                                      setSavingReembolso(false);
                                    }
                                  }}
                                  className="flex items-center gap-1 bg-emerald-700/80 hover:bg-emerald-600 disabled:opacity-50 text-white text-[10px] font-semibold px-2 py-0.5 rounded transition-colors"
                                >
                                  {savingReembolso ? (
                                    <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                                  ) : (
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/></svg>
                                  )}
                                  Salvar
                                </button>
                              )}
                            </div>
                            <span className={`text-[12px] font-bold tabular-nums ${tiktokReembolsoEnabled ? 'text-blue-300' : 'text-zinc-600'}`}>
                              {formatCurrency(precoVendaPagoCliente + (tiktokReembolsoEnabled ? tiktokReembolsoValue : 0))}
                            </span>
                          </div>
                        )}

                        {/* Preço de venda bruto — pago pelo cliente + taxas marketplace (custo total do canal) */}
                        <div className="flex items-center justify-between px-4 py-2 bg-zinc-900/30 border-t border-zinc-800/40">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] text-zinc-500">Preço de venda bruto</span>
                            <span className="text-[10px] text-orange-400/80 font-mono tabular-nums">+{formatCurrency(subtotalMarketplace)}</span>
                          </div>
                          <span className="text-[12px] text-blue-300 font-bold tabular-nums">
                            {formatCurrency(precoVendaPagoCliente + (tiktokReembolsoEnabled ? tiktokReembolsoValue : 0) + subtotalMarketplace)}
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Outros marketplaces: pago pelo cliente = total_amount */}
                        <div className="flex items-center justify-between px-4 py-2 bg-zinc-900/50 border-t border-zinc-800/40">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] text-zinc-500">Preço de venda pago pelo cliente</span>
                          </div>
                          <span className="text-[12px] text-blue-300 font-bold tabular-nums">{formatCurrency(precoVendaPagoCliente)}</span>
                        </div>

                        {/* Preço de venda bruto — pago pelo cliente + taxas (custo total do canal) */}
                        <div className="flex items-center justify-between px-4 py-2 bg-zinc-900/30 border-t border-zinc-800/40">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[11px] text-zinc-500">Preço de venda bruto</span>
                            <span className="text-[10px] text-orange-400/80 font-mono tabular-nums">+{formatCurrency(subtotalMarketplace)}</span>
                            {activeDiscount > 0 && (
                              <span className="text-[10px] text-yellow-400/90 font-mono tabular-nums">-desc</span>
                            )}
                            {acrescimoManual > 0 && (
                              <span className="text-[10px] text-emerald-400/80 font-mono tabular-nums">+{formatCurrency(acrescimoManual)}</span>
                            )}
                          </div>
                          <span className="text-[12px] text-blue-300 font-bold tabular-nums">
                            {formatCurrency(precoVendaPagoCliente + subtotalMarketplace + acrescimoManual - activeDiscount)}
                          </span>
                        </div>
                      </>
                    )}

                    {/* Detalhamento por item (múltiplos produtos) */}
                    {hasMultipleProducts && (
                      <div className="border-t border-zinc-800/60 divide-y divide-zinc-800/40">
                        {productItems.map((p, i) => (
                          <div key={i} className="flex items-center justify-between px-4 py-2 bg-zinc-900/40">
                            <div className="flex-1 min-w-0 mr-3">
                              <p className="text-[11px] text-zinc-300 truncate">{p.name}</p>
                              {p.sku && <p className="text-[10px] text-zinc-600 font-mono">{p.sku}</p>}
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-[12px] text-emerald-400 font-semibold tabular-nums">{formatCurrency(p.totalPrice)}</p>
                              {p.qty > 1 && <p className="text-[10px] text-zinc-600">{p.qty}× {formatCurrency(p.unitPrice)}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Retorno Líquido TikTok — só TikTok; quando preenchido substitui custo marketplace + afiliados */}
                  {isTikTok && (
                  <div className="rounded-xl overflow-hidden bg-teal-950/20">
                    <button
                      onClick={() => setOpenRetornoLiquido(v => !v)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-teal-950/60 to-zinc-900/60 hover:from-teal-950/80 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <svg className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
                        </svg>
                        <span className="text-teal-400 font-semibold text-xs uppercase tracking-wide">Retorno Líquido TikTok</span>
                        {hasRetornoLiquido && (
                          <span className="text-[10px] text-teal-400/80 font-mono bg-teal-950/40 px-1.5 py-0.5 rounded">
                            {formatCurrency(retornoLiquidoValue)}
                          </span>
                        )}
                      </div>
                      <svg className={`w-4 h-4 text-zinc-500 transition-transform duration-200 ${openRetornoLiquido ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {openRetornoLiquido && (
                      <div className="px-4 py-3 space-y-2 bg-zinc-900/40 border-t border-teal-950/20">
                        <p className="text-[11px] text-zinc-500">
                          Valor líquido que o TikTok repassou por este pedido. Quando preenchido, o custo marketplace e afiliados são desconsiderados no cálculo do lucro.
                        </p>
                        <div className="flex items-center gap-3">
                          <label className="text-zinc-400 text-sm whitespace-nowrap">Valor (R$)</label>
                          <input
                            type="text"
                            inputMode="decimal"
                            placeholder="0,00"
                            value={manualRetornoLiquido}
                            onChange={(e) => setManualRetornoLiquido(e.target.value.replace(/[^0-9,.]/g, ''))}
                            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-teal-500 tabular-nums"
                          />
                          {retornoLiquidoValue > 0 && (
                            <button
                              onClick={() => setManualRetornoLiquido('')}
                              className="text-zinc-500 hover:text-zinc-300 transition-colors"
                              title="Limpar"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                        </div>
                        {/* Save button */}
                        {selectedOrder?.bling_order_id && (
                          <button
                            disabled={savingRetornoLiquido}
                            onClick={async () => {
                              if (!selectedOrder?.bling_order_id) return;
                              setSavingRetornoLiquido(true);
                              try {
                                const saveVal = retornoLiquidoValue > 0 ? retornoLiquidoValue : null;
                                await supabase
                                  .from('bling_orders')
                                  .update({ tiktok_retorno_liquido: saveVal })
                                  .eq('id', selectedOrder.bling_order_id);
                                setSelectedOrder({ ...selectedOrder, tiktok_retorno_liquido: saveVal });
                                refetch();
                                refetchYearly();
                              } finally {
                                setSavingRetornoLiquido(false);
                              }
                            }}
                            className="flex items-center gap-1.5 bg-teal-700/80 hover:bg-teal-600 disabled:opacity-50 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors w-full justify-center"
                          >
                            {savingRetornoLiquido ? (
                              <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                            ) : (
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/></svg>
                            )}
                            Salvar Retorno Líquido
                          </button>
                        )}
                        {hasRetornoLiquido && (
                          <p className="text-[11px] text-teal-400/70">
                            Custo Marketplace e Afiliados desconsiderados. Lucro = {formatCurrency(retornoLiquidoValue)} − custo produto.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  )}

                  {/* Custo do Produto — accordion por item */}
                  <div className="rounded-xl overflow-hidden bg-red-950/15">
                    <button
                      onClick={() => setOpenProduto(v => !v)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-red-950/60 to-zinc-900/60 hover:from-red-950/80 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <svg className="w-3.5 h-3.5 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        <span className="text-red-400 font-semibold text-xs uppercase tracking-wide">Custo do Produto</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-red-400 font-semibold text-sm tabular-nums">-{formatCurrency(totalProductCost)}</span>
                        <svg className={`w-4 h-4 text-zinc-500 transition-transform duration-200 ${openProduto ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </button>
                    {openProduto && (
                      <div className="bg-zinc-900/40 border-t border-red-950/20">
                        {/* Itens — apenas custo base por produto */}
                        <div className="divide-y divide-zinc-800/30">
                          {productItems.map((p, i) => (
                            <div key={i} className="flex items-center justify-between px-4 py-2.5 gap-2">
                              <div className="flex-1 min-w-0 text-left">
                                <p className="text-[11px] text-zinc-300 truncate">{p.name}</p>
                                {p.sku && <p className="text-[10px] text-zinc-600 font-mono">{p.sku}</p>}
                                {p.qty > 1 && <p className="text-[10px] text-zinc-500">{p.qty}×</p>}
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  placeholder={String(p.unitCostRaw)}
                                  value={manualCostOverrides[i] ?? ''}
                                  onChange={(e) => {
                                    const val = e.target.value.replace(/[^0-9,.]/g, '');
                                    setManualCostOverrides(prev => ({ ...prev, [i]: val }));
                                  }}
                                  className="w-16 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 tabular-nums text-right"
                                />
                                <span className="text-red-400 text-[12px] font-semibold tabular-nums">-{formatCurrency(p.baseCost)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                        {/* Taxas do fornecedor — só Dogama */}
                        {isDogama && (
                          <div className="border-t border-red-950/30 bg-red-950/15 px-4 py-3 space-y-2">
                            <p className="text-[10px] font-semibold text-red-500/70 uppercase tracking-widest mb-2">Taxas do Fornecedor</p>
                            {/* Taxa % fornecedor — editável, pré-preenche com valor do produto */}
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-xs text-zinc-400 shrink-0">Taxa fornecedor</span>
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  placeholder={String(effectiveSupFeePercent)}
                                  value={manualSupplierFeePercent}
                                  onChange={(e) => setManualSupplierFeePercent(e.target.value.replace(/[^0-9,.]/g, ''))}
                                  className="w-14 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 tabular-nums text-right"
                                />
                                <span className="text-zinc-500 text-xs">%</span>
                                <span className="text-red-400 text-xs font-semibold tabular-nums">-{formatCurrency(orderSupplierFee)}</span>
                              </div>
                            </div>
                            {/* Taxa de transação Dogama — editável (0 para zerar) */}
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-xs text-zinc-400 shrink-0">Taxa de transação (Dogama)</span>
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  placeholder={String(productGatewayFee)}
                                  value={manualGatewayFee}
                                  onChange={(e) => setManualGatewayFee(e.target.value.replace(/[^0-9,.]/g, ''))}
                                  className="w-14 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 tabular-nums text-right"
                                />
                                <span className="text-red-400 text-xs font-semibold tabular-nums">-{formatCurrency(orderGatewayFee)}</span>
                              </div>
                            </div>
                            {/* Subtotal custo produto */}
                            <div className="flex justify-between items-center pt-1.5 border-t border-red-950/20">
                              <span className="text-[11px] text-zinc-400 font-medium">Subtotal custo</span>
                              <span className="text-red-400 text-[12px] font-bold tabular-nums">-{formatCurrency(totalProductCost)}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Salvar custos no banco */}
                  {(Object.keys(manualCostOverrides).some(k => manualCostOverrides[Number(k)] !== '') || manualSupplierFeePercent !== '' || manualGatewayFee !== '') && (
                    <div className="flex items-center justify-end gap-3 px-1 py-1">
                      {costsSaved && (
                        <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          Salvo!
                        </span>
                      )}
                      <button
                        onClick={() => handleSaveCosts(
                          selectedOrder?.products ?? [],
                          manualCostOverrides,
                          manualSupplierFeePercent,
                          manualGatewayFee,
                        )}
                        disabled={savingCosts}
                        className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                      >
                        {savingCosts ? (
                          <>
                            <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                            </svg>
                            Salvando...
                          </>
                        ) : (
                          <>
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                            </svg>
                            Salvar custos
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Custo Marketplace — oculto para amostras grátis */}
                  {!isFreeSample && (
                  <div className="rounded-xl overflow-hidden bg-orange-950/15">
                    <button
                      onClick={() => setOpenMarketplace(v => !v)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-orange-950/60 to-zinc-900/60 hover:from-orange-950/80 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <svg className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span className={`font-semibold text-xs uppercase tracking-wide ${hasRetornoLiquido ? 'text-zinc-600 line-through' : 'text-orange-400'}`}>Custo Marketplace — {resolvedMarketplaceName}</span>
                        {hasRetornoLiquido && <span className="text-[10px] text-teal-500 font-medium">(retorno líquido aplicado)</span>}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`font-semibold text-sm tabular-nums ${hasRetornoLiquido ? 'text-zinc-600 line-through' : 'text-orange-400'}`}>-{formatCurrency(subtotalMarketplace)}</span>
                        <svg className={`w-4 h-4 text-zinc-500 transition-transform duration-200 ${openMarketplace ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </button>
                    {openMarketplace && (
                      <div className="px-4 py-3 space-y-2 bg-zinc-900/40 border-t border-orange-950/20">
                        {commissionPercent > 0 && (
                          <div className="flex justify-between text-sm">
                            <div className="flex items-center gap-1.5">
                              <span className="text-zinc-400">Comissão{commissionRate > 0 ? ` (${commissionRate}%)` : ''}</span>
                              {totalProductsValue > 0 && totalProductsValue !== selectedOrder.total_amount && (
                                <span className="text-[10px] text-zinc-600 font-mono">sobre {formatCurrency(totalProductsValue)}</span>
                              )}
                            </div>
                            <span className="text-orange-400 font-medium tabular-nums">-{formatCurrency(commissionPercent)}</span>
                          </div>
                        )}
                        {affiliateRate > 0 && (
                          <div className="flex items-center justify-between pt-2 mt-2 border-t border-orange-950/20">
                            <div className="flex items-center gap-2">
                              <Checkbox
                                checked={cameFromAffiliate}
                                onCheckedChange={(v) => {
                                  const checked = v === true;
                                  setCameFromAffiliate(checked);
                                  if (selectedOrder?.order_id) {
                                    setAffiliateByOrderId((prev) => ({ ...prev, [selectedOrder.order_id]: checked }));
                                  }
                                }}
                              />
                              <span className="text-zinc-400 text-sm select-none">Veio por afiliado</span>
                            </div>
                            <span className="text-[11px] text-zinc-600 font-mono">{affiliateRate}%</span>
                          </div>
                        )}
                        {affiliateCommission > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-zinc-400">Comissão afiliado ({affiliateRate}%)</span>
                            <span className="text-orange-400 font-medium tabular-nums">-{formatCurrency(affiliateCommission)}</span>
                          </div>
                        )}
                        {fixedFee > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-zinc-400">Taxa fixa</span>
                            <span className="text-orange-400 font-medium tabular-nums">-{formatCurrency(fixedFee)}</span>
                          </div>
                        )}
                        {sfpFee > 0 && (
                          <div className="flex justify-between text-sm">
                            <div className="flex items-center gap-1.5">
                              <span className="text-zinc-400">Taxa de serviço SFP</span>
                              <span className="text-[10px] text-zinc-600 font-mono">(6% × {formatCurrency(precoVendaBruto)})</span>
                            </div>
                            <span className="text-orange-400 font-medium tabular-nums">-{formatCurrency(sfpFee)}</span>
                          </div>
                        )}
                        {/* Frete — editável; TikTok+SFP default 0 (incluso na taxa SFP) */}
                        <div className="flex justify-between text-sm items-center gap-2">
                          <span className="text-zinc-400 shrink-0">Frete</span>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              inputMode="decimal"
                              placeholder={sfpEnabled ? '0' : String(selectedOrder.shipping_cost)}
                              value={manualShipping}
                              onChange={(e) => setManualShipping(e.target.value.replace(/[^0-9,.]/g, ''))}
                              className="w-16 bg-zinc-800/60 border border-zinc-700 rounded px-2 py-0.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 tabular-nums text-right"
                            />
                            {effectiveShipping > 0 && (
                              <span className="text-orange-400 font-medium tabular-nums text-xs">-{formatCurrency(effectiveShipping)}</span>
                            )}
                            {effectiveShipping === 0 && sfpEnabled && (
                              <span className="text-emerald-600 text-[10px] font-medium">incluso SFP</span>
                            )}
                          </div>
                        </div>
                        {selectedOrder.other_expenses > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-zinc-400">Outras despesas</span>
                            <span className="text-orange-400 font-medium tabular-nums">-{formatCurrency(selectedOrder.other_expenses)}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  )}

                  {/* Accordion de Afiliados */}
                  {selectedOrder?.order_id && selectedOrder?.marketplace && (
                    <div className={hasRetornoLiquido ? 'opacity-40 pointer-events-none relative' : ''}>
                      {hasRetornoLiquido && (
                        <div className="absolute inset-0 flex items-center justify-center z-10">
                          <span className="text-[10px] text-teal-500 font-medium bg-zinc-950/80 px-2 py-0.5 rounded">desconsiderado</span>
                        </div>
                      )}
                      <AffiliateAccordion
                        orderId={selectedOrder.order_id}
                        marketplaceId={resolvedMarketplaceConfig?.id || ''}
                        organizationId={organizationId}
                        currentAffiliateId={selectedOrder.affiliate_id}
                        onAffiliateChange={(affiliateId) => {
                          if (selectedOrder) {
                            setSelectedOrder({ ...selectedOrder, affiliate_id: affiliateId });
                          }
                        }}
                      />
                    </div>
                  )}

                  {/* Accordion de Descontos */}
                  <div className="rounded-xl overflow-hidden bg-yellow-950/15">
                    <button
                      onClick={() => setOpenDescontos(v => !v)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-yellow-950/50 to-zinc-900/60 hover:from-yellow-950/70 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <svg className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M17 17h.01M7 17h.01M17 7h.01M3 12a9 9 0 1118 0 9 9 0 01-18 0zM9 9l6 6" />
                        </svg>
                        <span className="text-yellow-400 font-semibold text-xs uppercase tracking-wide">Descontos</span>
                        {activeDiscount > 0 && (
                          <span className="text-[10px] text-yellow-500/80 font-mono bg-yellow-950/40 px-1.5 py-0.5 rounded">
                            -{formatCurrency(activeDiscount)}
                          </span>
                        )}
                      </div>
                      <svg className={`w-4 h-4 text-zinc-500 transition-transform duration-200 ${openDescontos ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {openDescontos && (
                      <div className="px-4 py-3 space-y-3 bg-zinc-900/40 border-t border-yellow-950/20">
                        {/* Desconto do Bling */}
                        {blingDiscountValue > 0 ? (
                          <>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  id="bling-discount-check"
                                  checked={blingDiscountEnabled}
                                  onCheckedChange={(v) => {
                                    setBlingDiscountEnabled(v === true);
                                    setManualDesconto('');
                                  }}
                                />
                                <label htmlFor="bling-discount-check" className="text-zinc-300 text-sm cursor-pointer select-none">
                                  Desconto do pedido
                                </label>
                              </div>
                              <span className={`text-sm font-semibold tabular-nums ${blingDiscountEnabled ? 'text-yellow-400' : 'text-zinc-600 line-through'}`}>
                                -{formatCurrency(blingDiscountValue)}
                              </span>
                            </div>
                            {/* Campo manual quando checkbox desmarcado */}
                            {!blingDiscountEnabled && (
                              <div className="flex items-center gap-3 pt-1">
                                <label className="text-zinc-400 text-sm whitespace-nowrap">Desconto manual (R$)</label>
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  placeholder="0,00"
                                  value={manualDesconto}
                                  onChange={(e) => {
                                    const v = e.target.value.replace(/[^0-9,.]/g, '');
                                    setManualDesconto(v);
                                  }}
                                  className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500 tabular-nums"
                                />
                                {manualDiscountValue > 0 && (
                                  <button
                                    onClick={() => setManualDesconto('')}
                                    className="text-zinc-500 hover:text-zinc-300 transition-colors"
                                    title="Limpar"
                                  >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                )}
                              </div>
                            )}
                          </>
                        ) : (
                          /* Sem desconto do Bling — campo manual direto */
                          <div className="space-y-2">
                            <p className="text-[11px] text-zinc-500 italic">Nenhum desconto registrado neste pedido. Insira manualmente se necessário.</p>
                            <div className="flex items-center gap-3">
                              <label className="text-zinc-400 text-sm whitespace-nowrap">Desconto (R$)</label>
                              <input
                                type="text"
                                inputMode="decimal"
                                placeholder="0,00"
                                value={manualDesconto}
                                onChange={(e) => {
                                  const v = e.target.value.replace(/[^0-9,.]/g, '');
                                  setManualDesconto(v);
                                }}
                                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500 tabular-nums"
                              />
                              {manualDiscountValue > 0 && (
                                <button
                                  onClick={() => setManualDesconto('')}
                                  className="text-zinc-500 hover:text-zinc-300 transition-colors"
                                  title="Limpar"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                        {/* Cupom de desconto */}
                        <div className="pt-3 border-t border-yellow-950/30 space-y-2">
                          <p className="text-xs font-semibold text-yellow-500/80 uppercase tracking-wide">Cupom de desconto</p>
                          <div className="flex items-center gap-2">
                            <div className="flex rounded-md overflow-hidden border border-zinc-700 flex-shrink-0">
                              <button type="button" onClick={() => setManualCouponType('fixed')}
                                className={`px-2 py-1 text-xs font-medium transition-colors ${manualCouponType === 'fixed' ? 'bg-yellow-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}>
                                R$
                              </button>
                              <button type="button" onClick={() => setManualCouponType('percent')}
                                className={`px-2 py-1 text-xs font-medium transition-colors ${manualCouponType === 'percent' ? 'bg-yellow-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}>
                                %
                              </button>
                            </div>
                            <input
                              type="text"
                              inputMode="decimal"
                              placeholder={manualCouponType === 'percent' ? '10' : '0,00'}
                              value={manualCoupon}
                              onChange={(e) => setManualCoupon(e.target.value.replace(/[^0-9,.]/g, ''))}
                              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500 tabular-nums"
                            />
                            {manualCoupon && (
                              <button onClick={() => setManualCoupon('')} className="text-zinc-500 hover:text-zinc-300 transition-colors flex-shrink-0">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            )}
                          </div>
                          {(() => {
                            const v = parseFloat(manualCoupon.replace(',', '.')) || 0;
                            if (v <= 0) return null;
                            const couponAmt = manualCouponType === 'percent'
                              ? (precoVendaPagoCliente * v) / 100
                              : v;
                            return (
                              <p className="text-[11px] text-yellow-500/70">
                                -{formatCurrency(couponAmt)} descontado do lucro
                                {manualCouponType === 'percent' ? ` (${v}% sobre R$ ${formatCurrency(precoVendaPagoCliente)})` : ''}
                              </p>
                            );
                          })()}
                          {/* Save coupon button */}
                          {selectedOrder?.order_id && manualCoupon && (
                            <button
                              disabled={savingCoupon}
                              onClick={async () => {
                                if (!selectedOrder?.order_id) return;
                                const v = parseFloat(manualCoupon.replace(',', '.')) || 0;
                                setSavingCoupon(true);
                                try {
                                  await supabase
                                    .from('orders')
                                    .update({ coupon_value: v > 0 ? v : null, coupon_type: manualCouponType })
                                    .eq('id', selectedOrder.order_id);
                                  refetch();
                                  refetchYearly();
                                } finally {
                                  setSavingCoupon(false);
                                }
                              }}
                              className="flex items-center gap-1.5 bg-yellow-700/80 hover:bg-yellow-600 disabled:opacity-50 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors w-full justify-center"
                            >
                              {savingCoupon ? (
                                <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                              ) : (
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/></svg>
                              )}
                              Salvar Cupom
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Accordion de Acréscimos */}
                  <div className="rounded-xl overflow-hidden bg-blue-950/15">
                    <button
                      onClick={() => setOpenAcrescimos(v => !v)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-950/50 to-zinc-900/60 hover:from-blue-950/70 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <svg className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span className="text-blue-400 font-semibold text-xs uppercase tracking-wide">Acréscimos</span>
                        {acrescimoValue > 0 && (
                          <span className="text-[10px] text-blue-400/80 font-mono bg-blue-950/40 px-1.5 py-0.5 rounded">
                            +{formatCurrency(acrescimoValue)}
                          </span>
                        )}
                      </div>
                      <svg className={`w-4 h-4 text-zinc-500 transition-transform duration-200 ${openAcrescimos ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {openAcrescimos && (
                      <div className="px-4 py-3 space-y-3 bg-zinc-900/40 border-t border-blue-950/20">
                        {/* Reembolso TikTok */}
                        {tiktokReembolsoValue > 0 && (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Checkbox
                                id="tiktok-reembolso-acc-check"
                                checked={tiktokReembolsoEnabled && !hasRetornoLiquido}
                                disabled={hasRetornoLiquido}
                                onCheckedChange={(v) => { if (!hasRetornoLiquido) setTiktokReembolsoEnabled(v === true); }}
                              />
                              <label htmlFor="tiktok-reembolso-acc-check" className={`text-sm select-none ${hasRetornoLiquido ? 'text-zinc-600 line-through cursor-not-allowed' : 'text-zinc-300 cursor-pointer'}`}>
                                Reembolso TikTok
                                {hasRetornoLiquido && <span className="text-[10px] text-teal-600 ml-1 no-underline">(retorno líquido ativo)</span>}
                              </label>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-sm font-semibold tabular-nums ${hasRetornoLiquido ? 'text-zinc-600 line-through' : tiktokReembolsoEnabled ? 'text-emerald-400' : 'text-zinc-600 line-through'}`}>
                                +{formatCurrency(tiktokReembolsoValue)}
                              </span>
                              {!hasRetornoLiquido && tiktokReembolsoEnabled !== !(selectedOrder?.tiktok_reembolso_disabled === true) && (
                                <button
                                  disabled={savingReembolso}
                                  onClick={async () => {
                                    if (!selectedOrder?.bling_order_id) return;
                                    setSavingReembolso(true);
                                    try {
                                      await supabase
                                        .from('bling_orders')
                                        .update({ tiktok_reembolso_disabled: !tiktokReembolsoEnabled })
                                        .eq('id', selectedOrder.bling_order_id);
                                      setSelectedOrder({ ...selectedOrder, tiktok_reembolso_disabled: !tiktokReembolsoEnabled });
                                      refetch();
                                      refetchYearly();
                                    } finally {
                                      setSavingReembolso(false);
                                    }
                                  }}
                                  className="flex items-center gap-1 bg-emerald-700/80 hover:bg-emerald-600 disabled:opacity-50 text-white text-[10px] font-semibold px-2 py-0.5 rounded transition-colors"
                                >
                                  {savingReembolso ? (
                                    <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                                  ) : (
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/></svg>
                                  )}
                                  Salvar
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                        {/* Acréscimo manual */}
                        <div className="flex items-center gap-3">
                          <label className="text-zinc-400 text-sm whitespace-nowrap">Valor (R$)</label>
                          <input
                            type="text"
                            inputMode="decimal"
                            placeholder="0,00"
                            value={manualAcrescimo}
                            onChange={(e) => {
                              const v = e.target.value.replace(/[^0-9,.]/g, '');
                              setManualAcrescimo(v);
                            }}
                            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500 tabular-nums"
                          />
                          {acrescimoManual > 0 && (
                            <button
                              onClick={() => setManualAcrescimo('')}
                              className="text-zinc-500 hover:text-zinc-300 transition-colors"
                              title="Limpar"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                        </div>
                        {acrescimoValue > 0 && (
                          <p className="text-[11px] text-blue-400/70">
                            +{formatCurrency(acrescimoValue)} será somado ao lucro
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Custo de Marketing */}
                  <div className="rounded-xl overflow-hidden bg-purple-950/15">
                    <button
                      onClick={() => setOpenMarketingCost(v => !v)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-950/60 to-zinc-900/60 hover:from-purple-950/80 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <svg className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                        </svg>
                        <span className="text-purple-400 font-semibold text-xs uppercase tracking-wide">Custo de Marketing</span>
                        {(() => {
                          const mCost = manualMarketingCost !== ''
                            ? (parseFloat(manualMarketingCost.replace(',', '.')) || 0)
                            : 0;
                          return mCost > 0 ? (
                            <span className="text-[10px] text-purple-400/80 font-mono bg-purple-950/40 px-1.5 py-0.5 rounded">
                              -{formatCurrency(mCost)}
                            </span>
                          ) : null;
                        })()}
                      </div>
                      <svg className={`w-4 h-4 text-zinc-500 transition-transform duration-200 ${openMarketingCost ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {openMarketingCost && (
                      <div className="px-4 py-3 space-y-3 bg-zinc-900/40 border-t border-purple-950/20">
                        <p className="text-[11px] text-zinc-500">
                          Custo investido em tráfego pago para este pedido. Será subtraído do lucro.
                        </p>

                        {/* Vincular Campanha */}
                        <div className="space-y-1.5">
                          <label className="text-zinc-400 text-xs">Vincular Campanha</label>
                          <select
                            value={linkedCampaignId ?? ''}
                            onChange={async (e) => {
                              const cid = e.target.value || null;
                              setLinkedCampaignId(cid);
                              if (cid) {
                                const found = availableCampaigns.find((c) => c.id === cid);
                                if (found?.marketing_cost != null) {
                                  setManualMarketingCost(
                                    new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(found.marketing_cost)
                                  );
                                }
                              } else {
                                setManualMarketingCost('');
                              }
                            }}
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-purple-500"
                          >
                            <option value="">— Nenhuma campanha —</option>
                            {availableCampaigns.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}{c.marketing_cost != null ? ` · R$ ${new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(c.marketing_cost)}` : ''}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Valor manual */}
                        <div className="flex items-center gap-3">
                          <label className="text-zinc-400 text-sm whitespace-nowrap">Valor (R$)</label>
                          <input
                            type="text"
                            inputMode="decimal"
                            placeholder="0,00"
                            value={manualMarketingCost}
                            readOnly
                            className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-zinc-400 placeholder-zinc-600 cursor-not-allowed tabular-nums"
                          />
                          {manualMarketingCost && (
                            <button onClick={() => { setManualMarketingCost(''); setLinkedCampaignId(null); }} className="text-zinc-500 hover:text-zinc-300 transition-colors">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                        </div>

                        {manualMarketingCost && (
                          <p className="text-[11px] text-purple-400/70">
                            -{formatCurrency(parseFloat(manualMarketingCost.replace(',', '.')) || 0)} será subtraído do lucro real.
                          </p>
                        )}

                        {/* Salvar */}
                        {selectedOrder?.order_id && (
                          <button
                            disabled={savingMarketingCost}
                            onClick={async () => {
                              if (!selectedOrder?.order_id) return;
                              const cost = parseFloat((manualMarketingCost || '0').replace(',', '.')) || 0;
                              setSavingMarketingCost(true);
                              try {
                                if (cost === 0 && !linkedCampaignId) {
                                  // Remove custo de marketing
                                  await supabase
                                    .from('campaign_order_costs')
                                    .delete()
                                    .eq('order_id', selectedOrder.order_id);
                                } else {
                                  await supabase
                                    .from('campaign_order_costs')
                                    .upsert({
                                      order_id: selectedOrder.order_id,
                                      campaign_id: linkedCampaignId ?? null,
                                      marketing_cost: cost,
                                      organization_id: organizationId,
                                    }, { onConflict: 'order_id' });
                                }
                                refetch();
                                refetchYearly();
                              } finally {
                                setSavingMarketingCost(false);
                              }
                            }}
                            className="flex items-center gap-1.5 bg-purple-700/80 hover:bg-purple-600 disabled:opacity-50 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors w-full justify-center"
                          >
                            {savingMarketingCost ? (
                              <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                            ) : (
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/></svg>
                            )}
                            Salvar Custo de Marketing
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Lucro Real */}
                  <div className={`rounded-xl px-4 py-4 border ${profitPositive ? 'bg-emerald-950/25 border-emerald-800/40' : 'bg-red-950/25 border-red-800/40'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-zinc-500 text-[10px] uppercase tracking-widest font-medium mb-0.5">Lucro Real</p>
                        <p className={`text-2xl font-bold tabular-nums ${profitPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                          {formatCurrency(realProfit)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-zinc-500 text-[10px] uppercase tracking-widest font-medium mb-0.5">Margem</p>
                        <p className={`text-2xl font-bold tabular-nums ${profitPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                          {margin}%
                        </p>
                      </div>
                    </div>
                    {/* Breakdown: profit components */}
                    {(manualMarketingCostVal > 0 || manualCouponVal > 0) && (
                      <div className="border-t border-zinc-700/40 pt-3 mt-2 space-y-1.5">
                        {manualMarketingCostVal > 0 && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-zinc-500">Custo de Marketing</span>
                            <span className="text-purple-400 font-semibold tabular-nums">
                              -{formatCurrency(manualMarketingCostVal)}
                            </span>
                          </div>
                        )}
                        {manualCouponVal > 0 && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-zinc-500">Cupom de Desconto</span>
                            <span className="text-yellow-400 font-semibold tabular-nums">
                              -{formatCurrency(manualCouponVal)}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden mt-3">
                      <div
                        className={`h-full rounded-full ${profitPositive ? 'bg-emerald-500' : 'bg-red-500'}`}
                        style={{ width: `${Math.min(Math.abs(Number(margin)), 100)}%`, transition: 'width 0.6s ease' }}
                      />
                    </div>
                  </div>

                  {/* Custo Total Marketing */}
                  {manualMarketingCostVal > 0 && (
                    <div className="rounded-xl px-4 py-3 border border-purple-800/30 bg-purple-950/15 flex items-center justify-between">
                      <div>
                        <p className="text-zinc-500 text-[10px] uppercase tracking-widest font-medium mb-0.5">Custo Total Marketing</p>
                        <p className="text-lg font-bold text-purple-400 tabular-nums">
                          -{formatCurrency(manualMarketingCostVal)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-zinc-500 text-[10px] uppercase tracking-widest font-medium mb-0.5">Lucro Real</p>
                        <p className={`text-lg font-bold tabular-nums ${realProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {formatCurrency(realProfit)}
                        </p>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Você tem certeza que quer excluir o pedido #{orderToDelete?.number}
              {orderToDelete?.store && orderToDelete.store !== 'null' && orderToDelete.store !== 'Sem marketplace' ? ` do marketplace ${orderToDelete.store}` : ''}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação é irreversível. O pedido será permanentemente excluído do sistema, incluindo todos os itens relacionados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteOrder}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Excluindo...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card className="p-6 border-gray-100 dark:border-zinc-800">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Relatório de Receita
          </h3>
          <div className="flex items-center gap-6">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Receita</p>
              <p className="text-xl font-bold text-green-600">{formatCurrency(totalRevenue)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{periodLabel}</p>
              <p className={`text-xl font-bold ${currentPeriodProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(currentPeriodProfit)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Lucro Total</p>
              <p className={`text-xl font-bold ${allDataTotalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(allDataTotalProfit)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{costLabel}</p>
              <p className="text-xl font-bold text-red-600">{formatCurrency(currentPeriodCost)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Custo Total</p>
              <p className="text-xl font-bold text-red-600">{formatCurrency(allDataTotalCost)}</p>
            </div>
          </div>
          {(totalMarketingCost > 0 || totalMarketingCostAllTime > 0) && (
            <div className="flex items-center gap-6 mt-2">
              {totalMarketingCost > 0 && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{`Marketing ${periodLabel.replace('Lucro ', '')}`}</p>
                  <p className="text-xl font-bold text-orange-500">{formatCurrency(totalMarketingCost)}</p>
                </div>
              )}
              {totalMarketingCostAllTime > 0 && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Marketing Total</p>
                  <p className="text-xl font-bold text-orange-500">{formatCurrency(totalMarketingCostAllTime)}</p>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={(value) => handlePeriodChange(value as PeriodFilter)}>
            <SelectTrigger className="w-[140px] border-gray-200 dark:border-zinc-800">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Diário</SelectItem>
              <SelectItem value="weekly">Semanal</SelectItem>
              <SelectItem value="monthly">Mensal</SelectItem>
              <SelectItem value="yearly">Anual</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {data.length > 0 ? (
        <div className="relative">
          {/* Navigation arrows — outside chart div to avoid ApexCharts SVG intercept */}
          {period !== 'yearly' && (
            <button
              onClick={() => setWindowOffset(o => Math.max(0, o - 1))}
              disabled={windowOffset === 0}
              style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', zIndex: 50 }}
              className="w-8 h-16 flex items-center justify-center bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/60 rounded-r-lg text-zinc-400 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all"
              title="Anterior"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          {period !== 'yearly' && (
            <button
              onClick={() => setWindowOffset(o => Math.min(maxOffset, o + 1))}
              disabled={windowOffset >= maxOffset}
              style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', zIndex: 50 }}
              className="w-8 h-16 flex items-center justify-center bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/60 rounded-l-lg text-zinc-400 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all"
              title="Próximo"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
          <div ref={chartRef}>
          <Chart key={`${JSON.stringify(visibleData.map(d => d.period_label + '_' + d.total_profit))}_${windowOffset}`} options={chartOptions} series={chartSeries} type="area" height={300} />
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
          Sem dados disponíveis para o período selecionado
        </div>
      )}
    </Card>
    </>
  );
};
