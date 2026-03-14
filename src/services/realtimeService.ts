import { supabase } from '@/lib/supabase';

export type RealtimeCallback = () => void;

export interface RealtimeSubscription {
  unsubscribe: () => void;
}

const DEBOUNCE_MS = 500;

function debounce(fn: RealtimeCallback, ms: number): RealtimeCallback {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(fn, ms);
  };
}

export function subscribeToOrderChanges(callback: RealtimeCallback): RealtimeSubscription {
  const debouncedCallback = debounce(callback, DEBOUNCE_MS);

  const channel = supabase
    .channel('bling_orders_changes')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'bling_orders' },
      debouncedCallback
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'bling_orders' },
      debouncedCallback
    )
    .subscribe();

  return {
    unsubscribe: () => {
      supabase.removeChannel(channel);
    },
  };
}

export function subscribeToOrderItemChanges(callback: RealtimeCallback): RealtimeSubscription {
  const debouncedCallback = debounce(callback, DEBOUNCE_MS);

  const channel = supabase
    .channel('bling_order_items_changes')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'bling_order_items' },
      debouncedCallback
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'bling_order_items' },
      debouncedCallback
    )
    .subscribe();

  return {
    unsubscribe: () => {
      supabase.removeChannel(channel);
    },
  };
}
