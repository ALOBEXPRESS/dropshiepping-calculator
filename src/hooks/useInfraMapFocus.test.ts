import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useInfraMapFocus } from './useInfraMapFocus';
import type { InfraGraphEdge } from '@/types/infraGraph';

describe('useInfraMapFocus', () => {
  it('initializes with null focus state', () => {
    const { result } = renderHook(() => useInfraMapFocus([]));
    expect(result.current.focusedNodeId).toBeNull();
    expect(result.current.highlightedNodeIds).toBeNull();
    expect(result.current.highlightedEdgeIds).toBeNull();
  });

  it('traverses single-hop downstream and upstream correctly', () => {
    const edges: InfraGraphEdge[] = [
      { source: 'n1', target: 'n2', relation: 'uses_proxy' },
      { source: 'n0', target: 'n1', relation: 'provides' },
    ];

    const { result } = renderHook(() => useInfraMapFocus(edges));

    act(() => {
      result.current.setFocusedNodeId('n1');
    });

    expect(result.current.focusedNodeId).toBe('n1');
    expect(result.current.highlightedNodeIds).toEqual(new Set(['n0', 'n1', 'n2']));
    expect(result.current.highlightedEdgeIds).toEqual(new Set(['n0→n1', 'n1→n2']));
  });

  it('correctly traverses star topology with more than 10 children without stopping early', () => {
    // Crucial test for the bug where depth++ was incremented on every node popped from queue
    const children = Array.from({ length: 15 }, (_, i) => `child_${i}`);
    const edges: InfraGraphEdge[] = children.map((childId) => ({
      source: 'root',
      target: childId,
      relation: 'uses_proxy',
    }));

    const { result } = renderHook(() => useInfraMapFocus(edges));

    act(() => {
      result.current.setFocusedNodeId('root');
    });

    // Should include root + ALL 15 children (16 nodes total)
    expect(result.current.highlightedNodeIds?.size).toBe(16);
    expect(result.current.highlightedNodeIds?.has('root')).toBe(true);
    for (const childId of children) {
      expect(result.current.highlightedNodeIds?.has(childId)).toBe(true);
    }
    expect(result.current.highlightedEdgeIds?.size).toBe(15);
  });

  it('does not include disconnected islands', () => {
    const edges: InfraGraphEdge[] = [
      { source: 'a1', target: 'a2', relation: 'uses_proxy' },
      { source: 'b1', target: 'b2', relation: 'uses_proxy' },
    ];

    const { result } = renderHook(() => useInfraMapFocus(edges));

    act(() => {
      result.current.setFocusedNodeId('a1');
    });

    expect(result.current.highlightedNodeIds).toEqual(new Set(['a1', 'a2']));
    expect(result.current.highlightedNodeIds?.has('b1')).toBe(false);
    expect(result.current.highlightedNodeIds?.has('b2')).toBe(false);
  });

  it('handles cyclic graphs without infinite looping', () => {
    const edges: InfraGraphEdge[] = [
      { source: 'c1', target: 'c2', relation: 'runs_on' },
      { source: 'c2', target: 'c3', relation: 'runs_on' },
      { source: 'c3', target: 'c1', relation: 'runs_on' },
    ];

    const { result } = renderHook(() => useInfraMapFocus(edges));

    act(() => {
      result.current.setFocusedNodeId('c1');
    });

    expect(result.current.highlightedNodeIds).toEqual(new Set(['c1', 'c2', 'c3']));
    expect(result.current.highlightedEdgeIds?.size).toBe(3);
  });

  it('unions chains when focusing multiple nodes simultaneously', () => {
    const edges: InfraGraphEdge[] = [
      { source: 'chain1_a', target: 'chain1_b', relation: 'uses_proxy' },
      { source: 'chain2_a', target: 'chain2_b', relation: 'uses_proxy' },
      { source: 'unrelated_1', target: 'unrelated_2', relation: 'uses_proxy' },
    ];

    const { result } = renderHook(() => useInfraMapFocus(edges));

    act(() => {
      result.current.focusNodes(['chain1_a', 'chain2_a']);
    });

    expect(result.current.highlightedNodeIds).toEqual(
      new Set(['chain1_a', 'chain1_b', 'chain2_a', 'chain2_b'])
    );
    expect(result.current.highlightedNodeIds?.has('unrelated_1')).toBe(false);
  });

  it('clears focus on clearFocus', () => {
    const edges: InfraGraphEdge[] = [
      { source: 'n1', target: 'n2', relation: 'uses_proxy' },
    ];

    const { result } = renderHook(() => useInfraMapFocus(edges));

    act(() => {
      result.current.setFocusedNodeId('n1');
    });
    expect(result.current.focusedNodeId).toBe('n1');

    act(() => {
      result.current.clearFocus();
    });
    expect(result.current.focusedNodeId).toBeNull();
    expect(result.current.highlightedNodeIds).toBeNull();
    expect(result.current.highlightedEdgeIds).toBeNull();
  });
});
