import { z } from 'zod';

// ── Tipos base ───────────────────────────────────────────────────────────────

export type BusinessCenterPlatform = 'tiktok' | 'meta' | 'google';
export type BusinessCenterType = 'advertiser' | 'agency';
/** Sub-tipo para Meta Business Portfolio: qual rede social vinculada */
export type MetaLinkedNetwork = 'instagram' | 'facebook';

export type CompanyStatus = 'Ativa' | 'Suspensa' | 'Inapta' | 'Baixada' | 'Nula';

// ── Tipos para Relacionamentos N:N entre BCs e Contas de Plataforma ──────────

/**
 * Tipo de vínculo entre Business Center e Conta de Plataforma:
 * - 'owner': Business Center detém a posse / propriedade primária do ativo. Máximo de 1 owner por conta.
 * - 'partner_access': Ativo compartilhado com parceiro/agência com permissão de gestão ou operação.
 * - 'ad_authorization': Vinculação autorizada para entrega de anúncios (ex: Spark Ads no TikTok, suporta até 800 BCs).
 */
export type RelationshipType = 'owner' | 'partner_access' | 'ad_authorization';

/**
 * Nível de permissão no ativo vinculado:
 * - 'admin': Acesso total / controle administrativo.
 * - 'standard': Acesso padrão / criação e edição de campanhas e postagens.
 * - 'ads_only': Permissão restrita exclusivamente para veiculação de anúncios.
 */
export type PermissionLevel = 'admin' | 'standard' | 'ads_only';

/**
 * Status do vínculo:
 * - 'active': Vínculo ativo e operacional.
 * - 'pending': Aguardando confirmação / aceite na plataforma externa.
 * - 'revoked': Acesso revogado ou desvinculado.
 */
export type RelationshipStatus = 'active' | 'pending' | 'revoked';

export interface BusinessCenterAccountRelation {
  id: string;
  organization_id: string;
  business_center_id: string;
  platform_account_id: string;
  relationship_type: RelationshipType;
  permission_level: PermissionLevel;
  status: RelationshipStatus;
  linked_at: string;
  external_relation_id?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  // Campos populados via joins quando consultado
  platform_accounts?: {
    id: string;
    name: string;
    nickname: string | null;
    platform: string;
    meta_account_type?: string | null;
    holder_name?: string | null;
    profile_photo_url?: string | null;
  } | null;
  business_centers?: {
    id: string;
    name: string | null;
    bc_id: string;
    platform: BusinessCenterPlatform;
    business_type?: BusinessCenterType;
  } | null;
}

export interface BusinessCenterAccountInput {
  platform_account_id: string;
  relationship_type: RelationshipType;
  permission_level?: PermissionLevel;
  status?: RelationshipStatus;
  notes?: string | null;
  external_relation_id?: string | null;
}

// ── Tipos para Relacionamentos N:N entre BCs e Testadores da Operação ────────

export type BusinessCenterTestadorRole = 'testador' | 'operador' | 'admin' | 'analista';

export interface BusinessCenterTestadorRelation {
  id: string;
  organization_id: string;
  business_center_id: string;
  testador_id: string;
  role: BusinessCenterTestadorRole;
  permission_level: PermissionLevel;
  status: RelationshipStatus;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  testador?: {
    id: string;
    full_name: string;
    email?: string | null;
    phone?: string | null;
    document_number?: string | null;
    is_active?: boolean;
  } | null;
}

export interface BusinessCenterTestadorInput {
  testador_id: string;
  role?: BusinessCenterTestadorRole;
  permission_level?: PermissionLevel;
  status?: RelationshipStatus;
  notes?: string | null;
}

export const BC_TESTADOR_ROLE_CONFIG: Record<
  BusinessCenterTestadorRole,
  {
    label: string;
    shortLabel: string;
    description: string;
    badgeColor: string;
    icon: string;
  }
