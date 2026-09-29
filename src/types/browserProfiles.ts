import { z } from 'zod';

// ── Tipos base ───────────────────────────────────────────────────────────────

/**
 * CHECK do banco: 'adspower' | 'multilogin' | 'gologin' | 'other'
 * Frontend libera só 'adspower' por enquanto — os demais estão reservados no banco.
 */
export type BrowserProfileTool = 'adspower' | 'multilogin' | 'gologin' | 'other';
export type BrowserProfileStatus = 'active' | 'archived';

/** Ferramentas liberadas no frontend (subset de BrowserProfileTool) */
export const BROWSER_PROFILE_TOOLS_ENABLED: BrowserProfileTool[] = ['adspower'];

/** Todas as ferramentas do CHECK do banco (para referência e futuro) */
export const BROWSER_PROFILE_TOOLS_ALL: BrowserProfileTool[] = [
  'adspower',
  'multilogin',
  'gologin',
  'other',
];

// ── Interface principal (espelho do banco) ───────────────────────────────────

export interface BrowserProfile {
  id: string;
  organization_id: string;
  platform_account_id: string;
  tool: BrowserProfileTool;
  /** ID do perfil na ferramenta externa (ex: serial do AdsPower) */
  external_profile_id: string | null;
  name: string | null;
  notes: string | null;
  status: BrowserProfileStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// ── Schema Zod para formulário ───────────────────────────────────────────────

export const browserProfileSchema = z.object({
  platform_account_id: z.string().uuid('Conta de plataforma é obrigatória'),
  tool: z.enum(['adspower'] as const, {
    message: 'Ferramenta é obrigatória',
  }),
  external_profile_id: z.string().trim().optional().or(z.literal('')),
  name: z.string().trim().optional().or(z.literal('')),
  notes: z
    .string()
    .trim()
    .max(500, 'Notas devem ter no máximo 500 caracteres')
    .optional()
    .or(z.literal('')),
  status: z.enum(['active', 'archived'] as const),
});

export type BrowserProfileFormData = z.infer<typeof browserProfileSchema>;

// ── Filtros ──────────────────────────────────────────────────────────────────

export interface BrowserProfileFilters {
  search?: string;
  tool?: BrowserProfileTool | 'all';
  status?: BrowserProfileStatus | 'all';
  platform_account_id?: string;
}

// ── Labels de UI ─────────────────────────────────────────────────────────────

export const BROWSER_TOOL_LABELS: Record<BrowserProfileTool, string> = {
  adspower: 'AdsPower',
  multilogin: 'Multilogin',
  gologin: 'GoLogin',
  other: 'Outro',
};

export const BROWSER_PROFILE_TOOL_LABELS = BROWSER_TOOL_LABELS;

export const BROWSER_PROFILE_STATUS_LABELS: Record<BrowserProfileStatus, string> = {
  active: 'Ativo',
  archived: 'Arquivado',
};

export const BROWSER_PROFILE_STATUS_COLORS: Record<BrowserProfileStatus, string> = {
  active: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  archived: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/30',
};
