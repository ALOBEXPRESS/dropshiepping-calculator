import { useState, useCallback, useEffect } from 'react';
import type { InfraGraphEdge } from '@/types/infraGraph';

interface FocusState {
  nodeId: string | null;
  highlightedNodeIds: Set<string> | null;
  highlightedEdgeIds: Set<string> | null;
}

const MAX_DEPTH = 10;

interface AdjacencyEdge {
  neighborId: string;
  edgeId: string;
}

/**
 * BFS bidirectional: finds all nodes reachable from focusedNodeId within MAX_DEPTH hops,
 * traversing edges in both directions (upstream + downstream).
 * Uses an adjacency map for O(|V| + |E|) performance and tracks true hop distance.
 */
function computeFocusedIds(
  nodeId: string,
  edges: InfraGraphEdge[]
): { highlightedNodeIds: Set<string>; highlightedEdgeIds: Set<string> } {
  const highlightedNodeIds = new Set<string>([nodeId]);
  const highlightedEdgeIds = new Set<string>();

  if (edges.length === 0) {
    return { highlightedNodeIds, highlightedEdgeIds };
  }

  // Build bidirectional adjacency map
  const adj = new Map<string, AdjacencyEdge[]>();
  for (const edge of edges) {
    const edgeId = `${edge.source}→${edge.target}`;

    if (!adj.has(edge.source)) adj.set(edge.source, []);
    adj.get(edge.source)!.push({ neighborId: edge.target, edgeId });

    if (!adj.has(edge.target)) adj.set(edge.target, []);
    adj.get(edge.target)!.push({ neighborId: edge.source, edgeId });
  }

  // BFS with distance level tracking
  const queue: { id: string; distance: number }[] = [{ id: nodeId, distance: 0 }];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) break;

    const { id, distance } = current;
    if (distance >= MAX_DEPTH) continue;

    const neighbors = adj.get(id);
    if (!neighbors) continue;

    for (const { neighborId, edgeId } of neighbors) {
      highlightedEdgeIds.add(edgeId);

      if (!highlightedNodeIds.has(neighborId)) {
        highlightedNodeIds.add(neighborId);
        queue.push({ id: neighborId, distance: distance + 1 });
      }
    }
  }

  return { highlightedNodeIds, highlightedEdgeIds };
}

export interface UseInfraMapFocusReturn {
  focusedNodeId: string | null;
  highlightedNodeIds: Set<string> | null;
  highlightedEdgeIds: Set<string> | null;
  setFocusedNodeId: (id: string | null) => void;
  clearFocus: () => void;
  focusNodes: (ids: string[]) => void;
}

export function useInfraMapFocus(edges: InfraGraphEdge[]): UseInfraMapFocusReturn {
  const [state, setState] = useState<FocusState>({
    nodeId: null,
    highlightedNodeIds: null,
    highlightedEdgeIds: null,
  });

  const setFocusedNodeId = useCallback(
    (id: string | null) => {
      if (!id) {
        setState({ nodeId: null, highlightedNodeIds: null, highlightedEdgeIds: null });
        return;
      }
      const { highlightedNodeIds, highlightedEdgeIds } = computeFocusedIds(id, edges);
      setState({ nodeId: id, highlightedNodeIds, highlightedEdgeIds });
    },
    [edges]
  );

  const clearFocus = useCallback(() => {
    setState({ nodeId: null, highlightedNodeIds: null, highlightedEdgeIds: null });
  }, []);

  /** Focus multiple nodes at once — union of all their chains. */
  const focusNodes = useCallback(
    (ids: string[]) => {
      if (ids.length === 0) {
        clearFocus();
        return;
      }
      const allNodeIds = new Set<string>();
      const allEdgeIds = new Set<string>();
      for (const id of ids) {
        const { highlightedNodeIds, highlightedEdgeIds } = computeFocusedIds(id, edges);
        highlightedNodeIds.forEach((n) => allNodeIds.add(n));
        highlightedEdgeIds.forEach((e) => allEdgeIds.add(e));
      }
      setState({
        nodeId: ids[0],
        highlightedNodeIds: allNodeIds,
        highlightedEdgeIds: allEdgeIds,
      });
    },
    [edges, clearFocus]
  );

  // Esc key clears focus
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') clearFocus();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [clearFocus]);

  return {
    focusedNodeId: state.nodeId,
    highlightedNodeIds: state.highlightedNodeIds,
    highlightedEdgeIds: state.highlightedEdgeIds,
    setFocusedNodeId,
    clearFocus,
    focusNodes,
  };
}
