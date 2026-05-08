/**
 * useCSVExport Hook
 * 
 * Custom hook for handling CSV export with loading state and error handling.
 * Provides a mutation-like interface for exporting leads data.
 * 
 * Requirements: 9.1, 9.7
 */

import { useState } from 'react';
import { exportLeadsToCSV } from '@/utils/csvExport';
import type { Lead } from '@/types/leads';
import { toast } from 'sonner';

interface UseCSVExportOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

interface UseCSVExportReturn {
  exportToCSV: (leads: Lead[], organizationName?: string) => Promise<void>;
  isExporting: boolean;
  error: Error | null;
}

/**
 * Hook for exporting leads to CSV
 * 
 * @param options - Optional callbacks for success and error
 * @returns Object with exportToCSV function, loading state, and error
 * 
 * @example
 * ```tsx
 * const { exportToCSV, isExporting } = useCSVExport({
 *   onSuccess: () => console.log('Export successful'),
 *   onError: (error) => console.error('Export failed', error),
 * });
 * 
 * // Trigger export
 * await exportToCSV(leads, 'My Organization');
 * ```
 */
export function useCSVExport(options: UseCSVExportOptions = {}): UseCSVExportReturn {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const exportToCSV = async (leads: Lead[], organizationName?: string) => {
    setIsExporting(true);
    setError(null);

    try {
      // Perform export
      await exportLeadsToCSV(leads, organizationName);

      // Show success notification
      toast.success('Exportação concluída', {
        description: `${leads.length} lead${leads.length !== 1 ? 's' : ''} exportado${leads.length !== 1 ? 's' : ''} com sucesso.`,
      });

      // Call success callback
      options.onSuccess?.();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro ao exportar CSV');
      setError(error);

      // Show error notification
      toast.error('Erro ao exportar', {
        description: error.message,
      });

      // Call error callback
      options.onError?.(error);
    } finally {
      setIsExporting(false);
    }
  };

  return {
    exportToCSV,
    isExporting,
    error,
  };
}
