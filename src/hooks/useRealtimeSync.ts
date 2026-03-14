import { useEffect, useRef, useState } from 'react';
import {
  subscribeToOrderChanges,
  subscribeToOrderItemChanges,
} from '@/services/realtimeService';

const DEFAULT_POLLING_INTERVAL_MS = 30_000;

export interface RealtimeSyncOptions {
  onUpdate: () => void;
  enabled?: boolean;
  pollingInterval?: number;
}

export interface RealtimeSyncResult {
  isConnected: boolean;
  lastUpdate: Date | null;
}

export function useRealtimeSync({
  onUpdate,
  enabled = true,
  pollingInterval = DEFAULT_POLLING_INTERVAL_MS,
}: RealtimeSyncOptions): RealtimeSyncResult {
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  const handleUpdate = () => {
    setLastUpdate(new Date());
    onUpdateRef.current();
  };

  const startPolling = () => {
    if (pollingRef.current) return;
    pollingRef.current = setInterval(handleUpdate, pollingInterval);
  };

  const stopPolling = () => {
    if (!pollingRef.current) return;
    clearInterval(pollingRef.current);
    pollingRef.current = null;
  };

  useEffect(() => {
    if (!enabled) return;

    let connected = false;

    const ordersSubscription = subscribeToOrderChanges(() => {
      if (!connected) {
        connected = true;
        setIsConnected(true);
        stopPolling();
      }
      handleUpdate();
    });

    const itemsSubscription = subscribeToOrderItemChanges(() => {
      if (!connected) {
        connected = true;
        setIsConnected(true);
        stopPolling();
      }
      handleUpdate();
    });

    // Start polling as fallback; cancel it once Realtime connects
    startPolling();

    // Give Realtime a moment to connect before assuming it failed
    const connectionTimeout = setTimeout(() => {
      if (!connected) {
        setIsConnected(false);
      }
    }, 5_000);

    return () => {
      ordersSubscription.unsubscribe();
      itemsSubscription.unsubscribe();
      stopPolling();
      clearTimeout(connectionTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, pollingInterval]);

  return { isConnected, lastUpdate };
}
