import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/utils/currency';
import type { BlingProductItem } from '@/hooks/useProductsBling';
import blingLogo from '@/imgs/bling.svg';
import alobExpressLogo from '@/imgs/Logo 2.png';
import yeiziDropLogo from '@/imgs/yeizidrop.png';

type ProductCardProps = {
  product: BlingProductItem;
  variations?: BlingProductItem[];
  onFill: (product: BlingProductItem, variations: BlingProductItem[]) => void;
  onUpdate?: (product: BlingProductItem, variations: BlingProductItem[]) => void;
  isRegistered?: boolean;
};

export const ProductCard = ({
  product,
  variations = [],
  onFill,
  onUpdate,
  isRegistered = false
}: ProductCardProps) => {
  const parseVariationInfo = (value?: string | null) => {
    const raw = (value ?? '').trim();
    if (!raw) {
      return { color: '', size: '', raw: '' };
    }
    const parts = raw.split(';').map((part) => part.trim()).filter(Boolean);
    let color = '';
    let size = '';
    parts.forEach((part) => {
      const lower = part.toLowerCase();
      if (lower.startsWith('cor')) {
        const parsed = part.split(':').slice(1).join(':').trim();
        color = parsed || part.replace(/cor/i, '').trim();
      }
      if (lower.startsWith('tamanho')) {
        const parsed = part.split(':').slice(1).join(':').trim();
        size = parsed || part.replace(/tamanho/i, '').trim();
      }
    });
    return { color, size, raw };
  };
  const slides = useMemo(() => [product, ...variations], [product, variations]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [isHovering, setIsHovering] = useState(false);
  const [badgeErrors, setBadgeErrors] = useState<Record<string, boolean>>({});

  const isValidImageUrl = (value?: string | null) => {
    const normalized = (value ?? '').trim();
    if (!normalized) return false;
    const lower = normalized.toLowerCase();
    if (lower === '[]' || lower === 'null' || lower === 'undefined') return false;
    if (lower.includes('undefined')) return false;
    if (imageErrors[normalized]) return false;
    return true;
  };
  const pickImage = (candidates: Array<string | null | undefined>) => {
    return candidates.find((candidate) => isValidImageUrl(candidate)) || '';
  };

  const currentProduct = slides[Math.min(currentIndex, slides.length - 1)];
  const showNavigation = slides.length > 1;
  const variationInfo = parseVariationInfo(currentProduct.variationName || '');
  const variationLabel = variationInfo.size || variationInfo.color
    ? `${variationInfo.size ? `Tamanho: ${variationInfo.size}` : ''}${variationInfo.size && variationInfo.color ? ' • ' : ''}${variationInfo.color ? `Cor: ${variationInfo.color}` : ''}`
    : (currentProduct.variationName || '');
  const salePriceText = `R$ ${formatCurrency(currentProduct.salePrice ?? '')}`;
  const costPriceText = `R$ ${formatCurrency(currentProduct.costPrice ?? '')}`;
  const stockText = String(currentProduct.stockQuantity ?? '-');
  const skuText = currentProduct.sku || '-';
  const displayName = product.name || currentProduct.name || 'Produto sem nome';
  const displayImage = pickImage(
    currentIndex > 0
      ? [currentProduct.imageUrl, product.imageUrl, ...variations.map((variation) => variation.imageUrl)]
      : [product.imageUrl, currentProduct.imageUrl, ...variations.map((variation) => variation.imageUrl)]
  );
  const hasValidImage = isValidImageUrl(displayImage);
  
  // Botão verde se não estiver cadastrado, ciano se já estiver cadastrado
  const shouldShowFillLabel = !isRegistered || isHovering;
  const isButtonActive = shouldShowFillLabel; // Verde quando não cadastrado, ciano quando cadastrado
  
  const resolvedDescription = currentProduct.description || product.description || '';
  const filledProduct = currentProduct.description
    ? currentProduct
    : { ...currentProduct, description: resolvedDescription };

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
      <div className="relative">
        <div className="aspect-[4/3] w-full bg-gray-100 relative group dark:bg-zinc-800">
          {hasValidImage ? (
            <img
              src={displayImage}
              alt={displayName || 'Produto Bling'}
              className="h-full w-full object-cover"
              onError={() => setImageErrors((prev) => ({ ...prev, [displayImage]: true }))}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-gray-400 dark:text-zinc-400">
              Sem imagem
            </div>
          )}
          {showNavigation && (
            <>
              <button
                type="button"
                aria-label="Variação anterior"
                className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-1 text-gray-700 shadow-sm transition-opacity dark:bg-zinc-900/90 dark:text-zinc-200"
                onClick={() => setCurrentIndex((index) => (index - 1 + slides.length) % slides.length)}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Próxima variação"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-1 text-gray-700 shadow-sm transition-opacity dark:bg-zinc-900/90 dark:text-zinc-200"
                onClick={() => setCurrentIndex((index) => (index + 1) % slides.length)}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
        <div className="absolute left-3 top-3">
          <div className="rounded-full bg-white/90 px-2 py-1 shadow-sm dark:bg-zinc-900/90">
            {badgeErrors.bling ? (
              <span className="text-[10px] font-semibold text-gray-700 dark:text-zinc-200">Bling</span>
            ) : (
              <img
                src={blingLogo}
                alt="Bling"
                className="h-4 w-auto"
                onError={() => setBadgeErrors((prev) => ({ ...prev, bling: true }))}
              />
            )}
          </div>
        </div>
        {currentProduct.supplierSku === 'ALOBEXPRESS_01' ? (
          <div className="absolute right-3 top-3 rounded-full bg-white/90 px-2 py-1 shadow-sm dark:bg-zinc-900/90">
            {badgeErrors.ALOBEXPRESS_01 ? (
              <span className="text-[10px] font-semibold text-gray-700 dark:text-zinc-200">ALOBEXPRESS</span>
            ) : (
              <img
                src={alobExpressLogo}
                alt="ALOBEXPRESS"
                className="h-5 w-auto"
                onError={() => setBadgeErrors((prev) => ({ ...prev, ALOBEXPRESS_01: true }))}
              />
            )}
          </div>
        ) : null}
        {currentProduct.supplierSku === 'ALOBFOR_DROP_01' ? (
          <div className="absolute right-3 top-3 rounded-full bg-white/90 px-2 py-1 shadow-sm dark:bg-zinc-900/90">
            {badgeErrors.ALOBFOR_DROP_01 ? (
              <span className="text-[10px] font-semibold text-gray-700 dark:text-zinc-200">Tyr</span>
            ) : (
              <img
                src={yeiziDropLogo}
                alt="Tyr"
                className="h-5 w-auto"
                onError={() => setBadgeErrors((prev) => ({ ...prev, ALOBFOR_DROP_01: true }))}
              />
            )}
          </div>
        ) : null}
      </div>
      <div className="p-3">
        <div className="flex items-start justify-between gap-3">
          <h3 className="min-h-[40px] line-clamp-2 text-sm font-semibold text-gray-900 dark:text-zinc-100">
            {displayName}
          </h3>
        </div>
        {variationLabel ? (
          <p className="mt-1 text-xs font-medium text-gray-600 dark:text-zinc-300">
            {variationLabel}
          </p>
        ) : null}

        <div className="mt-3 grid min-w-0 grid-cols-2 gap-2 text-xs">
          <div className="min-w-0 rounded-lg border border-gray-100 bg-gray-50 p-2 dark:border-zinc-800 dark:bg-zinc-800/60">
            <p className="text-[10px] uppercase text-gray-500 dark:text-zinc-400">Preço</p>
            <p className="truncate text-xs font-semibold text-gray-900 dark:text-zinc-100" title={salePriceText}>
              {salePriceText}
            </p>
          </div>
          <div className="min-w-0 rounded-lg border border-gray-100 bg-gray-50 p-2 dark:border-zinc-800 dark:bg-zinc-800/60">
            <p className="text-[10px] uppercase text-gray-500 dark:text-zinc-400">Custo</p>
            <p className="truncate text-xs font-semibold text-gray-900 dark:text-zinc-100" title={costPriceText}>
              {costPriceText}
            </p>
          </div>
          <div className="min-w-0 rounded-lg border border-gray-100 bg-gray-50 p-2 dark:border-zinc-800 dark:bg-zinc-800/60">
            <p className="text-[10px] uppercase text-gray-500 dark:text-zinc-400">Vendas</p>
            <p className="truncate text-xs font-semibold text-emerald-600 dark:text-emerald-400" title={String(currentProduct.salesCount)}>
              {currentProduct.salesCount}
            </p>
          </div>
          <div className="min-w-0 rounded-lg border border-gray-100 bg-gray-50 p-2 dark:border-zinc-800 dark:bg-zinc-800/60">
            <p className="text-[10px] uppercase text-gray-500 dark:text-zinc-400">Estoque</p>
            <p className="truncate text-xs font-semibold text-gray-900 dark:text-zinc-100" title={stockText}>
              {stockText}
            </p>
          </div>
          <div className="min-w-0 col-span-2 rounded-lg border border-gray-100 bg-gray-50 p-2 dark:border-zinc-800 dark:bg-zinc-800/60 flex flex-col items-center text-center">
            <p className="text-[10px] uppercase text-gray-500 dark:text-zinc-400">SKU</p>
            <p className="truncate text-xs font-semibold text-gray-900 dark:text-zinc-100" title={skuText}>
              {skuText}
            </p>
          </div>
        </div>

        <div className="mt-3 flex flex-col gap-2">
          <Button
            type="button"
            className={isButtonActive
              ? "h-9 bg-[#16A34A] px-4 text-xs font-semibold text-white hover:bg-[#15803D]"
              : "h-9 bg-[#25f4ee] px-4 text-xs font-semibold text-gray-900 hover:bg-emerald-100 hover:text-emerald-700"}
            onClick={() => onFill(filledProduct, variations)}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
            {shouldShowFillLabel ? 'Preencher' : 'Cadastrado'}
          </Button>
          {isRegistered && onUpdate && (
            <Button
              type="button"
              variant="outline"
              className="h-9 border-[#ff4b26] bg-[#ff4b26] px-4 text-xs font-semibold text-white hover:bg-[#e63d1a] dark:border-[#ff4b26] dark:bg-[#ff4b26] dark:text-white dark:hover:bg-[#e63d1a]"
              onClick={() => onUpdate(filledProduct, variations)}
            >
              Atualizar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
