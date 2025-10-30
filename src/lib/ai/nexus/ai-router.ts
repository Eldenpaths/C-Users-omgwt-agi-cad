// CLAUDE-META: AGI-CAD AI Nexus - AI Router
// Architect: Claude Code (Sonnet 4.5)
// Purpose: Route tasks to optimal AI models with cost optimization
// Status: Production - Phase 11 AI Nexus + Phase 12A Telemetry

import { TaskAnalysis, getTaskAnalyzer } from './task-analyzer';
import { executeWithProvider as executeWithRealProvider } from './providers';
import { logNexusMetric } from '@/lib/monitoring/nexus-analytics';

/**
 * AI Provider Configuration
 */
export interface AIProvider {
  id: string;
  name: string;
  tier: 'free' | 'paid';
  costPerToken: number; // USD per 1000 tokens
  maxTokens: number;
  capabilities: {
    reasoning: number; // 0-1 scale
    creativity: number;
    codeGeneration: number;
    analysis: number;
    speed: number; // requests per second
  };
  available: boolean;
}

/**
 * AI Execution Result
 */
export interface AIExecutionResult {
  success: boolean;
  response: string;
  provider: string;
  tokensUsed: number;
  cost: number;
  latencyMs: number;
  error?: string;
  fallbackUsed: boolean;
}

/**
 * AI Routing Result with detailed metrics
 */
export interface AIRoutingResult {
  taskAnalysis: TaskAnalysis;
  strategy: 'free' | 'hybrid' | 'paid';
  execution: {
    primary: AIExecutionResult;
    fallbacks?: AIExecutionResult[];
  };
  metrics: {
    totalCost: number;
    costSavings: number; // vs always using paid
    totalLatency: number;
    providersUsed: string[];
  };
}

/**
 * Default AI Provider Configurations
 */
const AI_PROVIDERS: Record<string, AIProvider> = {
  grok: {
    id: 'grok',
    name: 'Grok (xAI)',
    tier: 'free',
    costPerToken: 0, // Free tier
    maxTokens: 4096,
    capabilities: {
      reasoning: 0.7,
      creativity: 0.8,
      codeGeneration: 0.6,
      analysis: 0.7,
      speed: 5,
    },
    available: true,
  },
  gemini: {
    id: 'gemini',
    name: 'Gemini Pro (Google)',
    tier: 'free',
    costPerToken: 0, // Free tier for now
    maxTokens: 8192,
    capabilities: {
      reasoning: 0.8,
      creativity: 0.7,
      codeGeneration: 0.8,
      analysis: 0.9,
      speed: 4,
    },
    available: true,
  },
  perplexity: {
    id: 'perplexity',
    name: 'Perplexity AI',
    tier: 'free',
    costPerToken: 0, // Free tier
    maxTokens: 4096,
    capabilities: {
      reasoning: 0.6,
      creativity: 0.5,
      codeGeneration: 0.5,
      analysis: 0.8,
      speed: 6,
    },
    available: true,
  },
  claude: {
    id: 'claude',
    name: 'Claude 3.5 Sonnet',
    tier: 'paid',
    costPerToken: 0.003, // $3 per 1M tokens
    maxTokens: 200000,
    capabilities: {
      reasoning: 0.95,
      creativity: 0.9,
      codeGeneration: 0.95,
      analysis: 0.95,
      speed: 2,
    },
    available: true,
  },
  gpt: {
    id: 'gpt',
    name: 'GPT-4o',
    tier: 'paid',
    costPerToken: 0.005, // $5 per 1M tokens
    maxTokens: 128000,
    capabilities: {
      reasoning: 0.9,
      creativity: 0.95,
      codeGeneration: 0.9,
      analysis: 0.9,
      speed: 3,
    },
    available: true,
  },
};

/**
 * AIRouter
 * Routes tasks to optimal AI models with cost optimization
 */
export class AIRouter {
  private providers: Map<string, AIProvider>;
  private executionHistory: AIRoutingResult[] = [];
  private readonly MAX_HISTORY = 100;

