import React, { useState, useCallback, useMemo } from 'react';
import { ReactFlowProvider, useReactFlow } from '@xyflow/react';
import type { Node } from '@xyflow/react';
import { Loader2, AlertCircle, Network, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useInfraGraph } from '@/hooks/useInfraGraph';
import { useInfraMapLayout } from '@/hooks/useInfraMapLayout';
import { useInfraMapFocus } from '@/hooks/useInfraMapFocus';
import { InfraMapCanvas } from '@/components/infra-map/InfraMapCanvas';
import { InfraMapToolbar } from '@/components/infra-map/InfraMapToolbar';
import { InfraMapSidebarSheet } from '@/components/infra-map/InfraMapSidebarSheet';
import { HealthKpis } from '@/components/infra-map/HealthKpis';
import { InfraMapLegend } from '@/components/infra-map/InfraMapLegend';
import type { InfraNodeType } from '@/types/infraGraph';
import { useSettings } from '@/contexts/SettingsContext';
import {
  transformToReactFlow,
  applyHealthAlerts,
  applyFocusState,
  type InfraNodeData,
} from '@/utils/infraGraphTransform';
import { computeAllAlerts } from '@/utils/infraGraphHealth';

const ALL_NODE_TYPES: InfraNodeType[] = [
  'proxy_provider',
  'proxy',
  'platform_account',
  'browser_profile',
  'device',
  'business_center',
  'ad_account',
  'campaign',
  'titular',
];

