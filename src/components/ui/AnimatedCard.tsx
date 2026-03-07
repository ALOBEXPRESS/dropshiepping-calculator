import React from 'react';
import { cn } from '@/lib/utils';

export interface AnimatedCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  'data-product-id'?: string;
}

export const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  className,
  onClick,
  'data-product-id': dataProductId,
}) => {
  return (
    <div
      onClick={onClick}
      data-product-id={dataProductId}
      className={cn(
        'cursor-pointer transition-all duration-200 ease-out will-change-transform',
        'hover:scale-[1.02] hover:-translate-y-1',
        'hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_10px_10px_-5px_rgba(0,0,0,0.04)]',
        'active:scale-[0.98]',
        className
      )}
    >
      {children}
    </div>
  );
};
