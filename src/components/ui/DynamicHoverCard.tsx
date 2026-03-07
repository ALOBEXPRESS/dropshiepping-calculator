import React, { useRef } from 'react';
import { useMotionValue, useTransform, motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface DynamicHoverCardProps {
  children: React.ReactNode;
  className?: string;
  intensity?: number; // 0-1, controla a intensidade do efeito 3D
}

export const DynamicHoverCard: React.FC<DynamicHoverCardProps> = ({
  children,
  className,
  intensity = 0.15,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Transforma movimento do mouse em rotação 3D
  const rotateX = useTransform(y, [-100, 100], [intensity * 10, -intensity * 10]);
  const rotateY = useTransform(x, [-100, 100], [-intensity * 10, intensity * 10]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // Calcula distância do mouse ao centro do card
    x.set(e.clientX - centerX);
    y.set(e.clientY - centerY);
  };

  const handleMouseLeave = () => {
    // Retorna suavemente à posição original
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
      }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 20,
      }}
      className={cn('will-change-transform', className)}
    >
      {children}
    </motion.div>
  );
};
