import React, { useEffect, useState, useMemo } from 'react';
import { Loader2, Search, ChevronDown } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import type { CampaignFormPayload } from '@/types/campaigns';

interface ProductRow {
  id: string;
  name: string;
  sku: string | null;
  price: string | null;
  image_url: string | null;
}

interface OrderRow {
  id: string;
  order_number: string | number;
  total_amount: string | null;
  order_date: string | null;
}

export interface ProductLinkEntry {
  product_id: string;
  marketing_cost_override: number | null;
  linked_order_id?: string | null;
}

interface ProductLinkingStepProps {
  organizationId: string;
  selectedProducts: CampaignFormPayload['products'];
  onChange: (products: CampaignFormPayload['products']) => void;
}

// Raw-string cost input to avoid cursor-jump on BRL formatting
const CostInput: React.FC<{
  value: number | null;
  onCommit: (v: number | null) => void;
}> = ({ value, onCommit }) => {
  const [raw, setRaw] = useState<string>(
    value != null
      ? new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(value)
      : ''
  );

  useEffect(() => {
    if (value == null) setRaw('');
  }, [value]);

  return (
    <div className="relative">
      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-zinc-500 text-xs pointer-events-none select-none">R$</span>
      <Input
        type="text"
        inputMode="decimal"
        placeholder="0,00"
        value={raw}
        onChange={(e) => setRaw(e.target.value.replace(/[^0-9,.]/g, ''))}
        onBlur={() => {
          const cleaned = raw.replace(/\./g, '').replace(',', '.');
          const num = parseFloat(cleaned);
          const val = isNaN(num) ? null : num;
          onCommit(val);
          if (val != null) {
            setRaw(new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(val));
          } else {
            setRaw('');
          }
        }}
        className="w-28 h-7 pl-7 text-xs bg-zinc-800 border-zinc-600 text-white placeholder:text-zinc-600 focus:border-orange-500"
      />
    </div>
  );
};

