import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface FloatingAnimationProps {
  children: React.ReactNode;
  className?: string;
  duration?: number;
  yOffset?: number;
}

/**
 * FloatingAnimation - Efeito de flutuação suave
 * 
 * Baseado no CSS Pack: https://cdncsspack.heitorweb.com/csspefeito-flutuar/
 * 
 * Features:
 * - Animação de flutuação contínua
 * - Duração configurável
 * - Offset vertical customizável
 * - Suave e sutil
 * 
 * @example
 * <FloatingAnimation duration={3} yOffset={10}>
 *   <CheckCircle className="w-12 h-12 text-green-500" />
 * </FloatingAnimation>
 */
export const FloatingAnimation: React.FC<FloatingAnimationProps> = ({
  children,
  className,
  duration = 3,
  yOffset = 10,
}) => {
  return (
    <motion.div
      animate={{
        y: [0, -yOffset, 0],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      className={cn('will-change-transform', className)}
    >
      {children}
    </motion.div>
  );
};
