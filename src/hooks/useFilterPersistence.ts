import { useCallback, useState } from 'react';

export interface SalesFilters {
  startDate?: string;     // ISO date string (YYYY-MM-DD)
  endDate?: string;
  marketplaceId?: string; // sales_channel_id
}

export interface FilterPersistenceResult {
  filters: SalesFilters;
  setFilters: (filters: SalesFilters) => void;
  resetFilters: () => void;
}

function loadFromStorage(key: string, fallback: SalesFilters): SalesFilters {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as SalesFilters;
  } catch {
    console.error(`[useFilterPersistence] Failed to parse filters for key "${key}"`);
    return fallback;
  }
}

function saveToStorage(key: string, filters: SalesFilters): void {
  try {
    sessionStorage.setItem(key, JSON.stringify(filters));
  } catch {
    console.error(`[useFilterPersistence] Failed to save filters for key "${key}"`);
  }
}

export function useFilterPersistence(
  key: string,
  initialFilters: SalesFilters = {}
): FilterPersistenceResult {
  const [filters, setFiltersState] = useState<SalesFilters>(() =>
    loadFromStorage(key, initialFilters)
  );

  const setFilters = useCallback(
    (next: SalesFilters) => {
      saveToStorage(key, next);
      setFiltersState(next);
    },
    [key]
  );

  const resetFilters = useCallback(() => {
    try {
      sessionStorage.removeItem(key);
    } catch {
      console.error(`[useFilterPersistence] Failed to remove filters for key "${key}"`);
    }
    setFiltersState(initialFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { filters, setFilters, resetFilters };
}
