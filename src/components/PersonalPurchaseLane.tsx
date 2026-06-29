import React, { useState, useRef, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, ShoppingBag, Package } from 'lucide-react';
import { FreeSampleCard } from './FreeSampleCard';
import { RegisterProductBeforeProcessModal } from './RegisterProductBeforeProcessModal';
import { supabase } from '@/lib/supabase';
import type { PendingOrder } from '@/types/pendingOrder';

interface PersonalPurchaseLaneProps {
  orders: PendingOrder[];
  organizationId: string;
  onOrderProcessed: (blingOrderId: string) => void;
  onDropOrder?: (order: PendingOrder) => void;
  onReturnOrder?: (order: PendingOrder) => void;
}

export const PersonalPurchaseLane: React.FC<PersonalPurchaseLaneProps> = ({
  orders,
  organizationId,
  onOrderProcessed,
  onDropOrder,
  onReturnOrder,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);
  const [registerOrder, setRegisterOrder] = useState<PendingOrder | null>(null);
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

  const doProcess = async (order: PendingOrder) => {
    if (processing) return;
    setProcessing(order.bling_order_id);
    try {
      await supabase
        .from('bling_orders')
        .update({ is_personal_purchase: true })
        .eq('id', order.bling_order_id);

      const { data, error } = await supabase.rpc('process_bling_order_to_profit', {
        p_bling_order_id: order.bling_order_id,
        p_user_id: null,
      });
      if (error) throw error;
      const result = data as { success: boolean; message?: string };
      if (result?.success) {
        onOrderProcessed(order.bling_order_id);
      } else {
        alert(`Erro ao processar: ${result?.message ?? 'Erro desconhecido'}`);
      }
    } catch (err) {
      alert(`Erro: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
    } finally {
      setProcessing(null);
    }
  };

  const handleProcess = async (order: PendingOrder) => {
    // Check if product needs registration before processing
    if (order.first_product_id) {
      const { data: prod } = await supabase
        .from('products')
        .select('cost_price, supplier_id')
        .eq('id', order.first_product_id)
        .single();
      const cp = Number((prod as { cost_price?: number | null } | null)?.cost_price ?? 0);
      const sid = (prod as { supplier_id?: string | null } | null)?.supplier_id;
      if (cp === 0 || !sid) {
        setRegisterOrder(order);
        return;
      }
    } else {
      setRegisterOrder(order);
      return;
    }
    await doProcess(order);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    try {
      const order = JSON.parse(e.dataTransfer.getData('application/json')) as PendingOrder;
      const source = e.dataTransfer.getData('text/source');
      if (order && onDropOrder) {
        onDropOrder(order);
        // Dispatch event for both pending and freesample sources so originating lane removes card
        if (source === 'pending' || source === 'freesample') {
          window.dispatchEvent(
            new CustomEvent('pending-order-dropped-to-personal-purchase', {
              detail: { blingOrderId: order.bling_order_id },
            })
          );
          // Also notify free sample lane to remove if dragged from there
          if (source === 'freesample') {
            window.dispatchEvent(
              new CustomEvent('pending-order-dropped-to-free-sample', {
                detail: { blingOrderId: order.bling_order_id },
              })
            );
          }
        }
      }
    } catch {
      // invalid drag data
    }
  };

  return (
    <>
      {organizationId && registerOrder && (
        <RegisterProductBeforeProcessModal
          open={true}
          order={registerOrder}
          organizationId={organizationId}
          onConfirm={() => {
            const o = registerOrder;
            setRegisterOrder(null);
            doProcess(o);
          }}
          onCancel={() => setRegisterOrder(null)}
        />
      )}
    <div
      className={`w-full rounded-xl transition-colors duration-200 ${
        isDragOver
          ? 'ring-2 ring-orange-400 ring-offset-2 bg-orange-50/50 dark:bg-orange-950/20'
          : ''
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-orange-500" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Compras pessoais — Jonatan &amp; Alyson
          </h2>
        </div>
        <Badge
          variant="secondary"
          className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border border-orange-200 dark:border-orange-800"
        >
          {orders.length} {orders.length === 1 ? 'pedido' : 'pedidos'}
        </Badge>
        {isDragOver && (
          <span className="text-xs text-orange-500 dark:text-orange-400 animate-pulse font-medium">
            Solte aqui para adicionar como compra pessoal
          </span>
        )}
      </div>

      {/* Empty state */}
      {orders.length === 0 ? (
        <Card
          className={`p-8 border-dashed transition-colors duration-200 ${
            isDragOver
              ? 'border-orange-400 bg-orange-100/50 dark:bg-orange-900/20'
              : 'border-orange-200 dark:border-orange-900/50 bg-orange-50/30 dark:bg-orange-950/10'
          }`}
        >
          <div className="flex flex-col items-center justify-center gap-3 text-center">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors duration-200 ${
                isDragOver
                  ? 'bg-orange-200 dark:bg-orange-800/50'
                  : 'bg-orange-100 dark:bg-orange-900/30'
              }`}
            >
              <Package className={`w-6 h-6 ${isDragOver ? 'text-orange-600' : 'text-orange-400'}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {isDragOver ? 'Solte o pedido aqui!' : 'Nenhuma compra pessoal na fila'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {isDragOver
                  ? 'O pedido será movido para compras pessoais.'
                  : 'Arraste um pedido de cima para cá para classificar como compra pessoal.'}
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <div className="relative">
          {showLeftArrow && (
            <button
              onClick={() => scroll('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-full p-2 shadow-lg border border-gray-200 dark:border-zinc-700 transition-all"
              aria-label="Rolar para esquerda"
            >
              <ChevronLeft className="w-6 h-6 text-gray-700 dark:text-gray-300" />
            </button>
          )}

          <div
            ref={scrollRef}
            onScroll={checkArrows}
            className="flex gap-4 overflow-x-auto pb-2 scroll-smooth"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {orders.map((order) => (
              <div key={order.bling_order_id} className="relative flex-shrink-0">
                <FreeSampleCard
                  order={order}
                  onProcess={() => handleProcess(order)}
                  isProcessing={processing === order.bling_order_id}
                  onReturnToPending={onReturnOrder ? () => onReturnOrder(order) : undefined}
                  processLabel="Processar Lucro"
                  processButtonClass="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700"
                  isPersonalPurchase={true}
                />
                {/* Override process button label via overlay not possible — handled inside FreeSampleCard */}
              </div>
            ))}
          </div>

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
