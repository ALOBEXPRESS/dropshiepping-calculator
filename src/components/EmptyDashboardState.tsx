/**
 * EmptyDashboardState Component
 * 
 * Displays when no dashboard data is available.
 * Provides user-friendly message and guidance.
 * 
 * Requirements: 10.1, 10.9
 */

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { BarChart3, TrendingUp, Users } from 'lucide-react';

interface EmptyDashboardStateProps {
  /** Optional custom message */
  message?: string;
  /** Optional custom description */
  description?: string;
}

/**
 * EmptyDashboardState Component
 * 
 * Displays a friendly empty state when no dashboard data is available.
 * Shows relevant icons and helpful messaging.
 */
export const EmptyDashboardState: React.FC<EmptyDashboardStateProps> = ({
  message = 'Nenhum Dado Disponível',
  description = 'Não há dados do painel para exibir no momento. Os dados aparecerão aqui assim que estiverem disponíveis.',
}) => {
  return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-4">
      <Card className="bg-[#1c1c1c] border-none rounded-2xl shadow-xl max-w-2xl w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center gap-4 mb-6">
            <div className="bg-[#FFB800]/10 p-4 rounded-full">
              <BarChart3 className="w-8 h-8 text-[#FFB800]" />
            </div>
            <div className="bg-[#FF4D00]/10 p-4 rounded-full">
              <TrendingUp className="w-8 h-8 text-[#FF4D00]" />
            </div>
            <div className="bg-[#7C3AED]/10 p-4 rounded-full">
              <Users className="w-8 h-8 text-[#7C3AED]" />
            </div>
          </div>
          <CardTitle className="text-white text-2xl font-semibold">
            {message}
          </CardTitle>
        </CardHeader>

        <CardContent className="text-center">
          <p className="text-[#a3a3a3] text-base leading-relaxed">
            {description}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmptyDashboardState;
