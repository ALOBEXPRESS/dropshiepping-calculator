import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Package, Gift } from 'lucide-react';
import type { PendingOrder } from '@/types/pendingOrder';

// Marketplace icons (same as PendingOrders)
import mercadoLivreIcon from '@/imgs/mercadolivre.svg';
import shopeeIcon from '@/imgs/18790-256x256x32.png';
import tiktokIcon from '@/imgs/tiktok-shop-seller-cent-icon-filled-256.png';
import olxIcon from '@/imgs/olx.png';
import amazonIcon from '@/imgs/amazon.jpg';
import woocommerceIcon from '@/imgs/free-woocommerce-icon-svg-download-png-226060.webp';

const MARKETPLACE_ICONS: Record<string, string> = {
  'Mercado Livre': mercadoLivreIcon,
  'MercadoLivre': mercadoLivreIcon,
  'Shopee': shopeeIcon,
  'TikTok Shop': tiktokIcon,
  'TikTok': tiktokIcon,
  'Facebook': '',
  'Site': woocommerceIcon,
  'OLX': olxIcon,
  'Amazon': amazonIcon,
};

const getMarketplaceIcon = (name: string) => MARKETPLACE_ICONS[name] || '';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const formatDate = (dateStr: string) => {
  try {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    });
  } catch {
    return dateStr;
  }
};

interface FreeSampleCardProps {
  order: PendingOrder;
  onProcess: () => void;
  isProcessing: boolean;
}

export const FreeSampleCard: React.FC<FreeSampleCardProps> = ({
  order,
  onProcess,
  isProcessing,
}) => {
  const icon = getMarketplaceIcon(order.marketplace_name);

  return (
    <Card className="flex-shrink-0 w-64 p-4 flex flex-col border-violet-200 dark:border-violet-900/50 bg-white dark:bg-zinc-900 shadow-sm hover:shadow-md transition-shadow">
      {/* Product image area — reduced height */}
      <div className="relative w-full h-32 rounded-lg overflow-hidden bg-gray-100 dark:bg-zinc-800 mb-3">
        {order.first_product_image ? (
          <img
            src={order.first_product_image}
            alt={order.first_product_name ?? 'Produto'}
            className="w-full h-full object-cover"
            onError={(e) => {
              const el = e.target as HTMLImageElement;
              el.style.display = 'none';
              if (el.parentElement) {
                el.parentElement.innerHTML = `
                  <div class="w-full h-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-10 h-10 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                    </svg>
                  </div>`;
              }
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-10 h-10 text-gray-300 dark:text-gray-600" strokeWidth={1.5} />
          </div>
        )}

        {/* Marketplace badge */}
        <div className="absolute top-2 right-2 bg-white dark:bg-zinc-900 backdrop-blur-sm px-2 py-1.5 rounded-lg shadow border border-gray-200 dark:border-zinc-700">
          {icon ? (
            <img
              src={icon}
              alt={order.marketplace_name}
              className="h-5 w-auto object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent) {
                  parent.innerHTML = `<span class="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wide px-1">${order.marketplace_name}</span>`;
                }
              }}
            />
          ) : (
            <span className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wide px-1">
              {order.marketplace_name}
            </span>
          )}
        </div>

        {/* Free sample badge */}
        <div className="absolute top-2 left-2 bg-violet-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
          <Gift className="w-3 h-3" />
          Amostra
        </div>
      </div>

      {/* Order info */}
      <div className="space-y-2 mb-4 flex-1">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            Pedido #{order.order_number}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {formatDate(order.order_date)}
          </span>
        </div>

        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
            {order.customer_name}
          </p>
          {order.first_product_name && (
            <p className="text-xs text-gray-500 dark:text-gray-500 truncate mt-0.5">
              {order.first_product_name}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-zinc-700">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Valor Total</p>
            <p className="text-base font-bold text-gray-900 dark:text-white">
              {formatCurrency(order.total_amount)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 dark:text-gray-400">Itens</p>
            <p className="text-base font-bold text-gray-900 dark:text-white">
              {order.items_count}
            </p>
          </div>
        </div>

        {/* Zero profit indicator */}
        <div className="text-xs text-violet-600 dark:text-violet-400 font-medium flex items-center gap-1">
          <Gift className="w-3 h-3" />
          Lucro: R$ 0,00 (amostra grátis)
        </div>
      </div>

      {/* Action button — violet accent, no "ENVIAR AMOSTRA GRÁTIS" */}
      <Button
        onClick={onProcess}
        disabled={isProcessing}
        className="w-full bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white font-bold"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Processando...
          </>
        ) : (
          <>
            <Gift className="w-4 h-4 mr-2" />
            PROCESSAR AMOSTRA GRÁTIS
          </>
        )}
      </Button>
    </Card>
  );
};
