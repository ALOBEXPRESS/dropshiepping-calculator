import { z } from 'zod';

export interface ProxyProvider {
  id: string;
  organization_id: string;
  name: string;
  website: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProxyProviderWithStats extends ProxyProvider {
  proxy_count: number;
}

export const proxyProviderSchema = z.object({
  name: z.string().trim().min(2, 'O nome do provedor deve ter no mínimo 2 caracteres'),
  website: z
    .string()
    .trim()
    .url('Informe uma URL válida (ex: https://brightdata.com)')
    .optional()
    .or(z.literal('')),
  notes: z.string().trim().max(500, 'Notas devem ter no máximo 500 caracteres').optional().or(z.literal('')),
});

export type ProxyProviderFormData = z.infer<typeof proxyProviderSchema>;
