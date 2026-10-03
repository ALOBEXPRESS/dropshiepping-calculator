import React, { useState } from 'react';
import {
  Handshake, Cog, Package, Gem, Users,
  Share2, UserCircle, Receipt, CircleDollarSign,
  Pencil, Plus,
} from 'lucide-react';
import type { BusinessModelCanvas, BmcSectionKey } from '@/types/businessModelCanvas';
import { BMC_SECTIONS } from '@/types/businessModelCanvas';
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

  return (
    <div
      className={`
        group relative flex flex-col h-full min-h-[160px] p-4 rounded-xl
        border ${config.borderColor} bg-card
        hover:${config.bgColor} hover:border-opacity-60
        transition-all duration-200
      `}
    >
      {/* Header do bloco */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${config.bgColor} border ${config.borderColor} flex-shrink-0`}>
            <Icon className={`w-3.5 h-3.5 ${config.color}`} />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground/60 font-medium uppercase tracking-wider leading-none mb-0.5">
              {config.number}
            </p>
            <p className={`text-xs font-semibold ${config.color} leading-tight`}>
              {config.label}
            </p>
          </div>
        </div>

        {/* Botão editar — aparece no hover */}
        <button
          type="button"
          onClick={() => onEdit(sectionKey)}
          className={`
            opacity-0 group-hover:opacity-100 flex-shrink-0
            p-1 rounded-md transition-all duration-150
            text-muted-foreground hover:${config.color} hover:${config.bgColor}
          `}
          aria-label={`Editar ${config.label}`}
        >
          {hasItems ? (
            <Pencil className="w-3 h-3" />
          ) : (
            <Plus className="w-3 h-3" />
          )}
        </button>
      </div>

      {/* Conteúdo */}
      <div className="flex-1">
        {hasItems ? (
          <ul className="space-y-1.5">
            {data!.items.map((item, idx) => (
              <li key={idx} className="flex items-start gap-1.5">
                <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${config.dotColor}`} />
                <span className="text-xs text-foreground/80 leading-snug">{item}</span>
              </li>
            ))}
          </ul>
        ) : (
          <button
            type="button"
            onClick={() => onEdit(sectionKey)}
            className="w-full h-full flex flex-col items-center justify-center gap-1.5 min-h-[80px] rounded-lg border border-dashed border-border/30 hover:border-border/60 transition-colors group/empty"
          >
            <Plus className={`w-4 h-4 ${config.color} opacity-30 group-hover/empty:opacity-60 transition-opacity`} />
            <span className="text-[10px] text-muted-foreground/50 group-hover/empty:text-muted-foreground/70 transition-colors">
              Adicionar
            </span>
          </button>
        )}
      </div>
    </div>
  );
}

// ── Grid principal ────────────────────────────────────────────────────────

export function BMCCanvasGrid({ businessCenterId, canvas }: BMCCanvasGridProps) {
  const [editingSection, setEditingSection] = useState<BmcSectionKey | null>(null);

  return (
    <>
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
    </>
  );
}
