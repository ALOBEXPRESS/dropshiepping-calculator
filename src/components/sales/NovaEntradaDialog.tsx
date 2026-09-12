import React, { useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { useAffiliates } from '@/hooks/useAffiliates';

// ── Types ─────────────────────────────────────────────────────────────────────
type EntryType =
  | 'beneficio_shopee'
  | 'balanco_shopee_acrescimo'
  | 'balanco_shopee_desconto'
  | 'beneficio_tiktok'
  | 'balanco_tiktok_acrescimo'
  | 'balanco_tiktok_desconto'
  | 'pedido_afiliacao';

interface Tab {
  id: EntryType | 'balanco_shopee' | 'balanco_tiktok';
  label: string;
  children?: Tab[];
}

const TABS: Tab[] = [
  { id: 'beneficio_shopee',  label: 'Benefício Shopee' },
  {
    id: 'balanco_shopee',
    label: 'Balanço Shopee',
    children: [
      { id: 'balanco_shopee_acrescimo', label: 'Acréscimo' },
      { id: 'balanco_shopee_desconto',  label: 'Desconto' },
    ],
  },
  { id: 'beneficio_tiktok',  label: 'Benefício TikTok' },
  {
    id: 'balanco_tiktok',
    label: 'Balanço TikTok',
    children: [
      { id: 'balanco_tiktok_acrescimo', label: 'Acréscimo' },
      { id: 'balanco_tiktok_desconto',  label: 'Desconto' },
    ],
  },
  { id: 'pedido_afiliacao',  label: 'Pedido de Afiliação' },
];

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  organizationId: string;
}

