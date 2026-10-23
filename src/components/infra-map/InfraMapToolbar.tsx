import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Download,
  Layers,
  Maximize2,
  RefreshCw,
  AlertTriangle,
  Check,
  RotateCcw,
  Eye,
  EyeOff,
  Activity,
  ZoomIn,
  BookmarkCheck,
  ChevronDown,
  Plus,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import type { InfraNodeType, InfraMapSavedView } from '@/types/infraGraph';
import type { NodeSize } from '@/components/infra-map/nodes/BaseNode';
import type { Node } from '@xyflow/react';
import { toPng } from 'html-to-image';
import { NODE_COLORS, type InfraNodeData } from '@/utils/infraGraphTransform';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface InfraMapToolbarProps {
  nodes: Node[];
  allNodes?: Node[];
  groupBy: 'none' | 'provider' | 'platform';
  onGroupByChange: (mode: 'none' | 'provider' | 'platform') => void;
  visibleNodeTypes: Set<InfraNodeType>;
  onVisibleNodeTypesChange: (types: Set<InfraNodeType>) => void;
  onNodeFocus: (nodeId: string) => void;
  onFitView?: () => void;
  onResetFocus?: () => void;
  hasActiveFocus?: boolean;
  filterOnlyAlerts?: boolean;
  onToggleOnlyAlerts?: () => void;
  hideUnused?: boolean;
  onToggleHideUnused?: () => void;
  unusedCount?: number;
  totalNodesCount?: number;
  onResetLayout?: () => void;
  hasCustomPositions?: boolean;
  /** Node size: small | medium | large */
  nodeSize?: NodeSize;
  onNodeSizeChange?: (size: NodeSize) => void;
  /** Whether the infra diagnostic panel is shown */
  showDiagnostic?: boolean;
  onToggleDiagnostic?: () => void;
  /** Count of manually hidden nodes */
  hiddenNodeCount?: number;
  /** Restore all hidden nodes */
  onShowHiddenNodes?: () => void;
  /** Save current view (viewport, positions, modules, filters) as permanent default */
  onSaveView?: () => void;
  /** Saved views collection */
  savedViews?: InfraMapSavedView[];
  /** Currently active saved view ID */
  activeViewId?: string | null;
  /** Load / apply a saved view */
  onLoadView?: (view: InfraMapSavedView) => void;
  /** Save current view with a specific name */
  onSaveNamedView?: (name: string) => void;
  /** Delete a saved view */
  onDeleteView?: (viewId: string) => void;
}


export const NODE_TYPE_LABELS: Record<InfraNodeType, string> = {
  proxy_provider: 'Provedores de Proxy',
  proxy: 'Proxies',
  platform_account: 'Contas de Plataforma',
  browser_profile: 'Perfis de Navegador',
  device: 'Dispositivos',
  business_center: 'Business Centers',
  ad_account: 'Contas de Anúncio',
  campaign: 'Campanhas',
  titular: 'Titulares',
};

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

const NODE_SIZE_LABELS: Record<NodeSize, string> = {
  small: 'Pequeno',
  medium: 'Médio',
  large: 'Grande',
};

