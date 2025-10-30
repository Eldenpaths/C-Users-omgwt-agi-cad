import { useEffect, useCallback, useRef, useState } from 'react';
import { nexusAnalytics, NexusMetric, AgentPerformance, SystemHealth } from './nexus-analytics';

export interface TelemetryConfig {
  agentId?: string;
  agentName?: string;
  enableAutoTracking?: boolean;
  trackInterval?: number; // ms
}

export interface UseTelemetryReturn {
  recordMetric: (type: NexusMetric['metricType'], value: number, metadata?: Record<string, any>) => Promise<void>;
  recordContextScore: (score: number, metadata?: Record<string, any>) => Promise<void>;
  recordResponseTime: (timeMs: number, metadata?: Record<string, any>) => Promise<void>;
  recordError: (error: Error | string, metadata?: Record<string, any>) => Promise<void>;
  recordTokenUsage: (tokens: number, metadata?: Record<string, any>) => Promise<void>;
  recordCost: (cost: number, metadata?: Record<string, any>) => Promise<void>;
  startTimer: () => () => Promise<void>;
  performance: AgentPerformance | null;
  isTracking: boolean;
}

/**
 * React hook for telemetry tracking
 *
 * @example
 * ```tsx
 * const { recordContextScore, recordResponseTime, startTimer } = useTelemetry({
 *   agentId: 'agent-123',
 *   agentName: 'NexusAgent',
 *   enableAutoTracking: true
 * });
 *
 * // Track context score
 * await recordContextScore(0.95, { prompt: 'user query' });
 *
 * // Track response time with timer
 * const stopTimer = startTimer();
 * // ... do work ...
 * await stopTimer(); // Records response time automatically
 * ```
 */
export function useTelemetry(config: TelemetryConfig = {}): UseTelemetryReturn {
  const {
    agentId,
    agentName,
    enableAutoTracking = false,
    trackInterval = 30000 // 30 seconds
  } = config;

  const [performance, setPerformance] = useState<AgentPerformance | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const trackingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Record a generic metric
   */
  const recordMetric = useCallback(async (
    type: NexusMetric['metricType'],
    value: number,
    metadata?: Record<string, any>
  ): Promise<void> => {
    if (!agentId || !agentName) {
      console.warn('useTelemetry: agentId and agentName required to record metrics');
      return;
    }

    try {
      await nexusAnalytics.recordMetric({
        agentId,
        agentName,
        metricType: type,
        value,
        metadata
      });
    } catch (error) {
      console.error('Failed to record metric:', error);
    }
  }, [agentId, agentName]);

  /**
   * Record context score
   */
  const recordContextScore = useCallback(async (
    score: number,
    metadata?: Record<string, any>
  ): Promise<void> => {
    await recordMetric('context_score', score, metadata);
  }, [recordMetric]);

  /**
   * Record response time
   */
  const recordResponseTime = useCallback(async (
    timeMs: number,
    metadata?: Record<string, any>
  ): Promise<void> => {
    await recordMetric('response_time', timeMs, metadata);
  }, [recordMetric]);

  /**
   * Record error
   */
  const recordError = useCallback(async (
    error: Error | string,
    metadata?: Record<string, any>
  ): Promise<void> => {
    const errorMessage = error instanceof Error ? error.message : error;
    const errorStack = error instanceof Error ? error.stack : undefined;

    await recordMetric('error', 1, {
      message: errorMessage,
      stack: errorStack,
      ...metadata
    });
  }, [recordMetric]);

  /**
   * Record token usage
   */
  const recordTokenUsage = useCallback(async (
    tokens: number,
    metadata?: Record<string, any>
  ): Promise<void> => {
    await recordMetric('token_usage', tokens, metadata);
  }, [recordMetric]);

  /**
   * Record cost
   */
  const recordCost = useCallback(async (
    cost: number,
    metadata?: Record<string, any>
  ): Promise<void> => {
    await recordMetric('cost', cost, metadata);
  }, [recordMetric]);

  /**
   * Start a timer for response time tracking
   * Returns a function that stops the timer and records the elapsed time
   */
  const startTimer = useCallback((): (() => Promise<void>) => {
    const startTime = Date.now();

    return async () => {
      const elapsedMs = Date.now() - startTime;
      await recordResponseTime(elapsedMs);
    };
  }, [recordResponseTime]);

  /**
   * Fetch and update performance metrics
   */
  const updatePerformance = useCallback(async () => {
    if (!agentId) return;

    try {
      const perf = await nexusAnalytics.getAgentPerformance(agentId, 24);
      setPerformance(perf);
    } catch (error) {
      console.error('Failed to fetch agent performance:', error);
    }
  }, [agentId]);

  /**
   * Start auto-tracking
   */
  useEffect(() => {
    if (!enableAutoTracking || !agentId) return;

    setIsTracking(true);

    // Initial fetch
    updatePerformance();

    // Periodic updates
    trackingIntervalRef.current = setInterval(updatePerformance, trackInterval);

    return () => {
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current);
        trackingIntervalRef.current = null;
      }
      setIsTracking(false);
    };
  }, [enableAutoTracking, agentId, trackInterval, updatePerformance]);

  return {
    recordMetric,
    recordContextScore,
    recordResponseTime,
    recordError,
    recordTokenUsage,
    recordCost,
    startTimer,
    performance,
    isTracking
  };
}

/**
 * Hook for system-wide health monitoring
 */
export function useSystemHealth(refreshInterval: number = 30000) {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const systemHealth = await nexusAnalytics.getSystemHealth(24);
      setHealth(systemHealth);
    } catch (err) {
      console.error('Failed to fetch system health:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, refreshInterval);

    return () => clearInterval(interval);
  }, [fetchHealth, refreshInterval]);

  return { health, isLoading, error, refresh: fetchHealth };
}

/**
 * Hook for top agents monitoring
 */
export function useTopAgents(limit: number = 10, refreshInterval: number = 60000) {
  const [agents, setAgents] = useState<AgentPerformance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTopAgents = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const topAgents = await nexusAnalytics.getTopAgents(limit);
      setAgents(topAgents);
    } catch (err) {
      console.error('Failed to fetch top agents:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchTopAgents();
    const interval = setInterval(fetchTopAgents, refreshInterval);

    return () => clearInterval(interval);
  }, [fetchTopAgents, refreshInterval]);

  return { agents, isLoading, error, refresh: fetchTopAgents };
}

/**
 * Hook for tracking API call metrics
 */
export function useApiTracking(agentId: string, agentName: string) {
  const { recordResponseTime, recordTokenUsage, recordCost, recordError, startTimer } = useTelemetry({
    agentId,
    agentName
  });

  /**
   * Wrap an API call with automatic metric tracking
   */
  const trackApiCall = useCallback(async <T,>(
    apiCall: () => Promise<T>,
    options?: {
      estimateTokens?: (result: T) => number;
      estimateCost?: (result: T) => number;
    }
  ): Promise<T> => {
    const stopTimer = startTimer();

    try {
      const result = await apiCall();

      // Record response time
      await stopTimer();

      // Record tokens if estimator provided
      if (options?.estimateTokens) {
        const tokens = options.estimateTokens(result);
        await recordTokenUsage(tokens);
      }

      // Record cost if estimator provided
      if (options?.estimateCost) {
        const cost = options.estimateCost(result);
        await recordCost(cost);
      }

      return result;
    } catch (error) {
      await stopTimer();
      await recordError(error as Error);
      throw error;
    }
  }, [startTimer, recordTokenUsage, recordCost, recordError]);

  return { trackApiCall };
}
