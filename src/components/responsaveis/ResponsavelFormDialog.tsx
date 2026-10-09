import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  TestadorSchema,
  TitularSchema,
  InfluenciadorSchema,
  type TestadorFormData,
  type TitularFormData,
  type InfluenciadorFormData,
  type Testador,
  type Titular,
  type Influenciador,
  type ResponsavelTab,
  type TitularCreditCard,
} from '@/types/responsaveis';
import { useInfluenciadores } from '@/hooks/useResponsaveis';
import {
  User,
  Users,
  Megaphone,
  CreditCard,
  Plus,
  Trash2,
  Building,
  Check,
  Star,
  Wallet,
  Landmark,
} from 'lucide-react';

// ── Config ──────────────────────────────────────────────────────────────────

const TAB_CONFIG = {
  testadores: { label: 'Testador', icon: User },
  titulares: { label: 'Titular', icon: Users },
  influenciadores: { label: 'Influenciador', icon: Megaphone },
} as const;

const MARKETPLACE_OPTIONS = [
  'TikTok Shop',
  'Shopee',
  'Mercado Livre',
  'Amazon',
  'Magalu',
  'Kwai',
  'Shein',
  'Nuvemshop',
];

const BANK_OPTIONS = [
  'Nubank',
  'Banco Inter',
  'Itaú Unibanco',
  'Bradesco',
  'Santander',
  'Banco do Brasil',
  'C6 Bank',
  'Caixa Econômica',
  'BTG Pactual',
  'Sicredi',
  'Sicoob',
  'Outro',
];

const CARD_BRANDS = ['Mastercard', 'Visa', 'Elo', 'Amex', 'Hipercard'];

// ── Testador Form ────────────────────────────────────────────────────────────

interface TestadorFormProps {
  defaultValues?: Partial<TestadorFormData>;
  onSubmit: (data: TestadorFormData) => Promise<void>;
  onCancel: () => void;
  isEditing: boolean;
}

