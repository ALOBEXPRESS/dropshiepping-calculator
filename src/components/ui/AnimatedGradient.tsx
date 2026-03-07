import React from 'react';
import { cn } from '@/lib/utils';

export interface AnimatedGradientProps {
  children: React.ReactNode;
  className?: string;
  colors?: string[]; // Array de cores para o gradiente
  speed?: 'slow' | 'normal' | 'fast';
}

/**
 * AnimatedGradient - Container com fundo gradiente animado
 * 
 * Baseado no CSS Pack: https://cdncsspack.heitorweb.com/csspfundo-gradiente-animado/
 * 
 * Features:
 * - Gradiente animado suave
 * - Velocidades configuráveis
 * - Cores customizáveis
 * - Performance otimizada
 * 
 * @example
 * <AnimatedGradient
 *   colors={['#fe2c55', '#f472b6', '#fe2c55']}
 *   speed="slow"
 * >
 *   <h2>Produto Premium</h2>
 * </AnimatedGradient>
 */
export const AnimatedGradient: React.FC<AnimatedGradientProps> = ({
  children,
  className,
  colors = ['#fe2c55', '#f472b6', '#fe2c55'],
  speed = 'normal',
}) => {
  const speeds = {
    slow: 'animate-[gradient_8s_linear_infinite]',
    normal: 'animate-[gradient_5s_linear_infinite]',
    fast: 'animate-[gradient_3s_linear_infinite]',
  };

  const gradientString = colors.join(', ');

  return (
    <div
      className={cn(
        'relative overflow-hidden',
        speeds[speed],
        className
      )}
      style={{
        background: `linear-gradient(135deg, ${gradientString})`,
        backgroundSize: '200% 200%',
      }}
    >
      {children}
    </div>
  );
};
