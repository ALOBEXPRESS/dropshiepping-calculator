import React, { useState } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface TabItem {
  value: string;
  label: string;
  content: React.ReactNode;
}

interface AnimatedTabsProps {
  tabs: TabItem[];
  defaultValue?: string;
  className?: string;
  onValueChange?: (value: string) => void;
}

export const AnimatedTabs: React.FC<AnimatedTabsProps> = ({
  tabs,
  defaultValue,
  className,
  onValueChange,
}) => {
  const [activeTab, setActiveTab] = useState(defaultValue || tabs[0]?.value || '');

  const handleValueChange = (value: string) => {
    setActiveTab(value);
    onValueChange?.(value);
  };

  return (
    <Tabs.Root
      value={activeTab}
      onValueChange={handleValueChange}
      className={cn('w-full', className)}
    >
      <Tabs.List className="flex gap-2 border-b border-gray-200 dark:border-gray-700 mb-4">
        {tabs.map((tab) => (
          <Tabs.Trigger
            key={tab.value}
            value={tab.value}
            className={cn(
              'relative px-4 py-2 text-sm font-medium transition-colors duration-200',
              'text-gray-600 hover:text-[#fe2c55] dark:text-gray-400 dark:hover:text-[#fe2c55]',
              'data-[state=active]:text-[#fe2c55] dark:data-[state=active]:text-[#fe2c55]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fe2c55] focus-visible:ring-offset-2',
              'disabled:pointer-events-none disabled:opacity-50'
            )}
          >
            {tab.label}
            {activeTab === tab.value && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#fe2c55]"
                transition={{
                  type: 'spring',
                  stiffness: 500,
                  damping: 30,
                }}
              />
            )}
          </Tabs.Trigger>
        ))}
      </Tabs.List>

      <AnimatePresence mode="wait">
        {tabs.map((tab) => (
          <Tabs.Content key={tab.value} value={tab.value} asChild>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fe2c55] focus-visible:ring-offset-2 rounded-lg"
            >
              {tab.content}
            </motion.div>
          </Tabs.Content>
        ))}
      </AnimatePresence>
    </Tabs.Root>
  );
};
