// CLAUDE-META: AGI-CAD Phase 12B - Adaptive Scaler
// Purpose: Dynamically adjust AI routing based on performance metrics
// Architect: Claude Code (Sonnet 4.5)

import { getAlertManager, AlertType } from './alert-manager';
import { nexusAnalytics, SystemHealth } from './nexus-analytics';
import { getAIRouter } from '../ai/nexus/ai-router';

/**
 * Scaling strategy
 */
export type ScalingStrategy = 'cost_optimized' | 'balanced' | 'performance_optimized';

/**
 * Scaling decision
 */
export interface ScalingDecision {
  timestamp: Date;
  previousStrategy: ScalingStrategy;
  newStrategy: ScalingStrategy;
  reason: string;
  metrics: {
    errorRate: number;
    avgResponseTime: number;
    cost: number;
    successRate: number;
  };
  action: 'scale_up' | 'scale_down' | 'maintain';
}

/**
 * Scaling configuration
 */
export interface ScalingConfig {
  enabled: boolean;
  checkIntervalSeconds: number;

  // Thresholds for scaling up (to performance)
  scaleUpThresholds: {
    errorRate: number; // % - scale up if errors exceed
    avgResponseTime: number; // ms - scale up if response time exceeds
    consecutiveFailures: number; // count - scale up after N failures
  };

  // Thresholds for scaling down (to cost)
  scaleDownThresholds: {
    errorRate: number; // % - scale down if errors below
    avgResponseTime: number; // ms - scale down if response time below
    consecutiveSuccesses: number; // count - scale down after N successes
    lowCostPeriodMinutes: number; // minutes of good performance before scaling down
  };

  // Strategy preferences
  preferredStrategy: ScalingStrategy;
  minTimeInStrategyMinutes: number; // Minimum time before switching strategies
}

/**
 * AdaptiveScaler
 * Monitors system metrics and adjusts AI routing strategy dynamically
 */
export class AdaptiveScaler {
  private config: ScalingConfig;
  private currentStrategy: ScalingStrategy;
  private scalingHistory: ScalingDecision[] = [];
  private monitoringInterval: NodeJS.Timeout | null = null;
  private isRunning = false;
  private lastStrategyChange: Date | null = null;
  private consecutiveMetrics: {
    failures: number;
    successes: number;
    goodPerformancePeriodStart: Date | null;
  } = {
    failures: 0,
    successes: 0,
    goodPerformancePeriodStart: null
  };

  constructor(config?: Partial<ScalingConfig>) {
    this.config = {
      enabled: true,
      checkIntervalSeconds: 60, // Check every minute
      scaleUpThresholds: {
        errorRate: 15, // 15% errors
        avgResponseTime: 8000, // 8 seconds
        consecutiveFailures: 3
      },
      scaleDownThresholds: {
        errorRate: 2, // 2% errors
        avgResponseTime: 2000, // 2 seconds
        consecutiveSuccesses: 10,
        lowCostPeriodMinutes: 30
      },
      preferredStrategy: 'balanced',
      minTimeInStrategyMinutes: 10,
      ...config
    };

    this.currentStrategy = this.config.preferredStrategy;
  }

