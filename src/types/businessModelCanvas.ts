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

export const BMC_SECTIONS: Record<BmcSectionKey, BmcSectionConfig> = {
  parcerias: {
    key: 'parcerias',
    number: 1,
    label: 'Parcerias Chave',
    description: 'Fornecedores, parceiros e aliados estratégicos do negócio.',
    icon: 'Handshake',
    color: 'text-sky-400',
    bgColor: 'bg-sky-500/10',
    borderColor: 'border-sky-500/25',
    dotColor: 'bg-sky-400',
  },
  atividades: {
    key: 'atividades',
    number: 2,
    label: 'Atividades Chave',
    description: 'O que o negócio faz de mais importante para funcionar.',
    icon: 'Cog',
    color: 'text-violet-400',
    bgColor: 'bg-violet-500/10',
    borderColor: 'border-violet-500/25',
    dotColor: 'bg-violet-400',
  },
  recursos: {
    key: 'recursos',
    number: 3,
    label: 'Recursos Chave',
    description: 'Ativos essenciais para entregar a proposta de valor.',
    icon: 'Package',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/25',
    dotColor: 'bg-amber-400',
  },
  proposta: {
    key: 'proposta',
    number: 4,
    label: 'Proposta de Valor',
    description: 'Por que o cliente escolhe este negócio.',
    icon: 'Gem',
    color: 'text-rose-400',
    bgColor: 'bg-rose-500/10',
    borderColor: 'border-rose-500/25',
    dotColor: 'bg-rose-400',
  },
  relacionamentos: {
    key: 'relacionamentos',
    number: 5,
    label: 'Relacionamentos',
    description: 'Como o negócio se relaciona com os clientes.',
    icon: 'Users',
    color: 'text-teal-400',
    bgColor: 'bg-teal-500/10',
    borderColor: 'border-teal-500/25',
    dotColor: 'bg-teal-400',
  },
  canais: {
    key: 'canais',
    number: 6,
    label: 'Canais',
    description: 'Como a proposta de valor chega até o cliente.',
    icon: 'Share2',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/25',
    dotColor: 'bg-orange-400',
  },
  segmentos: {
    key: 'segmentos',
    number: 7,
    label: 'Segmentos de Clientes',
    description: 'Para quem o negócio cria valor.',
    icon: 'UserCircle',
    color: 'text-indigo-400',
    bgColor: 'bg-indigo-500/10',
    borderColor: 'border-indigo-500/25',
    dotColor: 'bg-indigo-400',
  },
  custos: {
    key: 'custos',
    number: 8,
    label: 'Estrutura de Custos',
    description: 'Principais custos para operar o negócio.',
    icon: 'Receipt',
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/25',
    dotColor: 'bg-red-400',
  },
  fontes: {
    key: 'fontes',
    number: 9,
    label: 'Fontes de Renda',
    description: 'Como o negócio gera receita.',
    icon: 'CircleDollarSign',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/25',
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
});

export type BmcSectionUpsertData = z.infer<typeof bmcSectionUpsertSchema>;
