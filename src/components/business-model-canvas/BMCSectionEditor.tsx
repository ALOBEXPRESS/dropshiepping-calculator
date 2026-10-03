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
import type { BusinessModelCanvasSection, BmcSectionKey } from '@/types/businessModelCanvas';
import { BMC_SECTIONS } from '@/types/businessModelCanvas';
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

  const [items, setItems] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [newItem, setNewItem] = useState('');
  const newItemRef = useRef<HTMLInputElement>(null);

  const { mutateAsync: upsert, isPending } = useUpsertBMCSection();

  // Preenche os campos com os dados atuais ao abrir
  useEffect(() => {
    if (open) {
      setItems(currentData?.items ?? []);
      setNotes(currentData?.notes ?? '');
      setNewItem('');
    }
  }, [open, currentData]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const addItem = () => {
    const trimmed = newItem.trim();
    if (!trimmed) return;
    if (items.includes(trimmed)) {
      toast.warning('Item já existe na lista.');
      return;
    }
    setItems((prev) => [...prev, trimmed]);
    setNewItem('');
    // Foca no input para adicionar mais
    setTimeout(() => newItemRef.current?.focus(), 50);
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleNewItemKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addItem();
    }
  };

  const handleSave = async () => {
    try {
      await upsert({
        business_center_id: businessCenterId,
        section: sectionKey,
        items,
        notes: notes.trim() || null,
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
    (notes.trim() || null) !== (currentData?.notes ?? null);

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5">
            <div className={`p-1.5 rounded-lg ${sectionConfig.bgColor} border ${sectionConfig.borderColor}`}>
              <SectionIcon className={`w-4 h-4 ${sectionConfig.color}`} />
            </div>
            <span>{sectionConfig.label}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-1">
          {/* ── Lista de itens ─────────────────────────────────────────── */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Itens
              <span className="ml-1.5 text-xs text-muted-foreground font-normal">
                ({items.length})
              </span>
            </Label>

            {/* Itens existentes */}
            {items.length > 0 && (
              <ul className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                {items.map((item, idx) => (
                  <li
                    key={idx}
                    className="flex items-center gap-2 group px-3 py-2 rounded-lg bg-muted/40 border border-border/50 hover:border-border transition-colors"
                  >
                    <GripVertical className="w-3.5 h-3.5 text-muted-foreground/40 flex-shrink-0" />
                    <span className="flex-1 text-sm">{item}</span>
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                      aria-label={`Remover "${item}"`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {/* Input para novo item */}
            <div className="flex gap-2">
              <Input
                ref={newItemRef}
                placeholder={`Adicionar item a ${sectionConfig.label}…`}
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                onKeyDown={handleNewItemKeyDown}
                className="flex-1 text-sm"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addItem}
                disabled={!newItem.trim()}
                className="shrink-0"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Pressione Enter ou clique em + para adicionar
            </p>
          </div>

          {/* ── Notas ──────────────────────────────────────────────────── */}
          <div className="space-y-2">
            <Label htmlFor="bmc-notes" className="text-sm font-medium">
              Notas{' '}
              <span className="text-xs text-muted-foreground font-normal">(opcional)</span>
            </Label>
            <Textarea
              id="bmc-notes"
              placeholder="Observações adicionais sobre esta seção…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              maxLength={1000}
              className="text-sm resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">
              {notes.length}/1000
            </p>
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
            className={`${sectionConfig.bgColor} ${sectionConfig.color} border ${sectionConfig.borderColor} hover:brightness-110`}
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
