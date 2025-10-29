// CLAUDE-META: AGI-CAD AI Nexus - Task Complexity Analyzer
// Architect: Claude Code (Sonnet 4.5)
// Purpose: Analyze task complexity to determine optimal AI routing strategy
// Status: Production - Phase 11 AI Nexus

/**
 * Task Complexity Analysis Result
 */
export interface TaskAnalysis {
  complexity: number; // 0-1 scale (0 = trivial, 1 = extremely complex)
  estimatedTokens: number;
  contextSize: number;
  requiresReasoning: boolean;
  requiresCreativity: boolean;
  requiresSpecialization: boolean;
  suggestedStrategy: 'free' | 'hybrid' | 'paid';
  confidence: number; // 0-1 scale for analysis confidence
  reasoning: string;
  metrics: {
    entropyScore: number;
    keywordComplexity: number;
    structuralComplexity: number;
    domainSpecificity: number;
  };
}

/**
 * Task Analyzer Configuration
 */
export interface TaskAnalyzerConfig {
  freeThreshold: number; // Below this = use free AIs
  hybridThreshold: number; // Below this = try hybrid approach
  // Above hybridThreshold = use paid AIs directly
  entropyWeight: number;
  tokenWeight: number;
  keywordWeight: number;
  reasoningWeight: number;
}

/**
 * Default configuration for task analysis
 */
const DEFAULT_CONFIG: TaskAnalyzerConfig = {
  freeThreshold: 0.4, // Tasks scoring < 0.4 use free AIs (calibrated)
  hybridThreshold: 0.65, // Tasks scoring < 0.65 try hybrid (calibrated)
  entropyWeight: 0.25,
  tokenWeight: 0.25,
  keywordWeight: 0.25,
  reasoningWeight: 0.25,
};

/**
 * Keywords indicating task complexity
 */
const COMPLEXITY_KEYWORDS = {
  high: [
    'analyze', 'explain', 'design', 'architect', 'optimize', 'refactor',
    'debug', 'complex', 'advanced', 'sophisticated', 'intricate',
    'multi-step', 'comprehensive', 'detailed', 'technical', 'specialized',
    'algorithm', 'architecture', 'system', 'integration', 'performance',
  ],
  medium: [
    'create', 'implement', 'build', 'develop', 'write', 'code',
    'function', 'component', 'module', 'feature', 'api',
    'test', 'validate', 'check', 'verify', 'review',
  ],
  low: [
    'list', 'show', 'display', 'get', 'find', 'search',
    'simple', 'basic', 'quick', 'easy', 'straightforward',
    'hello', 'hi', 'help', 'what', 'how', 'where', 'when',
  ],
};

/**
 * Domain-specific keywords requiring specialized knowledge
 */
const DOMAIN_KEYWORDS = {
  cad: ['cad', 'drawing', '3d', 'modeling', 'geometry', 'mesh', 'render', 'three.js', 'threejs', 'webgl', 'vertex', 'polygon', 'frustum', 'culling', 'lod', 'level-of-detail', 'instancing'],
  ai: ['neural', 'machine learning', 'model', 'training', 'inference', 'embedding'],
  engineering: ['structural', 'mechanical', 'electrical', 'civil', 'aerospace'],
  math: ['equation', 'calculus', 'linear algebra', 'statistics', 'probability'],
  security: ['encryption', 'authentication', 'authorization', 'vulnerability', 'exploit'],
};

/**
 * Task Analyzer
 * Analyzes task complexity to determine optimal AI routing strategy
 */
export class TaskAnalyzer {
  private config: TaskAnalyzerConfig;

