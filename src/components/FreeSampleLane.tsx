import React, { useState, useRef, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Gift, Package } from 'lucide-react';
import { FreeSampleCard } from './FreeSampleCard';
import { ConfirmFreeSampleDialog } from './ConfirmFreeSampleDialog';
import { useFreeSampleLane } from '@/hooks/useFreeSampleLane';
import type { PendingOrder } from '@/types/pendingOrder';
import type { InfluencerOption } from '@/hooks/useFreeSampleLane';

interface FreeSampleLaneProps {
  orders: PendingOrder[];
  organizationId: string;
  onOrderProcessed: (blingOrderId: string) => void;
}

export const FreeSampleLane: React.FC<FreeSampleLaneProps> = ({
  orders,
  organizationId,
  onOrderProcessed,
}) => {
  const { processing, processFreeSample, getInfluencersForMarketplace } =
    useFreeSampleLane(organizationId, onOrderProcessed);

  const [dialogOrder, setDialogOrder] = useState<PendingOrder | null>(null);
  const [dialogInfluencers, setDialogInfluencers] = useState<InfluencerOption[]>([]);
  const [dialogInfluencersLoading, setDialogInfluencersLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const checkArrows = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setShowLeftArrow(el.scrollLeft > 0);
    setShowRightArrow(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  React.useEffect(() => {
    checkArrows();
  }, [orders, checkArrows]);

  const scroll = (dir: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === 'left' ? -280 : 280, behavior: 'smooth' });
    setTimeout(checkArrows, 350);
  };

  const handleProcess = async (order: PendingOrder) => {
    setDialogOrder(order);
    setDialogInfluencers([]);
    setDialogInfluencersLoading(true);
    const influencers = await getInfluencersForMarketplace(order.marketplace_id);
    setDialogInfluencers(influencers);
    setDialogInfluencersLoading(false);
  };

  const handleInfluencerCreated = (influencer: InfluencerOption) => {
    setDialogInfluencers((prev) => {
      // Avoid duplicates
      if (prev.some((i) => i.id === influencer.id)) return prev;
      return [...prev, influencer];
    });
  };

  const handleConfirm = async (influencerId: string | null) => {
    if (!dialogOrder) return;
    setDialogOrder(null);
    await processFreeSample(dialogOrder, influencerId);
  };

  const handleCancel = () => {
    setDialogOrder(null);
  };

  return (
    <>
      <ConfirmFreeSampleDialog
        open={dialogOrder !== null}
        order={dialogOrder}
        organizationId={organizationId}
        influencers={dialogInfluencers}
        influencersLoading={dialogInfluencersLoading}
        isProcessing={dialogOrder ? processing === dialogOrder.bling_order_id : false}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        onInfluencerCreated={handleInfluencerCreated}
      />

      <div className="w-full">
        {/* Section header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-violet-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Amostras Grátis — Influenciadores
            </h2>
          </div>
          <Badge
            variant="secondary"
            className="bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 border border-violet-200 dark:border-violet-800"
          >
            {orders.length} {orders.length === 1 ? 'pedido' : 'pedidos'}
          </Badge>
        </div>

        {/* Empty state */}
        {orders.length === 0 ? (
          <Card className="p-8 border-dashed border-violet-200 dark:border-violet-900/50 bg-violet-50/30 dark:bg-violet-950/10">
            <div className="flex flex-col items-center justify-center gap-3 text-center">
              <div className="w-12 h-12 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                <Package className="w-6 h-6 text-violet-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Nenhum pedido na fila de amostras grátis
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Clique em "ENVIAR AMOSTRA GRÁTIS" em um pedido acima para movê-lo para cá.
                </p>
              </div>
            </div>
          </Card>
        ) : (
          /* Carousel */
          <div className="relative">
            {/* Left arrow */}
            {showLeftArrow && (
              <button
                onClick={() => scroll('left')}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-full p-2 shadow-lg border border-gray-200 dark:border-zinc-700 transition-all"
                aria-label="Rolar para esquerda"
              >
                <ChevronLeft className="w-6 h-6 text-gray-700 dark:text-gray-300" />
              </button>
            )}

            {/* Cards scroll container */}
            <div
              ref={scrollRef}
              onScroll={checkArrows}
              className="flex gap-4 overflow-x-auto pb-2 scroll-smooth"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {orders.map((order) => (
                <FreeSampleCard
                  key={order.bling_order_id}
                  order={order}
                  onProcess={() => handleProcess(order)}
                  isProcessing={processing === order.bling_order_id}
                />
              ))}
            </div>

            {/* Right arrow */}
            {showRightArrow && (
              <button
                onClick={() => scroll('right')}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-full p-2 shadow-lg border border-gray-200 dark:border-zinc-700 transition-all"
                aria-label="Rolar para direita"
              >
                <ChevronRight className="w-6 h-6 text-gray-700 dark:text-gray-300" />
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
};
