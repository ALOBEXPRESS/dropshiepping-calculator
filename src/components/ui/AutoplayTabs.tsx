import React, { useState, useEffect } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface Tab {
  value: string;
  label: string;
  content: React.ReactNode;
}

export interface AutoplayTabsProps {
  tabs: Tab[];
  autoplayInterval?: number; // ms
  autoplayEnabled?: boolean;
  className?: string;
  progressColor?: string;
}

/**
 * AutoplayTabs - Abas com autoplay e barra de progresso
 * 
 * Baseado no CSS Pack: https://cdncsspack.heitorweb.com/csspabas-com-autoplay-e-barra-de-progresso/
 * 
 * Features:
 * - Autoplay automático entre abas
 * - Barra de progresso visual
 * - Pausa ao interagir
 * - Transições suaves
 * 
 * @example
 * <AutoplayTabs
 *   tabs={[
 *     { value: 'daily', label: 'Diário', content: <DailyStats /> },
 *     { value: 'weekly', label: 'Semanal', content: <WeeklyStats /> },
 *   ]}
 *   autoplayInterval={5000}
 * />
 */
export const AutoplayTabs: React.FC<AutoplayTabsProps> = ({
  tabs,
  autoplayInterval = 5000,
  autoplayEnabled = true,
  className,
  progressColor = '#fe2c55',
}) => {
  const [activeTab, setActiveTab] = useState(tabs[0]?.value || '');
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (!autoplayEnabled || isPaused || tabs.length <= 1) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          // Avançar para próxima aba
          const currentIndex = tabs.findIndex((tab) => tab.value === activeTab);
          const nextIndex = (currentIndex + 1) % tabs.length;
          setActiveTab(tabs[nextIndex]?.value || tabs[0]?.value || '');
          return 0;
        }
        return prev + (100 / (autoplayInterval / 100));
      });
    }, 100);

    return () => clearInterval(interval);
  }, [activeTab, autoplayEnabled, isPaused, tabs, autoplayInterval]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setProgress(0);
    setIsPaused(true);
    
    // Retomar autoplay após 3 segundos
    setTimeout(() => setIsPaused(false), 3000);
  };

  return (
    <Tabs.Root
      value={activeTab}
      onValueChange={handleTabChange}
      className={cn('w-full', className)}
    >
      <Tabs.List className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        {tabs.map((tab) => (
          <Tabs.Trigger
            key={tab.value}
            value={tab.value}
            className={cn(
              'relative px-4 py-2',
              'text-sm font-medium',
              'text-gray-600 hover:text-gray-900',
              'dark:text-gray-400 dark:hover:text-gray-100',
              'transition-colors duration-200',
              'data-[state=active]:text-gray-900 dark:data-[state=active]:text-gray-100',
              'focus:outline-none focus:ring-2 focus:ring-[#fe2c55]/20'
            )}
          >
            {tab.label}
            
            {/* Barra de progresso */}
            {activeTab === tab.value && (
              <>
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5"
                  style={{ backgroundColor: progressColor }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
                <div
                  className="absolute bottom-0 left-0 h-0.5 transition-all duration-100 ease-linear"
                  style={{
                    width: `${progress}%`,
                    backgroundColor: progressColor,
                    opacity: 0.5,
                  }}
                />
              </>
            )}
          </Tabs.Trigger>
        ))}
      </Tabs.List>

      {tabs.map((tab) => (
        <Tabs.Content
          key={tab.value}
          value={tab.value}
          className="pt-4 focus:outline-none"
        >
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {tab.content}
          </motion.div>
        </Tabs.Content>
      ))}
    </Tabs.Root>
  );
};
