import React, { useState, useMemo } from 'react';
import { useDevices } from '@/hooks/useDevices';
import { useDebounce } from '@/hooks/useDebounce';
import { DeviceFormDialog } from './DeviceFormDialog';
import type { Device, DeviceFormData, DeviceWithStats } from '@/types/devices';
import {
  DEVICE_PLATFORM_LABELS,
  DOUPLUS_PROFILE_LABELS,
  type DouplusDeviceProfile,
} from '@/constants/deviceTypes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Cloud,
  Cpu,
  Monitor,
  Smartphone,
  Plus,
  Search,
  Edit2,
  Trash2,
  Shield,
  Layers,
  AlertTriangle,
} from 'lucide-react';
import { DeviceLogo } from '@/components/ui/DeviceLogo';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

interface DevicesManagerProps {
  organizationId: string;
}

export const DevicesManager: React.FC<DevicesManagerProps> = ({ organizationId: _orgId }) => {
  const {
    devicesWithStats,
    isLoading,
    createDevice,
    updateDevice,
    deleteDevice,
    isCreating,
    isUpdating,
  } = useDevices();

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [formOpen, setFormOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [deletingDevice, setDeletingDevice] = useState<DeviceWithStats | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredDevices = useMemo(() => {
    if (!debouncedSearch.trim()) return devicesWithStats;
    const q = debouncedSearch.toLowerCase().trim();
    return devicesWithStats.filter(
      (d) =>
        d.label.toLowerCase().includes(q) ||
        (d.platform && d.platform.toLowerCase().includes(q)) ||
        (d.notes && d.notes.toLowerCase().includes(q))
    );
  }, [devicesWithStats, debouncedSearch]);

  // Agrupamento visual por categoria
  const cloudPhones = useMemo(
    () => filteredDevices.filter((d) => d.device_type === 'cloud_phone'),
    [filteredDevices]
  );
  const emulators = useMemo(
    () => filteredDevices.filter((d) => d.device_type === 'emulator'),
    [filteredDevices]
  );
  const physicalDevices = useMemo(
    () => filteredDevices.filter((d) => d.device_type === 'pc_windows' || d.device_type === 'mobile'),
    [filteredDevices]
  );

  const handleOpenCreate = () => {
    setEditingDevice(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (dev: Device) => {
    setEditingDevice(dev);
    setFormOpen(true);
  };

  const handleSave = async (data: DeviceFormData) => {
    if (editingDevice) {
      await updateDevice({ id: editingDevice.id, data });
    } else {
      await createDevice(data);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingDevice) return;
    setIsDeleting(true);
    try {
      await deleteDevice(deletingDevice.id);
      setDeletingDevice(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const renderDeviceCard = (device: DeviceWithStats) => {
    const isDouplus = device.device_type === 'cloud_phone' && device.platform === 'douplus';
    const douplusProfileKey =
      device.platform_metadata && typeof device.platform_metadata === 'object'
        ? (device.platform_metadata as { device_profile?: DouplusDeviceProfile }).device_profile
        : null;

    const douplusProfileLabel = douplusProfileKey
      ? DOUPLUS_PROFILE_LABELS[douplusProfileKey] || douplusProfileKey
      : null;

    const platformLabel = device.platform
      ? DEVICE_PLATFORM_LABELS[device.platform] || device.platform
      : device.device_type === 'pc_windows'
      ? 'Windows PC'
      : 'Celular Físico';

    return (
      <div
        key={device.id}
        className="p-5 rounded-2xl border border-zinc-800/90 bg-zinc-900/50 hover:bg-zinc-900/80 transition-all duration-200 flex flex-col justify-between group relative overflow-hidden"
      >
        <div className="space-y-3">
          {/* Header do Card */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <DeviceLogo
                platform={device.platform}
                deviceType={device.device_type}
                label={device.label}
                className="w-10 h-10"
              />

              <div>
                <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                  {device.label}
                </h4>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[11px] font-medium text-zinc-300 bg-zinc-800/90 px-2 py-0.5 rounded-md border border-zinc-700/80">
                    {platformLabel}
                  </span>
                  {device.proxy_label && (
                    <span className="text-[10px] text-orange-400 bg-orange-500/10 border border-orange-500/30 px-1.5 py-0.5 rounded flex items-center gap-1">
                      <Shield className="w-2.5 h-2.5" />
                      {device.proxy_label}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={() => handleOpenEdit(device)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                title="Editar dispositivo"
                aria-label={`Editar dispositivo ${device.label}`}
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setDeletingDevice(device)}
                className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                title="Excluir dispositivo"
                aria-label={`Excluir dispositivo ${device.label}`}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Douplus Profile Badge Especial */}
          {isDouplus && douplusProfileLabel && (
            <div className="p-2.5 rounded-xl border border-cyan-500/20 bg-cyan-500/5 space-y-1">
              <span className="text-[10px] text-cyan-400/80 font-bold uppercase tracking-wider block">
                Perfil de Hardware Douplus
              </span>
              <p className="text-xs font-semibold text-cyan-200">
                {douplusProfileLabel}
              </p>
            </div>
          )}

          {/* Notas se houver */}
          {device.notes && (
            <p className="text-[11px] text-zinc-400 line-clamp-2 bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-800/60">
              {device.notes}
            </p>
          )}
        </div>

        {/* Rodapé do Card */}
        <div className="pt-3 mt-3 border-t border-zinc-800/60 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-zinc-400">
            <Layers className="w-3.5 h-3.5 text-cyan-400/80" />
            <span>Contas Vinculadas</span>
          </div>
          <span
            className={`font-mono font-bold px-2 py-0.5 rounded-full border text-[11px] ${
              (device.account_count ?? 0) > 0
                ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                : 'bg-zinc-800/60 text-zinc-500 border-zinc-800'
            }`}
          >
            {device.account_count ?? 0} {device.account_count === 1 ? 'conta' : 'contas'}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header com Busca e Botão Novo Dispositivo */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white tracking-wide">
              Dispositivos e Ambientes Operacionais
            </h3>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
              {devicesWithStats.length}
            </span>
          </div>
          <p className="text-xs text-zinc-400">
            Gerencie instâncias de Cloud Phones (Douplus), Emuladores Android (MuMu, LDPlayer) e dispositivos dedicados.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-500" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar dispositivo ou plataforma..."
              className="pl-9 bg-zinc-900 border-zinc-800 text-xs h-9 text-white placeholder:text-zinc-500 focus:border-cyan-500/60"
            />
          </div>
          <Button
            onClick={handleOpenCreate}
            className="bg-cyan-500 hover:bg-cyan-600 text-white font-medium text-xs h-9 px-4 gap-2 whitespace-nowrap cursor-pointer shadow-lg shadow-cyan-500/10"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Dispositivo</span>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-40 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 animate-pulse"
            />
          ))}
        </div>
      ) : filteredDevices.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/20 space-y-3">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto text-cyan-400">
            <Cloud className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-semibold text-white">
            {search ? 'Nenhum dispositivo encontrado' : 'Nenhum dispositivo cadastrado'}
          </h4>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            {search
              ? 'Tente ajustar os termos da sua busca.'
              : 'Cadastre suas instâncias do Douplus, LDPlayer ou celulares reais para associar às contas de rede social.'}
          </p>
          {!search && (
            <Button
              onClick={handleOpenCreate}
              variant="outline"
              className="mt-2 text-xs border-zinc-700 hover:bg-zinc-800 text-zinc-200"
            >
              Cadastrar Dispositivo
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {/* Seção 1: Cloud Phones */}
          {cloudPhones.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-zinc-800">
                <Cloud className="w-4 h-4 text-cyan-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
                  Cloud Phones (Celulares em Nuvem)
                </h4>
                <span className="text-[11px] font-mono text-zinc-500">
                  ({cloudPhones.length})
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {cloudPhones.map(renderDeviceCard)}
              </div>
            </div>
          )}

          {/* Seção 2: Emuladores */}
          {emulators.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-zinc-800">
                <Cpu className="w-4 h-4 text-indigo-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
                  Emuladores Android (PC)
                </h4>
                <span className="text-[11px] font-mono text-zinc-500">
                  ({emulators.length})
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {emulators.map(renderDeviceCard)}
              </div>
            </div>
          )}

          {/* Seção 3: Dispositivos Físicos */}
          {physicalDevices.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-zinc-800">
                <Monitor className="w-4 h-4 text-emerald-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
                  Dispositivos Físicos (PC e Celulares)
                </h4>
                <span className="text-[11px] font-mono text-zinc-500">
                  ({physicalDevices.length})
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {physicalDevices.map(renderDeviceCard)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Dialog de Criação / Edição */}
      <DeviceFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        device={editingDevice}
        onSubmit={handleSave}
        isSubmitting={isCreating || isUpdating}
      />

      {/* Dialog de Confirmação de Exclusão */}
      <Dialog open={!!deletingDevice} onOpenChange={(open) => !open && setDeletingDevice(null)}>
        <DialogContent className="max-w-md bg-zinc-950 border-zinc-800 text-white rounded-2xl shadow-2xl">
          <DialogHeader>
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mb-2">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
            </div>
            <DialogTitle className="text-base font-bold text-white">
              Excluir Dispositivo
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-400">
              Tem certeza que deseja remover o dispositivo{' '}
              <strong className="text-white">"{deletingDevice?.label}"</strong>?
              {deletingDevice && (deletingDevice.account_count ?? 0) > 0 && (
                <span className="block mt-2 text-rose-400 font-medium">
                  Atenção: Este dispositivo possui {deletingDevice.account_count} conta(s) associada(s).
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={isDeleting}
              onClick={() => setDeletingDevice(null)}
              className="bg-transparent border-zinc-800 hover:bg-zinc-900 text-xs text-zinc-300"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={isDeleting || (deletingDevice?.account_count ?? 0) > 0}
              onClick={handleConfirmDelete}
              className="bg-rose-500 hover:bg-rose-600 text-white font-medium text-xs px-4"
            >
              {isDeleting ? 'Excluindo...' : 'Confirmar Exclusão'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
