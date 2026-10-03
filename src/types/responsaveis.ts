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

// ── Titular (already exists in DB) ──────────────────────────────────────────

export const TitularSchema = z.object({
  full_name: z.string().min(2, 'Nome obrigatório'),
  document_type: z.enum(['cpf', 'cnpj', 'rg', 'outro']),
  document_number: z.string().optional().nullable(),
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
  document_number: string | null;
  rg: string | null;
  birth_date: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
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
