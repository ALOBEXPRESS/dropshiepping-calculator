import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Link2,
  Check,
  Loader2,
  Package,
  Sparkles,
  X,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export interface LinkedProductResult {
  productId: string;
  productName: string;
  productSku: string;
  productImageUrl?: string | null;
  unitCost: number;
  totalCost: number;
  supplierFeeValue?: number | string | null;
  supplierFeeType?: string | null;
  supplierGatewayFeeValue?: number | string | null;
  supplierGatewayFeeType?: string | null;
}

interface OrderProductLinkerProps {
  orderId: string;
  orderNumber: string;
  blingOrderId?: string | null;
  totalAmount: number;
  marketplace?: string | null;
  organizationId: string;
  currentProductName?: string | null;
  onProductLinked: (result: LinkedProductResult) => void;
  onCancel?: () => void;
}

interface SearchItemResult {
  id: string; // id in products or id in products_bling/variation
  source: 'products' | 'bling' | 'bling_variation';
  name: string;
  sku: string;
  price: number;
  costPrice: number;
  imageUrl?: string | null;
  supplierName?: string | null;
  supplierFeeValue?: number | string | null;
  supplierFeeType?: string | null;
  supplierGatewayFeeValue?: number | string | null;
  supplierGatewayFeeType?: string | null;
  existingProductId?: string | null; // If found in products
}

interface SuggestedBlingItem {
  id: string;
  code: string;
  description: string;
  unitValue: number;
  quantity: number;
  productId?: string | null;
  productBlingId?: string | null;
  productVariationId?: string | null;
}

