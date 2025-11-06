import { useEffect, useRef, useState } from 'react';

export interface DriftEvent {
  type?: string;
  file?: string;
  diff?: string;
  timestamp?: string;
  [key: string]: any;
}

/**
 * useDriftFeed
 *
 * Subscribes to the local Drift Map WebSocket feed (default ws://localhost:7070)
 * and returns a rolling buffer of the latest events.
 *
 * Env overrides (browser-time via NEXT_PUBLIC_*):
 * - NEXT_PUBLIC_DRIFT_WS_URL (default ws://localhost:7070)
 * - NEXT_PUBLIC_DRIFT_MAX_EVENTS (default 200)
 */
export function useDriftFeed() {
  const [events, setEvents] = useState<DriftEvent[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const url = process.env.NEXT_PUBLIC_DRIFT_WS_URL || 'ws://localhost:7070';
  const max = Number(process.env.NEXT_PUBLIC_DRIFT_MAX_EVENTS || 200);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const ws = new WebSocket(url);
    wsRef.current = ws;
    ws.onmessage = (e) => {
      try {
        const data: DriftEvent = JSON.parse(String(e.data || '{}'));
        setEvents((prev) => [...prev.slice(-Math.max(1, max - 1)), data]);
      } catch (_) {
        // ignore malformed
      }
    };
    ws.onerror = () => {
      // swallow
    };
    return () => {
      try {
        ws.close();
      } catch (_) {}
      wsRef.current = null;
    };
  }, [url, max]);

  return events;
}

export default useDriftFeed;

