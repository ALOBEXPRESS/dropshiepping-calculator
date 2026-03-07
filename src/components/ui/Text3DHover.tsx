import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface Text3DHoverProps {
  children: React.ReactNode;
  className?: string;
  intensity?: number;
}

/**
 * Text3DHover - Texto com transição 3D no hover
 * 
 * Baseado no CSS Pack: https://cdncsspack.heitorweb.com/cssptexto-com-transicao-3d-no-hover/
 * 
 * Features:
 * - Rotação 3D no hover
 * - Escala sutil
 * - Transição suave
 * - Destaque interativo
 * 
 * @example
 * <Text3DHover intensity={10}>
 *   <span className="text-2xl font-bold">R$ 1.250,00</span>
 * </Text3DHover>
 */
export const Text3DHover: React.FC<Text3DHoverProps> = ({
  children,
  className,
  intensity = 10,
}) => {
  return (
    <motion.div
      whileHover={{
        scale: 1.05,
        rotateX: intensity,
        rotateY: intensity,
      }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 20,
      }}
      style={{
        transformStyle: 'preserve-3d',
      }}
      className={cn('inline-block cursor-pointer will-change-transform', className)}
    >
      {children}
    </motion.div>
  );
};