  constructor() {
    this.providers = new Map(Object.entries(AI_PROVIDERS));
  }

  /**
   * Route and execute a task
   */
  async route(
    task: string,
    context?: string,
    options?: {
      preferredStrategy?: 'free' | 'hybrid' | 'paid';
      maxCost?: number;
      requireFast?: boolean;
    }
  ): Promise<AIRoutingResult> {
    // Analyze task
    const analyzer = getTaskAnalyzer();
    const taskAnalysis = analyzer.analyze(task, context);

    // Determine strategy (override with options if provided)
    const strategy = options?.preferredStrategy || taskAnalysis.suggestedStrategy;

    console.log(`[AIRouter] Task analysis: complexity=${taskAnalysis.complexity.toFixed(3)}, strategy=${strategy}`);
    console.log(`[AIRouter] Reasoning: ${taskAnalysis.reasoning}`);

    // Execute based on strategy
    let result: AIRoutingResult;

    switch (strategy) {
      case 'free':
        result = await this.executeFreeStrategy(task, context, taskAnalysis);
        break;
      case 'hybrid':
        result = await this.executeHybridStrategy(task, context, taskAnalysis, options);
        break;
      case 'paid':
        result = await this.executePaidStrategy(task, context, taskAnalysis);
        break;
      default:
        throw new Error(`Unknown strategy: ${strategy}`);
    }

    // Phase 12A: Log telemetry metrics to Firestore
    if (result.execution.primary.success) {
      try {
        await logNexusMetric({
          agentId: 'ai-router',
          agentName: 'AI Nexus Router',
          model: result.execution.primary.provider,
          tokenEstimate: result.taskAnalysis.estimatedTokens,
          cost: result.metrics.totalCost,
          latency: result.metrics.totalLatency,
          complexity: result.taskAnalysis.complexity,
          strategy: result.strategy,
          success: true
        });
      } catch (telemetryError) {
        console.warn('Failed to log telemetry:', telemetryError);
        // Don't fail the routing if telemetry fails
      }
    }

    // Store in history
    this.addToHistory(result);

    return result;
  }

  /**
   * Execute free strategy: Use only free-tier AIs
   */
  private async executeFreeStrategy(
    task: string,
    context: string | undefined,
    taskAnalysis: TaskAnalysis
  ): Promise<AIRoutingResult> {
    const freeProviders = this.getAvailableProviders('free');

    if (freeProviders.length === 0) {
      throw new Error('No free-tier AI providers available');
    }

    // Try providers in order of capability match
    const rankedProviders = this.rankProvidersByTask(freeProviders, taskAnalysis);

    let primary: AIExecutionResult | null = null;
    const fallbacks: AIExecutionResult[] = [];

    for (const provider of rankedProviders) {
      const result = await this.executeWithProvider(provider, task, context);

      if (!primary) {
        primary = result;
      } else {
        fallbacks.push(result);
      }

      if (result.success) {
        break; // Success, no need to try more
      }
    }

    if (!primary) {
      throw new Error('All free-tier providers failed');
    }

    // Calculate metrics
    const totalCost = primary.cost + fallbacks.reduce((sum, f) => sum + f.cost, 0);
    const costSavings = this.calculateCostSavings(totalCost, taskAnalysis.estimatedTokens);
    const totalLatency = primary.latencyMs + fallbacks.reduce((sum, f) => sum + f.latencyMs, 0);
    const providersUsed = [primary.provider, ...fallbacks.map(f => f.provider)];

    return {
      taskAnalysis,
      strategy: 'free',
      execution: {
        primary,
        fallbacks: fallbacks.length > 0 ? fallbacks : undefined,
      },
      metrics: {
        totalCost,
        costSavings,
        totalLatency,
        providersUsed,
      },
    };
  }

