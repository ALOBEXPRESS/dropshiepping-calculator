import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface MagneticButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  strength?: number; // 0-1, força do efeito magnético
  variant?: 'primary' | 'secondary' | 'outline';
}

/**
 * MagneticButton - Botão com efeito magnético ao aproximar o mouse
 * 
 * Baseado no CSS Pack: https://cdncsspack.heitorweb.com/csspbotao-magnetico/
 * 
 * Features:
 * - Atração magnética suave ao aproximar o mouse
 * - Retorno suave à posição original
 * - Variantes de estilo (primary, secondary, outline)
 * - Acessível (mantém funcionalidade de botão)
 * 
 * @example
 * <MagneticButton strength={0.3} variant="primary">
 *   Preencher
 * </MagneticButton>
 */
export const MagneticButton = React.forwardRef<HTMLButtonElement, MagneticButtonProps>(
  ({ children, strength = 0.3, variant = 'primary', className, ...props }, ref) => {
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });

    const variants = {
      primary: `
        bg-gradient-to-r from-[#fe2c55] to-pink-500
        text-white font-semibold
        hover:shadow-lg hover:shadow-[#fe2c55]/50
        border-none
      `,
      secondary: `
        bg-gray-100 text-gray-900
        hover:bg-gray-200
        border border-gray-200
      `,
      outline: `
        border-2 border-[#fe2c55] text-[#fe2c55]
        hover:bg-[#fe2c55]/10
        bg-transparent
      `,
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!buttonRef.current) return;

      const rect = buttonRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      // Calcula distância do mouse ao centro
      const distanceX = e.clientX - centerX;
      const distanceY = e.clientY - centerY;

      // Aplica força magnética (quanto mais perto, maior o efeito)
      const maxDistance = 100; // pixels
      const distance = Math.sqrt(distanceX ** 2 + distanceY ** 2);
      const magneticStrength = Math.max(0, 1 - distance / maxDistance) * strength;

      setPosition({
        x: distanceX * magneticStrength,
        y: distanceY * magneticStrength,
      });
    };

    const handleMouseLeave = () => {
      setPosition({ x: 0, y: 0 });
    };

    return (
      <motion.button
        ref={(node) => {
          // Suporta tanto ref interno quanto externo
          if (typeof ref === 'function') {
            ref(node);
          } else if (ref) {
            ref.current = node;
          }
          buttonRef.current = node;
        }}
        animate={{
          x: position.x,
          y: position.y,
        }}
        transition={{
          type: 'spring',
          stiffness: 400,
          damping: 25,
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={cn(
          'relative min-h-[44px] px-6 py-3 rounded-lg',
          'transition-all duration-300',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'will-change-transform',
          variants[variant],
          className
        )}
        type={props.type || 'button'}
        disabled={props.disabled}
        onClick={props.onClick}
        onFocus={props.onFocus}
        onBlur={props.onBlur}
        aria-label={props['aria-label']}
      >
        {children}
      </motion.button>
    );
  }
);

MagneticButton.displayName = 'MagneticButton';
