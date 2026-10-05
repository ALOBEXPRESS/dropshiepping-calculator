import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Loader2, Search, Link2, ChevronRight, Check, Package,
  Sparkles, DollarSign, Building2, AlertTriangle, ChevronDown, ChevronUp,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { PendingOrder } from '@/types/pendingOrder';

interface ProductBling {
  id: string;
  bling_id: number;
  name: string;
  sku: string | null;
  image_url1: string | null;
  cost_price: number | null;
  sale_price: number | null;
  stock_quantity: number | null;
}

interface Variation {
  id: string;
  bling_id: number;
  name: string;
  variacao_nome: string | null;
  sku: string | null;
  image_url1: string | null;
  cost_price: number | null;
  sale_price: number | null;
  stock_quantity: number | null;
}

interface SupplierItem {
  id: string;
  name: string;
}

interface LinkProductModalProps {
  open: boolean;
  order: PendingOrder;
  organizationId: string;
  onClose: () => void;
  onLinked: () => void;
}

const DEFAULT_SUPPLIERS: SupplierItem[] = [
  { id: 'dogama', name: 'Dogama' },
  { id: 'tyr', name: 'Tyr' },
  { id: 'alobexpress', name: 'Alob Express' },
  { id: 'yeizidrop', name: 'YeiziDrop' },
  { id: 'dsers', name: 'DSers' },
];

