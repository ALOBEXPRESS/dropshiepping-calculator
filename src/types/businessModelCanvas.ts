import { z } from 'zod';

// ── Enum das 9 seções do BMC ─────────────────────────────────────────────────

export type BmcSectionKey =
  | 'parcerias'
  | 'atividades'
  | 'recursos'
  | 'proposta'
  | 'relacionamentos'
  | 'canais'
  | 'segmentos'
  | 'custos'
  | 'fontes';

export const BMC_SECTION_KEYS: BmcSectionKey[] = [
  'parcerias',
  'atividades',
  'recursos',
  'proposta',
  'relacionamentos',
  'canais',
  'segmentos',
  'custos',
  'fontes',
];

// ── Config de cada seção (label, número, ícone Lucide, cor) ──────────────────

export interface BmcSectionConfig {
  key: BmcSectionKey;
  number: number;
  label: string;
  description: string;
  icon: string;           // nome do ícone Lucide
  color: string;          // classe Tailwind text-*
  bgColor: string;        // classe Tailwind bg-*
  borderColor: string;    // classe Tailwind border-*
  dotColor: string;       // classe Tailwind bg-* estática
}

export const BMC_RECURRENCE_SECTIONS: BmcSectionKey[] = [
  'fontes',
  'custos',
  'canais',
  'recursos',
  'parcerias',
];

export function isRecurrenceSection(key: BmcSectionKey): boolean {
  return BMC_RECURRENCE_SECTIONS.includes(key);
}

export type BmcRecurrence = 'mensal' | 'anual' | 'unico';

export interface BmcItemObject {
  text: string;
  value?: number | null;
  recurrence?: BmcRecurrence | null;
}

export function parseBmcItem(raw: string): BmcItemObject {
  if (!raw) return { text: '' };
  const trimmed = raw.trim();

  // 1. Formato JSON: {"text":"...", "value":150, "recurrence":"mensal"}
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === 'object') {
        const text = parsed.text || parsed.name || '';
        const value = typeof parsed.value === 'number'
          ? parsed.value
          : (parsed.value ? parseFloat(parsed.value) : null);
        const recurrence = parsed.recurrence || null;
        return {
          text,
          value: value != null && !isNaN(value) ? value : null,
          recurrence: recurrence === 'anual' || recurrence === 'mensal' || recurrence === 'unico' ? recurrence : null,
        };
      }
    } catch {
      // continua para outros formatos
    }
  }

  // 2. Formato Tag: "Item [R$ 150,00/mês]" ou "Item [150.00 | anual]"
  const match = trimmed.match(/^(.*?)\s*\[(?:R\$\s*)?([0-9.,]+)(?:\s*(?:\||\/)\s*(mensal|anual|mês|mes|ano|único|unico))?\]\s*$/i);
  if (match) {
    const text = match[1].trim();
    const cleanNum = match[2].replace(/\./g, '').replace(',', '.');
    const val = parseFloat(cleanNum);
    const recStr = match[3]?.toLowerCase();
    let recurrence: BmcRecurrence | null = null;
    if (recStr === 'mensal' || recStr === 'mês' || recStr === 'mes') recurrence = 'mensal';
    else if (recStr === 'anual' || recStr === 'ano') recurrence = 'anual';
    else if (recStr === 'unico' || recStr === 'único') recurrence = 'unico';

    return {
      text,
      value: isNaN(val) ? null : val,
      recurrence,
    };
  }

  return { text: trimmed };
}

export function serializeBmcItem(item: BmcItemObject): string {
  if ((item.value == null || isNaN(item.value)) && !item.recurrence) {
    return item.text.trim();
  }
  return JSON.stringify({
    text: item.text.trim(),
    value: item.value ?? null,
    recurrence: item.recurrence ?? null,
  });
}

export function formatItemRecurrence(recurrence: BmcRecurrence | null | undefined): string {
  if (recurrence === 'mensal') return '/mês';
  if (recurrence === 'anual') return '/ano';
  if (recurrence === 'unico') return ' (único)';
  return '';
}

export function getMonthlyEquivalent(item: BmcItemObject): number {
  if (!item.value || isNaN(item.value)) return 0;
  if (item.recurrence === 'anual') return item.value / 12;
  return item.value;
}

