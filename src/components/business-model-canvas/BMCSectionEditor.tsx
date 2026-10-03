import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Handshake, Cog, Package, Gem, Users,
  Share2, UserCircle, Receipt, CircleDollarSign,
  Plus, Trash2, GripVertical, Loader2,
} from 'lucide-react';
import { useUpsertBMCSection } from '@/hooks/useBusinessModelCanvas';
import type { BusinessModelCanvasSection, BmcSectionKey, BmcRecurrence, BmcItemObject } from '@/types/businessModelCanvas';
import {
  BMC_SECTIONS,
  isRecurrenceSection,
  parseBmcItem,
  serializeBmcItem,
  formatItemRecurrence,
  getMonthlyEquivalent,
  formatCurrencyBRL,
} from '@/types/businessModelCanvas';
import { toast } from 'sonner';

// ── Mapa de ícones ────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  Handshake, Cog, Package, Gem, Users,
  Share2, UserCircle, Receipt, CircleDollarSign,
};

// ── Props ─────────────────────────────────────────────────────────────────────

interface BMCSectionEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessCenterId: string;
  sectionKey: BmcSectionKey;
  /** Dados atuais da seção (null = seção ainda não existe no banco) */
  currentData: BusinessModelCanvasSection | null;
}

// ── Componente ────────────────────────────────────────────────────────────────

