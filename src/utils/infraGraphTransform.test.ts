import { describe, it, expect } from 'vitest';
import {
  transformToReactFlow,
  applyHealthAlerts,
  applyFocusState,
  EDGE_COLORS,
} from './infraGraphTransform';
import type { InfraGraphResponse, HealthAlert } from '@/types/infraGraph';

describe('infraGraphTransform — transformToReactFlow', () => {
  it('handles empty graph', () => {
    const { nodes, edges } = transformToReactFlow({ nodes: [], edges: [] });
    expect(nodes).toEqual([]);
    expect(edges).toEqual([]);
  });

  it('transforms nodes with initial coordinates (0, 0) and preserves metadata', () => {
    const graph: InfraGraphResponse = {
      nodes: [
        {
          id: 'px_1',
          type: 'proxy',
          label: 'Proxy 1',
          sublabel: '192.168.1.1:8080',
          country: 'BR',
          status: 'active',
          meta: { proxy_type: 'static_residential_isp' },
        },
      ],
      edges: [],
    };

    const { nodes, edges } = transformToReactFlow(graph);
    expect(nodes).toHaveLength(1);
    expect(edges).toHaveLength(0);
    expect(nodes[0].id).toBe('px_1');
    expect(nodes[0].type).toBe('proxy');
    expect(nodes[0].position).toEqual({ x: 0, y: 0 });
    expect(nodes[0].data.label).toBe('Proxy 1');
    expect(nodes[0].data.sublabel).toBe('192.168.1.1:8080');
    expect(nodes[0].data.country).toBe('BR');
  });

  it('transforms edges and formats edgeId correctly', () => {
    const graph: InfraGraphResponse = {
      nodes: [
        { id: 'prv_1', type: 'proxy_provider', label: 'Provider 1', meta: {} },
        { id: 'px_1', type: 'proxy', label: 'Proxy 1', meta: {} },
      ],
      edges: [
        { source: 'prv_1', target: 'px_1', relation: 'provides' },
      ],
    };

    const { edges } = transformToReactFlow(graph);
    expect(edges).toHaveLength(1);
    expect(edges[0].id).toBe('prv_1→px_1');
    expect(edges[0].source).toBe('prv_1');
    expect(edges[0].target).toBe('px_1');
    expect(edges[0].type).toBe('smoothstep');
    expect(edges[0].style?.stroke).toBe(EDGE_COLORS.provides);
  });

  it('highlights country mismatch edges with red dashed warning style', () => {
    const graph: InfraGraphResponse = {
      nodes: [
        { id: 'px_1', type: 'proxy', label: 'US Proxy', country: 'US', meta: {} },
        { id: 'pa_1', type: 'platform_account', label: 'BR Account', country: 'BR', meta: {} },
      ],
      edges: [
        { source: 'px_1', target: 'pa_1', relation: 'uses_proxy' },
      ],
    };

    const { edges } = transformToReactFlow(graph);
    expect(edges).toHaveLength(1);
    expect(edges[0].data?.isWarning).toBe(true);
    expect(edges[0].style?.stroke).toBe('#EF4444');
    expect(edges[0].style?.strokeDasharray).toBe('6 4');
  });

  it('renders runs_on edge as solid green line when device is linked to exactly 1 account (1:1 ideal)', () => {
    const graph: InfraGraphResponse = {
      nodes: [
        { id: 'dv_1', type: 'device', label: 'Samsung Galaxy A10', meta: {} },
        { id: 'pa_1', type: 'platform_account', label: 'TikTok Account 1', meta: {} },
      ],
      edges: [
        { source: 'dv_1', target: 'pa_1', relation: 'runs_on' },
      ],
    };

    const { edges } = transformToReactFlow(graph);
    expect(edges).toHaveLength(1);
    expect(edges[0].style?.stroke).toBe('#22C55E');
    expect(edges[0].style?.strokeDasharray).toBeUndefined();
    expect(edges[0].label).toBe('✓ 1:1 Ideal');
    expect(edges[0].data?.isIdeal).toBe(true);
    expect(edges[0].data?.isWarning).toBe(false);
  });

  it('renders runs_on edges as red warning lines when device is linked to multiple accounts', () => {
    const graph: InfraGraphResponse = {
      nodes: [
        { id: 'dv_1', type: 'device', label: 'Samsung Galaxy A10', meta: {} },
        { id: 'pa_1', type: 'platform_account', label: 'TikTok Account 1', meta: {} },
        { id: 'pa_2', type: 'platform_account', label: 'TikTok Account 2', meta: {} },
      ],
      edges: [
        { source: 'dv_1', target: 'pa_1', relation: 'runs_on' },
        { source: 'dv_1', target: 'pa_2', relation: 'runs_on' },
      ],
    };

    const { edges } = transformToReactFlow(graph);
    expect(edges).toHaveLength(2);
    for (const edge of edges) {
      expect(edge.style?.stroke).toBe('#EF4444');
      expect(edge.style?.strokeDasharray).toBe('6 4');
      expect(edge.label).toContain('⚠️ Multi-Contas');
      expect(edge.data?.isWarning).toBe(true);
      expect(edge.data?.isIdeal).toBe(false);
    }
  });
});