export const BMC_SECTIONS: Record<BmcSectionKey, BmcSectionConfig> = {
  parcerias: {
    key: 'parcerias',
    number: 1,
    label: 'Parcerias Chave',
    description: 'Fornecedores, parceiros e aliados estratégicos do negócio.',
    icon: 'Handshake',
    color: 'text-sky-400',
    bgColor: 'bg-muted/30',
    borderColor: 'border-border/60',
    dotColor: 'bg-sky-400',
  },
  atividades: {
    key: 'atividades',
    number: 2,
    label: 'Atividades Chave',
    description: 'O que o negócio faz de mais importante para funcionar.',
    icon: 'Cog',
    color: 'text-violet-400',
    bgColor: 'bg-muted/30',
    borderColor: 'border-border/60',
    dotColor: 'bg-violet-400',
  },
  recursos: {
    key: 'recursos',
    number: 3,
    label: 'Recursos Chave',
    description: 'Ativos essenciais para entregar a proposta de valor.',
    icon: 'Package',
    color: 'text-amber-400',
    bgColor: 'bg-muted/30',
    borderColor: 'border-border/60',
    dotColor: 'bg-amber-400',
  },
  proposta: {
    key: 'proposta',
    number: 4,
    label: 'Proposta de Valor',
    description: 'Por que o cliente escolhe este negócio.',
    icon: 'Gem',
    color: 'text-rose-400',
    bgColor: 'bg-muted/30',
    borderColor: 'border-border/60',
    dotColor: 'bg-rose-400',
  },
  relacionamentos: {
    key: 'relacionamentos',
    number: 5,
    label: 'Relacionamentos',
    description: 'Como o negócio se relaciona com os clientes.',
    icon: 'Users',
    color: 'text-teal-400',
    bgColor: 'bg-muted/30',
    borderColor: 'border-border/60',
    dotColor: 'bg-teal-400',
  },
  canais: {
    key: 'canais',
    number: 6,
    label: 'Canais',
    description: 'Como a proposta de valor chega até o cliente.',
    icon: 'Share2',
    color: 'text-orange-400',
    bgColor: 'bg-muted/30',
    borderColor: 'border-border/60',
    dotColor: 'bg-orange-400',
  },
  segmentos: {
    key: 'segmentos',
    number: 7,
    label: 'Segmentos de Clientes',
    description: 'Para quem o negócio cria valor.',
    icon: 'UserCircle',
    color: 'text-indigo-400',
    bgColor: 'bg-muted/30',
    borderColor: 'border-border/60',
    dotColor: 'bg-indigo-400',
  },
  custos: {
    key: 'custos',
    number: 8,
    label: 'Estrutura de Custos',
    description: 'Principais custos para operar o negócio.',
    icon: 'Receipt',
    color: 'text-red-400',
    bgColor: 'bg-muted/30',
    borderColor: 'border-border/60',
    dotColor: 'bg-red-400',
  },
  fontes: {
    key: 'fontes',
    number: 9,
    label: 'Fontes de Renda',
    description: 'Como o negócio gera receita.',
    icon: 'CircleDollarSign',
    color: 'text-emerald-400',
    bgColor: 'bg-muted/30',
    borderColor: 'border-border/60',
    dotColor: 'bg-emerald-400',
  },
};

// ── Interface espelho do banco ────────────────────────────────────────────────

export interface BusinessModelCanvasSection {
  id: string;
  organization_id: string;
  business_center_id: string;
  section: BmcSectionKey;
  items: string[];
  notes: string | null;
  financial_value?: number | null;
  created_at: string;
  updated_at: string;
}

/** Um objeto com todas as 9 seções de um BC, seções sem registro ficam null */
export type BusinessModelCanvas = Record<BmcSectionKey, BusinessModelCanvasSection | null>;

// ── Schema Zod para upsert ────────────────────────────────────────────────────

export const bmcSectionUpsertSchema = z.object({
  business_center_id: z.string().uuid('BC inválido'),
  section: z.enum([
    'parcerias',
    'atividades',
    'recursos',
    'proposta',
    'relacionamentos',
    'canais',
    'segmentos',
    'custos',
    'fontes',
  ]),
  items: z.array(z.string().trim().min(1)).default([]),
  notes: z.string().trim().max(1000).optional().nullable(),
  financial_value: z.number().optional().nullable(),
});

export type BmcSectionUpsertData = z.infer<typeof bmcSectionUpsertSchema>;

// ── Utilitário de formatação de moeda BRL ──────────────────────────────────────

export function formatCurrencyBRL(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) return 'R$ 0,00';
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatCurrencyCompact(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) return 'R$ 0';
  if (Math.abs(value) >= 1_000_000) {
    return `R$ ${(value / 1_000_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}M`;
  }
  if (Math.abs(value) >= 1_000) {
    return `R$ ${(value / 1_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}k`;
  }
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
}