  /**
   * Start adaptive scaling
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.warn('[AdaptiveScaler] Already running');
      return;
    }

    if (!this.config.enabled) {
      console.warn('[AdaptiveScaler] Disabled in configuration');
      return;
    }

    this.isRunning = true;
    console.log('[AdaptiveScaler] Starting adaptive scaling...');

    // Set initial strategy in AI Router
    this.applyStrategy(this.currentStrategy);

    // Monitor and adjust strategy
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.evaluateAndScale();
      } catch (error) {
        console.error('[AdaptiveScaler] Error during evaluation:', error);
      }
    }, this.config.checkIntervalSeconds * 1000);

    // Initial evaluation
    await this.evaluateAndScale();

    console.log('[AdaptiveScaler] Adaptive scaling started');
  }

  /**
   * Stop adaptive scaling
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    console.log('[AdaptiveScaler] Stopping adaptive scaling...');

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    this.isRunning = false;
    console.log('[AdaptiveScaler] Adaptive scaling stopped');
  }

  /**
   * Evaluate metrics and scale if needed
   */
  private async evaluateAndScale(): Promise<void> {
    const health = await nexusAnalytics.getSystemHealth(1); // Last hour
    if (!health) {
      console.warn('[AdaptiveScaler] No health data available');
      return;
    }

    const successRate = 100 - health.errorRate;
    const metrics = {
      errorRate: health.errorRate,
      avgResponseTime: health.avgResponseTime,
      cost: health.totalCost24h,
      successRate
    };

    // Determine if we should scale
    const decision = this.determineScalingDecision(metrics);

    if (decision.action !== 'maintain' && decision.newStrategy !== this.currentStrategy) {
      // Check if enough time has passed since last strategy change
      if (this.lastStrategyChange) {
        const minutesSinceChange = (Date.now() - this.lastStrategyChange.getTime()) / 1000 / 60;
        if (minutesSinceChange < this.config.minTimeInStrategyMinutes) {
          console.log(`[AdaptiveScaler] Skipping strategy change (min time not met: ${minutesSinceChange.toFixed(1)}/${this.config.minTimeInStrategyMinutes} minutes)`);
          return;
        }
      }

      // Apply the new strategy
      console.log(`[AdaptiveScaler] Scaling ${decision.action}: ${decision.previousStrategy} → ${decision.newStrategy}`);
      console.log(`[AdaptiveScaler] Reason: ${decision.reason}`);

      this.applyStrategy(decision.newStrategy);
      this.currentStrategy = decision.newStrategy;
      this.lastStrategyChange = new Date();

      // Record decision
      this.scalingHistory.push(decision);
      if (this.scalingHistory.length > 100) {
        this.scalingHistory.shift();
      }

      // Log to console with metrics
      console.log(`[AdaptiveScaler] Current metrics: error=${metrics.errorRate.toFixed(1)}%, response=${metrics.avgResponseTime}ms, success=${metrics.successRate.toFixed(1)}%`);
    }

    // Update consecutive metrics tracking
    this.updateConsecutiveMetrics(metrics);
  }

  /**
   * Determine scaling decision based on metrics
   */
  private determineScalingDecision(metrics: {
    errorRate: number;
    avgResponseTime: number;
    cost: number;
    successRate: number;
  }): ScalingDecision {
    const previousStrategy = this.currentStrategy;
    let newStrategy = this.currentStrategy;
    let action: 'scale_up' | 'scale_down' | 'maintain' = 'maintain';
    let reason = 'Metrics within acceptable range';

    // Check for scale-up conditions (move toward performance)
    if (
      metrics.errorRate > this.config.scaleUpThresholds.errorRate ||
      metrics.avgResponseTime > this.config.scaleUpThresholds.avgResponseTime ||
      this.consecutiveMetrics.failures >= this.config.scaleUpThresholds.consecutiveFailures
    ) {
      if (this.currentStrategy === 'cost_optimized') {
        newStrategy = 'balanced';
        action = 'scale_up';
        reason = `High error rate (${metrics.errorRate.toFixed(1)}%) or slow response (${metrics.avgResponseTime}ms)`;
      } else if (this.currentStrategy === 'balanced') {
        newStrategy = 'performance_optimized';
        action = 'scale_up';
        reason = `Critical performance issues - error rate: ${metrics.errorRate.toFixed(1)}%, response time: ${metrics.avgResponseTime}ms`;
      }
      // Reset good performance tracking
      this.consecutiveMetrics.goodPerformancePeriodStart = null;
    }

    // Check for scale-down conditions (move toward cost optimization)
    else if (
      metrics.errorRate < this.config.scaleDownThresholds.errorRate &&
      metrics.avgResponseTime < this.config.scaleDownThresholds.avgResponseTime &&
      this.consecutiveMetrics.successes >= this.config.scaleDownThresholds.consecutiveSuccesses
    ) {
      // Check if we've had good performance for long enough
      if (this.consecutiveMetrics.goodPerformancePeriodStart) {
        const minutesOfGoodPerformance =
          (Date.now() - this.consecutiveMetrics.goodPerformancePeriodStart.getTime()) / 1000 / 60;

        if (minutesOfGoodPerformance >= this.config.scaleDownThresholds.lowCostPeriodMinutes) {
          if (this.currentStrategy === 'performance_optimized') {
            newStrategy = 'balanced';
            action = 'scale_down';
            reason = `Stable performance for ${minutesOfGoodPerformance.toFixed(0)} minutes - error rate: ${metrics.errorRate.toFixed(1)}%`;
          } else if (this.currentStrategy === 'balanced') {
            newStrategy = 'cost_optimized';
            action = 'scale_down';
            reason = `Excellent performance for ${minutesOfGoodPerformance.toFixed(0)} minutes - optimizing for cost`;
          }
        }
      } else {
        // Start tracking good performance period
        this.consecutiveMetrics.goodPerformancePeriodStart = new Date();
      }
    }

    return {
      timestamp: new Date(),
      previousStrategy,
      newStrategy,
      reason,
      metrics,
      action
    };
  }

