import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { subDays, startOfDay, endOfDay } from 'date-fns';

export type DateRangePreset = '7' | '30' | '90' | 'custom';

export interface DateRange {
  from: Date;
  to: Date;
}

interface DateRangeContextType {
  dateRange: DateRange;
  preset: DateRangePreset;
  setDateRange: (range: DateRange) => void;
  setPreset: (preset: DateRangePreset) => void;
  resetToDefault: () => void;
}

const DateRangeContext = createContext<DateRangeContextType | undefined>(undefined);

const STORAGE_KEY = 'dashboard-date-range';

const getDefaultDateRange = (): DateRange => ({
  from: startOfDay(subDays(new Date(), 30)),
  to: endOfDay(new Date()),
});

const getDateRangeFromPreset = (preset: DateRangePreset): DateRange => {
  const today = new Date();
  
  switch (preset) {
    case '7':
      return {
        from: startOfDay(subDays(today, 7)),
        to: endOfDay(today),
      };
    case '30':
      return {
        from: startOfDay(subDays(today, 30)),
        to: endOfDay(today),
      };
    case '90':
      return {
        from: startOfDay(subDays(today, 90)),
        to: endOfDay(today),
      };
    default:
      return getDefaultDateRange();
  }
};

interface DateRangeProviderProps {
  children: ReactNode;
}

const loadInitialState = (): { preset: DateRangePreset; dateRange: DateRange } => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const { preset: storedPreset, dateRange: storedRange } = JSON.parse(stored) as {
        preset: DateRangePreset;
        dateRange?: { from: string; to: string };
      };
      if (storedPreset === 'custom' && storedRange) {
        return {
          preset: storedPreset,
          dateRange: { from: new Date(storedRange.from), to: new Date(storedRange.to) },
        };
      }
      return { preset: storedPreset, dateRange: getDateRangeFromPreset(storedPreset) };
    }
  } catch {
    // ignore parse errors
  }
  return { preset: '30', dateRange: getDefaultDateRange() };
};

export const DateRangeProvider: React.FC<DateRangeProviderProps> = ({ children }) => {
  const [preset, setPresetState] = useState<DateRangePreset>(() => loadInitialState().preset);
  const [dateRange, setDateRangeState] = useState<DateRange>(() => loadInitialState().dateRange);

  // Salvar no localStorage quando mudar
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          preset,
          dateRange: {
            from: dateRange.from.toISOString(),
            to: dateRange.to.toISOString(),
          },
        })
      );
    } catch (error) {
      console.error('Error saving date range to localStorage:', error);
    }
  }, [preset, dateRange]);

  const setPreset = (newPreset: DateRangePreset) => {
    setPresetState(newPreset);
    if (newPreset !== 'custom') {
      setDateRangeState(getDateRangeFromPreset(newPreset));
    }
  };

  const setDateRange = (range: DateRange) => {
    setDateRangeState(range);
    setPresetState('custom');
  };

  const resetToDefault = () => {
    setPresetState('30');
    setDateRangeState(getDefaultDateRange());
  };

  return (
    <DateRangeContext.Provider
      value={{
        dateRange,
        preset,
        setDateRange,
        setPreset,
        resetToDefault,
      }}
    >
      {children}
    </DateRangeContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components -- context file exports both provider and hook by design
export const useDateRange = (): DateRangeContextType => {
  const context = useContext(DateRangeContext);
  if (!context) {
    throw new Error('useDateRange must be used within DateRangeProvider');
  }
  return context;
};
