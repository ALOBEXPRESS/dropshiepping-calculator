/**
 * GenderClassificationJobButton
 * 
 * Botão que dispara o job de classificação de gênero em lote.
 * Exibe feedback visual durante execução e sumário ao concluir.
 * 
 * Features:
 * - Desabilitado durante execução (loading state)
 * - Spinner animado substitui borda degradê durante loading
 * - Toast com sumário ao concluir: "X leads classificados, Y não classificados, Z erros"
 * - CSS Pack: Botão com Borda Degradê Animada (estado idle)
 * - Acessibilidade: aria-label descritivo
 * 
 * **Validates: Requirements 4.4, 8.5**
 */

import { useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { runClassificationJob } from '@/services/genderClassificationService';
import type { ClassificationSummary } from '@/services/genderClassificationService';
import { cn } from '@/lib/utils';

export interface GenderClassificationJobButtonProps {
  organizationId: string;
  onComplete?: (summary: ClassificationSummary) => void;
  className?: string;
}

export function GenderClassificationJobButton({
  organizationId,
  onComplete,
  className,
}: GenderClassificationJobButtonProps) {
  const [isRunning, setIsRunning] = useState(false);

  const handleRunJob = async () => {
    if (!organizationId) {
      toast.error('Organização não identificada', {
        description: 'Não foi possível iniciar a classificação.',
      });
      return;
    }

    setIsRunning(true);

    try {
      // Executar job de classificação
      const summary = await runClassificationJob(
        organizationId,
        {
          // Config será lida do ambiente pelo serviço
        },
        'leads'
      );

      // Exibir sumário em toast
      const { total, classified, unclassified, errors } = summary;
      
      if (errors > 0) {
        toast.warning('Classificação concluída com erros', {
          description: `${classified} leads classificados, ${unclassified} não classificados, ${errors} erros.`,
          duration: 5000,
        });
      } else if (classified === 0 && unclassified === total) {
        toast.info('Nenhum lead classificado', {
          description: `${total} leads processados, mas nenhum atingiu o limiar de confiança.`,
          duration: 4000,
        });
      } else {
        toast.success('Classificação concluída!', {
          description: `${classified} leads classificados, ${unclassified} não classificados, ${errors} erros.`,
          duration: 4000,
        });
      }

      // Callback para atualizar UI (ex: refresh do gráfico)
      onComplete?.(summary);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('[GenderClassificationJobButton] Erro ao executar job:', error);
      
      toast.error('Erro ao classificar leads', {
        description: errorMessage,
        duration: 5000,
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <>
      <button
        onClick={handleRunJob}
        disabled={isRunning}
        aria-label={isRunning ? 'Classificando leads...' : 'Executar classificação de gênero em lote'}
        className={cn(
          // Base styles
          'relative min-h-[44px] px-6 py-3 rounded-lg',
          'font-semibold text-sm',
          'transition-all duration-300',
          'flex items-center justify-center gap-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          // Idle state: gradient background + animated border
          !isRunning && 'gcp-gradient-border-btn',
          !isRunning && 'bg-gradient-to-r from-orange-500 to-pink-500 text-white',
          !isRunning && 'hover:shadow-lg hover:shadow-orange-500/50',
          // Loading state: solid background, no border animation
          isRunning && 'bg-gray-200 dark:bg-zinc-800 text-gray-700 dark:text-gray-300',
          className
        )}
      >
        {isRunning ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Classificando...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            Classificar Leads
          </>
        )}
      </button>

      {/* CSS Pack: Botão com Borda Degradê Animada */}
      <style>{`
        .gcp-gradient-border-btn {
          position: relative;
          overflow: hidden;
        }

        .gcp-gradient-border-btn::before {
          content: '';
          position: absolute;
          inset: -2px;
          border-radius: inherit;
          padding: 2px;
          background: linear-gradient(
            90deg,
            rgba(249, 115, 22, 0.8),
            rgba(236, 72, 153, 0.8),
            rgba(249, 115, 22, 0.8)
          );
          background-size: 200% 100%;
          -webkit-mask: 
            linear-gradient(#fff 0 0) content-box, 
            linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          animation: gcp-border-flow 3s linear infinite;
          pointer-events: none;
        }

        @keyframes gcp-border-flow {
          0% {
            background-position: 0% 0%;
          }
          100% {
            background-position: 200% 0%;
          }
        }

        /* Respeitar preferência de movimento reduzido */
        @media (prefers-reduced-motion: reduce) {
          .gcp-gradient-border-btn::before {
            animation: none !important;
            background: linear-gradient(
              90deg,
              rgba(249, 115, 22, 0.8),
              rgba(236, 72, 153, 0.8)
            );
            background-size: 100% 100%;
          }
        }

        /* Remover animação quando desabilitado */
        .gcp-gradient-border-btn:disabled::before {
          display: none;
        }
      `}</style>
    </>
  );
}
