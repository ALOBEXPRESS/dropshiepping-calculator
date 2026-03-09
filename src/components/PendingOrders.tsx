import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useSettings } from '@/contexts/SettingsContext';
import { Loader2, CheckCircle, AlertCircle, Package, ChevronLeft, ChevronRight } from 'lucide-react';
import { ProcessOrderModal } from './ProcessOrderModal';

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

interface PendingOrder {
  bling_order_id: string;
  order_number: number;
  order_date: string;
  total_amount: number;
  customer_name: string;
  customer_email: string;
  marketplace_name: string;
  marketplace_id: string;
  commission_rate: number;
  items_count: number;
  first_product_image: string | null;
}

interface ProcessResult {
  success: boolean;
  message: string;
  order_id?: string;
  total_profit?: number;
  profit_margin?: number;
  order_number?: string;
}

interface PendingOrdersProps {
  onOrderProcessed?: () => void;
}

export const PendingOrders: React.FC<PendingOrdersProps> = ({ onOrderProcessed }) => {
  const { organizationId } = useSettings();
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processResult, setProcessResult] = useState<ProcessResult | null>(null);
  const [showModal, setShowModal] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  useEffect(() => {
    if (organizationId) {
      loadPendingOrders();
    }
  }, [organizationId]);

  useEffect(() => {
    checkScrollButtons();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollButtons);
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

  const loadPendingOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('pending_orders_to_process')
        .select('*')
        .order('order_date', { ascending: false });

      if (fetchError) throw fetchError;
      setPendingOrders(data || []);
    } catch (err) {
      console.error('Error loading pending orders:', err);
      setError('Erro ao carregar vendas pendentes');
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
        
        // Remover o pedido da lista
        setPendingOrders((prev) =>
          prev.filter((order) => order.bling_order_id !== blingOrderId)
        );

        // Mostrar modal de sucesso
        setProcessResult(result);
        setShowModal(true);

        // Recarregar dados
        await loadPendingOrders();
        
        // Notificar componente pai para atualizar pedidos recentes
        if (onOrderProcessed) {
          onOrderProcessed();
        }
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
      <Card className="p-6 border-gray-100 dark:border-zinc-800">
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-3" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Carregando vendas pendentes...</p>
        </div>
      </Card>
    );
  }

  if (pendingOrders.length === 0) {
    return (
      <Card className="p-6 border-gray-100 dark:border-zinc-800 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
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
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Vendas a Processar
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {pendingOrders.length} {pendingOrders.length === 1 ? 'venda pendente' : 'vendas pendentes'}
          </p>
        </div>
        <Button
          onClick={loadPendingOrders}
          variant="outline"
          size="sm"
          disabled={loading}
        >
          Atualizar
        </Button>
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
      <div className="relative">
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
        {pendingOrders.map((order) => (
          <Card
            key={order.bling_order_id}
            className="flex-shrink-0 w-[380px] p-4 hover:shadow-lg transition-shadow duration-200"
          >
            {/* Imagem do Produto */}
            <div className="relative w-full h-48 mb-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-zinc-900 dark:to-zinc-800 rounded-xl overflow-hidden shadow-sm">
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
                  <div className="absolute top-3 right-3 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm px-2 py-2 rounded-lg shadow-lg border border-gray-200 dark:border-zinc-700">
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
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {formatDate(order.order_date)}
                </span>
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

              {order.commission_rate > 0 && (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Comissão: {order.commission_rate}%
                </div>
              )}
            </div>

            {/* Botão de Processar */}
            <Button
              onClick={() => processOrder(order.bling_order_id)}
              disabled={processing === order.bling_order_id}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold"
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

export default PendingOrders;