> = {
  testador: {
    label: 'Testador de Criativos / Anúncios',
    shortLabel: 'Testador',
    description: 'Valida criativos, produtos e sobe campanhas de teste na conta/BM.',
    badgeColor: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
    icon: 'FlaskConical',
  },
  operador: {
    label: 'Operador de Tráfego / Gestor',
    shortLabel: 'Operador',
    description: 'Operação diária de anúncios, lances e escala de campanhas.',
    badgeColor: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    icon: 'TrendingUp',
  },
  admin: {
    label: 'Administrador da Operação',
    shortLabel: 'Admin',
    description: 'Acesso total para vincular ativos, membros e faturamento.',
    badgeColor: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    icon: 'ShieldCheck',
  },
  analista: {
    label: 'Analista de Métricas / BI',
    shortLabel: 'Analista',
    description: 'Acompanhamento de relatórios, KPIs e análise de conversão.',
    badgeColor: 'bg-zinc-700/50 text-zinc-300 border-zinc-600',
    icon: 'BarChart3',
  },
};

export const RELATIONSHIP_TYPE_CONFIG: Record<
  RelationshipType,
  {
    label: string;
    shortLabel: string;
    description: string;
    badgeColor: string;
    tagBg: string;
    tagBorder: string;
    tagText: string;
    icon: string;
  }
> = {
  owner: {
    label: 'Proprietário (Ativo Principal)',
    shortLabel: 'Proprietário',
    description:
      'Business Center detém a posse e propriedade primária deste ativo. Regra da Meta e TikTok: máximo de 1 proprietário.',
    badgeColor: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    tagBg: 'bg-amber-500/10',
    tagBorder: 'border-amber-500/30',
    tagText: 'text-amber-300',
    icon: 'Crown',
  },
  partner_access: {
    label: 'Acesso Compartilhado (Parceiro)',
    shortLabel: 'Parceiro',
    description:
      'Ativo pertencente a outro parceiro ou agência, compartilhado com este portfólio para gerenciamento conjunto.',
    badgeColor: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    tagBg: 'bg-blue-500/10',
    tagBorder: 'border-blue-500/30',
    tagText: 'text-blue-300',
    icon: 'Users',
  },
  ad_authorization: {
    label: 'Autorização para Anúncios (Spark / Ad Delivery)',
    shortLabel: 'Anúncios',
    description:
      'Vinculação autorizada para entrega de anúncios (ex: Spark Ads no TikTok, suporta até 800 BCs).',
    badgeColor: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
    tagBg: 'bg-cyan-500/10',
    tagBorder: 'border-cyan-500/30',
    tagText: 'text-cyan-300',
    icon: 'Megaphone',
  },
};

export const PERMISSION_LEVEL_CONFIG: Record<
  PermissionLevel,
  {
    label: string;
    description: string;
    badgeColor: string;
  }
> = {
  admin: {
    label: 'Acesso Total (Admin)',
    description: 'Controle total do ativo, gerenciamento de permissões e configurações.',
    badgeColor: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
  },
  standard: {
    label: 'Operacional (Padrão)',
    description: 'Criação e edição de campanhas, criativos e postagens.',
    badgeColor: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  },
  ads_only: {
    label: 'Apenas Anúncios',
    description: 'Permissão restrita para veicular e impulsionar anúncios usando a conta.',
    badgeColor: 'bg-zinc-700/50 text-zinc-300 border-zinc-600',
  },
};

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

  // Dados do Titular / Responsável
  holder_name?: string | null;
  holder_cpf?: string | null;
  holder_rg?: string | null;
  holder_birth_date?: string | null;
  titular_id?: string | null;

  // Testador da Operação
  testador_id?: string | null;

  // Dados da Empresa
  company_cnpj?: string | null;
  company_state_registration?: string | null;
  company_status?: CompanyStatus | string | null;

  /** Para Meta: qual rede social está vinculada (ou 'both') - Legado mantido para compatibilidade */
  meta_linked_network?: MetaLinkedNetwork | 'both' | null;
  /** Para Meta: ID da conta de plataforma principal vinculada - Legado mantido para compatibilidade */
  meta_linked_account_id?: string | null;
  /** Para Meta: ID da conta de Instagram vinculada - Legado mantido para compatibilidade */
  meta_instagram_account_id?: string | null;
  /** Para Meta: ID da página/perfil de Facebook vinculado - Legado mantido para compatibilidade */
  meta_facebook_account_id?: string | null;
  /** Dispositivo vinculado (infraestrutura legado) */
  device_id?: string | null;
  /** Dispositivos operacionais vinculados (infraestrutura N:N) */
  device_ids?: string[];
  /** Proxy vinculado (infraestrutura) */
  proxy_id?: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