function TestadorForm({ defaultValues, onSubmit, onCancel, isEditing }: TestadorFormProps) {
  const { register, handleSubmit, formState: { errors, isSubmitting }, setValue, watch } = useForm<TestadorFormData>({
    resolver: zodResolver(TestadorSchema),
    defaultValues: { document_type: 'cpf', is_active: true, ...defaultValues },
  });

  const docType = watch('document_type');
  const isActive = watch('is_active');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="td_full_name">Nome completo <span className="text-red-400">*</span></Label>
        <Input id="td_full_name" placeholder="Ex: João da Silva" {...register('full_name')}
          className="bg-[hsl(var(--card))] border-[hsl(var(--border))]" />
        {errors.full_name && <p className="text-xs text-red-400">{errors.full_name.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Tipo de documento</Label>
          <Select value={docType} onValueChange={(v) => setValue('document_type', v as TestadorFormData['document_type'])}>
            <SelectTrigger className="bg-[hsl(var(--card))] border-[hsl(var(--border))]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="cpf">CPF</SelectItem>
              <SelectItem value="cnpj">CNPJ</SelectItem>
              <SelectItem value="rg">RG</SelectItem>
              <SelectItem value="outro">Outro</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="td_doc">Número</Label>
          <Input id="td_doc" placeholder={docType === 'cpf' ? '000.000.000-00' : ''} {...register('document_number')}
            className="bg-[hsl(var(--card))] border-[hsl(var(--border))]" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="td_rg">RG</Label>
          <Input id="td_rg" placeholder="Número do RG" {...register('rg')}
            className="bg-[hsl(var(--card))] border-[hsl(var(--border))]" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="td_birth">Data de nascimento</Label>
          <Input id="td_birth" type="date" {...register('birth_date')}
            className="bg-[hsl(var(--card))] border-[hsl(var(--border))]" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="td_phone">Telefone</Label>
          <Input id="td_phone" placeholder="(00) 00000-0000" {...register('phone')}
            className="bg-[hsl(var(--card))] border-[hsl(var(--border))]" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="td_email">E-mail</Label>
          <Input id="td_email" type="email" placeholder="email@exemplo.com" {...register('email')}
            className="bg-[hsl(var(--card))] border-[hsl(var(--border))]" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="td_notes">Observações</Label>
        <Textarea id="td_notes" rows={2} placeholder="Informações adicionais..." {...register('notes')}
          className="bg-[hsl(var(--card))] border-[hsl(var(--border))] resize-none" />
      </div>

      <div className="flex items-center gap-3 pt-1">
        <Switch id="td_active" checked={isActive ?? true} onCheckedChange={(v: boolean) => setValue('is_active', v)} />
        <Label htmlFor="td_active" className="cursor-pointer">Testador ativo</Label>
      </div>

      <DialogFooter className="pt-2 border-t border-[hsl(var(--border))]">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>Cancelar</Button>
        <Button type="submit" disabled={isSubmitting} className="bg-[hsl(var(--brand))] hover:bg-[hsl(var(--brand)/0.9)] text-white">
          {isSubmitting ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Criar Testador'}
        </Button>
      </DialogFooter>
    </form>
  );
}

// ── Titular Form ─────────────────────────────────────────────────────────────

interface TitularFormProps {
  defaultValues?: Partial<TitularFormData>;
  onSubmit: (data: TitularFormData) => Promise<void>;
  onCancel: () => void;
  isEditing: boolean;
}

function TitularForm({ defaultValues, onSubmit, onCancel, isEditing }: TitularFormProps) {
  const { influenciadores } = useInfluenciadores();

  const { register, handleSubmit, formState: { errors, isSubmitting }, setValue, watch } = useForm<TitularFormData>({
    resolver: zodResolver(TitularSchema),
    defaultValues: {
      account_type: 'cpf',
      document_type: 'cpf',
      marketplaces: [],
      marketing_capital: 0,
      marketing_total_cost: 0,
      gateway_fee: 0,
      preferred_payment_method: 'pix',
      credit_cards: [],
      is_influencer: false,
      ...defaultValues,
    },
  });

  const accountType = watch('account_type');
  const selectedMarketplaces = watch('marketplaces') || [];
  const preferredPayment = watch('preferred_payment_method');
  const creditCards = watch('credit_cards') || [];
  const isInfluencer = watch('is_influencer');
  const selectedInfluencerId = watch('influencer_id');
  const currentBank = watch('bank');

  // Mini form state for adding a new credit card
  const [showAddCard, setShowAddCard] = useState(false);
  const [newCard, setNewCard] = useState<{
    card_name: string;
    last_digits: string;
    brand: string;
    bank: string;
    expiry: string;
  }>({
    card_name: '',
    last_digits: '',
    brand: 'Mastercard',
    bank: '',
    expiry: '',
  });

  const handleToggleMarketplace = (mp: string) => {
    if (selectedMarketplaces.includes(mp)) {
      setValue('marketplaces', selectedMarketplaces.filter((m) => m !== mp));
    } else {
      setValue('marketplaces', [...selectedMarketplaces, mp]);
    }
  };

  const handleAddCard = () => {
    if (!newCard.card_name.trim() || !newCard.last_digits.trim()) return;
    const cardItem: TitularCreditCard = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
      card_name: newCard.card_name.trim(),
      last_digits: newCard.last_digits.replace(/\D/g, '').slice(-4),
      brand: newCard.brand || 'Mastercard',
      bank: newCard.bank.trim() || null,
      expiry: newCard.expiry.trim() || null,
    };

    setValue('credit_cards', [...creditCards, cardItem]);
    setNewCard({ card_name: '', last_digits: '', brand: 'Mastercard', bank: '', expiry: '' });
    setShowAddCard(false);
  };

  const handleRemoveCard = (cardId: string) => {
    setValue('credit_cards', creditCards.filter((c) => c.id !== cardId));
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* 1. Tipo de Conta & Dados Cadastrais */}
      <div className="space-y-3 p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800">
        <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
          <span className="text-xs font-bold text-violet-400 flex items-center gap-1.5 uppercase tracking-wide">
            <Building className="w-3.5 h-3.5" /> Identificação & Documentos
          </span>

          {/* Toggle CPF vs CNPJ */}
          <div className="inline-flex rounded-lg bg-zinc-800 p-0.5 border border-zinc-750">
            <button
              type="button"
              onClick={() => {
                setValue('account_type', 'cpf');
                setValue('document_type', 'cpf');
              }}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${
                accountType === 'cpf'
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Pessoa Física (CPF)
            </button>
            <button
              type="button"
              onClick={() => {
                setValue('account_type', 'cnpj');
                setValue('document_type', 'cnpj');
              }}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${
                accountType === 'cnpj'
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Pessoa Jurídica (CNPJ)
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="tit_full_name">
            {accountType === 'cnpj' ? 'Razão Social / Nome da Empresa' : 'Nome Completo'} <span className="text-red-400">*</span>
          </Label>
          <Input
            id="tit_full_name"
            placeholder={accountType === 'cnpj' ? 'Ex: Alpha Comercio Digital LTDA' : 'Ex: Maria da Silva'}
            {...register('full_name')}
            className="bg-zinc-850 border-zinc-700 h-9 text-xs"
          />
          {errors.full_name && <p className="text-xs text-red-400">{errors.full_name.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="tit_doc">
              {accountType === 'cnpj' ? 'CNPJ' : 'CPF'} <span className="text-red-400">*</span>
            </Label>
            <Input
              id="tit_doc"
              placeholder={accountType === 'cnpj' ? '00.000.000/0000-00' : '000.000.000-00'}
              {...register('document_number')}
              className="bg-zinc-850 border-zinc-700 h-9 text-xs font-mono"
            />
          </div>

          {accountType === 'cpf' ? (
            <div className="space-y-1.5">
              <Label htmlFor="tit_rg">RG</Label>
              <Input
                id="tit_rg"
                placeholder="Número do RG"
                {...register('rg')}
                className="bg-zinc-850 border-zinc-700 h-9 text-xs font-mono"
              />
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label htmlFor="tit_birth">Data de Abertura / Fundação</Label>
              <Input
                id="tit_birth"
                type="date"
                {...register('birth_date')}
                className="bg-zinc-850 border-zinc-700 h-9 text-xs"
              />
            </div>
          )}
        </div>

        {accountType === 'cpf' && (
          <div className="space-y-1.5">
            <Label htmlFor="tit_birth">Data de Nascimento</Label>
            <Input
              id="tit_birth"
              type="date"
              {...register('birth_date')}
              className="bg-zinc-850 border-zinc-700 h-9 text-xs"
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="tit_phone">Telefone / WhatsApp</Label>
            <Input
              id="tit_phone"
              placeholder="(00) 00000-0000"
              {...register('phone')}
              className="bg-zinc-850 border-zinc-700 h-9 text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tit_email">E-mail</Label>
            <Input
              id="tit_email"
              type="email"
              placeholder="contato@empresa.com"
              {...register('email')}
              className="bg-zinc-850 border-zinc-700 h-9 text-xs"
            />
          </div>
        </div>
      </div>

      {/* 2. Marketplaces Associados */}
      <div className="space-y-2.5 p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-bold text-violet-400 flex items-center gap-1.5 uppercase tracking-wide">
            <Building className="w-3.5 h-3.5" /> Marketplaces Associados
          </Label>
          <span className="text-[11px] text-zinc-400">
            {selectedMarketplaces.length} selecionado{selectedMarketplaces.length !== 1 ? 's' : ''}
          </span>
        </div>
        <p className="text-[11px] text-zinc-400">
          Selecione as plataformas e marketplaces nos quais este titular possui contas ou opera:
        </p>

        <div className="flex flex-wrap gap-1.5 pt-1">
          {MARKETPLACE_OPTIONS.map((mp) => {
            const isSelected = selectedMarketplaces.includes(mp);
            return (
              <button
                key={mp}
                type="button"
                onClick={() => handleToggleMarketplace(mp)}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg border flex items-center gap-1.5 transition-all ${
                  isSelected
                    ? 'bg-violet-600/30 text-violet-300 border-violet-500 shadow-sm font-semibold'
                    : 'bg-zinc-850 text-zinc-400 border-zinc-750 hover:bg-zinc-800 hover:text-zinc-200'
                }`}
              >
                {isSelected && <Check className="w-3 h-3 text-violet-400" />}
                {mp}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Financeiro, Marketing & Gateway */}
      <div className="space-y-3 p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800">
        <span className="text-xs font-bold text-violet-400 flex items-center gap-1.5 uppercase tracking-wide pb-1 border-b border-zinc-800">
          <Wallet className="w-3.5 h-3.5" /> Financeiro & Capital de Marketing
        </span>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="tit_mkt_cap">Capital de Marketing (R$)</Label>
            <Input
              id="tit_mkt_cap"
              type="number"
              step="0.01"
              min="0"
              placeholder="0,00"
              {...register('marketing_capital', { valueAsNumber: true })}
              className="bg-zinc-850 border-zinc-700 h-9 text-xs font-semibold tabular-nums text-right"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="tit_mkt_cost">Custo de Marketing Total (R$)</Label>
              <span className="text-[10px] text-zinc-500">(futuro)</span>
            </div>
            <Input
              id="tit_mkt_cost"
              type="number"
              step="0.01"
              min="0"
              placeholder="0,00"
              {...register('marketing_total_cost', { valueAsNumber: true })}
              className="bg-zinc-850 border-zinc-700 h-9 text-xs tabular-nums text-right"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1">
              <Landmark className="w-3.5 h-3.5 text-zinc-400" /> Banco Principal
            </Label>
            <Select
              value={currentBank || ''}
              onValueChange={(v) => setValue('bank', v)}
            >
              <SelectTrigger className="bg-zinc-850 border-zinc-700 h-9 text-xs">
                <SelectValue placeholder="Selecione a instituição" />
              </SelectTrigger>
              <SelectContent>
                {BANK_OPTIONS.map((b) => (
                  <SelectItem key={b} value={b} className="text-xs">{b}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tit_gtw">Taxa de Gateway (%)</Label>
            <Input
              id="tit_gtw"
              type="number"
              step="0.01"
              min="0"
              max="100"
              placeholder="Ex: 2.5"
              {...register('gateway_fee', { valueAsNumber: true })}
              className="bg-zinc-850 border-zinc-700 h-9 text-xs tabular-nums text-right font-medium"
            />
          </div>
        </div>

        {/* Forma de Pagamento Preferencial */}
        <div className="space-y-1.5 pt-1">
          <Label className="text-xs">Forma de Pagamento Preferencial</Label>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { id: 'pix', label: 'PIX' },
              { id: 'pix_credito', label: 'PIX com Crédito' },
              { id: 'cartao_credito', label: 'Cartão de Crédito' },
            ].map((method) => {
              const isSelected = preferredPayment === method.id;
              return (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setValue('preferred_payment_method', method.id as TitularFormData['preferred_payment_method'])}
                  className={`py-2 text-xs font-semibold rounded-lg border transition-all ${
                    isSelected
                      ? 'bg-violet-600 border-violet-500 text-white shadow-sm'
                      : 'bg-zinc-850 border-zinc-750 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                  }`}
                >
                  {method.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. Cartões de Crédito Cadastrados */}
      <div className="space-y-3 p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800">
        <div className="flex items-center justify-between pb-1 border-b border-zinc-800">
          <span className="text-xs font-bold text-violet-400 flex items-center gap-1.5 uppercase tracking-wide">
            <CreditCard className="w-3.5 h-3.5" /> Cartões de Crédito Vinculados
          </span>
          {!showAddCard && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setShowAddCard(true)}
              className="h-7 text-xs border-violet-500/30 text-violet-300 hover:bg-violet-500/10 gap-1"
            >
              <Plus className="w-3 h-3" /> Adicionar Cartão
            </Button>
          )}
        </div>

        {creditCards.length === 0 && !showAddCard ? (
          <p className="text-xs text-zinc-500 py-2 text-center">
            Nenhum cartão de crédito cadastrado para este titular.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {creditCards.map((card) => (
              <div
                key={card.id}
                className="p-2.5 rounded-lg bg-zinc-950/70 border border-zinc-800 flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-md bg-violet-950/60 border border-violet-800/40 flex items-center justify-center shrink-0">
                    <CreditCard className="w-3.5 h-3.5 text-violet-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white truncate">{card.card_name}</p>
                    <p className="text-[11px] text-zinc-400 font-mono">
                      {card.brand} •••• {card.last_digits}
                      {card.bank ? ` (${card.bank})` : ''}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveCard(card.id)}
                  className="text-zinc-500 hover:text-red-400 p-1 rounded transition-colors"
                  title="Remover cartão"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Mini formulário de adicionar cartão */}
        {showAddCard && (
          <div className="p-3 rounded-lg bg-zinc-950 border border-violet-500/40 space-y-2.5 mt-2">
            <span className="text-xs font-bold text-violet-300 flex items-center gap-1">
              <Plus className="w-3 h-3" /> Novo Cartão
            </span>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1 col-span-2">
                <Label className="text-[11px]">Apelido do Cartão *</Label>
                <Input
                  placeholder="Ex: Nubank Virtual Tráfego, Inter Black Principal"
                  value={newCard.card_name}
                  onChange={(e) => setNewCard({ ...newCard, card_name: e.target.value })}
                  className="bg-zinc-850 border-zinc-700 h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[11px]">Últimos 4 Dígitos *</Label>
                <Input
                  maxLength={4}
                  placeholder="1234"
                  value={newCard.last_digits}
                  onChange={(e) => setNewCard({ ...newCard, last_digits: e.target.value })}
                  className="bg-zinc-850 border-zinc-700 h-8 text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[11px]">Bandeira</Label>
                <Select
                  value={newCard.brand}
                  onValueChange={(b) => setNewCard({ ...newCard, brand: b })}
                >
                  <SelectTrigger className="bg-zinc-850 border-zinc-700 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CARD_BRANDS.map((br) => (
                      <SelectItem key={br} value={br} className="text-xs">{br}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-[11px]">Banco Emissor (opcional)</Label>
                <Input
                  placeholder="Ex: Nubank, Inter"
                  value={newCard.bank}
                  onChange={(e) => setNewCard({ ...newCard, bank: e.target.value })}
                  className="bg-zinc-850 border-zinc-700 h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[11px]">Vencimento (opcional)</Label>
                <Input
                  placeholder="MM/AA"
                  value={newCard.expiry}
                  onChange={(e) => setNewCard({ ...newCard, expiry: e.target.value })}
                  className="bg-zinc-850 border-zinc-700 h-8 text-xs font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowAddCard(false)}
                className="h-7 text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleAddCard}
                className="h-7 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold"
              >
                Salvar Cartão
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 5. Vínculo com Influenciador */}
      <div className="space-y-3 p-3.5 rounded-xl bg-gradient-to-br from-pink-950/20 via-zinc-900/60 to-zinc-900/60 border border-pink-900/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-pink-500/15 border border-pink-500/30 flex items-center justify-center">
              <Star className="w-3.5 h-3.5 text-pink-400" />
            </div>
            <div>
              <Label htmlFor="tit_inf_switch" className="text-xs font-bold text-pink-300 cursor-pointer block">
                Tornar este Titular um Influenciador
              </Label>
              <p className="text-[11px] text-zinc-400">
                Permite conectar diretamente o perfil de influenciador ao cadastro do titular.
              </p>
            </div>
          </div>
          <Switch
            id="tit_inf_switch"
            checked={isInfluencer}
            onCheckedChange={(val) => {
              setValue('is_influencer', val);
              if (!val) setValue('influencer_id', null);
            }}
          />
        </div>

        {isInfluencer && (
          <div className="pt-2 border-t border-pink-900/40 space-y-2">
            <Label className="text-xs text-pink-200">Vínculo com Perfil de Influenciador:</Label>
            <Select
              value={selectedInfluencerId || 'auto'}
              onValueChange={(val) => setValue('influencer_id', val === 'auto' ? null : val)}
            >
              <SelectTrigger className="bg-zinc-850 border-pink-900/60 h-9 text-xs">
                <SelectValue placeholder="Selecione como vincular" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto" className="text-xs">
                  ✨ Criar / sincronizar perfil automático com o nome deste titular
                </SelectItem>
                {influenciadores.map((inf) => (
                  <SelectItem key={inf.id} value={inf.id} className="text-xs">
                    ⭐ Vincular a {inf.name} {inf.instagram ? `(${inf.instagram})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* 6. Observações */}
      <div className="space-y-1.5">
        <Label htmlFor="tit_notes">Observações Gerais</Label>
        <Textarea
          id="tit_notes"
          rows={2}
          placeholder="Informações adicionais sobre o titular..."
          {...register('notes')}
          className="bg-zinc-850 border-zinc-700 text-xs resize-none"
        />
      </div>

      <DialogFooter className="pt-3 border-t border-[hsl(var(--border))]">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>Cancelar</Button>
        <Button type="submit" disabled={isSubmitting} className="bg-violet-600 hover:bg-violet-500 text-white font-semibold">
          {isSubmitting ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Criar Titular'}
        </Button>
      </DialogFooter>
    </form>
  );
}

// ── Influenciador Form ───────────────────────────────────────────────────────

interface InfluenciadorFormProps {
  defaultValues?: Partial<InfluenciadorFormData>;
  onSubmit: (data: InfluenciadorFormData) => Promise<void>;
  onCancel: () => void;
  isEditing: boolean;
}

function InfluenciadorForm({ defaultValues, onSubmit, onCancel, isEditing }: InfluenciadorFormProps) {
  const { register, handleSubmit, formState: { errors, isSubmitting }, setValue, watch } = useForm<InfluenciadorFormData>({
    resolver: zodResolver(InfluenciadorSchema),
    defaultValues: { percentage: 0, is_active: true, ...defaultValues },
  });

  const isActive = watch('is_active');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="inf_name">Nome / Handle <span className="text-red-400">*</span></Label>
        <Input id="inf_name" placeholder="Ex: @joaosilva" {...register('name')}
          className="bg-[hsl(var(--card))] border-[hsl(var(--border))]" />
        {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="inf_insta">Instagram</Label>
          <Input id="inf_insta" placeholder="@usuario" {...register('instagram')}
            className="bg-[hsl(var(--card))] border-[hsl(var(--border))]" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="inf_tiktok">TikTok</Label>
          <Input id="inf_tiktok" placeholder="@usuario" {...register('tiktok')}
            className="bg-[hsl(var(--card))] border-[hsl(var(--border))]" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="inf_twitter">Twitter / X</Label>
          <Input id="inf_twitter" placeholder="@usuario" {...register('twitter')}
            className="bg-[hsl(var(--card))] border-[hsl(var(--border))]" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="inf_perc">Comissão (%)</Label>
        <Input
          id="inf_perc"
          type="number"
          step="0.01"
          min="0"
          max="100"
          placeholder="Ex: 10"
          {...register('percentage', { valueAsNumber: true })}
          className="bg-[hsl(var(--card))] border-[hsl(var(--border))]"
        />
        {errors.percentage && <p className="text-xs text-red-400">{errors.percentage.message}</p>}
      </div>

      <div className="flex items-center gap-3 pt-1">
        <Switch id="inf_active" checked={isActive ?? true} onCheckedChange={(v: boolean) => setValue('is_active', v)} />
        <Label htmlFor="inf_active" className="cursor-pointer">Influenciador ativo</Label>
      </div>

      <DialogFooter className="pt-2 border-t border-[hsl(var(--border))]">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>Cancelar</Button>
        <Button type="submit" disabled={isSubmitting} className="bg-[hsl(var(--brand))] hover:bg-[hsl(var(--brand)/0.9)] text-white">
          {isSubmitting ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Criar Influenciador'}
        </Button>
      </DialogFooter>
    </form>
  );
}

// ── Main Dialog ─────────────────────────────────────────────────────────────

interface ResponsavelFormDialogProps {
  open: boolean;
  onClose: () => void;
  tab: ResponsavelTab;
  editItem?: Testador | Titular | Influenciador | null;
  onSaveTestador: (data: TestadorFormData, id?: string) => Promise<void>;
  onSaveTitular: (data: TitularFormData, id?: string) => Promise<void>;
  onSaveInfluenciador: (data: InfluenciadorFormData, id?: string) => Promise<void>;
}

export function ResponsavelFormDialog({
  open,
  onClose,
  tab,
  editItem,
  onSaveTestador,
  onSaveTitular,
  onSaveInfluenciador,
}: ResponsavelFormDialogProps) {
  const config = TAB_CONFIG[tab];
  const Icon = config.icon;
  const isEditing = !!editItem;

  const testadorDefaults = editItem && tab === 'testadores' ? (() => {
    const t = editItem as Testador;
    return {
      full_name: t.full_name,
      document_type: (t.document_type || 'cpf') as TestadorFormData['document_type'],
      document_number: t.document_number ?? undefined,
      rg: t.rg ?? undefined,
      birth_date: t.birth_date ?? undefined,
      phone: t.phone ?? undefined,
      email: t.email ?? undefined,
      notes: t.notes ?? undefined,
      is_active: t.is_active,
    };
  })() : undefined;

  const titularDefaults = editItem && tab === 'titulares' ? (() => {
    const t = editItem as Titular;
    return {
      full_name: t.full_name,
      document_type: (t.document_type || 'cpf') as TitularFormData['document_type'],
      account_type: (t.account_type || (t.document_type === 'cnpj' ? 'cnpj' : 'cpf')) as TitularFormData['account_type'],
      document_number: t.document_number ?? undefined,
      rg: t.rg ?? undefined,
      birth_date: t.birth_date ?? undefined,
      phone: t.phone ?? undefined,
      email: t.email ?? undefined,
      notes: t.notes ?? undefined,
      marketplaces: t.marketplaces ?? [],
      marketing_capital: t.marketing_capital ?? 0,
      marketing_total_cost: t.marketing_total_cost ?? 0,
      bank: t.bank ?? undefined,
      gateway_fee: t.gateway_fee ?? 0,
      preferred_payment_method: t.preferred_payment_method ?? 'pix',
      credit_cards: t.credit_cards ?? [],
      is_influencer: t.is_influencer ?? false,
      influencer_id: t.influencer_id ?? undefined,
    };
  })() : undefined;

  const influenciadorDefaults = editItem && tab === 'influenciadores' ? (() => {
    const i = editItem as Influenciador;
    return {
      name: i.name,
      instagram: i.instagram ?? undefined,
      tiktok: i.tiktok ?? undefined,
      twitter: i.twitter ?? undefined,
      percentage: i.percentage,
      is_active: i.is_active,
    };
  })() : undefined;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className={`${tab === 'titulares' ? 'max-w-2xl' : 'max-w-lg'} bg-[hsl(var(--card))] border border-[hsl(var(--border))] max-h-[90vh] overflow-hidden flex flex-col`}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5 text-lg font-semibold">
            <span className="p-1.5 rounded-md bg-[hsl(var(--muted))]">
              <Icon className="w-4 h-4" />
            </span>
            {isEditing ? `Editar ${config.label}` : `Novo ${config.label}`}
          </DialogTitle>
        </DialogHeader>

        <div className="py-2 overflow-y-auto pr-1 flex-1">
          {tab === 'testadores' && (
            <TestadorForm
              key={editItem?.id ?? 'new-testador'}
              defaultValues={testadorDefaults}
              isEditing={isEditing}
              onCancel={onClose}
              onSubmit={async (data) => {
                await onSaveTestador(data, editItem?.id);
                onClose();
              }}
            />
          )}
          {tab === 'titulares' && (
            <TitularForm
              key={editItem?.id ?? 'new-titular'}
              defaultValues={titularDefaults}
              isEditing={isEditing}
              onCancel={onClose}
              onSubmit={async (data) => {
                await onSaveTitular(data, editItem?.id);
                onClose();
              }}
            />
          )}
          {tab === 'influenciadores' && (
            <InfluenciadorForm
              key={editItem?.id ?? 'new-influenciador'}
              defaultValues={influenciadorDefaults}
              isEditing={isEditing}
              onCancel={onClose}
              onSubmit={async (data) => {
                await onSaveInfluenciador(data, editItem?.id);
                onClose();
              }}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
