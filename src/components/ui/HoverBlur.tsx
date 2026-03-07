import React from 'react';
import { cn } from '@/lib/utils';

export interface HoverBlurProps {
  src: string;
  alt: string;
  className?: string;
  blurAmount?: number; // 0-10, intensidade do blur
  overlayOpacity?: number; // 0-1, opacidade do overlay escuro
}

/**
 * HoverBlur - Imagem com efeito de desfoque no hover
 * 
 * Baseado no CSS Pack: https://cdncsspack.heitorweb.com/cssphover-com-desfoque/
 * 
 * Features:
 * - Desfoque suave ao passar o mouse
 * - Overlay escuro opcional
 * - Zoom sutil para profundidade
 * - Performance otimizada com will-change
 * 
 * @example
 * <HoverBlur
 *   src="/produto.jpg"
 *   alt="Produto"
 *   blurAmount={4}
 *   overlayOpacity={0.2}
 * />
 */
export const HoverBlur: React.FC<HoverBlurProps> = ({
  src,
  alt,
  className,
  blurAmount = 4,
  overlayOpacity = 0.2,
}) => {
  return (
    <div className={cn('relative overflow-hidden rounded-lg group cursor-pointer', className)}>
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className={cn(
          'w-full h-full object-cover',
          'transition-all duration-500 ease-out',
          'will-change-transform',
          'group-hover:scale-105',
          `group-hover:blur-[${blurAmount}px]`
        )}
        style={{
          // Fallback inline para garantir blur funciona
          filter: 'blur(0px)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.filter = `blur(${blurAmount}px)`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.filter = 'blur(0px)';
        }}
      />
      <div
        className={cn(
          'absolute inset-0',
          'bg-black/0',
          'transition-colors duration-500',
          `group-hover:bg-black/${Math.round(overlayOpacity * 100)}`
        )}
      />
    </div>
  );
};
