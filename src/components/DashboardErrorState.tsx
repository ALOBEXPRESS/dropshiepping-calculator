/**
 * DashboardErrorState Component
 * 
 * Displays when dashboard data fails to load.
 * Provides user-friendly error message and retry option.
 * 
 * Requirements: 10.1, 10.9
 */

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface DashboardErrorStateProps {
  /** Error message to display */
  error?: string;
  /** Callback function to retry loading data */
  onRetry?: () => void;
  /** Optional custom title */
  title?: string;
}

/**
 * DashboardErrorState Component
 * 
 * Displays a user-friendly error state when dashboard data fails to load.
 * Includes a retry button to attempt reloading the data.
 */
export const DashboardErrorState: React.FC<DashboardErrorStateProps> = ({
  error = 'Não foi possível carregar os dados do painel. Por favor, tente novamente.',
  onRetry,
  title = 'Erro ao Carregar Painel',
}) => {
  return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-4">
      <Card className="bg-[#1c1c1c] border-none rounded-2xl shadow-xl max-w-lg w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-[#FF4D00]/10 p-4 rounded-full">
              <AlertTriangle className="w-12 h-12 text-[#FF4D00]" />
            </div>
          </div>
          <CardTitle className="text-white text-2xl font-semibold">
            {title}
          </CardTitle>
        </CardHeader>

        <CardContent className="text-center">
          <p className="text-[#a3a3a3] text-base leading-relaxed">
            {error}
          </p>
        </CardContent>

        {onRetry && (
          <CardFooter className="flex justify-center">
            <button
              onClick={onRetry}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-lg font-medium transition-colors"
              aria-label="Tentar carregar o painel novamente"
            >
              <RefreshCw className="w-4 h-4" />
              Tentar Novamente
            </button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
};

export default DashboardErrorState;
