import React from 'react';
import { cn } from '@/lib/utils';

export interface LightBarProps {
  children: React.ReactNode;
  className?: string;
  lightColor?: string; // Cor da barra de luz
  variant?: 'default' | 'badge' | 'metric';
}

/**
 * LightBar - Elemento com barra de luz animada no hover
 * 
 * Baseado no CSS Pack: https://cdncsspack.heitorweb.com/csspbarra-de-luz-com-interacao-no-hover/
 * 
 * Features:
 * - Barra de luz que atravessa o elemento no hover
 * - Animação suave e fluida
 * - Variantes para diferentes contextos
 * - Performance otimizada
 * 
 * @example
 * <LightBar variant="badge" lightColor="rgba(254, 44, 85, 0.5)">
 *   <span>Shopee Ads</span>
 * </LightBar>
 */
export const LightBar: React.FC<LightBarProps> = ({
  children,
  className,
  lightColor = 'rgba(255, 255, 255, 0.3)',
  variant = 'default',
}) => {
  const variants = {
    default: 'px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800',
    badge: 'px-3 py-1 rounded-full text-xs font-semibold bg-[#fe2c55]/10 text-[#fe2c55] border border-[#fe2c55]/20',
    metric: 'px-4 py-3 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700',
  };

  return (
    <div
      className={cn(
        'relative overflow-hidden',
        'transition-all duration-300',
        'group cursor-pointer',
        variants[variant],
        className
      )}
    >
      {/* Barra de luz animada */}
      <div
        className={cn(
          'absolute inset-0',
          'bg-gradient-to-r from-transparent via-white/30 to-transparent',
          'translate-x-[-200%]',
          'group-hover:translate-x-[200%]',
          'transition-transform duration-700 ease-out',
          'pointer-events-none'
        )}
        style={{
          background: `linear-gradient(to right, transparent, ${lightColor}, transparent)`,
        }}
      />
      
      {/* Conteúdo */}
      <div className="relative z-10">{children}</div>
    </div>
  );
};
