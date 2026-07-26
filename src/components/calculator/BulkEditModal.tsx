import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import type { ProductItem } from '@/types/calculator';
import { parseCurrency } from '@/utils/currency';
import { Tag, Percent, DollarSign, ChevronDown, ChevronUp, Search } from 'lucide-react';

interface BulkEditModalProps {
  open: boolean;
  onClose: () => void;
  products: ProductItem[];
  onSave: (updates: BulkUpdate[]) => Promise<void>;
}

export interface BulkUpdate {
  productId: string;
  changes: Partial<Pick<ProductItem,
    | 'tiktokPromoProductValue'
    | 'tiktokPromoProductType'
    | 'sellingPrice'
    | 'costPrice'
  >>;
}

type BulkAction = 'promo_discount' | 'selling_price' | 'cost_price';

const ACTION_LABELS: Record<BulkAction, string> = {
  promo_discount: '🏷️ Desconto TikTok',
  selling_price: '💰 Preço de Venda',
  cost_price: '📦 Custo',
};

const MARKETPLACE_OPTIONS = [
  { value: 'all', label: 'Todos os marketplaces' },
  { value: 'tiktok', label: 'TikTok Shop' },
  { value: 'shopee', label: 'Shopee' },
  { value: 'mercadolivre', label: 'Mercado Livre' },
  { value: 'amazon', label: 'Amazon' },
  { value: 'shein', label: 'Shein' },
  { value: 'enjoei', label: 'Enjoei' },
  { value: 'wordpress', label: 'Site Próprio' },
];