export const InfraMapToolbar: React.FC<InfraMapToolbarProps> = ({
  nodes,
  allNodes,
  groupBy,
  onGroupByChange,
  visibleNodeTypes,
  onVisibleNodeTypesChange,
  onNodeFocus,
  onFitView,
  onResetFocus,
  hasActiveFocus,
  filterOnlyAlerts,
  onToggleOnlyAlerts,
  hideUnused = true,
  onToggleHideUnused,
  unusedCount = 0,
  totalNodesCount,
  onResetLayout,
  hasCustomPositions,
  nodeSize = 'medium',
  onNodeSizeChange,
  showDiagnostic = false,
  onToggleDiagnostic,
  hiddenNodeCount = 0,
  onShowHiddenNodes,
  onSaveView,
  savedViews = [],
  activeViewId = null,
  onLoadView,
  onSaveNamedView,
  onDeleteView,
}) => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [modulesOpen, setModulesOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [viewsPopoverOpen, setViewsPopoverOpen] = useState(false);
  const [newViewName, setNewViewName] = useState('');

  const handleCreateNamedView = () => {
    const nameToSave = newViewName.trim() || `Visualização ${savedViews.length + 1}`;
    if (onSaveNamedView) {
      onSaveNamedView(nameToSave);
      setNewViewName('');
    } else if (onSaveView) {
      onSaveView();
    }
  };

  // Global keyboard shortcut: Ctrl+K / Cmd+K to open search popover
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        const target = e.target as HTMLElement | null;
        if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') {
          return;
        }
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Use allNodes for search and total counts if provided, otherwise active nodes
  const sourceNodes = allNodes || nodes;

  // Count nodes by type (memoized)
  const nodeCountsByType = useMemo(() => {
    return ALL_NODE_TYPES.reduce((acc, type) => {
      acc[type] = sourceNodes.filter((n) => n.type === type).length;
      return acc;
    }, {} as Record<InfraNodeType, number>);
  }, [sourceNodes]);

  const handleExportPNG = async () => {
    const element = document.querySelector('.react-flow') as HTMLElement;
    if (!element) {
      toast.error('Elemento do mapa não encontrado para exportação');
      return;
    }

    try {
      setIsExporting(true);
      toast.loading('Gerando imagem em alta resolução...', { id: 'export-map' });

      const dataUrl = await toPng(element, {
        backgroundColor: '#0a0b0e',
        pixelRatio: 2,
        width: element.offsetWidth,
        height: element.offsetHeight,
      });

      const link = document.createElement('a');
      link.download = `mapa-infraestrutura-${new Date().toISOString().split('T')[0]}.png`;
      link.href = dataUrl;
      link.click();

      toast.success('Imagem do mapa exportada com sucesso!', { id: 'export-map' });
    } catch (error) {
      console.error('Failed to export PNG:', error);
      toast.error('Erro ao exportar imagem do mapa', { id: 'export-map' });
    } finally {
      setIsExporting(false);
    }
  };

  const toggleNodeType = (type: InfraNodeType) => {
    const newSet = new Set(visibleNodeTypes);
    if (newSet.has(type)) {
      newSet.delete(type);
    } else {
      newSet.add(type);
    }
    onVisibleNodeTypesChange(newSet);
  };

  const handleSelectAllTypes = () => {
    onVisibleNodeTypesChange(new Set(ALL_NODE_TYPES));
  };

  const handleClearAllTypes = () => {
    onVisibleNodeTypesChange(new Set());
  };

  return (
    <div className="flex items-center justify-between gap-2 px-3 py-1.5 bg-[#0c0e14]/95 backdrop-blur-md border-b border-white/[0.08] text-foreground z-20 w-full select-none">
      {/* Left: Structured Command Clusters */}
      <div className="flex items-center gap-1.5 min-w-0 overflow-x-auto no-scrollbar py-0.5">
        {/* Search Combobox */}
        {/* Search Combobox (Portalled via DropdownMenu) */}
        <DropdownMenu open={searchOpen} onOpenChange={setSearchOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1.5 px-2.5 border-border/80 bg-background/60 hover:bg-accent cursor-pointer shrink-0"
              aria-label="Buscar recurso no mapa (Ctrl+K)"
            >
              <Search className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="hidden sm:inline">Buscar</span>
              <kbd className="hidden md:inline-flex h-4 select-none items-center gap-0.5 rounded border border-border/60 bg-muted px-1 font-mono text-[9px] font-medium text-muted-foreground">
                ⌘K
              </kbd>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-[360px] p-0 shadow-2xl border-border bg-[#0f1117] z-50 text-foreground" align="start" sideOffset={6}>
            <Command className="bg-transparent">
              <CommandInput placeholder="Buscar por nome, IP, plataforma ou país..." className="text-xs" />
              <CommandList className="max-h-[300px]">
                <CommandEmpty className="p-4 text-xs text-muted-foreground text-center">
                  Nenhum nó encontrado com este termo.
                </CommandEmpty>
                <CommandGroup heading="Recursos no Mapa">
                  {sourceNodes.map((node) => {
                    const nodeData = (node.data as unknown) as InfraNodeData;
                    const nodeType = node.type as InfraNodeType;
                    const typeLabel = NODE_TYPE_LABELS[nodeType] || nodeType;
                    const dotColor = NODE_COLORS[nodeType] || '#6B7280';
                    const searchValue = `${nodeData?.label ?? ''} ${nodeData?.sublabel ?? ''} ${node.id} ${typeLabel} ${nodeData?.country ?? ''} ${nodeData?.platform ?? ''} ${nodeData?.status ?? ''}`;

                    return (
                      <CommandItem
                        key={node.id}
                        value={searchValue}
                        onSelect={() => {
                          onNodeFocus(node.id);
                          setSearchOpen(false);
                        }}
                        className="cursor-pointer gap-2 py-2"
                      >
                        <div
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: dotColor }}
                        />
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="text-xs font-medium text-foreground truncate">
                            {nodeData?.label || node.id}
                          </span>
                          {nodeData?.sublabel && (
                            <span className="font-mono text-[10px] text-muted-foreground truncate">
                              {nodeData.sublabel}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground/80 shrink-0 font-medium">
                          {typeLabel}
                        </span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Grouping Mode Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1.5 px-2.5 border-border/80 bg-background/60 hover:bg-accent cursor-pointer shrink-0"
              aria-label="Modo de agrupamento do grafo"
            >
              <Layers className="h-3.5 w-3.5 text-primary" />
              <span className="hidden xl:inline">
                {groupBy === 'none'
                  ? 'Hierarquia Natural'
                  : groupBy === 'provider'
                  ? 'Por Provedor'
                  : 'Por Plataforma'}
              </span>
              <span className="xl:hidden">
                {groupBy === 'none'
                  ? 'Hierarquia'
                  : groupBy === 'provider'
                  ? 'Provedor'
                  : 'Plataforma'}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 bg-card border-border">
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Estrutura do Grafo
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onGroupByChange('none')}
              className="text-xs cursor-pointer flex items-center justify-between"
            >
              <span>Hierarquia Natural (Direcional)</span>
              {groupBy === 'none' && <Check className="w-3.5 h-3.5 text-primary" />}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onGroupByChange('provider')}
              className="text-xs cursor-pointer flex items-center justify-between"
            >
              <span>Agrupar por Provedor de Proxy</span>
              {groupBy === 'provider' && <Check className="w-3.5 h-3.5 text-primary" />}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onGroupByChange('platform')}
              className="text-xs cursor-pointer flex items-center justify-between"
            >
              <span>Agrupar por Plataforma Social</span>
              {groupBy === 'platform' && <Check className="w-3.5 h-3.5 text-primary" />}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Modules Filter Dropdown Menu (Portalled, Non-closing on toggle) */}
        <DropdownMenu open={modulesOpen} onOpenChange={setModulesOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={cn(
                'h-8 text-xs gap-1.5 px-2.5 border-border/80 bg-background/60 hover:bg-accent cursor-pointer shrink-0',
                visibleNodeTypes.size < ALL_NODE_TYPES.length && 'border-primary/60 text-primary bg-primary/10 shadow-[0_0_12px_rgba(255,77,0,0.15)]'
              )}
              aria-label="Filtrar módulos visíveis no mapa"
            >
              <Layers className="h-3.5 w-3.5 text-primary" />
              <span>Módulos</span>
              <span className="text-[10px] font-mono px-1 rounded bg-muted/80 font-semibold">
                {visibleNodeTypes.size}/{ALL_NODE_TYPES.length}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            sideOffset={6}
            className="w-72 p-0 shadow-2xl border-border bg-[#0f1117]/95 backdrop-blur-xl z-50 text-foreground"
          >
            <div className="flex items-center justify-between px-3 py-2 border-b border-border/60 bg-muted/30">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-primary" />
                Módulos Visíveis
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSelectAllTypes();
                  }}
                  className="text-[10px] text-primary hover:underline font-medium cursor-pointer"
                >
                  Todos
                </button>
                <span className="text-muted-foreground text-[10px]">•</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleClearAllTypes();
                  }}
                  className="text-[10px] text-muted-foreground hover:underline font-medium cursor-pointer"
                >
                  Nenhum
                </button>
              </div>
            </div>

            <div className="p-1.5 space-y-0.5 max-h-[340px] overflow-y-auto no-scrollbar">
              {ALL_NODE_TYPES.map((type) => {
                const isChecked = visibleNodeTypes.has(type);
                const count = nodeCountsByType[type] || 0;
                const dotColor = NODE_COLORS[type];

                return (
                  <div
                    key={type}
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleNodeType(type);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleNodeType(type);
                      }
                    }}
                    className={cn(
                      'flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors select-none',
                      isChecked ? 'hover:bg-accent/80 text-foreground' : 'text-muted-foreground hover:bg-muted/40 opacity-60'
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={cn(
                          'w-4 h-4 rounded flex items-center justify-center border transition-all shrink-0',
                          isChecked ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground/40 bg-transparent'
                        )}
                      >
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                        style={{ backgroundColor: dotColor }}
                      />
                      <span className="truncate font-medium">{NODE_TYPE_LABELS[type]}</span>
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground pl-2 shrink-0">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Divider between exploration and filters */}
        <div className="h-4 w-px bg-white/10 mx-0.5 shrink-0" />

        {/* Cluster 2: Graph Filtering */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Quick Toggle: Apenas em Uso / Ocultar Ociosos */}
          {onToggleHideUnused && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onToggleHideUnused}
              title={
                hideUnused
                  ? 'Exibindo apenas nós com conexões ou alertas. Clique para ver todos (+ ociosos)'
                  : 'Exibindo todos os nós. Clique para ocultar ociosos'
              }
              aria-label={hideUnused ? 'Exibir nós ociosos' : 'Ocultar nós ociosos'}
              className={cn(
                'h-8 text-xs gap-1.5 px-2.5 cursor-pointer transition-all shrink-0',
                hideUnused
                  ? 'border-border/80 bg-background/60 hover:bg-accent text-zinc-300'
                  : 'border-cyan-500/50 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
              )}
            >
              {hideUnused ? (
                <>
                  <EyeOff className="h-3.5 w-3.5 text-amber-400" />
                  <span className="hidden xl:inline">Em Uso</span>
                  {unusedCount > 0 && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                      +{unusedCount}<span className="hidden 2xl:inline"> ociosos</span>
                    </span>
                  )}
                </>
              ) : (
                <>
                  <Eye className="h-3.5 w-3.5 text-cyan-400" />
                  <span className="hidden xl:inline">Todos</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-400 font-semibold">
                    {totalNodesCount ?? nodes.length}
                  </span>
                </>
              )}
            </Button>
          )}

          {/* Quick Filter: Only with Alerts */}
          {onToggleOnlyAlerts && (
            <Button
              type="button"
              variant={filterOnlyAlerts ? 'destructive' : 'outline'}
              size="sm"
              onClick={onToggleOnlyAlerts}
              aria-label="Filtrar apenas nós com alertas de saúde"
              className={cn(
                'h-8 text-xs gap-1.5 px-2.5 cursor-pointer transition-all shrink-0',
                filterOnlyAlerts
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500 hover:bg-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.2)]'
                  : 'border-border/80 bg-background/60 hover:bg-accent text-muted-foreground'
              )}
            >
              <AlertTriangle className={cn("h-3.5 w-3.5", filterOnlyAlerts ? "text-rose-400" : "text-amber-400")} />
              <span className="hidden lg:inline">Alertas</span>
            </Button>
          )}

          {/* Restore Hidden Nodes */}
          {hiddenNodeCount > 0 && onShowHiddenNodes && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onShowHiddenNodes}
              title={`Restaurar ${hiddenNodeCount} nó(s) ocultados manualmente`}
              aria-label="Restaurar nós ocultos"
              className="h-8 text-xs gap-1.5 px-2.5 cursor-pointer border-amber-500/40 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-all shadow-[0_0_12px_rgba(245,158,11,0.2)] shrink-0"
            >
              <Eye className="h-3.5 w-3.5" />
              <span>+{hiddenNodeCount}<span className="hidden sm:inline"> oculto{hiddenNodeCount !== 1 ? 's' : ''}</span></span>
            </Button>
          )}
        </div>

        {/* Divider between filters and view settings */}
        <div className="h-4 w-px bg-white/10 mx-0.5 shrink-0" />

        {/* Cluster 3: View Settings & Telemetry */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Infra Diagnostic Toggle */}
          {onToggleDiagnostic && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onToggleDiagnostic}
              title={showDiagnostic ? 'Ocultar diagnóstico de infraestrutura' : 'Exibir diagnóstico de infraestrutura'}
              aria-label="Alternar diagnóstico de infraestrutura"
              className={cn(
                'h-8 text-xs gap-1.5 px-2.5 cursor-pointer transition-all shrink-0',
                showDiagnostic
                  ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.2)] font-medium'
                  : 'border-border/80 bg-background/60 hover:bg-accent text-muted-foreground'
              )}
            >
              <Activity className={cn("h-3.5 w-3.5", showDiagnostic ? "text-emerald-400 animate-pulse" : "text-zinc-400")} />
              <span className="hidden lg:inline">Diagnóstico</span>
            </Button>
          )}

          {/* Node Size Selector */}
          {onNodeSizeChange && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs gap-1.5 px-2.5 border-border/80 bg-background/60 hover:bg-accent cursor-pointer shrink-0"
                  aria-label="Tamanho dos nós"
                >
                  <ZoomIn className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="hidden sm:inline">{NODE_SIZE_LABELS[nodeSize]}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-40 bg-card border-border">
                <DropdownMenuLabel className="text-xs text-muted-foreground">Tamanho dos Nós</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {(['small', 'medium', 'large'] as NodeSize[]).map((size) => (
                  <DropdownMenuItem
                    key={size}
                    onClick={() => onNodeSizeChange(size)}
                    className="text-xs cursor-pointer flex items-center justify-between"
                  >
                    <span>{NODE_SIZE_LABELS[size]}</span>
                    {nodeSize === size && <Check className="w-3.5 h-3.5 text-primary" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Right: Map Utility Actions */}
      <div className="flex items-center gap-1.5 shrink-0 pl-1">
        {/* Reset Focus Button */}
        {hasActiveFocus && onResetFocus && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onResetFocus}
            className="h-8 text-xs gap-1 px-2 text-muted-foreground hover:text-foreground cursor-pointer"
            aria-label="Restaurar foco do grafo"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="hidden lg:inline">Restaurar Foco</span>
          </Button>
        )}

        {/* Save Current View & Manage Saved Views */}
        {(onSaveView || onSaveNamedView) && (
          <Popover open={viewsPopoverOpen} onOpenChange={setViewsPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={cn(
                  'h-8 text-xs gap-1.5 px-2.5 border-emerald-500/50 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 cursor-pointer shadow-[0_0_12px_rgba(16,185,129,0.2)] transition-all font-medium shrink-0',
                  viewsPopoverOpen && 'ring-1 ring-emerald-400 bg-emerald-500/20'
                )}
                title="Salvar, selecionar e carregar visualizações do mapa"
                aria-label="Gerenciar visualizações salvas"
              >
                <BookmarkCheck className="h-3.5 w-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Salvar Visualização</span>
                <span className="sm:hidden">Salvar</span>
                {savedViews && savedViews.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500/30 text-emerald-200 font-mono font-bold">
                    {savedViews.length}
                  </span>
                )}
                <ChevronDown className="h-3 w-3 text-emerald-400/80" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              className="w-80 p-3.5 bg-zinc-950/95 border-zinc-800 text-zinc-100 backdrop-blur-md shadow-2xl rounded-xl z-50 animate-in fade-in zoom-in-95"
            >
              <div className="flex flex-col gap-3">
                {/* Popover Header */}
                <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                      <BookmarkCheck className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-zinc-100">Visualizações do Mapa</h4>
                      <p className="text-[10px] text-zinc-400">Salve ou carregue posições, zoom e filtros</p>
                    </div>
                  </div>
                </div>

                {/* Save new view input form */}
                <div className="flex flex-col gap-1.5 bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800/80">
                  <label className="text-[11px] font-medium text-zinc-300 flex items-center justify-between">
                    <span>Salvar visualização atual</span>
                    <span className="text-[10px] text-emerald-400/80 font-normal">Câmera + Zoom + Filtros</span>
                  </label>
                  <div className="flex items-center gap-1.5">
                    <Input
                      type="text"
                      placeholder="Nome (ex: Visão Geral)..."
                      value={newViewName}
                      onChange={(e) => setNewViewName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleCreateNamedView();
                        }
                      }}
                      className="h-7 text-xs bg-zinc-950 border-zinc-700/70 focus-visible:ring-emerald-500"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleCreateNamedView}
                      className="h-7 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white shrink-0 font-medium"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Salvar
                    </Button>
                  </div>
                </div>

                {/* List of saved views */}
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-medium text-zinc-400 px-0.5">
                    Visualizações disponíveis ({savedViews?.length || 0}):
                  </span>

                  {(!savedViews || savedViews.length === 0) ? (
                    <div className="py-4 text-center text-xs text-zinc-500 bg-zinc-900/30 rounded-lg border border-dashed border-zinc-800">
                      Nenhuma visualização salva ainda.
                      <br />
                      Posicione o mapa e salve acima.
                    </div>
                  ) : (
                    <div className="max-h-56 overflow-y-auto space-y-1.5 pr-0.5 custom-scrollbar">
                      {savedViews.map((view) => {
                        const isActive = view.id === activeViewId;
                        const dateFormatted = new Date(view.createdAt).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        });

                        return (
                          <div
                            key={view.id}
                            onClick={() => {
                              onLoadView?.(view);
                              setViewsPopoverOpen(false);
                            }}
                            className={cn(
                              'group flex items-center justify-between p-2 rounded-lg border transition-all cursor-pointer',
                              isActive
                                ? 'bg-emerald-950/30 border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.15)]'
                                : 'bg-zinc-900/40 border-zinc-800/80 hover:bg-zinc-900 hover:border-zinc-700'
                            )}
                          >
                            <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                              {isActive ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              ) : (
                                <Eye className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-300 shrink-0" />
                              )}
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <span className={cn('text-xs font-medium truncate', isActive ? 'text-emerald-200' : 'text-zinc-200')}>
                                    {view.name}
                                  </span>
                                  {isActive && (
                                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-medium">
                                      Ativa
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 mt-0.5">
                                  <span>{dateFormatted}</span>
                                  <span>•</span>
                                  <span>Zoom {view.viewport?.zoom ? `${(view.viewport.zoom * 100).toFixed(0)}%` : '100%'}</span>
                                  <span>•</span>
                                  <span>{view.visibleTypes?.length ?? 9} mód.</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onLoadView?.(view);
                                  setViewsPopoverOpen(false);
                                }}
                                className="h-6 px-2 text-[10px] text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/20"
                              >
                                Carregar
                              </Button>

                              {onDeleteView && (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteView(view.id);
                                  }}
                                  className="h-6 w-6 p-0 text-zinc-500 hover:text-red-400 hover:bg-red-500/10"
                                  title="Excluir visualização"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        )}

        {/* Fit View Button */}
        {onFitView && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onFitView}
            className="h-8 text-xs gap-1.5 px-2.5 border-border/80 bg-background/60 hover:bg-accent cursor-pointer"
            title="Ajustar visualização para enquadrar todos os nós"
            aria-label="Ajustar zoom para enquadrar todos os nós"
          >
            <Maximize2 className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="hidden xl:inline">Enquadrar</span>
          </Button>
        )}

        {/* Reset Layout to Default Button - Only shown when custom positions exist */}
        {hasCustomPositions && onResetLayout && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onResetLayout}
            className="h-8 text-xs gap-1.5 px-2.5 border-cyan-500/40 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 cursor-pointer shadow-[0_0_12px_rgba(6,182,212,0.2)] animate-in fade-in"
            title="Redefinir posições de todos os nós para a organização automática"
            aria-label="Resetar layout do mapa"
          >
            <RotateCcw className="h-3.5 w-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Resetar Layout</span>
          </Button>
        )}

        {/* Export PNG Button */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleExportPNG}
          disabled={isExporting}
          className="h-8 text-xs gap-1.5 px-2.5 border-border/80 bg-background/60 hover:bg-accent cursor-pointer text-foreground"
          aria-label="Exportar grafo em formato PNG"
        >
          {isExporting ? (
            <RefreshCw className="h-3.5 w-3.5 animate-spin text-primary" />
          ) : (
            <Download className="h-3.5 w-3.5 text-primary" />
          )}
          <span className="hidden sm:inline">Exportar PNG</span>
          <span className="sm:hidden">PNG</span>
        </Button>
      </div>
    </div>
  );
};
