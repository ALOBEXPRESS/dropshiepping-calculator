import { cn } from '@/lib/utils';

interface LoadingStateProps {
  variant?: 'card' | 'list' | 'text' | 'product';
  count?: number;
  className?: string;
}

export const LoadingState = ({ 
  variant = 'card', 
  count = 1,
  className 
}: LoadingStateProps) => {
  const variants = {
    card: (
      <div className="animate-pulse space-y-3 bg-white dark:bg-zinc-900 rounded-xl p-6 border border-gray-200 dark:border-zinc-800">
        <div className="bg-gray-200 dark:bg-zinc-800 h-48 rounded-lg" />
        <div className="bg-gray-200 dark:bg-zinc-800 h-4 w-3/4 rounded" />
        <div className="bg-gray-200 dark:bg-zinc-800 h-4 w-1/2 rounded" />
      </div>
    ),
    list: (
      <div className="animate-pulse space-y-2">
        <div className="bg-gray-200 dark:bg-zinc-800 h-12 rounded-lg" />
      </div>
    ),
    text: (
      <div className="animate-pulse space-y-2">
        <div className="bg-gray-200 dark:bg-zinc-800 h-4 w-full rounded" />
        <div className="bg-gray-200 dark:bg-zinc-800 h-4 w-5/6 rounded" />
      </div>
    ),
    product: (
      <div className="animate-pulse bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
        <div className="bg-white/20 h-40 rounded-lg mb-3" />
        <div className="space-y-2">
          <div className="bg-white/20 h-4 w-3/4 rounded" />
          <div className="bg-white/20 h-4 w-1/2 rounded" />
          <div className="bg-white/20 h-6 w-1/3 rounded mt-3" />
        </div>
      </div>
    ),
  };
  
  return (
    <div className={cn('space-y-4', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>{variants[variant]}</div>
      ))}
    </div>
  );
};

// Skeleton específico para cards de produtos na calculadora
export const ProductCardSkeleton = () => (
  <div className="animate-pulse bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
    {/* Imagem */}
    <div className="bg-white/20 h-40 rounded-lg mb-3" />
    
    {/* Nome do produto */}
    <div className="bg-white/20 h-4 w-3/4 rounded mb-2" />
    
    {/* SKU */}
    <div className="bg-white/20 h-3 w-1/2 rounded mb-3" />
    
    {/* Preço */}
    <div className="bg-white/20 h-6 w-1/3 rounded mb-2" />
    
    {/* Badges */}
    <div className="flex gap-2 mt-3">
      <div className="bg-white/20 h-5 w-16 rounded-full" />
      <div className="bg-white/20 h-5 w-20 rounded-full" />
    </div>
  </div>
);
