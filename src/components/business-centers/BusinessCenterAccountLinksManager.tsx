import React, { useState, useMemo } from 'react';
import {
  Crown,
  Users,
  Megaphone,
  Plus,
  Trash2,
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
  InstagramLogo,
  FacebookLogo,
  TikTokLogo,
} from '@/components/ui/PlatformLogos';
import type {
  BusinessCenterPlatform,
  BusinessCenterAccountInput,
  RelationshipType,
  PermissionLevel,
  RelationshipStatus,
} from '@/types/businessCenters';
import type { PlatformAccount } from '@/types/platformAccounts';
import { toast } from 'sonner';

interface BusinessCenterAccountLinksManagerProps {
  platform: BusinessCenterPlatform;
  linkedAccounts: BusinessCenterAccountInput[];
  onChange: (accounts: BusinessCenterAccountInput[]) => void;
  availableAccounts: PlatformAccount[];
  disabled?: boolean;
}

export const BusinessCenterAccountLinksManager: React.FC<
  BusinessCenterAccountLinksManagerProps
> = ({
  platform,
  linkedAccounts,
  onChange,
  availableAccounts,
  disabled = false,
}) => {
  // Estado local para adicionar uma nova conta
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [selectedRelType, setSelectedRelType] = useState<RelationshipType>('owner');
  const [selectedPermLevel, setSelectedPermLevel] = useState<PermissionLevel>('standard');
  const selectedStatus: RelationshipStatus = 'active';
  const [notes, setNotes] = useState<string>('');
  const [activeMetaTab, setActiveMetaTab] = useState<'all' | 'instagram' | 'facebook'>('all');

  // Filtra as contas do sistema compatíveis com a plataforma atual
  const eligibleAccounts = useMemo(() => {
    if (platform === 'tiktok') {
      return availableAccounts.filter((a) => a.platform === 'tiktok');
    }
    if (platform === 'meta') {
      return availableAccounts.filter((a) => a.platform === 'meta');
    }
    return [];
  }, [availableAccounts, platform]);

  // Contas que ainda não foram adicionadas à lista
  const unlinkedAccounts = useMemo(() => {
    const linkedIds = new Set(linkedAccounts.map((l) => l.platform_account_id));
    return eligibleAccounts.filter((a) => !linkedIds.has(a.id));
  }, [eligibleAccounts, linkedAccounts]);

  // Contas exibidas no dropdown com base na aba (para Meta)
  const dropdownAccounts = useMemo(() => {
    if (platform !== 'meta' || activeMetaTab === 'all') {
      return unlinkedAccounts;
    }
    return unlinkedAccounts.filter((a) => a.meta_account_type === activeMetaTab);
  }, [unlinkedAccounts, platform, activeMetaTab]);

  // Mapa de contas elegíveis para acesso rápido aos metadados (nome, foto, arroba, etc.)
  const accountMap = useMemo(() => {
    const map = new Map<string, PlatformAccount>();
    for (const acc of eligibleAccounts) {
      map.set(acc.id, acc);
    }
    return map;
  }, [eligibleAccounts]);

  const handleAddAccount = () => {
    if (!selectedAccountId) {
      toast.error('Selecione uma conta para vincular.');
      return;
    }

    const acc = accountMap.get(selectedAccountId);
    if (!acc) return;

    // Regra da Meta: se já existe uma conta com o mesmo tipo e marcada como owner, alertar
    const newLink: BusinessCenterAccountInput = {
      platform_account_id: selectedAccountId,
      relationship_type: selectedRelType,
      permission_level: selectedPermLevel,
      status: selectedStatus,
      notes: notes.trim() || null,
    };

    onChange([...linkedAccounts, newLink]);
    setSelectedAccountId('');
    setNotes('');
    toast.success(`${acc.name} adicionado(a) aos vínculos!`);
  };

  const handleRemoveAccount = (accountId: string) => {
    const updated = linkedAccounts.filter((l) => l.platform_account_id !== accountId);
    onChange(updated);
    toast.info('Vínculo removido da lista.');
  };

  const handleUpdateRelType = (accountId: string, newType: RelationshipType) => {
    const updated = linkedAccounts.map((l) => {
      if (l.platform_account_id === accountId) {
        return { ...l, relationship_type: newType };
      }
      return l;
    });
    onChange(updated);
  };

  const handleUpdatePermLevel = (accountId: string, newPerm: PermissionLevel) => {
    const updated = linkedAccounts.map((l) => {
      if (l.platform_account_id === accountId) {
        return { ...l, permission_level: newPerm };
      }
      return l;
    });
    onChange(updated);
  };

  if (platform === 'google') {
    return null;
  }

  const isTikTok = platform === 'tiktok';
  const isMeta = platform === 'meta';

  return (
    <div className="space-y-4 pt-4 border-t border-zinc-800">
      {/* Cabeçalho da Seção */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {isTikTok ? (
              <TikTokLogo className="w-4 h-4 text-cyan-400" />
            ) : (
              <InstagramLogo className="w-4 h-4 text-pink-400" />
            )}
            <h4
              className={`text-xs font-bold uppercase tracking-wider ${
                isTikTok ? 'text-cyan-300' : 'text-blue-300'
              }`}
            >
              {isTikTok
                ? '4. Contas TikTok Vinculadas'
                : '4. Redes Sociais e Perfis Vinculados'}
            </h4>
          </div>
          <p className="text-xs text-zinc-400">
            {isTikTok
              ? 'Vincule os perfis do TikTok associados a este Business Center (Proprietário, Acesso ou Anúncios).'
              : 'Vincule os perfis do Instagram e páginas do Facebook associados a este portfólio.'}
          </p>
        </div>

        <Badge
          variant="outline"
          className="bg-zinc-900 border-zinc-700 text-zinc-300 text-[11px] font-mono px-2.5 py-0.5"
        >
          {linkedAccounts.length}{' '}
          {linkedAccounts.length === 1 ? 'conta vinculada' : 'contas vinculadas'}
        </Badge>
      </div>

      {/* Caixa de Adição de Nova Conta */}
      <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            Adicionar Conta ao Business Center:
          </Label>

          {/* Abas de filtro para Meta */}
          {isMeta && (
            <div className="flex items-center gap-1 bg-zinc-900 p-0.5 rounded-lg border border-zinc-800 text-[11px]">
              <button
                type="button"
                onClick={() => setActiveMetaTab('all')}
                className={`px-2 py-0.5 rounded font-medium transition-all ${
                  activeMetaTab === 'all'
                    ? 'bg-zinc-800 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Todos ({unlinkedAccounts.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveMetaTab('instagram')}
                className={`flex items-center gap-1 px-2 py-0.5 rounded font-medium transition-all ${
                  activeMetaTab === 'instagram'
                    ? 'bg-pink-500/20 text-pink-300 shadow-sm'
                    : 'text-zinc-400 hover:text-pink-300'
                }`}
              >
                <InstagramLogo className="w-3 h-3" />
                Instagram
              </button>
              <button
                type="button"
                onClick={() => setActiveMetaTab('facebook')}
                className={`flex items-center gap-1 px-2 py-0.5 rounded font-medium transition-all ${
                  activeMetaTab === 'facebook'
                    ? 'bg-blue-500/20 text-blue-300 shadow-sm'
                    : 'text-zinc-400 hover:text-blue-300'
                }`}
              >
                <FacebookLogo className="w-3 h-3" />
                Facebook
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5">
          {/* Selecionar Conta */}
          <div className="md:col-span-5">
            <Select
              value={selectedAccountId}
              onValueChange={setSelectedAccountId}
              disabled={disabled || dropdownAccounts.length === 0}
            >
              <SelectTrigger className="bg-zinc-900 border-zinc-800 text-xs h-9 text-white">
                <SelectValue
                  placeholder={
                    dropdownAccounts.length === 0
                      ? 'Nenhuma outra conta disponível'
                      : 'Selecione a conta cadastrada...'
                  }
                />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800 text-white max-h-60">
                {dropdownAccounts.map((acc) => (
                  <SelectItem key={acc.id} value={acc.id}>
                    <div className="flex items-center gap-2">
                      {acc.platform === 'tiktok' ? (
                        <TikTokLogo className="w-3.5 h-3.5 text-cyan-400" />
                      ) : acc.meta_account_type === 'facebook' ? (
                        <FacebookLogo className="w-3.5 h-3.5 text-blue-400" />
                      ) : (
                        <InstagramLogo className="w-3.5 h-3.5 text-pink-400" />
                      )}
                      <span className="font-semibold text-white">{acc.name}</span>
                      {acc.nickname && (
                        <span className="text-zinc-400 font-mono text-[11px]">
                          @{acc.nickname}
                        </span>
                      )}
                      {acc.holder_name && (
                        <span className="text-zinc-500 text-[10px]">
                          ({acc.holder_name})
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tipo de Relação */}
          <div className="md:col-span-4">
            <Select
              value={selectedRelType}
              onValueChange={(v) => setSelectedRelType(v as RelationshipType)}
              disabled={disabled}
            >
              <SelectTrigger className="bg-zinc-900 border-zinc-800 text-xs h-9 text-white">
                <SelectValue placeholder="Tipo de Relação" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                <SelectItem value="owner">
                  <div className="flex items-center gap-1.5">
                    <Crown className="w-3.5 h-3.5 text-amber-400" />
                    <span className="font-medium text-amber-300">👑 Proprietário (Dono)</span>
                  </div>
                </SelectItem>
                <SelectItem value="partner_access">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-blue-400" />
                    <span className="font-medium text-blue-300">🤝 Acesso de Parceiro</span>
                  </div>
                </SelectItem>
                <SelectItem value="ad_authorization">
                  <div className="flex items-center gap-1.5">
                    <Megaphone className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="font-medium text-cyan-300">📢 Apenas Anúncios (Spark)</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Nível de Permissão */}
          <div className="md:col-span-3">
            <Select
              value={selectedPermLevel}
              onValueChange={(v) => setSelectedPermLevel(v as PermissionLevel)}
              disabled={disabled}
            >
              <SelectTrigger className="bg-zinc-900 border-zinc-800 text-xs h-9 text-white">
                <SelectValue placeholder="Permissão" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                <SelectItem value="admin">Acesso Total (Admin)</SelectItem>
                <SelectItem value="standard">Padrão (Operacional)</SelectItem>
                <SelectItem value="ads_only">Apenas Anúncios</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Linha com Notas Opcionais e Botão de Adição */}
        <div className="flex items-center gap-2 pt-1">
          <Input
            placeholder="Observações internas ou código Spark Ads (opcional)..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="bg-zinc-900 border-zinc-800 text-xs h-8 text-white placeholder:text-zinc-600"
            disabled={disabled}
          />
          <Button
            type="button"
            size="sm"
            onClick={handleAddAccount}
            disabled={disabled || !selectedAccountId}
            className="h-8 px-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-medium flex-shrink-0"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Vincular
          </Button>
        </div>
      </div>

      {/* Lista de Contas Vinculadas */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
          <span>Associações Ativas neste Business Center ({linkedAccounts.length}):</span>
          {linkedAccounts.length > 0 && (
            <span className="text-[11px] text-zinc-500 font-normal">
              Você pode alterar a relação ou remover individualmente
            </span>
          )}
        </Label>

        {linkedAccounts.length === 0 ? (
          <div className="p-4 rounded-xl border border-dashed border-zinc-800 text-center text-xs text-zinc-500">
            Nenhuma conta de plataforma associada a este Business Center ainda.
            <br />
            Selecione uma conta acima para vincular.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2">
            {linkedAccounts.map((link) => {
              const acc = accountMap.get(link.platform_account_id);

              return (
                <div
                  key={link.platform_account_id}
                  className="flex items-center justify-between p-3 rounded-xl bg-zinc-950/90 border border-zinc-800 hover:border-zinc-700 transition-all text-xs"
                >
                  {/* Informações da Conta */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center flex-shrink-0">
                      {acc?.platform === 'tiktok' ? (
                        <TikTokLogo className="w-4 h-4 text-cyan-400" />
                      ) : acc?.meta_account_type === 'facebook' ? (
                        <FacebookLogo className="w-4 h-4 text-blue-400" />
                      ) : (
                        <InstagramLogo className="w-4 h-4 text-pink-400" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white truncate">
                          {acc?.name || 'Conta não encontrada'}
                        </span>
                        {acc?.nickname && (
                          <span className="text-zinc-400 font-mono text-[11px] truncate">
                            @{acc.nickname}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                        {acc?.holder_name && (
                          <span>Titular: {acc.holder_name}</span>
                        )}
                        {link.notes && (
                          <span className="text-zinc-400 italic">· "{link.notes}"</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Seletores / Badges de Relação e Permissão */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Seletor rápido de tipo de relação */}
                    <Select
                      value={link.relationship_type}
                      onValueChange={(val) =>
                        handleUpdateRelType(link.platform_account_id, val as RelationshipType)
                      }
                      disabled={disabled}
                    >
                      <SelectTrigger
                        className={`h-7 px-2.5 text-[11px] font-semibold border rounded-lg ${
                          link.relationship_type === 'owner'
                            ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                            : link.relationship_type === 'partner_access'
                            ? 'bg-blue-500/15 border-blue-500/40 text-blue-300'
                            : 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
                        }`}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-800 text-white text-xs">
                        <SelectItem value="owner">👑 Proprietário</SelectItem>
                        <SelectItem value="partner_access">🤝 Parceiro (Acesso)</SelectItem>
                        <SelectItem value="ad_authorization">📢 Anúncios (Spark)</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Seletor de Permissão */}
                    <Select
                      value={link.permission_level || 'standard'}
                      onValueChange={(val) =>
                        handleUpdatePermLevel(link.platform_account_id, val as PermissionLevel)
                      }
                      disabled={disabled}
                    >
                      <SelectTrigger className="h-7 px-2 text-[11px] bg-zinc-900 border-zinc-800 text-zinc-300 rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-800 text-white text-xs">
                        <SelectItem value="admin">Acesso Total</SelectItem>
                        <SelectItem value="standard">Padrão</SelectItem>
                        <SelectItem value="ads_only">Apenas Anúncios</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Botão de Excluir */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveAccount(link.platform_account_id)}
                      disabled={disabled}
                      className="h-7 w-7 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg"
                      title="Remover vínculo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
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
