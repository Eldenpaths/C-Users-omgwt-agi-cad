// CLAUDE-META: AGI-CAD AI Nexus - Advanced Context Scorer
// Architect: Claude Code (Sonnet 4.5)
// Purpose: Advanced context analysis for task complexity scoring
// Status: Production - Phase 11.2

/**
 * Context Analysis Result
 */
export interface ContextAnalysis {
  contextScore: number; // 0-1 scale
  technicalDepth: number; // 0-1 scale
  domainComplexity: number; // 0-1 scale
  requiresMultiStep: boolean;
  requiresExpertise: boolean;
  estimatedSteps: number;
  confidence: number;
  reasoning: string;
}

/**
 * Context Scorer Configuration
 */
export interface ContextScorerConfig {
  technicalKeywords: string[];
  domainKeywords: Map<string, string[]>;
  multiStepIndicators: string[];
  expertiseIndicators: string[];
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: ContextScorerConfig = {
  technicalKeywords: [
    'algorithm', 'architecture', 'optimization', 'performance',
    'scalability', 'distributed', 'concurrent', 'asynchronous',
    'encryption', 'authentication', 'authorization', 'security',
    'database', 'query', 'index', 'transaction', 'consistency'
  ],
  domainKeywords: new Map([
    ['cad', ['autocad', 'solidworks', 'fusion', 'mesh', 'polygon', 'vertex', 'rendering']],
    ['ai', ['neural', 'model', 'training', 'inference', 'transformer', 'embedding']],
    ['finance', ['trading', 'portfolio', 'risk', 'derivative', 'hedge', 'volatility']],
    ['security', ['vulnerability', 'exploit', 'penetration', 'audit', 'compliance']],
    ['data', ['pipeline', 'etl', 'warehouse', 'analytics', 'visualization', 'dashboard']]
  ]),
  multiStepIndicators: [
    'first', 'then', 'next', 'after', 'following', 'step',
    'phase', 'stage', 'process', 'workflow', 'pipeline'
  ],
  expertiseIndicators: [
    'expert', 'advanced', 'complex', 'sophisticated', 'comprehensive',
    'detailed', 'in-depth', 'thorough', 'extensive'
  ]
};

/**
 * Advanced Context Scorer
 * Analyzes task context for complexity beyond basic entropy
 */
export class AdvancedContextScorer {
  private config: ContextScorerConfig;

  constructor(config: Partial<ContextScorerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Analyze context complexity
   */
  analyze(task: string, context?: string): ContextAnalysis {
    const fullText = context ? `${context}\n\n${task}` : task;
    const lowerText = fullText.toLowerCase();

    // Technical depth analysis
    const technicalDepth = this.analyzeTechnicalDepth(lowerText);

    // Domain complexity analysis
    const domainComplexity = this.analyzeDomainComplexity(lowerText);

    // Multi-step detection
    const requiresMultiStep = this.detectMultiStep(lowerText);
    const estimatedSteps = this.estimateSteps(lowerText);

    // Expertise requirement detection
    const requiresExpertise = this.detectExpertiseRequirement(lowerText);

    // Calculate overall context score
    const contextScore = this.calculateContextScore({
      technicalDepth,
      domainComplexity,
      requiresMultiStep,
      requiresExpertise,
      estimatedSteps
    });

    // Confidence based on text length and clarity
    const confidence = this.calculateConfidence(fullText);

    // Generate reasoning
    const reasoning = this.generateReasoning({
      contextScore,
      technicalDepth,
      domainComplexity,
      requiresMultiStep,
      requiresExpertise,
      estimatedSteps
    });

    return {
      contextScore,
      technicalDepth,
      domainComplexity,
      requiresMultiStep,
      requiresExpertise,
      estimatedSteps,
      confidence,
      reasoning
    };
  }

  /**
   * Analyze technical depth
   */
  private analyzeTechnicalDepth(text: string): number {
    let score = 0;
    let matchCount = 0;

    for (const keyword of this.config.technicalKeywords) {
      if (text.includes(keyword)) {
        matchCount++;
      }
    }

    // Normalize by number of keywords
    score = Math.min(matchCount / 5, 1.0);

    return score;
  }

  /**
   * Analyze domain complexity
   */
  private analyzeDomainComplexity(text: string): number {
    let maxScore = 0;
    let domainMatches = 0;

    for (const [domain, keywords] of this.config.domainKeywords) {
      let domainScore = 0;
      for (const keyword of keywords) {
        if (text.includes(keyword)) {
          domainScore++;
          domainMatches++;
        }
      }

      // Normalize domain score
      const normalizedScore = Math.min(domainScore / 3, 1.0);
      maxScore = Math.max(maxScore, normalizedScore);
    }

    // If multiple domains detected, increase complexity
    const domainCount = Array.from(this.config.domainKeywords.keys()).filter(domain => {
      const keywords = this.config.domainKeywords.get(domain) || [];
      return keywords.some(kw => text.includes(kw));
    }).length;

    if (domainCount > 1) {
      maxScore = Math.min(maxScore * 1.2, 1.0);
    }

    return maxScore;
  }

  /**
   * Detect multi-step requirements
   */
  private detectMultiStep(text: string): boolean {
    for (const indicator of this.config.multiStepIndicators) {
      if (text.includes(indicator)) {
        return true;
      }
    }

    // Check for numbered lists
    if (/\d+\.\s/.test(text) || /\d+\)\s/.test(text)) {
      return true;
    }

    return false;
  }

