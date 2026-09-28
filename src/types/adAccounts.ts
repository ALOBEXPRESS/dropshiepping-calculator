import { z } from 'zod';

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
  platform_account_id: string | null;
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
  legal_name: z.string().trim().optional().or(z.literal('')),
  tax_id: z.string().trim().optional().or(z.literal('')),
  industry: z.string().trim().optional().or(z.literal('')),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  phone: z.string().trim().optional().or(z.literal('')),
  platform_account_id: z.string().trim().optional().or(z.literal('')),
  business_center_id: z.string().trim().optional().or(z.literal('')),
  pixel_id: z.string().trim().optional().or(z.literal('')),
  catalog_id: z.string().trim().optional().or(z.literal('')),
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
   * @param platformAccountId ID externo da conta no anunciante
   */
  getBalance?(platformAccountId: string): Promise<number | null>;

  /**
   * Testa a conectividade ou valida o token de autenticação (futuro).
   */
  testConnection?(): Promise<boolean>;
}
