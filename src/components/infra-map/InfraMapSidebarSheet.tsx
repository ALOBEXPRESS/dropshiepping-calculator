import React from 'react';
import type { Node } from '@xyflow/react';
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
import { ExternalLink, AlertTriangle, Crosshair } from 'lucide-react';
import type { InfraNodeType, HealthAlert } from '@/types/infraGraph';
import { useNavigate } from 'react-router-dom';
import { NODE_COLORS } from '@/utils/infraGraphTransform';
import type { InfraNodeData } from '@/utils/infraGraphTransform';

interface InfraMapSidebarSheetProps {
  node: Node | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  allAlerts?: HealthAlert[];
  onFocusNode?: (nodeId: string) => void;
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
}) => {
  const navigate = useNavigate();

  if (!node) return null;

  const nodeType = node.type as InfraNodeType;
  const nodeData = (node.data as unknown) as InfraNodeData;
  const nodeColor = NODE_COLORS[nodeType] || '#6B7280';

  // Filter active alerts belonging to this specific node
  const nodeAlerts = allAlerts.filter((a) => a.severity !== 'info' && a.nodeIds.includes(node.id));
  const hasAlerts = nodeAlerts.length > 0;

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

          {/* Actions */}
          <div className="space-y-2 pt-2">
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
