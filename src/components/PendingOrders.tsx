import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useSettings } from '@/contexts/SettingsContext';
import { Loader2, CheckCircle, AlertCircle, Package, ChevronLeft, ChevronRight, Trash2, GripVertical, FileText } from 'lucide-react';
import { ProcessOrderModal } from './ProcessOrderModal';
import { NFeUploadModal } from './NFeUploadModal';
import { ProductInfoModal } from './ProductInfoModal';
import { useAutoGenderClassification } from '@/hooks/useAutoGenderClassification';
import type { PendingOrder } from '@/types/pendingOrder';

// Importar ícones dos marketplaces
import mercadoLivreIcon from '@/imgs/mercadolivre.svg';
import shopeeIcon from '@/imgs/18790-256x256x32.png';
import tiktokIcon from '@/imgs/tiktok-shop-seller-cent-icon-filled-256.png';
import olxIcon from '@/imgs/olx.png';
import amazonIcon from '@/imgs/amazon.jpg';
import woocommerceIcon from '@/imgs/free-woocommerce-icon-svg-download-png-226060.webp';

// Mapeamento de ícones dos marketplaces
const MARKETPLACE_ICONS: Record<string, string> = {
  'Mercado Livre': mercadoLivreIcon,
  'MercadoLivre': mercadoLivreIcon,
  'Shopee': shopeeIcon,
  'TikTok Shop': tiktokIcon,
  'TikTok': tiktokIcon,
  'Facebook': '', // Sem ícone específico
  'Site': woocommerceIcon,
  'OLX': olxIcon,
  'Amazon': amazonIcon,
};

const getMarketplaceIcon = (marketplaceName: string) => {
  return MARKETPLACE_ICONS[marketplaceName] || '';
};

interface ProcessResult {
  success: boolean;
  message: string;
  order_id?: string;
  total_profit?: number;
  profit_margin?: number;
  order_number?: string;
  lead_needs_classification?: boolean;
  lead_id?: string;
  lead_name?: string;
}

interface PendingOrdersProps {
  onOrderProcessed?: () => void;
  onMoveToFreeSample?: (order: PendingOrder) => void;
  onReturnFromFreeSample?: (order: PendingOrder) => void;
  excludeOrderIds?: string[]; // IDs already in other lanes (free sample, personal purchase)
}