// ── Component ─────────────────────────────────────────────────────────────────
export const NovaEntradaDialog: React.FC<Props> = ({ open, onOpenChange, organizationId }) => {
  const { affiliates } = useAffiliates(organizationId);

  // active tab — default to first concrete type
  const [activeTab, setActiveTab] = useState<EntryType>('beneficio_shopee');
  // sub-tab for balanços
  const [shopeeBalSubTab, setShopeeBalSubTab] = useState<'balanco_shopee_acrescimo' | 'balanco_shopee_desconto'>('balanco_shopee_acrescimo');
  const [tiktokBalSubTab, setTiktokBalSubTab] = useState<'balanco_tiktok_acrescimo' | 'balanco_tiktok_desconto'>('balanco_tiktok_acrescimo');

  // form fields
  const [name,      setName]      = useState('');
  const [value,     setValue]     = useState('');
  const [affiliateId, setAffiliateId] = useState('');
  const [orderRef,  setOrderRef]  = useState('');
  const [saving,    setSaving]    = useState(false);

  // Resolve effective entry type (handles balanco sub-tabs)
  const effectiveType = (): EntryType => {
    if (activeTab === ('balanco_shopee' as EntryType)) return shopeeBalSubTab;
    if (activeTab === ('balanco_tiktok' as EntryType)) return tiktokBalSubTab;
    return activeTab;
  };

  const reset = () => {
    setName(''); setValue(''); setAffiliateId(''); setOrderRef('');
  };

  const handleClose = () => { reset(); onOpenChange(false); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numVal = parseFloat(value.replace(',', '.'));
    if (!name.trim()) { toast.error('Informe o nome.'); return; }
    if (isNaN(numVal) || numVal <= 0) { toast.error('Informe um valor válido.'); return; }
    if (effectiveType() === 'pedido_afiliacao' && !affiliateId && !name.trim()) {
      toast.error('Selecione o afiliado ou informe o nome.'); return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from('manual_entries').insert({
        organization_id: organizationId,
        entry_type: effectiveType(),
        name: name.trim(),
        value: numVal,
        affiliate_id: affiliateId || null,
        order_reference: orderRef.trim() || null,
      });
      if (error) throw error;
      toast.success('Entrada registrada com sucesso!');
      handleClose();
    } catch (err) {
      toast.error('Erro ao salvar entrada.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // ── Tab button helper ───────────────────────────────────────────────────────
  const parentOf = (type: EntryType): string => {
    if (type.startsWith('balanco_shopee')) return 'balanco_shopee';
    if (type.startsWith('balanco_tiktok')) return 'balanco_tiktok';
    return type;
  };

  const isParentActive = (tabId: string) => parentOf(activeTab) === tabId;

  const handleTabClick = (tab: Tab) => {
    if (tab.children) {
      // toggle into first child
      const first = tab.children[0];
      setActiveTab(first.id as EntryType);
      reset();
    } else {
      setActiveTab(tab.id as EntryType);
      reset();
    }
  };

  // ── Label helpers ───────────────────────────────────────────────────────────
  const nameLabel: Record<string, string> = {
    beneficio_shopee:          'Nome do Benefício',
    balanco_shopee_acrescimo:  'Nome do Balanço',
    balanco_shopee_desconto:   'Nome do Balanço',
    beneficio_tiktok:          'Nome do Benefício',
    balanco_tiktok_acrescimo:  'Nome do Balanço',
    balanco_tiktok_desconto:   'Nome do Balanço',
    pedido_afiliacao:          'Nome do Produto / Referência',
  };

  const valueLabel: Record<string, string> = {
    beneficio_shopee:          'Valor (R$)',
    balanco_shopee_acrescimo:  'Valor de Acréscimo (R$)',
    balanco_shopee_desconto:   'Valor de Desconto (R$)',
    beneficio_tiktok:          'Valor (R$)',
    balanco_tiktok_acrescimo:  'Valor de Acréscimo (R$)',
    balanco_tiktok_desconto:   'Valor de Desconto (R$)',
    pedido_afiliacao:          'Valor Recebido pelo Afiliado (R$)',
  };

  const et = effectiveType();

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[520px] bg-white dark:bg-zinc-900 dark:text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-orange-500" />
            Nova Entrada
          </DialogTitle>
        </DialogHeader>

        {/* ── Tabs ── */}
        <div className="flex flex-wrap gap-1 border-b border-zinc-200 dark:border-zinc-700 pb-2 mt-1">
          {TABS.map((tab) => {
            const active = isParentActive(tab.id);
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabClick(tab)}
                className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${
                  active
                    ? 'bg-orange-500 text-white'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ── Sub-tabs for Balanço ── */}
        {(et === 'balanco_shopee_acrescimo' || et === 'balanco_shopee_desconto') && (
          <div className="flex gap-1 mt-1">
            {(['balanco_shopee_acrescimo', 'balanco_shopee_desconto'] as const).map((sub) => (
              <button
                key={sub}
                type="button"
                onClick={() => { setShopeeBalSubTab(sub); setActiveTab(sub); reset(); }}
                className={`px-3 py-1 text-xs rounded font-medium transition-colors ${
                  et === sub
                    ? 'bg-zinc-700 text-white'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }`}
              >
                {sub === 'balanco_shopee_acrescimo' ? 'Acréscimo' : 'Desconto'}
              </button>
            ))}
          </div>
        )}
        {(et === 'balanco_tiktok_acrescimo' || et === 'balanco_tiktok_desconto') && (
          <div className="flex gap-1 mt-1">
            {(['balanco_tiktok_acrescimo', 'balanco_tiktok_desconto'] as const).map((sub) => (
              <button
                key={sub}
                type="button"
                onClick={() => { setTiktokBalSubTab(sub); setActiveTab(sub); reset(); }}
                className={`px-3 py-1 text-xs rounded font-medium transition-colors ${
                  et === sub
                    ? 'bg-zinc-700 text-white'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }`}
              >
                {sub === 'balanco_tiktok_acrescimo' ? 'Acréscimo' : 'Desconto'}
              </button>
            ))}
          </div>
        )}

        {/* ── Form ── */}
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">

          {/* Afiliado picker (pedido_afiliacao only) */}
          {et === 'pedido_afiliacao' && (
            <div className="space-y-1.5">
              <Label className="text-sm text-zinc-700 dark:text-zinc-300">Afiliado</Label>
              {affiliates.length > 0 ? (
                <Select value={affiliateId} onValueChange={setAffiliateId}>
                  <SelectTrigger className="bg-zinc-50 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white">
                    <SelectValue placeholder="Selecione um afiliado (opcional)" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700">
                    <SelectItem value="">— Nenhum —</SelectItem>
                    {affiliates.map((a) => (
                      <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-xs text-zinc-500">Nenhum afiliado cadastrado.</p>
              )}
            </div>
          )}

          {/* Nome */}
          <div className="space-y-1.5">
            <Label className="text-sm text-zinc-700 dark:text-zinc-300">
              {nameLabel[et]} <span className="text-red-500">*</span>
            </Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={et === 'pedido_afiliacao' ? 'Ex: Tênis Nike Air Max' : 'Ex: Bônus de vendedor'}
              className="bg-zinc-50 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white"
              required
            />
          </div>

          {/* Pedido / produto ref (pedido_afiliacao) */}
          {et === 'pedido_afiliacao' && (
            <div className="space-y-1.5">
              <Label className="text-sm text-zinc-700 dark:text-zinc-300">
                Marketplace / Nº do Pedido <span className="text-xs text-zinc-400">(opcional)</span>
              </Label>
              <Input
                value={orderRef}
                onChange={(e) => setOrderRef(e.target.value)}
                placeholder="Ex: Shopee #123456 ou TikTok Shop"
                className="bg-zinc-50 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white"
              />
            </div>
          )}

          {/* Valor */}
          <div className="space-y-1.5">
            <Label className="text-sm text-zinc-700 dark:text-zinc-300">
              {valueLabel[et]} <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm pointer-events-none">R$</span>
              <Input
                type="text"
                inputMode="decimal"
                value={value}
                onChange={(e) => setValue(e.target.value.replace(/[^0-9,.]/g, ''))}
                onBlur={() => {
                  const n = parseFloat(value.replace(',', '.'));
                  if (!isNaN(n)) setValue(n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
                }}
                placeholder="0,00"
                className="pl-9 bg-zinc-50 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white"
                required
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={handleClose} className="dark:border-zinc-700 dark:text-zinc-300">
              Cancelar
            </Button>
            <Button type="submit" disabled={saving} className="bg-orange-500 hover:bg-orange-600 text-white">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              Salvar Entrada
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
