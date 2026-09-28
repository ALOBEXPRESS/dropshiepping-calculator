import { z } from 'zod';
import { NICHE_VALUES } from '@/constants/niches';

// ── Tipos base ──────────────────────────────────────────────────────────────

export type PlatformAccountPlatform = 'tiktok';
export type PlatformAccountSignupMethod = 'google' | 'apple' | 'email';

// ── platform_metadata discriminado por signup_method ───────────────────────

export const platformMetadataGoogleSchema = z.object({
  signup_method: z.literal('google'),
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
});

export const platformMetadataAppleSchema = z.object({
  signup_method: z.literal('apple'),
});

export const platformMetadataEmailSchema = z.object({
  signup_method: z.literal('email'),
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
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// ── Schema Zod para o formulário do wizard ──────────────────────────────────

export const platformAccountSchema = z.object({
  platform: z.literal('tiktok'),
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
  // Campo condicional para signup_method = 'google'
  google_account_age_years: z.number().min(0).max(30).nullable().optional(),
  google_ads_invested_brl: z.number().min(0).nullable().optional(),
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
  if (data.signup_method === 'google') {
    return {
      signup_method: 'google',
      account_age_years: data.google_account_age_years ?? null,
      google_ads_invested_brl: data.google_ads_invested_brl ?? null,
    };
  }
  // apple e email não têm metadados extras por ora
  return null;
}
