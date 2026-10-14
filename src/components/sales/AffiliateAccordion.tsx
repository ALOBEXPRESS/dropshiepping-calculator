/**
 * Affiliate Accordion Component
 * 
 * Accordion para associar pedidos a influenciadores/afiliados
 * Permite selecionar afiliado existente ou criar novo
 * Exibe custo/comissão calculada e respeita retorno líquido do marketplace
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Plus, X, Instagram, AtSign, ChevronDown, Users, Info } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

const formatCurrency = (val: number | string | null | undefined): string => {
  const n = Number(val ?? 0);
  return isNaN(n) ? 'R$ 0,00' : n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

export interface InfluencerOption {
  id: string;
  name: string;
  instagram?: string | null;
  tiktok?: string | null;
  percentage?: number | null;
}

export interface AffiliateInfo {
  name: string;
  percentage: number;
  cost: number;
}

interface AffiliateAccordionProps {
  orderId: string;
  marketplaceId: string;
  organizationId: string;
  currentAffiliateId?: string | null;
  hasRetornoLiquido?: boolean;
  orderSaleAmount?: number;
  onAffiliateChange?: (affiliateId: string | null, affiliateInfo?: AffiliateInfo) => void;
}

interface NewInfluencerForm {
  name: string;
  instagram: string;
  tiktok: string;
  twitter: string;
  percentage: string;
}

const EMPTY_FORM: NewInfluencerForm = {
  name: '',
  instagram: '',
  tiktok: '',
  twitter: '',
  percentage: '10.5',
};

export const AffiliateAccordion: React.FC<AffiliateAccordionProps> = ({
  orderId,
  marketplaceId,
  organizationId,
  currentAffiliateId,
  hasRetornoLiquido = false,
  orderSaleAmount = 0,
  onAffiliateChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [influencers, setInfluencers] = useState<InfluencerOption[]>([]);
  const [selectedInfluencerId, setSelectedInfluencerId] = useState<string>(currentAffiliateId || '');
  const [showNewForm, setShowNewForm] = useState(false);
  const [form, setForm] = useState<NewInfluencerForm>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Sync when prop changes (different order opened)
  useEffect(() => {
    setSelectedInfluencerId(currentAffiliateId || '');
  }, [currentAffiliateId]);

  // Carregar influenciadores/afiliados quando abrir o accordion ou quando tiver afiliado já selecionado
  useEffect(() => {
    if ((isOpen || currentAffiliateId) && influencers.length === 0) {
      loadInfluencers();
    }
  }, [isOpen, currentAffiliateId]);

  const loadInfluencers = async () => {
    setLoading(true);
    try {
      // 1. Buscar da tabela affiliates
      let affQuery = supabase
        .from('affiliates')
        .select('id, name, instagram, tiktok, percentage, is_active')
        .eq('is_active', true);
      if (organizationId) {
        affQuery = affQuery.or(`organization_id.eq.${organizationId},organization_id.is.null`);
      }
      const { data: affData } = await affQuery;

      // 2. Buscar da tabela influencers
      let infQuery = supabase
        .from('influencers')
        .select('id, name, instagram, tiktok, percentage, is_active')
        .eq('is_active', true);
      if (organizationId) {
        infQuery = infQuery.or(`organization_id.eq.${organizationId},organization_id.is.null`);
      }
      const { data: infData } = await infQuery;

      // Consolidar e desduplicar por ID
      const map = new Map<string, InfluencerOption>();
      for (const item of [...(affData || []), ...(infData || [])]) {
        const id = item.id;
        const name = (item.name || '').trim();
        if (!name) continue;
        const pct = item.percentage != null ? Number(item.percentage) : 10.5;
        if (!map.has(id)) {
          map.set(id, {
            id,
            name,
            instagram: item.instagram,
            tiktok: item.tiktok,
            percentage: pct,
          });
        }
      }

      const list = Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
      setInfluencers(list);
    } catch (err) {
      console.error('Error loading influencers/affiliates:', err);
      toast.error('Erro ao carregar afiliados');
    } finally {
      setLoading(false);
    }
  };

  const selectedAffiliate = influencers.find(i => i.id === selectedInfluencerId);
  const affiliatePercentage = selectedAffiliate?.percentage != null ? Number(selectedAffiliate.percentage) : 10.5;
  const affiliateCost = selectedAffiliate && selectedInfluencerId !== '__none__'
    ? Math.round((Number(orderSaleAmount || 0) * (affiliatePercentage / 100)) * 100) / 100
    : 0;

  const handleAssociateAffiliate = async (affiliateId: string | null) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ affiliate_id: affiliateId })
        .eq('id', orderId);

      if (error) {
        throw error;
      }

      const chosen = influencers.find(i => i.id === affiliateId);
      const chosenPct = chosen?.percentage != null ? Number(chosen.percentage) : 10.5;
      const chosenCost = chosen && affiliateId
        ? Math.round((Number(orderSaleAmount || 0) * (chosenPct / 100)) * 100) / 100
        : 0;

      toast.success(affiliateId ? `Afiliado "${chosen?.name ?? ''}" associado!` : 'Afiliado removido do pedido');
      onAffiliateChange?.(affiliateId, chosen ? { name: chosen.name, percentage: chosenPct, cost: chosenCost } : undefined);
    } catch (err) {
      console.error('Error associating affiliate:', err);
      toast.error('Erro ao associar afiliado');
    }
  };

  const handleSaveNewInfluencer = async () => {
    if (!form.name.trim()) {
      setFormError('O nome é obrigatório.');
      return;
    }
    const pct = parseFloat(form.percentage.replace(',', '.'));
    if (isNaN(pct) || pct < 0 || pct > 100) {
      setFormError('A comissão deve ser um número entre 0 e 100.');
      return;
    }
    setFormError(null);
    setSaving(true);

    try {
      // 1. Inserir em influencers (satisfaz FK em orders.affiliate_id)
      const { data: newInf, error: infError } = await supabase
        .from('influencers')
        .insert({
          organization_id: organizationId || null,
          name: form.name.trim(),
          instagram: form.instagram.trim().replace(/^@/, '') || null,
          tiktok: form.tiktok.trim().replace(/^@/, '') || null,
          twitter: form.twitter.trim().replace(/^@/, '') || null,
          percentage: pct,
          is_active: true,
        })
        .select('id, name, instagram, tiktok, percentage')
        .single();

      if (infError) throw infError;

      // 2. Inserir em affiliates para manter espelhado
      try {
        await supabase.from('affiliates').insert({
          id: newInf.id,
          organization_id: organizationId || null,
          name: form.name.trim(),
          instagram: form.instagram.trim().replace(/^@/, '') || null,
          tiktok: form.tiktok.trim().replace(/^@/, '') || null,
          twitter: form.twitter.trim().replace(/^@/, '') || null,
          percentage: pct,
          is_active: true,
        });
      } catch {
        // Ignora duplicidade caso já inserido
      }

      // 3. Vincular marketplace se houver
      if (marketplaceId) {
        try {
          await supabase.from('influencer_marketplaces').insert({
            influencer_id: newInf.id,
            marketplace_id: marketplaceId,
          });
        } catch {
          // Ignora erro de link secundário
        }
      }

      const createdOpt: InfluencerOption = {
        id: newInf.id,
        name: newInf.name,
        instagram: newInf.instagram,
        tiktok: newInf.tiktok,
        percentage: Number(newInf.percentage ?? pct),
      };

      setInfluencers(prev => [...prev, createdOpt].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')));
      setSelectedInfluencerId(newInf.id);
      setShowNewForm(false);
      setForm(EMPTY_FORM);

      // Associar ao pedido
      await handleAssociateAffiliate(newInf.id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao criar influenciador';
      setFormError(msg);
      toast.error('Erro ao criar influenciador', { description: msg });
    } finally {
      setSaving(false);
    }
  };

  const handleSelectChange = (value: string) => {
    setSelectedInfluencerId(value);
    const affiliateId = value === '__none__' ? null : value;
    handleAssociateAffiliate(affiliateId);
  };

  const setField = (field: keyof NewInfluencerForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFormError(null);
  };

  return (
    <div className="rounded-xl overflow-hidden bg-violet-950/15 border border-violet-800/30">
      {/* Header - Clicável para expandir/recolher */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-violet-950/60 to-zinc-900/60 hover:from-violet-950/80 transition-colors cursor-pointer text-left"
      >
        <div className="flex items-center gap-2 flex-wrap">
          <Users className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
          <span className={`font-semibold text-xs uppercase tracking-wide ${hasRetornoLiquido && selectedAffiliate && selectedInfluencerId !== '__none__' ? 'text-zinc-500 line-through' : 'text-violet-400'}`}>
            AFILIADOS
          </span>
          {selectedAffiliate && selectedInfluencerId !== '__none__' && (
            <span className="text-xs text-violet-300 font-medium">
              — {selectedAffiliate.name} ({affiliatePercentage}%)
            </span>
          )}
          {hasRetornoLiquido && (
            <span className="text-[10px] text-teal-400 font-medium bg-teal-950/60 border border-teal-800/40 px-2 py-0.5 rounded">
              (retorno líquido aplicado)
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {selectedAffiliate && selectedInfluencerId !== '__none__' && affiliateCost > 0 ? (
            <span className={`font-semibold text-sm tabular-nums ${hasRetornoLiquido ? 'text-zinc-600 line-through' : 'text-violet-400'}`}>
              -{formatCurrency(affiliateCost)}
            </span>
          ) : (
            <span className="text-xs text-zinc-500">
              {selectedAffiliate && selectedInfluencerId !== '__none__' ? formatCurrency(0) : 'Nenhum'}
            </span>
          )}
          <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Conteúdo do Accordion */}
      {isOpen && (
        <div className="p-4 space-y-3 bg-zinc-900/40 border-t border-violet-950/30">
          {hasRetornoLiquido && (
            <div className="p-2.5 rounded-lg bg-teal-950/30 border border-teal-800/40 text-xs text-teal-300/90 flex items-start gap-2">
              <Info className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
              <p>
                O retorno líquido está ativo neste pedido. A comissão do afiliado
                {affiliateCost > 0 && <strong className="text-white"> (-{formatCurrency(affiliateCost)})</strong>} não desconta do retorno líquido, mas o afiliado selecionado permanece salvo e vinculado ao pedido para fins de relatório.
              </p>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-violet-400" />
            </div>
          ) : (
            <>
              {/* Seletor de influenciador existente */}
              {!showNewForm && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-violet-300">
                      Selecionar Afiliado / Influenciador
                    </label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-violet-400 hover:text-violet-300 hover:bg-violet-900/30 gap-1 cursor-pointer"
                      onClick={() => setShowNewForm(true)}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Novo Afiliado
                    </Button>
                  </div>
                  
                  <Select
                    value={selectedInfluencerId || '__none__'}
                    onValueChange={handleSelectChange}
                  >
                    <SelectTrigger className="bg-zinc-900/90 border-violet-800/50 text-white">
                      <SelectValue placeholder="Sem afiliado" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800 text-white max-h-60">
                      <SelectItem value="__none__">Sem afiliado</SelectItem>
                      {influencers.map((inf) => (
                        <SelectItem key={inf.id} value={inf.id}>
                          <div className="flex items-center justify-between gap-3 w-full">
                            <span className="font-medium text-zinc-200">{inf.name}</span>
                            <span className="text-xs text-violet-400 font-mono">
                              {inf.percentage != null ? `${inf.percentage}%` : '10.5%'}
                              {orderSaleAmount > 0 && inf.percentage ? (
                                ` (${formatCurrency((orderSaleAmount * Number(inf.percentage)) / 100)})`
                              ) : ''}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {selectedAffiliate && selectedInfluencerId !== '__none__' && (
                    <div className="pt-2 border-t border-violet-900/30 flex items-center justify-between text-xs">
                      <span className="text-zinc-400">Comissão de afiliado:</span>
                      <div className="text-right">
                        <span className={`font-semibold tabular-nums ${hasRetornoLiquido ? 'text-zinc-500 line-through' : 'text-violet-300'}`}>
                          -{formatCurrency(affiliateCost)}
                        </span>
                        <span className="text-zinc-500 ml-1.5">
                          ({affiliatePercentage}% sobre {formatCurrency(orderSaleAmount)})
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Formulário de novo influenciador */}
              {showNewForm && (
                <div className="space-y-3 p-3 rounded-lg bg-violet-900/20 border border-violet-800/40">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-violet-300">
                      Cadastrar Novo Afiliado
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-violet-400 hover:text-violet-300"
                      onClick={() => {
                        setShowNewForm(false);
                        setForm(EMPTY_FORM);
                        setFormError(null);
                      }}
                      disabled={saving}
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>

                  {/* Nome */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-violet-300">
                      Nome <span className="text-red-400">*</span>
                    </label>
                    <Input
                      placeholder="Nome do influenciador/afiliado"
                      value={form.name}
                      onChange={(e) => setField('name', e.target.value)}
                      disabled={saving}
                      className="h-8 text-sm bg-card border-violet-800/50 text-white"
                    />
                  </div>

                  {/* Redes sociais */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-violet-300 flex items-center gap-1">
                        <Instagram className="w-3 h-3" /> Instagram
                      </label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-violet-400">@</span>
                        <Input
                          placeholder="usuario"
                          value={form.instagram}
                          onChange={(e) => setField('instagram', e.target.value.replace(/^@/, ''))}
                          disabled={saving}
                          className="h-8 text-sm pl-6 bg-card border-violet-800/50 text-white"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-violet-300 flex items-center gap-1">
                        <AtSign className="w-3 h-3" /> TikTok
                      </label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-violet-400">@</span>
                        <Input
                          placeholder="usuario"
                          value={form.tiktok}
                          onChange={(e) => setField('tiktok', e.target.value.replace(/^@/, ''))}
                          disabled={saving}
                          className="h-8 text-sm pl-6 bg-card border-violet-800/50 text-white"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-violet-300 flex items-center gap-1">
                        <AtSign className="w-3 h-3" /> X / Outro
                      </label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-violet-400">@</span>
                        <Input
                          placeholder="usuario"
                          value={form.twitter}
                          onChange={(e) => setField('twitter', e.target.value.replace(/^@/, ''))}
                          disabled={saving}
                          className="h-8 text-sm pl-6 bg-card border-violet-800/50 text-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Comissão */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-violet-300">
                      Comissão (%) <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        placeholder="10.5"
                        value={form.percentage}
                        onChange={(e) => setField('percentage', e.target.value)}
                        disabled={saving}
                        className="h-8 text-sm pr-8 bg-card border-violet-800/50 text-white"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-violet-400">%</span>
                    </div>
                  </div>

                  {/* Erro */}
                  {formError && (
                    <p className="text-xs text-red-400">{formError}</p>
                  )}

                  {/* Botão salvar */}
                  <Button
                    type="button"
                    size="sm"
                    className="w-full bg-violet-600 hover:bg-violet-700 text-white h-8 text-xs cursor-pointer"
                    onClick={handleSaveNewInfluencer}
                    disabled={saving || !form.name.trim()}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5 mr-1.5" />
                        Salvar e Associar
                      </>
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};