  /**
   * Estimate number of steps
   */
  private estimateSteps(text: string): number {
    let steps = 1;

    // Count step indicators
    for (const indicator of this.config.multiStepIndicators) {
      const regex = new RegExp(`\\b${indicator}\\b`, 'gi');
      const matches = text.match(regex);
      if (matches) {
        steps += matches.length;
      }
    }

    // Count numbered items
    const numberedMatches = text.match(/\d+[\.)]\s/g);
    if (numberedMatches && numberedMatches.length > steps) {
      steps = numberedMatches.length;
    }

    return Math.min(steps, 10); // Cap at 10 steps
  }

  /**
   * Detect expertise requirement
   */
  private detectExpertiseRequirement(text: string): boolean {
    for (const indicator of this.config.expertiseIndicators) {
      if (text.includes(indicator)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Calculate overall context score
   */
  private calculateContextScore(metrics: {
    technicalDepth: number;
    domainComplexity: number;
    requiresMultiStep: boolean;
    requiresExpertise: boolean;
    estimatedSteps: number;
  }): number {
    let score = 0;

    // Weight different factors
    score += metrics.technicalDepth * 0.3;
    score += metrics.domainComplexity * 0.3;
    score += metrics.requiresMultiStep ? 0.15 : 0;
    score += metrics.requiresExpertise ? 0.15 : 0;
    score += Math.min(metrics.estimatedSteps / 10, 0.1);

    return Math.min(score, 1.0);
  }

  /**
   * Calculate confidence in analysis
   */
  private calculateConfidence(text: string): number {
    const length = text.length;

    // More text = more confidence (up to a point)
    let confidence = Math.min(length / 500, 1.0);

    // Penalize very short text
    if (length < 20) {
      confidence *= 0.5;
    }

    return confidence;
  }

  /**
   * Generate human-readable reasoning
   */
  private generateReasoning(analysis: {
    contextScore: number;
    technicalDepth: number;
    domainComplexity: number;
    requiresMultiStep: boolean;
    requiresExpertise: boolean;
    estimatedSteps: number;
  }): string {
    const parts: string[] = [];

    if (analysis.technicalDepth > 0.5) {
      parts.push('high technical depth');
    }

    if (analysis.domainComplexity > 0.5) {
      parts.push('domain-specific expertise required');
    }

    if (analysis.requiresMultiStep) {
      parts.push(`multi-step process (~${analysis.estimatedSteps} steps)`);
    }

    if (analysis.requiresExpertise) {
      parts.push('expert-level knowledge needed');
    }

    if (parts.length === 0) {
      return 'Task has standard context complexity';
    }

    return `Task has ${parts.join(', ')}`;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<ContextScorerConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

// Export singleton instance
let contextScorer: AdvancedContextScorer | null = null;

/**
 * Get or create context scorer instance
 */
export function getContextScorer(config?: Partial<ContextScorerConfig>): AdvancedContextScorer {
  if (!contextScorer) {
    contextScorer = new AdvancedContextScorer(config);
  } else if (config) {
    contextScorer.updateConfig(config);
  }
  return contextScorer;
}

export default AdvancedContextScorer;
