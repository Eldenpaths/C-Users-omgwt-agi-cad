// CLAUDE-META: AGI-CAD AI Nexus - Free Tier Optimizer
// Architect: Claude Code (Sonnet 4.5)
// Purpose: Optimize usage of free-tier AI providers
// Status: Production - Phase 11.2

/**
 * Provider Usage Stats
 */
export interface ProviderUsageStats {
  providerId: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  avgLatency: number;
  successRate: number;
  lastUsed: Date;
  cooldownUntil?: Date;
}

/**
 * Optimization Recommendation
 */
export interface OptimizationRecommendation {
  preferredProviders: string[];
  avoidProviders: string[];
  reasoning: string;
  estimatedSavings: number; // in USD
  confidence: number;
}

/**
 * Free Tier Optimizer Configuration
 */
export interface FreeTierConfig {
  rateLimits: Map<string, {
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerDay: number;
  }>;
  cooldownPeriod: number; // milliseconds after failure
  successThreshold: number; // minimum success rate to recommend
  maxRetries: number;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: FreeTierConfig = {
  rateLimits: new Map([
    ['grok', { requestsPerMinute: 5, requestsPerHour: 100, requestsPerDay: 1000 }],
    ['gemini', { requestsPerMinute: 10, requestsPerHour: 200, requestsPerDay: 2000 }],
    ['perplexity', { requestsPerMinute: 6, requestsPerHour: 120, requestsPerDay: 1200 }]
  ]),
  cooldownPeriod: 60000, // 1 minute
  successThreshold: 0.7,
  maxRetries: 3
};

/**
 * Free Tier Optimizer
 * Optimizes usage of free-tier AI providers to maximize cost savings
 */
export class FreeTierOptimizer {
  private config: FreeTierConfig;
  private providerStats: Map<string, ProviderUsageStats> = new Map();
  private requestLog: Map<string, Date[]> = new Map(); // provider -> request timestamps

  constructor(config: Partial<FreeTierConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initializeProviderStats();
  }

  /**
   * Initialize provider stats
   */
  private initializeProviderStats(): void {
    const providers = ['grok', 'gemini', 'perplexity'];

    for (const providerId of providers) {
      this.providerStats.set(providerId, {
        providerId,
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        avgLatency: 0,
        successRate: 1.0,
        lastUsed: new Date(0)
      });

      this.requestLog.set(providerId, []);
    }
  }

  /**
   * Get optimization recommendation
   */
  getRecommendation(taskComplexity: number): OptimizationRecommendation {
    const now = new Date();
    const preferredProviders: string[] = [];
    const avoidProviders: string[] = [];

    // Analyze each provider
    for (const [providerId, stats] of this.providerStats) {
      // Check if in cooldown
      if (stats.cooldownUntil && stats.cooldownUntil > now) {
        avoidProviders.push(providerId);
        continue;
      }

      // Check rate limits
      if (this.isRateLimited(providerId)) {
        avoidProviders.push(providerId);
        continue;
      }

      // Check success rate
      if (stats.successRate < this.config.successThreshold && stats.totalRequests > 5) {
        avoidProviders.push(providerId);
        continue;
      }

      // Good candidate
      preferredProviders.push(providerId);
    }

    // Sort preferred providers by success rate and latency
    preferredProviders.sort((a, b) => {
      const statsA = this.providerStats.get(a)!;
      const statsB = this.providerStats.get(b)!;

      // Prioritize success rate
      if (statsA.successRate !== statsB.successRate) {
        return statsB.successRate - statsA.successRate;
      }

      // Then latency
      return statsA.avgLatency - statsB.avgLatency;
    });

    // Calculate estimated savings
    const estimatedSavings = this.calculateSavings(preferredProviders.length);

    // Generate reasoning
    const reasoning = this.generateRecommendationReasoning({
      preferredProviders,
      avoidProviders,
      taskComplexity
    });

    // Confidence based on data quality
    const confidence = this.calculateRecommendationConfidence();

    return {
      preferredProviders,
      avoidProviders,
      reasoning,
      estimatedSavings,
      confidence
    };
  }