  /**
   * Execute hybrid strategy: Try free first, escalate to paid if needed
   */
  private async executeHybridStrategy(
    task: string,
    context: string | undefined,
    taskAnalysis: TaskAnalysis,
    options?: { maxCost?: number; requireFast?: boolean }
  ): Promise<AIRoutingResult> {
    console.log('[AIRouter] Executing hybrid strategy: trying free AIs first...');

    const freeProviders = this.getAvailableProviders('free');
    const paidProviders = this.getAvailableProviders('paid');

    // Run free AIs in parallel for speed
    const freeResults = await Promise.allSettled(
      freeProviders.map(provider => this.executeWithProvider(provider, task, context))
    );

    // Check if any free AI succeeded with high quality
    const successfulFree = freeResults
      .filter((r): r is PromiseFulfilledResult<AIExecutionResult> =>
        r.status === 'fulfilled' && r.value.success
      )
      .map(r => r.value);

    if (successfulFree.length > 0) {
      // Pick best free result
      const primary = successfulFree[0]; // First successful result
      console.log(`[AIRouter] Free AI succeeded: ${primary.provider}`);

      const totalCost = successfulFree.reduce((sum, r) => sum + r.cost, 0);
      const costSavings = this.calculateCostSavings(totalCost, taskAnalysis.estimatedTokens);
      const totalLatency = Math.max(...successfulFree.map(r => r.latencyMs));

      return {
        taskAnalysis,
        strategy: 'hybrid',
        execution: {
          primary,
          fallbacks: successfulFree.slice(1),
        },
        metrics: {
          totalCost,
          costSavings,
          totalLatency,
          providersUsed: successfulFree.map(r => r.provider),
        },
      };
    }

    // Free AIs failed, escalate to paid
    console.log('[AIRouter] Free AIs failed, escalating to paid...');

    const rankedPaidProviders = this.rankProvidersByTask(paidProviders, taskAnalysis);
    const paidProvider = rankedPaidProviders[0];

    if (!paidProvider) {
      throw new Error('No paid AI providers available for escalation');
    }

    const primary = await this.executeWithProvider(paidProvider, task, context);

    const allResults = [
      ...freeResults
        .filter((r): r is PromiseFulfilledResult<AIExecutionResult> => r.status === 'fulfilled')
        .map(r => r.value),
      primary,
    ];

    const totalCost = allResults.reduce((sum, r) => sum + r.cost, 0);
    const costSavings = this.calculateCostSavings(totalCost, taskAnalysis.estimatedTokens);
    const totalLatency = allResults.reduce((sum, r) => sum + r.latencyMs, 0);

    return {
      taskAnalysis,
      strategy: 'hybrid',
      execution: {
        primary: { ...primary, fallbackUsed: true },
        fallbacks: allResults.slice(0, -1),
      },
      metrics: {
        totalCost,
        costSavings,
        totalLatency,
        providersUsed: allResults.map(r => r.provider),
      },
    };
  }

  /**
   * Execute paid strategy: Use premium AI directly
   */
  private async executePaidStrategy(
    task: string,
    context: string | undefined,
    taskAnalysis: TaskAnalysis
  ): Promise<AIRoutingResult> {
    console.log('[AIRouter] Using paid AI directly');

    const paidProviders = this.getAvailableProviders('paid');
    const rankedProviders = this.rankProvidersByTask(paidProviders, taskAnalysis);

    const provider = rankedProviders[0];
    if (!provider) {
      throw new Error('No paid AI providers available');
    }

    const primary = await this.executeWithProvider(provider, task, context);

    const totalCost = primary.cost;
    const costSavings = 0; // No savings when going straight to paid
    const totalLatency = primary.latencyMs;

    return {
      taskAnalysis,
      strategy: 'paid',
      execution: {
        primary,
      },
      metrics: {
        totalCost,
        costSavings,
        totalLatency,
        providersUsed: [primary.provider],
      },
    };
  }

