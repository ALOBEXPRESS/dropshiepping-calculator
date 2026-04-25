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

interface RevenueReportChartProps {
  organizationId: string;
  refreshTrigger?: number;
  onOrderDeleted?: () => void;
}


interface OrderDetail {
  order_id: string;
  order_number: string;
  marketplace: string;
  marketplace_fixed_fee?: number;
  is_free_sample?: boolean;
  customer_name?: string;
  product_name?: string;
  product_sku?: string;
  product_image_url?: string;
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
  total_cost: number;
  product_cost_price?: number;
  marketplace_commission: number;
  commission_rate: number;
  shipping_cost: number;
  other_expenses: number;
  supplier_fee_value?: string;
  supplier_fee_type?: string;
  supplier_gateway_fee_value?: string;
  supplier_gateway_fee_type?: string;
  total_profit: number;
  tiktok_sfp_enabled?: boolean;
}

export const RevenueReportChart: React.FC<RevenueReportChartProps> = ({ organizationId, refreshTrigger, onOrderDeleted }) => {
  const [period, setPeriod] = useState<PeriodFilter>('monthly');
  const { data, loading, error, refetch } = useRevenueReport(organizationId, period);
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
      total_amount?: number;
      shipping_cost?: number;
      other_expenses?: number;
      marketplace_commission?: number;
      commission_rate?: number;
      marketplace_fixed_fee?: number;
      products?: {
        quantity?: number;
        unit_cost?: number;
        supplier_fee_value?: string;
        supplier_fee_type?: string;
        supplier_gateway_fee_value?: string;
        supplier_gateway_fee_type?: string;
      }[];
      tiktok_sfp_enabled?: boolean | string;
      is_free_sample?: boolean | string;
    };

    const totalAmount = Number(o.total_amount ?? 0);
    const isFreeSample = o.is_free_sample === true || String(o.is_free_sample ?? '') === 'true';
    const products = o.products ?? [];

    const totalBaseCost = products.reduce((sum, p) => {
      const qty = Number(p.quantity ?? 1);
      const unitCost = Number(p.unit_cost ?? 0);
      return sum + unitCost * qty;
    }, 0);

    const supFeeProduct = products.reduce((best, p) => {
      const v = Number(p.supplier_fee_value ?? 0);
      return v > Number(best?.supplier_fee_value ?? 0) ? p : best;
    }, products[0]);

    const gwFeeProduct = products.reduce((best, p) => {
      const v = Number(p.supplier_gateway_fee_value ?? 0);
      return v > Number(best?.supplier_gateway_fee_value ?? 0) ? p : best;
    }, products[0]);

    const supFeeVal = Number(supFeeProduct?.supplier_fee_value ?? 0);
    const supFeeType = supFeeProduct?.supplier_fee_type ?? 'percent';
    const gwFeeVal = Number(gwFeeProduct?.supplier_gateway_fee_value ?? 0);
    const gwFeeType = gwFeeProduct?.supplier_gateway_fee_type ?? 'fixed';

    const orderSupplierFee = supFeeVal > 0
      ? (supFeeType === 'percent' ? (totalBaseCost * supFeeVal) / 100 : supFeeVal)
      : 0;
    const orderGatewayFee = gwFeeVal > 0
      ? (gwFeeType === 'fixed' ? gwFeeVal : (totalBaseCost * gwFeeVal) / 100)
      : 0;

    const totalProductCost = totalBaseCost + orderSupplierFee + orderGatewayFee;

    const fixedFee = Number(marketplaceConfig?.fixed_fee ?? o.marketplace_fixed_fee ?? 0);
    const commissionRate = Number(marketplaceConfig?.commission_rate ?? o.commission_rate ?? 0);
    const affiliateRate = Number(marketplaceConfig?.affiliate_commission_rate ?? 0);

    const cameFromAffiliate = cameFromAffiliateOverride ?? Boolean(o.order_id && affiliateByOrderIdRef.current?.[o.order_id]);
    const affiliateCommission = isFreeSample
      ? 0
      : (cameFromAffiliate && affiliateRate > 0 ? (totalAmount * affiliateRate) / 100 : 0);

    const sfpEnabled = o.tiktok_sfp_enabled === true || String(o.tiktok_sfp_enabled ?? '') === 'true';
    const sfpFee = isFreeSample ? 0 : (sfpEnabled ? totalAmount * 0.06 : 0);

    const commissionPercent = isFreeSample
      ? 0
      : (commissionRate > 0
        ? (totalAmount * commissionRate) / 100
        : Math.max(0, Number(o.marketplace_commission ?? 0) - fixedFee));

    const shipping = Number(o.shipping_cost ?? 0);
    const other = Number(o.other_expenses ?? 0);
    const subtotalMarketplace = isFreeSample
      ? 0
      : (commissionPercent + fixedFee + sfpFee + shipping + other + affiliateCommission);

    const realProfit = totalAmount - totalProductCost - subtotalMarketplace;

    return {
      realProfit,
      isFreeSample,
    };
  }, []);

  const [openProduto, setOpenProduto] = useState(false);
  const [openMarketplace, setOpenMarketplace] = useState(false);
  
  const chartRef = useRef<HTMLDivElement>(null);
  const dataRef = useRef(data);
  dataRef.current = data;
  const periodRef = useRef(period);
  periodRef.current = period;
  // Estado de paginação por dataPointIndex — controla qual pedido está visível no tooltip
  const [tooltipPages, setTooltipPages] = useState<Record<number, number>>({});
  const tooltipPagesRef = useRef(tooltipPages);
  tooltipPagesRef.current = tooltipPages;

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
          const dataPointIndex = parseInt(key.replace('tooltip_page_', ''), 10);
          const current = tooltipPagesRef.current[dataPointIndex] ?? 0;
          const next = dir === 'next' ? Math.min(current + 1, max) : Math.max(current - 1, 0);

          // Atualizar estado React
          setTooltipPages(prev => ({ ...prev, [dataPointIndex]: next }));

          // Atualizar a série do gráfico via ApexCharts API (sem fechar o tooltip)
          const canvas = document.querySelector('.apexcharts-canvas');
          if (canvas) {
            const chartId = (canvas.id || '').replace('apexcharts', '');
            const ApexChartsGlobal = (window as unknown as { ApexCharts?: { getChartByID: (id: string) => { updateSeries: (s: unknown[], animate?: boolean) => void } | null } }).ApexCharts;
            if (ApexChartsGlobal && chartId) {
              const instance = ApexChartsGlobal.getChartByID(chartId);
              if (instance) {
                const newSeriesData = dataRef.current.map((item, idx) => {
                  const page = idx === dataPointIndex ? next : (tooltipPagesRef.current[idx] ?? 0);
                  const orders = item.orders_data ?? [];
                  if (orders.length > 0 && orders[page]) {
                    const o = orders[page] as unknown as {
                      marketplace?: string;
                      commission_rate?: number;
                      marketplace_fixed_fee?: number;
                    };
                    const cfg = resolveMarketplaceConfig(
                      o.marketplace,
                      Number(o.commission_rate ?? 0),
                      Number(o.marketplace_fixed_fee ?? 0)
                    );
                    return computeOrderRealProfit(orders[page], cfg).realProfit;
                  }
                  return Number(item.total_profit ?? 0);
                });
                const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
                const shouldAnimate = !reduceMotion && (periodRef.current === 'monthly' || periodRef.current === 'yearly');
                instance.updateSeries([{ name: 'Lucro', data: newSeriesData }], shouldAnimate);
              }
            }
          }

          // Atualizar o HTML do tooltip diretamente no DOM (resposta imediata)
          const tooltipEl = document.querySelector('.apexcharts-tooltip.apexcharts-active');
          if (tooltipEl) {
            const currentData = dataRef.current;
            if (!isNaN(dataPointIndex) && currentData[dataPointIndex]) {
              const periodData = currentData[dataPointIndex];
              const ordersCount = periodData.orders_data?.length || 0;
              const order = periodData.orders_data?.[next];

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
                const customerName = (order as { customer_name?: string }).customer_name || 'Cliente não identificado';
                const orderNumber = order.order_number || 'S/N';
                const productNamesFromItems = (order.products || []).map((p: { name: string }) => p.name).filter(Boolean) as string[];
                const mainProductName = (order as { product_name?: string }).product_name || productNamesFromItems[0] || 'Produto não vinculado';
                const productCount = productNamesFromItems.length;
                const productSku = (order as { product_sku?: string }).product_sku || ((order.products || [])[0] as { sku?: string })?.sku || null;
                const { realProfit, isFreeSample } = computeOrderRealProfit(order, resolvedMarketplaceConfig);
                const profitLabel = realProfit >= 0 ? 'Lucro:' : 'Prejuízo:';
                const profitValue = realProfit >= 0
                  ? formatCurrency(realProfit)
                  : `- ${formatCurrency(Math.abs(realProfit))}`;
                const profitColor = isFreeSample ? '#e9d5ff' : (realProfit >= 0 ? '#16a34a' : '#dc2626');

                const textPrimary = isFreeSample ? '#f3e8ff' : '#374151';
                const textSecondary = isFreeSample ? '#d8b4fe' : '#6b7280';
                const dividerColor = isFreeSample ? 'rgba(167,139,250,0.3)' : 'rgba(2,6,23,0.08)';
                const navBtnBg = isFreeSample ? 'rgba(109,40,217,0.4)' : '#e5e7eb';
                const navBtnColor = isFreeSample ? '#e9d5ff' : '#374151';
                const navBtnDisabledBg = isFreeSample ? 'rgba(109,40,217,0.15)' : 'rgba(2,6,23,0.06)';
                const navBtnDisabledColor = isFreeSample ? 'rgba(233,213,255,0.3)' : '#d1d5db';

                const orderDetailData = {
                  order_id: order.order_id, order_number: orderNumber, marketplace: marketplaceName,
                  marketplace_fixed_fee: Number(resolvedMarketplaceConfig?.fixed_fee ?? (order as { marketplace_fixed_fee?: number }).marketplace_fixed_fee ?? 0),
                  customer_name: customerName, product_name: mainProductName, product_sku: productSku || undefined,
                  product_image_url: (order as { product_image_url?: string }).product_image_url || undefined,
                  products: order.products, total_amount: Number(order.total_amount ?? 0),
                  total_cost: Number(order.total_cost ?? 0),
                  product_cost_price: Number((order as { product_cost_price?: number }).product_cost_price ?? 0),
                  marketplace_commission: Number(order.marketplace_commission ?? 0),
                  commission_rate: Number(resolvedMarketplaceConfig?.commission_rate ?? order.commission_rate ?? 0),
                  shipping_cost: Number(order.shipping_cost ?? 0),
                  other_expenses: Number(order.other_expenses ?? 0),
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
                if (orderRoot) orderRoot.innerHTML = newOrderInnerHtml;

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
            const orderData = JSON.parse(orderDataStr);
            setSelectedOrder(orderData);
            setCameFromAffiliate(Boolean(affiliateByOrderIdRef.current?.[orderData.order_id]));
            setOpenProduto(false);
            setOpenMarketplace(false);
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
  }, [computeOrderRealProfit, normalizeMarketplace, resolveMarketplaceConfig]);

  // Refetch quando refreshTrigger mudar (apenas se for > 0)
  React.useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      console.log('🔄 RevenueReportChart: refreshTrigger mudou, refazendo query...', refreshTrigger);
      refetch();
    }
  }, [refreshTrigger, refetch]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
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
      
      // Fechar o tooltip do ApexCharts
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

  const totalRevenue = data.reduce((sum, item) => sum + Number(item.total_revenue), 0);
  const totalCost = data.reduce((sum, item) => sum + Number(item.total_cost), 0);
  const totalProfit = data.reduce((sum, item) => sum + Number(item.total_profit), 0);


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
      width: 2,
    },
    markers: {
      size: 6,
      colors: ['#8b5cf6'],
      strokeColors: '#ede9fe',
      strokeWidth: 1,
      hover: {
        size: 8,
      },
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.4,
        opacityTo: 0.05,
        stops: [0, 90, 100],
      },
    },
    colors: ['#8b5cf6'],
    xaxis: {
      categories: data.map((item) => item.period_label),
      labels: {
        style: {
          colors: '#6b7280',
          fontSize: '12px',
        },
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: {
        style: {
          colors: '#6b7280',
          fontSize: '12px',
        },
        formatter: (value) => formatCurrency(value),
      },
    },
    grid: {
      borderColor: '#e5e7eb',
      strokeDashArray: 4,
    },
    tooltip: {
      enabled: true,
      followCursor: false,
      intersect: false,
      shared: false,
      fixed: {
        enabled: false,
      },
      custom: ({ dataPointIndex }: { dataPointIndex: number }) => {
        const currentData = dataRef.current;
        if (!currentData[dataPointIndex]) return '';
        const periodData = currentData[dataPointIndex];
        const ordersCount = periodData.orders_data?.length || 0;

        // Estado de paginação do tooltip por período (via estado React)
        const stateKey = `tooltip_page_${dataPointIndex}`;
        const currentPage: number = tooltipPagesRef.current[dataPointIndex] ?? 0;
        const order = periodData.orders_data?.[currentPage];

        // Gerar HTML de um único pedido (paginado)
        const { orderInnerHtml, orderIsFreeSample } = order ? (() => {
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
          const customerName = (order as { customer_name?: string }).customer_name || 'Cliente não identificado';
          const orderNumber = order.order_number || 'S/N';

          const { realProfit, isFreeSample } = computeOrderRealProfit(order, resolvedMarketplaceConfig);
          const profitColor = isFreeSample ? '#e9d5ff' : (realProfit >= 0 ? '#16a34a' : '#dc2626');
          const profitLabel = realProfit >= 0 ? 'Lucro:' : 'Prejuízo:';
          const profitValue = realProfit >= 0
            ? formatCurrency(realProfit)
            : `- ${formatCurrency(Math.abs(realProfit))}`;

          const productNamesFromItems = (order.products || [])
            .map((p: { name: string }) => p.name)
            .filter(Boolean) as string[];
          const mainProductName = (order as { product_name?: string }).product_name || productNamesFromItems[0] || 'Produto não vinculado';
          const productCount = productNamesFromItems.length;
          const productSku = (order as { product_sku?: string }).product_sku ||
            ((order.products || [])[0] as { sku?: string })?.sku || null;
          const safeStore = marketplaceName;
          const orderRevenue = Number(order.total_amount ?? 0);

          // Cores do tema: branco para texto normal, roxo para amostra grátis
          const textPrimary = isFreeSample ? '#f3e8ff' : '#374151';
          const textSecondary = isFreeSample ? '#d8b4fe' : '#6b7280';
          const dividerColor = isFreeSample ? 'rgba(167,139,250,0.3)' : 'rgba(2,6,23,0.08)';
          const navBtnBg = isFreeSample ? 'rgba(109,40,217,0.4)' : '#e5e7eb';
          const navBtnColor = isFreeSample ? '#e9d5ff' : '#374151';
          const navBtnDisabledBg = isFreeSample ? 'rgba(109,40,217,0.15)' : 'rgba(2,6,23,0.06)';
          const navBtnDisabledColor = isFreeSample ? 'rgba(233,213,255,0.3)' : '#d1d5db';

          const orderDetailData: OrderDetail = {
            order_id: order.order_id,
            order_number: orderNumber,
            marketplace: marketplaceName,
            marketplace_fixed_fee: Number(resolvedMarketplaceConfig?.fixed_fee ?? (order as { marketplace_fixed_fee?: number }).marketplace_fixed_fee ?? 0),
            customer_name: customerName,
            product_name: mainProductName,
            product_sku: productSku || undefined,
            product_image_url: (order as { product_image_url?: string }).product_image_url || undefined,
            products: order.products,
            total_amount: orderRevenue,
            total_cost: Number(order.total_cost ?? 0),
            product_cost_price: Number((order as { product_cost_price?: number }).product_cost_price ?? 0),
            marketplace_commission: Number(order.marketplace_commission ?? 0),
            commission_rate: Number(resolvedMarketplaceConfig?.commission_rate ?? order.commission_rate ?? 0),
            shipping_cost: Number(order.shipping_cost ?? 0),
            other_expenses: Number(order.other_expenses ?? 0),
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
        })() : { orderInnerHtml: '', orderIsFreeSample: false };

        // Detectar se o pedido atual é amostra grátis para colorir o tooltip
        const currentOrderIsFreeSample = orderIsFreeSample;
        const tooltipBg = currentOrderIsFreeSample
          ? 'linear-gradient(135deg, #3b0764 0%, #4c1d95 50%, #2e1065 100%)'
          : 'rgba(255,255,255,0.98)';
        const tooltipBorder = currentOrderIsFreeSample
          ? '1px solid rgba(167,139,250,0.5)'
          : '1px solid rgba(2,6,23,0.08)';
        const tooltipShadow = currentOrderIsFreeSample
          ? '0 8px 34px rgba(109,40,217,0.35)'
          : '0 18px 50px rgba(2,6,23,0.14)';
        const tooltipHeaderColor = currentOrderIsFreeSample ? '#e9d5ff' : '#111827';
        const tooltipSubColor = currentOrderIsFreeSample ? '#c4b5fd' : '#6b7280';
        const tooltipBadgeBg = currentOrderIsFreeSample ? 'rgba(109,40,217,0.4)' : 'rgba(2,6,23,0.06)';
        const tooltipBadgeColor = currentOrderIsFreeSample ? '#e9d5ff' : '#6b7280';

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
        fillColors: ['#8b5cf6'],
      },
    },
  };

  const chartSeries = [
    {
      name: 'Lucro',
      data: data.map((item, idx) => {
        const currentPage = tooltipPages[idx] ?? 0;
        const orders = item.orders_data ?? [];
        if (orders.length > 0 && orders[currentPage]) {
          const o = orders[currentPage] as unknown as {
            marketplace?: string;
            commission_rate?: number;
            marketplace_fixed_fee?: number;
          };
          const cfg = resolveMarketplaceConfig(
            o.marketplace,
            Number(o.commission_rate ?? 0),
            Number(o.marketplace_fixed_fee ?? 0)
          );
          return computeOrderRealProfit(orders[currentPage], cfg).realProfit;
        }
        // Usar total_profit do período (já inclui todas as taxas)
        return Number(item.total_profit ?? 0);
      }),
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
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-lg p-0 overflow-hidden border-0 bg-zinc-950 rounded-2xl shadow-2xl [&>button]:hidden">
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

            // Calcular custos por produto usando os dados de cada item
            const productItems = products.map(p => {
              const qty = p.quantity ?? 1;
              const unitCost = p.unit_cost ?? 0;
              const unitPrice = p.unit_price ?? 0;
              const baseCost = unitCost * qty;
              const totalPrice = unitPrice * qty;
              return { name: p.name, sku: p.sku, qty, unitPrice, totalPrice, baseCost };
            });

            const totalBaseCost = productItems.reduce((s, p) => s + p.baseCost, 0);

            // Taxas do fornecedor: derivar do produto que tem taxa configurada (o RPC usa MIN() no nível do pedido, que pega 0)
            // Buscar o produto com maior taxa percentual e o maior gateway fixo
            const supFeeProduct = products.reduce((best, p) => {
              const v = Number(p.supplier_fee_value ?? 0);
              return v > Number(best?.supplier_fee_value ?? 0) ? p : best;
            }, products[0]);
            const gwFeeProduct = products.reduce((best, p) => {
              const v = Number(p.supplier_gateway_fee_value ?? 0);
              return v > Number(best?.supplier_gateway_fee_value ?? 0) ? p : best;
            }, products[0]);

            const supFeeVal = Number(supFeeProduct?.supplier_fee_value ?? 0);
            const supFeeType = supFeeProduct?.supplier_fee_type ?? 'percent';
            const gwFeeVal = Number(gwFeeProduct?.supplier_gateway_fee_value ?? 0);
            const gwFeeType = gwFeeProduct?.supplier_gateway_fee_type ?? 'fixed';

            // Taxa % aplicada sobre custo total; gateway fixo aplicado uma vez
            const orderSupplierFee = supFeeVal > 0
              ? supFeeType === 'percent' ? (totalBaseCost * supFeeVal) / 100 : supFeeVal
              : 0;
            const orderGatewayFee = gwFeeVal > 0
              ? gwFeeType === 'fixed' ? gwFeeVal : (totalBaseCost * gwFeeVal) / 100
              : 0;

            const totalProductCost = totalBaseCost + orderSupplierFee + orderGatewayFee;
            const isFreeSample = selectedOrder.is_free_sample === true;
            
            const fixedFee = Number(resolvedMarketplaceConfig?.fixed_fee ?? selectedOrder.marketplace_fixed_fee ?? 0);
            const commissionRate = Number(resolvedMarketplaceConfig?.commission_rate ?? selectedOrder.commission_rate ?? 0);
            const affiliateRate = Number(resolvedMarketplaceConfig?.affiliate_commission_rate ?? 0);
            
            // Para amostras grátis: sem custo de marketplace
            const commissionPercent = isFreeSample ? 0 : (commissionRate > 0
              ? (selectedOrder.total_amount * commissionRate) / 100
              : Math.max(0, selectedOrder.marketplace_commission - fixedFee));
            const affiliateCommission = isFreeSample
              ? 0
              : (cameFromAffiliate && affiliateRate > 0
                ? (selectedOrder.total_amount * affiliateRate) / 100
                : 0);
            const sfpEnabled = !isFreeSample && selectedOrder.tiktok_sfp_enabled === true;
            const sfpFee = sfpEnabled ? selectedOrder.total_amount * 0.06 : 0;
            const subtotalMarketplace = isFreeSample ? 0 : (commissionPercent + affiliateCommission + fixedFee + sfpFee + selectedOrder.shipping_cost + selectedOrder.other_expenses);
            const realProfit = isFreeSample ? -totalProductCost : (selectedOrder.total_amount - totalProductCost - subtotalMarketplace);
            const margin = selectedOrder.total_amount > 0
              ? ((realProfit / selectedOrder.total_amount) * 100).toFixed(1) : '0.0';
            const profitPositive = realProfit >= 0;

            // Imagem: usar product_image_url ou fallback para imagem do primeiro produto
            // Garantir que a URL da imagem seja válida
            let heroImage = selectedOrder.product_image_url
              || (products[0] as { image_url?: string })?.image_url
              || null;
            
            // Validar se a URL da imagem é válida (não vazia, não 'null', não 'undefined')
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
                  </div>

                  {/* Preço de venda — accordion por item se múltiplos */}
                  <div className="rounded-xl overflow-hidden bg-zinc-900/30">
                    <div className="flex items-center justify-between bg-zinc-900 px-4 py-3">
                      <div className="flex items-center gap-2 text-zinc-400 text-sm">
                        <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Preço de venda {hasMultipleProducts && <span className="text-zinc-600 text-xs ml-1">({products.length} itens)</span>}
                      </div>
                      <span className="text-emerald-400 font-bold text-lg tabular-nums">
                        {formatCurrency(selectedOrder.total_amount)}
                      </span>
                    </div>
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
                            <div key={i} className="flex items-center justify-between px-4 py-2.5">
                              <div className="flex-1 min-w-0 text-left mr-3">
                                <p className="text-[11px] text-zinc-300 truncate">{p.name}</p>
                                {p.sku && <p className="text-[10px] text-zinc-600 font-mono">{p.sku}</p>}
                              </div>
                              <span className="text-red-400 text-[12px] font-semibold tabular-nums shrink-0">-{formatCurrency(p.baseCost)}</span>
                            </div>
                          ))}
                        </div>
                        {/* Taxas do fornecedor — aplicadas sobre o custo total */}
                        {(orderSupplierFee > 0 || orderGatewayFee > 0) && (
                          <div className="border-t border-red-950/30 bg-red-950/15 px-4 py-3 space-y-2">
                            <p className="text-[10px] font-semibold text-red-500/70 uppercase tracking-widest mb-1">Taxas do Fornecedor</p>
                            {orderSupplierFee > 0 && (
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-1.5">
                                  <span className="w-1 h-1 rounded-full bg-red-500/60 shrink-0" />
                                  <span className="text-xs text-zinc-400">
                                    Taxa fornecedor
                                    {supFeeType === 'percent'
                                      ? <span className="ml-1 text-[10px] text-zinc-600 font-mono">({supFeeVal}% × R${totalBaseCost.toFixed(2)})</span>
                                      : <span className="ml-1 text-[10px] text-zinc-600 font-mono">(fixo)</span>}
                                  </span>
                                </div>
                                <span className="text-red-400 text-xs font-semibold tabular-nums">-{formatCurrency(orderSupplierFee)}</span>
                              </div>
                            )}
                            {orderGatewayFee > 0 && (
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-1.5">
                                  <span className="w-1 h-1 rounded-full bg-red-500/60 shrink-0" />
                                  <span className="text-xs text-zinc-400">
                                    Gateway fornecedor
                                    {gwFeeType === 'percent'
                                      ? <span className="ml-1 text-[10px] text-zinc-600 font-mono">({gwFeeVal}%)</span>
                                      : <span className="ml-1 text-[10px] text-zinc-600 font-mono">(fixo)</span>}
                                  </span>
                                </div>
                                <span className="text-red-400 text-xs font-semibold tabular-nums">-{formatCurrency(orderGatewayFee)}</span>
                              </div>
                            )}
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
                        <span className="text-orange-400 font-semibold text-xs uppercase tracking-wide">Custo Marketplace — {resolvedMarketplaceName}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-orange-400 font-semibold text-sm tabular-nums">-{formatCurrency(subtotalMarketplace)}</span>
                        <svg className={`w-4 h-4 text-zinc-500 transition-transform duration-200 ${openMarketplace ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </button>
                    {openMarketplace && (
                      <div className="px-4 py-3 space-y-2 bg-zinc-900/40 border-t border-orange-950/20">
                        {commissionPercent > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-zinc-400">Comissão{commissionRate > 0 ? ` (${commissionRate}%)` : ''}</span>
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
                              <span className="text-[10px] text-zinc-600 font-mono">(6% × R${selectedOrder.total_amount.toFixed(2)})</span>
                            </div>
                            <span className="text-orange-400 font-medium tabular-nums">-{formatCurrency(sfpFee)}</span>
                          </div>
                        )}
                        {selectedOrder.shipping_cost > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-zinc-400">Frete</span>
                            <span className="text-orange-400 font-medium tabular-nums">-{formatCurrency(selectedOrder.shipping_cost)}</span>
                          </div>
                        )}
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
                    <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${profitPositive ? 'bg-emerald-500' : 'bg-red-500'}`}
                        style={{ width: `${Math.min(Math.abs(Number(margin)), 100)}%`, transition: 'width 0.6s ease' }}
                      />
                    </div>
                  </div>

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
              <p className="text-xs text-gray-500 dark:text-gray-400">Custo</p>
              <p className="text-xl font-bold text-red-600">{formatCurrency(totalCost)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Lucro</p>
              <p className={`text-xl font-bold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(totalProfit)}</p>
            </div>
          </div>
        </div>
        <Select value={period} onValueChange={(value) => setPeriod(value as PeriodFilter)}>
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

      {data.length > 0 ? (
        <div ref={chartRef} className="relative">
          <Chart key={`${JSON.stringify(data.map(d => d.period_label + '_' + d.total_revenue))}`} options={chartOptions} series={chartSeries} type="area" height={300} />
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
