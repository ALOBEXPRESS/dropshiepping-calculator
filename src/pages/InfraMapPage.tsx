import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ReactFlowProvider, useReactFlow, type OnNodeDrag, type Viewport, type Edge } from '@xyflow/react';
import type { Node } from '@xyflow/react';
import { Loader2, AlertCircle, Network, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useInfraGraph } from '@/hooks/useInfraGraph';
import { useInfraMapLayout } from '@/hooks/useInfraMapLayout';
import { useInfraMapFocus } from '@/hooks/useInfraMapFocus';
import { InfraMapCanvas } from '@/components/infra-map/InfraMapCanvas';
import { InfraMapToolbar, NODE_TYPE_LABELS } from '@/components/infra-map/InfraMapToolbar';
import { InfraMapSidebarSheet } from '@/components/infra-map/InfraMapSidebarSheet';
import { HealthKpis } from '@/components/infra-map/HealthKpis';
import { InfraMapLegend } from '@/components/infra-map/InfraMapLegend';
import { NodeContextMenu } from '@/components/infra-map/NodeContextMenu';
import { EdgeContextMenu, type CustomEdgeStyle } from '@/components/infra-map/EdgeContextMenu';
import type { NodeSize } from '@/components/infra-map/nodes/BaseNode';
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
  const { fitView, getViewport } = useReactFlow();

  // 0. Saved Viewport (camera pan & zoom) with localStorage persistence
  const [savedViewport, setSavedViewport] = useState<Viewport | null>(() => {
    try {
      const raw = localStorage.getItem(`infra_map_viewport_${organizationId || 'default'}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (typeof parsed?.x === 'number' && typeof parsed?.y === 'number' && typeof parsed?.zoom === 'number') {
          return parsed;
        }
      }
    } catch {}
    return null;
  });

  const handleViewportChange = useCallback((vp: Viewport) => {
    setSavedViewport(vp);
    try {
      localStorage.setItem(
        `infra_map_viewport_${organizationId || 'default'}`,
        JSON.stringify(vp)
      );
    } catch {}
  }, [organizationId]);

  // 1. Group By with localStorage persistence
  const [groupBy, setGroupByState] = useState<'none' | 'provider' | 'platform'>(() => {
    try {
      const saved = localStorage.getItem(`infra_map_group_by_${organizationId || 'default'}`);
      if (saved === 'none' || saved === 'provider' || saved === 'platform') {
        return saved;
      }
    } catch {}
    return 'none';
  });

  const setGroupBy = useCallback((mode: 'none' | 'provider' | 'platform') => {
    setGroupByState(mode);
    try {
      localStorage.setItem(`infra_map_group_by_${organizationId || 'default'}`, mode);
    } catch {}
    setTimeout(() => {
      fitView({ padding: 0.15 });
    }, 100);
  }, [organizationId, fitView]);

  // 2. Visible Node Types with localStorage persistence
  const [visibleNodeTypes, setVisibleNodeTypesState] = useState<Set<InfraNodeType>>(() => {
    try {
      const saved = localStorage.getItem(`infra_map_visible_types_${organizationId || 'default'}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return new Set(parsed as InfraNodeType[]);
        }
      }
    } catch {}
    return new Set(ALL_NODE_TYPES);
  });

  const setVisibleNodeTypes = useCallback((types: Set<InfraNodeType>) => {
    setVisibleNodeTypesState(types);
    try {
      localStorage.setItem(
        `infra_map_visible_types_${organizationId || 'default'}`,
        JSON.stringify(Array.from(types))
      );
    } catch {}
  }, [organizationId]);

  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedAlertType, setSelectedAlertType] = useState<string | null>(null);
  const [filterOnlyAlerts, setFilterOnlyAlerts] = useState(false);

  // 3. Hide Unused with localStorage persistence
  const [hideUnused, setHideUnusedState] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(`infra_map_hide_unused_${organizationId || 'default'}`);
      if (saved !== null) {
        return saved === 'true';
      }
    } catch {}
    return true;
  });

  const setHideUnused = useCallback((updater: boolean | ((prev: boolean) => boolean)) => {
    setHideUnusedState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      try {
        localStorage.setItem(`infra_map_hide_unused_${organizationId || 'default'}`, String(next));
      } catch {}
      return next;
    });
  }, [organizationId]);

  // 4. Custom node positions persisted in localStorage PER grouping mode
  const [customPositions, setCustomPositions] = useState<Record<string, { x: number; y: number }>>(() => {
    try {
      const raw = localStorage.getItem(`infra_map_positions_${organizationId || 'default'}_${groupBy}`);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  // 5. Node size with localStorage persistence
  const [nodeSize, setNodeSizeState] = useState<NodeSize>(() => {
    try {
      const saved = localStorage.getItem(`infra_map_node_size_${organizationId || 'default'}`);
      if (saved === 'small' || saved === 'medium' || saved === 'large') {
        return saved;
      }
    } catch {}
    return 'medium';
  });

  const setNodeSize = useCallback((size: NodeSize) => {
    setNodeSizeState(size);
    try {
      localStorage.setItem(`infra_map_node_size_${organizationId || 'default'}`, size);
    } catch {}
  }, [organizationId]);

  // 6. Diagnostic bar visibility with localStorage persistence
  const [showDiagnostic, setShowDiagnosticState] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(`infra_map_show_diagnostic_${organizationId || 'default'}`);
      if (saved !== null) return saved === 'true';
    } catch {}
    return true;
  });

  const setShowDiagnostic = useCallback((updater: boolean | ((prev: boolean) => boolean)) => {
    setShowDiagnosticState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      try {
        localStorage.setItem(`infra_map_show_diagnostic_${organizationId || 'default'}`, String(next));
      } catch {}
      return next;
    });
  }, [organizationId]);

  // 7. Manually hidden node IDs with localStorage persistence
  const [hiddenNodeIds, setHiddenNodeIds] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem(`infra_map_hidden_nodes_${organizationId || 'default'}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return new Set<string>(parsed);
      }
    } catch {}
    return new Set<string>();
  });

  const handleHideNode = useCallback((nodeId: string) => {
    setHiddenNodeIds((prev) => {
      const next = new Set(prev);
      next.add(nodeId);
      try {
        localStorage.setItem(
          `infra_map_hidden_nodes_${organizationId || 'default'}`,
          JSON.stringify(Array.from(next))
        );
      } catch {}
      return next;
    });
    toast.info('Nó ocultado. Clique no indicador de nós ocultos para restaurar.');
  }, [organizationId]);

  const handleRestoreHiddenNodes = useCallback(() => {
    const count = hiddenNodeIds.size;
    setHiddenNodeIds(new Set());
    try {
      localStorage.removeItem(`infra_map_hidden_nodes_${organizationId || 'default'}`);
    } catch {}
    toast.success(`${count} nó${count !== 1 ? 's' : ''} restaurado${count !== 1 ? 's' : ''}!`);
  }, [hiddenNodeIds.size, organizationId]);

  // 8. Custom accent color per node with localStorage persistence
  const [customColors, setCustomColors] = useState<Record<string, string>>(() => {
    try {
      const raw = localStorage.getItem(`infra_map_custom_colors_${organizationId || 'default'}`);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  const handleColorChange = useCallback((nodeId: string, color: string | null) => {
    setCustomColors((prev) => {
      const next = { ...prev };
      if (color) {
        next[nodeId] = color;
      } else {
        delete next[nodeId];
      }
      try {
        localStorage.setItem(
          `infra_map_custom_colors_${organizationId || 'default'}`,
          JSON.stringify(next)
        );
      } catch {}
      return next;
    });
    if (color) {
      toast.success('Cor personalizada aplicada!');
    } else {
      toast.info('Cor original restaurada!');
    }
  }, [organizationId]);

  // 8.1 Custom connection line styles (color, dash pattern, stroke width) with localStorage persistence
  const [customEdgeStyles, setCustomEdgeStyles] = useState<Record<string, CustomEdgeStyle>>(() => {
    try {
      const raw = localStorage.getItem(`infra_map_custom_edge_styles_${organizationId || 'default'}`);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  const handleEdgeStyleChange = useCallback((edgeId: string, style: CustomEdgeStyle | null) => {
    setCustomEdgeStyles((prev) => {
      const next = { ...prev };
      if (style) {
        next[edgeId] = style;
      } else {
        delete next[edgeId];
      }
      try {
        localStorage.setItem(
          `infra_map_custom_edge_styles_${organizationId || 'default'}`,
          JSON.stringify(next)
        );
      } catch {}
      return next;
    });
    if (style) {
      toast.success('Estilo da linha atualizado!');
    } else {
      toast.info('Estilo original da linha restaurado!');
    }
  }, [organizationId]);

  // 9. Hide entire module (all nodes of a specific type)
  const handleHideModule = useCallback((moduleType: InfraNodeType) => {
    setVisibleNodeTypesState((prev) => {
      const next = new Set(prev);
      next.delete(moduleType);
      try {
        localStorage.setItem(
          `infra_map_visible_types_${organizationId || 'default'}`,
          JSON.stringify(Array.from(next))
        );
      } catch {}
      return next;
    });
    toast.info(`Módulo "${NODE_TYPE_LABELS[moduleType] || moduleType}" ocultado. Reative-o a qualquer momento no botão "Módulos".`);
  }, [organizationId]);

  // 10. Explicitly Save Current View as Permanent Default
  const handleSaveView = useCallback(() => {
    try {
      const currentVp = getViewport();
      setSavedViewport(currentVp);
      localStorage.setItem(
        `infra_map_viewport_${organizationId || 'default'}`,
        JSON.stringify(currentVp)
      );
      localStorage.setItem(
        `infra_map_visible_types_${organizationId || 'default'}`,
        JSON.stringify(Array.from(visibleNodeTypes))
      );
      localStorage.setItem(
        `infra_map_group_by_${organizationId || 'default'}`,
        groupBy
      );
      localStorage.setItem(
        `infra_map_node_size_${organizationId || 'default'}`,
        nodeSize
      );
      localStorage.setItem(
        `infra_map_hide_unused_${organizationId || 'default'}`,
        String(hideUnused)
      );
      localStorage.setItem(
        `infra_map_show_diagnostic_${organizationId || 'default'}`,
        String(showDiagnostic)
      );
      localStorage.setItem(
        `infra_map_custom_colors_${organizationId || 'default'}`,
        JSON.stringify(customColors)
      );
      localStorage.setItem(
        `infra_map_custom_edge_styles_${organizationId || 'default'}`,
        JSON.stringify(customEdgeStyles)
      );
      toast.success('Visualização padrão salva com sucesso!', {
        description: 'Zoom, câmera, módulos visíveis, cores de nós e linhas serão restaurados automaticamente.',
      });
    } catch (e) {
      console.warn('Failed to save layout view:', e);
      toast.error('Erro ao salvar visualização no armazenamento local.');
    }
  }, [getViewport, organizationId, visibleNodeTypes, groupBy, nodeSize, hideUnused, showDiagnostic, customColors, customEdgeStyles]);

  // 11. Context menu state
  const [contextMenu, setContextMenu] = useState<{
    nodeId: string;
    nodeType: InfraNodeType;
    nodeLabel: string;
    x: number;
    y: number;
    currentColor?: string | null;
  } | null>(null);

  const handleNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: Node) => {
      const data = node.data as unknown as InfraNodeData;
      setContextMenu({
        nodeId: node.id,
        nodeType: node.type as InfraNodeType,
        nodeLabel: data?.label || node.id,
        x: event.clientX,
        y: event.clientY,
        currentColor: customColors[node.id] || null,
      });
    },
    [customColors]
  );

  // Re-read settings and custom positions if organizationId or groupBy changes
  useEffect(() => {
    try {
      const savedGroupBy = localStorage.getItem(`infra_map_group_by_${organizationId || 'default'}`);
      if (savedGroupBy === 'none' || savedGroupBy === 'provider' || savedGroupBy === 'platform') {
        setGroupByState(savedGroupBy);
      }
      const savedTypes = localStorage.getItem(`infra_map_visible_types_${organizationId || 'default'}`);
      if (savedTypes) {
        const parsed = JSON.parse(savedTypes);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setVisibleNodeTypesState(new Set(parsed as InfraNodeType[]));
        }
      }
      const savedHide = localStorage.getItem(`infra_map_hide_unused_${organizationId || 'default'}`);
      if (savedHide !== null) {
        setHideUnusedState(savedHide === 'true');
      }
      const rawPos = localStorage.getItem(`infra_map_positions_${organizationId || 'default'}_${groupBy}`);
      setCustomPositions(rawPos ? JSON.parse(rawPos) : {});

      const savedNodeSize = localStorage.getItem(`infra_map_node_size_${organizationId || 'default'}`);
      if (savedNodeSize === 'small' || savedNodeSize === 'medium' || savedNodeSize === 'large') {
        setNodeSizeState(savedNodeSize);
      }
      const savedDiag = localStorage.getItem(`infra_map_show_diagnostic_${organizationId || 'default'}`);
      if (savedDiag !== null) {
        setShowDiagnosticState(savedDiag === 'true');
      }
      const savedHidden = localStorage.getItem(`infra_map_hidden_nodes_${organizationId || 'default'}`);
      if (savedHidden) {
        const parsed = JSON.parse(savedHidden);
        if (Array.isArray(parsed)) setHiddenNodeIds(new Set<string>(parsed));
      }
      const savedColors = localStorage.getItem(`infra_map_custom_colors_${organizationId || 'default'}`);
      setCustomColors(savedColors ? JSON.parse(savedColors) : {});

      const savedEdgeStyles = localStorage.getItem(`infra_map_custom_edge_styles_${organizationId || 'default'}`);
      setCustomEdgeStyles(savedEdgeStyles ? JSON.parse(savedEdgeStyles) : {});

      const savedVp = localStorage.getItem(`infra_map_viewport_${organizationId || 'default'}`);
      if (savedVp) {
        const parsed = JSON.parse(savedVp);
        if (typeof parsed?.x === 'number' && typeof parsed?.y === 'number' && typeof parsed?.zoom === 'number') {
          setSavedViewport(parsed);
        }
      }
    } catch {
      setCustomPositions({});
    }
  }, [organizationId, groupBy]);

  const handleNodeDragStop: OnNodeDrag<Node> = useCallback((_event, node) => {
    setCustomPositions((prev) => {
      const updated = {
        ...prev,
        [node.id]: { x: Math.round(node.position.x), y: Math.round(node.position.y) },
      };
      try {
        localStorage.setItem(
          `infra_map_positions_${organizationId || 'default'}_${groupBy}`,
          JSON.stringify(updated)
        );
      } catch (e) {
        console.warn('Failed to save node position:', e);
      }
      return updated;
    });
  }, [organizationId, groupBy]);

  const handleResetLayout = useCallback(() => {
    try {
      localStorage.removeItem(`infra_map_positions_${organizationId || 'default'}_${groupBy}`);
    } catch (e) {
      console.warn('Failed to remove saved positions:', e);
    }
    setCustomPositions({});
    toast.success('Layout do mapa redefinido para a organização automática!');
    setTimeout(() => {
      fitView({ padding: 0.15 });
    }, 60);
  }, [organizationId, groupBy, fitView]);

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

  // Count unused/idle nodes within currently visible types (excluding manually hidden)
  const unusedCount = useMemo(() => {
    return rfNodes.filter(
      (n) => !hiddenNodeIds.has(n.id) && visibleNodeTypes.has(n.type as InfraNodeType) && isNodeUnused(n.id)
    ).length;
  }, [rfNodes, hiddenNodeIds, visibleNodeTypes, isNodeUnused]);

  // 5. Focus state (BFS)
  const { highlightedNodeIds, highlightedEdgeIds, focusNodes, clearFocus, focusedNodeId } =
    useInfraMapFocus(data?.edges ?? []);

  // 6. Filter active nodes before applying layout
  const activeNodes = useMemo(() => {
    return rfNodes.filter((node) => {
      // 0. Manual hidden nodes
      if (hiddenNodeIds.has(node.id)) return false;

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
    hiddenNodeIds,
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

  // 7. Apply layout strictly to visible/active nodes + custom user positions
  const { layoutedNodes, layoutedEdges } = useInfraMapLayout(
    activeNodes,
    activeEdges,
    groupBy,
    customPositions,
    nodeSize
  );

  // 8. Apply focus state to layouted nodes/edges + inject nodeSize, customColor & customEdgeStyles
  const { nodes: focusedNodes, edges: focusedEdges } = useMemo(() => {
    const res = applyFocusState(layoutedNodes, layoutedEdges, highlightedNodeIds, highlightedEdgeIds);
    const enrichedNodes = res.nodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        nodeSize,
        customColor: customColors[node.id] || null,
      },
    }));

    const enrichedEdges = res.edges.map((edge) => {
      const custom = customEdgeStyles[edge.id];
      if (!custom) return edge;
      return {
        ...edge,
        style: {
          ...edge.style,
          ...(custom.stroke ? { stroke: custom.stroke } : {}),
          ...(custom.strokeDasharray !== undefined
            ? { strokeDasharray: custom.strokeDasharray ? custom.strokeDasharray : undefined }
            : {}),
          ...(custom.strokeWidth ? { strokeWidth: custom.strokeWidth } : {}),
        },
        data: {
          ...edge.data,
          customStyle: custom,
        },
      };
    });

    return { nodes: enrichedNodes, edges: enrichedEdges };
  }, [layoutedNodes, layoutedEdges, highlightedNodeIds, highlightedEdgeIds, nodeSize, customColors, customEdgeStyles]);

  // 12. Edge Context Menu / Customizer state
  const [edgeMenu, setEdgeMenu] = useState<{
    edgeId: string;
    sourceLabel?: string;
    targetLabel?: string;
    relation?: string;
    isWarning?: boolean;
    warningReason?: string;
    x: number;
    y: number;
    defaultStroke?: string;
  } | null>(null);

  const handleEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    event.stopPropagation();
    const sourceNode = activeNodes.find((n) => n.id === edge.source);
    const targetNode = activeNodes.find((n) => n.id === edge.target);
    const isWarning = Boolean(edge.data?.isWarning);
    const relation = (edge.data?.relation as string) || '';

    let warningReason = '';
    if (relation === 'runs_on' && isWarning) {
      warningReason = 'Dispositivo vinculado a múltiplas contas';
    } else if (
      sourceNode?.country &&
      targetNode?.country &&
      sourceNode.country.trim().toUpperCase() !== targetNode.country.trim().toUpperCase()
    ) {
      warningReason = `Divergência de País (${sourceNode.country} ≠ ${targetNode.country})`;
    } else if (isWarning) {
      warningReason = 'Alerta de integridade anti-ban';
    }

    setContextMenu(null);
    setEdgeMenu({
      edgeId: edge.id,
      sourceLabel: (sourceNode?.data as any)?.label || sourceNode?.id,
      targetLabel: (targetNode?.data as any)?.label || targetNode?.id,
      relation,
      isWarning,
      warningReason,
      x: event.clientX,
      y: event.clientY,
      defaultStroke: (edge.style?.stroke as string) || undefined,
    });
  }, [activeNodes]);

  const handleEdgeContextMenu = useCallback((event: React.MouseEvent, edge: Edge) => {
    handleEdgeClick(event, edge);
  }, [handleEdgeClick]);

  const handleNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    setSheetOpen(true);
  }, []);

  const handlePaneClick = useCallback(() => {
    clearFocus();
    setSelectedAlertType(null);
    setContextMenu(null);
    setEdgeMenu(null);
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
    setContextMenu(null);
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
      {showDiagnostic && (
        <HealthKpis
          alerts={allAlerts}
          selectedAlertType={selectedAlertType}
          onAlertTypeClick={handleAlertTypeClick}
          onClearFilter={handleResetFocus}
        />
      )}

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
        onResetLayout={handleResetLayout}
        hasCustomPositions={Object.keys(customPositions).length > 0}
        nodeSize={nodeSize}
        onNodeSizeChange={setNodeSize}
        showDiagnostic={showDiagnostic}
        onToggleDiagnostic={() => setShowDiagnostic((prev) => !prev)}
        hiddenNodeCount={hiddenNodeIds.size}
        onShowHiddenNodes={handleRestoreHiddenNodes}
        onSaveView={handleSaveView}
      />

      {/* 3. Graph Viewport Canvas */}
      <div className="flex-1 relative min-h-0 w-full overflow-hidden">
        <InfraMapCanvas
          nodes={focusedNodes}
          edges={focusedEdges}
          savedViewport={savedViewport}
          onViewportChange={handleViewportChange}
          onNodeClick={handleNodeClick}
          onEdgeClick={handleEdgeClick}
          onPaneClick={handlePaneClick}
          onNodeDragStop={handleNodeDragStop}
          onNodeContextMenu={handleNodeContextMenu}
          onEdgeContextMenu={handleEdgeContextMenu}
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
        currentColor={selectedNode ? customColors[selectedNode.id] : null}
        onColorChange={handleColorChange}
        onHideNode={handleHideNode}
        onHideModule={handleHideModule}
        edges={activeEdges}
        allNodes={activeNodes}
        customEdgeStyles={customEdgeStyles}
        onEdgeStyleChange={handleEdgeStyleChange}
      />

      {/* 5. Right-Click Node Context Menu */}
      {contextMenu && (
        <NodeContextMenu
          nodeId={contextMenu.nodeId}
          nodeType={contextMenu.nodeType}
          nodeLabel={contextMenu.nodeLabel}
          x={contextMenu.x}
          y={contextMenu.y}
          currentColor={contextMenu.currentColor}
          onHide={handleHideNode}
          onHideModule={handleHideModule}
          onColorChange={handleColorChange}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* 6. Edge Customizer Context Menu */}
      {edgeMenu && (
        <EdgeContextMenu
          edgeId={edgeMenu.edgeId}
          sourceLabel={edgeMenu.sourceLabel}
          targetLabel={edgeMenu.targetLabel}
          relation={edgeMenu.relation}
          isWarning={edgeMenu.isWarning}
          warningReason={edgeMenu.warningReason}
          x={edgeMenu.x}
          y={edgeMenu.y}
          currentStyle={customEdgeStyles[edgeMenu.edgeId] || null}
          defaultStroke={edgeMenu.defaultStroke}
          onStyleChange={handleEdgeStyleChange}
          onClose={() => setEdgeMenu(null)}
        />
      )}
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
