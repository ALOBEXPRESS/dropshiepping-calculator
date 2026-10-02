import type { Node as RFNode, Edge as RFEdge } from '@xyflow/react';
import type {
  InfraGraphResponse,
  InfraGraphNode,
  HealthAlert,
} from '@/types/infraGraph';
export type { GroupingMode } from '@/types/infraGraph';
import { getMismatchEdgeIds, getExpiredProxyIds } from './infraGraphHealth';

// ── Node visual config by type ────────────────────────────────────────────────

export const NODE_COLORS: Record<InfraGraphNode['type'], string> = {
  proxy_provider: '#6B7280',
  proxy: '#FF4D00',
  platform_account: '#06B6D4',
  browser_profile: '#67E8F9',
  device: '#34D399',
  business_center: '#7C3AED',
  ad_account: '#F59E0B',
  campaign: '#22C55E',
  titular: '#9CA3AF',
};

export const EDGE_COLORS: Record<string, string> = {
  provides: '#6B7280',
  uses_proxy: '#FF4D00',
  device_proxy: '#34D399',
  has_profile: '#67E8F9',
  runs_on: '#34D399',
  owns: '#9CA3AF',
  linked_tiktok: '#06B6D4',
  linked_meta_ig: '#F472B6',
  linked_meta_fb: '#3B82F6',
  contains_ad_account: '#7C3AED',
  has_campaign: '#22C55E',
  bc_linked_account: '#7C3AED',
  bc_meta_ig: '#F472B6',
  bc_meta_fb: '#3B82F6',
};

export interface InfraNodeData extends Record<string, unknown> {
  id: string;
  type: InfraGraphNode['type'];
  label: string;
  sublabel?: string | null;
  country?: string | null;
  status?: string | null;
  platform?: string | null;
  meta: Record<string, unknown>;
  isHighlighted?: boolean;
  isDimmed?: boolean;
  hasAlert?: boolean;
  alertTypes?: string[];
}

// ── Transform functions ───────────────────────────────────────────────────────

/**
 * Converts InfraGraphResponse to ReactFlow nodes and edges.
 * Positions are set to (0,0) — layout engine applies final coordinates.
 */
export function transformToReactFlow(graph: InfraGraphResponse): {
  nodes: RFNode<InfraNodeData>[];
  edges: RFEdge[];
} {
  const nodes: RFNode<InfraNodeData>[] = graph.nodes.map((n) => ({
    id: n.id,
    type: n.type,
    position: { x: 0, y: 0 },
    data: { ...n },
  }));

  const mismatchEdges = getMismatchEdgeIds(graph);
  const expiredProxies = getExpiredProxyIds(graph);

  const edges: RFEdge[] = graph.edges.map((e) => {
    const edgeId = `${e.source}→${e.target}`;
    const isMismatch = mismatchEdges.has(edgeId);
    const isExpiredProxy =
      e.relation === 'uses_proxy' && expiredProxies.has(e.source);
    const isWarning = isMismatch || isExpiredProxy;

    return {
      id: edgeId,
      source: e.source,
      target: e.target,
      type: 'smoothstep',
      animated: false,
      label: undefined,
      style: {
        stroke: isWarning ? '#EF4444' : (EDGE_COLORS[e.relation] ?? '#4B5563'),
        strokeWidth: isWarning ? 2 : 1.5,
        strokeDasharray: isWarning ? '6 4' : undefined,
      },
      data: { relation: e.relation, isWarning },
    };
  });

  return { nodes, edges };
}

/**
 * Applies health alert highlights to existing ReactFlow nodes.
 * Marks nodes with `hasAlert` and `alertTypes` for visual indicators.
 */
export function applyHealthAlerts(
  nodes: RFNode<InfraNodeData>[],
  alerts: HealthAlert[]
): RFNode<InfraNodeData>[] {
  const alertNodeMap = new Map<string, string[]>();

  for (const alert of alerts) {
    if (alert.severity === 'info') continue;
    for (const nodeId of alert.nodeIds) {
      const current = alertNodeMap.get(nodeId) ?? [];
      current.push(alert.type);
      alertNodeMap.set(nodeId, current);
    }
  }

  return nodes.map((n) => {
    const alertTypes = alertNodeMap.get(n.id);
    if (!alertTypes) return n;
    return {
      ...n,
      data: {
        ...n.data,
        hasAlert: true,
        alertTypes,
      },
    };
  });
}

/**
 * Applies focus state to nodes and edges.
 * Nodes outside the highlighted set get isDimmed = true.
 */
export function applyFocusState(
  nodes: RFNode<InfraNodeData>[],
  edges: RFEdge[],
  highlightedNodeIds: Set<string> | null,
  highlightedEdgeIds: Set<string> | null
): {
  nodes: RFNode<InfraNodeData>[];
  edges: RFEdge[];
} {
  if (!highlightedNodeIds) {
    return {
      nodes: nodes.map((n) => ({
        ...n,
        data: { ...n.data, isHighlighted: false, isDimmed: false },
      })),
      edges: edges.map((e) => ({ ...e, animated: false })),
    };
  }

  return {
    nodes: nodes.map((n) => ({
      ...n,
      data: {
        ...n.data,
        isHighlighted: highlightedNodeIds.has(n.id),
        isDimmed: !highlightedNodeIds.has(n.id),
      },
    })),
    edges: edges.map((e) => ({
      ...e,
      animated: highlightedEdgeIds?.has(e.id) ?? false,
    })),
  };
}
