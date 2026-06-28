import React, { useState, useCallback, useRef } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, Link2, ChevronRight, Check, Package } from 'lucide-react';
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

interface LinkProductModalProps {
  open: boolean;
  order: PendingOrder;
  organizationId: string;
  onClose: () => void;
  onLinked: () => void;
}

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

  const handleLink = useCallback(async () => {
    if (!selectedProduct) return;
    // If product has variations, require a variation to be selected
    if (variations.length > 0 && !selectedVariation) {
      toast.error('Selecione uma variação do produto');
      return;
    }

    setLinking(true);
    try {
      // 1. Find the bling_order — get its id
      const { data: blingOrder } = await supabase
        .from('bling_orders')
        .select('id')
        .eq('order_number', order.order_number)
        .eq('organization_id', organizationId)
        .single();

      if (!blingOrder) throw new Error('Pedido Bling não encontrado');

      // 2. Insert bling_order_item linking this product
      const productName = selectedVariation
        ? `${selectedProduct.name} — ${selectedVariation.variacao_nome ?? selectedVariation.name}`
        : selectedProduct.name;
      const unitValue = Number(order.total_amount ?? 0);

      const { error: insertError } = await supabase
        .from('bling_order_items')
        .insert({
          order_id: blingOrder.id,
          bling_item_id: Date.now(), // synthetic unique ID (bigint NOT NULL)
          product_bling_id: selectedProduct.id,
          product_variation_id: selectedVariation?.id ?? null,
          code: selectedVariation?.sku ?? selectedProduct.sku ?? '',
          description: productName,
          unit: 'UN',
          quantity: 1,
          unit_value: unitValue,
          total_value: unitValue,
          discount: 0,
          ipi_rate: 0,
          commission_base: 0,
          commission_rate: 0,
          commission_value: 0,
        });

      if (insertError) throw insertError;

      // 3. Upsert in 'products' for TikTok marketplace using bling product data
      // This makes it appear in the marketplace product catalog
      const productSku = selectedVariation?.sku ?? selectedProduct.sku ?? '';
      const productImage = selectedVariation?.image_url1 ?? selectedProduct.image_url1 ?? null;
      const productPrice = Number(selectedVariation?.sale_price ?? selectedProduct.sale_price ?? 0);
      const productCostPrice = Number(selectedVariation?.cost_price ?? selectedProduct.cost_price ?? 0);

      // Check if product already exists in products table by SKU + organization
      const { data: existingProduct } = await supabase
        .from('products')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('sku', productSku)
        .limit(1);

      let productId: string | null = existingProduct?.[0]?.id ?? null;

      if (!productId) {
        // Create new product entry linked to TikTok marketplace
        const { data: newProduct, error: productError } = await supabase
          .from('products')
          .insert({
            organization_id: organizationId,
            name: productName,
            sku: productSku,
            price: productPrice > 0 ? productPrice : unitValue,
            cost_price: productCostPrice,
            image_url: productImage,
            marketplace: 'TikTok',
            marketplace_id: 'c736e8ae-b765-44b6-b23f-468639bd8c13', // TikTok marketplace id
            sales_channel_id: '18cc394e-edd5-4a88-b412-f7170acfe9ad', // TikTok Shop channel id
          })
          .select('id')
          .single();
        if (productError) throw productError;
        productId = newProduct?.id ?? null;
      }

      // 4. Update bling_order_item to link product_id (overwrite wrong rematch result)
      if (productId) {
        await supabase
          .from('bling_order_items')
          .update({ product_id: productId })
          .eq('order_id', blingOrder.id)
          .eq('product_bling_id', selectedProduct.id);
      }

      toast.success(`Produto "${productName}" vinculado ao Pedido #${order.order_number}`);
      onLinked();
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : (typeof err === 'object' && err !== null && 'message' in err) ? String((err as {message: unknown}).message) : JSON.stringify(err);
      toast.error(`Erro ao vincular: ${msg}`);
    } finally {
      setLinking(false);
    }
  }, [selectedProduct, selectedVariation, variations, order, organizationId, onLinked, onClose]);

  const handleClose = () => {
    setQuery('');
    setResults([]);
    setSelectedProduct(null);
    setVariations([]);
    setSelectedVariation(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto dark:bg-zinc-900">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Link2 className="w-4 h-4 text-blue-500" />
            Linkar Produto — Pedido #{order.order_number}
          </DialogTitle>
          <DialogDescription className="text-xs text-gray-500">
            Busque por nome ou SKU em products_bling e selecione o produto/variação.
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
                    <Badge variant="secondary" className="text-[10px] py-0">Custo: R${selectedProduct.cost_price}</Badge>
                  )}
                  {selectedProduct.sale_price != null && (
                    <Badge variant="secondary" className="text-[10px] py-0">Preço: R${selectedProduct.sale_price}</Badge>
                  )}
                </div>
              </div>
              <button onClick={() => { setSelectedProduct(null); setVariations([]); setSelectedVariation(null); }} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 underline flex-shrink-0">
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
                  Selecione a variação ({variations.length})
                </p>
                <div className="space-y-1 max-h-48 overflow-y-auto">
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
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
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
