import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Package, Image as ImageIcon, Ruler, Box } from 'lucide-react';
import type { ProductVariationRecord } from '@/types/calculator';

interface ProductVariationsSectionProps {
  variations: ProductVariationRecord[];
}

export const ProductVariationsSection: React.FC<ProductVariationsSectionProps> = ({ variations }) => {
  if (!variations || variations.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Package className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Variações do Produto
        </h3>
        <Badge variant="secondary" className="ml-auto">
          {variations.length} {variations.length === 1 ? 'variação' : 'variações'}
        </Badge>
      </div>

      <Separator />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {variations.map((variation, index) => (
          <Card 
            key={variation.id || index} 
            className="group relative overflow-hidden border-gray-200 transition-all hover:shadow-lg hover:border-blue-300 dark:border-zinc-800 dark:hover:border-blue-700"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent opacity-0 transition-opacity group-hover:opacity-100 dark:from-blue-950/20" />
            
            <CardContent className="relative p-4 space-y-3">
              {/* Nome da Variação */}
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-semibold text-gray-900 dark:text-white line-clamp-2 flex-1">
                  {variation.name || `Variação ${index + 1}`}
                </h4>
                <Badge 
                  variant="outline" 
                  className="shrink-0 text-xs"
                >
                  {variation.variationType === 'size' ? 'Tamanho' : 'Cor'}
                </Badge>
              </div>

              {/* Imagem da Variação */}
              {variation.imageUrl && (
                <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-gray-100 dark:bg-zinc-800">
                  <img
                    src={variation.imageUrl}
                    alt={variation.name || 'Variação'}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.parentElement!.innerHTML = `
                        <div class="flex h-full w-full items-center justify-center">
                          <svg class="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      `;
                    }}
                  />
                </div>
              )}

              {!variation.imageUrl && (
                <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-gray-100 dark:bg-zinc-800">
                  <div className="flex h-full w-full items-center justify-center">
                    <ImageIcon className="h-12 w-12 text-gray-400" />
                  </div>
                </div>
              )}

              {/* Informações da Variação */}
              <div className="space-y-2 text-sm">
                {/* SKU */}
                {variation.sku && (
                  <div className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2 dark:bg-zinc-800/50">
                    <span className="text-gray-600 dark:text-gray-400">SKU</span>
                    <span className="font-mono font-medium text-gray-900 dark:text-white">
                      {variation.sku}
                    </span>
                  </div>
                )}

                {/* Estoque */}
                {variation.stockQuantity !== undefined && variation.stockQuantity !== null && (
                  <div className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2 dark:bg-zinc-800/50">
                    <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                      <Box className="h-3.5 w-3.5" />
                      Estoque
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {variation.stockQuantity}
                    </span>
                  </div>
                )}

                {/* Preços */}
                <div className="grid grid-cols-2 gap-2">
                  {variation.cost && (
                    <div className="rounded-md bg-orange-50 px-3 py-2 dark:bg-orange-950/20">
                      <div className="text-xs text-orange-600 dark:text-orange-400">Custo</div>
                      <div className="font-semibold text-orange-900 dark:text-orange-300">
                        R$ {variation.cost}
                      </div>
                    </div>
                  )}
                  
                  {(variation.manualPrice || variation.suggestedPrice) && (
                    <div className="rounded-md bg-green-50 px-3 py-2 dark:bg-green-950/20">
                      <div className="text-xs text-green-600 dark:text-green-400">Venda</div>
                      <div className="font-semibold text-green-900 dark:text-green-300">
                        R$ {variation.manualPrice || variation.suggestedPrice}
                      </div>
                    </div>
                  )}
                </div>

                {/* Dimensões (se disponíveis) */}
                {(variation.weight || variation.width || variation.height || variation.depth) && (
                  <div className="rounded-md bg-blue-50 px-3 py-2 dark:bg-blue-950/20">
                    <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 mb-1">
                      <Ruler className="h-3.5 w-3.5" />
                      Dimensões
                    </div>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
                      {variation.weight && (
                        <div className="text-blue-900 dark:text-blue-300">
                          Peso: <span className="font-medium">{variation.weight}kg</span>
                        </div>
                      )}
                      {variation.width && (
                        <div className="text-blue-900 dark:text-blue-300">
                          Largura: <span className="font-medium">{variation.width}cm</span>
                        </div>
                      )}
                      {variation.height && (
                        <div className="text-blue-900 dark:text-blue-300">
                          Altura: <span className="font-medium">{variation.height}cm</span>
                        </div>
                      )}
                      {variation.depth && (
                        <div className="text-blue-900 dark:text-blue-300">
                          Profundidade: <span className="font-medium">{variation.depth}cm</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