  /**
   * Check if provider is rate limited
   */
  private isRateLimited(providerId: string): boolean {
    const limits = this.config.rateLimits.get(providerId);
    if (!limits) return false;

    const log = this.requestLog.get(providerId) || [];
    const now = Date.now();

    // Check per-minute limit
    const lastMinute = log.filter(timestamp => now - timestamp.getTime() < 60000);
    if (lastMinute.length >= limits.requestsPerMinute) {
      return true;
    }

    // Check per-hour limit
    const lastHour = log.filter(timestamp => now - timestamp.getTime() < 3600000);
    if (lastHour.length >= limits.requestsPerHour) {
      return true;
    }

    // Check per-day limit
    const lastDay = log.filter(timestamp => now - timestamp.getTime() < 86400000);
    if (lastDay.length >= limits.requestsPerDay) {
      return true;
    }

    return false;
  }

  /**
   * Record request
   */
  recordRequest(providerId: string, success: boolean, latency: number): void {
    const stats = this.providerStats.get(providerId);
    if (!stats) return;

    // Update stats
    stats.totalRequests++;
    if (success) {
      stats.successfulRequests++;
    } else {
      stats.failedRequests++;

      // Set cooldown after failure
      stats.cooldownUntil = new Date(Date.now() + this.config.cooldownPeriod);
    }

    // Update success rate
    stats.successRate = stats.successfulRequests / stats.totalRequests;

    // Update average latency
    stats.avgLatency = (stats.avgLatency * (stats.totalRequests - 1) + latency) / stats.totalRequests;

    // Update last used
    stats.lastUsed = new Date();

    // Add to request log
    const log = this.requestLog.get(providerId) || [];
    log.push(new Date());

    // Trim old entries (keep last 24 hours)
    const oneDayAgo = Date.now() - 86400000;
    this.requestLog.set(
      providerId,
      log.filter(timestamp => timestamp.getTime() > oneDayAgo)
    );
  }

  /**
   * Calculate estimated savings
   */
  private calculateSavings(freeProviderCount: number): number {
    // Assume each free request saves ~$0.003 (Claude cost)
    const avgRequestsPerDay = 100;
    const savingsPerRequest = 0.003;

    return freeProviderCount * avgRequestsPerDay * savingsPerRequest;
  }

  /**
   * Generate recommendation reasoning
   */
  private generateRecommendationReasoning(data: {
    preferredProviders: string[];
    avoidProviders: string[];
    taskComplexity: number;
  }): string {
    if (data.preferredProviders.length === 0) {
      return 'No free-tier providers available due to rate limits or cooldowns. Use paid tier.';
    }

    const parts: string[] = [];

    if (data.preferredProviders.length > 0) {
      parts.push(`Recommended: ${data.preferredProviders.join(', ')}`);
    }

    if (data.avoidProviders.length > 0) {
      parts.push(`Avoid: ${data.avoidProviders.join(', ')} (rate limited or poor performance)`);
    }

    if (data.taskComplexity > 0.7) {
      parts.push('Note: High complexity task may require paid tier fallback');
    }

    return parts.join('. ');
  }

  /**
   * Calculate recommendation confidence
   */
  private calculateRecommendationConfidence(): number {
    let totalRequests = 0;

    for (const stats of this.providerStats.values()) {
      totalRequests += stats.totalRequests;
    }

    // More historical data = higher confidence
    if (totalRequests > 100) return 0.95;
    if (totalRequests > 50) return 0.85;
    if (totalRequests > 20) return 0.75;
    if (totalRequests > 10) return 0.65;
    return 0.5; // Low confidence with little data
  }

  /**
   * Get provider stats
   */
  getProviderStats(providerId: string): ProviderUsageStats | undefined {
    return this.providerStats.get(providerId);
  }

  /**
   * Get all stats
   */
  getAllStats(): ProviderUsageStats[] {
    return Array.from(this.providerStats.values());
  }

  /**
   * Reset provider stats
   */
  resetStats(providerId?: string): void {
    if (providerId) {
      const stats = this.providerStats.get(providerId);
      if (stats) {
        stats.totalRequests = 0;
        stats.successfulRequests = 0;
        stats.failedRequests = 0;
        stats.avgLatency = 0;
        stats.successRate = 1.0;
        stats.lastUsed = new Date(0);
        delete stats.cooldownUntil;
      }

      this.requestLog.set(providerId, []);
    } else {
      this.initializeProviderStats();
    }
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<FreeTierConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

// Export singleton instance
let optimizer: FreeTierOptimizer | null = null;

/**
 * Get or create optimizer instance
 */
export function getFreeTierOptimizer(config?: Partial<FreeTierConfig>): FreeTierOptimizer {
  if (!optimizer) {
    optimizer = new FreeTierOptimizer(config);
  } else if (config) {
    optimizer.updateConfig(config);
  }
  return optimizer;
}

export default FreeTierOptimizer;