export function BMCSectionEditor({
  open,
  onOpenChange,
  businessCenterId,
  sectionKey,
  currentData,
}: BMCSectionEditorProps) {
  const sectionConfig = BMC_SECTIONS[sectionKey];
  const SectionIcon = ICON_MAP[sectionConfig.icon] ?? Gem;
  const isRecurrence = isRecurrenceSection(sectionKey);

  const [items, setItems] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [financialValue, setFinancialValue] = useState<number | null>(null);
  const [financialValueText, setFinancialValueText] = useState('');

  // Estado para novo item
  const [newItemText, setNewItemText] = useState('');
  const [newItemValueText, setNewItemValueText] = useState('');
  const [newItemValue, setNewItemValue] = useState<number | null>(null);
  const [newItemRecurrence, setNewItemRecurrence] = useState<BmcRecurrence>('mensal');
  const newItemRef = useRef<HTMLInputElement>(null);

  const { mutateAsync: upsert, isPending } = useUpsertBMCSection();

  // Preenche os campos com os dados atuais ao abrir
  useEffect(() => {
    if (open) {
      setItems(currentData?.items ?? []);
      setNotes(currentData?.notes ?? '');
      setNewItemText('');
      setNewItemValueText('');
      setNewItemValue(null);
      setNewItemRecurrence('mensal');

      if (currentData?.financial_value != null && !isNaN(currentData.financial_value)) {
        setFinancialValue(currentData.financial_value);
        const cents = Math.round(currentData.financial_value * 100);
        const valStr = (cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        setFinancialValueText(valStr);
      } else {
        setFinancialValue(null);
        setFinancialValueText('');
      }
    }
  }, [open, currentData]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleFinancialValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawDigits = e.target.value.replace(/\D/g, '');
    if (!rawDigits) {
      setFinancialValueText('');
      setFinancialValue(null);
      return;
    }
    const cents = parseInt(rawDigits, 10);
    const valueFloat = cents / 100;
    const formatted = valueFloat.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    setFinancialValueText(formatted);
    setFinancialValue(valueFloat);
  };

  const handleNewItemValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawDigits = e.target.value.replace(/\D/g, '');
    if (!rawDigits) {
      setNewItemValueText('');
      setNewItemValue(null);
      return;
    }
    const cents = parseInt(rawDigits, 10);
    const valueFloat = cents / 100;
    const formatted = valueFloat.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    setNewItemValueText(formatted);
    setNewItemValue(valueFloat);
  };

  const addItem = () => {
    const trimmed = newItemText.trim();
    if (!trimmed) return;

    const itemObj: BmcItemObject = {
      text: trimmed,
      value: newItemValue,
      recurrence: isRecurrence && newItemValue != null ? newItemRecurrence : null,
    };

    const serialized = serializeBmcItem(itemObj);

    // Evita duplicatas idênticas de texto
    const exists = items.some((it) => {
      const parsed = parseBmcItem(it);
      return parsed.text.toLowerCase() === trimmed.toLowerCase();
    });

    if (exists) {
      toast.warning('Item já existe na lista.');
      return;
    }

    const nextItems = [...items, serialized];
    setItems(nextItems);
    setNewItemText('');
    setNewItemValueText('');
    setNewItemValue(null);
    setNewItemRecurrence('mensal');

    // Se o valor financeiro do bloco estiver vazio, sugere ou preenche automaticamente com a soma
    if (isRecurrence && financialValue === null) {
      const calculatedSum = nextItems.reduce((acc, it) => acc + getMonthlyEquivalent(parseBmcItem(it)), 0);
      if (calculatedSum > 0) {
        setFinancialValue(calculatedSum);
        setFinancialValueText(calculatedSum.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
      }
    }

    setTimeout(() => newItemRef.current?.focus(), 50);
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Cálculo da soma dos itens cadastrados (equivalente mensal)
  const calculatedMonthlySum = items.reduce((acc, it) => {
    const parsed = parseBmcItem(it);
    return acc + getMonthlyEquivalent(parsed);
  }, 0);

  const handleSave = async () => {
    try {
      // Se for seção recorrente e o valor geral estiver zerado, usa a soma dos itens se houver
      let finalFinancialValue = financialValue;
      if (isRecurrence && (finalFinancialValue === null || isNaN(finalFinancialValue)) && calculatedMonthlySum > 0) {
        finalFinancialValue = calculatedMonthlySum;
      }

      await upsert({
        business_center_id: businessCenterId,
        section: sectionKey,
        items,
        notes: notes.trim() || null,
        financial_value: finalFinancialValue,
      });
      toast.success(`${sectionConfig.label} atualizado!`);
      onOpenChange(false);
    } catch (err) {
      toast.error('Erro ao salvar. Tente novamente.');
      console.error(err);
    }
  };

  const hasChanges =
    JSON.stringify(items) !== JSON.stringify(currentData?.items ?? []) ||
    (notes.trim() || null) !== (currentData?.notes ?? null) ||
    (financialValue ?? null) !== (currentData?.financial_value ?? null);

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-muted/40 border border-border/60">
              <SectionIcon className={`w-4 h-4 ${sectionConfig.color}`} />
            </div>
            <span>{sectionConfig.label}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* ── Formulário para novo item ─────────────────────────── */}
          <div className="p-3.5 rounded-xl bg-muted/20 border border-border/60 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-emerald-400" />
                <span>Adicionar Item {isRecurrence ? 'com Valor & Periodicidade' : ''}</span>
              </Label>
              {isRecurrence && (
                <span className="text-[10px] text-muted-foreground font-mono">Assinatura mensal/anual</span>
              )}
            </div>

            <div className="space-y-2">
              <Input
                ref={newItemRef}
                placeholder={`Nome do item (ex.: ${
                  sectionKey === 'custos'
                    ? 'CapCut Pro, Servidor Cloud...'
                    : sectionKey === 'fontes'
                    ? 'Comissões TikTok, Anúncios...'
                    : sectionKey === 'canais'
                    ? 'WhatsApp API, TikTok Ads...'
                    : sectionKey === 'recursos'
                    ? 'ChatGPT Plus, Make.com...'
                    : sectionKey === 'parcerias'
                    ? 'Afiliados, Fornecedor...'
                    : 'Nome do item...'
                })`}
                value={newItemText}
                onChange={(e) => setNewItemText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isRecurrence) {
                    e.preventDefault();
                    addItem();
                  }
                }}
                className="text-sm h-9 bg-background/90"
              />

              {isRecurrence && (
                <div className="grid grid-cols-12 gap-2 pt-1">
                  {/* Valor do item em R$ */}
                  <div className="col-span-7 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-muted-foreground">
                      R$
                    </span>
                    <Input
                      type="text"
                      inputMode="decimal"
                      placeholder="0,00"
                      value={newItemValueText}
                      onChange={handleNewItemValueChange}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addItem();
                        }
                      }}
                      className="pl-9 text-sm h-9 font-mono font-bold bg-background/90"
                    />
                  </div>

                  {/* Recorrência: Mensal ou Anual */}
                  <div className="col-span-5 flex items-center">
                    <div className="inline-flex rounded-lg border border-border/70 p-0.5 bg-background/90 h-9 w-full">
                      <button
                        type="button"
                        onClick={() => setNewItemRecurrence('mensal')}
                        className={`flex-1 text-[11px] font-medium rounded-md transition-colors cursor-pointer ${
                          newItemRecurrence === 'mensal'
                            ? 'bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        Mensal
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewItemRecurrence('anual')}
                        className={`flex-1 text-[11px] font-medium rounded-md transition-colors cursor-pointer ${
                          newItemRecurrence === 'anual'
                            ? 'bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        Anual
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-1">
              <Button
                type="button"
                size="sm"
                onClick={addItem}
                disabled={!newItemText.trim()}
                className="h-8 px-3 text-xs bg-emerald-500 hover:bg-emerald-600 text-black font-semibold cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Adicionar à lista
              </Button>
            </div>
          </div>

          {/* ── Lista de itens existentes ─────────────────────────── */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>Itens cadastrados</span>
              <span className="font-mono font-normal">({items.length})</span>
            </Label>

            {items.length > 0 ? (
              <ul className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {items.map((rawItem, idx) => {
                  const itemObj = parseBmcItem(rawItem);
                  const hasVal = itemObj.value != null && !isNaN(itemObj.value);
                  const recBadge = formatItemRecurrence(itemObj.recurrence);

                  return (
                    <li
                      key={idx}
                      className="flex items-center justify-between gap-2 group px-3 py-2 rounded-lg bg-muted/30 border border-border/50 hover:border-border transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <GripVertical className="w-3.5 h-3.5 text-muted-foreground/30 flex-shrink-0" />
                        <span className="text-sm text-foreground/90 truncate">{itemObj.text}</span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {hasVal && (
                          <span className="text-xs font-mono font-bold text-foreground bg-muted/60 px-2 py-0.5 rounded border border-border/60">
                            {formatCurrencyBRL(itemObj.value)}
                            <span className="text-[10px] text-muted-foreground font-normal ml-0.5">{recBadge}</span>
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => removeItem(idx)}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all cursor-pointer"
                          aria-label={`Remover "${itemObj.text}"`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground/60 italic py-2 text-center">
                Nenhum item adicionado ainda.
              </p>
            )}
          </div>

          {/* ── Total do Bloco (R$) ─────────────────────────── */}
          <div className="p-3 rounded-xl bg-muted/20 border border-border/60 space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="bmc-financial-value" className="text-xs font-semibold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                <CircleDollarSign className={`w-3.5 h-3.5 ${sectionConfig.color}`} />
                <span>Valor Financeiro Consolidado do Bloco</span>
              </Label>
              <span className="text-[11px] font-mono text-muted-foreground font-medium">BRL (R$)</span>
            </div>

            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold font-mono text-muted-foreground">
                R$
              </span>
              <Input
                id="bmc-financial-value"
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                value={financialValueText}
                onChange={handleFinancialValueChange}
                className="pl-11 font-mono text-base font-bold tracking-tight bg-background/90"
              />
            </div>

            {isRecurrence && calculatedMonthlySum > 0 && (
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                <span>
                  Soma mensal calculada dos itens:{' '}
                  <strong className="text-foreground font-mono">{formatCurrencyBRL(calculatedMonthlySum)}/mês</strong>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setFinancialValue(calculatedMonthlySum);
                    setFinancialValueText(calculatedMonthlySum.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
                  }}
                  className="text-[11px] font-medium text-emerald-400 hover:text-emerald-300 underline cursor-pointer"
                >
                  Usar soma dos itens
                </button>
              </div>
            )}
          </div>

          {/* ── Notas ──────────────────────────────────────────────────── */}
          <div className="space-y-1.5">
            <Label htmlFor="bmc-notes" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Notas{' '}
              <span className="text-[10px] font-normal lowercase">(opcional)</span>
            </Label>
            <Textarea
              id="bmc-notes"
              placeholder="Observações adicionais sobre esta seção…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              maxLength={1000}
              className="text-xs resize-none bg-background/90"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={isPending || !hasChanges}
            className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold cursor-pointer shadow-xs"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                Salvando…
              </>
            ) : (
              'Salvar'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
