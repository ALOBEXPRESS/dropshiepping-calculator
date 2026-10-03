import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSettings } from '@/contexts/SettingsContext';
import { useBusinessCenters } from '@/hooks/useBusinessCenters';
import { useBMCSection } from '@/hooks/useBusinessModelCanvas';
import {
  BMC_SECTIONS,
  BMC_SECTION_KEYS,
  type BmcSectionKey,
} from '@/types/businessModelCanvas';
import {
  Handshake, Cog, Package, Gem, Users,
  Share2, UserCircle, Receipt, CircleDollarSign,
  ChevronLeft, ChevronRight, Briefcase,
  Pencil, FileText, LayoutGrid,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BC_PLATFORM_CONFIG } from '@/types/businessCenters';
import { BMCSectionEditor } from '@/components/business-model-canvas/BMCSectionEditor';

// Mapa de ícones Lucide por nome string
const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  Handshake, Cog, Package, Gem, Users,
  Share2, UserCircle, Receipt, CircleDollarSign,
};

const BMCSectionPage: React.FC = () => {
  const { bcId, section } = useParams<{ bcId: string; section: string }>();
  const { organizationId } = useSettings();
  const navigate = useNavigate();
  const [editorOpen, setEditorOpen] = useState(false);

  const { businessCenters, isLoading: bcLoading } = useBusinessCenters(organizationId);
  const bc = businessCenters.find((b) => b.id === bcId);

  const sectionKey = section as BmcSectionKey;
  const sectionConfig = BMC_SECTIONS[sectionKey];

  const { data: sectionData, isLoading: sectionLoading } = useBMCSection(bcId, sectionKey);

  // Navegação entre seções
  const currentIndex = BMC_SECTION_KEYS.indexOf(sectionKey);
  const prevKey = currentIndex > 0 ? BMC_SECTION_KEYS[currentIndex - 1] : null;
  const nextKey = currentIndex < BMC_SECTION_KEYS.length - 1 ? BMC_SECTION_KEYS[currentIndex + 1] : null;

  // Validação de rota
  if (!sectionConfig) {
    return (
      <div className="p-6 text-muted-foreground text-sm">
        Seção inválida. <Link to="/negocio" className="text-emerald-400 underline">Voltar</Link>
      </div>
    );
  }

  const SectionIcon = ICON_MAP[sectionConfig.icon] ?? Briefcase;
  const platformConfig = bc ? BC_PLATFORM_CONFIG[bc.platform] : null;
  const isLoading = bcLoading || sectionLoading;
  const hasItems = sectionData && sectionData.items.length > 0;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/negocio" className="hover:text-foreground transition-colors flex items-center gap-1">
          <Briefcase className="w-3.5 h-3.5" />
          Negócio
        </Link>
        <span>/</span>
        {bcLoading ? (
          <Skeleton className="h-4 w-28" />
        ) : (
          <Link
            to={`/negocio/${bcId}/parcerias`}
            className="hover:text-foreground transition-colors"
          >
            {bc?.name ?? bc?.bc_id ?? bcId}
          </Link>
        )}
        <span>/</span>
        <span className={`font-medium ${sectionConfig.color}`}>{sectionConfig.label}</span>
      </div>

      {/* Header da seção */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-xl ${sectionConfig.bgColor} border ${sectionConfig.borderColor}`}>
            <SectionIcon className={`w-6 h-6 ${sectionConfig.color}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs text-muted-foreground">
                {sectionConfig.number} / 9
              </Badge>
              {platformConfig && (
                <Badge variant="outline" className={`text-xs ${platformConfig.color}`}>
                  {platformConfig.label}
                </Badge>
              )}
            </div>
            <h1 className="text-xl font-bold mt-1">{sectionConfig.label}</h1>
            <p className="text-sm text-muted-foreground">{sectionConfig.description}</p>
          </div>
        </div>

        {/* Botão editar */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setEditorOpen(true)}
          disabled={isLoading || !bcId}
          className="shrink-0"
        >
          <Pencil className="w-4 h-4 mr-1.5" />
          {hasItems ? 'Editar' : 'Adicionar itens'}
        </Button>
      </div>

      {/* Link canvas completo */}
      <div className="flex justify-end -mt-4">
        <Link
          to={`/negocio/${bcId}/canvas`}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-emerald-400 transition-colors"
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          Ver canvas completo
        </Link>
      </div>

      {/* Conteúdo da seção */}
      <div className={`rounded-xl border ${sectionConfig.borderColor} ${sectionConfig.bgColor} p-6 min-h-[200px]`}>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-5 w-3/4" />
            ))}
          </div>
        ) : hasItems ? (
          <div className="space-y-4">
            <ul className="space-y-2.5">
              {sectionData!.items.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${sectionConfig.dotColor}`} />
                  <span className="text-sm text-foreground/90">{item}</span>
                </li>
              ))}
            </ul>
            {sectionData!.notes && (
              <div className="mt-4 pt-4 border-t border-border/50 flex gap-2">
                <FileText className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">{sectionData!.notes}</p>
              </div>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setEditorOpen(true)}
            disabled={!bcId}
            className="w-full h-full flex flex-col items-center justify-center min-h-[152px] gap-2 text-center rounded-lg border-2 border-dashed border-border/40 hover:border-border hover:bg-accent/30 transition-all cursor-pointer group"
          >
            <SectionIcon className={`w-8 h-8 ${sectionConfig.color} opacity-30 group-hover:opacity-50 transition-opacity`} />
            <p className="text-sm text-muted-foreground">
              Nenhum item em <span className="font-medium">{sectionConfig.label}</span>
            </p>
            <p className={`text-xs font-medium ${sectionConfig.color}`}>
              Clique para adicionar
            </p>
          </button>
        )}
      </div>

      {/* Navegação entre seções */}
      <div className="flex items-center justify-between pt-2">
        {prevKey ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/negocio/${bcId}/${prevKey}`)}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="w-4 h-4" />
            {BMC_SECTIONS[prevKey].label}
          </Button>
        ) : (
          <div />
        )}

        {/* Dots de navegação */}
        <div className="flex gap-1.5">
          {BMC_SECTION_KEYS.map((key) => (
            <Link
              key={key}
              to={`/negocio/${bcId}/${key}`}
              title={BMC_SECTIONS[key].label}
              className={`
                w-2 h-2 rounded-full transition-all
                ${key === sectionKey
                  ? `${sectionConfig.dotColor} scale-125`
                  : 'bg-muted-foreground/30 hover:bg-muted-foreground/60'
                }
              `}
            />
          ))}
        </div>

        {nextKey ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/negocio/${bcId}/${nextKey}`)}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
          >
            {BMC_SECTIONS[nextKey].label}
            <ChevronRight className="w-4 h-4" />
          </Button>
        ) : (
          <div />
        )}
      </div>

      {/* Dialog de edição */}
      {bcId && (
        <BMCSectionEditor
          open={editorOpen}
          onOpenChange={setEditorOpen}
          businessCenterId={bcId}
          sectionKey={sectionKey}
          currentData={sectionData ?? null}
        />
      )}
    </div>
  );
};

export default BMCSectionPage;
