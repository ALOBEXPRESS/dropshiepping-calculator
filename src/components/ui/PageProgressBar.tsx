import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

export interface PageProgressBarProps {
  color?: string;
  height?: number;
  className?: string;
}

/**
 * PageProgressBar - Barra de progresso da página vinculada ao scroll
 * 
 * Baseado no CSS Pack: https://cdncsspack.heitorweb.com/csspbarra-de-progresso-da-pagina-personalizada/
 * 
 * Features:
 * - Acompanha scroll da página
 * - Fixada no topo
 * - Cor e altura customizáveis
 * - Performance otimizada com throttle
 * 
 * @example
 * <PageProgressBar color="#fe2c55" height={3} />
 */
export const PageProgressBar: React.FC<PageProgressBarProps> = ({
  color = '#fe2c55',
  height = 3,
  className,
}) => {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const windowHeight = window.innerHeight;
          const documentHeight = document.documentElement.scrollHeight;
          const scrollTop = window.scrollY;

          const totalScrollable = documentHeight - windowHeight;
          
          if (totalScrollable > 0) {
            const progress = (scrollTop / totalScrollable) * 100;
            setScrollProgress(Math.min(progress, 100));
          } else {
            setScrollProgress(0);
          }

          ticking = false;
        });

        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Calcular progresso inicial
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div
      className={cn(
        'fixed top-0 left-0 right-0 z-50',
        'bg-gray-200 dark:bg-gray-800',
        className
      )}
      style={{ height: `${height}px` }}
    >
      <div
        className="h-full transition-all duration-150 ease-out"
        style={{
          width: `${scrollProgress}%`,
          backgroundColor: color,
        }}
      />
    </div>
  );
};
