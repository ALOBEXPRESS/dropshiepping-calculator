import { useState, useEffect, useRef } from 'react';
import type { Node as RFNode, Edge as RFEdge } from '@xyflow/react';
import dagre from '@dagrejs/dagre';
import type { GroupingMode, InfraNodeData } from '@/utils/infraGraphTransform';

type LayoutedNodes = RFNode<InfraNodeData>[];
type LayoutedEdges = RFEdge[];

// Node size estimates for dagre layout
const NODE_WIDTH = 200;
const NODE_HEIGHT = 80;

function runDagreLayout(
  nodes: LayoutedNodes,
  edges: LayoutedEdges,
  direction: 'LR' | 'TB' = 'LR'
): { nodes: LayoutedNodes; edges: LayoutedEdges } {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: direction, nodesep: 60, ranksep: 100, marginx: 40, marginy: 40 });

  for (const node of nodes) {
    g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  }
  for (const edge of edges) {
    g.setEdge(edge.source, edge.target);
  }

  dagre.layout(g);

  const layoutedNodes = nodes.map((node) => {
    const pos = g.node(node.id);
    return {
      ...node,
      position: {
        x: pos.x - NODE_WIDTH / 2,
        y: pos.y - NODE_HEIGHT / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}

export interface UseInfraMapLayoutReturn {
  layoutedNodes: LayoutedNodes;
  layoutedEdges: LayoutedEdges;
  isLayouting: boolean;
}

export function useInfraMapLayout(
  nodes: LayoutedNodes,
  edges: LayoutedEdges,
  groupingMode: GroupingMode
): UseInfraMapLayoutReturn {
  const [layoutedNodes, setLayoutedNodes] = useState<LayoutedNodes>([]);
  const [layoutedEdges, setLayoutedEdges] = useState<LayoutedEdges>([]);
  const [isLayouting, setIsLayouting] = useState(false);
  const prevKey = useRef('');

  useEffect(() => {
    if (nodes.length === 0) {
      setLayoutedNodes([]);
      setLayoutedEdges([]);
      return;
    }

    // Avoid re-running for the same graph + mode
    const key = `${nodes.length}-${edges.length}-${groupingMode}`;
    if (key === prevKey.current) return;
    prevKey.current = key;

    setIsLayouting(true);

    // Run layout asynchronously to avoid blocking render
    const handle = setTimeout(() => {
      try {
        const direction = groupingMode === 'platform' ? 'TB' : 'LR';
        const result = runDagreLayout(nodes, edges, direction);
        setLayoutedNodes(result.nodes);
        setLayoutedEdges(result.edges);
      } catch (err) {
        console.error('[useInfraMapLayout] Layout error:', err);
        // Fallback: return nodes with simple grid positions
        const fallback = nodes.map((n, i) => ({
          ...n,
          position: { x: (i % 5) * 250, y: Math.floor(i / 5) * 120 },
        }));
        setLayoutedNodes(fallback);
        setLayoutedEdges(edges);
      } finally {
        setIsLayouting(false);
      }
    }, 0);

    return () => clearTimeout(handle);
  }, [nodes, edges, groupingMode]);

  return { layoutedNodes, layoutedEdges, isLayouting };
}
