import React, { useState, useEffect } from 'react';
import {
  Handshake, Cog, Package, Gem, Users,
  Share2, UserCircle, Receipt, CircleDollarSign,
  Pencil, Plus, TrendingUp, TrendingDown, WalletCards
} from 'lucide-react';
import type { BusinessModelCanvas, BmcSectionKey } from '@/types/businessModelCanvas';
import { BMC_SECTIONS, formatCurrencyBRL, parseBmcItem, formatItemRecurrence } from '@/types/businessModelCanvas';
import { BMCSectionEditor } from './BMCSectionEditor';

// ── Mapa de ícones ─────────────────────────────────────────────────────────

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  Handshake, Cog, Package, Gem, Users,
  Share2, UserCircle, Receipt, CircleDollarSign,
};

// ── Props ──────────────────────────────────────────────────────────────────

interface BMCCanvasGridProps {
  businessCenterId: string;
  bcName: string;
  canvas: BusinessModelCanvas;
  initialSection?: BmcSectionKey | null;
}

// ── Bloco individual ──────────────────────────────────────────────────────

interface BlockProps {
  sectionKey: BmcSectionKey;
  canvas: BusinessModelCanvas;
  onEdit: (key: BmcSectionKey) => void;
}

function BMCBlock({ sectionKey, canvas, onEdit }: BlockProps) {
  const config = BMC_SECTIONS[sectionKey];
  const Icon = ICON_MAP[config.icon] ?? Gem;
  const data = canvas[sectionKey];
  const hasItems = data && data.items.length > 0;
  const hasValue = data?.financial_value != null && !isNaN(data.financial_value);

  return (
    <div
      className="group relative flex flex-col h-full min-h-[175px] p-4 rounded-xl border border-border/60 bg-card/75 hover:bg-card hover:border-border transition-all duration-200 shadow-xs"
    >
      {/* Header do bloco */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1.5 rounded-lg bg-muted/40 border border-border/60 shrink-0">
            <Icon className={`w-3.5 h-3.5 ${config.color}`} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-muted-foreground/60 font-mono font-medium uppercase tracking-wider leading-none mb-0.5">
              {config.number}
            </p>
            <p className="text-xs font-semibold text-foreground/90 leading-tight truncate">
              {config.label}
            </p>
          </div>
        </div>

        {/* Lado direito: Valor em R$ + Botão Editar */}
        <div className="flex items-center gap-1.5 shrink-0">
          {hasValue ? (
            <button
              type="button"
              onClick={() => onEdit(sectionKey)}
              title="Clique para editar valor ou itens"
              className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold tracking-tight cursor-pointer border border-border/60 bg-muted/40 hover:bg-muted text-foreground transition-all shadow-xs flex items-center gap-1"
            >
              <span>{formatCurrencyBRL(data.financial_value)}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onEdit(sectionKey)}
              className="text-[10px] font-mono font-medium text-muted-foreground/40 hover:text-muted-foreground transition-colors px-1.5 py-0.5 rounded border border-dashed border-border/40 hover:border-border cursor-pointer opacity-0 group-hover:opacity-100"
              title="Definir valor em R$"
            >
              + R$
            </button>
          )}

          {/* Botão editar */}
          <button
            type="button"
            onClick={() => onEdit(sectionKey)}
            className="opacity-0 group-hover:opacity-100 shrink-0 p-1 rounded-md transition-all duration-150 cursor-pointer text-muted-foreground hover:text-foreground hover:bg-muted/60"
            aria-label={`Editar ${config.label}`}
          >
            {hasItems || hasValue ? (
              <Pencil className="w-3 h-3" />
            ) : (
              <Plus className="w-3 h-3" />
            )}
          </button>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="flex-1">
        {hasItems ? (
          <ul className="space-y-1.5">
            {data!.items.map((rawItem, idx) => {
              const parsed = parseBmcItem(rawItem);
              const hasItemVal = parsed.value != null && !isNaN(parsed.value);
              const recLabel = formatItemRecurrence(parsed.recurrence);

              return (
                <li key={idx} className="flex items-start justify-between gap-1.5 group/item">
                  <div className="flex items-start gap-1.5 min-w-0 flex-1">
                    <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${config.dotColor} opacity-75`} />
                    <span className="text-xs text-foreground/80 leading-snug break-words">
                      {parsed.text}
                    </span>
                  </div>
                  {hasItemVal && (
                    <span className="shrink-0 text-[10px] font-mono font-medium text-foreground/90 bg-muted/60 px-1.5 py-0.5 rounded border border-border/40">
                      {formatCurrencyBRL(parsed.value)}{recLabel}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <button
            type="button"
            onClick={() => onEdit(sectionKey)}
            className="w-full h-full flex flex-col items-center justify-center gap-1.5 min-h-[80px] rounded-lg border border-dashed border-border/30 hover:border-border/60 transition-colors group/empty cursor-pointer"
          >
            <Plus className="w-4 h-4 text-muted-foreground/30 group-hover/empty:text-muted-foreground/60 transition-colors" />
            <span className="text-[10px] text-muted-foreground/50 group-hover/empty:text-muted-foreground/70 transition-colors">
              Adicionar itens e valor
            </span>
          </button>
        )}
      </div>

      {/* Rodapé do bloco: notas se houver */}
      {data?.notes && (
        <div className="mt-2.5 pt-2 border-t border-border/30">
          <p className="text-[10px] text-muted-foreground/70 line-clamp-1 italic" title={data.notes}>
            {data.notes}
          </p>
        </div>
      )}
    </div>
  );
}

// ── Grid principal ────────────────────────────────────────────────────────

export function BMCCanvasGrid({ businessCenterId, canvas, initialSection }: BMCCanvasGridProps) {
  const [editingSection, setEditingSection] = useState<BmcSectionKey | null>(initialSection ?? null);

  useEffect(() => {
    if (initialSection) {
      setEditingSection(initialSection);
    }
  }, [initialSection]);

  // Cálculos financeiros consolidados
  const totalCustos = canvas.custos?.financial_value ?? 0;
  const totalReceitas = canvas.fontes?.financial_value ?? 0;
  const saldoOperacional = totalReceitas - totalCustos;
  const margem = totalReceitas > 0 ? ((saldoOperacional / totalReceitas) * 100).toFixed(1) : null;
  const totalRecursos = canvas.recursos?.financial_value ?? 0;
  const hasAnyFinancial = Object.values(canvas).some(
    (sec) => sec?.financial_value != null && sec.financial_value > 0
  );

  return (
    <div className="space-y-4">
      {/*
        Layout do BMC (igual às imagens de referência):
        ┌──────────┬──────────┬──────────────┬──────────────┬──────────┐
        │          │Atividades│              │Relacionamento│          │
        │Parcerias │──────────│   Proposta   │──────────────│Segmentos │
        │          │ Recursos │              │    Canais    │          │
        ├──────────┴──────────┴──────────────┴──────────────┴──────────┤
        │         Custos (50%)              │   Fontes de Renda (50%)  │
        └───────────────────────────────────┴──────────────────────────┘

        CSS Grid: 5 colunas iguais, 3 linhas (2 + 1 footer)
      */}
      <div className="grid grid-cols-5 gap-3 w-full">

        {/* Linha 1+2: 5 colunas, Proposta ocupa 2 linhas */}

        {/* Col 1: Parcerias — ocupa 2 linhas */}
        <div className="row-span-2">
          <BMCBlock
            sectionKey="parcerias"
            canvas={canvas}
            onEdit={setEditingSection}
          />
        </div>

        {/* Col 2: Atividades (linha 1) + Recursos (linha 2) */}
        <div className="flex flex-col gap-3">
          <BMCBlock
            sectionKey="atividades"
            canvas={canvas}
            onEdit={setEditingSection}
          />
          <BMCBlock
            sectionKey="recursos"
            canvas={canvas}
            onEdit={setEditingSection}
          />
        </div>

        {/* Col 3: Proposta — ocupa 2 linhas */}
        <div className="row-span-2">
          <BMCBlock
            sectionKey="proposta"
            canvas={canvas}
            onEdit={setEditingSection}
          />
        </div>

        {/* Col 4: Relacionamentos (linha 1) + Canais (linha 2) */}
        <div className="flex flex-col gap-3">
          <BMCBlock
            sectionKey="relacionamentos"
            canvas={canvas}
            onEdit={setEditingSection}
          />
          <BMCBlock
            sectionKey="canais"
            canvas={canvas}
            onEdit={setEditingSection}
          />
        </div>

        {/* Col 5: Segmentos — ocupa 2 linhas */}
        <div className="row-span-2">
          <BMCBlock
            sectionKey="segmentos"
            canvas={canvas}
            onEdit={setEditingSection}
          />
        </div>

        {/* Linha 3: Custos (50%) + Fontes (50%) */}
        <div className="col-span-5 grid grid-cols-1 md:grid-cols-2 gap-3">
          <BMCBlock
            sectionKey="custos"
            canvas={canvas}
            onEdit={setEditingSection}
          />
          <BMCBlock
            sectionKey="fontes"
            canvas={canvas}
            onEdit={setEditingSection}
          />
        </div>
      </div>

      {/* ── Barra de Inteligência Financeira do Negócio ──────────────── */}
      <div className="rounded-xl border border-border/70 bg-card/60 backdrop-blur-md p-4 shadow-sm transition-all">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <WalletCards className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <span>Inteligência Financeira do Canvas</span>
                {!hasAnyFinancial && (
                  <span className="text-[10px] text-muted-foreground font-normal font-sans">
                    (defina valores clicando no + R$ de cada bloco)
                  </span>
                )}
              </p>
              <p className="text-[11px] text-muted-foreground">
                Consolidação operacional de receitas, custos e margem estimada
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Custos Totais */}
            <div className="p-2.5 rounded-lg bg-muted/30 border border-red-500/20">
              <span className="text-[10px] text-red-400/80 uppercase font-mono font-medium block">
                Total Custos (8)
              </span>
              <span className="text-sm font-bold font-mono text-red-400 block mt-0.5">
                {formatCurrencyBRL(totalCustos)}
              </span>
            </div>

            {/* Receitas Totais */}
            <div className="p-2.5 rounded-lg bg-muted/30 border border-emerald-500/20">
              <span className="text-[10px] text-emerald-400/80 uppercase font-mono font-medium block">
                Total Fontes (9)
              </span>
              <span className="text-sm font-bold font-mono text-emerald-400 block mt-0.5">
                {formatCurrencyBRL(totalReceitas)}
              </span>
            </div>

            {/* Recursos / Ativos */}
            <div className="p-2.5 rounded-lg bg-muted/30 border border-amber-500/20">
              <span className="text-[10px] text-amber-400/80 uppercase font-mono font-medium block">
                Recursos (3)
              </span>
              <span className="text-sm font-bold font-mono text-amber-400 block mt-0.5">
                {formatCurrencyBRL(totalRecursos)}
              </span>
            </div>

            {/* Resultado Operacional */}
            <div className={`p-2.5 rounded-lg bg-muted/30 border ${saldoOperacional >= 0 ? 'border-emerald-500/30' : 'border-rose-500/30'}`}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground uppercase font-mono font-medium block">
                  Balanço
                </span>
                {saldoOperacional >= 0 ? (
                  <TrendingUp className="w-3 h-3 text-emerald-400" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-rose-400" />
                )}
              </div>
              <span className={`text-sm font-bold font-mono block mt-0.5 ${saldoOperacional >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {saldoOperacional >= 0 ? '+' : ''}{formatCurrencyBRL(saldoOperacional)}
                {margem && (
                  <span className="text-[10px] font-normal text-muted-foreground ml-1">
                    ({margem}%)
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Dialog de edição */}
      {editingSection && (
        <BMCSectionEditor
          open={!!editingSection}
          onOpenChange={(open) => { if (!open) setEditingSection(null); }}
          businessCenterId={businessCenterId}
          sectionKey={editingSection}
          currentData={canvas[editingSection] ?? null}
        />
      )}
    </div>
  );
}
