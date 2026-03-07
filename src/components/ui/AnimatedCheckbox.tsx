import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnimatedCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  id?: string;
  className?: string;
}

export const AnimatedCheckbox: React.FC<AnimatedCheckboxProps> = ({
  checked,
  onChange,
  label,
  id,
  className,
}) => {
  const checkboxId = id || `checkbox-${label.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <label
      htmlFor={checkboxId}
      className={cn(
        'flex items-center gap-3 cursor-pointer group',
        className
      )}
    >
      <div className="relative">
        <input
          type="checkbox"
          id={checkboxId}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div
          className={cn(
            'w-5 h-5 border-2 rounded transition-all duration-200',
            'peer-focus:ring-4 peer-focus:ring-[#fe2c55]/20',
            checked
              ? 'border-[#fe2c55] bg-[#fe2c55]'
              : 'border-gray-300 bg-white dark:bg-gray-800 dark:border-gray-600'
          )}
        >
          <Check
            className={cn(
              'w-full h-full text-white transition-all duration-200',
              checked ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
            )}
            strokeWidth={3}
          />
        </div>
      </div>
      <span className="text-sm group-hover:text-[#fe2c55] transition-colors dark:text-gray-300">
        {label}
      </span>
    </label>
  );
};
