import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Package, Image as ImageIcon, Ruler, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react';
import type { ProductVariationRecord } from '@/types/calculator';

interface ProductVariationsSectionProps {
  variations: ProductVariationRecord[];
  onSelectVariation?: (variation: ProductVariationRecord, index: number) => void;
}

export const ProductVariationsSection: React.FC<ProductVariationsSectionProps> = ({ 
  variations, 
  onSelectVariation
}) => {
  const [selectedVariation, setSelectedVariation] = useState<number>(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [imageIndexes, setImageIndexes] = useState<Record<number, number>>({});

  if (!variations || variations.length === 0) {
    return null;
  }

  const currentVariation = variations[selectedVariation];
  const currentImageIndex = imageIndexes[selectedVariation] || 0;

  // Obter array de imagens da variação (suporta imageUrls ou imageUrl único)
  const getVariationImages = (variation: ProductVariationRecord): string[] => {
    if (variation.imageUrls && variation.imageUrls.length > 0) {
      return variation.imageUrls;
    }
    if (variation.imageUrl) {
      return [variation.imageUrl];
    }
    return [];
  };

  const handlePrevImage = (variationIndex: number) => {
    const images = getVariationImages(variations[variationIndex]);
    setImageIndexes(prev => ({
      ...prev,
      [variationIndex]: ((prev[variationIndex] || 0) - 1 + images.length) % images.length
    }));
  };

  const handleNextImage = (variationIndex: number) => {
    const images = getVariationImages(variations[variationIndex]);
    setImageIndexes(prev => ({
      ...prev,
      [variationIndex]: ((prev[variationIndex] || 0) + 1) % images.length
    }));
  };

  const currentImages = getVariationImages(currentVariation);
  const hasMultipleImages = currentImages.length > 1;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Variações do Produto
          </h3>
          <Badge variant="secondary">
            {variations.length}
          </Badge>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-4 w-4" />
              Recolher
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4" />
              Expandir
            </>
          )}
        </button>
      </div>

      <Separator />

      {/* Grid de Miniaturas - 4 por linha */}
      <div className="grid grid-cols-4 gap-3">
        {variations.map((variation, index) => {
          const images = getVariationImages(variation);
          const currentImgIndex = imageIndexes[index] || 0;
          const currentImage = images[currentImgIndex];
          const hasMultiple = images.length > 1;

          return (
            <button
              key={variation.id || index}
              onClick={() => {
                setSelectedVariation(index);
                setIsExpanded(true);
                // Notificar o componente pai sobre a seleção
                if (onSelectVariation) {
                  onSelectVariation(variation, index);
                }
              }}
              className={`group relative overflow-hidden rounded-lg border-2 transition-all hover:shadow-md ${
                selectedVariation === index
                  ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800'
                  : 'border-gray-200 hover:border-blue-300 dark:border-zinc-700 dark:hover:border-blue-600'
              }`}
            >
              {/* Imagem da Variação */}
              <div className="aspect-square w-full bg-gray-100 dark:bg-zinc-800">
                {currentImage ? (
                  <img
                    src={currentImage}
                    alt={variation.name || `Variação ${index + 1}`}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const parent = e.currentTarget.parentElement;
                      if (parent) {
                        parent.innerHTML = `
                          <div class="flex h-full w-full items-center justify-center">
                            <svg class="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        `;
                      }
                    }}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <ImageIcon className="h-8 w-8 text-gray-400" />
                  </div>
                )}
              </div>

              {/* Controles de Navegação de Imagens */}
              {hasMultiple && (
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePrevImage(index);
                    }}
                    className="bg-black/60 hover:bg-black/80 text-white rounded-full p-1 transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNextImage(index);
                    }}
                    className="bg-black/60 hover:bg-black/80 text-white rounded-full p-1 transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* Indicador de múltiplas imagens */}
              {hasMultiple && (
                <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
                  {currentImgIndex + 1}/{images.length}
                </div>
              )}

              {/* Nome da Variação */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                <p className="text-xs font-medium text-white truncate">
                  {variation.name || `Variação ${index + 1}`}
                </p>
              </div>

              {/* Indicador de Seleção */}
              {selectedVariation === index && (
                <div className="absolute top-2 right-2">
                  <div className="h-3 w-3 rounded-full bg-blue-500 ring-2 ring-white" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Detalhes da Variação Selecionada */}
      {isExpanded && currentVariation && (
        <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <h4 className="font-semibold text-gray-900 dark:text-white">
                {currentVariation.name || `Variação ${selectedVariation + 1}`}
              </h4>
              <Badge variant="outline">
                {currentVariation.variationType === 'size' ? 'Tamanho' : 'Cor'}
              </Badge>
            </div>

            {/* Galeria de Imagens */}
            {hasMultipleImages && (
              <div className="rounded-md bg-white p-3 dark:bg-zinc-900">
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                  Imagens da Variação ({currentImageIndex + 1}/{currentImages.length})
                </div>
                <div className="relative">
                  <div className="aspect-video w-full bg-gray-100 dark:bg-zinc-800 rounded-md overflow-hidden">
                    {currentImages[currentImageIndex] ? (
                      <img
                        src={currentImages[currentImageIndex]}
                        alt={`${currentVariation.name} - Imagem ${currentImageIndex + 1}`}
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <ImageIcon className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                  </div>
                  {currentImages.length > 1 && (
                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-2">
                      <button
                        onClick={() => handlePrevImage(selectedVariation)}
                        className="bg-black/60 hover:bg-black/80 text-white rounded-full p-2 transition-colors"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleNextImage(selectedVariation)}
                        className="bg-black/60 hover:bg-black/80 text-white rounded-full p-2 transition-colors"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {/* SKU */}
              {currentVariation.sku && (
                <div className="rounded-md bg-white px-3 py-2 dark:bg-zinc-900">
                  <div className="text-xs text-gray-600 dark:text-gray-400">SKU</div>
                  <div className="font-mono text-sm font-medium text-gray-900 dark:text-white">
                    {currentVariation.sku}
                  </div>
                </div>
              )}

              {/* Custo */}
              {currentVariation.cost && (
                <div className="rounded-md bg-orange-50 px-3 py-2 dark:bg-orange-950/20">
                  <div className="text-xs text-orange-600 dark:text-orange-400">Custo</div>
                  <div className="text-sm font-semibold text-orange-900 dark:text-orange-300">
                    R$ {currentVariation.cost}
                  </div>
                </div>
              )}

              {/* Venda */}
              {(currentVariation.manualPrice || currentVariation.suggestedPrice) && (
                <div className="rounded-md bg-green-50 px-3 py-2 dark:bg-green-950/20">
                  <div className="text-xs text-green-600 dark:text-green-400">Venda</div>
                  <div className="text-sm font-semibold text-green-900 dark:text-green-300">
                    R$ {currentVariation.manualPrice || currentVariation.suggestedPrice}
                  </div>
                </div>
              )}
            </div>

            {/* Dimensões */}
            {(currentVariation.weight || currentVariation.width || currentVariation.height || currentVariation.depth) && (
              <div className="rounded-md bg-blue-50 px-3 py-2 dark:bg-blue-950/20">
                <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 mb-2">
                  <Ruler className="h-3.5 w-3.5" />
                  Dimensões
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs sm:grid-cols-4">
                  {currentVariation.weight && (
                    <div className="text-blue-900 dark:text-blue-300">
                      Peso: <span className="font-medium">{currentVariation.weight}kg</span>
                    </div>
                  )}
                  {currentVariation.width && (
                    <div className="text-blue-900 dark:text-blue-300">
                      Largura: <span className="font-medium">{currentVariation.width}cm</span>
                    </div>
                  )}
                  {currentVariation.height && (
                    <div className="text-blue-900 dark:text-blue-300">
                      Altura: <span className="font-medium">{currentVariation.height}cm</span>
                    </div>
                  )}
                  {currentVariation.depth && (
                    <div className="text-blue-900 dark:text-blue-300">
                      Profundidade: <span className="font-medium">{currentVariation.depth}cm</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
