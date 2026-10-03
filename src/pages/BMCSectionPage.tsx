import React from 'react';
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
  PlusCircle, FileText,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BC_PLATFORM_CONFIG } from '@/types/businessCenters';

// Mapa de ícones Lucide por nome string
const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  Handshake, Cog, Package, Gem, Users,
  Share2, UserCircle, Receipt, CircleDollarSign,
};

const BMCSectionPage: React.FC = () => {
  const { bcId, section } = useParams<{ bcId: string; section: string }>();
  const { organizationId } = useSettings();
  const navigate = useNavigate();

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

        {/* Botão editar — fase 2 */}
        <Button
          variant="outline"
          size="sm"
          disabled
          className="shrink-0 opacity-50 cursor-not-allowed"
          title="Edição disponível em breve"
        >
          <PlusCircle className="w-4 h-4 mr-1.5" />
          Editar
        </Button>
      </div>

      {/* Conteúdo da seção */}
      <div className={`rounded-xl border ${sectionConfig.borderColor} ${sectionConfig.bgColor} p-6 min-h-[200px]`}>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-5 w-3/4" />
            ))}
          </div>
        ) : sectionData && sectionData.items.length > 0 ? (
          <div className="space-y-4">
            <ul className="space-y-2.5">
              {sectionData.items.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${sectionConfig.color.replace('text-', 'bg-')}`} />
                  <span className="text-sm text-foreground/90">{item}</span>
                </li>
              ))}
            </ul>
            {sectionData.notes && (
              <div className="mt-4 pt-4 border-t border-border/50 flex gap-2">
                <FileText className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">{sectionData.notes}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-36 gap-2 text-center">
            <SectionIcon className={`w-8 h-8 ${sectionConfig.color} opacity-30`} />
            <p className="text-sm text-muted-foreground">
              Nenhum item cadastrado para <span className="font-medium">{sectionConfig.label}</span>
            </p>
            <p className="text-xs text-muted-foreground/60">
              A edição do canvas estará disponível em breve.
            </p>
          </div>
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

        {/* Índice rápido de seções */}
        <div className="flex gap-1.5">
          {BMC_SECTION_KEYS.map((key) => (
            <Link
              key={key}
              to={`/negocio/${bcId}/${key}`}
              title={BMC_SECTIONS[key].label}
              className={`
                w-2 h-2 rounded-full transition-all
                ${key === sectionKey
                  ? `${sectionConfig.color.replace('text-', 'bg-')} scale-125`
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
    </div>
  );
};

export default BMCSectionPage;
