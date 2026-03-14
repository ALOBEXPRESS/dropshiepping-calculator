import React from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface RealtimeStatusBadgeProps {
  isConnected: boolean;
  lastUpdate: Date | null;
}

export const RealtimeStatusBadge: React.FC<RealtimeStatusBadgeProps> = ({
  isConnected,
  lastUpdate,
}) => {
  const label = isConnected
    ? 'Atualizações em tempo real ativas'
    : 'Tempo real indisponível — usando polling a cada 30s';

  const lastUpdateText = lastUpdate
    ? `Última atualização: ${lastUpdate.toLocaleTimeString('pt-BR')}`
    : 'Aguardando atualizações...';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border transition-colors ${
              isConnected
                ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400'
                : 'bg-yellow-50 border-yellow-200 text-yellow-700 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-400'
            }`}
            aria-label={label}
          >
            {isConnected ? (
              <Wifi className="w-3.5 h-3.5" aria-hidden="true" />
            ) : (
              <WifiOff className="w-3.5 h-3.5" aria-hidden="true" />
            )}
            {isConnected ? 'Ao vivo' : 'Polling'}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm">{label}</p>
          <p className="text-xs text-gray-400 mt-0.5">{lastUpdateText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