export const OrderProductLinker: React.FC<OrderProductLinkerProps> = ({
  orderId,
  orderNumber,
  blingOrderId,
  totalAmount,
  marketplace,
  organizationId,
  currentProductName,
  onProductLinked,
  onCancel,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<SearchItemResult[]>([]);
  const [linkingId, setLinkingId] = useState<string | null>(null);
  const [suggestedItem, setSuggestedItem] = useState<SuggestedBlingItem | null>(null);
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);

  const isTikTok = (marketplace || '').toLowerCase().includes('tiktok');
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Check if bling_order_items has item info for this order
  useEffect(() => {
    if (!blingOrderId) return;
    let isMounted = true;

    const fetchBlingSuggestion = async () => {
      setLoadingSuggestion(true);
      try {
        const { data, error } = await supabase
          .from('bling_order_items')
          .select('id, code, description, quantity, unit_value, total_value, product_id, product_bling_id, product_variation_id')
          .eq('order_id', blingOrderId)
          .limit(1);

        if (!error && data && data.length > 0 && isMounted) {
          const item = data[0];
          setSuggestedItem({
            id: item.id,
            code: item.code || '',
            description: item.description || '',
            unitValue: Number(item.unit_value ?? item.total_value ?? 0),
            quantity: Number(item.quantity ?? 1),
            productId: item.product_id,
            productBlingId: item.product_bling_id,
            productVariationId: item.product_variation_id,
          });
        }
      } catch (err) {
        console.warn('Erro ao buscar item sugerido do Bling:', err);
      } finally {
        if (isMounted) setLoadingSuggestion(false);
      }
    };

    fetchBlingSuggestion();
    return () => {
      isMounted = false;
    };
  }, [blingOrderId]);

  // Execute search across products, products_bling and products_variations_bling
  const executeSearch = useCallback(
    async (term: string) => {
      const clean = term.trim();
      if (clean.length < 2) {
        setResults([]);
        setSearching(false);
        return;
      }

      setSearching(true);
      try {
        const combinedResults: SearchItemResult[] = [];
        const seenSkus = new Set<string>();
        const seenIds = new Set<string>();

        // 1. Search in 'products' table
        const { data: prodsData, error: prodsErr } = await supabase
          .from('products')
          .select('id, name, sku, price, cost_price, image_url, supplier_name, supplier_fee_value, supplier_fee_type, supplier_gateway_fee_value, supplier_gateway_fee_type, marketplace')
          .or(`name.ilike.%${clean}%,sku.ilike.%${clean}%`)
          .limit(8);

        if (!prodsErr && prodsData) {
          for (const p of prodsData) {
            seenIds.add(p.id);
            if (p.sku) seenSkus.add(p.sku.toLowerCase().trim());
            combinedResults.push({
              id: p.id,
              source: 'products',
              name: p.name,
              sku: p.sku || '',
              price: Number(p.price ?? 0),
              costPrice: Number(p.cost_price ?? 0),
              imageUrl: p.image_url,
              supplierName: p.supplier_name,
              supplierFeeValue: p.supplier_fee_value,
              supplierFeeType: p.supplier_fee_type,
              supplierGatewayFeeValue: p.supplier_gateway_fee_value,
              supplierGatewayFeeType: p.supplier_gateway_fee_type,
              existingProductId: p.id,
            });
          }
        }

        // 2. Search in 'products_bling'
        const { data: blingData } = await supabase
          .from('products_bling')
          .select('id, bling_id, name, sku, image_url, image_url1, cost_price, sale_price')
          .or(`name.ilike.%${clean}%,sku.ilike.%${clean}%`)
          .limit(8);

        if (blingData) {
          for (const b of blingData) {
            const bSku = (b.sku || '').toLowerCase().trim();
            const alreadyInProducts = bSku && seenSkus.has(bSku);
            if (!alreadyInProducts) {
              if (bSku) seenSkus.add(bSku);
              combinedResults.push({
                id: b.id,
                source: 'bling',
                name: b.name,
                sku: b.sku || '',
                price: Number(b.sale_price ?? 0),
                costPrice: Number(b.cost_price ?? 0),
                imageUrl: b.image_url || b.image_url1 || null,
              });
            }
          }
        }

        // 3. Search in 'products_variations_bling'
        const { data: varData } = await supabase
          .from('products_variations_bling')
          .select('id, product_bling_id, name, variacao_nome, sku, image_url1, cost_price, sale_price')
          .or(`name.ilike.%${clean}%,sku.ilike.%${clean}%,variacao_nome.ilike.%${clean}%`)
          .limit(8);

        if (varData) {
          for (const v of varData) {
            const vSku = (v.sku || '').toLowerCase().trim();
            const alreadyInProducts = vSku && seenSkus.has(vSku);
            if (!alreadyInProducts) {
              if (vSku) seenSkus.add(vSku);
              combinedResults.push({
                id: v.id,
                source: 'bling_variation',
                name: v.name || v.variacao_nome || '',
                sku: v.sku || '',
                price: Number(v.sale_price ?? 0),
                costPrice: Number(v.cost_price ?? 0),
                imageUrl: v.image_url1 || null,
              });
            }
          }
        }

        setResults(combinedResults);
      } catch (err) {
        console.error('Erro na busca de produtos para vincular:', err);
      } finally {
        setSearching(false);
      }
    },
    []
  );

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      executeSearch(val);
    }, 300);
  };

  // Perform linking of a selected product to the order
  const handleLinkProduct = async (item: SearchItemResult) => {
    setLinkingId(item.id);
    try {
      let targetProductId = item.existingProductId || null;
      let finalCostPrice = item.costPrice;
      let finalName = item.name;
      let finalSku = item.sku;
      let finalImageUrl = item.imageUrl || null;
      let finalSupFeeVal = item.supplierFeeValue;
      let finalSupFeeType = item.supplierFeeType || 'percent';
      let finalSupGtwVal = item.supplierGatewayFeeValue;
      let finalSupGtwType = item.supplierGatewayFeeType || 'fixed';
      let finalSupName = item.supplierName || 'Dogama';

      // 1. If product is from Bling, check if it already exists in `products` by SKU
      if (!targetProductId && finalSku) {
        const { data: existingBySku } = await supabase
          .from('products')
          .select('id, name, sku, cost_price, price, image_url, supplier_name, supplier_fee_value, supplier_fee_type, supplier_gateway_fee_value, supplier_gateway_fee_type')
          .eq('sku', finalSku)
          .maybeSingle();

        if (existingBySku) {
          targetProductId = existingBySku.id;
          finalCostPrice = Number(existingBySku.cost_price ?? finalCostPrice);
          finalName = existingBySku.name || finalName;
          finalImageUrl = existingBySku.image_url || finalImageUrl;
          finalSupName = existingBySku.supplier_name || finalSupName;
          finalSupFeeVal = existingBySku.supplier_fee_value ?? finalSupFeeVal;
          finalSupFeeType = existingBySku.supplier_fee_type || finalSupFeeType;
          finalSupGtwVal = existingBySku.supplier_gateway_fee_value ?? finalSupGtwVal;
          finalSupGtwType = existingBySku.supplier_gateway_fee_type || finalSupGtwType;
        }
      }

      // 2. If still not in `products`, register it in `products` right now!
      if (!targetProductId) {
        const defaultFeeVal = isTikTok ? 3 : 6;
        const insertPayload = {
          organization_id: organizationId || undefined,
          name: finalName,
          sku: finalSku || null,
          price: item.price > 0 ? item.price : totalAmount,
          cost_price: finalCostPrice,
          image_url: finalImageUrl,
          marketplace: marketplace || (isTikTok ? 'TikTok' : 'Marketplace'),
          supplier_name: 'Dogama',
          supplier_fee_value: defaultFeeVal,
          supplier_fee_type: 'percent',
          supplier_gateway_fee_value: 2,
          supplier_gateway_fee_type: 'fixed',
          stock_quantity: 0,
        };

        const { data: createdProduct, error: createErr } = await supabase
          .from('products')
          .insert(insertPayload)
          .select('*')
          .single();

        if (createErr || !createdProduct) {
          throw new Error(`Falha ao cadastrar produto: ${createErr?.message || 'Erro desconhecido'}`);
        }

        targetProductId = createdProduct.id;
        finalSupName = createdProduct.supplier_name;
        finalSupFeeVal = createdProduct.supplier_fee_value;
        finalSupFeeType = createdProduct.supplier_fee_type;
        finalSupGtwVal = createdProduct.supplier_gateway_fee_value;
        finalSupGtwType = createdProduct.supplier_gateway_fee_type;
      }

      // 3. Upsert order_items for this order
      const { data: existingItems } = await supabase
        .from('order_items')
        .select('id, quantity')
        .eq('order_id', orderId);

      const qty = existingItems?.[0]?.quantity ? Number(existingItems[0].quantity) : 1;
      const totalItemCost = finalCostPrice * qty;

      if (existingItems && existingItems.length > 0) {
        const { error: updateItemErr } = await supabase
          .from('order_items')
          .update({
            product_id: targetProductId,
            product_name: finalName,
            product_image_url: finalImageUrl,
            unit_cost: finalCostPrice,
            total_cost: totalItemCost,
            profit: totalAmount - totalItemCost,
            profit_margin: totalAmount > 0 ? ((totalAmount - totalItemCost) / totalAmount) * 100 : 0,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingItems[0].id);

        if (updateItemErr) throw updateItemErr;
      } else {
        const { error: insertItemErr } = await supabase
          .from('order_items')
          .insert({
            order_id: orderId,
            product_id: targetProductId,
            product_name: finalName,
            product_image_url: finalImageUrl,
            quantity: qty,
            unit_price: totalAmount,
            total_price: totalAmount,
            unit_cost: finalCostPrice,
            total_cost: totalItemCost,
            profit: totalAmount - totalItemCost,
            profit_margin: totalAmount > 0 ? ((totalAmount - totalItemCost) / totalAmount) * 100 : 0,
          });

        if (insertItemErr) throw insertItemErr;
      }

      // 4. Update bling_order_items if blingOrderId is present
      if (blingOrderId) {
        await supabase
          .from('bling_order_items')
          .update({ product_id: targetProductId })
          .eq('order_id', blingOrderId);
      }

      // 5. Calculate auto-adjusted total costs for orders table
      const isDogama = isTikTok || (finalSupName || '').toLowerCase().includes('dogama');
      const feePercent = isDogama
        ? (Number(finalSupFeeVal) || (isTikTok ? 3 : 6))
        : 0;
      const gtwFeeFixed = isDogama
        ? (Number(finalSupGtwVal) || 2)
        : 0;
      const orderSupFee = (totalItemCost * feePercent) / 100;
      const calculatedTotalCost = totalItemCost + orderSupFee + gtwFeeFixed;

      await supabase
        .from('orders')
        .update({
          total_cost: calculatedTotalCost,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      if (!targetProductId) {
        throw new Error('Não foi possível identificar ou cadastrar o ID do produto.');
      }
      const linkedProductId: string = targetProductId;

      toast.success(`Produto "${finalName}" vinculado com sucesso! Custo total de R$ ${calculatedTotalCost.toFixed(2)} calculado.`);

      onProductLinked({
        productId: linkedProductId,
        productName: finalName,
        productSku: finalSku,
        productImageUrl: finalImageUrl,
        unitCost: finalCostPrice,
        totalCost: calculatedTotalCost,
        supplierFeeValue: finalSupFeeVal,
        supplierFeeType: finalSupFeeType,
        supplierGatewayFeeValue: finalSupGtwVal,
        supplierGatewayFeeType: finalSupGtwType,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Erro ao vincular produto: ${msg}`);
      console.error('Erro em handleLinkProduct:', err);
    } finally {
      setLinkingId(null);
    }
  };

  // Quick link suggestion directly
  const handleQuickLinkSuggested = () => {
    if (!suggestedItem) return;
    executeSearch(suggestedItem.code || suggestedItem.description);
    setSearchTerm(suggestedItem.code || suggestedItem.description);
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3.5 space-y-3 animate-in fade-in-50 duration-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link2 className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            Vincular Produto ao Pedido #{orderNumber}
          </span>
        </div>
        {onCancel && (
          <button
            onClick={onCancel}
            className="w-6 h-6 flex items-center justify-center rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Loading item original do Bling */}
      {loadingSuggestion && !suggestedItem && !searchTerm && (
        <div className="flex items-center gap-2 text-[11px] text-zinc-400 py-1">
          <Loader2 className="w-3 h-3 animate-spin text-cyan-400" />
          <span>Verificando itens no Bling...</span>
        </div>
      )}

      {/* Sugestão encontrada do Bling */}
      {suggestedItem && !searchTerm && (
        <div className="bg-cyan-950/40 border border-cyan-800/40 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              Item identificado neste pedido (Bling)
            </span>
            <Badge variant="outline" className="border-cyan-700/50 text-[10px] text-cyan-300">
              {suggestedItem.code || 'Sem SKU'}
            </Badge>
          </div>
          <p className="text-xs text-zinc-200 font-medium leading-relaxed">
            {suggestedItem.description}
          </p>
          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-zinc-400 font-mono">
              Valor: R$ {suggestedItem.unitValue.toFixed(2)} (Qtd: {suggestedItem.quantity}x)
            </span>
            <Button
              size="sm"
              onClick={handleQuickLinkSuggested}
              className="h-7 text-xs bg-cyan-600 hover:bg-cyan-500 text-white font-semibold flex items-center gap-1.5 px-3 rounded-md"
            >
              <Search className="w-3 h-3" />
              Buscar este item
            </Button>
          </div>
        </div>
      )}

      {/* Input de Busca */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <Input
          type="text"
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Buscar por nome ou SKU em Products ou Bling..."
          className="pl-9 pr-9 h-9 text-xs bg-zinc-950 border-zinc-700 text-white placeholder-zinc-500 focus-visible:ring-cyan-500"
          autoFocus
        />
        {searchTerm && (
          <button
            onClick={() => {
              setSearchTerm('');
              setResults([]);
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Status de Busca */}
      {searching && (
        <div className="flex items-center justify-center py-4 gap-2 text-xs text-zinc-400">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
          <span>Pesquisando em produtos e catálogo do Bling...</span>
        </div>
      )}

      {/* Lista de Resultados */}
      {!searching && searchTerm.trim().length >= 2 && results.length === 0 && (
        <div className="text-center py-5 text-xs text-zinc-500">
          Nenhum produto encontrado para &quot;{searchTerm}&quot;.
        </div>
      )}

      {!searching && results.length > 0 && (
        <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
          {results.map((r) => {
            const isLinking = linkingId === r.id;
            const isAlreadyLinked = currentProductName && currentProductName.trim().toLowerCase() === r.name.trim().toLowerCase();

            return (
              <div
                key={`${r.source}-${r.id}`}
                className="flex items-center justify-between p-2 rounded-lg bg-zinc-950/80 hover:bg-zinc-800/80 border border-zinc-800/60 transition-colors gap-3"
              >
                {/* Imagem */}
                <div className="w-10 h-10 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center overflow-hidden shrink-0">
                  {r.imageUrl ? (
                    <img src={r.imageUrl} alt={r.name} className="w-full h-full object-cover" />
                  ) : (
                    <Package className="w-4 h-4 text-zinc-600" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-xs text-zinc-200 font-medium truncate max-w-[240px]" title={r.name}>
                      {r.name}
                    </p>
                    {r.source === 'products' ? (
                      <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[9px] px-1 py-0">
                        Cadastrado
                      </Badge>
                    ) : (
                      <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[9px] px-1 py-0">
                        Do Bling
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-[10px] text-zinc-400">
                    {r.sku && <span className="font-mono text-zinc-500">SKU: {r.sku}</span>}
                    <span className="text-emerald-400 font-semibold font-mono">
                      Custo: {r.costPrice > 0 ? `R$ ${r.costPrice.toFixed(2)}` : 'R$ 0,00'}
                    </span>
                    {r.price > 0 && <span className="text-zinc-500">Venda: R$ {r.price.toFixed(2)}</span>}
                  </div>
                </div>

                {/* Botão Vincular */}
                <Button
                  size="sm"
                  disabled={Boolean(linkingId) || Boolean(isAlreadyLinked)}
                  onClick={() => handleLinkProduct(r)}
                  className={`h-7 px-3 text-xs font-semibold shrink-0 transition-all ${
                    isAlreadyLinked
                      ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 cursor-default'
                      : r.source === 'products'
                      ? 'bg-cyan-600 hover:bg-cyan-500 text-white'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                  }`}
                >
                  {isLinking ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : isAlreadyLinked ? (
                    <>
                      <Check className="w-3 h-3 mr-1" />
                      Vinculado
                    </>
                  ) : r.source === 'products' ? (
                    <>
                      <Link2 className="w-3 h-3 mr-1" />
                      Vincular
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3 mr-1" />
                      Cadastrar e Vincular
                    </>
                  )}
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