  /**
   * Update consecutive metrics tracking
   */
  private updateConsecutiveMetrics(metrics: { errorRate: number; avgResponseTime: number }): void {
    const isGoodPerformance =
      metrics.errorRate < this.config.scaleDownThresholds.errorRate &&
      metrics.avgResponseTime < this.config.scaleDownThresholds.avgResponseTime;

    const isBadPerformance =
      metrics.errorRate > this.config.scaleUpThresholds.errorRate ||
      metrics.avgResponseTime > this.config.scaleUpThresholds.avgResponseTime;

    if (isGoodPerformance) {
      this.consecutiveMetrics.successes++;
      this.consecutiveMetrics.failures = 0;

      if (!this.consecutiveMetrics.goodPerformancePeriodStart) {
        this.consecutiveMetrics.goodPerformancePeriodStart = new Date();
      }
    } else if (isBadPerformance) {
      this.consecutiveMetrics.failures++;
      this.consecutiveMetrics.successes = 0;
      this.consecutiveMetrics.goodPerformancePeriodStart = null;
    } else {
      // Neutral - maintain counts but don't reset good performance period
      this.consecutiveMetrics.failures = 0;
    }
  }

  /**
   * Apply scaling strategy to AI Router
   */
  private applyStrategy(strategy: ScalingStrategy): void {
    const router = getAIRouter();

    switch (strategy) {
      case 'cost_optimized':
        // Prefer free models, disable expensive models
        router.setProviderAvailability('claude', false);
        router.setProviderAvailability('gpt', false);
        console.log('[AdaptiveScaler] Applied COST_OPTIMIZED strategy (free models only)');
        break;

      case 'balanced':
        // Enable all models, let router decide
        router.setProviderAvailability('claude', true);
        router.setProviderAvailability('gpt', true);
        console.log('[AdaptiveScaler] Applied BALANCED strategy (hybrid routing)');
        break;

      case 'performance_optimized':
        // Prefer premium models for critical performance
        router.setProviderAvailability('claude', true);
        router.setProviderAvailability('gpt', true);
        console.log('[AdaptiveScaler] Applied PERFORMANCE_OPTIMIZED strategy (premium models preferred)');
        break;
    }
  }

  /**
   * Get current strategy
   */
  getCurrentStrategy(): ScalingStrategy {
    return this.currentStrategy;
  }

  /**
   * Get scaling history
   */
  getScalingHistory(limit?: number): ScalingDecision[] {
    const history = [...this.scalingHistory].reverse();
    return limit ? history.slice(0, limit) : history;
  }

  /**
   * Get configuration
   */
  getConfig(): ScalingConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<ScalingConfig>): void {
    this.config = { ...this.config, ...updates };
    console.log('[AdaptiveScaler] Configuration updated');
  }

  /**
   * Force strategy change
   */
  setStrategy(strategy: ScalingStrategy): void {
    console.log(`[AdaptiveScaler] Manually setting strategy to: ${strategy}`);
    this.applyStrategy(strategy);
    this.currentStrategy = strategy;
    this.lastStrategyChange = new Date();
  }

  /**
   * Get running status
   */
  isActive(): boolean {
    return this.isRunning;
  }

  /**
   * Get consecutive metrics
   */
  getConsecutiveMetrics(): typeof AdaptiveScaler.prototype.consecutiveMetrics {
    return { ...this.consecutiveMetrics };
  }
}

// Singleton instance
let adaptiveScaler: AdaptiveScaler | null = null;

/**
 * Get or create adaptive scaler instance
 */
export function getAdaptiveScaler(config?: Partial<ScalingConfig>): AdaptiveScaler {
  if (!adaptiveScaler) {
    adaptiveScaler = new AdaptiveScaler(config);
  }
  return adaptiveScaler;
}

export default AdaptiveScaler;