  constructor(config: Partial<TaskAnalyzerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Analyze a task and determine routing strategy
   */
  analyze(task: string, context?: string): TaskAnalysis {
    const combinedText = context ? `${task}\n${context}` : task;

    // Calculate individual metrics
    const entropyScore = this.calculateEntropy(combinedText);
    const estimatedTokens = this.estimateTokens(combinedText);
    const keywordComplexity = this.analyzeKeywords(combinedText);
    const structuralComplexity = this.analyzeStructure(combinedText);
    const domainSpecificity = this.analyzeDomain(combinedText);
    const requiresReasoning = this.detectReasoningRequirement(combinedText);
    const requiresCreativity = this.detectCreativityRequirement(combinedText);
    const requiresSpecialization = domainSpecificity > 0.6;

    // Calculate weighted complexity score
    const complexity = this.calculateComplexity({
      entropyScore,
      estimatedTokens,
      keywordComplexity,
      structuralComplexity,
      domainSpecificity,
      requiresReasoning,
      requiresCreativity,
    });

    // Determine routing strategy
    const suggestedStrategy = this.determineStrategy(complexity, {
      requiresReasoning,
      requiresCreativity,
      requiresSpecialization,
    });

    // Calculate confidence in analysis
    const confidence = this.calculateConfidence({
      entropyScore,
      keywordComplexity,
      structuralComplexity,
    });

    // Generate reasoning explanation
    const reasoning = this.generateReasoning({
      complexity,
      suggestedStrategy,
      entropyScore,
      keywordComplexity,
      requiresReasoning,
      requiresCreativity,
      requiresSpecialization,
    });

    return {
      complexity,
      estimatedTokens,
      contextSize: combinedText.length,
      requiresReasoning,
      requiresCreativity,
      requiresSpecialization,
      suggestedStrategy,
      confidence,
      reasoning,
      metrics: {
        entropyScore,
        keywordComplexity,
        structuralComplexity,
        domainSpecificity,
      },
    };
  }

  /**
   * Calculate Shannon entropy of text (measure of randomness/complexity)
   */
  private calculateEntropy(text: string): number {
    const chars = text.toLowerCase().split('');
    const freq = new Map<string, number>();

    // Count character frequencies
    for (const char of chars) {
      freq.set(char, (freq.get(char) || 0) + 1);
    }

    // Calculate entropy
    let entropy = 0;
    const totalChars = chars.length;

    for (const count of freq.values()) {
      const probability = count / totalChars;
      entropy -= probability * Math.log2(probability);
    }

    // Normalize to 0-1 scale (typical English text entropy ~4-5 bits)
    return Math.min(entropy / 5, 1);
  }

  /**
   * Estimate token count (rough approximation)
   */
  private estimateTokens(text: string): number {
    // Rough estimation: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
  }

  /**
   * Analyze keywords to determine complexity
   */
  private analyzeKeywords(text: string): number {
    const lowerText = text.toLowerCase();
    let score = 0;
    let totalMatches = 0;

    // High complexity keywords (weight: 1.0)
    for (const keyword of COMPLEXITY_KEYWORDS.high) {
      if (lowerText.includes(keyword)) {
        score += 1.0;
        totalMatches++;
      }
    }

    // Medium complexity keywords (weight: 0.5)
    for (const keyword of COMPLEXITY_KEYWORDS.medium) {
      if (lowerText.includes(keyword)) {
        score += 0.5;
        totalMatches++;
      }
    }

    // Low complexity keywords (weight: 0.1)
    for (const keyword of COMPLEXITY_KEYWORDS.low) {
      if (lowerText.includes(keyword)) {
        score += 0.1;
        totalMatches++;
      }
    }

    // Normalize to 0-1 scale
    return totalMatches > 0 ? Math.min(score / totalMatches, 1) : 0.5;
  }

  /**
   * Analyze structural complexity (sentences, code blocks, etc.)
   */
  private analyzeStructure(text: string): number {
    let score = 0;

    // Long text indicates complexity
    if (text.length > 1000) score += 0.3;
    else if (text.length > 500) score += 0.2;
    else if (text.length > 200) score += 0.1;

    // Multiple sentences indicate multi-step tasks
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length > 5) score += 0.3;
    else if (sentences.length > 3) score += 0.2;
    else if (sentences.length > 1) score += 0.1;

    // Code blocks indicate technical complexity
    if (text.includes('```') || text.includes('function') || text.includes('class')) {
      score += 0.3;
    }

    // Lists indicate multi-step tasks
    if (text.match(/^\d+\./m) || text.match(/^- /m)) {
      score += 0.2;
    }

    return Math.min(score, 1);
  }

  /**
   * Analyze domain-specific requirements
   */
  private analyzeDomain(text: string): number {
    const lowerText = text.toLowerCase();
    let score = 0;
    let domainCount = 0;

    for (const domain of Object.values(DOMAIN_KEYWORDS)) {
      let domainMatches = 0;
      for (const keyword of domain) {
        if (lowerText.includes(keyword)) {
          domainMatches++;
        }
      }
      if (domainMatches > 0) {
        score += domainMatches / domain.length;
        domainCount++;
      }
    }

    return domainCount > 0 ? Math.min(score / domainCount, 1) : 0;
  }

  /**
   * Detect if task requires reasoning
   */
  private detectReasoningRequirement(text: string): boolean {
    const reasoningPatterns = [
      /why/i, /explain/i, /reason/i, /because/i, /understand/i,
      /analyze/i, /think/i, /consider/i, /evaluate/i, /compare/i,
      /pros and cons/i, /trade-?off/i, /advantage/i, /disadvantage/i,
    ];

    return reasoningPatterns.some(pattern => pattern.test(text));
  }

  /**
   * Detect if task requires creativity
   */
  private detectCreativityRequirement(text: string): boolean {
    const creativityPatterns = [
      /create/i, /design/i, /generate/i, /imagine/i, /invent/i,
      /brainstorm/i, /innovative/i, /creative/i, /unique/i, /novel/i,
      /come up with/i, /think of/i, /suggest/i, /idea/i,
    ];

    return creativityPatterns.some(pattern => pattern.test(text));
  }

