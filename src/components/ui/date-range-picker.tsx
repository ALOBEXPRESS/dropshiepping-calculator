import React from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useDateRange, DateRangePreset } from '@/contexts/DateRangeContext';

export const DateRangePicker: React.FC = () => {
  const { dateRange, preset, setPreset } = useDateRange();

  const formatDateRange = () => {
    if (!dateRange.from || !dateRange.to) return 'Selecione o período';
    
    return `${format(dateRange.from, 'dd MMM', { locale: ptBR })} - ${format(
      dateRange.to,
      'dd MMM yyyy',
      { locale: ptBR }
    )}`;
  };

  const getPresetLabel = (value: DateRangePreset) => {
    switch (value) {
      case '7':
        return 'Últimos 7 dias';
      case '30':
        return 'Últimos 30 dias';
      case '90':
        return 'Últimos 90 dias';
      case 'custom':
        return 'Período customizado';
      default:
        return 'Selecione';
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Select value={preset} onValueChange={(value) => setPreset(value as DateRangePreset)}>
        <SelectTrigger className="w-[200px]">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <SelectValue />
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="7">{getPresetLabel('7')}</SelectItem>
          <SelectItem value="30">{getPresetLabel('30')}</SelectItem>
          <SelectItem value="90">{getPresetLabel('90')}</SelectItem>
          <SelectItem value="custom" disabled>
            {getPresetLabel('custom')} (em breve)
          </SelectItem>
        </SelectContent>
      </Select>

      <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm text-gray-600 dark:text-gray-400">
        <Calendar className="w-4 h-4" />
        <span>{formatDateRange()}</span>
      </div>
    </div>
  );
};
