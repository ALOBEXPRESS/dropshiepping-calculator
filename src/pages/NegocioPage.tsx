import React from 'react';
import { Link } from 'react-router-dom';
import { useSettings } from '@/contexts/SettingsContext';
import { useBusinessCenters } from '@/hooks/useBusinessCenters';
import { BMC_SECTIONS, BMC_SECTION_KEYS } from '@/types/businessModelCanvas';
import { BC_PLATFORM_CONFIG } from '@/types/businessCenters';
import {
  Briefcase,
  ArrowRight,
  Building2,
  LayoutGrid,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

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
            <Skeleton key={i} className="h-52 rounded-xl" />
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
          {businessCenters.map((bc) => {
            const platformConfig = BC_PLATFORM_CONFIG[bc.platform];
            return (
              <div
                key={bc.id}
                className="rounded-xl border border-border bg-card overflow-hidden hover:border-emerald-500/30 transition-colors group"
              >
                {/* BC header */}
                <div className="p-5 border-b border-border flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${platformConfig.bgColor} border ${platformConfig.borderColor}`}>
                    <LayoutGrid className={`w-4 h-4 ${platformConfig.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{bc.name ?? bc.bc_id}</p>
                    <p className={`text-xs ${platformConfig.color}`}>{platformConfig.label}</p>
                  </div>
                  <Link
                    to={`/negocio/${bc.id}/parcerias`}
                    className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-medium transition-colors opacity-0 group-hover:opacity-100"
                  >
                    Ver seções
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {/* Grid das 9 seções */}
                <div className="p-4 grid grid-cols-3 gap-2">
                  {BMC_SECTION_KEYS.map((key) => {
                    const section = BMC_SECTIONS[key];
                    return (
                      <Link
                        key={key}
                        to={`/negocio/${bc.id}/${key}`}
                        className={`
                          flex flex-col items-center gap-1.5 p-2.5 rounded-lg cursor-pointer
                          border ${section.borderColor} ${section.bgColor}
                          hover:brightness-110 transition-all
                        `}
                      >
                        <span className={`text-xs font-medium text-center leading-tight ${section.color}`}>
                          {section.label}
                        </span>
                      </Link>
                    );
                  })}
                </div>

                {/* Footer: link para canvas completo */}
                <div className="px-4 pb-4">
                  <Link
                    to={`/negocio/${bc.id}/canvas`}
                    className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 hover:border-emerald-500/40 text-xs font-medium text-emerald-400 transition-all"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    Ver canvas completo
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NegocioPage;
