import { getDbInstance } from '../firebase/client';
import { collection, addDoc, query, where, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';

export interface NexusMetric {
  agentId: string;
  agentName: string;
  metricType: 'context_score' | 'response_time' | 'error' | 'token_usage' | 'cost';
  value: number;
  metadata?: Record<string, any>;
  timestamp: Date;
}

export interface AgentPerformance {
  agentId: string;
  agentName: string;
  totalRequests: number;
  avgResponseTime: number;
  avgContextScore: number;
  totalTokens: number;
  totalCost: number;
  errorCount: number;
  successRate: number;
  lastActive: Date;
}

export interface SystemHealth {
  activeAgents: number;
  totalRequests24h: number;
  avgResponseTime: number;
  errorRate: number;
  totalCost24h: number;
  peakUsageTime: string;
}

class NexusAnalytics {
  private metricsCache: NexusMetric[] = [];
  private cacheFlushInterval = 5000; // Flush every 5 seconds
  private flushTimer: NodeJS.Timeout | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.startCacheFlush();
    }
  }

  /**
   * Record a metric (cached and batched for performance)
   */
  async recordMetric(metric: Omit<NexusMetric, 'timestamp'>): Promise<void> {
    const fullMetric: NexusMetric = {
      ...metric,
      timestamp: new Date()
    };

    this.metricsCache.push(fullMetric);

    // Flush immediately if cache is large
    if (this.metricsCache.length >= 50) {
      await this.flushMetrics();
    }
  }

  /**
   * Flush cached metrics to Firestore
   */
  private async flushMetrics(): Promise<void> {
    if (this.metricsCache.length === 0) return;

    let db;
    try {
      db = getDbInstance();
    } catch (error) {
      return;
    }

    const metricsToFlush = [...this.metricsCache];
    this.metricsCache = [];

    try {
      const batch = metricsToFlush.map(metric =>
        addDoc(collection(db, 'nexus_metrics'), {
          ...metric,
          timestamp: Timestamp.fromDate(metric.timestamp)
        })
      );

      await Promise.all(batch);
      console.log(`✅ Flushed ${metricsToFlush.length} metrics to Firestore`);
    } catch (error) {
      console.error('❌ Failed to flush metrics:', error);
      // Re-add failed metrics to cache
      this.metricsCache.unshift(...metricsToFlush);
    }
  }

  /**
   * Start periodic cache flush
   */
  private startCacheFlush(): void {
    this.flushTimer = setInterval(() => {
      this.flushMetrics();
    }, this.cacheFlushInterval);
  }

  /**
   * Stop cache flush timer
   */
  stopCacheFlush(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  /**
   * Get agent performance metrics
   */
  async getAgentPerformance(agentId: string, hours: number = 24): Promise<AgentPerformance | null> {
    let db;
    try {
      db = getDbInstance();
    } catch (error) {
      return null;
    }

    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);

    try {
      const q = query(
        collection(db, 'nexus_metrics'),
        where('agentId', '==', agentId),
        where('timestamp', '>=', Timestamp.fromDate(cutoffTime)),
        orderBy('timestamp', 'desc')
      );

      const snapshot = await getDocs(q);
      const metrics = snapshot.docs.map(doc => ({
        ...doc.data(),
        timestamp: doc.data().timestamp.toDate()
      })) as NexusMetric[];

      if (metrics.length === 0) return null;

      // Aggregate metrics
      const responseTimes = metrics.filter(m => m.metricType === 'response_time');
      const contextScores = metrics.filter(m => m.metricType === 'context_score');
      const tokenUsage = metrics.filter(m => m.metricType === 'token_usage');
      const costs = metrics.filter(m => m.metricType === 'cost');
      const errors = metrics.filter(m => m.metricType === 'error');

      const totalRequests = responseTimes.length;
      const avgResponseTime = responseTimes.reduce((sum, m) => sum + m.value, 0) / (totalRequests || 1);
      const avgContextScore = contextScores.reduce((sum, m) => sum + m.value, 0) / (contextScores.length || 1);
      const totalTokens = tokenUsage.reduce((sum, m) => sum + m.value, 0);
      const totalCost = costs.reduce((sum, m) => sum + m.value, 0);
      const errorCount = errors.length;
      const successRate = totalRequests > 0 ? ((totalRequests - errorCount) / totalRequests) * 100 : 100;

      return {
        agentId,
        agentName: metrics[0]?.agentName || agentId,
        totalRequests,
        avgResponseTime,
        avgContextScore,
        totalTokens,
        totalCost,
        errorCount,
        successRate,
        lastActive: metrics[0].timestamp
      };
    } catch (error) {
      console.error('Error fetching agent performance:', error);
      return null;
    }
  }

  /**
   * Get system health metrics
   */
  async getSystemHealth(hours: number = 24): Promise<SystemHealth | null> {
    let db;
    try {
      db = getDbInstance();
    } catch (error) {
      return null;
    }

    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);

    try {
      const q = query(
        collection(db, 'nexus_metrics'),
        where('timestamp', '>=', Timestamp.fromDate(cutoffTime)),
        orderBy('timestamp', 'desc')
      );

      const snapshot = await getDocs(q);
      const metrics = snapshot.docs.map(doc => ({
        ...doc.data(),
        timestamp: doc.data().timestamp.toDate()
      })) as NexusMetric[];

      if (metrics.length === 0) {
        return {
          activeAgents: 0,
          totalRequests24h: 0,
          avgResponseTime: 0,
          errorRate: 0,
          totalCost24h: 0,
          peakUsageTime: 'N/A'
        };
      }

      // Calculate metrics
      const uniqueAgents = new Set(metrics.map(m => m.agentId)).size;
      const responseTimes = metrics.filter(m => m.metricType === 'response_time');
      const totalRequests = responseTimes.length;
      const avgResponseTime = responseTimes.reduce((sum, m) => sum + m.value, 0) / (totalRequests || 1);
      const errors = metrics.filter(m => m.metricType === 'error');
      const errorRate = totalRequests > 0 ? (errors.length / totalRequests) * 100 : 0;
      const costs = metrics.filter(m => m.metricType === 'cost');
      const totalCost = costs.reduce((sum, m) => sum + m.value, 0);

      // Find peak usage hour
      const hourCounts = new Map<number, number>();
      metrics.forEach(m => {
        const hour = m.timestamp.getHours();
        hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
      });

      let peakHour = 0;
      let maxCount = 0;
      hourCounts.forEach((count, hour) => {
        if (count > maxCount) {
          maxCount = count;
          peakHour = hour;
        }
      });

      const peakUsageTime = `${peakHour.toString().padStart(2, '0')}:00 - ${((peakHour + 1) % 24).toString().padStart(2, '0')}:00`;

      return {
        activeAgents: uniqueAgents,
        totalRequests24h: totalRequests,
        avgResponseTime: Math.round(avgResponseTime),
        errorRate: Math.round(errorRate * 10) / 10,
        totalCost24h: Math.round(totalCost * 100) / 100,
        peakUsageTime
      };
    } catch (error) {
      console.error('Error fetching system health:', error);
      return null;
    }
  }

  /**
   * Get recent metrics for an agent
   */
  async getRecentMetrics(agentId: string, count: number = 100): Promise<NexusMetric[]> {
    let db;
    try {
      db = getDbInstance();
    } catch (error) {
      return [];
    }

    try {
      const q = query(
        collection(db, 'nexus_metrics'),
        where('agentId', '==', agentId),
        orderBy('timestamp', 'desc'),
        limit(count)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        ...doc.data(),
        timestamp: doc.data().timestamp.toDate()
      })) as NexusMetric[];
    } catch (error) {
      console.error('Error fetching recent metrics:', error);
      return [];
    }
  }

  /**
   * Get top performing agents
   */
  async getTopAgents(limit: number = 10): Promise<AgentPerformance[]> {
    let db;
    try {
      db = getDbInstance();
    } catch (error) {
      return [];
    }

    try {
      const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const q = query(
        collection(db, 'nexus_metrics'),
        where('timestamp', '>=', Timestamp.fromDate(cutoffTime)),
        orderBy('timestamp', 'desc')
      );

      const snapshot = await getDocs(q);
      const metrics = snapshot.docs.map(doc => ({
        ...doc.data(),
        timestamp: doc.data().timestamp.toDate()
      })) as NexusMetric[];

      // Group by agent
      const agentMetrics = new Map<string, NexusMetric[]>();
      metrics.forEach(metric => {
        const existing = agentMetrics.get(metric.agentId) || [];
        existing.push(metric);
        agentMetrics.set(metric.agentId, existing);
      });

      // Calculate performance for each agent
      const performances: AgentPerformance[] = [];
      for (const [agentId, agentMetricList] of agentMetrics) {
        const responseTimes = agentMetricList.filter(m => m.metricType === 'response_time');
        const contextScores = agentMetricList.filter(m => m.metricType === 'context_score');
        const tokenUsage = agentMetricList.filter(m => m.metricType === 'token_usage');
        const costs = agentMetricList.filter(m => m.metricType === 'cost');
        const errors = agentMetricList.filter(m => m.metricType === 'error');

        const totalRequests = responseTimes.length;
        if (totalRequests === 0) continue;

        performances.push({
          agentId,
          agentName: agentMetricList[0]?.agentName || agentId,
          totalRequests,
          avgResponseTime: responseTimes.reduce((sum, m) => sum + m.value, 0) / totalRequests,
          avgContextScore: contextScores.reduce((sum, m) => sum + m.value, 0) / (contextScores.length || 1),
          totalTokens: tokenUsage.reduce((sum, m) => sum + m.value, 0),
          totalCost: costs.reduce((sum, m) => sum + m.value, 0),
          errorCount: errors.length,
          successRate: ((totalRequests - errors.length) / totalRequests) * 100,
          lastActive: agentMetricList[0].timestamp
        });
      }

      // Sort by total requests and return top N
      return performances
        .sort((a, b) => b.totalRequests - a.totalRequests)
        .slice(0, limit);
    } catch (error) {
      console.error('Error fetching top agents:', error);
      return [];
    }
  }
}

