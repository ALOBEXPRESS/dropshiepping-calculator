import React, { useState } from 'react';
import * as Collapsible from '@radix-ui/react-collapsible';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExpandableSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
  variant?: 'default' | 'card' | 'minimal';
}

export const ExpandableSection: React.FC<ExpandableSectionProps> = ({
  title,
  children,
  defaultOpen = false,
  className,
  variant = 'default',
}) => {
  const [open, setOpen] = useState(defaultOpen);

  const variants = {
    default: {
      trigger: 'px-4 py-3 rounded-lg bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700',
      content: 'pt-4',
    },
    card: {
      trigger: 'px-6 py-4 rounded-xl bg-white border border-gray-200 hover:border-gray-300 dark:bg-gray-800 dark:border-gray-700 dark:hover:border-gray-600 shadow-sm',
      content: 'px-6 pt-4 pb-2',
    },
    minimal: {
      trigger: 'py-2 border-b border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600',
      content: 'pt-3',
    },
  };

  return (
    <Collapsible.Root open={open} onOpenChange={setOpen} className={cn('w-full', className)}>
      <Collapsible.Trigger
        className={cn(
          'flex items-center justify-between w-full',
          'transition-colors duration-200',
          'focus:outline-none focus:ring-2 focus:ring-[#fe2c55]/20',
          variants[variant].trigger
        )}
      >
        <span className="font-medium text-gray-900 dark:text-gray-100">{title}</span>
        <ChevronDown
          className={cn(
            'w-5 h-5 text-gray-500 dark:text-gray-400',
            'transition-transform duration-200',
            open && 'rotate-180'
          )}
        />
      </Collapsible.Trigger>

      <Collapsible.Content
        className={cn(
          'overflow-hidden',
          'data-[state=open]:animate-slideDown',
          'data-[state=closed]:animate-slideUp',
          variants[variant].content
        )}
      >
        {children}
      </Collapsible.Content>
    </Collapsible.Root>
  );
};
