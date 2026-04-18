import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { PendingOrder } from '@/types/pendingOrder';
import type { FreeSampleInsert } from '@/types/freeSample';

export interface InfluencerOption {
  id: string;
  name: string;
  instagram: string | null;
  tiktok: string | null;
}

interface ProcessResult {
  success: boolean;
  message: string;
  order_id?: string;
  total_profit?: number;
  profit_margin?: number;
  order_number?: string;
}

export interface UseFreeSampleLaneReturn {
  processing: string | null;
  processFreeSample: (order: PendingOrder, influencerId: string | null) => Promise<void>;
  influencers: InfluencerOption[];
  influencersLoading: boolean;
}

export function useFreeSampleLane(
  organizationId: string,
  onOrderProcessed: (blingOrderId: string) => void
): UseFreeSampleLaneReturn {
  const [processing, setProcessing] = useState<string | null>(null);
  const [influencers, setInfluencers] = useState<InfluencerOption[]>([]);
  const [influencersLoading, setInfluencersLoading] = useState(false);

  // Fetch influencers for the organization
  useEffect(() => {
    if (!organizationId) return;

    const fetchInfluencers = async () => {
      setInfluencersLoading(true);
      try {
        const { data, error } = await supabase
          .from('influencers')
          .select('id, name, instagram, tiktok')
          .eq('organization_id', organizationId)
          .eq('is_active', true)
          .order('name');

        if (error) throw error;
        setInfluencers(data ?? []);
      } catch (err) {
        console.error('Error fetching influencers:', err);
        // Graceful degradation — empty list, processing can still proceed
        setInfluencers([]);
      } finally {
        setInfluencersLoading(false);
      }
    };

    fetchInfluencers();
  }, [organizationId]);

  const processFreeSample = useCallback(
    async (order: PendingOrder, influencerId: string | null) => {
      setProcessing(order.bling_order_id);

      try {
        // Step 1: Call the existing RPC to process the order
        const { data, error: rpcError } = await supabase.rpc(
          'process_bling_order_to_profit',
          {
            p_bling_order_id: order.bling_order_id,
            p_user_id: null,
          }
        );

        if (rpcError) throw rpcError;
        if (!data) throw new Error('Resposta vazia do servidor');

        const result = data as ProcessResult;
        if (!result.success) {
          throw new Error(result.message || 'Erro ao processar pedido');
        }

        const orderId = result.order_id;
        if (!orderId) throw new Error('order_id não retornado pelo servidor');

        // Step 2: Mark the order as a free sample
        const { error: updateError } = await supabase
          .from('orders')
          .update({ is_free_sample: true, total_profit: 0, total_cost: 0, profit_margin: 0 })
          .eq('id', orderId);

        if (updateError) {
          console.error('Warning: failed to set is_free_sample flag:', updateError);
          toast.warning('Pedido processado, mas não foi possível marcar como amostra grátis.', {
            description: updateError.message,
          });
        }

        // Step 3: Insert into influencer_free_samples
        const insertPayload: FreeSampleInsert = {
          organization_id: organizationId,
          influencer_id: influencerId || null,
          order_id: orderId,
          bling_order_id: order.bling_order_id,
          product_name: order.first_product_name ?? 'Produto não identificado',
          product_image_url: order.first_product_image ?? null,
          processed_at: new Date().toISOString(),
        };

        const { error: insertError } = await supabase
          .from('influencer_free_samples')
          .insert(insertPayload);

        if (insertError) {
          console.error('Warning: failed to insert influencer_free_samples record:', insertError);
          toast.warning('Pedido processado, mas não foi possível registrar a amostra grátis.', {
            description: insertError.message,
          });
        }

        // Step 4: Success
        toast.success(`Amostra grátis processada! Pedido #${order.order_number}`, {
          description: influencerId
            ? `Registrado para o influenciador selecionado.`
            : 'Sem influenciador associado.',
        });

        onOrderProcessed(order.bling_order_id);
      } catch (err) {
        console.error('Error processing free sample:', err);
        const message = err instanceof Error ? err.message : 'Erro desconhecido';
        toast.error('Erro ao processar amostra grátis', { description: message });
      } finally {
        setProcessing(null);
      }
    },
    [organizationId, onOrderProcessed]
  );

  return { processing, processFreeSample, influencers, influencersLoading };
}
