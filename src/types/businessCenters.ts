import { z } from 'zod';

// ── Tipos base ───────────────────────────────────────────────────────────────

export type BusinessCenterPlatform = 'tiktok';

// ── Interface principal (espelho do banco) ───────────────────────────────────

export interface BusinessCenter {
  id: string;
  organization_id: string;
  platform: BusinessCenterPlatform;
  /** ID externo do Business Center no TikTok Ads Manager */
  bc_id: string;
  name: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

/** BC com contagem de contas de anúncios vinculadas */
export interface BusinessCenterWithStats extends BusinessCenter {
  ad_account_count: number;
}

// ── Schema Zod para formulário ───────────────────────────────────────────────

export const businessCenterSchema = z.object({
  platform: z.literal('tiktok'),
  bc_id: z
    .string()
    .trim()
    .min(1, 'ID do Business Center é obrigatório')
    .regex(/^\d+$/, 'O ID deve conter apenas números'),
  name: z.string().trim().optional().or(z.literal('')),
  notes: z.string().trim().max(500, 'Notas devem ter no máximo 500 caracteres').optional().or(z.literal('')),
});

export type BusinessCenterFormData = z.infer<typeof businessCenterSchema>;

// ── Filtros ──────────────────────────────────────────────────────────────────

export interface BusinessCenterFilters {
  search?: string;
}
