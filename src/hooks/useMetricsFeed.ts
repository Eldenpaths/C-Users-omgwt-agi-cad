import { useEffect, useState } from "react";

export interface Metrics {
  timestamp: number;
  latencyT: number;
  fidelityH: number;
  costC: number;
  entropyE: number;
}

/**
 * Custom React Hook
 * Fetches /api/metrics every `intervalMs` (default 1000)
 * and returns the latest metrics object.
 */
export function useMetricsFeed(intervalMs: number = 1000) {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    const fetchMetrics = async () => {
      try {
        const res = await fetch("/api/metrics");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: Metrics = await res.json();
        setMetrics(data);
        setError(null);
      } catch (err: any) {
        setError(err.message);
      }
      timer = setTimeout(fetchMetrics, intervalMs);
    };

    fetchMetrics();

    return () => clearTimeout(timer);
  }, [intervalMs]);

  return { metrics, error };
}