  /**
   * Execute task with specific provider (uses real API calls)
   */
  private async executeWithProvider(
    provider: AIProvider,
    task: string,
    context?: string
  ): Promise<AIExecutionResult> {
    const startTime = Date.now();

    try {
      console.log(`[AIRouter] Executing with ${provider.name}...`);

      // Execute with real provider API
      const result = await executeWithRealProvider(provider.id, task, context);

      const latencyMs = Date.now() - startTime;
      const cost = (result.tokensUsed / 1000) * provider.costPerToken;

      return {
        success: result.success,
        response: result.response,
        provider: provider.name,
        tokensUsed: result.tokensUsed,
        cost,
        latencyMs,
        error: result.error,
        fallbackUsed: false,
      };
    } catch (error) {
      const latencyMs = Date.now() - startTime;

      return {
        success: false,
        response: '',
        provider: provider.name,
        tokensUsed: 0,
        cost: 0,
        latencyMs,
        error: error instanceof Error ? error.message : 'Unknown error',
        fallbackUsed: false,
      };
    }
  }


  /**
   * Get available providers by tier
   */
  private getAvailableProviders(tier?: 'free' | 'paid'): AIProvider[] {
    const providers = Array.from(this.providers.values()).filter(p => p.available);

    if (tier) {
      return providers.filter(p => p.tier === tier);
    }

    return providers;
  }

  /**
   * Rank providers by task requirements
   */
  private rankProvidersByTask(providers: AIProvider[], taskAnalysis: TaskAnalysis): AIProvider[] {
    return providers.sort((a, b) => {
      let scoreA = 0;
      let scoreB = 0;

      if (taskAnalysis.requiresReasoning) {
        scoreA += a.capabilities.reasoning;
        scoreB += b.capabilities.reasoning;
      }

      if (taskAnalysis.requiresCreativity) {
        scoreA += a.capabilities.creativity;
        scoreB += b.capabilities.creativity;
      }

      if (taskAnalysis.complexity > 0.5) {
        scoreA += a.capabilities.analysis;
        scoreB += b.capabilities.analysis;
      }

      return scoreB - scoreA;
    });
  }

  /**
   * Calculate cost savings vs always using paid AI
   */
  private calculateCostSavings(actualCost: number, estimatedTokens: number): number {
    // Assume we would use Claude (most expensive paid option) if not optimizing
    const claudeCost = (estimatedTokens / 1000) * AI_PROVIDERS.claude.costPerToken;
    return Math.max(claudeCost - actualCost, 0);
  }

  /**
   * Add result to history
   */
  private addToHistory(result: AIRoutingResult): void {
    this.executionHistory.push(result);

    // Keep history size limited
    if (this.executionHistory.length > this.MAX_HISTORY) {
      this.executionHistory.shift();
    }
  }

  /**
   * Get execution history
   */
  getHistory(limit?: number): AIRoutingResult[] {
    const history = [...this.executionHistory].reverse(); // Most recent first
    return limit ? history.slice(0, limit) : history;
  }

  /**
   * Get cost statistics
   */
  getCostStats(): {
    totalCost: number;
    totalSavings: number;
    avgCost: number;
    avgSavings: number;
    executionCount: number;
  } {
    const totalCost = this.executionHistory.reduce((sum, r) => sum + r.metrics.totalCost, 0);
    const totalSavings = this.executionHistory.reduce((sum, r) => sum + r.metrics.costSavings, 0);
    const executionCount = this.executionHistory.length;

    return {
      totalCost,
      totalSavings,
      avgCost: executionCount > 0 ? totalCost / executionCount : 0,
      avgSavings: executionCount > 0 ? totalSavings / executionCount : 0,
      executionCount,
    };
  }

  /**
   * Update provider availability
   */
  setProviderAvailability(providerId: string, available: boolean): void {
    const provider = this.providers.get(providerId);
    if (provider) {
      provider.available = available;
    }
  }

  /**
   * Get provider info
   */
  getProvider(providerId: string): AIProvider | undefined {
    return this.providers.get(providerId);
  }

  /**
   * Get all providers
   */
  getAllProviders(): AIProvider[] {
    return Array.from(this.providers.values());
  }
}

// Export singleton instance
let aiRouter: AIRouter | null = null;

/**
 * Get or create AI router instance
 */
export function getAIRouter(): AIRouter {
  if (!aiRouter) {
    aiRouter = new AIRouter();
  }
  return aiRouter;
}

export default AIRouter;
