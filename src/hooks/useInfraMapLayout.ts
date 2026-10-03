import { useMemo } from 'react';
import type { Node as RFNode, Edge as RFEdge } from '@xyflow/react';
import dagre from '@dagrejs/dagre';
import type { GroupingMode, InfraNodeData } from '@/utils/infraGraphTransform';

type LayoutedNodes = RFNode<InfraNodeData>[];
type LayoutedEdges = RFEdge[];

export type NodeSize = 'small' | 'medium' | 'large';

export const NODE_SIZE_CONFIG: Record<
  NodeSize,
  { width: number; height: number; nodesep: number; ranksep: number }
> = {
  small:  { width: 170, height: 72,  nodesep: 45, ranksep: 95 },
  medium: { width: 220, height: 88,  nodesep: 60, ranksep: 120 },
  large:  { width: 280, height: 108, nodesep: 75, ranksep: 145 },
};

function runDagreLayout(
  nodes: LayoutedNodes,
  edges: LayoutedEdges,
  direction: 'LR' | 'TB' = 'LR',
  nodeSize: NodeSize = 'medium'
): { nodes: LayoutedNodes; edges: LayoutedEdges } {
  if (nodes.length === 0) {
    return { nodes: [], edges: [] };
  }

  const cfg = NODE_SIZE_CONFIG[nodeSize] || NODE_SIZE_CONFIG.medium;
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: direction,
    nodesep: cfg.nodesep,
    ranksep: cfg.ranksep,
    marginx: 40,
    marginy: 40,
  });

  for (const node of nodes) {
    g.setNode(node.id, { width: cfg.width, height: cfg.height });
  }
  for (const edge of edges) {
    // Only add edge to layout graph if both source and target exist in nodes
    if (g.hasNode(edge.source) && g.hasNode(edge.target)) {
      g.setEdge(edge.source, edge.target);
    }
  }

  try {
    dagre.layout(g);

    const layoutedNodes = nodes.map((node) => {
      const pos = g.node(node.id);
      if (!pos) {
        return node;
      }
      return {
        ...node,
        position: {
          x: Math.round(pos.x - cfg.width / 2),
          y: Math.round(pos.y - cfg.height / 2),
        },
      };
    });

    return { nodes: layoutedNodes, edges };
  } catch (err) {
    console.error('[useInfraMapLayout] Dagre layout error:', err);
    // Fallback: simple grid arrangement
    const fallback = nodes.map((n, i) => ({
      ...n,
      position: { x: (i % 5) * 260, y: Math.floor(i / 5) * 120 },
    }));
    return { nodes: fallback, edges };
  }
}

export interface UseInfraMapLayoutReturn {
  layoutedNodes: LayoutedNodes;
  layoutedEdges: LayoutedEdges;
  isLayouting: boolean;
}

/**
 * Agrupa o grafo em raias / blocos horizontais organizados por Provedor de Proxy.
 * Cada provedor forma seu próprio pipeline visual limpo de nós, empilhados verticalmente.
 */
