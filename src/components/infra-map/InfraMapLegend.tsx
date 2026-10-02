import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Palette, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { InfraNodeType } from '@/types/infraGraph';
import { NODE_COLORS } from '@/utils/infraGraphTransform';
import { cn } from '@/lib/utils';

const NODE_TYPE_LABELS: Record<InfraNodeType, string> = {
  proxy_provider: 'Provedor de Proxy',
  proxy: 'Proxy de Rede',
  platform_account: 'Conta de Plataforma',
  browser_profile: 'Perfil Antidetect',
  device: 'Dispositivo / Máquina',
  business_center: 'Business Center',
  ad_account: 'Conta de Anúncio',
  campaign: 'Campanha de Tráfego',
  titular: 'Titular / Responsável',
};

const ORDERED_TYPES: InfraNodeType[] = [
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

export const InfraMapLegend: React.FC = () => {
  const [open, setOpen] = useState(false);

  return (
    <div className="absolute bottom-6 left-6 z-20 select-none">
      {/* Collapsed Button or Expanded Card */}
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border/80',
            'bg-card/85 backdrop-blur-md text-foreground shadow-lg hover:bg-accent',
            'transition-all duration-200 text-xs font-medium cursor-pointer hover:scale-105 active:scale-95'
          )}
          aria-label="Abrir legenda do mapa"
        >
          <Palette className="w-3.5 h-3.5 text-primary" />
          <span>Legenda</span>
          <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      ) : (
        <div className="bg-card/95 backdrop-blur-md border border-border/90 rounded-xl shadow-2xl overflow-hidden w-64 animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-border/60 bg-muted/30">
            <div className="flex items-center gap-2">
              <Palette className="w-3.5 h-3.5 text-primary" />
              <h3 className="text-xs font-semibold text-foreground">
                Legenda de Recursos
              </h3>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setOpen(false)}
              className="h-6 w-6 rounded-md hover:bg-accent cursor-pointer"
              aria-label="Recolher legenda"
            >
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          </div>

          {/* Node Types List */}
          <div className="p-3 space-y-1.5 max-h-[300px] overflow-y-auto no-scrollbar text-xs">
            {ORDERED_TYPES.map((type) => (
              <div key={type} className="flex items-center gap-2.5 py-0.5">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                  style={{ backgroundColor: NODE_COLORS[type] }}
                />
                <span className="text-muted-foreground truncate">
                  {NODE_TYPE_LABELS[type]}
                </span>
              </div>
            ))}

            {/* Visual Indicators */}
            <div className="pt-2 mt-2 border-t border-border/60 space-y-1.5">
              <div className="flex items-center gap-2.5 py-0.5">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-rose-500/40 shrink-0" />
                <span className="text-rose-300">Nó com Alerta de Saúde</span>
              </div>
              <div className="flex items-center gap-2.5 py-0.5">
                <div className="w-2.5 h-2.5 rounded-full border border-dashed border-red-400 shrink-0" />
                <span className="text-muted-foreground">Linha Vermelha: Divergência</span>
              </div>
              <div className="flex items-center gap-2.5 py-0.5 opacity-60">
                <EyeOff className="w-2.5 h-2.5 text-zinc-500 shrink-0" />
                <span className="text-zinc-400">Esmaecido: Fora do Foco</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