export function BulkEditModal({ open, onClose, products, onSave }: BulkEditModalProps) {
  const [action, setAction] = useState<BulkAction>('promo_discount');
  const [marketplaceFilter, setMarketplaceFilter] = useState('all');
  const [search, setSearch] = useState('');

  // Action values
  const [discountValue, setDiscountValue] = useState('');
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent');
  const [priceValue, setPriceValue] = useState('');
  const [priceMode, setPriceMode] = useState<'set' | 'increase_pct' | 'decrease_pct' | 'increase_val' | 'decrease_val'>('set');
  const [costValue, setCostValue] = useState('');
  const [costMode, setCostMode] = useState<'set' | 'increase_pct' | 'decrease_pct' | 'increase_val' | 'decrease_val'>('set');

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);

  const filtered = useMemo(() => {
    const term = search.toLowerCase().trim();
    return products.filter((p) => {
      const mpMatch = marketplaceFilter === 'all' || p.marketplace === marketplaceFilter;
      const searchMatch = !term
        || (p.name ?? '').toLowerCase().includes(term)
        || (p.sku ?? '').toLowerCase().includes(term);
      return mpMatch && searchMatch;
    });
  }, [products, marketplaceFilter, search]);

  const allSelected = filtered.length > 0 && filtered.every((p) => selectedIds.has(p.id));
  const someSelected = filtered.some((p) => selectedIds.has(p.id));

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filtered.forEach((p) => next.delete(p.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filtered.forEach((p) => next.add(p.id));
        return next;
      });
    }
  };

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const applyPriceFormula = (
    base: number,
    value: number,
    mode: typeof priceMode
  ): number => {
    if (base <= 0) return value; // fallback for 'set'
    switch (mode) {
      case 'set': return value;
      case 'increase_pct': return base * (1 + value / 100);
      case 'decrease_pct': return base * (1 - value / 100);
      case 'increase_val': return base + value;
      case 'decrease_val': return base - value;
      default: return value;
    }
  };

  const handleSave = async () => {
    if (selectedIds.size === 0) return;
    setIsSaving(true);
    try {
      const updates: BulkUpdate[] = [];
      for (const p of products) {
        if (!selectedIds.has(p.id)) continue;
        if (action === 'promo_discount') {
          const v = discountValue.replace(',', '.');
          if (!v || Number(v) <= 0) continue;
          updates.push({
            productId: p.id,
            changes: {
              tiktokPromoProductValue: v,
              tiktokPromoProductType: discountType,
            },
          });
        } else if (action === 'selling_price') {
          const v = parseCurrency(priceValue);
          if (!priceValue || v < 0) continue;
          const base = parseCurrency(String(p.sellingPrice ?? 0));
          const newPrice = applyPriceFormula(base, v, priceMode);
          if (newPrice <= 0) continue;
          updates.push({ productId: p.id, changes: { sellingPrice: newPrice } });
        } else if (action === 'cost_price') {
          const v = parseCurrency(costValue);
          if (!costValue || v < 0) continue;
          const base = parseCurrency(String(p.costPrice ?? 0));
          const newCost = applyPriceFormula(base, v, costMode);
          if (newCost < 0) continue;
          updates.push({ productId: p.id, changes: { costPrice: newCost } });
        }
      }
      if (updates.length > 0) await onSave(updates);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const selectedCount = filtered.filter((p) => selectedIds.has(p.id)).length;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col gap-0 p-0 dark:bg-zinc-900">
        <DialogHeader className="px-6 pt-6 pb-3">
          <DialogTitle className="text-lg font-bold">Editar em massa</DialogTitle>
          <p className="text-xs text-muted-foreground">Selecione a ação, filtre e escolha os produtos</p>
        </DialogHeader>

        <Separator />

        <div className="flex flex-col gap-4 px-6 pt-4 pb-2">
          {/* Ação */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase text-muted-foreground">Ação</Label>
            <Tabs value={action} onValueChange={(v) => setAction(v as BulkAction)}>
              <TabsList className="h-9 w-full">
                {(Object.keys(ACTION_LABELS) as BulkAction[]).map((k) => (
                  <TabsTrigger key={k} value={k} className="flex-1 text-xs">
                    {ACTION_LABELS[k]}
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* Desconto TikTok */}
              <TabsContent value="promo_discount" className="mt-3">
                <div className="flex gap-2 items-end">
                  <div className="flex rounded-md overflow-hidden border border-input">
                    <button
                      type="button"
                      onClick={() => setDiscountType('percent')}
                      className={`px-3 py-2 text-sm font-medium transition-colors ${discountType === 'percent' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'}`}
                    >%</button>
                    <button
                      type="button"
                      onClick={() => setDiscountType('fixed')}
                      className={`px-3 py-2 text-sm font-medium transition-colors ${discountType === 'fixed' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'}`}
                    >R$</button>
                  </div>
                  <div className="flex-1 relative">
                    <Input
                      type="text"
                      inputMode="decimal"
                      placeholder={discountType === 'percent' ? 'Ex: 20' : 'Ex: 15,00'}
                      value={discountValue}
                      onChange={(e) => setDiscountValue(e.target.value.replace(/[^\d,\.]/g, ''))}
                      className="pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      {discountType === 'percent' ? '%' : 'R$'}
                    </span>
                  </div>
                </div>
                <p className="mt-1.5 text-[11px] text-muted-foreground">
                  Define <code>tiktokPromoProductValue</code> nos produtos selecionados.
                </p>
              </TabsContent>

              {/* Preço de Venda */}
              <TabsContent value="selling_price" className="mt-3">
                <div className="flex gap-2 items-end">
                  <Select value={priceMode} onValueChange={(v) => setPriceMode(v as typeof priceMode)}>
                    <SelectTrigger className="w-44">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="set">Definir valor</SelectItem>
                      <SelectItem value="increase_pct">Aumentar %</SelectItem>
                      <SelectItem value="decrease_pct">Diminuir %</SelectItem>
                      <SelectItem value="increase_val">Aumentar R$</SelectItem>
                      <SelectItem value="decrease_val">Diminuir R$</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex-1 relative">
                    <Input
                      type="text"
                      inputMode="decimal"
                      placeholder={priceMode.includes('pct') ? 'Ex: 10' : 'Ex: 99,90'}
                      value={priceValue}
                      onChange={(e) => setPriceValue(e.target.value.replace(/[^\d,\.]/g, ''))}
                      className="pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      {priceMode.includes('pct') ? '%' : 'R$'}
                    </span>
                  </div>
                </div>
              </TabsContent>

              {/* Custo */}
              <TabsContent value="cost_price" className="mt-3">
                <div className="flex gap-2 items-end">
                  <Select value={costMode} onValueChange={(v) => setCostMode(v as typeof costMode)}>
                    <SelectTrigger className="w-44">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="set">Definir valor</SelectItem>
                      <SelectItem value="increase_pct">Aumentar %</SelectItem>
                      <SelectItem value="decrease_pct">Diminuir %</SelectItem>
                      <SelectItem value="increase_val">Aumentar R$</SelectItem>
                      <SelectItem value="decrease_val">Diminuir R$</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex-1 relative">
                    <Input
                      type="text"
                      inputMode="decimal"
                      placeholder={costMode.includes('pct') ? 'Ex: 5' : 'Ex: 39,90'}
                      value={costValue}
                      onChange={(e) => setCostValue(e.target.value.replace(/[^\d,\.]/g, ''))}
                      className="pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      {costMode.includes('pct') ? '%' : 'R$'}
                    </span>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <Separator />

          {/* Filtros de produto */}
          <div className="flex gap-2">
            <Select value={marketplaceFilter} onValueChange={setMarketplaceFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Marketplace" />
              </SelectTrigger>
              <SelectContent>
                {MARKETPLACE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Buscar nome ou SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </div>

        {/* Lista de produtos */}
        <div className="flex items-center justify-between px-6 py-2">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={allSelected}
              ref={(el) => { if (el) (el as HTMLButtonElement).dataset.indeterminate = (!allSelected && someSelected).toString(); }}
              onCheckedChange={toggleAll}
              id="select-all"
              aria-label="Selecionar todos"
            />
            <Label htmlFor="select-all" className="text-xs cursor-pointer">
              Todos ({filtered.length})
            </Label>
          </div>
          {selectedCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {selectedCount} selecionado{selectedCount !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>

        <ScrollArea className="flex-1 min-h-0 max-h-60 border-t border-b">
          {filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Nenhum produto encontrado</p>
          ) : (
            <div className="divide-y">
              {filtered.map((p) => (
                <label
                  key={p.id}
                  className="flex items-center gap-3 px-6 py-2.5 cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  <Checkbox
                    checked={selectedIds.has(p.id)}
                    onCheckedChange={() => toggleOne(p.id)}
                    aria-label={`Selecionar ${p.name}`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.name || '—'}</p>
                    <p className="text-[11px] text-muted-foreground">
                      SKU: {p.sku || '—'} · {p.marketplace || '—'} · R$ {String(p.sellingPrice ?? '—')}
                    </p>
                  </div>
                  {p.tiktokPromoProductValue && parseCurrency(p.tiktokPromoProductValue) > 0 && (
                    <Badge variant="outline" className="text-[10px] border-orange-400 text-orange-500 shrink-0">
                      {p.tiktokPromoProductType === 'percent'
                        ? `${p.tiktokPromoProductValue}% off`
                        : `R$ ${p.tiktokPromoProductValue} off`}
                    </Badge>
                  )}
                </label>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="flex justify-end gap-3 px-6 py-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={selectedCount === 0 || isSaving}
            onClick={handleSave}
            className="bg-[#fe2c55] hover:bg-[#e5194a] text-white"
          >
            {isSaving ? 'Salvando...' : `Aplicar em ${selectedCount} produto${selectedCount !== 1 ? 's' : ''}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
