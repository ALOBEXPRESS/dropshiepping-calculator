import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface BounceAnimationProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
}

/**
 * BounceAnimation - Animação de entrada com efeito vai e volta
 * 
 * Baseado no CSS Pack: https://cdncsspack.heitorweb.com/csspanimacao-de-entrada-vai-e-volta/
 * 
 * Features:
 * - Animação bounce suave
 * - Delay configurável
 * - Duração customizável
 * - Chama atenção para elementos importantes
 * 
 * @example
 * <BounceAnimation delay={0.2} duration={0.6}>
 *   <div className="success-card">Tudo processado!</div>
 * </BounceAnimation>
 */
export const BounceAnimation: React.FC<BounceAnimationProps> = ({
  children,
  className,
  delay = 0,
  duration = 0.6,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: -20 }}
      animate={{ 
        opacity: 1, 
        scale: 1, 
        y: 0,
      }}
      transition={{
        type: 'spring',
        stiffness: 260,
        damping: 20,
        delay,
        duration,
      }}
      className={cn('will-change-transform', className)}
    >
      {children}
    </motion.div>
  );
};
