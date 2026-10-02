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

  // 1. Compute health alerts from raw graph data
  const allAlerts = useMemo(() => {
    if (!data) return [];
    return computeAllAlerts(data);
  }, [data]);

  // 2. Transform raw graph → ReactFlow nodes/edges + apply health alerts
  const { rfNodes, rfEdges } = useMemo(() => {
    if (!data) return { rfNodes: [], rfEdges: [] };
    const { nodes, edges } = transformToReactFlow(data);
    const nodesWithAlerts = applyHealthAlerts(nodes, allAlerts);
    return { rfNodes: nodesWithAlerts, rfEdges: edges };
  }, [data, allAlerts]);

  // 3. Apply layout (dagre)
  const groupingMode = groupBy === 'provider' ? 'provider' : groupBy === 'platform' ? 'platform' : 'provider';
  const { layoutedNodes, layoutedEdges } = useInfraMapLayout(rfNodes, rfEdges, groupingMode);

  // 4. Focus state (BFS)
  const { highlightedNodeIds, highlightedEdgeIds, focusNodes, clearFocus, focusedNodeId } =
    useInfraMapFocus(data?.edges ?? []);

  // 5. Apply focus state to layouted nodes/edges
  const { nodes: focusedNodes, edges: focusedEdges } = useMemo(() => {
    return applyFocusState(layoutedNodes, layoutedEdges, highlightedNodeIds, highlightedEdgeIds);
  }, [layoutedNodes, layoutedEdges, highlightedNodeIds, highlightedEdgeIds]);

  // 6. Filter by visible node types and alert-only filter
  const filteredNodes = useMemo(() => {
    return focusedNodes.filter((node) => {
      const typeMatch = visibleNodeTypes.has(node.type as InfraNodeType);
      if (!typeMatch) return false;

      if (filterOnlyAlerts) {
        return (node.data as any)?.hasAlert === true;
      }
      return true;
    });
  }, [focusedNodes, visibleNodeTypes, filterOnlyAlerts]);

  const filteredEdges = useMemo(() => {
    const visibleIds = new Set(filteredNodes.map((n) => n.id));
    return focusedEdges.filter(
      (e) => visibleIds.has(e.source) && visibleIds.has(e.target)
    );
  }, [focusedEdges, filteredNodes]);

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
      focusNodes([nodeId]);
      setTimeout(() => {
        fitView({
          nodes: [{ id: nodeId }],
          maxZoom: 1.2,
          padding: 0.3,
        });
      }, 50);
    },
    [focusNodes, fitView]
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
        nodes={filteredNodes}
        groupBy={groupBy}
        onGroupByChange={setGroupBy}
        visibleNodeTypes={visibleNodeTypes}
        onVisibleNodeTypesChange={setVisibleNodeTypes}
        onNodeFocus={handleNodeFocus}
        onFitView={handleFitView}
        onResetFocus={handleResetFocus}
        hasActiveFocus={Boolean(focusedNodeId || selectedAlertType || filterOnlyAlerts)}
        filterOnlyAlerts={filterOnlyAlerts}
        onToggleOnlyAlerts={() => setFilterOnlyAlerts(!filterOnlyAlerts)}
      />

      {/* 3. Graph Viewport Canvas */}
      <div className="flex-1 relative min-h-0 w-full overflow-hidden">
        <InfraMapCanvas
          nodes={filteredNodes}
          edges={filteredEdges}
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
