import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Loader2, Gift, User, Plus, X, Instagram, AtSign } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { PendingOrder } from '@/types/pendingOrder';
import type { InfluencerOption } from '@/hooks/useFreeSampleLane';

interface ConfirmFreeSampleDialogProps {
  open: boolean;
  order: PendingOrder | null;
  organizationId: string;
  influencers: InfluencerOption[];
  influencersLoading: boolean;
  isProcessing: boolean;
  onConfirm: (influencerId: string | null) => void;
  onCancel: () => void;
  onInfluencerCreated: (influencer: InfluencerOption) => void;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

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

export const ConfirmFreeSampleDialog: React.FC<ConfirmFreeSampleDialogProps> = ({
  open,
  order,
  organizationId,
  influencers,
  influencersLoading,
  isProcessing,
  onConfirm,
  onCancel,
  onInfluencerCreated,
}) => {
  const [selectedInfluencerId, setSelectedInfluencerId] = useState<string>('');
  const [showNewForm, setShowNewForm] = useState(false);
  const [form, setForm] = useState<NewInfluencerForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const resetState = () => {
    setSelectedInfluencerId('');
    setShowNewForm(false);
    setForm(EMPTY_FORM);
    setFormError(null);
  };

  const handleConfirm = () => {
    onConfirm(selectedInfluencerId === '__none__' || selectedInfluencerId === '' ? null : selectedInfluencerId);
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen && !isProcessing && !saving) {
      resetState();
      onCancel();
    }
  };

  const handleCancelNewForm = () => {
    setShowNewForm(false);
    setForm(EMPTY_FORM);
    setFormError(null);
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
      if (order?.marketplace_id) {
        await supabase.from('influencer_marketplaces').insert({
          influencer_id: newInf.id,
          marketplace_id: order.marketplace_id,
        });
      }

      toast.success(`Influenciador "${newInf.name}" criado com sucesso!`);
      onInfluencerCreated(newInf as InfluencerOption);
      setSelectedInfluencerId(newInf.id);
      setShowNewForm(false);
      setForm(EMPTY_FORM);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao criar influenciador';
      setFormError(msg);
      toast.error('Erro ao criar influenciador', { description: msg });
    } finally {
      setSaving(false);
    }
  };

  const setField = (field: keyof NewInfluencerForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFormError(null);
  };

  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-violet-500" />
            Enviar Amostra Grátis
          </DialogTitle>
          <DialogDescription>
            Este pedido será processado com lucro zero como amostra grátis para influenciador.
          </DialogDescription>
        </DialogHeader>

        {/* Order summary */}
        <div className="rounded-lg bg-muted/50 p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Pedido</span>
            <span className="font-medium">#{order.order_number}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Cliente</span>
            <span className="font-medium truncate max-w-[180px]">{order.customer_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Marketplace</span>
            <span className="font-medium">{order.marketplace_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Valor</span>
            <span className="font-medium">{formatCurrency(order.total_amount)}</span>
          </div>
          {order.first_product_name && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Produto</span>
              <span className="font-medium truncate max-w-[180px]">{order.first_product_name}</span>
            </div>
          )}
        </div>

        <Separator />

        {/* Influencer selection */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium flex items-center gap-1.5">
              <User className="w-4 h-4 text-muted-foreground" />
              Associar a um influenciador
              <span className="text-muted-foreground font-normal">(opcional)</span>
            </label>
            {!showNewForm && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-violet-600 hover:text-violet-700 hover:bg-violet-50 dark:hover:bg-violet-950/30 gap-1"
                onClick={() => setShowNewForm(true)}
                disabled={isProcessing}
              >
                <Plus className="w-3.5 h-3.5" />
                Novo Influenciador
              </Button>
            )}
          </div>

          {/* Existing influencer select */}
          {!showNewForm && (
            <Select
              value={selectedInfluencerId}
              onValueChange={setSelectedInfluencerId}
              disabled={influencersLoading || isProcessing}
            >
              <SelectTrigger>
                <SelectValue placeholder={influencersLoading ? 'Carregando...' : 'Sem influenciador'} />
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
          )}

          {/* New influencer inline form */}
          {showNewForm && (
            <div className="rounded-lg border border-violet-200 dark:border-violet-800/50 bg-violet-50/30 dark:bg-violet-950/10 p-4 space-y-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-violet-700 dark:text-violet-300">
                  Novo Influenciador
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
                  onClick={handleCancelNewForm}
                  disabled={saving}
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>

              {/* Name — required */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Nome <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="Nome do influenciador"
                  value={form.name}
                  onChange={(e) => setField('name', e.target.value)}
                  disabled={saving}
                  className="h-8 text-sm"
                />
              </div>

              {/* Social handles — optional */}
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <Instagram className="w-3 h-3" /> Instagram
                  </label>
                  <Input
                    placeholder="@usuario"
                    value={form.instagram}
                    onChange={(e) => setField('instagram', e.target.value)}
                    disabled={saving}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <AtSign className="w-3 h-3" /> TikTok
                  </label>
                  <Input
                    placeholder="@usuario"
                    value={form.tiktok}
                    onChange={(e) => setField('tiktok', e.target.value)}
                    disabled={saving}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <AtSign className="w-3 h-3" /> X
                  </label>
                  <Input
                    placeholder="@usuario"
                    value={form.twitter}
                    onChange={(e) => setField('twitter', e.target.value)}
                    disabled={saving}
                    className="h-8 text-sm"
                  />
                </div>
              </div>

              {/* Commission — required */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Comissão (%) <span className="text-red-500">*</span>
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
                    className="h-8 text-sm pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                </div>
              </div>

              {/* Error */}
              {formError && (
                <p className="text-xs text-red-500">{formError}</p>
              )}

              {/* Save button */}
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
                    Salvar e Selecionar
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onCancel} disabled={isProcessing || saving}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isProcessing || showNewForm}
            className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <Gift className="w-4 h-4 mr-2" />
                Confirmar Amostra Grátis
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
