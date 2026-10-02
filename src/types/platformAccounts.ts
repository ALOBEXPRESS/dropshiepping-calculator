import { z } from 'zod';
import { NICHE_VALUES } from '@/constants/niches';

// ── Tipos base ──────────────────────────────────────────────────────────────

export type PlatformAccountPlatform = 'tiktok' | 'google' | 'meta';
export type PlatformAccountSignupMethod = 'google' | 'apple' | 'email';
/** Sub-tipo para contas Meta: qual rede social */
export type MetaAccountType = 'instagram' | 'facebook' | 'threads';

// ── platform_metadata discriminado por signup_method ───────────────────────

export const platformMetadataGoogleSchema = z.object({
  signup_method: z.literal('google'),
  email: z.string().email('E-mail inválido').optional().nullable(),
  account_age_years: z
    .number()
    .min(0, 'Deve ser 0 ou mais')
    .max(30)
    .nullable()
    .optional(),
  google_ads_invested_brl: z
    .number()
    .min(0, 'Deve ser 0 ou mais')
    .nullable()
    .optional(),
  google_ads_currency: z.string().optional().nullable(),
});

export const platformMetadataAppleSchema = z.object({
  signup_method: z.literal('apple'),
  email: z.string().email('E-mail inválido').optional().nullable(),
});

export const platformMetadataEmailSchema = z.object({
  signup_method: z.literal('email'),
  email: z.string().email('E-mail inválido').optional().nullable(),
});

export const platformMetadataSchema = z.discriminatedUnion('signup_method', [
  platformMetadataGoogleSchema,
  platformMetadataAppleSchema,
  platformMetadataEmailSchema,
]);

export type PlatformMetadata = z.infer<typeof platformMetadataSchema>;

// ── Interface principal (espelho do banco) ──────────────────────────────────

export interface PlatformAccount {
  id: string;
  organization_id: string;
  platform: PlatformAccountPlatform;
  country: string;
  name: string;
  holder_name: string;
  nickname: string | null;
  profile_photo_url: string | null;
  bio: string | null;
  niche: (typeof NICHE_VALUES)[number];
  signup_method: PlatformAccountSignupMethod;
  phone: string | null;
  birth_date: string | null;
  platform_metadata: PlatformMetadata | null;
  email?: string | null;
  proxy_id?: string | null;
  device_id?: string | null;
  device_ids?: string[];
  meta_account_type?: MetaAccountType | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// ── Schema Zod para o formulário do wizard ──────────────────────────────────

export const platformAccountSchema = z.object({
  platform: z.enum(['tiktok', 'google', 'meta'] as const),
  country: z.string().min(2, 'País é obrigatório'),
  name: z.string().trim().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  holder_name: z.string().trim().min(2, 'Nome do titular é obrigatório'),
  nickname: z.string().trim().optional().or(z.literal('')),
  profile_photo_url: z.string().nullable().optional(),
  bio: z.string().trim().max(500, 'Bio deve ter no máximo 500 caracteres').optional().or(z.literal('')),
  niche: z.enum(NICHE_VALUES, { message: 'Nicho é obrigatório' }),
  signup_method: z.enum(['google', 'apple', 'email'] as const, {
    message: 'Método de cadastro é obrigatório',
  }),
  phone: z.string().trim().optional().or(z.literal('')),
  birth_date: z.string().optional().or(z.literal('')),
  // Campo email presente nos cadastros (opcional no schema base para compatibilidade)
  email: z.string().email('Informe um e-mail válido').optional().or(z.literal('')),
  // Proxy vinculado
  proxy_id: z.string().uuid().nullable().optional().or(z.literal('')),
  // Dispositivos vinculados (N:N)
  device_id: z.string().uuid().nullable().optional().or(z.literal('')),
  device_ids: z.array(z.string().uuid()).optional(),
  // Campos condicionais para signup_method = 'google'
  google_account_age_years: z.number().min(0).max(30).nullable().optional(),
  google_ads_invested_brl: z.number().min(0).nullable().optional(),
  google_ads_currency: z.string().optional().nullable(),
  // Para Meta: qual rede social (instagram, facebook, threads)
  meta_account_type: z.enum(['instagram', 'facebook', 'threads'] as const).optional().nullable(),
});

export type PlatformAccountFormData = z.infer<typeof platformAccountSchema>;

// ── Filtros ─────────────────────────────────────────────────────────────────

export interface PlatformAccountFilters {
  platform?: PlatformAccountPlatform | 'all';
  search?: string;
}

// ── Helper: monta platform_metadata a partir do form ───────────────────────

export function buildPlatformMetadata(
  data: PlatformAccountFormData
): PlatformMetadata | null {
  const emailValue = data.email?.trim() || null;

  if (data.signup_method === 'google') {
    return {
      signup_method: 'google',
      email: emailValue,
      account_age_years: data.google_account_age_years ?? null,
      google_ads_invested_brl: data.google_ads_invested_brl ?? null,
      google_ads_currency: data.google_ads_currency ?? 'BRL',
    };
  }
  if (data.signup_method === 'apple') {
    if (emailValue) {
      return {
        signup_method: 'apple',
        email: emailValue,
      };
    }
    return null;
  }
  if (data.signup_method === 'email') {
    if (emailValue) {
      return {
        signup_method: 'email',
        email: emailValue,
      };
    }
    return null;
  }
  return null;
}
