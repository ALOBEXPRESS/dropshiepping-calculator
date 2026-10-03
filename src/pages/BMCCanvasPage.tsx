import React from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useSettings } from '@/contexts/SettingsContext';
import { useBusinessCenters } from '@/hooks/useBusinessCenters';
import { useBusinessModelCanvas } from '@/hooks/useBusinessModelCanvas';
import { BMCCanvasGrid } from '@/components/business-model-canvas/BMCCanvasGrid';
import { BC_PLATFORM_CONFIG } from '@/types/businessCenters';
import type { BmcSectionKey } from '@/types/businessModelCanvas';
import { Briefcase, LayoutGrid } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

const BMCCanvasPage: React.FC = () => {
  const { bcId } = useParams<{ bcId: string }>();
  const [searchParams] = useSearchParams();
  const initialSection = (searchParams.get('section') as BmcSectionKey) || null;
  const { organizationId } = useSettings();

  const { businessCenters, isLoading: bcLoading } = useBusinessCenters(organizationId);
  const bc = businessCenters.find((b) => b.id === bcId);

  const { data: canvas, isLoading: canvasLoading } = useBusinessModelCanvas(bcId);

  const platformConfig = bc ? BC_PLATFORM_CONFIG[bc.platform] : null;
  const isLoading = bcLoading || canvasLoading;

  if (!bcId) {
    return (
      <div className="p-6 text-muted-foreground text-sm">
        Business Center não encontrado.{' '}
        <Link to="/negocio" className="text-emerald-400 underline">Voltar</Link>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/negocios" className="hover:text-foreground transition-colors flex items-center gap-1">
          <Briefcase className="w-3.5 h-3.5" />
          Negócios
        </Link>
        <span>/</span>
        {bcLoading ? (
          <Skeleton className="h-4 w-32" />
        ) : (
          <span className="font-medium text-foreground">{bc?.name ?? bc?.bc_id ?? bcId}</span>
        )}
        <span>/</span>
        <span className="text-emerald-400 font-medium flex items-center gap-1">
          <LayoutGrid className="w-3.5 h-3.5" />
          Canvas
        </span>
      </div>

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <LayoutGrid className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          {bcLoading ? (
            <Skeleton className="h-6 w-48 mb-1" />
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold">
                {bc?.name ?? bc?.bc_id ?? 'Business Model Canvas'}
              </h1>
              {platformConfig && (
                <Badge variant="outline" className={`text-xs ${platformConfig.color}`}>
                  {platformConfig.label}
                </Badge>
              )}
            </div>
          )}
          <p className="text-sm text-muted-foreground">Business Model Canvas</p>
        </div>
      </div>

      {/* Grid do canvas */}
      {isLoading ? (
        <div className="grid grid-cols-5 gap-3">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton
              key={i}
              className={`rounded-xl ${
                i === 0 || i === 2 || i === 4 ? 'h-80 row-span-2' :
                i === 5 ? 'h-36 col-span-3' :
                i === 6 ? 'h-36 col-span-2' :
                'h-36'
              }`}
            />
          ))}
        </div>
      ) : canvas ? (
        <BMCCanvasGrid
          businessCenterId={bcId}
          bcName={bc?.name ?? bc?.bc_id ?? bcId}
          canvas={canvas}
          initialSection={initialSection}
        />
      ) : null}

      {/* Dica de uso */}
      <p className="text-xs text-muted-foreground/50 text-center pb-2">
        Passe o mouse sobre um bloco e clique no ícone de edição para adicionar ou editar itens
      </p>
    </div>
  );
};

export default BMCCanvasPage;
