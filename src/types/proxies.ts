import { z } from 'zod';

// ── Tipos base ───────────────────────────────────────────────────────────────

export type ProxyProtocol = 'http' | 'https' | 'socks5';
export type ProxyType = 'residential' | 'datacenter' | 'mobile' | 'isp';
export type ProxyStatus = 'active' | 'expired' | 'banned' | 'inactive';

// ── Interfaz principal (espelho do banco) ────────────────────────────────────

export interface Proxy {
  id: string;
  organization_id: string;
  label: string;
  protocol: ProxyProtocol;
  host: string;
  port: number;
  username: string | null;
  /** Nunca exibir em listagem — apenas no formulário de edição */
  password?: string | null;
  country: string | null;
  proxy_type: ProxyType;
  provider: string | null;
  status: ProxyStatus;
  expires_at: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// ── Schema Zod para formulário ───────────────────────────────────────────────

export const proxySchema = z.object({
  label: z.string().trim().min(2, 'Nome do proxy é obrigatório'),
  protocol: z.enum(['http', 'https', 'socks5'] as const),
  host: z
    .string()
    .trim()
    .min(3, 'Host é obrigatório')
    .regex(
      /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)*[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$|^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,
      'Formato de host inválido'
    ),
  port: z
    .number({ message: 'Porta deve ser um número' })
    .int()
    .min(1, 'Porta mínima: 1')
    .max(65535, 'Porta máxima: 65535'),
  username: z.string().trim().optional().or(z.literal('')),
  password: z.string().optional().or(z.literal('')),
  country: z.string().length(2, 'Use código ISO-2 (ex: BR)').optional().or(z.literal('')),
  proxy_type: z.enum(['residential', 'datacenter', 'mobile', 'isp'] as const),
  provider: z.string().trim().optional().or(z.literal('')),
  status: z.enum(['active', 'expired', 'banned', 'inactive'] as const),
  expires_at: z.string().optional().or(z.literal('')),
  notes: z.string().trim().max(500).optional().or(z.literal('')),
});

export type ProxyFormData = z.infer<typeof proxySchema>;

// ── Labels de UI ─────────────────────────────────────────────────────────────

export const PROXY_PROTOCOL_LABELS: Record<ProxyProtocol, string> = {
  http: 'HTTP',
  https: 'HTTPS',
  socks5: 'SOCKS5',
};

export const PROXY_TYPE_LABELS: Record<ProxyType, string> = {
  residential: 'Residencial',
  datacenter: 'Datacenter',
  mobile: 'Mobile',
  isp: 'ISP',
};

export const PROXY_STATUS_LABELS: Record<ProxyStatus, string> = {
  active: 'Ativo',
  expired: 'Expirado',
  banned: 'Banido',
  inactive: 'Inativo',
};

export const PROXY_STATUS_COLORS: Record<ProxyStatus, string> = {
  active: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  expired: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  banned: 'text-red-400 bg-red-500/10 border-red-500/30',
  inactive: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/30',
};
