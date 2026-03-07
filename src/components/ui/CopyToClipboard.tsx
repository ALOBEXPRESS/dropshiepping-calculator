import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export interface CopyToClipboardProps {
  text: string;
  children?: React.ReactNode;
  className?: string;
  showIcon?: boolean;
  successMessage?: string;
}

/**
 * CopyToClipboard - Elemento clicável que copia conteúdo para área de transferência
 * 
 * Baseado no CSS Pack: https://cdncsspack.heitorweb.com/csspcopiar-conteudo-ao-clicar/
 * 
 * Features:
 * - Copia texto ao clicar
 * - Feedback visual (ícone muda)
 * - Toast notification
 * - Acessível (role="button")
 * 
 * @example
 * <CopyToClipboard text="SKU-12345" successMessage="SKU copiado!">
 *   SKU-12345
 * </CopyToClipboard>
 */
export const CopyToClipboard: React.FC<CopyToClipboardProps> = ({
  text,
  children,
  className,
  showIcon = true,
  successMessage = 'Copiado!',
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success(successMessage, {
        duration: 2000,
      });

      // Reset após 2 segundos
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error('Erro ao copiar:', error);
      toast.error('Erro ao copiar', {
        description: 'Não foi possível copiar o texto.',
      });
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={cn(
        'inline-flex items-center gap-2',
        'px-3 py-1.5 rounded-md',
        'text-sm font-medium',
        'bg-gray-100 hover:bg-gray-200',
        'dark:bg-gray-800 dark:hover:bg-gray-700',
        'transition-all duration-200',
        'cursor-pointer',
        'focus:outline-none focus:ring-2 focus:ring-[#fe2c55]/20',
        copied && 'bg-green-100 dark:bg-green-900/30',
        className
      )}
      role="button"
      aria-label={`Copiar ${text}`}
    >
      {children || text}
      {showIcon && (
        <span className="transition-transform duration-200">
          {copied ? (
            <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
          ) : (
            <Copy className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          )}
        </span>
      )}
    </button>
  );
};