function runProviderClusteredLayout(
  nodes: LayoutedNodes,
  edges: LayoutedEdges,
  nodeSize: NodeSize = 'medium'
): { nodes: LayoutedNodes; edges: LayoutedEdges } {
  if (nodes.length === 0) return { nodes: [], edges: [] };
  const cfg = NODE_SIZE_CONFIG[nodeSize] || NODE_SIZE_CONFIG.medium;

  // 1. Mapeia cada nó ao seu provedor de proxy correspondente
  const nodeToProvider = new Map<string, string>();
  const providerNames = new Map<string, string>();

  // A. Nós de provedor
  for (const node of nodes) {
    if (node.type === 'proxy_provider') {
      nodeToProvider.set(node.id, node.id);
      providerNames.set(node.id, String(node.data?.label || 'Provedor'));
    }
  }

  // B. Proxies com meta.provider_id
  for (const node of nodes) {
    if (node.type === 'proxy') {
      const metaProv = (node.data?.meta?.provider_id as string) || null;
      if (metaProv && nodeToProvider.has(metaProv)) {
        nodeToProvider.set(node.id, metaProv);
      }
    }
  }

  // C. Arestas directas 'provides' (pp -> px)
  for (const edge of edges) {
    if (edge.data?.relation === 'provides' || edge.source.startsWith('pp_')) {
      if (nodeToProvider.has(edge.source)) {
        nodeToProvider.set(edge.target, edge.source);
      }
    }
  }

  // D. Propagação em cascata para nós a jusante (px -> pa, px -> dv, px -> bc, pa -> bp, etc.)
  for (let pass = 0; pass < 4; pass++) {
    for (const edge of edges) {
      const srcProv = nodeToProvider.get(edge.source);
      const tgtProv = nodeToProvider.get(edge.target);

      if (srcProv && !tgtProv) {
        nodeToProvider.set(edge.target, srcProv);
      } else if (tgtProv && !srcProv && (edge.source.startsWith('px_') || edge.source.startsWith('dv_'))) {
        nodeToProvider.set(edge.source, tgtProv);
      }
    }
  }

  // 2. Agrupa nós por chave de provedor
  const clusterMap = new Map<string, LayoutedNodes>();
  for (const node of nodes) {
    const provId = nodeToProvider.get(node.id) || 'no_provider';
    const list = clusterMap.get(provId) ?? [];
    list.push(node);
    clusterMap.set(provId, list);
  }

  // 3. Ordena clusters: Provedores identificados primeiro, 'Sem Provedor' por último
  const clusterKeys = Array.from(clusterMap.keys()).sort((a, b) => {
    if (a === 'no_provider') return 1;
    if (b === 'no_provider') return -1;
    const nameA = providerNames.get(a) || a;
    const nameB = providerNames.get(b) || b;
    return nameA.localeCompare(nameB);
  });

  const finalNodes: LayoutedNodes = [];
  let currentY = 40;

  for (const key of clusterKeys) {
    const clusterNodes = clusterMap.get(key) ?? [];
    if (clusterNodes.length === 0) continue;

    const clusterNodeIdSet = new Set(clusterNodes.map((n) => n.id));
    const clusterEdges = edges.filter(
      (e) => clusterNodeIdSet.has(e.source) && clusterNodeIdSet.has(e.target)
    );

    const layouted = runDagreLayout(clusterNodes, clusterEdges, 'LR', nodeSize);

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const n of layouted.nodes) {
      minX = Math.min(minX, n.position.x);
      minY = Math.min(minY, n.position.y);
      maxX = Math.max(maxX, n.position.x + cfg.width);
      maxY = Math.max(maxY, n.position.y + cfg.height);
    }

    const clusterHeight = Math.max(maxY - minY, cfg.height);

    for (const n of layouted.nodes) {
      finalNodes.push({
        ...n,
        position: {
          x: Math.round(n.position.x - minX + 50),
          y: Math.round(n.position.y - minY + currentY),
        },
      });
    }

    currentY += clusterHeight + 140; // 140px de espaçamento vertical limpo entre provedores
  }

  return { nodes: finalNodes, edges };
}

/**
 * Agrupa o grafo em raias / blocos horizontais organizados por Plataforma Social (TikTok, Meta, Google, Rede).
 */