const OrderPicker: React.FC<{
  productId: string;
  organizationId: string;
  selectedOrderId: string | null | undefined;
  onSelect: (orderId: string | null) => void;
}> = ({ productId, organizationId, selectedOrderId, onSelect }) => {
  const [open, setOpen] = useState(false);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const fetchOrders = async () => {
      setLoading(true);
      // Fetch from processed orders table — query order_items first, then get orders
      const { data: itemsData } = await supabase
        .from('order_items')
        .select('order_id')
        .eq('product_id', productId);

      const orderIds = (itemsData ?? []).map((i: Record<string, unknown>) => i.order_id as string).filter(Boolean);

      let processed: OrderRow[] = [];
      if (orderIds.length > 0) {
        const { data: processedData } = await supabase
          .from('orders')
          .select('id, order_number, total_amount, order_date')
          .eq('organization_id', organizationId)
          .in('id', orderIds)
          .order('order_date', { ascending: false })
          .limit(20);
        processed = (processedData ?? []).map((o: Record<string, unknown>) => ({
          id: o.id as string,
          order_number: o.order_number as string | number,
          total_amount: o.total_amount as string | null,
          order_date: o.order_date as string | null,
        }));
      }

      // Also fetch pending bling_orders (not yet processed to orders)
      const { data: blingItemsData } = await supabase
        .from('bling_order_items')
        .select('order_id')
        .eq('product_id', productId);

      const blingOrderIds = (blingItemsData ?? []).map((i: Record<string, unknown>) => i.order_id as string).filter(Boolean);

      let pending: OrderRow[] = [];
      if (blingOrderIds.length > 0) {
        const { data: blingData } = await supabase
          .from('bling_orders')
          .select('id, order_number, total_amount, order_date')
          .eq('organization_id', organizationId)
          .eq('processed_to_orders', false)
          .in('id', blingOrderIds)
          .order('order_date', { ascending: false })
          .limit(20);
        pending = (blingData ?? []).map((o: Record<string, unknown>) => ({
          id: o.id as string,
          order_number: `#${o.order_number} (pendente)` as string,
          total_amount: o.total_amount as string | null,
          order_date: o.order_date as string | null,
        }));
      }

      setOrders([...processed, ...pending]);
      setLoading(false);
    };
    fetchOrders();
  }, [open, productId, organizationId]);

  const selectedOrder = orders.find((o) => o.id === selectedOrderId);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 transition-colors"
      >
        {selectedOrder
          ? `Pedido #${selectedOrder.order_number}`
          : 'Vincular venda (opcional)'}
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl min-w-[220px] max-h-48 overflow-y-auto">
          <button
            type="button"
            onClick={() => { onSelect(null); setOpen(false); }}
            className="w-full text-left px-3 py-2 text-xs text-zinc-400 hover:bg-zinc-800 border-b border-zinc-800"
          >
            Nenhuma venda vinculada
          </button>
          {loading && (
            <div className="flex items-center gap-2 px-3 py-2">
              <Loader2 className="w-3 h-3 animate-spin text-zinc-500" />
              <span className="text-xs text-zinc-500">Carregando...</span>
            </div>
          )}
          {!loading && orders.length === 0 && (
            <p className="px-3 py-2 text-xs text-zinc-500 italic">Nenhuma venda encontrada para este produto.</p>
          )}
          {orders.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => { onSelect(o.id); setOpen(false); }}
              className={`w-full text-left px-3 py-2 text-xs hover:bg-zinc-800 transition-colors ${
                selectedOrderId === o.id ? 'text-orange-300 bg-orange-500/10' : 'text-zinc-300'
              }`}
            >
              <span className="font-medium">#{o.order_number}</span>
              {o.order_date && (
                <span className="text-zinc-500 ml-2">{o.order_date}</span>
              )}
              {o.total_amount && (
                <span className="text-zinc-400 ml-2">
                  R$ {parseFloat(o.total_amount).toFixed(2).replace('.', ',')}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export const ProductLinkingStep: React.FC<ProductLinkingStepProps> = ({
  organizationId,
  selectedProducts,
  onChange,
}) => {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('products')
        .select('id, name, sku, price, image_url')
        .eq('organization_id', organizationId)
        .eq('marketplace', 'tiktok')
        .order('name');
      setProducts((data as ProductRow[]) ?? []);
      setLoading(false);
    };
    if (organizationId) fetch();
  }, [organizationId]);

  const selectedMap = useMemo(
    () => new Map(selectedProducts.map((p) => [p.product_id, p as ProductLinkEntry])),
    [selectedProducts]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const base = q
      ? products.filter(
          (p) => p.name.toLowerCase().includes(q) || (p.sku ?? '').toLowerCase().includes(q)
        )
      : products;

    // Mantém os produtos já vinculados à campanha no topo da lista,
    // para que o usuário os veja imediatamente ao abrir a etapa de edição.
    return [...base].sort((a, b) => {
      const aSelected = selectedMap.has(a.id);
      const bSelected = selectedMap.has(b.id);
      if (aSelected === bSelected) return 0;
      return aSelected ? -1 : 1;
    });
  }, [products, search, selectedMap]);

  const toggle = (productId: string, checked: boolean) => {
    if (checked) {
      onChange([...selectedProducts, { product_id: productId, marketing_cost_override: null }]);
    } else {
      onChange(selectedProducts.filter((p) => p.product_id !== productId));
    }
  };

  const setCost = (productId: string, val: number | null) => {
    onChange(
      selectedProducts.map((p) =>
        p.product_id === productId ? { ...p, marketing_cost_override: val } : p
      )
    );
  };

  const setLinkedOrder = (productId: string, orderId: string | null) => {
    onChange(
      selectedProducts.map((p) =>
        p.product_id === productId
          ? { ...p, linked_order_id: orderId ?? undefined }
          : p
      )
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-orange-400" />
        <span className="ml-2 text-zinc-400 text-sm">Carregando produtos...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-white mb-1">Vincular Produtos</h3>
        <p className="text-sm text-zinc-400">
          Selecione produtos TikTok, defina custo de marketing e vincule opcionalmente uma venda.
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
        <Input
          type="text"
          placeholder="Pesquisar por nome ou SKU..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-orange-500"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-8 text-zinc-500 text-sm">
          {products.length === 0
            ? 'Nenhum produto TikTok encontrado.'
            : 'Nenhum produto encontrado para essa busca.'}
        </div>
      ) : (
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {filtered.map((product) => {
            const entry = selectedMap.get(product.id);
            const isSelected = !!entry;
            const priceFormatted = product.price
              ? `R$ ${parseFloat(product.price).toFixed(2).replace('.', ',')}`
              : null;

            return (
              <div
                key={product.id}
                className={`rounded-lg border p-3 transition-colors ${
                  isSelected ? 'border-orange-500/50 bg-orange-500/5' : 'border-zinc-700 bg-zinc-900/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Checkbox
                    id={`product-${product.id}`}
                    checked={isSelected}
                    onCheckedChange={(v) => toggle(product.id, v === true)}
                  />
                  <div className="w-10 h-10 rounded-md overflow-hidden flex-shrink-0 bg-zinc-800 flex items-center justify-center">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    ) : (
                      <span className="text-zinc-600 text-[10px] font-bold">IMG</span>
                    )}
                  </div>
                  <label htmlFor={`product-${product.id}`} className="flex-1 cursor-pointer min-w-0">
                    <p className="text-sm font-medium text-zinc-200 truncate">{product.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {product.sku && (
                        <span className="text-[10px] font-mono text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded">
                          {product.sku}
                        </span>
                      )}
                      {priceFormatted && <span className="text-[11px] text-zinc-400">{priceFormatted}</span>}
                    </div>
                  </label>
                </div>

                {isSelected && (
                  <div className="mt-3 pl-[52px] space-y-2">
                    {/* Cost of marketing */}
                    <div className="flex items-center gap-3">
                      <label className="text-xs text-zinc-400 whitespace-nowrap">Custo de Marketing (R$)</label>
                      <CostInput
                        value={entry.marketing_cost_override ?? null}
                        onCommit={(v) => setCost(product.id, v)}
                      />
                    </div>
                    {/* Optional order link */}
                    <div className="flex items-center gap-3">
                      <label className="text-xs text-zinc-400 whitespace-nowrap">Venda vinculada</label>
                      <OrderPicker
                        productId={product.id}
                        organizationId={organizationId}
                        selectedOrderId={(entry as ProductLinkEntry).linked_order_id ?? null}
                        onSelect={(orderId) => setLinkedOrder(product.id, orderId)}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {selectedProducts.length > 0 && (
        <p className="text-xs text-zinc-500">{selectedProducts.length} produto(s) selecionado(s)</p>
      )}
    </div>
  );
};
