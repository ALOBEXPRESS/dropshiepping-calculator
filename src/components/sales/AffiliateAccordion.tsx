/**
 * Affiliate Accordion Component
 * 
 * Accordion para associar pedidos a influenciadores/afiliados
 * Permite selecionar afiliado existente ou criar novo
 * Salva em settings quando é um novo afiliado
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
import { Loader2, Plus, X, Instagram, AtSign, ChevronDown, ChevronUp, Users } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface InfluencerOption {
  id: string;
  name: string;
  instagram?: string | null;
  tiktok?: string | null;
}

interface AffiliateAccordionProps {
  orderId: string;
  marketplaceId: string;
  organizationId: string;
  currentAffiliateId?: string | null;
  onAffiliateChange?: (affiliateId: string | null) => void;
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

  // Carregar influenciadores quando abrir o accordion
  useEffect(() => {
    if (isOpen && influencers.length === 0) {
      loadInfluencers();
    }
  }, [isOpen]);

  const loadInfluencers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('influencers')
        .select('id, name, instagram, tiktok')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setInfluencers(data || []);
    } catch (err) {
      console.error('Error loading influencers:', err);
      toast.error('Erro ao carregar influenciadores');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNewInfluencer = async () => {
    // Validate
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
      // Insert influencer
      const { data: newInf, error: infError } = await supabase
        .from('influencers')
        .insert({
          organization_id: organizationId,
          name: form.name.trim(),
          instagram: form.instagram.trim().replace(/^@/, '') || null,
          tiktok: form.tiktok.trim().replace(/^@/, '') || null,
          twitter: form.twitter.trim().replace(/^@/, '') || null,
          percentage: pct,
          is_active: true,
        })
        .select('id, name, instagram, tiktok')
        .single();

      if (infError) throw infError;

      // Link to marketplace
      await supabase.from('influencer_marketplaces').insert({
        influencer_id: newInf.id,
        marketplace_id: marketplaceId,
      });

      toast.success(`Influenciador "${newInf.name}" criado com sucesso!`);
      
      // Adicionar à lista
      setInfluencers(prev => [...prev, newInf as InfluencerOption]);
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

  const handleAssociateAffiliate = async (affiliateId: string | null) => {
    try {
      // Atualizar a associação do pedido com o afiliado
      // Nota: Requer coluna affiliate_id na tabela orders
      const { error } = await supabase
        .from('orders')
        .update({ affiliate_id: affiliateId })
        .eq('id', orderId);

      if (error) {
        // Se o erro for sobre coluna não existente, dar feedback específico
        if (error.message?.includes('column') && error.message?.includes('affiliate_id')) {
          toast.error('Coluna affiliate_id não existe na tabela orders', {
            description: 'Execute a migração do banco de dados para adicionar esta coluna.',
          });
        } else {
          throw error;
        }
        return;
      }

      toast.success(affiliateId ? 'Afiliado associado com sucesso!' : 'Afiliado removido');
      onAffiliateChange?.(affiliateId);
    } catch (err) {
      console.error('Error associating affiliate:', err);
      toast.error('Erro ao associar afiliado');
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
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-violet-900/20 px-4 py-3 hover:bg-violet-900/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-violet-400" />
          <span className="text-sm font-semibold text-violet-300">AFILIADOS</span>
          {selectedInfluencerId && selectedInfluencerId !== '__none__' && (
            <span className="text-xs text-violet-400">
              ({influencers.find(i => i.id === selectedInfluencerId)?.name || 'Associado'})
            </span>
          )}
        </div>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-violet-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-violet-400" />
        )}
      </button>

      {/* Conteúdo do Accordion */}
      {isOpen && (
        <div className="p-4 space-y-3">
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
                      Selecionar Influenciador
                    </label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-violet-400 hover:text-violet-300 hover:bg-violet-900/30 gap-1"
                      onClick={() => setShowNewForm(true)}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Novo
                    </Button>
                  </div>
                  
                  <Select
                    value={selectedInfluencerId}
                    onValueChange={handleSelectChange}
                  >
                    <SelectTrigger className="bg-zinc-900/50 border-violet-800/50 text-white">
                      <SelectValue placeholder="Sem influenciador" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Sem influenciador</SelectItem>
                      {influencers.map((inf) => (
                        <SelectItem key={inf.id} value={inf.id}>
                          <span className="font-medium">{inf.name}</span>
                          {inf.instagram && (
                            <span className="text-muted-foreground ml-1 text-xs">@{inf.instagram}</span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Formulário de novo influenciador */}
              {showNewForm && (
                <div className="space-y-3 p-3 rounded-lg bg-violet-900/20 border border-violet-800/40">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-violet-300">
                      Novo Influenciador
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
                      placeholder="Nome do influenciador"
                      value={form.name}
                      onChange={(e) => setField('name', e.target.value)}
                      disabled={saving}
                      className="h-8 text-sm bg-zinc-900/50 border-violet-800/50 text-white"
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
                          className="h-8 text-sm pl-6 bg-zinc-900/50 border-violet-800/50 text-white"
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
                          className="h-8 text-sm pl-6 bg-zinc-900/50 border-violet-800/50 text-white"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-violet-300 flex items-center gap-1">
                        <AtSign className="w-3 h-3" /> X
                      </label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-violet-400">@</span>
                        <Input
                          placeholder="usuario"
                          value={form.twitter}
                          onChange={(e) => setField('twitter', e.target.value.replace(/^@/, ''))}
                          disabled={saving}
                          className="h-8 text-sm pl-6 bg-zinc-900/50 border-violet-800/50 text-white"
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
                        className="h-8 text-sm pr-8 bg-zinc-900/50 border-violet-800/50 text-white"
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
                    className="w-full bg-violet-600 hover:bg-violet-700 text-white h-8 text-xs"
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
