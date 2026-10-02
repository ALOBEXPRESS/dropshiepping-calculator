import { useState, useCallback, useEffect } from 'react';
import type { InfraGraphEdge } from '@/types/infraGraph';

interface FocusState {
  nodeId: string | null;
  highlightedNodeIds: Set<string> | null;
  highlightedEdgeIds: Set<string> | null;
}

const MAX_DEPTH = 10;

/**
 * BFS bidirectional: finds all nodes reachable from focusedNodeId
 * traversing edges in both directions (upstream + downstream).
 */
function computeFocusedIds(
  nodeId: string,
  edges: InfraGraphEdge[]
): { highlightedNodeIds: Set<string>; highlightedEdgeIds: Set<string> } {
  const highlightedNodeIds = new Set<string>([nodeId]);
  const highlightedEdgeIds = new Set<string>();

  const queue: string[] = [nodeId];
  let depth = 0;

  while (queue.length > 0 && depth < MAX_DEPTH) {
    const current = queue.shift()!;

    for (const edge of edges) {
      const edgeId = `${edge.source}→${edge.target}`;

      // Downstream: current is source
      if (edge.source === current && !highlightedNodeIds.has(edge.target)) {
        highlightedNodeIds.add(edge.target);
        highlightedEdgeIds.add(edgeId);
        queue.push(edge.target);
      }

      // Upstream: current is target
      if (edge.target === current && !highlightedNodeIds.has(edge.source)) {
        highlightedNodeIds.add(edge.source);
        highlightedEdgeIds.add(edgeId);
        queue.push(edge.source);
      }
    }

    depth++;
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
