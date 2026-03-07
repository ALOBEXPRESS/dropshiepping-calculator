import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  progress: number; // 0-100
  className?: string;
  showLabel?: boolean;
  variant?: 'default' | 'gradient';
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  className,
  showLabel = false,
  variant = 'gradient',
}) => {
  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Progresso
          </span>
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            {Math.round(clampedProgress)}%
          </span>
        </div>
      )}
      <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${clampedProgress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={cn(
            'h-full',
            variant === 'gradient'
              ? 'bg-gradient-to-r from-[#fe2c55] via-pink-500 to-[#fe2c55] bg-[length:200%_100%] animate-gradient'
              : 'bg-[#fe2c55]'
          )}
        />
      </div>
    </div>
  );
};
