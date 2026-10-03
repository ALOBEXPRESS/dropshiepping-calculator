import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Download,
  Filter,
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import type { InfraNodeType } from '@/types/infraGraph';
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
}


const NODE_TYPE_LABELS: Record<InfraNodeType, string> = {
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
}) => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

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
        <Popover open={searchOpen} onOpenChange={setSearchOpen}>
          <PopoverTrigger asChild>
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
          </PopoverTrigger>
          <PopoverContent className="w-[360px] p-0 shadow-2xl border-border bg-card" align="start">
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
          </PopoverContent>
        </Popover>

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

        {/* Node Types Filter Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={cn(
                'h-8 text-xs gap-1.5 px-2.5 border-border/80 bg-background/60 hover:bg-accent cursor-pointer shrink-0',
                visibleNodeTypes.size < ALL_NODE_TYPES.length && 'border-primary/50 text-primary'
              )}
              aria-label="Filtrar por tipos de nós visíveis"
            >
              <Filter className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Tipos</span>
              <span className="text-[10px] font-mono px-1 rounded bg-muted/80 font-semibold">
                {visibleNodeTypes.size}/{ALL_NODE_TYPES.length}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64 bg-card border-border">
            <div className="flex items-center justify-between px-2 py-1.5 border-b border-border/60">
              <span className="text-xs font-semibold text-foreground">Filtrar Nós</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleSelectAllTypes}
                  className="text-[10px] text-primary hover:underline px-1 py-0.5 cursor-pointer"
                >
                  Todos
                </button>
                <span className="text-muted-foreground text-[10px]">•</span>
                <button
                  type="button"
                  onClick={handleClearAllTypes}
                  className="text-[10px] text-muted-foreground hover:underline px-1 py-0.5 cursor-pointer"
                >
                  Nenhum
                </button>
              </div>
            </div>

            <div className="py-1">
              {ALL_NODE_TYPES.map((type) => {
                const isChecked = visibleNodeTypes.has(type);
                const count = nodeCountsByType[type] || 0;
                const dotColor = NODE_COLORS[type];

                return (
                  <DropdownMenuCheckboxItem
                    key={type}
                    checked={isChecked}
                    onCheckedChange={() => toggleNodeType(type)}
                    className="text-xs cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: dotColor }}
                      />
                      <span>{NODE_TYPE_LABELS[type]}</span>
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground ml-auto pl-2">
                      {count}
                    </span>
                  </DropdownMenuCheckboxItem>
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