export const LinkProductModal: React.FC<LinkProductModalProps> = ({
  open,
  order,
  organizationId,
  onClose,
  onLinked,
}) => {
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<ProductBling[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ProductBling | null>(null);
  const [variations, setVariations] = useState<Variation[]>([]);
  const [loadingVariations, setLoadingVariations] = useState(false);
  const [selectedVariation, setSelectedVariation] = useState<Variation | null>(null);
  const [linking, setLinking] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Suppliers & Product Config (Dogama por padrão)
  const [suppliersList, setSuppliersList] = useState<SupplierItem[]>(DEFAULT_SUPPLIERS);
  const [costPrice, setCostPrice] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(() => {
    const initial = Number(order.items_count ?? 1);
    return initial >= 1 && initial <= 6 ? initial : 1;
  });
  const [supplierId, setSupplierId] = useState<string>('dogama');
  const [supplierName, setSupplierName] = useState<string>('Dogama');
  const [supplierFeeType, setSupplierFeeType] = useState<'percent' | 'fixed'>('percent');
  const [supplierFeeValue, setSupplierFeeValue] = useState<string>('6');
  const [supplierGatewayFeeType, setSupplierGatewayFeeType] = useState<'percent' | 'fixed'>('fixed');
  const [supplierGatewayFeeValue, setSupplierGatewayFeeValue] = useState<string>('2');
  const [showAdvancedFees, setShowAdvancedFees] = useState(false);
  const [loadingDefaults, setLoadingDefaults] = useState(false);

  // Load suppliers on open & set default Dogama
  useEffect(() => {
    if (!open) return;
    const fetchSuppliers = async () => {
      try {
        const { data } = await supabase
          .from('suppliers')
          .select('id, name')
          .order('name');
        if (data && data.length > 0) {
          const merged = [...data];
          // Ensure Dogama and Tyr exist
          DEFAULT_SUPPLIERS.forEach((def) => {
            if (!merged.some((m) => m.name.toLowerCase() === def.name.toLowerCase())) {
              merged.push(def);
            }
          });
          setSuppliersList(merged);
          // Set real Dogama id if found in DB
          const dogamaFromDb = merged.find((s) => s.name.toLowerCase() === 'dogama');
          if (dogamaFromDb && (!supplierId || supplierId === 'dogama')) {
            setSupplierId(dogamaFromDb.id);
          }
        }
      } catch (err) {
        console.warn('Erro ao buscar fornecedores:', err);
      }
    };
    fetchSuppliers();
  }, [open]);

  // Load current order item quantity if already recorded
  useEffect(() => {
    if (!open) return;
    let isMounted = true;
    const loadOrderQty = async () => {
      try {
        const { data: blingOrder } = await supabase
          .from('bling_orders')
          .select('id, items_count')
          .eq('order_number', order.order_number)
          .eq('organization_id', organizationId)
          .maybeSingle();

        if (blingOrder) {
          const { data: items } = await supabase
            .from('bling_order_items')
            .select('quantity')
            .eq('order_id', blingOrder.id)
            .limit(1);

          const q = Number(items?.[0]?.quantity);
          if (isMounted && q >= 1 && q <= 6) {
            setQuantity(q);
            return;
          }
        }
      } catch { /* ignore */ }
      const fallback = Number(order.items_count ?? 1);
      if (isMounted) {
        setQuantity(fallback >= 1 && fallback <= 6 ? fallback : 1);
      }
    };
    loadOrderQty();
    return () => { isMounted = false; };
  }, [open, order.order_number, order.items_count, organizationId]);

  const handleSearch = useCallback(async (q: string) => {
    setQuery(q);
    setSelectedProduct(null);
    setVariations([]);
    setSelectedVariation(null);
    if (q.trim().length < 2) { setResults([]); return; }

    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(async () => {
      setSearching(true);
      try {
        const { data } = await supabase
          .from('products_bling')
          .select('id, bling_id, name, sku, image_url1, cost_price, sale_price, stock_quantity')
          .eq('organization_id', organizationId)
          .or(`name.ilike.%${q}%,sku.ilike.%${q}%`)
          .order('name')
          .limit(20);
        setResults((data as ProductBling[]) || []);
      } finally {
        setSearching(false);
      }
    }, 350);
  }, [organizationId]);

  const handleSelectProduct = useCallback(async (product: ProductBling) => {
    setSelectedProduct(product);
    setSelectedVariation(null);
    setLoadingVariations(true);
    try {
      const { data } = await supabase
        .from('products_variations_bling')
        .select('id, bling_id, name, variacao_nome, sku, image_url1, cost_price, sale_price, stock_quantity')
        .eq('product_bling_id', product.bling_id)
        .order('variacao_nome');
      setVariations((data as Variation[]) || []);
    } finally {
      setLoadingVariations(false);
    }
  }, []);

  // When selectedProduct or selectedVariation changes, look up existing data in `products` table
  useEffect(() => {
    if (!selectedProduct) return;
    if (variations.length > 0 && !selectedVariation) return;

    const targetSku = selectedVariation?.sku ?? selectedProduct.sku ?? '';
    let isMounted = true;

    const loadExistingInfo = async () => {
      setLoadingDefaults(true);
      try {
        let existingCost: number | null = null;
        let existingSupplierId: string = '';
        let existingSupplierName: string = '';
        let existingFeeType: 'percent' | 'fixed' = 'percent';
        let existingFeeValue: string = '';
        let existingGtwType: 'percent' | 'fixed' = 'fixed';
        let existingGtwValue: string = '';

        if (targetSku) {
          const { data: prod } = await supabase
            .from('products')
            .select('id, cost_price, supplier_id, supplier_name, supplier_fee_type, supplier_fee_value, supplier_gateway_fee_type, supplier_gateway_fee_value')
            .eq('organization_id', organizationId)
            .eq('sku', targetSku)
            .maybeSingle();

          if (prod) {
            if (prod.cost_price != null && Number(prod.cost_price) > 0) {
              existingCost = Number(prod.cost_price);
            }
            if (prod.supplier_id) existingSupplierId = prod.supplier_id;
            if (prod.supplier_name) existingSupplierName = prod.supplier_name;
            if (prod.supplier_fee_type) existingFeeType = prod.supplier_fee_type as 'percent' | 'fixed';
            if (prod.supplier_fee_value != null) existingFeeValue = String(prod.supplier_fee_value);
            if (prod.supplier_gateway_fee_type) existingGtwType = prod.supplier_gateway_fee_type as 'percent' | 'fixed';
            if (prod.supplier_gateway_fee_value != null) existingGtwValue = String(prod.supplier_gateway_fee_value);
          }
        }

        // Fallback cost from variation or bling product
        if (existingCost == null) {
          const fallback = Number(selectedVariation?.cost_price ?? selectedProduct.cost_price ?? 0);
          if (fallback > 0) existingCost = fallback;
        }

        if (isMounted) {
          setCostPrice(existingCost != null && existingCost > 0 ? String(existingCost) : '');
          if (existingSupplierId || existingSupplierName) {
            setSupplierId(existingSupplierId);
            setSupplierName(existingSupplierName);
            setSupplierFeeType(existingFeeType);
            setSupplierFeeValue(existingFeeValue);
            setSupplierGatewayFeeType(existingGtwType);
            setSupplierGatewayFeeValue(existingGtwValue);
          } else {
            // Padrão sempre Dogama se não houver fornecedor cadastrado
            const dogamaSup = suppliersList.find((s) => s.name.toLowerCase() === 'dogama') ?? { id: 'dogama', name: 'Dogama' };
            setSupplierId(dogamaSup.id);
            setSupplierName('Dogama');
            setSupplierFeeType('percent');
            setSupplierFeeValue('6');
            setSupplierGatewayFeeType('fixed');
            setSupplierGatewayFeeValue('2');
          }
        }
      } catch (err) {
        console.warn('Erro ao carregar detalhes existentes do produto:', err);
      } finally {
        if (isMounted) setLoadingDefaults(false);
      }
    };

    loadExistingInfo();
    return () => { isMounted = false; };
  }, [selectedProduct, selectedVariation, variations.length, organizationId, suppliersList]);

  const handleSupplierSelect = (idOrValue: string) => {
    const found = suppliersList.find((s) => s.id === idOrValue);
    const name = found ? found.name : idOrValue;
    setSupplierId(found ? found.id : idOrValue);
    setSupplierName(name);

    const normalized = name.trim().toLowerCase();
    if (normalized === 'dogama') {
      setSupplierFeeType('percent');
      setSupplierFeeValue('6');
      setSupplierGatewayFeeType('fixed');
      setSupplierGatewayFeeValue('2');
    } else if (normalized === 'tyr' || normalized === 'tyr (yeizidrop)') {
      setSupplierFeeType('percent');
      setSupplierFeeValue('0');
      setSupplierGatewayFeeType('fixed');
      setSupplierGatewayFeeValue('0');
    }
  };

  const isDogama = supplierName.trim().toLowerCase() === 'dogama';

  // Live calculation of product and order cost breakdown
  const unitCostNum = parseFloat(String(costPrice).replace(',', '.')) || 0;
  const totalBaseCost = unitCostNum * quantity;
  const supFeePercent = supplierFeeType === 'percent'
    ? Number(supplierFeeValue || (isDogama ? 6 : 0))
    : 0;
  const suppFeeTotal = supplierFeeType === 'percent'
    ? (totalBaseCost * supFeePercent) / 100
    : (Number(supplierFeeValue || 0) * quantity);

  // Gateway fee: FIXED is PER ORDER TRANSACTION (not multiplied by quantity), PERCENT is on totalBaseCost
  const gtwFeeVal = Number(supplierGatewayFeeValue || (isDogama ? 2 : 0));
  const gatewayFeeTotal = supplierGatewayFeeType === 'fixed'
    ? gtwFeeVal
    : (totalBaseCost * gtwFeeVal) / 100;

  const totalCalculatedCost = totalBaseCost + suppFeeTotal + gatewayFeeTotal;

  const handleLink = useCallback(async () => {
    if (!selectedProduct) return;
    if (variations.length > 0 && !selectedVariation) {
      toast.error('Selecione uma variação do produto');
      return;
    }

    setLinking(true);
    try {
      // 1. Find bling_order id
      const { data: blingOrder } = await supabase
        .from('bling_orders')
        .select('id')
        .eq('order_number', order.order_number)
        .eq('organization_id', organizationId)
        .single();

      if (!blingOrder) throw new Error('Pedido Bling não encontrado');

      const productName = selectedVariation
        ? `${selectedProduct.name} — ${selectedVariation.variacao_nome ?? selectedVariation.name}`
        : selectedProduct.name;
      const unitValue = Number(order.total_amount ?? 0);

      // 2. Check if item already exists (came from webhook with wrong product)
      const { data: existingItems } = await supabase
        .from('bling_order_items')
        .select('id')
        .eq('order_id', blingOrder.id)
        .limit(1);

      const existingItemId = existingItems?.[0]?.id ?? null;

      if (existingItemId) {
        // Update existing item — clear wrong product_id, set correct bling refs and quantity
        const { error: updateErr } = await supabase
          .from('bling_order_items')
          .update({
            product_bling_id: selectedProduct.id,
            product_variation_id: selectedVariation?.id ?? null,
            product_id: null, // clear wrong match; will be set below after product creation
            code: selectedVariation?.sku ?? selectedProduct.sku ?? '',
            description: productName,
            quantity: quantity,
            unit_value: unitValue / Math.max(1, quantity),
            total_value: unitValue,
          })
          .eq('id', existingItemId);
        if (updateErr) throw updateErr;
      } else {
        // Insert new item with quantity
        const { error: insertErr } = await supabase
          .from('bling_order_items')
          .insert({
            order_id: blingOrder.id,
            bling_item_id: Date.now(),
            product_bling_id: selectedProduct.id,
            product_variation_id: selectedVariation?.id ?? null,
            code: selectedVariation?.sku ?? selectedProduct.sku ?? '',
            description: productName,
            unit: 'UN',
            quantity: quantity,
            unit_value: unitValue / Math.max(1, quantity),
            total_value: unitValue,
            discount: 0,
            ipi_rate: 0,
            commission_base: 0,
            commission_rate: 0,
            commission_value: 0,
          });
        if (insertErr) throw insertErr;
      }

      // 3. Update items_count on bling_orders table
      await supabase
        .from('bling_orders')
        .update({ items_count: quantity })
        .eq('id', blingOrder.id);

      // 4. Upsert in 'products' with user-specified cost and supplier
      const productSku = selectedVariation?.sku ?? selectedProduct.sku ?? '';
      const productImage = selectedVariation?.image_url1 ?? selectedProduct.image_url1 ?? null;
      const productPrice = Number(selectedVariation?.sale_price ?? selectedProduct.sale_price ?? 0);

      const normSup = supplierName.trim().toLowerCase();
      const finalSupFeeVal = supplierFeeValue
        ? Number(supplierFeeValue)
        : (normSup === 'dogama' ? 6 : null);
      const finalSupGtwVal = supplierGatewayFeeValue
        ? Number(supplierGatewayFeeValue)
        : (normSup === 'dogama' ? 2 : null);

      const finalGtwFixed = supplierGatewayFeeType === 'fixed' ? (finalSupGtwVal ?? 0) : 0;
      const finalGtwPercent = supplierGatewayFeeType === 'percent' ? (finalSupGtwVal ?? 0) : 0;

      const { data: existingProducts } = await supabase
        .from('products')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('sku', productSku)
        .limit(1);

      let productId: string | null = existingProducts?.[0]?.id ?? null;

      const productPayload = {
        name: productName,
        sku: productSku,
        price: productPrice > 0 ? productPrice : unitValue,
        cost_price: unitCostNum,
        supplier_id: supplierId || null,
        supplier_name: supplierName || null,
        supplier_fee_type: supplierFeeType,
        supplier_fee_value: finalSupFeeVal,
        supplier_gateway_fee_type: supplierGatewayFeeType,
        supplier_gateway_fee_value: finalSupGtwVal,
        supplier_gateway_fee_fixed: finalGtwFixed,
        supplier_gateway_fee_percent: finalGtwPercent,
        image_url: productImage,
        marketplace: order.marketplace_name ?? 'TikTok',
        marketplace_id: order.marketplace_id ?? 'f01bc7f2-3c6e-4044-b09a-b600476a308a',
        sales_channel_id: '18cc394e-edd5-4a88-b412-f7170acfe9ad',
      };

      if (!productId) {
        const { data: newProduct, error: productError } = await supabase
          .from('products')
          .insert({
            organization_id: organizationId,
            ...productPayload,
            stock_quantity: 0,
          })
          .select('id')
          .single();
        if (productError) throw productError;
        productId = newProduct?.id ?? null;
      } else {
        const { error: updateProdErr } = await supabase
          .from('products')
          .update({
            ...productPayload,
            updated_at: new Date().toISOString(),
          })
          .eq('id', productId);
        if (updateProdErr) throw updateProdErr;
      }

      // Sync cost_price back to products_bling & variation if provided
      if (unitCostNum > 0) {
        if (selectedProduct.id) {
          await supabase
            .from('products_bling')
            .update({ cost_price: unitCostNum })
            .eq('id', selectedProduct.id);
        }
        if (selectedVariation?.id) {
          await supabase
            .from('products_variations_bling')
            .update({ cost_price: unitCostNum })
            .eq('id', selectedVariation.id);
        }
      }

      // 5. Update bling_order_item.product_id to correct product
      if (productId) {
        await supabase
          .from('bling_order_items')
          .update({ product_id: productId })
          .eq('order_id', blingOrder.id);
      }

      // 6. Rematch order items to populate order_items with correct unit_cost
      if (organizationId) {
        await supabase.rpc('rematch_bling_order_items_products', {
          p_organization_id: organizationId,
        });
      }

      toast.success(`Produto "${productName}" (${quantity}x) vinculado! Custo R$ ${totalCalculatedCost.toFixed(2)} registrado.`);
      onLinked();
      onClose();
    } catch (err) {
      const msg = err instanceof Error
        ? err.message
        : (typeof err === 'object' && err !== null && 'message' in err)
          ? String((err as { message: unknown }).message)
          : JSON.stringify(err);
      toast.error(`Erro ao vincular: ${msg}`);
    } finally {
      setLinking(false);
    }
  }, [
    selectedProduct,
    selectedVariation,
    variations,
    order,
    organizationId,
    costPrice,
    quantity,
    supplierId,
    supplierName,
    supplierFeeType,
    supplierFeeValue,
    supplierGatewayFeeType,
    supplierGatewayFeeValue,
    totalCalculatedCost,
    unitCostNum,
    onLinked,
    onClose,
  ]);

  const handleClose = () => {
    setQuery('');
    setResults([]);
    setSelectedProduct(null);
    setVariations([]);
    setSelectedVariation(null);
    setCostPrice('');
    setQuantity(1);
    setSupplierId('dogama');
    setSupplierName('Dogama');
    setSupplierFeeType('percent');
    setSupplierFeeValue('6');
    setSupplierGatewayFeeType('fixed');
    setSupplierGatewayFeeValue('2');
    setShowAdvancedFees(false);
    onClose();
  };

  const isConfigReady = selectedProduct && (variations.length === 0 || selectedVariation !== null);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-lg max-h-[88vh] overflow-y-auto dark:bg-zinc-900">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Link2 className="w-4 h-4 text-blue-500" />
            Linkar Produto — Pedido #{order.order_number}
          </DialogTitle>
          <DialogDescription className="text-xs text-gray-500">
            Busque por nome ou SKU em products_bling e configure o produto para vincular ao pedido.
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Buscar por nome ou SKU..."
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9 text-sm"
            autoFocus
          />
          {searching && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
          )}
        </div>

        {/* Results list */}
        {!selectedProduct && results.length > 0 && (
          <div className="space-y-1 mt-1">
            {results.map((p) => (
              <button
                key={p.id}
                onClick={() => handleSelectProduct(p)}
                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors text-left"
              >
                {p.image_url1 ? (
                  <img src={p.image_url1} alt={p.name} className="w-10 h-10 object-contain rounded-md bg-gray-100 dark:bg-zinc-700 flex-shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-md bg-gray-100 dark:bg-zinc-700 flex items-center justify-center flex-shrink-0">
                    <Package className="w-5 h-5 text-gray-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{p.name}</p>
                  {p.sku && <p className="text-xs text-gray-400 truncate">SKU: {p.sku}</p>}
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
              </button>
            ))}
          </div>
        )}

        {!selectedProduct && query.length >= 2 && !searching && results.length === 0 && (
          <p className="text-sm text-center text-gray-400 py-4">Nenhum produto encontrado</p>
        )}

        {/* Selected product + variations */}
        {selectedProduct && (
          <div className="space-y-3 mt-1">
            {/* Product card */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
              {selectedProduct.image_url1 ? (
                <img src={selectedProduct.image_url1} alt={selectedProduct.name} className="w-14 h-14 object-contain rounded-lg bg-white dark:bg-zinc-800 flex-shrink-0" />
              ) : (
                <div className="w-14 h-14 rounded-lg bg-white dark:bg-zinc-800 flex items-center justify-center flex-shrink-0">
                  <Package className="w-7 h-7 text-gray-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">{selectedProduct.name}</p>
                {selectedProduct.sku && <p className="text-xs text-gray-400">SKU: {selectedProduct.sku}</p>}
                <div className="flex gap-2 mt-1">
                  {selectedProduct.cost_price != null && (
                    <Badge variant="secondary" className="text-[10px] py-0">Custo Bling: R${selectedProduct.cost_price}</Badge>
                  )}
                  {selectedProduct.sale_price != null && (
                    <Badge variant="secondary" className="text-[10px] py-0">Preço: R${selectedProduct.sale_price}</Badge>
                  )}
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedProduct(null);
                  setVariations([]);
                  setSelectedVariation(null);
                  setCostPrice('');
                }}
                className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 underline flex-shrink-0"
              >
                Trocar
              </button>
            </div>

            {/* Variations */}
            {loadingVariations && (
              <div className="flex items-center justify-center py-4 gap-2 text-gray-400 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                Carregando variações...
              </div>
            )}

            {!loadingVariations && variations.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Selecione a variação ({variations.length}) *
                </p>
                <div className="space-y-1 max-h-44 overflow-y-auto">
                  {variations.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariation(v.id === selectedVariation?.id ? null : v)}
                      className={`w-full flex items-center gap-3 p-2 rounded-lg border transition-colors text-left ${
                        selectedVariation?.id === v.id
                          ? 'border-blue-400 bg-blue-50 dark:bg-blue-950/40'
                          : 'border-transparent hover:bg-gray-50 dark:hover:bg-zinc-800'
                      }`}
                    >
                      {v.image_url1 ? (
                        <img src={v.image_url1} alt={v.variacao_nome ?? v.name} className="w-8 h-8 object-contain rounded bg-gray-100 dark:bg-zinc-700 flex-shrink-0" />
                      ) : (
                        <div className="w-8 h-8 rounded bg-gray-100 dark:bg-zinc-700 flex items-center justify-center flex-shrink-0">
                          <Package className="w-4 h-4 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 dark:text-white truncate">{v.variacao_nome ?? v.name}</p>
                        {v.sku && <p className="text-xs text-gray-400 truncate">SKU: {v.sku}</p>}
                      </div>
                      {selectedVariation?.id === v.id && (
                        <Check className="w-4 h-4 text-blue-500 flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!loadingVariations && variations.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-1">Produto sem variações — será vinculado diretamente.</p>
            )}

            {/* Smart Product Configuration (Cost, Quantity & Supplier) */}
            {isConfigReady && (
              <div className="p-3.5 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-gradient-to-br from-indigo-50/60 via-white to-sky-50/40 dark:from-zinc-900 dark:via-zinc-900 dark:to-indigo-950/30 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-500" />
                    <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                      Custo & Fornecedor Inteligente
                    </h4>
                  </div>
                  {loadingDefaults ? (
                    <span className="text-[10px] text-gray-400 flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" /> Carregando...
                    </span>
                  ) : (
                    <Badge variant="outline" className="text-[10px] bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border-indigo-300 dark:border-indigo-800">
                      Auto-salva no produto
                    </Badge>
                  )}
                </div>

                {/* Linha 1: Preço de Custo e Fornecedor */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Preço de Custo */}
                  <div className="space-y-1.5">
                    <Label htmlFor="link-cost-price" className="text-xs font-semibold flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                      <DollarSign className="w-3.5 h-3.5 text-green-500" />
                      Preço de Custo Unitário (R$)
                    </Label>
                    <Input
                      id="link-cost-price"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Ex: 12.00"
                      value={costPrice}
                      onChange={(e) => setCostPrice(e.target.value)}
                      className={`h-9 text-sm ${(!costPrice || Number(costPrice) <= 0) ? 'border-amber-400 focus-visible:ring-amber-400' : ''}`}
                    />
                    {(!costPrice || Number(costPrice) <= 0) && (
                      <p className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 shrink-0" />
                        Custo zerado. Defina para calcular o lucro!
                      </p>
                    )}
                  </div>

                  {/* Fornecedor (Dogama por padrão) */}
                  <div className="space-y-1.5">
                    <Label htmlFor="link-supplier" className="text-xs font-semibold flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                      <Building2 className="w-3.5 h-3.5 text-blue-500" />
                      Fornecedor
                    </Label>
                    <Select
                      value={supplierId || (supplierName ? `custom:${supplierName}` : 'dogama')}
                      onValueChange={handleSupplierSelect}
                    >
                      <SelectTrigger id="link-supplier" className="h-9 text-sm font-medium">
                        <SelectValue placeholder="Dogama" />
                      </SelectTrigger>
                      <SelectContent>
                        {suppliersList.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Linha 2: Quantidade de Peças / Unidades (1 a 6) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                      <Package className="w-3.5 h-3.5 text-indigo-500" />
                      Quantidade de Peças / Unidades do Pedido
                    </Label>
                    <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                      {quantity} {quantity === 1 ? 'unidade' : 'unidades'}
                    </span>
                  </div>
                  <div className="grid grid-cols-6 gap-1.5">
                    {[1, 2, 3, 4, 5, 6].map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => setQuantity(q)}
                        className={`h-9 rounded-lg text-xs font-bold transition-all border ${
                          quantity === q
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm scale-[1.02]'
                            : 'bg-white/80 dark:bg-zinc-800/80 hover:bg-gray-100 dark:hover:bg-zinc-700 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-zinc-700'
                        }`}
                      >
                        {q}x
                      </button>
                    ))}
                  </div>
                </div>

                {/* Detalhes de cálculo em tempo real */}
                {unitCostNum > 0 && (
                  <div className="p-3 rounded-lg bg-zinc-50/90 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/60 text-xs space-y-1.5">
                    <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-400 text-[11px]">
                      <span>Custo base ({quantity}x R$ {unitCostNum.toFixed(2)}):</span>
                      <span className="font-medium text-zinc-900 dark:text-white">R$ {totalBaseCost.toFixed(2)}</span>
                    </div>
                    {suppFeeTotal > 0 && (
                      <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-400 text-[11px]">
                        <span>Taxa do fornecedor ({supplierFeeType === 'percent' ? `${supFeePercent}%` : `R$ ${supplierFeeValue}`}):</span>
                        <span className="font-medium text-zinc-900 dark:text-white">+ R$ {suppFeeTotal.toFixed(2)}</span>
                      </div>
                    )}
                    {gatewayFeeTotal > 0 && (
                      <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-400 text-[11px]">
                        <span>Taxa Gateway ({supplierGatewayFeeType === 'fixed' ? 'transação única R$ 2,00' : `${gtwFeeVal}%`}):</span>
                        <span className="font-medium text-zinc-900 dark:text-white">+ R$ {gatewayFeeTotal.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-1.5 border-t border-zinc-200 dark:border-zinc-700 font-bold text-xs">
                      <span className="text-zinc-900 dark:text-white">Custo Total da Mercadoria:</span>
                      <span className="text-emerald-600 dark:text-emerald-400 text-sm">R$ {totalCalculatedCost.toFixed(2)}</span>
                    </div>
                  </div>
                )}

                {/* Feedback do Dogama */}
                {isDogama && (
                  <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Dogama Selecionado</p>
                      <p className="text-[11px] opacity-90">
                        Taxa de <strong>6%</strong> aplicada sobre o custo dos itens e Gateway de <strong>R$ 2,00 (fixo)</strong> por transação (não multiplicado pela quantidade).
                      </p>
                    </div>
                  </div>
                )}

                {/* Detalhes avançados de taxas (opcional) */}
                <div className="pt-0.5">
                  <button
                    type="button"
                    onClick={() => setShowAdvancedFees(!showAdvancedFees)}
                    className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-medium"
                  >
                    {showAdvancedFees ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    {showAdvancedFees ? 'Ocultar taxas detalhadas' : 'Ajustar taxas do fornecedor'}
                  </button>

                  {showAdvancedFees && (
                    <div className="grid grid-cols-2 gap-3 mt-2 pt-2 border-t border-indigo-100 dark:border-zinc-800">
                      <div className="space-y-1">
                        <Label className="text-[11px] text-gray-600 dark:text-gray-400">
                          Taxa Fornecedor ({supplierFeeType === 'percent' ? '%' : 'R$'})
                        </Label>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => setSupplierFeeType(supplierFeeType === 'percent' ? 'fixed' : 'percent')}
                            className="px-2 py-1 text-xs border rounded bg-muted hover:bg-muted/80"
                          >
                            {supplierFeeType === 'percent' ? '%' : 'R$'}
                          </button>
                          <Input
                            type="number"
                            step="0.01"
                            value={supplierFeeValue}
                            onChange={(e) => setSupplierFeeValue(e.target.value)}
                            placeholder="6"
                            className="h-8 text-xs"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[11px] text-gray-600 dark:text-gray-400">
                          Taxa Gateway ({supplierGatewayFeeType === 'percent' ? '%' : 'R$'})
                        </Label>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => setSupplierGatewayFeeType(supplierGatewayFeeType === 'fixed' ? 'percent' : 'fixed')}
                            className="px-2 py-1 text-xs border rounded bg-muted hover:bg-muted/80"
                          >
                            {supplierGatewayFeeType === 'percent' ? '%' : 'R$'}
                          </button>
                          <Input
                            type="number"
                            step="0.01"
                            value={supplierGatewayFeeValue}
                            onChange={(e) => setSupplierGatewayFeeValue(e.target.value)}
                            placeholder="2.00"
                            className="h-8 text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex gap-2 pt-2 border-t border-gray-100 dark:border-zinc-800">
          <Button variant="outline" size="sm" onClick={handleClose} className="flex-1">
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={handleLink}
            disabled={!selectedProduct || (variations.length > 0 && !selectedVariation) || linking}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium"
          >
            {linking ? (
              <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Vinculando...</>
            ) : (
              <><Link2 className="w-3.5 h-3.5 mr-1.5" />Vincular Produto</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
