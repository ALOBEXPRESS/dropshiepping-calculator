import React, { useEffect, useState } from 'react';
import { X, Package, Tag, DollarSign, Warehouse, Ruler, Truck } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface ProductInfo {
  id: string;
  name: string;
  sku: string | null;
  description: string | null;
  price: number | null;
  cost_price: number | null;
  image_url: string | null;
  marketplace: string | null;
  supplier_name: string | null;
  stock_quantity: number | null;
  supplier_fee_value: number | null;
  supplier_fee_type: string | null;
  tiktok_sfp_enabled: boolean | null;
  peso: number | null;
  largura: number | null;
  altura: number | null;
  profundidade: number | null;
  net_revenue: number | null;
}

interface ProductInfoModalProps {
  productId: string | null;
  onClose: () => void;
}

const fmt = (v: number | null | undefined) =>
  v != null
    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
    : '—';

export const ProductInfoModal: React.FC<ProductInfoModalProps> = ({ productId, onClose }) => {
  const [product, setProduct] = useState<ProductInfo | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!productId) return;
    setLoading(true);
    supabase
      .from('products')
      .select(
        'id,name,sku,description,price,cost_price,image_url,marketplace,supplier_name,stock_quantity,supplier_fee_value,supplier_fee_type,tiktok_sfp_enabled,peso,largura,altura,profundidade,net_revenue'
      )
      .eq('id', productId)
      .single()
      .then(({ data }) => {
        setProduct(data as ProductInfo | null);
        setLoading(false);
      });
  }, [productId]);

  if (!productId) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-500" />
            <span className="font-semibold text-gray-900 dark:text-white text-sm">Informações do Produto</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && !product && (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400 dark:text-gray-600">
            <Package className="w-10 h-10 mb-2" />
            <p className="text-sm">Produto não encontrado</p>
          </div>
        )}

        {!loading && product && (
          <div className="overflow-y-auto max-h-[70vh]">
            {/* Image */}
            {product.image_url && (
              <div className="w-full h-48 bg-gray-50 dark:bg-zinc-800 flex items-center justify-center">
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="h-full w-full object-contain p-3"
                />
              </div>
            )}

            <div className="p-5 space-y-4">
              {/* Name + SKU */}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-base leading-tight">
                  {product.name}
                </h3>
                {product.sku && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    SKU: {product.sku}
                  </p>
                )}
              </div>

              {/* Description */}
              {product.description && (
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  {product.description}
                </p>
              )}

              {/* Prices */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 dark:bg-zinc-800 rounded-xl p-3">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Preço de Venda</p>
                  <p className="font-bold text-green-600 text-sm">{fmt(product.price)}</p>
                </div>
                <div className="bg-gray-50 dark:bg-zinc-800 rounded-xl p-3">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Custo</p>
                  <p className="font-bold text-red-500 text-sm">{fmt(product.cost_price)}</p>
                </div>
                {product.net_revenue != null && (
                  <div className="bg-gray-50 dark:bg-zinc-800 rounded-xl p-3">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Receita Líquida</p>
                    <p className="font-bold text-blue-500 text-sm">{fmt(product.net_revenue)}</p>
                  </div>
                )}
                {product.stock_quantity != null && (
                  <div className="bg-gray-50 dark:bg-zinc-800 rounded-xl p-3">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Estoque</p>
                    <p className="font-bold text-gray-700 dark:text-gray-300 text-sm flex items-center gap-1">
                      <Warehouse className="w-3 h-3" />
                      {product.stock_quantity} un
                    </p>
                  </div>
                )}
              </div>

              {/* Supplier + Marketplace */}
              <div className="space-y-1.5">
                {product.marketplace && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Marketplace</span>
                    <span className="font-medium text-gray-700 dark:text-gray-300">{product.marketplace}</span>
                  </div>
                )}
                {product.supplier_name && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Fornecedor</span>
                    <span className="font-medium text-gray-700 dark:text-gray-300">{product.supplier_name}</span>
                  </div>
                )}
                {product.supplier_fee_value != null && product.supplier_fee_value > 0 && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Taxa Fornecedor</span>
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {product.supplier_fee_type === 'percent'
                        ? `${product.supplier_fee_value}%`
                        : fmt(product.supplier_fee_value)}
                    </span>
                  </div>
                )}
                {product.tiktok_sfp_enabled && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">TikTok SFP</span>
                    <span className="font-medium text-green-500">Ativo</span>
                  </div>
                )}
              </div>

              {/* Dimensions */}
              {(product.peso || product.largura || product.altura || product.profundidade) && (
                <div className="border-t border-gray-100 dark:border-zinc-800 pt-3">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1">
                    <Ruler className="w-3 h-3" />
                    Dimensões
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: 'Peso', value: product.peso, unit: 'kg' },
                      { label: 'Larg', value: product.largura, unit: 'cm' },
                      { label: 'Alt', value: product.altura, unit: 'cm' },
                      { label: 'Prof', value: product.profundidade, unit: 'cm' },
                    ].map(({ label, value, unit }) =>
                      value != null ? (
                        <div key={label} className="bg-gray-50 dark:bg-zinc-800 rounded-lg p-2 text-center">
                          <p className="text-[9px] text-gray-400">{label}</p>
                          <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{value}{unit}</p>
                        </div>
                      ) : null
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