describe('infraGraphTransform — applyHealthAlerts', () => {
  const baseNodes = [
    {
      id: 'px_1',
      type: 'proxy',
      position: { x: 0, y: 0 },
      data: {
        id: 'px_1',
        type: 'proxy' as const,
        label: 'Proxy 1',
        meta: {},
      },
    },
    {
      id: 'pa_1',
      type: 'platform_account',
      position: { x: 0, y: 0 },
      data: {
        id: 'pa_1',
        type: 'platform_account' as const,
        label: 'Account 1',
        meta: {},
      },
    },
  ];

  it('ignores info severity alerts', () => {
    const alerts: HealthAlert[] = [
      {
        type: 'proxy_without_account',
        severity: 'info',
        count: 0,
        nodeIds: ['px_1'],
        message: 'Info message',
        label: 'Tudo certo',
      },
    ];

    const result = applyHealthAlerts(baseNodes, alerts);
    expect(result[0].data.hasAlert).toBeUndefined();
  });

  it('applies warnings and errors to matching nodes', () => {
    const alerts: HealthAlert[] = [
      {
        type: 'account_without_proxy',
        severity: 'warning',
        count: 1,
        nodeIds: ['pa_1'],
        message: 'Conta sem proxy',
        label: 'Conta sem proxy',
      },
    ];

    const result = applyHealthAlerts(baseNodes, alerts);
    expect(result[0].data.hasAlert).toBeUndefined();
    expect(result[1].data.hasAlert).toBe(true);
    expect(result[1].data.alertTypes).toEqual(['account_without_proxy']);
  });

  it('accumulates multiple alert types on the same node', () => {
    const alerts: HealthAlert[] = [
      {
        type: 'proxy_without_account',
        severity: 'warning',
        count: 1,
        nodeIds: ['px_1'],
        message: 'Proxy sem conta',
        label: 'Proxy sem conta',
      },
      {
        type: 'expired_proxy_active',
        severity: 'error',
        count: 1,
        nodeIds: ['px_1'],
        message: 'Proxy expirado',
        label: 'Proxy expirado',
      },
    ];

    const result = applyHealthAlerts(baseNodes, alerts);
    expect(result[0].data.hasAlert).toBe(true);
    expect(result[0].data.alertTypes).toEqual(['proxy_without_account', 'expired_proxy_active']);
  });
});

describe('infraGraphTransform — applyFocusState', () => {
  const nodes = [
    {
      id: 'n1',
      type: 'proxy',
      position: { x: 0, y: 0 },
      data: { id: 'n1', type: 'proxy' as const, label: 'N1', meta: {} },
    },
    {
      id: 'n2',
      type: 'platform_account',
      position: { x: 0, y: 0 },
      data: { id: 'n2', type: 'platform_account' as const, label: 'N2', meta: {} },
    },
  ];

  const edges = [
    {
      id: 'n1→n2',
      source: 'n1',
      target: 'n2',
      data: {},
    },
  ];

  it('clears highlight and dim state when highlightedNodeIds is null', () => {
    const { nodes: resultNodes, edges: resultEdges } = applyFocusState(nodes, edges, null, null);
    expect(resultNodes[0].data.isHighlighted).toBe(false);
    expect(resultNodes[0].data.isDimmed).toBe(false);
    expect(resultNodes[1].data.isHighlighted).toBe(false);
    expect(resultNodes[1].data.isDimmed).toBe(false);
    expect(resultEdges[0].animated).toBe(false);
  });

  it('dims non-highlighted nodes and highlights target nodes', () => {
    const highlightedNodes = new Set(['n1']);
    const highlightedEdges = new Set<string>();

    const { nodes: resultNodes, edges: resultEdges } = applyFocusState(
      nodes,
      edges,
      highlightedNodes,
      highlightedEdges
    );

    expect(resultNodes[0].data.isHighlighted).toBe(true);
    expect(resultNodes[0].data.isDimmed).toBe(false);
    expect(resultNodes[1].data.isHighlighted).toBe(false);
    expect(resultNodes[1].data.isDimmed).toBe(true);
    expect(resultEdges[0].animated).toBe(false);
  });

  it('animates highlighted edges', () => {
    const highlightedNodes = new Set(['n1', 'n2']);
    const highlightedEdges = new Set(['n1→n2']);

    const { nodes: resultNodes, edges: resultEdges } = applyFocusState(
      nodes,
      edges,
      highlightedNodes,
      highlightedEdges
    );

    expect(resultNodes[0].data.isHighlighted).toBe(true);
    expect(resultNodes[0].data.isHighlighted).toBe(true);
    expect(resultEdges[0].animated).toBe(true);
  });
});
