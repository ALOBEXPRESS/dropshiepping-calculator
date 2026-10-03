import React, { useMemo, useState } from 'react';
import type { Node, Edge } from '@xyflow/react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ExternalLink, AlertTriangle, Crosshair, Palette, EyeOff, Layers, RotateCcw, Check, Network, ArrowRight, ArrowLeft } from 'lucide-react';
import type { InfraNodeType, HealthAlert } from '@/types/infraGraph';
import { useNavigate } from 'react-router-dom';
import { NODE_COLORS } from '@/utils/infraGraphTransform';
import type { InfraNodeData } from '@/utils/infraGraphTransform';
import { NODE_ACCENT_COLORS } from './NodeContextMenu';
import type { CustomEdgeStyle } from './EdgeContextMenu';
import { cn } from '@/lib/utils';

interface InfraMapSidebarSheetProps {
  node: Node | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  allAlerts?: HealthAlert[];
  onFocusNode?: (nodeId: string) => void;
  currentColor?: string | null;
  onColorChange?: (nodeId: string, color: string | null) => void;
  onHideNode?: (nodeId: string) => void;
  onHideModule?: (moduleType: InfraNodeType) => void;
  edges?: Edge[];
  allNodes?: Node[];
  customEdgeStyles?: Record<string, CustomEdgeStyle>;
  onEdgeStyleChange?: (edgeId: string, style: CustomEdgeStyle | null) => void;
}

const NODE_TYPE_LABELS: Record<InfraNodeType, string> = {
  proxy_provider: 'Provedor de Proxy',
  proxy: 'Proxy',
  platform_account: 'Conta de Plataforma',
  browser_profile: 'Perfil de Navegador',
  device: 'Dispositivo',
  business_center: 'Business Center',
  ad_account: 'Conta de Anúncio',
  campaign: 'Campanha',
  titular: 'Titular',
};

const ROUTE_MAP: Partial<Record<InfraNodeType, (id: string) => string>> = {
  proxy_provider: () => `/provedores`,
  proxy: (id) => `/proxies?highlight=${id}`,
  platform_account: (id) => `/contas?highlight=${id}`,
  browser_profile: (id) => `/perfis-navegador?highlight=${id}`,
  device: (id) => `/dispositivos?highlight=${id}`,
  business_center: (id) => `/business-centers?highlight=${id}`,
  ad_account: (id) => `/contas-anuncios?highlight=${id}`,
  campaign: (id) => `/campanhas?highlight=${id}`,
};

