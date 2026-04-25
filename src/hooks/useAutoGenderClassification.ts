/**
 * useAutoGenderClassification Hook
 * 
 * Hook para gerenciar a classificação automática de gênero quando um pedido é processado.
 * Monitora o resultado do processamento e dispara a classificação se necessário.
 */

import { useCallback } from 'react';
import { classifySingle, getValidatedThreshold } from '@/services/genderClassificationService';
import { toast } from 'sonner';

interface ProcessOrderResult {
  success: boolean;
  message: string;
  order_id?: string;
  total_profit?: number;
  profit_margin?: number;
  lead_needs_classification?: boolean;
  lead_id?: string;
  lead_name?: string;
}

export const useAutoGenderClassification = () => {
  /**
   * Processa a classificação de gênero se necessário após processar um pedido
   */
  const handlePostOrderProcessing = useCallback(async (result: ProcessOrderResult) => {
    // Verificar se o lead precisa de classificação
    if (!result.lead_needs_classification || !result.lead_id || !result.lead_name) {
      return;
    }

    try {
      console.log(`[AutoGenderClassification] Classificando lead ${result.lead_id} (${result.lead_name})...`);

      // Obter API key do ambiente (opcional)
      const apiKey = import.meta.env.VITE_GENDERIZE_API_KEY;
      const threshold = getValidatedThreshold();

      // Classificar o lead
      const classificationResult = await classifySingle(
        result.lead_id,
        result.lead_name,
        { apiKey, threshold },
        'BR' // País padrão para melhor precisão com nomes brasileiros
      );

      // Atualizar o lead no banco de dados
      const { supabase } = await import('@/lib/supabase');
      const { error: updateError } = await supabase
        .from('leads')
        .update({
          gender: classificationResult.gender,
          gender_probability: classificationResult.gender_probability
        })
        .eq('id', result.lead_id);

      if (updateError) {
        console.error('[AutoGenderClassification] Erro ao atualizar lead:', updateError);
        return;
      }

      // Mostrar notificação de sucesso
      if (classificationResult.gender) {
        const genderLabel = classificationResult.gender === 'male' ? 'Masculino' : 'Feminino';
        const probability = classificationResult.gender_probability 
          ? `${(classificationResult.gender_probability * 100).toFixed(0)}%` 
          : '';
        
        toast.success('Lead classificado automaticamente', {
          description: `Gênero: ${genderLabel} ${probability ? `(${probability} de confiança)` : ''}`,
          duration: 3000
        });
      } else {
        console.log('[AutoGenderClassification] Lead não pôde ser classificado (baixa confiança ou nome ambíguo)');
      }

    } catch (error) {
      console.error('[AutoGenderClassification] Erro ao classificar lead:', error);
      // Não mostrar erro ao usuário para não interromper o fluxo principal
    }
  }, []);

  return {
    handlePostOrderProcessing
  };
};
