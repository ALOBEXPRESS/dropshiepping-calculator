import { z } from 'zod';

// ── Testador ────────────────────────────────────────────────────────────────

export const TestadorSchema = z.object({
  full_name: z.string().min(2, 'Nome obrigatório'),
  document_type: z.enum(['cpf', 'cnpj', 'rg', 'outro']),
  document_number: z.string().optional().nullable(),
  rg: z.string().optional().nullable(),
  birth_date: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email('E-mail inválido').optional().nullable().or(z.literal('')),
  notes: z.string().optional().nullable(),
  is_active: z.boolean(),
});

export type TestadorFormData = z.infer<typeof TestadorSchema>;

export interface Testador {
  id: string;
  organization_id: string;
  full_name: string;
  document_type: string;
  document_number: string | null;
  rg: string | null;
  birth_date: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// ── Titular Credit Cards & Subscriptions ────────────────────────────────────

export const TitularCreditCardSchema = z.object({
  id: z.string(),
  card_name: z.string().min(1, 'Apelido do cartão obrigatório'),
  last_digits: z.string().min(2, 'Informe ao menos 2 dígitos').max(4, 'Máximo 4 dígitos'),
  brand: z.string(),
  expiry: z.string().optional().nullable(),
  bank: z.string().optional().nullable(),
});

export type TitularCreditCard = z.infer<typeof TitularCreditCardSchema>;

export type SubscriptionCurrency = 'BRL' | 'USD';
export type SubscriptionBillingCycle = 'mensal' | 'vitalicia' | 'anual';

export const TitularSubscriptionSchema = z.object({
  name: z.string().min(2, 'Nome da assinatura obrigatório'),
  amount: z.number().min(0, 'Valor não pode ser negativo'),
  currency: z.enum(['BRL', 'USD']),
  billing_cycle: z.enum(['mensal', 'vitalicia', 'anual']),
  business_center_id: z.string().optional().nullable(),
  platform_account_id: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  is_active: z.boolean(),
});

export type TitularSubscriptionFormData = z.infer<typeof TitularSubscriptionSchema>;

export interface TitularSubscription {
  id: string;
  organization_id: string;
  titular_id: string;
  name: string;
  amount: number;
  currency: SubscriptionCurrency;
  billing_cycle: SubscriptionBillingCycle;
  business_center_id: string | null;
  platform_account_id: string | null;
  notes: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  business_centers?: { id: string; name: string; platform?: string } | null;
  platform_accounts?: { id: string; name: string; platform?: string } | null;
}

// ── Titular ─────────────────────────────────────────────────────────────────

export type TitularAccountType = 'cpf' | 'cnpj';
export type PreferredPaymentMethod = 'pix' | 'pix_credito' | 'cartao_credito';

export const TitularSchema = z.object({
  full_name: z.string().min(2, 'Nome obrigatório'),
  document_type: z.enum(['cpf', 'cnpj', 'rg', 'outro']),
  account_type: z.enum(['cpf', 'cnpj']),
  document_number: z.string().optional().nullable(),
  marketplaces: z.array(z.string()),
  marketing_capital: z.number().min(0),
  marketing_total_cost: z.number().min(0),
  bank: z.string().optional().nullable(),
  gateway_fee: z.number().min(0).max(100),
  preferred_payment_method: z.enum(['pix', 'pix_credito', 'cartao_credito']),
  credit_cards: z.array(TitularCreditCardSchema),
  is_influencer: z.boolean(),
  influencer_id: z.string().optional().nullable(),
  rg: z.string().optional().nullable(),
  birth_date: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email('E-mail inválido').optional().nullable().or(z.literal('')),
  notes: z.string().optional().nullable(),
});

export type TitularFormData = z.infer<typeof TitularSchema>;

export interface Titular {
  id: string;
  organization_id: string;
  full_name: string;
  document_type: string;
  account_type: TitularAccountType;
  document_number: string | null;
  marketplaces: string[];
  marketing_capital: number;
  marketing_total_cost: number;
  bank: string | null;
  gateway_fee: number;
  preferred_payment_method: PreferredPaymentMethod;
  credit_cards: TitularCreditCard[];
  is_influencer: boolean;
  influencer_id: string | null;
  rg: string | null;
  birth_date: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  influencer?: { id: string; name: string; instagram?: string | null } | null;
  subscriptions?: TitularSubscription[];
}

// ── Influenciador (already exists in DB as `influencers`) ───────────────────

export const InfluenciadorSchema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  instagram: z.string().optional().nullable(),
  tiktok: z.string().optional().nullable(),
  twitter: z.string().optional().nullable(),
  percentage: z.number().min(0).max(100),
  is_active: z.boolean(),
});

export type InfluenciadorFormData = z.infer<typeof InfluenciadorSchema>;

export interface Influenciador {
  id: string;
  organization_id: string;
  name: string;
  instagram: string | null;
  tiktok: string | null;
  twitter: string | null;
  percentage: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ── Shared ──────────────────────────────────────────────────────────────────

export type ResponsavelTab = 'testadores' | 'titulares' | 'influenciadores';
