import { z } from 'zod';

// ── Tipos base ───────────────────────────────────────────────────────────────

export type BusinessCenterPlatform = 'tiktok' | 'meta' | 'google';
export type BusinessCenterType = 'advertiser' | 'agency';
/** Sub-tipo para Meta Business Portfolio: qual rede social vinculada */
export type MetaLinkedNetwork = 'instagram' | 'facebook';

// ── Interface principal (espelho do banco) ───────────────────────────────────

export interface BusinessCenter {
  id: string;
  organization_id: string;
  platform: BusinessCenterPlatform;
  /** ID externo do Business Center no TikTok Ads Manager / Meta Business Suite / Google Ads Manager */
  bc_id: string;
  name: string | null;
  business_type: BusinessCenterType;
  company_legal_name: string | null;
  country: string;
  timezone: string;
  currency: string;
  notes: string | null;
  /** Para Meta: qual rede social está vinculada */
  meta_linked_network?: MetaLinkedNetwork | null;
  /** Para Meta: ID da conta de plataforma (Instagram/Facebook) vinculada */
  meta_linked_account_id?: string | null;
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
  platform: z.enum(['tiktok', 'meta', 'google']),
  business_type: z.enum(['advertiser', 'agency']),
  company_legal_name: z.string().trim().optional().or(z.literal('')),
  name: z.string().trim().min(2, 'Nome do Business Center deve ter no mínimo 2 caracteres'),
  country: z.string().min(2, 'País é obrigatório'),
  timezone: z.string().min(1, 'Fuso horário é obrigatório'),
  currency: z.string().min(1, 'Moeda é obrigatória'),
  bc_id: z.string().trim().optional().or(z.literal('')),
  notes: z.string().trim().max(500, 'Notas devem ter no máximo 500 caracteres').optional().or(z.literal('')),
  /** Meta: rede social vinculada */
  meta_linked_network: z.enum(['instagram', 'facebook']).optional().nullable(),
  /** Meta: ID UUID da conta de plataforma vinculada */
  meta_linked_account_id: z.string().uuid().optional().nullable().or(z.literal('')),
});

export type BusinessCenterFormData = z.infer<typeof businessCenterSchema>;

// ── Filtros ──────────────────────────────────────────────────────────────────

export interface BusinessCenterFilters {
  search?: string;
}

// ── Labels e config de plataforma ────────────────────────────────────────────

export const BC_PLATFORM_CONFIG: Record<BusinessCenterPlatform, {
  label: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
  idLabel: string;
  idPlaceholder: string;
}> = {
  tiktok: {
    label: 'TikTok Business Center',
    description: 'Gerencie suas contas do TikTok Ads Manager',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/20',
    idLabel: 'ID do Business Center (TikTok)',
    idPlaceholder: 'Ex: 7123456789012345678 (deixe vazio para gerar)',
  },
  meta: {
    label: 'Meta Business Portfolio',
    description: 'Gerencie suas contas do Meta Business Suite (Instagram / Facebook)',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
    idLabel: 'ID do Business Portfolio (Meta)',
    idPlaceholder: 'Ex: 123456789012345 (deixe vazio para gerar)',
  },
  google: {
    label: 'Google Ads Manager',
    description: 'Gerencie suas contas do Google Ads',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/20',
    idLabel: 'ID do Google Ads Manager',
    idPlaceholder: 'Ex: 123-456-7890 (deixe vazio para gerar)',
  },
};
