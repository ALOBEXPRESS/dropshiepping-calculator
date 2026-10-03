import React, { useState, useMemo } from 'react';
import {
  FlaskConical,
  TrendingUp,
  ShieldCheck,
  BarChart3,
  Plus,
  Trash2,
  ExternalLink,
  User,
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
import type {
  BusinessCenterTestadorInput,
  BusinessCenterTestadorRole,
  PermissionLevel,
} from '@/types/businessCenters';
import { BC_TESTADOR_ROLE_CONFIG, PERMISSION_LEVEL_CONFIG } from '@/types/businessCenters';
import type { Testador } from '@/types/responsaveis';
import { formatCpf, formatPhoneByCountry } from '@/utils/inputMasks';
import { toast } from 'sonner';

interface BusinessCenterTestadoresSectionProps {
  linkedTestadores: BusinessCenterTestadorInput[];
  onChange: (testadores: BusinessCenterTestadorInput[]) => void;
  availableTestadores: Testador[];
  disabled?: boolean;
}

export const BusinessCenterTestadoresSection: React.FC<
  BusinessCenterTestadoresSectionProps
> = ({
  linkedTestadores,
  onChange,
  availableTestadores,
  disabled = false,
}) => {
  const [selectedTestadorId, setSelectedTestadorId] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<BusinessCenterTestadorRole>('testador');
  const [selectedPermLevel, setSelectedPermLevel] = useState<PermissionLevel>('standard');
  const [notes, setNotes] = useState<string>('');

  // Testadores que ainda não foram adicionados
  const unlinkedTestadores = useMemo(() => {
    const linkedIds = new Set(linkedTestadores.map((l) => l.testador_id));
    return availableTestadores.filter((t) => !linkedIds.has(t.id));
  }, [availableTestadores, linkedTestadores]);

  // Mapa de testadores para lookup rápido
  const testadorMap = useMemo(() => {
    const map = new Map<string, Testador>();
    for (const t of availableTestadores) {
      map.set(t.id, t);
    }
    return map;
  }, [availableTestadores]);

  const handleAddTestador = () => {
    if (!selectedTestadorId) {
      toast.error('Selecione um testador para vincular.');
      return;
    }

    const t = testadorMap.get(selectedTestadorId);
    if (!t) return;

    const newLink: BusinessCenterTestadorInput = {
      testador_id: selectedTestadorId,
      role: selectedRole,
      permission_level: selectedPermLevel,
      status: 'active',
      notes: notes.trim() || null,
    };

    onChange([...linkedTestadores, newLink]);
    setSelectedTestadorId('');
    setNotes('');
    toast.success(`${t.full_name} vinculado(a) ao Business Center!`);
  };

  const handleRemoveTestador = (testadorId: string) => {
    const updated = linkedTestadores.filter((l) => l.testador_id !== testadorId);
    onChange(updated);
    toast.info('Testador desvinculado.');
  };

  const handleUpdateRole = (testadorId: string, newRole: BusinessCenterTestadorRole) => {
    const updated = linkedTestadores.map((l) => {
      if (l.testador_id === testadorId) {
        return { ...l, role: newRole };
      }
      return l;
    });
    onChange(updated);
  };

  const handleUpdatePerm = (testadorId: string, newPerm: PermissionLevel) => {
    const updated = linkedTestadores.map((l) => {
      if (l.testador_id === testadorId) {
        return { ...l, permission_level: newPerm };
      }
      return l;
    });
    onChange(updated);
  };

  return (
    <div className="space-y-4 pt-4 border-t border-zinc-800">
      {/* Cabeçalho da Seção */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-sky-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-sky-300">
              5. Testadores & Membros da Operação
            </h4>
          </div>
          <p className="text-xs text-zinc-400">
            Vincule os testadores e operadores responsáveis por validar produtos e gerenciar anúncios neste Business Center.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/responsaveis?tab=testadores"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-sky-400 hover:text-sky-300 hover:underline flex items-center gap-1"
          >
            <span>+ Cadastrar Testador</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <Badge
            variant="outline"
            className="bg-zinc-900 border-zinc-700 text-sky-300 text-[11px] font-mono px-2.5 py-0.5"
          >
            {linkedTestadores.length}{' '}
            {linkedTestadores.length === 1 ? 'testador vinculado' : 'testadores vinculados'}
          </Badge>
        </div>
      </div>

      {/* Caixa de Adição de Novo Testador */}
      <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5 text-sky-400" />
            Vincular Testador ao Business Center:
          </Label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5">
          {/* Selecionar Testador */}
          <div className="md:col-span-5">
            <Select
              value={selectedTestadorId}
              onValueChange={setSelectedTestadorId}
              disabled={disabled || unlinkedTestadores.length === 0}
            >
              <SelectTrigger className="bg-zinc-900 border-zinc-800 text-xs h-9 text-white">
                <SelectValue
                  placeholder={
                    unlinkedTestadores.length === 0
                      ? 'Nenhum outro testador disponível'
                      : 'Selecione o testador cadastrado...'
                  }
                />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800 text-white max-h-60">
                {unlinkedTestadores.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-sky-400" />
                      <span className="font-semibold text-white">{t.full_name}</span>
                      {t.document_number && (
                        <span className="text-zinc-400 font-mono text-[11px]">
                          ({formatCpf(t.document_number)})
                        </span>
                      )}
                      {t.email && (
                        <span className="text-zinc-500 text-[10px]">
                          · {t.email}
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Função / Papel */}
          <div className="md:col-span-4">
            <Select
              value={selectedRole}
              onValueChange={(v) => setSelectedRole(v as BusinessCenterTestadorRole)}
              disabled={disabled}
            >
              <SelectTrigger className="bg-zinc-900 border-zinc-800 text-xs h-9 text-white">
                <SelectValue placeholder="Função" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                <SelectItem value="testador">
                  <div className="flex items-center gap-1.5">
                    <FlaskConical className="w-3.5 h-3.5 text-sky-400" />
                    <span className="font-medium text-sky-300">🧪 Testador de Criativos</span>
                  </div>
                </SelectItem>
                <SelectItem value="operador">
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="font-medium text-emerald-300">🎯 Operador de Tráfego</span>
                  </div>
                </SelectItem>
                <SelectItem value="admin">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                    <span className="font-medium text-purple-300">👑 Administrador</span>
                  </div>
                </SelectItem>
                <SelectItem value="analista">
                  <div className="flex items-center gap-1.5">
                    <BarChart3 className="w-3.5 h-3.5 text-zinc-400" />
                    <span className="font-medium text-zinc-300">📊 Analista de Métricas</span>
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
                <SelectItem value="standard">Padrão (Operacional)</SelectItem>
                <SelectItem value="admin">Acesso Total (Admin)</SelectItem>
                <SelectItem value="ads_only">Apenas Anúncios</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Linha com Notas Opcionais e Botão de Adição */}
        <div className="flex items-center gap-2 pt-1">
          <Input
            placeholder="Observações internas ou escopo de teste (opcional)..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="bg-zinc-900 border-zinc-800 text-xs h-8 text-white placeholder:text-zinc-600"
            disabled={disabled}
          />
          <Button
            type="button"
            size="sm"
            onClick={handleAddTestador}
            disabled={disabled || !selectedTestadorId}
            className="h-8 px-3.5 bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white text-xs font-medium flex-shrink-0"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Vincular Testador
          </Button>
        </div>
      </div>

      {/* Lista de Testadores Vinculados */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
          <span>Testadores Ativos neste Business Center ({linkedTestadores.length}):</span>
          {linkedTestadores.length > 0 && (
            <span className="text-[11px] text-zinc-500 font-normal">
              Você pode alterar a função, permissão ou desvincular
            </span>
          )}
        </Label>

        {linkedTestadores.length === 0 ? (
          <div className="p-4 rounded-xl border border-dashed border-zinc-800 text-center text-xs text-zinc-500">
            Nenhum testador associado a este Business Center ainda.
            <br />
            Selecione um testador cadastrado acima para vincular.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2">
            {linkedTestadores.map((link) => {
              const t = testadorMap.get(link.testador_id);
              const roleCfg = BC_TESTADOR_ROLE_CONFIG[link.role || 'testador'];
              const permCfg = PERMISSION_LEVEL_CONFIG[link.permission_level || 'standard'];

              return (
                <div
                  key={link.testador_id}
                  className="flex items-center justify-between p-3 rounded-xl bg-zinc-950/90 border border-zinc-800 hover:border-zinc-700 transition-all text-xs"
                >
                  {/* Informações do Testador */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center flex-shrink-0">
                      <FlaskConical className="w-4 h-4 text-sky-400" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white truncate">
                          {t?.full_name || 'Testador não encontrado'}
                        </span>
                        {t?.document_number && (
                          <span className="text-zinc-400 font-mono text-[11px] truncate">
                            CPF: {formatCpf(t.document_number)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-zinc-500 flex-wrap">
                        {t?.email && <span>{t.email}</span>}
                        {t?.phone && <span>· {formatPhoneByCountry(t.phone, 'BR')}</span>}
                        {link.notes && (
                          <span className="text-zinc-400 italic">· "{link.notes}"</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Seletores / Badges de Função e Permissão */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Seletor de Função */}
                    <Select
                      value={link.role || 'testador'}
                      onValueChange={(val) =>
                        handleUpdateRole(link.testador_id, val as BusinessCenterTestadorRole)
                      }
                      disabled={disabled}
                    >
                      <SelectTrigger
                        className={`h-7 px-2.5 text-[11px] font-semibold border rounded-lg ${
                          roleCfg?.badgeColor || 'bg-zinc-800 border-zinc-700 text-zinc-300'
                        }`}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-800 text-white text-xs">
                        <SelectItem value="testador">🧪 Testador de Criativos</SelectItem>
                        <SelectItem value="operador">🎯 Operador de Tráfego</SelectItem>
                        <SelectItem value="admin">👑 Administrador</SelectItem>
                        <SelectItem value="analista">📊 Analista de Métricas</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Seletor de Permissão */}
                    <Select
                      value={link.permission_level || 'standard'}
                      onValueChange={(val) =>
                        handleUpdatePerm(link.testador_id, val as PermissionLevel)
                      }
                      disabled={disabled}
                    >
                      <SelectTrigger
                        className={`h-7 px-2.5 text-[11px] font-medium border rounded-lg ${
                          permCfg?.badgeColor || 'bg-zinc-900 border-zinc-800 text-zinc-300'
                        }`}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-800 text-white text-xs">
                        <SelectItem value="standard">Padrão</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="ads_only">Apenas Anúncios</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Botão de Excluir / Desvincular */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveTestador(link.testador_id)}
                      disabled={disabled}
                      className="h-7 w-7 p-0 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                      title="Desvincular testador"
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