export const InfraMapSidebarSheet: React.FC<InfraMapSidebarSheetProps> = ({
  node,
  open,
  onOpenChange,
  allAlerts = [],
  onFocusNode,
  currentColor,
  onColorChange,
  onHideNode,
  onHideModule,
  edges = [],
  allNodes = [],
  customEdgeStyles = {},
  onEdgeStyleChange,
}) => {
  const navigate = useNavigate();
  const [editingEdgeId, setEditingEdgeId] = useState<string | null>(null);

  if (!node) return null;

  const nodeType = node.type as InfraNodeType;
  const nodeData = (node.data as unknown) as InfraNodeData;
  const nodeColor = currentColor || NODE_COLORS[nodeType] || '#6B7280';

  // Filter active alerts belonging to this specific node
  const nodeAlerts = allAlerts.filter((a) => a.severity !== 'info' && a.nodeIds.includes(node.id));
  const hasAlerts = nodeAlerts.length > 0;

  // Filter connected edges to/from this node
  const connectedEdges = useMemo(() => {
    if (!node || !edges) return [];
    return edges.filter((e) => e.source === node.id || e.target === node.id);
  }, [node, edges]);

  const handleOpenInModule = () => {
    const routeFn = ROUTE_MAP[nodeType];
    if (routeFn) {
      navigate(routeFn(node.id));
      onOpenChange(false);
    }
  };

  const handleFocus = () => {
    if (onFocusNode) {
      onFocusNode(node.id);
    }
  };

  const canOpenInModule = nodeType in ROUTE_MAP;
  const meta = (nodeData.meta || {}) as Record<string, unknown>;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[500px] bg-card border-l border-border p-6 overflow-y-auto no-scrollbar">
        <SheetHeader className="pb-4 border-b border-border/60">
          <div className="flex items-center gap-3">
            <div
              className="w-4 h-4 rounded-full shrink-0 shadow-md ring-2 ring-white/10"
              style={{ backgroundColor: nodeColor }}
            />
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-base font-semibold truncate text-foreground">
                {nodeData.label || node.id}
              </SheetTitle>
              <SheetDescription className="text-xs text-muted-foreground">
                {NODE_TYPE_LABELS[nodeType]}
              </SheetDescription>
            </div>
            {hasAlerts && (
              <Badge variant="destructive" className="gap-1 font-mono text-xs">
                <AlertTriangle className="h-3 w-3" />
                {nodeAlerts.length}
              </Badge>
            )}
          </div>
        </SheetHeader>

        <div className="mt-5 space-y-6">
          {/* Health Alerts section */}
          {hasAlerts && (
            <div className="space-y-2.5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5" />
                Inconsistências Encontradas
              </h3>
              <div className="space-y-2">
                {nodeAlerts.map((alert, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl space-y-1"
                  >
                    <p className="text-xs font-semibold text-rose-200">
                      {alert.label}
                    </p>
                    <p className="text-xs text-rose-300/90 leading-relaxed">
                      {alert.message}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Color Accent Picker Section */}
          <div className="space-y-2.5 p-3.5 rounded-xl bg-muted/20 border border-border/60">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                <Palette className="h-3.5 w-3.5 text-primary" />
                Cor de Destaque no Mapa
              </h3>
              {currentColor && onColorChange && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onColorChange(node.id, null)}
                  className="h-6 text-[10px] gap-1 text-muted-foreground hover:text-foreground px-2 cursor-pointer"
                  title="Restaurar cor padrão do tipo"
                >
                  <RotateCcw className="h-2.5 w-2.5" />
                  Padrão
                </Button>
              )}
            </div>

            <div className="grid grid-cols-6 gap-2 pt-1">
              {NODE_ACCENT_COLORS.map((c) => {
                const isActive = currentColor === c.value;
                return (
                  <button
                    key={c.value}
                    type="button"
                    title={c.label}
                    onClick={() => onColorChange?.(node.id, c.value)}
                    className={cn(
                      'w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-sm',
                      c.swatch,
                      isActive
                        ? 'ring-2 ring-white ring-offset-2 ring-offset-card scale-110'
                        : 'hover:scale-110 hover:ring-1 hover:ring-white/40 opacity-80 hover:opacity-100'
                    )}
                    aria-label={`Cor ${c.label}`}
                  >
                    {isActive && <Check className="w-3.5 h-3.5 text-white drop-shadow stroke-[3]" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Connected Lines & Edge Colors Section */}
          {connectedEdges.length > 0 && (
            <div className="space-y-3 p-3.5 rounded-xl bg-muted/20 border border-border/60">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <Network className="h-3.5 w-3.5 text-primary" />
                  Linhas de Conexão ({connectedEdges.length})
                </h3>
                <span className="text-[10px] text-muted-foreground">
                  Altere a cor de cada linha
                </span>
              </div>

              <div className="space-y-2">
                {connectedEdges.map((edge) => {
                  const isOutgoing = edge.source === node.id;
                  const otherNodeId = isOutgoing ? edge.target : edge.source;
                  const otherNode = allNodes.find((n) => n.id === otherNodeId);
                  const otherData = (otherNode?.data as unknown) as InfraNodeData | undefined;
                  const otherLabel = otherData?.label || otherNodeId;
                  const otherType = (otherNode?.type as InfraNodeType) || '';
                  const otherCountry = otherData?.country;

                  const customStyle = customEdgeStyles[edge.id];
                  const currentStroke = customStyle?.stroke || (edge.style?.stroke as string) || '#6B7280';
                  const isDashed = customStyle?.strokeDasharray
                    ? true
                    : customStyle?.strokeDasharray === ''
                    ? false
                    : Boolean(edge.style?.strokeDasharray);
                  const isWarning = Boolean(edge.data?.isWarning);
                  const isEditing = editingEdgeId === edge.id;

                  // Determine why warning
                  let warningText = '';
                  if (edge.data?.relation === 'runs_on' && isWarning) {
                    warningText = 'Multi-Contas';
                  } else if (
                    nodeData.country &&
                    otherCountry &&
                    nodeData.country.trim().toUpperCase() !== otherCountry.trim().toUpperCase()
                  ) {
                    warningText = `Divergência (${nodeData.country} ≠ ${otherCountry})`;
                  } else if (isWarning) {
                    warningText = 'Alerta Anti-ban';
                  }

                  return (
                    <div
                      key={edge.id}
                      className={cn(
                        'rounded-lg border p-2.5 space-y-2 transition-all',
                        isEditing
                          ? 'border-primary/50 bg-primary/5 shadow-sm'
                          : 'border-border/50 bg-card/60 hover:border-border'
                      )}
                    >
                      {/* Connection Row Header */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className={cn(
                              'w-3.5 h-1 rounded shrink-0 transition-all shadow-sm',
                              isDashed && 'border-b-2 border-dashed'
                            )}
                            style={{
                              backgroundColor: isDashed ? 'transparent' : currentStroke,
                              borderColor: currentStroke,
                            }}
                            title={`Linha ${isDashed ? 'tracejada' : 'contínua'}`}
                          />
                          {isOutgoing ? (
                            <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />
                          ) : (
                            <ArrowLeft className="w-3 h-3 text-muted-foreground shrink-0" />
                          )}
                          <div className="min-w-0">
                            <span className="text-xs font-medium text-foreground truncate block" title={otherLabel}>
                              {otherLabel}
                            </span>
                            <span className="text-[10px] text-muted-foreground truncate block">
                              {NODE_TYPE_LABELS[otherType] || otherType}
                              {otherCountry ? ` • ${otherCountry}` : ''}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {isWarning && (
                            <Badge variant="destructive" className="h-5 text-[9px] px-1.5 gap-0.5" title={warningText}>
                              <AlertTriangle className="w-2.5 h-2.5" />
                              {warningText || 'Alerta'}
                            </Badge>
                          )}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingEdgeId(isEditing ? null : edge.id)}
                            className={cn(
                              'h-7 px-2 text-[10px] gap-1 cursor-pointer transition-colors',
                              isEditing ? 'bg-primary/20 text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                            )}
                            title="Personalizar cor e traço desta linha"
                          >
                            <Palette className="w-3 h-3" />
                            Cor
                          </Button>
                        </div>
                      </div>

                      {/* Inline Color & Pattern Drawer */}
                      {isEditing && (
                        <div className="pt-2 border-t border-border/40 space-y-2.5 animate-in fade-in duration-150">
                          {/* Color Swatches */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                              <span>Escolher Cor da Linha</span>
                              {customStyle && onEdgeStyleChange && (
                                <button
                                  type="button"
                                  onClick={() => onEdgeStyleChange(edge.id, null)}
                                  className="text-[10px] text-primary hover:underline flex items-center gap-1 cursor-pointer"
                                >
                                  <RotateCcw className="w-2.5 h-2.5" />
                                  Restaurar Padrão
                                </button>
                              )}
                            </div>
                            <div className="grid grid-cols-6 gap-1.5 pt-0.5">
                              {NODE_ACCENT_COLORS.map((c) => {
                                const isSelected = customStyle?.stroke === c.value;
                                return (
                                  <button
                                    key={c.value}
                                    type="button"
                                    title={c.label}
                                    onClick={() =>
                                      onEdgeStyleChange?.(edge.id, {
                                        ...customStyle,
                                        stroke: c.value,
                                      })
                                    }
                                    className={cn(
                                      'w-6 h-6 rounded-md flex items-center justify-center transition-all cursor-pointer shadow-sm',
                                      c.swatch,
                                      isSelected
                                        ? 'ring-2 ring-white ring-offset-1 ring-offset-card scale-110'
                                        : 'hover:scale-105 opacity-80 hover:opacity-100'
                                    )}
                                  >
                                    {isSelected && <Check className="w-3 h-3 text-white stroke-[3]" />}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Pattern Selector */}
                          <div className="flex items-center justify-between gap-1 text-[10px] pt-1 border-t border-border/30">
                            <span className="text-muted-foreground">Estilo do Traço:</span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() =>
                                  onEdgeStyleChange?.(edge.id, {
                                    ...customStyle,
                                    strokeDasharray: null,
                                  })
                                }
                                className={cn(
                                  'px-2 py-0.5 rounded text-[10px] border cursor-pointer transition-colors',
                                  customStyle?.strokeDasharray === null || customStyle?.strokeDasharray === undefined
                                    ? 'bg-muted border-border font-semibold text-foreground'
                                    : 'border-transparent text-muted-foreground hover:text-foreground'
                                )}
                              >
                                Auto
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  onEdgeStyleChange?.(edge.id, {
                                    ...customStyle,
                                    strokeDasharray: '',
                                  })
                                }
                                className={cn(
                                  'px-2 py-0.5 rounded text-[10px] border cursor-pointer transition-colors',
                                  customStyle?.strokeDasharray === ''
                                    ? 'bg-primary/20 border-primary text-primary-foreground font-semibold'
                                    : 'border-transparent text-muted-foreground hover:text-foreground'
                                )}
                              >
                                Sólida
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  onEdgeStyleChange?.(edge.id, {
                                    ...customStyle,
                                    strokeDasharray: '6 4',
                                  })
                                }
                                className={cn(
                                  'px-2 py-0.5 rounded text-[10px] border cursor-pointer transition-colors',
                                  customStyle?.strokeDasharray === '6 4'
                                    ? 'bg-primary/20 border-primary text-primary-foreground font-semibold'
                                    : 'border-transparent text-muted-foreground hover:text-foreground'
                                )}
                              >
                                Tracejada
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Node Summary details */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Identificação & Propriedades
            </h3>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-muted/40 border border-border/50">
                <span className="text-[10px] text-muted-foreground uppercase block font-semibold">ID do Recurso</span>
                <span className="font-mono text-[11px] text-foreground truncate block mt-0.5" title={node.id}>
                  {node.id}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-muted/40 border border-border/50">
                <span className="text-[10px] text-muted-foreground uppercase block font-semibold">Tipo</span>
                <span className="font-medium text-foreground block mt-0.5">
                  {NODE_TYPE_LABELS[nodeType]}
                </span>
              </div>

              {nodeData.country && (
                <div className="p-2.5 rounded-lg bg-muted/40 border border-border/50">
                  <span className="text-[10px] text-muted-foreground uppercase block font-semibold">País / Região</span>
                  <span className="font-medium text-foreground block mt-0.5">
                    {nodeData.country}
                  </span>
                </div>
              )}

              {nodeData.status && (
                <div className="p-2.5 rounded-lg bg-muted/40 border border-border/50">
                  <span className="text-[10px] text-muted-foreground uppercase block font-semibold">Status Operacional</span>
                  <span className="font-medium text-foreground block mt-0.5 capitalize">
                    {nodeData.status}
                  </span>
                </div>
              )}

              {nodeData.platform && (
                <div className="p-2.5 rounded-lg bg-muted/40 border border-border/50">
                  <span className="text-[10px] text-muted-foreground uppercase block font-semibold">Plataforma</span>
                  <span className="font-medium text-foreground block mt-0.5 capitalize">
                    {nodeData.platform}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Meta properties */}
          {Object.keys(meta).length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Metadados & Parâmetros
              </h3>

              <div className="space-y-1.5 p-3 rounded-xl bg-muted/30 border border-border/60">
                {Object.entries(meta).map(([key, value]) => {
                  if (value == null || typeof value === 'object') return null;
                  return (
                    <div key={key} className="flex items-center justify-between text-xs py-1 border-b border-border/30 last:border-none">
                      <span className="text-muted-foreground capitalize">
                        {key.replace(/_/g, ' ')}
                      </span>
                      <span className="font-mono text-foreground text-right max-w-[200px] truncate">
                        {typeof value === 'boolean' ? (value ? 'Sim' : 'Não') : String(value)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <Separator className="bg-border/60" />

          {/* Visibility Controls */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Controles de Visibilidade
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {onHideNode && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs text-amber-400 border-amber-500/30 hover:bg-amber-500/10 cursor-pointer"
                  onClick={() => {
                    onHideNode(node.id);
                    onOpenChange(false);
                  }}
                  title="Ocultar apenas este recurso do mapa"
                >
                  <EyeOff className="h-3.5 w-3.5" />
                  Ocultar Este Nó
                </Button>
              )}

              {onHideModule && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs text-rose-400 border-rose-500/30 hover:bg-rose-500/10 cursor-pointer"
                  onClick={() => {
                    onHideModule(nodeType);
                    onOpenChange(false);
                  }}
                  title={`Ocultar todos os nós do módulo "${NODE_TYPE_LABELS[nodeType]}"`}
                >
                  <Layers className="h-3.5 w-3.5" />
                  Ocultar Módulo
                </Button>
              )}
            </div>
          </div>

          <Separator className="bg-border/60" />

          {/* Actions */}
          <div className="space-y-2 pt-1">
            {onFocusNode && (
              <Button
                type="button"
                variant="outline"
                className="w-full gap-2 text-xs border-border/80 hover:bg-accent cursor-pointer"
                onClick={handleFocus}
              >
                <Crosshair className="h-3.5 w-3.5 text-primary" />
                Isolar Conexões no Mapa
              </Button>
            )}

            {canOpenInModule && (
              <Button
                type="button"
                className="w-full gap-2 text-xs cursor-pointer shadow-md"
                onClick={handleOpenInModule}
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Gerenciar no Módulo
              </Button>
            )}

            <Button
              type="button"
              variant="ghost"
              className="w-full text-xs text-muted-foreground hover:text-foreground cursor-pointer"
              onClick={() => onOpenChange(false)}
            >
              Fechar Detalhes
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
