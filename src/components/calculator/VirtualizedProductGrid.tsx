import React, { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ProductCard } from './ProductCard';
import type { ProductItem } from '../../types/calculator';

interface VirtualizedProductGridProps {
  products: ProductItem[];
  onDelete: (id: string) => void;
  onEdit: (product: ProductItem) => void;
  onDuplicate: (product: ProductItem) => void;
  onInvestSave: (product: ProductItem) => void;
}

export const VirtualizedProductGrid: React.FC<VirtualizedProductGridProps> = ({
  products,
  onDelete,
  onEdit,
  onDuplicate,
  onInvestSave,
}) => {
  const parentRef = useRef<HTMLDivElement>(null);

  // Organizar produtos em pares para o grid de 2 colunas
  const productPairs: ProductItem[][] = [];
  for (let i = 0; i < products.length; i += 2) {
    productPairs.push(products.slice(i, i + 2));
  }

  const virtualizer = useVirtualizer({
    count: productPairs.length,
    getScrollElement: () => window.document.documentElement,
    estimateSize: () => 750, // Altura otimizada para melhor espaçamento
    overscan: 3, // Renderizar 3 linhas extras acima e abaixo
  });

  return (
    <div ref={parentRef}>
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const rowProducts = productPairs[virtualRow.index];
          
          return (
            <div
              key={virtualRow.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                minHeight: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <div className="grid gap-4 md:grid-cols-2">
                {rowProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onDelete={onDelete}
                    onEdit={onEdit}
                    onDuplicate={onDuplicate}
                    onInvestSave={onInvestSave}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
