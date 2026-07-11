import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import type { CampaignFormPayload } from '@/types/campaigns';

interface ProductRow {
  id: string;
  name: string;
  sku: string | null;
  price: string | null;
}

interface ProductLinkingStepProps {
  organizationId: string;
  selectedProducts: CampaignFormPayload['products'];
  onChange: (products: CampaignFormPayload['products']) => void;
}

export const ProductLinkingStep: React.FC<ProductLinkingStepProps> = ({
  organizationId,
  selectedProducts,
  onChange,
}) => {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('products')
        .select('id, name, sku, price')
        .eq('organization_id', organizationId)
        .eq('marketplace', 'tiktok')
        .order('name');
      setProducts((data as ProductRow[]) ?? []);
      setLoading(false);
    };
    if (organizationId) fetch();
  }, [organizationId]);

  const selectedMap = new Map(selectedProducts.map((p) => [p.product_id, p.marketing_cost_override]));

  const toggle = (productId: string, checked: boolean) => {
    if (checked) {
      onChange([...selectedProducts, { product_id: productId, marketing_cost_override: null }]);
    } else {
      onChange(selectedProducts.filter((p) => p.product_id !== productId));
    }
  };

  const setCost = (productId: string, value: string) => {
    const cost = value === '' ? null : parseFloat(value.replace(',', '.')) || null;
    onChange(
      selectedProducts.map((p) =>
        p.product_id === productId ? { ...p, marketing_cost_override: cost } : p
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
          Selecione os produtos TikTok desta campanha e defina o custo de marketing por pedido.
        </p>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-8 text-zinc-500 text-sm">
          Nenhum produto TikTok encontrado. Cadastre produtos com marketplace TikTok primeiro.
        </div>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {products.map((product) => {
            const isSelected = selectedMap.has(product.id);
            const costVal = selectedMap.get(product.id);

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
                  <label
                    htmlFor={`product-${product.id}`}
                    className="flex-1 cursor-pointer min-w-0"
                  >
                    <p className="text-sm font-medium text-zinc-200 truncate">{product.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {product.sku && (
                        <span className="text-[10px] font-mono text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded">
                          {product.sku}
                        </span>
                      )}
                      {product.price && (
                        <span className="text-[11px] text-zinc-400">
                          R$ {parseFloat(product.price).toFixed(2).replace('.', ',')}
                        </span>
                      )}
                    </div>
                  </label>
                </div>

                {isSelected && (
                  <div className="mt-3 flex items-center gap-2 pl-7">
                    <label className="text-xs text-zinc-400 whitespace-nowrap">
                      Custo de Marketing por Pedido (R$)
                    </label>
                    <Input
                      type="text"
                      inputMode="decimal"
                      placeholder="0,00"
                      value={costVal != null ? String(costVal).replace('.', ',') : ''}
                      onChange={(e) => setCost(product.id, e.target.value)}
                      className="w-24 h-7 text-xs bg-zinc-800 border-zinc-600 text-white placeholder:text-zinc-600 focus:border-orange-500"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {selectedProducts.length > 0 && (
        <p className="text-xs text-zinc-500">
          {selectedProducts.length} produto(s) selecionado(s)
        </p>
      )}
    </div>
  );
};
