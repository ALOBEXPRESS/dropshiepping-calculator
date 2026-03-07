import React, { useRef } from 'react';
import { useMotionValue, useTransform, motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface Card3DProps {
  children: React.ReactNode;
  className?: string;
  intensity?: number; // 0-1, controla a intensidade do efeito 3D
  glowColor?: string; // Cor do brilho (opcional)
}

/**
 * Card3D - Card com efeito 3D vinculado ao movimento do mouse
 * 
 * Baseado no CSS Pack: https://cdncsspack.heitorweb.com/csspcard-3d/
 * 
 * Features:
 * - Rotação 3D suave seguindo o mouse
 * - Efeito de brilho dinâmico (opcional)
 * - Transição spring natural
 * - Performance otimizada com will-change
 * 
 * @example
 * <Card3D intensity={0.2} glowColor="rgba(254, 44, 85, 0.3)">
 *   <h3>Produto Premium</h3>
 *   <p>Detalhes do produto...</p>
 * </Card3D>
 */
export const Card3D: React.FC<Card3DProps> = ({
  children,
  className,
  intensity = 0.15,
  glowColor,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Transforma movimento do mouse em rotação 3D
  const rotateX = useTransform(y, [-100, 100], [intensity * 10, -intensity * 10]);
  const rotateY = useTransform(x, [-100, 100], [-intensity * 10, intensity * 10]);

  // Efeito de brilho seguindo o mouse (opcional)
  const glowX = useTransform(x, [-100, 100], ['0%', '100%']);
  const glowY = useTransform(y, [-100, 100], ['0%', '100%']);

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
      className={cn('will-change-transform relative', className)}
    >
      {glowColor && (
        <motion.div
          className="absolute inset-0 rounded-inherit pointer-events-none opacity-0 hover:opacity-100 transition-opacity duration-300"
          style={{
            background: `radial-gradient(circle at ${glowX} ${glowY}, ${glowColor}, transparent 50%)`,
          }}
        />
      )}
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
};