const InfraMapContent: React.FC = () => {
  const { organizationId } = useSettings();
  const { data, isLoading, error, refetch } = useInfraGraph(organizationId);
  const { fitView } = useReactFlow();

  const [groupBy, setGroupBy] = useState<'none' | 'provider' | 'platform'>('none');
  const [visibleNodeTypes, setVisibleNodeTypes] = useState<Set<InfraNodeType>>(
    new Set(ALL_NODE_TYPES)
  );
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedAlertType, setSelectedAlertType] = useState<string | null>(null);
  const [filterOnlyAlerts, setFilterOnlyAlerts] = useState(false);
  const [hideUnused, setHideUnused] = useState(true);

  // 1. Compute health alerts from raw graph data
  const allAlerts = useMemo(() => {
    if (!data) return [];
    return computeAllAlerts(data);
  }, [data]);

  // 2. Identify connected node IDs (in-degree > 0 or out-degree > 0)
  const connectedNodeIds = useMemo(() => {
    if (!data?.edges) return new Set<string>();
    const set = new Set<string>();
    for (const edge of data.edges) {
      set.add(edge.source);
      set.add(edge.target);
    }
    return set;
  }, [data]);

  // 3. Identify nodes that are flagged by active health alerts
  const alertNodeIds = useMemo(() => {
    const set = new Set<string>();
    for (const alert of allAlerts) {
      for (const id of alert.nodeIds) {
        set.add(id);
      }
    }
    return set;
  }, [allAlerts]);

  // Helper: determine if a node is idle/unused (no connections and no active alerts)
  const isNodeUnused = useCallback(
    (nodeId: string) => {
      if (connectedNodeIds.has(nodeId)) return false;
      if (alertNodeIds.has(nodeId)) return false;
      return true;
    },
    [connectedNodeIds, alertNodeIds]
  );

  // 4. Transform raw graph → ReactFlow nodes/edges + apply health alerts
  const { rfNodes, rfEdges } = useMemo(() => {
    if (!data) return { rfNodes: [], rfEdges: [] };
    const { nodes, edges } = transformToReactFlow(data);
    const nodesWithAlerts = applyHealthAlerts(nodes, allAlerts);
    return { rfNodes: nodesWithAlerts, rfEdges: edges };
  }, [data, allAlerts]);

  // Count unused/idle nodes within currently visible types
  const unusedCount = useMemo(() => {
    return rfNodes.filter(
      (n) => visibleNodeTypes.has(n.type as InfraNodeType) && isNodeUnused(n.id)
    ).length;
  }, [rfNodes, visibleNodeTypes, isNodeUnused]);

  // 5. Focus state (BFS)
  const { highlightedNodeIds, highlightedEdgeIds, focusNodes, clearFocus, focusedNodeId } =
    useInfraMapFocus(data?.edges ?? []);

  // 6. Filter active nodes before applying layout
  const activeNodes = useMemo(() => {
    return rfNodes.filter((node) => {
      // A. Node type visibility filter
      if (!visibleNodeTypes.has(node.type as InfraNodeType)) return false;

      // B. Hide unused/idle nodes by default
      if (hideUnused && isNodeUnused(node.id)) {
        // Exception: Keep visible if explicitly focused/selected by user
        if (focusedNodeId === node.id || highlightedNodeIds?.has(node.id)) {
          return true;
        }
        return false;
      }

      // C. Filter only alerts
      if (filterOnlyAlerts) {
        return (node.data as unknown as InfraNodeData)?.hasAlert === true;
      }

      return true;
    });
  }, [
    rfNodes,
    visibleNodeTypes,
    hideUnused,
    isNodeUnused,
    filterOnlyAlerts,
    focusedNodeId,
    highlightedNodeIds,
  ]);

  const activeEdges = useMemo(() => {
    const visibleIds = new Set(activeNodes.map((n) => n.id));
    return rfEdges.filter(
      (e) => visibleIds.has(e.source) && visibleIds.has(e.target)
    );
  }, [rfEdges, activeNodes]);

  // 7. Apply Dagre layout strictly to visible/active nodes
  const groupingMode = groupBy === 'provider' ? 'provider' : groupBy === 'platform' ? 'platform' : 'provider';
  const { layoutedNodes, layoutedEdges } = useInfraMapLayout(activeNodes, activeEdges, groupingMode);

  // 8. Apply focus state to layouted nodes/edges
  const { nodes: focusedNodes, edges: focusedEdges } = useMemo(() => {
    return applyFocusState(layoutedNodes, layoutedEdges, highlightedNodeIds, highlightedEdgeIds);
  }, [layoutedNodes, layoutedEdges, highlightedNodeIds, highlightedEdgeIds]);

  const handleNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    setSheetOpen(true);
  }, []);

  const handlePaneClick = useCallback(() => {
    clearFocus();
    setSelectedAlertType(null);
  }, [clearFocus]);

  const handleNodeFocus = useCallback(
    (nodeId: string) => {
      if (isNodeUnused(nodeId) && hideUnused) {
        setHideUnused(false);
      }
      focusNodes([nodeId]);
      setTimeout(() => {
        fitView({
          nodes: [{ id: nodeId }],
          maxZoom: 1.2,
          padding: 0.3,
        });
      }, 50);
    },
    [focusNodes, fitView, isNodeUnused, hideUnused]
  );

  const handleFitView = useCallback(() => {
    fitView({ padding: 0.15 });
  }, [fitView]);

  const handleResetFocus = useCallback(() => {
    clearFocus();
    setSelectedAlertType(null);
    setFilterOnlyAlerts(false);
    setTimeout(() => {
      fitView({ padding: 0.15 });
    }, 50);
  }, [clearFocus, fitView]);

  const handleAlertTypeClick = useCallback(
    (alertType: string) => {
      if (selectedAlertType === alertType) {
        // Toggle off
        handleResetFocus();
        return;
      }

      setSelectedAlertType(alertType);
      const matchingAlerts = allAlerts.filter((a) => a.type === alertType);
      const ids = matchingAlerts.flatMap((a) => a.nodeIds);
      if (ids.length > 0) {
        const uniqueIds = [...new Set(ids)];
        focusNodes(uniqueIds);
        setTimeout(() => {
          fitView({
            nodes: uniqueIds.map((id) => ({ id })),
            padding: 0.25,
          });
        }, 50);
      }
    },
    [allAlerts, focusNodes, fitView, selectedAlertType, handleResetFocus]
  );

  // ── Loading & Error States ───────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full bg-background p-6">
        <div className="text-center space-y-4 max-w-sm p-8 rounded-2xl bg-card/60 backdrop-blur-md border border-border/80 shadow-2xl">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <div>
            <h3 className="text-sm font-semibold text-foreground">Carregando Mapa de Infraestrutura</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Computando conexões e topologia de proxies, contas e perfis...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full bg-background p-6">
        <div className="text-center space-y-4 max-w-md p-8 rounded-2xl bg-card/60 backdrop-blur-md border border-rose-500/30 shadow-2xl">
          <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center mx-auto text-rose-500">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">Falha ao Carregar o Mapa</h2>
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
              {error instanceof Error ? error.message : 'Ocorreu um erro inesperado ao conectar com a base de dados.'}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="gap-2 text-xs border-border/80 hover:bg-accent"
          >
            <RefreshCw className="w-3.5 h-3.5 text-primary" />
            Tentar Novamente
          </Button>
        </div>
      </div>
    );
  }

  if (!data || rfNodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full bg-background p-6">
        <div className="text-center space-y-4 max-w-md p-8 rounded-2xl bg-card/60 backdrop-blur-md border border-border/80 shadow-2xl">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto text-primary">
            <Network className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">Nenhum Recurso Encontrado</h2>
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
              Cadastre proxies, provedores, perfis de navegador e contas para visualizar o grafo de conexões interativo.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-background">
      {/* 1. Health Diagnostics Bar */}
      <HealthKpis
        alerts={allAlerts}
        selectedAlertType={selectedAlertType}
        onAlertTypeClick={handleAlertTypeClick}
        onClearFilter={handleResetFocus}
      />

      {/* 2. Interactive Toolbar */}
      <InfraMapToolbar
        nodes={focusedNodes}
        allNodes={rfNodes}
        groupBy={groupBy}
        onGroupByChange={setGroupBy}
        visibleNodeTypes={visibleNodeTypes}
        onVisibleNodeTypesChange={setVisibleNodeTypes}
        onNodeFocus={handleNodeFocus}
        onFitView={handleFitView}
        onResetFocus={handleResetFocus}
        hasActiveFocus={Boolean(focusedNodeId || selectedAlertType || filterOnlyAlerts || !hideUnused)}
        filterOnlyAlerts={filterOnlyAlerts}
        onToggleOnlyAlerts={() => setFilterOnlyAlerts(!filterOnlyAlerts)}
        hideUnused={hideUnused}
        onToggleHideUnused={() => {
          setHideUnused((prev) => !prev);
          setTimeout(() => {
            fitView({ padding: 0.15 });
          }, 50);
        }}
        unusedCount={unusedCount}
        totalNodesCount={rfNodes.length}
      />

      {/* 3. Graph Viewport Canvas */}
      <div className="flex-1 relative min-h-0 w-full overflow-hidden">
        <InfraMapCanvas
          nodes={focusedNodes}
          edges={focusedEdges}
          onNodeClick={handleNodeClick}
          onPaneClick={handlePaneClick}
        />

        {/* Floating Collapsible Legend */}
        <InfraMapLegend />
      </div>

      {/* 4. Node Detail Inspector Sheet */}
      <InfraMapSidebarSheet
        node={selectedNode}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        allAlerts={allAlerts}
        onFocusNode={handleNodeFocus}
      />
    </div>
  );
};

export const InfraMapPage: React.FC = () => {
  return (
    <ReactFlowProvider>
      <InfraMapContent />
    </ReactFlowProvider>
  );
};