// Singleton instance
export const nexusAnalytics = new NexusAnalytics();

/**
 * Standalone function to log Nexus routing metrics
 * Used for Phase 12A telemetry after AI routing decisions
 */
export async function logNexusMetric(params: {
  agentId: string;
  agentName: string;
  model: string;
  tokenEstimate: number;
  cost: number;
  latency: number;
  complexity: number;
  strategy?: string;
  success?: boolean;
}): Promise<void> {
  const {
    agentId,
    agentName,
    model,
    tokenEstimate,
    cost,
    latency,
    complexity,
    strategy,
    success = true
  } = params;

  // Record multiple metrics for comprehensive tracking
  await Promise.all([
    // Response time metric
    nexusAnalytics.recordMetric({
      agentId,
      agentName,
      metricType: 'response_time',
      value: latency,
      metadata: { model, strategy, success }
    }),

    // Token usage metric
    nexusAnalytics.recordMetric({
      agentId,
      agentName,
      metricType: 'token_usage',
      value: tokenEstimate,
      metadata: { model, strategy, success }
    }),

    // Cost metric
    nexusAnalytics.recordMetric({
      agentId,
      agentName,
      metricType: 'cost',
      value: cost,
      metadata: { model, strategy, success }
    }),

    // Context score metric (using complexity as a proxy)
    nexusAnalytics.recordMetric({
      agentId,
      agentName,
      metricType: 'context_score',
      value: complexity,
      metadata: { model, strategy, success }
    })
  ]);

  console.log(`📊 [Phase 12A] Logged metrics for ${agentName} (${model}): cost=$${cost.toFixed(4)}, latency=${latency}ms, complexity=${complexity.toFixed(3)}`);
}
