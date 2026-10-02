import { z } from 'zod';

// ── Node types ────────────────────────────────────────────────────────────────

export type InfraNodeType =
  | 'proxy_provider'
  | 'proxy'
  | 'platform_account'
  | 'browser_profile'
  | 'device'
  | 'business_center'
  | 'ad_account'
  | 'campaign'
  | 'titular';

export type GroupingMode = 'provider' | 'platform' | 'business_center' | 'titular';

export type EdgeRelation =
  | 'provides'
  | 'uses_proxy'
  | 'device_proxy'
  | 'has_profile'
  | 'runs_on'
  | 'hosts_bc'
  | 'bc_proxy'
  | 'owns'
  | 'linked_tiktok'
  | 'linked_meta_ig'
  | 'linked_meta_fb'
  | 'contains_ad_account'
  | 'has_campaign'
  | 'bc_linked_account'
  | 'bc_meta_ig'
  | 'bc_meta_fb'
  | 'bc_owner_account'
  | 'bc_partner_access'
  | 'bc_ad_authorized';

// ── Health alert types ────────────────────────────────────────────────────────

export type HealthAlertType =
  | 'proxy_without_account'
  | 'account_without_proxy'
  | 'browser_profile_without_account'
  | 'country_mismatch'
  | 'shared_proxy'
  | 'ad_account_without_bc'
  | 'expired_proxy_active'
  | 'tiktok_account_device_ban_risk'
  | 'tiktok_account_multiple_devices'
  | 'device_multiple_tiktok_accounts'
  | 'proxy_shared_multiple_devices'
  | 'proxy_shared_multiple_bcs';

export interface HealthAlert {
  type: HealthAlertType;
  severity: 'error' | 'warning' | 'info';
  count: number;
  /** Node IDs (prefixed, e.g. 'px_...') involved in the alert */
  nodeIds: string[];
  /** Edge IDs (source→target string) involved */
  edgeIds?: string[];
  message: string;
  label: string;
}

// ── Core graph types ──────────────────────────────────────────────────────────

export interface InfraGraphNode {
  id: string;
  type: InfraNodeType;
  label: string;
  sublabel?: string | null;
  country?: string | null;
  status?: string | null;
  platform?: string | null;
  meta: Record<string, unknown>;
}

export interface InfraGraphEdge {
  source: string;
  target: string;
  relation: EdgeRelation | string;
}

export interface InfraGraphResponse {
  nodes: InfraGraphNode[];
  edges: InfraGraphEdge[];
}

// ── Zod schemas ───────────────────────────────────────────────────────────────

const InfraNodeTypeSchema = z.enum([
  'proxy_provider',
  'proxy',
  'platform_account',
  'browser_profile',
  'device',
  'business_center',
  'ad_account',
  'campaign',
  'titular',
]);

export const InfraGraphNodeSchema = z.object({
  id: z.string(),
  type: InfraNodeTypeSchema,
  label: z.string(),
  sublabel: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  platform: z.string().nullable().optional(),
  meta: z.record(z.string(), z.unknown()).default({}),
});

export const InfraGraphEdgeSchema = z.object({
  source: z.string(),
  target: z.string(),
  relation: z.string(),
});

export const InfraGraphResponseSchema = z.object({
  nodes: z.array(InfraGraphNodeSchema),
  edges: z.array(InfraGraphEdgeSchema),
});
