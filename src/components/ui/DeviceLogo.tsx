import React, { useState } from 'react';
import { Cloud, Cpu, Monitor, Smartphone } from 'lucide-react';
import type { DeviceTypeValue } from '@/constants/deviceTypes';

interface DeviceLogoProps {
  platform?: string | null;
  deviceType?: DeviceTypeValue | string | null;
  label?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Normaliza a plataforma/nome do dispositivo e retorna a URL do logo correspondente.
 */
export function getDeviceLogoUrl(platform?: string | null, label?: string | null): string | null {
  const target = `${platform || ''} ${label || ''}`.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!target) return null;

  if (target.includes('douplus')) return '/devices/douplus.png';
  if (target.includes('geelark')) return '/devices/geelark.png';
  if (target.includes('ldcloud')) return '/devices/ldcloud.png';
  if (target.includes('redfinger')) return '/devices/redfinger.png';
  if (target.includes('vmscloud') || target.includes('vmoscloud') || target.includes('vms')) return '/devices/vmoscloud.png';

  return null;
}

export const DeviceLogo: React.FC<DeviceLogoProps> = ({
  platform,
  deviceType,
  label,
  className = 'w-10 h-10',
  size = 'md',
}) => {
  const [hasError, setHasError] = useState(false);
  const logoUrl = getDeviceLogoUrl(platform, label);

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const renderFallbackIcon = () => {
    const iconClass = iconSizes[size];
    if (deviceType === 'cloud_phone') return <Cloud className={iconClass} />;
    if (deviceType === 'emulator') return <Cpu className={iconClass} />;
    if (deviceType === 'mobile') return <Smartphone className={iconClass} />;
    return <Monitor className={iconClass} />;
  };

  const getFallbackTheme = () => {
    if (deviceType === 'cloud_phone') return 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400';
    if (deviceType === 'emulator') return 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400';
    if (deviceType === 'mobile') return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
    return 'bg-zinc-800/80 border-zinc-700/80 text-zinc-300';
  };

  if (!logoUrl || hasError) {
    return (
      <div
        className={`${className} rounded-xl border flex items-center justify-center shrink-0 transition-colors ${getFallbackTheme()}`}
      >
        {renderFallbackIcon()}
      </div>
    );
  }

  return (
    <div
      className={`${className} rounded-xl bg-zinc-900 border border-zinc-800/90 flex items-center justify-center shrink-0 overflow-hidden p-1 shadow-sm transition-all group-hover:border-zinc-700`}
    >
      <img
        src={logoUrl}
        alt={platform || label || 'Dispositivo'}
        onError={() => setHasError(true)}
        className="w-full h-full object-contain rounded-lg"
        loading="lazy"
      />
    </div>
  );
};