export const PendingOrders: React.FC<PendingOrdersProps> = ({ onOrderProcessed, onReturnFromFreeSample, excludeOrderIds = [] }) => {
  const { organizationId } = useSettings();
  const { handlePostOrderProcessing } = useAutoGenderClassification();
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>(() => {
    // Inicializar com cache do sessionStorage para evitar flash de loading ao voltar para a página
    try {
      const cached = sessionStorage.getItem('pendingOrders_cache');
      return cached ? (JSON.parse(cached) as PendingOrder[]) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(() => {
    // Só mostrar loading se não tiver cache
    try {
      return !sessionStorage.getItem('pendingOrders_cache');
    } catch {
      return true;
    }
  });
  const [processing, setProcessing] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processResult, setProcessResult] = useState<ProcessResult | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [nfeModalOpen, setNfeModalOpen] = useState(false);
  const [productInfoId, setProductInfoId] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const droppedSuccessfullyRef = useRef<string | null>(null); // tracks bling_order_id dropped to free sample

  // Listen for successful drop to free sample lane (fired by FreeSampleLane)
  useEffect(() => {
    const handlerFree = (e: Event) => {
      const ev = e as CustomEvent<{ blingOrderId: string }>;
      droppedSuccessfullyRef.current = ev.detail.blingOrderId;
    };
    const handlerPersonal = (e: Event) => {
      const ev = e as CustomEvent<{ blingOrderId: string }>;
      droppedSuccessfullyRef.current = ev.detail.blingOrderId;
    };
    window.addEventListener('pending-order-dropped-to-free-sample', handlerFree);
    window.addEventListener('pending-order-dropped-to-personal-purchase', handlerPersonal);
    return () => {
      window.removeEventListener('pending-order-dropped-to-free-sample', handlerFree);
      window.removeEventListener('pending-order-dropped-to-personal-purchase', handlerPersonal);
    };
  }, []);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  useEffect(() => {
    if (organizationId) {
      // Se já tem cache, faz refresh silencioso (sem mostrar loading)
      const hasCached = (() => { try { return !!sessionStorage.getItem('pendingOrders_cache'); } catch { return false; } })();
      loadPendingOrders(hasCached);
    }
  }, [organizationId]);

  useEffect(() => {
    checkScrollButtons();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollButtons, { passive: true });
      window.addEventListener('resize', checkScrollButtons);
      return () => {
        container.removeEventListener('scroll', checkScrollButtons);
        window.removeEventListener('resize', checkScrollButtons);
      };
    }
  }, [pendingOrders]);

  const checkScrollButtons = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    setShowLeftArrow(scrollLeft > 0);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
  };

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollAmount = 400; // Largura aproximada de um card
    const newScrollLeft = direction === 'left' 
      ? container.scrollLeft - scrollAmount 
      : container.scrollLeft + scrollAmount;

    container.scrollTo({
      left: newScrollLeft,
      behavior: 'smooth'
    });
  };

  const loadPendingOrders = async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      // Re-match unlinked items to products (handles case where product was registered after NF import)
      await supabase.rpc('rematch_bling_order_items_products', { p_organization_id: organizationId });

      const { data, error: fetchError } = await supabase
        .from('pending_orders_to_process')
        .select('*')
        .order('order_date', { ascending: false });

      if (fetchError) throw fetchError;
      const orders = data || [];
      setPendingOrders(orders);
      // Salvar no cache para próxima visita
      try {
        sessionStorage.setItem('pendingOrders_cache', JSON.stringify(orders));
      } catch { /* ignore */ }
    } catch (err) {
      console.error('Error loading pending orders:', err);
      if (!silent) setError('Erro ao carregar vendas pendentes');
    } finally {
      setLoading(false);
    }
  };

  const processOrder = async (blingOrderId: string) => {
    setProcessing(blingOrderId);
    setError(null);

    try {
      console.log('🔄 Processando pedido:', blingOrderId);
      console.log('🔄 Tipo do blingOrderId:', typeof blingOrderId);
      console.log('🔄 blingOrderId é válido?', blingOrderId && blingOrderId.length > 0);
      
      // Chamar a function do Supabase para processar o pedido
      const { data, error: processError } = await supabase.rpc(
        'process_bling_order_to_profit',
        {
          p_bling_order_id: blingOrderId,
          p_user_id: null,
        }
      );

      console.log('📦 Resposta da RPC:');
      console.log('  - data:', data);
      console.log('  - error:', processError);

      if (processError) {
        console.error('❌ Erro na RPC:', processError);
        throw processError;
      }

      if (!data) {
        console.error('❌ Resposta vazia da RPC');
        throw new Error('Resposta vazia do servidor');
      }

      const result = data as ProcessResult;
      console.log('✅ Resultado processado:', result);
      console.log('  - success:', result.success);
      console.log('  - message:', result.message);

      if (result.success) {
        console.log('🎉 Pedido processado com sucesso!');
        
        // Classificar gênero automaticamente se necessário
        await handlePostOrderProcessing(result);
        
        // Remover o pedido da lista
        setPendingOrders((prev) =>
          prev.filter((order) => order.bling_order_id !== blingOrderId)
        );

        // Mostrar modal de sucesso
        setProcessResult(result);
        setShowModal(true);

        // Notificar componente pai ANTES de recarregar
        console.log('📢 Notificando componente pai...');
        if (onOrderProcessed) {
          console.log('✅ Callback onOrderProcessed existe, chamando...');
          onOrderProcessed();
        } else {
          console.warn('⚠️ Callback onOrderProcessed não foi fornecido!');
        }

        // Recarregar dados após notificar
        await loadPendingOrders();
      } else {
        console.error('❌ Falha no processamento:', result.message);
        throw new Error(result.message || 'Erro desconhecido ao processar pedido');
      }
    } catch (err) {
      console.error('❌ Erro capturado:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao processar pedido';
      setError(errorMessage);
      
      // Mostrar detalhes do erro
      alert(`❌ Erro ao processar pedido:\n\n${errorMessage}`);
    } finally {
      setProcessing(null);
    }
  };

  const deleteOrder = async (blingOrderId: string, orderNumber: number) => {
    if (!confirm(`Tem certeza que deseja excluir o Pedido #${orderNumber}? Esta ação não pode ser desfeita.`)) return;

    setDeleting(blingOrderId);
    setError(null);
    try {
      const { error: deleteError } = await supabase
        .from('bling_orders')
        .delete()
        .eq('id', blingOrderId);

      if (deleteError) throw deleteError;

      setPendingOrders((prev) => {
        const updated = prev.filter((o) => o.bling_order_id !== blingOrderId);
        try { sessionStorage.setItem('pendingOrders_cache', JSON.stringify(updated)); } catch { /* ignore */ }
        return updated;
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao excluir pedido';
      setError(msg);
    } finally {
      setDeleting(null);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(dateString));
  };

  if (loading) {
    return (
      <Card className="p-6 border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="flex flex-col items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Carregando vendas pendentes...</p>
        </div>
      </Card>
    );
  }

  const visibleOrders = pendingOrders.filter(o => !excludeOrderIds.includes(o.bling_order_id));

  if (visibleOrders.length === 0 && pendingOrders.length === 0) {
    return (
      <Card className="p-6 border-green-200 dark:border-green-900/50 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-zinc-900 dark:to-zinc-800">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Tudo processado!
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md">
            Não há vendas pendentes no momento. Todas as vendas do Bling foram processadas com sucesso.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <>
      <ProcessOrderModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        result={processResult}
      />
      
      <NFeUploadModal
        open={nfeModalOpen}
        onClose={() => setNfeModalOpen(false)}
        onSuccess={() => loadPendingOrders(false)}
      />
      <ProductInfoModal
        productId={productInfoId}
        onClose={() => setProductInfoId(null)}
      />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Vendas a Processar
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {visibleOrders.length} {visibleOrders.length === 1 ? 'venda pendente' : 'vendas pendentes'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setNfeModalOpen(true)}
            variant="outline"
            size="sm"
            className="border-emerald-600 text-emerald-400 hover:bg-emerald-950/40 hover:border-emerald-400"
          >
            <FileText className="w-3.5 h-3.5 mr-1.5" />
            Carregar NF
          </Button>
          <Button
            onClick={() => loadPendingOrders(false)}
            variant="outline"
            size="sm"
            disabled={loading}
          >
            Atualizar
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg shadow-sm">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800 dark:text-red-300 mb-1">Erro ao carregar</p>
            <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
          </div>
        </div>
      )}

      {/* Container do carrossel com setas */}
      <div
        className={`relative rounded-xl transition-colors duration-200 ${
          isDragOver
            ? 'ring-2 ring-green-400 ring-offset-2 bg-green-50/30 dark:bg-green-950/10'
            : ''
        }`}
        onDragOver={(e) => {
          // Only accept drops from the free sample lane
          if (e.dataTransfer.types.includes('text/source') || e.dataTransfer.types.includes('application/json')) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            setIsDragOver(true);
          }
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setIsDragOver(false);
          }
        }}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          const source = e.dataTransfer.getData('text/source');
          // Only accept drops from free sample lane
          if (source !== 'freesample') return;
          try {
            const order = JSON.parse(e.dataTransfer.getData('application/json')) as PendingOrder;
            if (order && onReturnFromFreeSample) {
              onReturnFromFreeSample(order);
              // Add back to local state (optimistic)
              setPendingOrders((prev) => {
                if (prev.some((o) => o.bling_order_id === order.bling_order_id)) return prev;
                return [order, ...prev];
              });
            }
          } catch {
            // Invalid drag data
          }
        }}
      >
        {/* Seta Esquerda */}
        {showLeftArrow && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-full p-2 shadow-lg border border-gray-200 dark:border-zinc-700 transition-all"
            aria-label="Rolar para esquerda"
          >
            <ChevronLeft className="w-6 h-6 text-gray-700 dark:text-gray-300" />
          </button>
        )}

        {/* Container de scroll horizontal */}
        <div
          ref={scrollContainerRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-2"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
          }}
        >
        {visibleOrders.filter(o => !excludeOrderIds.includes(o.bling_order_id)).map((order) => (
          <Card
            key={order.bling_order_id}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('application/json', JSON.stringify(order));
              e.dataTransfer.setData('text/source', 'pending');
              e.dataTransfer.effectAllowed = 'move';

              // Custom drag image — small pill instead of the full card
              const ghost = document.createElement('div');
              ghost.style.cssText = `
                position: fixed; top: -9999px; left: -9999px;
                background: linear-gradient(135deg, #22c55e, #16a34a);
                color: white; font-size: 12px; font-weight: 700;
                padding: 8px 14px; border-radius: 999px;
                box-shadow: 0 4px 16px rgba(34,197,94,0.4);
                white-space: nowrap; pointer-events: none;
                display: flex; align-items: center; gap: 6px;
              `;
              ghost.textContent = `📦 Pedido #${order.order_number}`;
              document.body.appendChild(ghost);
              e.dataTransfer.setDragImage(ghost, ghost.offsetWidth / 2, 20);
              setTimeout(() => document.body.removeChild(ghost), 0);

              // Visual state on the card
              const card = e.currentTarget as HTMLElement;
              card.style.opacity = '0.4';
              card.style.transform = 'scale(0.97)';
              card.style.transition = 'opacity 150ms, transform 150ms';
            }}
            onDragEnd={(e) => {
              const card = e.currentTarget as HTMLElement;
              card.style.opacity = '1';
              card.style.transform = 'scale(1)';
              // Only remove if successfully dropped to free sample zone
              // dropEffect === 'move' is unreliable — some browsers return 'move' even on failed drops
              if (droppedSuccessfullyRef.current === order.bling_order_id) {
                droppedSuccessfullyRef.current = null;
                setPendingOrders((prev) =>
                  prev.filter((o) => o.bling_order_id !== order.bling_order_id)
                );
              }
            }}
            className="flex-shrink-0 w-[380px] p-4 hover:shadow-lg transition-shadow duration-200 cursor-grab active:cursor-grabbing select-none"
          >
            {/* Drag hint */}
            <div className="flex items-center gap-1 mb-2 -mt-1 text-[10px] text-gray-400 dark:text-gray-600 font-medium">
              <GripVertical className="w-3 h-3" />
              <span>Arraste para Amostras Grátis</span>
            </div>
            {/* Imagem do Produto — altura reduzida */}
            <div
              className="relative w-full h-32 mb-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-zinc-900 dark:to-zinc-800 rounded-xl overflow-hidden shadow-sm cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all"
              onClick={() => {
                const pid = order.first_product_id;
                if (pid) setProductInfoId(pid);
              }}
              title="Clique para ver informações do produto"
            >
              {order.first_product_image ? (
                <img
                  src={order.first_product_image}
                  alt={`Produto do pedido #${order.order_number}`}
                  className="w-full h-full object-contain p-2"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = `
                        <div class="w-full h-full flex items-center justify-center">
                          <svg class="w-16 h-16 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                        </div>
                      `;
                    }
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-16 h-16 text-gray-300 dark:text-gray-600" strokeWidth={1.5} />
                </div>
              )}
              {/* Badge do Marketplace com Ícone */}
              {(() => {
                const icon = getMarketplaceIcon(order.marketplace_name);
                return (
                  <div className="absolute top-3 right-3 bg-white dark:bg-zinc-900 backdrop-blur-sm px-2 py-2 rounded-lg shadow-lg border border-gray-200 dark:border-zinc-700" style={{ opacity: 1, visibility: 'visible' }}>
                    {icon ? (
                      <img 
                        src={icon} 
                        alt={order.marketplace_name}
                        className="h-6 w-auto object-contain"
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
                );
              })()}
            </div>

            {/* Informações do Pedido */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  Pedido #{order.order_number}
                </span>
                <div className="text-right">
                  <span className="text-xs text-gray-500 dark:text-gray-400 block">
                    {formatDate(order.order_date)}
                  </span>
                  {order.order_created_at && (
                    <span className="text-[10px] text-gray-400 dark:text-gray-600 block">
                      {new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date(order.order_created_at))}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                  {order.customer_name}
                </p>
                {order.customer_email && (
                  <p className="text-xs text-gray-500 dark:text-gray-500 truncate">
                    {order.customer_email}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-zinc-700">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Valor Total
                  </p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {formatCurrency(order.total_amount)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Itens
                  </p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {order.items_count}
                  </p>
                </div>
              </div>

              {/* Lucro Estimado */}
              <div className="pt-2 border-t border-gray-200 dark:border-zinc-700">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Valor Bruto
                  </p>
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {formatCurrency(order.valor_bruto)}
                  </p>
                </div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Valor Esperado
                  </p>
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {formatCurrency(order.expected_price)}
                  </p>
                </div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Custo
                  </p>
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {formatCurrency(order.total_cost)}
                  </p>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-dashed border-gray-300 dark:border-zinc-600">
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Lucro Estimado
                  </p>
                  <p className={`text-base font-bold ${
                    order.estimated_profit > 0 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {formatCurrency(order.estimated_profit)}
                  </p>
                </div>
              </div>

              {order.commission_rate > 0 && (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Comissão: {order.commission_rate}%
                </div>
              )}
            </div>

            {/* Botões de ação */}
            <div className="flex gap-2">
              <Button
                onClick={() => processOrder(order.bling_order_id)}
                disabled={processing === order.bling_order_id || deleting === order.bling_order_id}
                className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold"
              >
                {processing === order.bling_order_id ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  'PROCESSAR LUCRO'
                )}
              </Button>
              <Button
                onClick={() => deleteOrder(order.bling_order_id, order.order_number)}
                disabled={processing === order.bling_order_id || deleting === order.bling_order_id}
                variant="outline"
                className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30"
                title="Excluir pedido"
              >
                {deleting === order.bling_order_id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </Button>
            </div>
          </Card>
        ))}
      </div>

        {/* Seta Direita */}
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
    </div>
    </>
  );
};