function runPlatformClusteredLayout(
  nodes: LayoutedNodes,
  edges: LayoutedEdges,
  nodeSize: NodeSize = 'medium'
): { nodes: LayoutedNodes; edges: LayoutedEdges } {
  if (nodes.length === 0) return { nodes: [], edges: [] };
  const cfg = NODE_SIZE_CONFIG[nodeSize] || NODE_SIZE_CONFIG.medium;

  const nodeToPlatform = new Map<string, string>();

  // A. Nós que explicitamente possuem plataforma
  for (const node of nodes) {
    const plat = (node.data?.platform as string)?.toLowerCase();
    if (plat) {
      nodeToPlatform.set(node.id, plat);
    }
  }

  // B. Propagação através de arestas
  for (let pass = 0; pass < 3; pass++) {
    for (const edge of edges) {
      const srcPlat = nodeToPlatform.get(edge.source);
      const tgtPlat = nodeToPlatform.get(edge.target);

      if (srcPlat && !tgtPlat) {
        nodeToPlatform.set(edge.target, srcPlat);
      } else if (tgtPlat && !srcPlat) {
        nodeToPlatform.set(edge.source, tgtPlat);
      }
    }
  }

  const clusterMap = new Map<string, LayoutedNodes>();
  for (const node of nodes) {
    let plat = nodeToPlatform.get(node.id);
    if (!plat) {
      if (node.type === 'proxy_provider' || node.type === 'proxy') {
        plat = 'network_infra';
      } else if (node.type === 'titular') {
        plat = 'titulares';
      } else {
        plat = 'other';
      }
    }
    const list = clusterMap.get(plat) ?? [];
    list.push(node);
    clusterMap.set(plat, list);
  }

  const PLATFORM_ORDER = ['tiktok', 'meta', 'google', 'network_infra', 'titulares', 'other'];
  const clusterKeys = Array.from(clusterMap.keys()).sort((a, b) => {
    const idxA = PLATFORM_ORDER.indexOf(a);
    const idxB = PLATFORM_ORDER.indexOf(b);
    return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
  });

  const finalNodes: LayoutedNodes = [];
  let currentY = 40;

  for (const key of clusterKeys) {
    const clusterNodes = clusterMap.get(key) ?? [];
    if (clusterNodes.length === 0) continue;

    const clusterNodeIdSet = new Set(clusterNodes.map((n) => n.id));
    const clusterEdges = edges.filter(
      (e) => clusterNodeIdSet.has(e.source) && clusterNodeIdSet.has(e.target)
    );

    const layouted = runDagreLayout(clusterNodes, clusterEdges, 'LR', nodeSize);

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const n of layouted.nodes) {
      minX = Math.min(minX, n.position.x);
      minY = Math.min(minY, n.position.y);
      maxX = Math.max(maxX, n.position.x + cfg.width);
      maxY = Math.max(maxY, n.position.y + cfg.height);
    }

    const clusterHeight = Math.max(maxY - minY, cfg.height);

    for (const n of layouted.nodes) {
      finalNodes.push({
        ...n,
        position: {
          x: Math.round(n.position.x - minX + 50),
          y: Math.round(n.position.y - minY + currentY),
        },
      });
    }

    currentY += clusterHeight + 140;
  }

  return { nodes: finalNodes, edges };
}

export function useInfraMapLayout(
  nodes: LayoutedNodes,
  edges: LayoutedEdges,
  groupingMode: 'none' | 'provider' | 'platform' | GroupingMode,
  customPositions?: Record<string, { x: number; y: number }>,
  nodeSize: NodeSize = 'medium'
): UseInfraMapLayoutReturn {
  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(() => {
    let dagreResult: { nodes: LayoutedNodes; edges: LayoutedEdges };

    if (groupingMode === 'provider') {
      dagreResult = runProviderClusteredLayout(nodes, edges, nodeSize);
    } else if (groupingMode === 'platform') {
      dagreResult = runPlatformClusteredLayout(nodes, edges, nodeSize);
    } else {
      dagreResult = runDagreLayout(nodes, edges, 'LR', nodeSize);
    }

    if (!customPositions || Object.keys(customPositions).length === 0) {
      return dagreResult;
    }

    const mergedNodes = dagreResult.nodes.map((node) => {
      const custom = customPositions[node.id];
      if (custom && typeof custom.x === 'number' && typeof custom.y === 'number') {
        return {
          ...node,
          position: custom,
        };
      }
      return node;
    });

    return { nodes: mergedNodes, edges: dagreResult.edges };
  }, [nodes, edges, groupingMode, customPositions, nodeSize]);

  return { layoutedNodes, layoutedEdges, isLayouting: false };
}
