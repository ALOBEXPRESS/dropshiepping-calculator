import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface InteractiveMetricProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

/**
 * InteractiveMetric - Métrica com interação dinâmica ao hover/click
 * 
 * Baseado no CSS Pack: https://cdncsspack.heitorweb.com/csspinteracao-dinamica/
 * 
 * Features:
 * - Animação de escala no hover
 * - Feedback visual ao clicar
 * - Ícone opcional
 * - Acessível
 * 
 * @example
 * <InteractiveMetric
 *   label="50 unidades"
 *   value="R$ 1.250,00"
 *   icon={<Package />}
 *   onClick={() => console.log('Clicked')}
 * />
 */
export const InteractiveMetric: React.FC<InteractiveMetricProps> = ({
  label,
  value,
  icon,
  className,
  onClick,
}) => {
  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      onClick={onClick}
      className={cn(
        'relative overflow-hidden',
        'px-4 py-3 rounded-lg',
        'bg-white dark:bg-gray-900',
        'border border-gray-200 dark:border-gray-700',
        'cursor-pointer',
        'group',
        'will-change-transform',
        className
      )}
    >
      {/* Efeito de brilho no hover */}
      <div
        className={cn(
          'absolute inset-0',
          'bg-gradient-to-r from-transparent via-[#fe2c55]/10 to-transparent',
          'translate-x-[-200%]',
          'group-hover:translate-x-[200%]',
          'transition-transform duration-700',
          'pointer-events-none'
        )}
      />

      {/* Conteúdo */}
      <div className="relative z-10 flex items-center gap-3">
        {icon && (
          <div className="text-[#fe2c55] transition-transform duration-200 group-hover:scale-110">
            {icon}
          </div>
        )}
        <div className="flex-1">
          <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
            {label}
          </p>
          <p className="text-lg font-bold text-gray-900 dark:text-gray-100 mt-0.5">
            {value}
          </p>
        </div>
      </div>
    </motion.div>
  );
};
