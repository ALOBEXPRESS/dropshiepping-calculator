import { useMemo } from 'react';
import type { Node as RFNode, Edge as RFEdge } from '@xyflow/react';
import dagre from '@dagrejs/dagre';
import type { GroupingMode, InfraNodeData } from '@/utils/infraGraphTransform';

type LayoutedNodes = RFNode<InfraNodeData>[];
type LayoutedEdges = RFEdge[];

// Node size estimates for dagre layout
const NODE_WIDTH = 210;
const NODE_HEIGHT = 86;

function runDagreLayout(
  nodes: LayoutedNodes,
  edges: LayoutedEdges,
  direction: 'LR' | 'TB' = 'LR'
): { nodes: LayoutedNodes; edges: LayoutedEdges } {
  if (nodes.length === 0) {
    return { nodes: [], edges: [] };
  }

  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: direction, nodesep: 60, ranksep: 110, marginx: 40, marginy: 40 });

  for (const node of nodes) {
    g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
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
          x: pos.x - NODE_WIDTH / 2,
          y: pos.y - NODE_HEIGHT / 2,
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

export function useInfraMapLayout(
  nodes: LayoutedNodes,
  edges: LayoutedEdges,
  groupingMode: GroupingMode,
  customPositions?: Record<string, { x: number; y: number }>
): UseInfraMapLayoutReturn {
  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(() => {
    const direction = groupingMode === 'platform' ? 'TB' : 'LR';
    const dagreResult = runDagreLayout(nodes, edges, direction);
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
  }, [nodes, edges, groupingMode, customPositions]);

  return { layoutedNodes, layoutedEdges, isLayouting: false };
}
