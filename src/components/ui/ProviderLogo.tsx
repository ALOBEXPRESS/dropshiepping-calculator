import React, { useState } from 'react';
import { Server } from 'lucide-react';

interface ProviderLogoProps {
  name: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Normaliza o nome do provedor e retorna a URL do logo correspondente.
 */
export function getProviderLogoUrl(name?: string | null): string | null {
  if (!name) return null;
  const normalized = name.toLowerCase().replace(/[^a-z0-9]/g, '');

  if (normalized.includes('brightdata')) return '/providers/bright-data.png';
  if (normalized.includes('decodo')) return '/providers/decodo.png';
  if (normalized.includes('iproyal')) return '/providers/iproyal.png';
  if (normalized.includes('netnut')) return '/providers/netnut.png';
  if (normalized.includes('oxylabs')) return '/providers/oxylabs.png';
  if (normalized.includes('proxycheap')) return '/providers/proxy-cheap.png';
  if (normalized.includes('rayobyte')) return '/providers/rayobyte.png';
  if (normalized.includes('soax')) return '/providers/soax.png';
  if (normalized.includes('webshare')) return '/providers/webshare.png';

  return null;
}

export const ProviderLogo: React.FC<ProviderLogoProps> = ({
  name,
  className = 'w-10 h-10',
  size = 'md',
}) => {
  const [hasError, setHasError] = useState(false);
  const logoUrl = getProviderLogoUrl(name);

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  if (!logoUrl || hasError) {
    return (
      <div
        className={`${className} rounded-xl bg-orange-500/10 border border-orange-500/25 flex items-center justify-center shrink-0 text-orange-400`}
      >
        <Server className={iconSizes[size]} />
      </div>
    );
  }

  return (
    <div
      className={`${className} rounded-xl bg-zinc-900 border border-zinc-800/90 flex items-center justify-center shrink-0 overflow-hidden p-1 shadow-sm transition-all group-hover:border-zinc-700`}
    >
      <img
        src={logoUrl}
        alt={name}
        onError={() => setHasError(true)}
        className="w-full h-full object-contain rounded-lg"
        loading="lazy"
      />
    </div>
  );
};
