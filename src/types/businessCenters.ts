import { z } from 'zod';

// ── Tipos base ───────────────────────────────────────────────────────────────

export type BusinessCenterPlatform = 'tiktok';
export type BusinessCenterType = 'advertiser' | 'agency';

// ── Interface principal (espelho do banco) ───────────────────────────────────

export interface BusinessCenter {
  id: string;
  organization_id: string;
  platform: BusinessCenterPlatform;
  /** ID externo do Business Center no TikTok Ads Manager */
  bc_id: string;
  name: string | null;
  business_type: BusinessCenterType;
  company_legal_name: string | null;
  country: string;
  timezone: string;
  currency: string;
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
  business_type: z.enum(['advertiser', 'agency']),
  company_legal_name: z.string().trim().optional().or(z.literal('')),
  name: z.string().trim().min(2, 'Nome do Business Center deve ter no mínimo 2 caracteres'),
  country: z.string().min(2, 'País é obrigatório'),
  timezone: z.string().min(1, 'Fuso horário é obrigatório'),
  currency: z.string().min(1, 'Moeda é obrigatória'),
  bc_id: z.string().trim().optional().or(z.literal('')),
  notes: z.string().trim().max(500, 'Notas devem ter no máximo 500 caracteres').optional().or(z.literal('')),
});

export type BusinessCenterFormData = z.infer<typeof businessCenterSchema>;

// ── Filtros ──────────────────────────────────────────────────────────────────

export interface BusinessCenterFilters {
  search?: string;
}