/** BC com contagem de contas de anúncios vinculadas e contas de plataforma N:N */
export interface BusinessCenterWithStats extends BusinessCenter {
  ad_account_count: number;
  linked_account_count?: number;
  linked_accounts?: BusinessCenterAccountRelation[];
  linked_testador_count?: number;
  linked_testadores?: BusinessCenterTestadorRelation[];
  testador_ids?: string[];
}

// ── Schema Zod para formulário ───────────────────────────────────────────────

export const businessCenterSchema = z.object({
  platform: z.enum(['tiktok', 'meta', 'google']),
  business_type: z.enum(['advertiser', 'agency']),
  name: z.string().trim().min(2, 'Nome do Business Center deve ter no mínimo 2 caracteres'),
  country: z.string().min(2, 'País é obrigatório'),
  timezone: z.string().min(1, 'Fuso horário é obrigatório'),
  currency: z.string().min(1, 'Moeda é obrigatória'),
  bc_id: z.string().trim().optional().or(z.literal('')),
  notes: z.string().trim().max(500, 'Notas devem ter no máximo 500 caracteres').optional().or(z.literal('')),

  // Dados do Titular
  holder_name: z.string().trim().optional().or(z.literal('')),
  holder_cpf: z.string().trim().optional().or(z.literal('')),
  holder_rg: z.string().trim().optional().or(z.literal('')),
  holder_birth_date: z.string().trim().optional().or(z.literal('')),
  titular_id: z.string().uuid().optional().nullable().or(z.literal('')),

  // Testador da Operação
  testador_id: z.string().uuid().optional().nullable().or(z.literal('')),

  // Dados da Empresa
  company_legal_name: z.string().trim().optional().or(z.literal('')),
  company_cnpj: z.string().trim().optional().or(z.literal('')),
  company_state_registration: z.string().trim().optional().or(z.literal('')),
  company_status: z.enum(['Ativa', 'Suspensa', 'Inapta', 'Baixada', 'Nula']),

  /** Meta: rede social vinculada */
  meta_linked_network: z.enum(['instagram', 'facebook', 'both']).optional().nullable(),
  /** Meta: ID UUID da conta de plataforma vinculada */
  meta_linked_account_id: z.string().uuid().optional().nullable().or(z.literal('')),
  /** Meta: ID da conta de Instagram vinculada */
  meta_instagram_account_id: z.string().uuid().optional().nullable().or(z.literal('')),
  /** Meta: ID da conta de Facebook vinculada */
  meta_facebook_account_id: z.string().uuid().optional().nullable().or(z.literal('')),
  /** Dispositivo vinculado (infraestrutura legado) */
  device_id: z.string().uuid().optional().nullable().or(z.literal('')),
  /** Dispositivos operacionais vinculados (infraestrutura N:N) */
  device_ids: z.array(z.string().uuid()).optional(),
  /** Proxy vinculado (infraestrutura) */
  proxy_id: z.string().uuid().optional().nullable().or(z.literal('')),
  /** Contas de Plataforma vinculadas (N:N) com tipo de relacionamento */
  linked_accounts: z
    .array(
      z.object({
        platform_account_id: z.string().uuid(),
        relationship_type: z.enum(['owner', 'partner_access', 'ad_authorization']),
        permission_level: z.enum(['admin', 'standard', 'ads_only']).optional(),
        status: z.enum(['active', 'pending', 'revoked']).optional(),
        notes: z.string().optional().nullable(),
        external_relation_id: z.string().optional().nullable(),
      })
    )
    .optional(),
  /** Testadores da Operação vinculados (N:N) */
  linked_testadores: z
    .array(
      z.object({
        testador_id: z.string().uuid(),
        role: z.enum(['testador', 'operador', 'admin', 'analista']).optional(),
        permission_level: z.enum(['admin', 'standard', 'ads_only']).optional(),
        status: z.enum(['active', 'pending', 'revoked']).optional(),
        notes: z.string().optional().nullable(),
      })
    )
    .optional(),
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
