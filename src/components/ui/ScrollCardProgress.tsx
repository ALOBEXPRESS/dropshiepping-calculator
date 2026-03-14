import React, { useRef, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

export interface ScrollCardProgressProps {
  children: React.ReactNode;
  className?: string;
  maxHeight?: string;
  progressColor?: string;
}

/**
 * ScrollCardProgress - Card com scroll vertical e barra de progresso
 * 
 * Baseado no CSS Pack: https://cdncsspack.heitorweb.com/csspscroll-card-vertical-com-barra-de-progresso/
 * 
 * Features:
 * - Barra de progresso que acompanha o scroll
 * - Scroll suave
 * - Indicador visual de posição
 * - Performance otimizada
 * 
 * @example
 * <ScrollCardProgress maxHeight="400px" progressColor="#fe2c55">
 *   <div>Lista de vendas...</div>
 * </ScrollCardProgress>
 */
export const ScrollCardProgress: React.FC<ScrollCardProgressProps> = ({
  children,
  className,
  maxHeight = '400px',
  progressColor = '#fe2c55',
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!scrollRef.current) return;

      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      const totalScrollable = scrollHeight - clientHeight;
      
      if (totalScrollable > 0) {
        const progress = (scrollTop / totalScrollable) * 100;
        setScrollProgress(progress);
      } else {
        setScrollProgress(0);
      }
    };

    const scrollElement = scrollRef.current;
    if (scrollElement) {
      scrollElement.addEventListener('scroll', handleScroll, { passive: true });
      // Calcular progresso inicial
      handleScroll();
    }

    return () => {
      if (scrollElement) {
        scrollElement.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  return (
    <div className={cn('relative', className)}>
      {/* Barra de progresso */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className="w-full transition-all duration-200 ease-out rounded-full"
          style={{
            height: `${scrollProgress}%`,
            backgroundColor: progressColor,
          }}
        />
      </div>

      {/* Conteúdo com scroll */}
      <div
        ref={scrollRef}
        className={cn(
          'overflow-y-auto pl-4',
          'scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent',
          'dark:scrollbar-thumb-gray-600'
        )}
        style={{ maxHeight }}
      >
        {children}
      </div>
    </div>
  );
};