  /**
   * Calculate overall complexity score
   */
  private calculateComplexity(metrics: {
    entropyScore: number;
    estimatedTokens: number;
    keywordComplexity: number;
    structuralComplexity: number;
    domainSpecificity: number;
    requiresReasoning: boolean;
    requiresCreativity: boolean;
  }): number {
    const {
      entropyScore,
      estimatedTokens,
      keywordComplexity,
      structuralComplexity,
      domainSpecificity,
      requiresReasoning,
      requiresCreativity,
    } = metrics;

    // Token-based complexity (normalize to 0-1, assuming 2000 tokens is very complex)
    const tokenComplexity = Math.min(estimatedTokens / 2000, 1);

    // Base complexity from metrics
    let complexity =
      entropyScore * this.config.entropyWeight +
      tokenComplexity * this.config.tokenWeight +
      keywordComplexity * this.config.keywordWeight +
      structuralComplexity * 0.15 +
      domainSpecificity * 0.1;

    // Reasoning requirement boosts complexity
    if (requiresReasoning) {
      complexity += 0.2 * this.config.reasoningWeight;
    }

    // Creativity requirement boosts complexity
    if (requiresCreativity) {
      complexity += 0.15;
    }

    return Math.min(complexity, 1);
  }

  /**
   * Determine routing strategy based on complexity and requirements
   */
  private determineStrategy(
    complexity: number,
    requirements: {
      requiresReasoning: boolean;
      requiresCreativity: boolean;
      requiresSpecialization: boolean;
    }
  ): 'free' | 'hybrid' | 'paid' {
    const { requiresReasoning, requiresCreativity, requiresSpecialization } = requirements;

    // Force paid for specialized tasks
    if (requiresSpecialization && complexity > 0.5) {
      return 'paid';
    }

    // Force paid for complex reasoning tasks
    if (requiresReasoning && requiresCreativity && complexity > 0.6) {
      return 'paid';
    }

    // Determine based on complexity thresholds
    if (complexity < this.config.freeThreshold) {
      return 'free';
    } else if (complexity < this.config.hybridThreshold) {
      return 'hybrid';
    } else {
      return 'paid';
    }
  }

  /**
   * Calculate confidence in analysis
   */
  private calculateConfidence(metrics: {
    entropyScore: number;
    keywordComplexity: number;
    structuralComplexity: number;
  }): number {
    const { entropyScore, keywordComplexity, structuralComplexity } = metrics;

    // Higher variance in metrics = lower confidence
    const mean = (entropyScore + keywordComplexity + structuralComplexity) / 3;
    const variance =
      ((entropyScore - mean) ** 2 +
        (keywordComplexity - mean) ** 2 +
        (structuralComplexity - mean) ** 2) / 3;

    // Convert variance to confidence (lower variance = higher confidence)
    const confidence = 1 - Math.min(variance * 2, 0.5);

    return confidence;
  }

  /**
   * Generate human-readable reasoning for the analysis
   */
  private generateReasoning(params: {
    complexity: number;
    suggestedStrategy: string;
    entropyScore: number;
    keywordComplexity: number;
    requiresReasoning: boolean;
    requiresCreativity: boolean;
    requiresSpecialization: boolean;
  }): string {
    const {
      complexity,
      suggestedStrategy,
      entropyScore,
      keywordComplexity,
      requiresReasoning,
      requiresCreativity,
      requiresSpecialization,
    } = params;

    const reasons: string[] = [];

    // Complexity assessment
    if (complexity < 0.3) {
      reasons.push('Task appears straightforward and simple');
    } else if (complexity < 0.7) {
      reasons.push('Task has moderate complexity');
    } else {
      reasons.push('Task is highly complex');
    }

    // Special requirements
    if (requiresSpecialization) {
      reasons.push('requires domain expertise');
    }
    if (requiresReasoning) {
      reasons.push('involves reasoning and analysis');
    }
    if (requiresCreativity) {
      reasons.push('requires creative thinking');
    }

    // Metrics insights
    if (entropyScore > 0.7) {
      reasons.push('high information density');
    }
    if (keywordComplexity > 0.7) {
      reasons.push('contains advanced terminology');
    }

    // Strategy explanation
    let strategyExplanation = '';
    if (suggestedStrategy === 'free') {
      strategyExplanation = 'Free-tier AIs should handle this effectively';
    } else if (suggestedStrategy === 'hybrid') {
      strategyExplanation = 'Try free AIs first, escalate to paid if needed';
    } else {
      strategyExplanation = 'Best handled by premium AI models';
    }

    return `${reasons.join(', ')}. ${strategyExplanation}.`;
  }

  /**
   * Update analyzer configuration
   */
  updateConfig(config: Partial<TaskAnalyzerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): TaskAnalyzerConfig {
    return { ...this.config };
  }
}

// Export singleton instance
let taskAnalyzer: TaskAnalyzer | null = null;

/**
 * Get or create task analyzer instance
 */
export function getTaskAnalyzer(config?: Partial<TaskAnalyzerConfig>): TaskAnalyzer {
  if (!taskAnalyzer) {
    taskAnalyzer = new TaskAnalyzer(config);
  } else if (config) {
    taskAnalyzer.updateConfig(config);
  }
  return taskAnalyzer;
}

export default TaskAnalyzer;
