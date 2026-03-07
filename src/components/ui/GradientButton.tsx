import React, { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GradientButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  loading?: boolean;
  icon?: React.ReactNode;
}

export const GradientButton = forwardRef<HTMLButtonElement, GradientButtonProps>(
  ({ children, variant = 'primary', loading, icon, className, disabled, ...props }, ref) => {
    const variants = {
      primary: `
        relative overflow-hidden
        bg-gradient-to-r from-[#fe2c55] to-pink-500
        text-white
        hover:shadow-lg hover:shadow-[#fe2c55]/50
        before:absolute before:inset-0
        before:bg-gradient-to-r before:from-transparent before:via-white/30 before:to-transparent
        before:translate-x-[-200%]
        hover:before:translate-x-[200%]
        before:transition-transform before:duration-700
      `,
      secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700',
      outline: 'border-2 border-[#fe2c55] text-[#fe2c55] hover:bg-[#fe2c55]/10 dark:border-pink-500 dark:text-pink-500',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'min-h-[44px] px-6 py-3 rounded-lg',
          'font-semibold',
          'transition-all duration-300',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'flex items-center justify-center gap-2',
          variants[variant],
          className
        )}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Carregando...
          </>
        ) : (
          <>
            {icon}
            {children}
          </>
        )}
      </button>
    );
  }
);

GradientButton.displayName = 'GradientButton';
