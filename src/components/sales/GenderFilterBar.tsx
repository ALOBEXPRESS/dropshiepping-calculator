import React from 'react';
import { Badge } from '@/components/ui/badge';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

export type GenderFilter = 'all' | 'male' | 'female';

interface GenderFilterBarProps {
  value: GenderFilter;
  count: number;
  onChange: (filter: GenderFilter) => void;
}

export const GenderFilterBar: React.FC<GenderFilterBarProps> = ({
  value,
  count,
  onChange,
}) => {
  return (
    <div
      className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
      role="group"
      aria-label="Filtro de gênero"
    >
      <ToggleGroup
        type="single"
        value={value}
        onValueChange={(newValue: string) => {
          // ToggleGroup can return empty string when deselecting, default to 'all'
          if (newValue) {
            onChange(newValue as GenderFilter);
          }
        }}
        className="gap-1"
      >
        <ToggleGroupItem
          value="all"
          aria-label="Mostrar todos os leads"
          className="min-h-[44px] min-w-[44px] px-4 transition-all duration-150"
          variant="outline"
        >
          Todos
        </ToggleGroupItem>
        <ToggleGroupItem
          value="male"
          aria-label="Filtrar por leads masculinos"
          className="min-h-[44px] min-w-[44px] px-4 transition-all duration-150"
          variant="outline"
        >
          <span className="mr-1.5" aria-hidden="true">♂</span>
          Masculino
        </ToggleGroupItem>
        <ToggleGroupItem
          value="female"
          aria-label="Filtrar por leads femininos"
          className="min-h-[44px] min-w-[44px] px-4 transition-all duration-150"
          variant="outline"
        >
          <span className="mr-1.5" aria-hidden="true">♀</span>
          Feminino
        </ToggleGroupItem>
      </ToggleGroup>

      {value !== 'all' && (
        <Badge
          variant="secondary"
          className="ml-2 text-xs font-medium"
          aria-live="polite"
          aria-label={`${count} ${count === 1 ? 'lead encontrado' : 'leads encontrados'}`}
        >
          {count}
        </Badge>
      )}
    </div>
  );
};
