import { z } from 'zod';
import type { PlatformAccount } from './platformAccounts';

export type AdAccountPlatform = 'tiktok';
export type AdAccountStatus = 'active' | 'paused' | 'disabled' | 'archived';
export type AdAccountBillingType = 'prepaid' | 'postpaid';
export type AdAccountPaymentStatus = 'normal' | 'overdue' | 'restricted';
export type AdAccountCurrency = 'BRL' | 'USD' | 'EUR';

export interface TikTokConfigData {
  pixel_id?: string;
  catalog_id?: string;
  tiktok_account_id?: string;
  [key: string]: unknown;
}

export interface AdAccount {
  id: string;
  organization_id: string;
  platform: AdAccountPlatform;
  name: string;
  /** ID numérico do Advertiser no TikTok Ads Manager (texto, anteriormente 'platform_account_id') */
  advertiser_id: string | null;
  business_center_id: string | null;
  status: AdAccountStatus;
  country: string;
  currency: AdAccountCurrency;
  timezone: string;
  legal_name: string | null;
  tax_id: string | null;
  industry: string | null;
  email: string | null;
  phone: string | null;
  billing_type: AdAccountBillingType;
  payment_status: AdAccountPaymentStatus;
  spending_limit: number | null;
  platform_config: TikTokConfigData;
  last_synced_at: string | null;
  /** FK UUID para platform_accounts.id — nullable (expand/contract) */
  platform_account_id: string | null;
  /** Objeto da conta de plataforma vinculada (populado via join) */
  platform_account?: PlatformAccount | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdAccountWithStats extends AdAccount {
  campaign_count: number;
  total_spend: number; // Derivado das campanhas vinculadas
}

export interface AdAccountFilters {
  search?: string;
  status?: AdAccountStatus | 'all';
  platform?: AdAccountPlatform | 'all';
}

export const adAccountSchema = z.object({
  name: z.string().trim().min(2, 'O nome deve ter no mínimo 2 caracteres'),
  platform: z.literal('tiktok'),
  status: z.enum(['active', 'paused', 'disabled', 'archived']),
  timezone: z.string().min(1, 'Fuso horário é obrigatório'),
  currency: z.enum(['BRL', 'USD', 'EUR']),
  country: z.string().min(2, 'País é obrigatório'),
  spending_limit: z.number().min(0, 'Limite de gasto não pode ser negativo').nullable().optional(),
  billing_type: z.enum(['prepaid', 'postpaid']),
  payment_status: z.enum(['normal', 'overdue', 'restricted']),
  legal_name: z
    .string()
    .trim()
    .refine((v) => !v || v.length >= 5, 'Razão Social deve ter no mínimo 5 caracteres')
    .optional()
    .or(z.literal('')),
  tax_id: z
    .string()
    .trim()
    .refine((v) => {
      if (!v) return true;
      const digits = v.replace(/\D/g, '');
      return digits.length === 11 || digits.length === 14;
    }, 'Informe um CPF válido (11 dígitos) ou CNPJ válido (14 dígitos)')
    .optional()
    .or(z.literal('')),
  industry: z.string().trim().optional().or(z.literal('')),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  phone: z
    .string()
    .trim()
    .refine((v) => {
      if (!v) return true;
      const digits = v.replace(/\D/g, '');
      return digits.length >= 8 && digits.length <= 15;
    }, 'Informe um telefone com formato válido')
    .optional()
    .or(z.literal('')),
  /** ID numérico do Advertiser no TikTok (texto livre) */
  advertiser_id: z.string().trim().optional().or(z.literal('')),
  business_center_id: z.string().trim().optional().or(z.literal('')),
  pixel_id: z.string().trim().optional().or(z.literal('')),
  catalog_id: z.string().trim().optional().or(z.literal('')),
  /** FK UUID para platform_accounts — opcional no wizard, propagado pelo passo 2 */
  platform_account_id: z.string().uuid().nullable().optional(),
});

export type AdAccountFormData = z.infer<typeof adAccountSchema>;

/**
 * Interface tipada para futura integração de provedores externos de anúncios (TikTok Ads).
 * Métodos vazios documentados conforme Etapa 5.
 */
export interface AdPlatformProvider {
  readonly platform: AdAccountPlatform;

  /**
   * Sincroniza dados da conta com o TikTok Marketing API (futuro).
   * @param accountId ID interno da conta
   */
  syncAccount?(accountId: string): Promise<void>;

  /**
   * Obtém saldo em tempo real para contas pré-pagas (futuro).
   * @param advertiserId ID externo do anunciante no TikTok
   */
  getBalance?(advertiserId: string): Promise<number | null>;

  /**
   * Testa a conectividade ou valida o token de autenticação (futuro).
   */
  testConnection?(): Promise<boolean>;
}
