import { useEffect } from 'react';

/**
 * SmoothScroll - Scroll suave para toda a aplicação
 * 
 * Baseado no CSS Pack: https://cdncsspack.heitorweb.com/csspscroll-suave/
 * 
 * Features:
 * - Scroll suave em toda a página
 * - Aplica automaticamente ao montar
 * - Respeita prefers-reduced-motion
 * - Performance otimizada
 * 
 * @example
 * // Em App.tsx ou layout principal
 * <SmoothScroll />
 */
export const SmoothScroll = () => {
  useEffect(() => {
    // Verificar se usuário prefere movimento reduzido
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (!prefersReducedMotion) {
      document.documentElement.style.scrollBehavior = 'smooth';
    }

    return () => {
      document.documentElement.style.scrollBehavior = 'auto';
    };
  }, []);

  return null;
};
