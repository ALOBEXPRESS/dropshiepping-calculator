import React, { useState, useMemo } from 'react';
import {
  Building2,
  Crown,
  Plus,
  Trash2,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useAccountLinkedBusinessCenters,
  useBusinessCenterAccountMutations,
} from '@/hooks/useBusinessCenterAccounts';
import { useBusinessCenters } from '@/hooks/useBusinessCenters';
import { useSettings } from '@/contexts/SettingsContext';
import {
  PERMISSION_LEVEL_CONFIG,
  type RelationshipType,
  type PermissionLevel,
} from '@/types/businessCenters';
import { TikTokLogo, MetaLogo } from '@/components/ui/PlatformLogos';
import { toast } from 'sonner';

interface AccountBusinessCentersSectionProps {
  accountId: string;
  platform: 'tiktok' | 'meta' | 'google';
  disabled?: boolean;
}

export const AccountBusinessCentersSection: React.FC<
  AccountBusinessCentersSectionProps
> = ({ accountId, platform, disabled = false }) => {
  const { organizationId } = useSettings();
  const { data: linkedBcs = [], isLoading: isLoadingLinks } =
    useAccountLinkedBusinessCenters(accountId);
  const { centers = [] } = useBusinessCenters(organizationId);
  const { linkAccount, isLinking, unlinkAccount, isUnlinking } =
    useBusinessCenterAccountMutations();

  const [selectedBcId, setSelectedBcId] = useState<string>('');
  const [selectedRelType, setSelectedRelType] = useState<RelationshipType>('partner_access');
  const [selectedPermLevel, setSelectedPermLevel] = useState<PermissionLevel>('standard');
  const [notes, setNotes] = useState<string>('');

  // Business Centers compatíveis com a plataforma da conta
  const eligibleCenters = useMemo(() => {
    return centers.filter((c) => c.platform === platform);
  }, [centers, platform]);

  // BCs que ainda não estão vinculados a esta conta
  const unlinkedCenters = useMemo(() => {
    const linkedIds = new Set(linkedBcs.map((l) => l.business_center_id));
    return eligibleCenters.filter((c) => !linkedIds.has(c.id));
  }, [eligibleCenters, linkedBcs]);

  // Verifica se já existe algum BC marcado como proprietário (owner)
  const currentOwnerLink = useMemo(() => {
    return linkedBcs.find((l) => l.relationship_type === 'owner');
  }, [linkedBcs]);

  const handleLink = async () => {
    if (!selectedBcId) {
      toast.error('Selecione um Business Center para vincular.');
      return;
    }

    try {
      await linkAccount({
        business_center_id: selectedBcId,
        platform_account_id: accountId,
        relationship_type: selectedRelType,
        permission_level: selectedPermLevel,
        notes: notes.trim() || null,
      });
      setSelectedBcId('');
      setNotes('');
    } catch {
      // Error handled by mutation toast
    }
  };

  const handleUnlink = async (bcId: string) => {
    try {
      await unlinkAccount({
        business_center_id: bcId,
        platform_account_id: accountId,
      });
    } catch {
      // Error handled by mutation toast
    }
  };

  const isTikTok = platform === 'tiktok';
  const isMeta = platform === 'meta';

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-4 space-y-4">
      {/* Cabeçalho */}
      <div className="flex items-start justify-between">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-purple-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-purple-300">
              {isTikTok
                ? 'Business Centers TikTok Vinculados'
                : isMeta
                ? 'Meta Business Portfolios Vinculados'
                : 'Business Centers / Portfólios Vinculados'}
            </h4>
          </div>
          <p className="text-[11px] text-zinc-400">
            {isTikTok
              ? 'Gerencie os Business Centers que possuem acesso ou autorização de anúncios para esta conta TikTok.'
              : 'Gerencie os Portfólios Meta com acesso a este perfil/página, identificando claramente o Proprietário e Parceiros.'}
          </p>
        </div>

        <Badge
          variant="outline"
          className="bg-purple-500/10 border-purple-500/30 text-purple-300 text-[10px] font-mono"
        >
          {linkedBcs.length} {linkedBcs.length === 1 ? 'vínculo' : 'vínculos'}
        </Badge>
      </div>

      {/* Regra Visual de Propriedade */}
      <div className="p-2.5 rounded-lg bg-zinc-900/80 border border-zinc-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <Crown className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
          <span className="text-zinc-300">
            Proprietário do Ativo:
          </span>
        </div>
        {currentOwnerLink ? (
          <span className="font-semibold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded text-[11px] flex items-center gap-1">
            👑 {currentOwnerLink.business_centers?.name || currentOwnerLink.business_centers?.bc_id || 'Business Center'}
          </span>
        ) : (
          <span className="text-zinc-500 text-[11px] italic">
            Nenhum proprietário primário definido
          </span>
        )}
      </div>

      {/* Formulário Rápido de Vinculação */}
      <div className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800/80 space-y-2.5">
        <Label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5 text-emerald-400" />
          Vincular a outro {isTikTok ? 'Business Center' : 'Meta Business Portfolio'}:
        </Label>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
          {/* Selecionar BC */}
          <div className="sm:col-span-5">
            <Select
              value={selectedBcId}
              onValueChange={setSelectedBcId}
              disabled={disabled || isLinking || unlinkedCenters.length === 0}
            >
              <SelectTrigger className="bg-zinc-950 border-zinc-800 text-xs h-8 text-white">
                <SelectValue
                  placeholder={
                    unlinkedCenters.length === 0
                      ? 'Nenhum outro BC disponível'
                      : 'Selecione o Business Center...'
                  }
                />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800 text-white max-h-56">
                {unlinkedCenters.map((bc) => (
                  <SelectItem key={bc.id} value={bc.id}>
                    <div className="flex items-center gap-2">
                      {bc.platform === 'tiktok' ? (
                        <TikTokLogo className="w-3 h-3 text-cyan-400" />
                      ) : (
                        <MetaLogo className="w-3 h-3 text-blue-400" />
                      )}
                      <span className="font-semibold">{bc.name || 'Sem nome'}</span>
                      <span className="text-zinc-500 font-mono text-[10px]">
                        ({bc.bc_id})
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tipo de Relação */}
          <div className="sm:col-span-4">
            <Select
              value={selectedRelType}
              onValueChange={(v) => setSelectedRelType(v as RelationshipType)}
              disabled={disabled || isLinking}
            >
              <SelectTrigger className="bg-zinc-950 border-zinc-800 text-xs h-8 text-white">
                <SelectValue placeholder="Relação" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                <SelectItem value="owner">
                  <span className="text-amber-300 font-medium">👑 Proprietário</span>
                </SelectItem>
                <SelectItem value="partner_access">
                  <span className="text-blue-300 font-medium">🤝 Parceiro (Acesso)</span>
                </SelectItem>
                <SelectItem value="ad_authorization">
                  <span className="text-cyan-300 font-medium">📢 Apenas Anúncios</span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Permissão */}
          <div className="sm:col-span-3">
            <Select
              value={selectedPermLevel}
              onValueChange={(v) => setSelectedPermLevel(v as PermissionLevel)}
              disabled={disabled || isLinking}
            >
              <SelectTrigger className="bg-zinc-950 border-zinc-800 text-xs h-8 text-white">
                <SelectValue placeholder="Permissão" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                <SelectItem value="admin">Acesso Total</SelectItem>
                <SelectItem value="standard">Padrão</SelectItem>
                <SelectItem value="ads_only">Apenas Anúncios</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-0.5">
          <Input
            placeholder="Anotação interna ou código de autorização (opcional)..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={disabled || isLinking}
            className="bg-zinc-950 border-zinc-800 text-xs h-8 text-white placeholder:text-zinc-600"
          />
          <Button
            type="button"
            size="sm"
            onClick={handleLink}
            disabled={disabled || isLinking || !selectedBcId}
            className="h-8 px-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold flex-shrink-0"
          >
            {isLinking ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <>
                <Plus className="w-3.5 h-3.5 mr-1" />
                Vincular
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Lista de Vínculos Atuais */}
      <div className="space-y-1.5">
        <Label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
          Portfólios com Acesso a Esta Conta ({linkedBcs.length}):
        </Label>

        {isLoadingLinks ? (
          <div className="flex items-center justify-center p-4 text-xs text-zinc-500">
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            Carregando vínculos...
          </div>
        ) : linkedBcs.length === 0 ? (
          <div className="p-3 rounded-lg border border-dashed border-zinc-800 text-center text-xs text-zinc-500">
            Esta conta ainda não está vinculada a nenhum Business Center.
          </div>
        ) : (
          <div className="space-y-1.5">
            {linkedBcs.map((rel) => {
              const permConfig = PERMISSION_LEVEL_CONFIG[rel.permission_level || 'standard'];
              const bc = rel.business_centers;

              return (
                <div
                  key={rel.id}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-900/70 border border-zinc-800 hover:border-zinc-700 transition-all text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-md bg-zinc-950 border border-zinc-800 flex items-center justify-center flex-shrink-0">
                      {bc?.platform === 'tiktok' ? (
                        <TikTokLogo className="w-3.5 h-3.5 text-cyan-400" />
                      ) : (
                        <MetaLogo className="w-3.5 h-3.5 text-blue-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white truncate">
                          {bc?.name || 'Business Center'}
                        </span>
                        {bc?.bc_id && (
                          <span className="text-zinc-500 font-mono text-[10px] truncate">
                            ID: {bc.bc_id}
                          </span>
                        )}
                      </div>
                      {rel.notes && (
                        <p className="text-[10px] text-zinc-400 italic truncate">
                          "{rel.notes}"
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Badge de Relacionamento */}
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                        rel.relationship_type === 'owner'
                          ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                          : rel.relationship_type === 'partner_access'
                          ? 'bg-blue-500/15 border-blue-500/30 text-blue-300'
                          : 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300'
                      }`}
                    >
                      {rel.relationship_type === 'owner'
                        ? '👑 Proprietário'
                        : rel.relationship_type === 'partner_access'
                        ? '🤝 Parceiro'
                        : '📢 Anúncios'}
                    </span>

                    {/* Badge de Permissão */}
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                      {permConfig.label.split(' ')[0]}
                    </span>

                    {/* Botão de Remover */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleUnlink(rel.business_center_id)}
                      disabled={disabled || isUnlinking}
                      className="h-6 w-6 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded"
                      title="Desvincular deste Business Center"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
