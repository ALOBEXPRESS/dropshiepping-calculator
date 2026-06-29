import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Package, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { PendingOrder } from '@/types/pendingOrder';

interface Supplier {
  id: string;
  name: string;
}

interface RegisterProductBeforeProcessModalProps {
  open: boolean;
  order: PendingOrder;
  organizationId: string;
  onConfirm: () => void; // proceed to process after register
  onCancel: () => void;
}

const ACCOUNT_HOLDERS = ['Jonatan', 'Alyson', 'João', 'Emelyn', ''];
const ACCOUNT_TYPES = [
  { value: 'cpf', label: 'CPF' },
  { value: 'cnpj', label: 'CNPJ' },
];

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

export const RegisterProductBeforeProcessModal: React.FC<RegisterProductBeforeProcessModalProps> = ({
  open,
  order,
  organizationId,
  onConfirm,
  onCancel,
}) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  // Product info fetched from bling item
  const [productId, setProductId] = useState<string | null>(null);
  const [productName, setProductName] = useState('');
  const [productImage, setProductImage] = useState<string | null>(null);
  const [marketplace, setMarketplace] = useState('');

  // Editable fields
  const [price, setPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [accountType, setAccountType] = useState('cpf');

  useEffect(() => {
    if (!open) return;
    setLoading(true);

    const fetchData = async () => {
      try {
        // Load suppliers
        const { data: sup } = await supabase.from('suppliers').select('id, name').order('name');
        setSuppliers((sup as Supplier[]) || []);

        // Find bling_order and item for this order
        const { data: blingOrder } = await supabase
          .from('bling_orders')
          .select('id')
          .eq('order_number', order.order_number)
          .eq('organization_id', organizationId)
          .single();

        if (!blingOrder) return;

        const { data: items } = await supabase
          .from('bling_order_items')
          .select('product_id, product_bling_id, product_variation_id, description, code')
          .eq('order_id', blingOrder.id)
          .limit(1);

        const item = items?.[0];
        if (!item) return;

        // Get product from products table
        if (item.product_id) {
          const { data: prod } = await supabase
            .from('products')
            .select('id, name, price, cost_price, image_url, marketplace, supplier_id, account_holder, account_type')
            .eq('id', item.product_id)
            .single();
          if (prod) {
            setProductId(prod.id);
            setProductName(prod.name);
            setProductImage((prod as { image_url?: string | null }).image_url ?? null);
            setMarketplace((prod as { marketplace?: string }).marketplace ?? order.marketplace_name);
            setPrice(String(prod.price ?? ''));
            setCostPrice(String(prod.cost_price ?? '0'));
            setSupplierId((prod as { supplier_id?: string | null }).supplier_id ?? '');
            setAccountHolder((prod as { account_holder?: string | null }).account_holder ?? '');
            setAccountType((prod as { account_type?: string | null }).account_type ?? 'cpf');
            return;
          }
        }

        // Fallback: use bling product data
        if (item.product_bling_id) {
          const { data: pb } = await supabase
            .from('products_bling')
            .select('id, name, sale_price, cost_price, image_url1')
            .eq('id', item.product_bling_id)
            .single();
          if (pb) {
            setProductName(item.description ?? (pb as { name?: string }).name ?? '');
            setProductImage((pb as { image_url1?: string | null }).image_url1 ?? null);
            setMarketplace(order.marketplace_name);
            setPrice(String((pb as { sale_price?: number | null }).sale_price ?? order.total_amount ?? ''));
            setCostPrice(String((pb as { cost_price?: number | null }).cost_price ?? '0'));
          }
          // Try variation for cost_price
          if (item.product_variation_id) {
            const { data: pv } = await supabase
              .from('products_variations_bling')
              .select('cost_price, sale_price, image_url1')
              .eq('id', item.product_variation_id)
              .single();
            if (pv) {
              if ((pv as { cost_price?: number | null }).cost_price) setCostPrice(String((pv as { cost_price?: number | null }).cost_price));
              if ((pv as { sale_price?: number | null }).sale_price) setPrice(String((pv as { sale_price?: number | null }).sale_price));
              if ((pv as { image_url1?: string | null }).image_url1) setProductImage((pv as { image_url1?: string | null }).image_url1 ?? null);
            }
          }
        } else {
          // No bling link — use order data
          setProductName(item.description ?? order.first_product_name ?? '');
          setMarketplace(order.marketplace_name);
          setPrice(String(order.total_amount ?? ''));
          setCostPrice('0');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [open, order, organizationId]);

  const handleSaveAndProcess = async () => {
    setSaving(true);
    try {
      const priceNum = parseFloat(price.replace(',', '.')) || 0;
      const costNum = parseFloat(costPrice.replace(',', '.')) || 0;

      if (productId) {
        // Update existing product
        await supabase.from('products').update({
          price: priceNum,
          cost_price: costNum,
          supplier_id: supplierId || null,
          account_holder: accountHolder || null,
          account_type: accountType,
        }).eq('id', productId);
      }

      onConfirm();
    } catch (err) {
      console.error('Erro ao salvar produto:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto dark:bg-zinc-900">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            Cadastrar produto antes de processar
          </DialogTitle>
          <DialogDescription className="text-xs text-gray-500">
            Deseja cadastrar o produto <strong>{productName || order.first_product_name}</strong> no marketplace{' '}
            <strong>{marketplace || order.marketplace_name}</strong> com as informações abaixo?
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-10 gap-2 text-gray-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            Carregando informações...
          </div>
        ) : (
          <div className="space-y-4">
            {/* Product preview */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-zinc-800">
              {productImage ? (
                <img src={productImage} alt={productName} className="w-14 h-14 object-contain rounded-lg bg-white dark:bg-zinc-700 flex-shrink-0" />
              ) : (
                <div className="w-14 h-14 rounded-lg bg-gray-100 dark:bg-zinc-700 flex items-center justify-center flex-shrink-0">
                  <Package className="w-7 h-7 text-gray-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight line-clamp-2">
                  {productName || order.first_product_name || 'Produto sem nome'}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">Marketplace: {marketplace || order.marketplace_name}</p>
              </div>
            </div>

            {/* Editable fields */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Preço de Venda (R$)</Label>
                <Input
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0,00"
                  className="text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Preço de Custo (R$)</Label>
                <Input
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value)}
                  placeholder="0,00"
                  className="text-sm"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-gray-500">Fornecedor</Label>
              <Select value={supplierId} onValueChange={setSupplierId}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Selecione o fornecedor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sem fornecedor</SelectItem>
                  {suppliers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Titular</Label>
                <Select value={accountHolder} onValueChange={setAccountHolder}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {ACCOUNT_HOLDERS.map((h) => (
                      <SelectItem key={h} value={h}>{h || 'Sem titular'}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Tipo de Conta</Label>
                <Select value={accountType} onValueChange={setAccountType}>
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACCOUNT_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Summary */}
            {price && costPrice && (
              <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 p-3 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-500">Preço de venda</span>
                  <span className="font-medium">{fmt(parseFloat(price.replace(',', '.')) || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Custo</span>
                  <span className="font-medium text-red-500">{fmt(parseFloat(costPrice.replace(',', '.')) || 0)}</span>
                </div>
                <div className="flex justify-between border-t border-blue-200 dark:border-blue-800 pt-1 mt-1">
                  <span className="text-gray-500 font-medium">Lucro estimado</span>
                  <span className={`font-bold ${
                    (parseFloat(price.replace(',', '.')) || 0) - (parseFloat(costPrice.replace(',', '.')) || 0) >= 0
                      ? 'text-green-600' : 'text-red-500'
                  }`}>
                    {fmt((parseFloat(price.replace(',', '.')) || 0) - (parseFloat(costPrice.replace(',', '.')) || 0))}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2 pt-2 border-t border-gray-100 dark:border-zinc-800">
          <Button variant="outline" size="sm" onClick={onCancel} className="flex-1" disabled={saving}>
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={handleSaveAndProcess}
            disabled={loading || saving}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
          >
            {saving ? (
              <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Salvando...</>
            ) : (
              'Cadastrar e Processar'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
