import React from 'react';
import { Link } from 'react-router-dom';
import { useSettings } from '@/contexts/SettingsContext';
import { useBusinessCenters } from '@/hooks/useBusinessCenters';
import { useBusinessModelCanvas } from '@/hooks/useBusinessModelCanvas';
import { BMC_SECTIONS, BMC_SECTION_KEYS, formatCurrencyCompact, formatCurrencyBRL } from '@/types/businessModelCanvas';
import { BC_PLATFORM_CONFIG } from '@/types/businessCenters';
import type { BusinessCenter } from '@/types/businessCenters';
import {
  Briefcase,
  ArrowRight,
  Building2,
  LayoutGrid,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface BCCardProps {
  bc: BusinessCenter;
}

function BCCanvasCard({ bc }: BCCardProps) {
  const platformConfig = BC_PLATFORM_CONFIG[bc.platform];
  const { data: canvas } = useBusinessModelCanvas(bc.id);

  const totalCustos = canvas?.custos?.financial_value ?? 0;
  const totalReceitas = canvas?.fontes?.financial_value ?? 0;
  const hasFinancial = totalCustos > 0 || totalReceitas > 0;

  return (
    <div
      className="rounded-xl border border-border bg-card overflow-hidden hover:border-emerald-500/30 transition-all group shadow-sm flex flex-col justify-between"
    >
      <div>
        {/* BC header */}
        <div className="p-5 border-b border-border flex items-center gap-3">
          <div className={`p-2 rounded-lg ${platformConfig.bgColor} border ${platformConfig.borderColor}`}>
            <LayoutGrid className={`w-4 h-4 ${platformConfig.color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate text-foreground">{bc.name ?? bc.bc_id}</p>
            <p className={`text-xs ${platformConfig.color}`}>{platformConfig.label}</p>
          </div>
          <Link
            to={`/negocio/${bc.id}/canvas`}
            className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-medium transition-colors opacity-0 group-hover:opacity-100"
          >
            Ver canvas
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Grid das 9 seções — agora concentradas e direcionadas ao canvas completo */}
        <div className="p-4 grid grid-cols-3 gap-2">
          {BMC_SECTION_KEYS.map((key) => {
            const section = BMC_SECTIONS[key];
            const secData = canvas?.[key];
            const hasItems = secData && secData.items.length > 0;
            const val = secData?.financial_value;

            return (
              <Link
                key={key}
                to={`/negocio/${bc.id}/canvas?section=${key}`}
                title={`Abrir ${section.label} no Canvas`}
                className={`
                  flex flex-col items-center justify-center gap-1 p-2.5 rounded-lg cursor-pointer
                  border ${section.borderColor} ${section.bgColor}
                  hover:brightness-115 transition-all text-center min-h-[64px]
                `}
              >
                <span className={`text-xs font-semibold leading-tight ${section.color}`}>
                  {section.label}
                </span>

                {val != null && val > 0 ? (
                  <span className="text-[10px] font-mono font-bold text-foreground/90 bg-background/50 px-1.5 py-0.5 rounded border border-border/40">
                    {formatCurrencyCompact(val)}
                  </span>
                ) : hasItems ? (
                  <span className="text-[9px] text-muted-foreground/60 font-mono">
                    {secData.items.length} {secData.items.length === 1 ? 'item' : 'itens'}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Footer: resumo financeiro rápido + link para canvas completo */}
      <div className="px-4 pb-4 space-y-2.5 border-t border-border/40 pt-3 bg-muted/10">
        {hasFinancial && (
          <div className="flex items-center justify-between text-[11px] font-mono px-1">
            <span className="text-red-400/90 font-medium">
              Custos: {formatCurrencyBRL(totalCustos)}
            </span>
            <span className="text-emerald-400/90 font-medium">
              Receitas: {formatCurrencyBRL(totalReceitas)}
            </span>
          </div>
        )}

        <Link
          to={`/negocio/${bc.id}/canvas`}
          className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-lg border border-emerald-500/25 bg-emerald-500/5 hover:bg-emerald-500/15 hover:border-emerald-500/40 text-xs font-semibold text-emerald-400 transition-all cursor-pointer shadow-xs"
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          Ver canvas completo
        </Link>
      </div>
    </div>
  );
}

const NegocioPage: React.FC = () => {
  const { organizationId } = useSettings();
  const { businessCenters, isLoading } = useBusinessCenters(organizationId);

  if (!organizationId) {
    return (
      <div className="p-6 text-muted-foreground text-sm">
        Selecione uma organização nas configurações para acessar a área de Negócio.
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <Briefcase className="w-6 h-6 text-emerald-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Negócio</h1>
          <p className="text-sm text-muted-foreground">
            Business Model Canvas de cada negócio cadastrado
          </p>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-56 rounded-xl" />
          ))}
        </div>
      )}

      {/* Sem BCs */}
      {!isLoading && businessCenters.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
          <Building2 className="w-12 h-12 text-muted-foreground/40" />
          <p className="text-muted-foreground font-medium">Nenhum Business Center cadastrado</p>
          <p className="text-sm text-muted-foreground/60">
            Cadastre um Business Center no Painel para montar o canvas do seu negócio.
          </p>
          <Link
            to="/business-centers"
            className="mt-2 text-sm text-emerald-400 hover:text-emerald-300 underline underline-offset-4 transition-colors"
          >
            Ir para Business Centers
          </Link>
        </div>
      )}

      {/* Cards por BC */}
      {!isLoading && businessCenters.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {businessCenters.map((bc) => (
            <BCCanvasCard key={bc.id} bc={bc} />
          ))}
        </div>
      )}
    </div>
  );
};

export default NegocioPage;
