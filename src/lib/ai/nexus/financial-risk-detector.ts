// CLAUDE-META: AGI-CAD AI Nexus - Financial Risk Detector
// Architect: Claude Code (Sonnet 4.5)
// Purpose: Detect financial/sensitive tasks requiring premium AI
// Status: Production - Phase 11.2

/**
 * Financial Risk Analysis Result
 */
export interface FinancialRiskAnalysis {
  riskLevel: 'none' | 'low' | 'medium' | 'high' | 'critical';
  riskScore: number; // 0-1 scale
  isFinancial: boolean;
  isSensitive: boolean;
  requiresPremium: boolean;
  detectedCategories: string[];
  confidence: number;
  reasoning: string;
}

/**
 * Risk Detector Configuration
 */
export interface RiskDetectorConfig {
  financialKeywords: string[];
  sensitiveKeywords: string[];
  legalKeywords: string[];
  medicalKeywords: string[];
  premiumThreshold: number; // Risk score above which premium AI required
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: RiskDetectorConfig = {
  financialKeywords: [
    // Trading & Investment
    'stock', 'trading', 'investment', 'portfolio', 'hedge', 'derivative',
    'option', 'futures', 'forex', 'cryptocurrency', 'bitcoin', 'eth',
    'buy', 'sell', 'margin', 'leverage',

    // Banking & Payments
    'bank', 'account', 'transfer', 'payment', 'credit', 'debit',
    'loan', 'mortgage', 'interest', 'apr', 'principal',

    // Corporate Finance
    'valuation', 'ipo', 'acquisition', 'merger', 'dividend',
    'earnings', 'revenue', 'profit', 'loss', 'balance sheet',

    // Risk Management
    'risk assessment', 'volatility', 'var', 'sharpe', 'beta',
    'compliance', 'regulation', 'audit'
  ],
  sensitiveKeywords: [
    // Personal Data
    'ssn', 'social security', 'passport', 'drivers license',
    'credit card', 'cvv', 'pin', 'password', 'credentials',

    // Confidential
    'confidential', 'proprietary', 'trade secret', 'nda',
    'classified', 'restricted', 'private'
  ],
  legalKeywords: [
    'contract', 'legal', 'lawsuit', 'litigation', 'settlement',
    'patent', 'copyright', 'trademark', 'intellectual property',
    'liability', 'indemnity', 'warranty', 'arbitration'
  ],
  medicalKeywords: [
    'diagnosis', 'treatment', 'medication', 'prescription',
    'patient', 'medical', 'health', 'disease', 'symptom',
    'hipaa', 'phi', 'medical record'
  ],
  premiumThreshold: 0.5 // Lowered from 0.6 for better detection
};

/**
 * Financial Risk Detector
 * Identifies tasks that require premium AI due to financial/sensitive nature
 */
export class FinancialRiskDetector {
  private config: RiskDetectorConfig;

  constructor(config: Partial<RiskDetectorConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Analyze financial risk
   */
  analyze(task: string, context?: string): FinancialRiskAnalysis {
    const fullText = context ? `${context}\n\n${task}` : task;
    const lowerText = fullText.toLowerCase();

    // Detect categories
    const isFinancial = this.detectFinancial(lowerText);
    const isSensitive = this.detectSensitive(lowerText);
    const isLegal = this.detectLegal(lowerText);
    const isMedical = this.detectMedical(lowerText);

    const detectedCategories: string[] = [];
    if (isFinancial) detectedCategories.push('financial');
    if (isSensitive) detectedCategories.push('sensitive');
    if (isLegal) detectedCategories.push('legal');
    if (isMedical) detectedCategories.push('medical');

    // Calculate risk score
    const riskScore = this.calculateRiskScore({
      isFinancial,
      isSensitive,
      isLegal,
      isMedical
    });

    // Determine risk level
    const riskLevel = this.determineRiskLevel(riskScore);

    // Premium AI required?
    const requiresPremium = riskScore >= this.config.premiumThreshold;

    // Confidence based on keyword matches
    const confidence = this.calculateConfidence(fullText, detectedCategories);

    // Generate reasoning
    const reasoning = this.generateReasoning({
      riskLevel,
      detectedCategories,
      requiresPremium
    });

    return {
      riskLevel,
      riskScore,
      isFinancial,
      isSensitive,
      requiresPremium,
      detectedCategories,
      confidence,
      reasoning
    };
  }

  /**
   * Detect financial content (with word boundary checking)
   */
  private detectFinancial(text: string): boolean {
    return this.config.financialKeywords.some(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'i');
      return regex.test(text);
    });
  }

  /**
   * Detect sensitive content (with word boundary checking)
   */
  private detectSensitive(text: string): boolean {
    return this.config.sensitiveKeywords.some(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'i');
      return regex.test(text);
    });
  }

  /**
   * Detect legal content (with word boundary checking)
   */
  private detectLegal(text: string): boolean {
    return this.config.legalKeywords.some(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'i');
      return regex.test(text);
    });
  }

  /**
   * Detect medical content (with word boundary checking)
   */
  private detectMedical(text: string): boolean {
    return this.config.medicalKeywords.some(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'i');
      return regex.test(text);
    });
  }

  /**
   * Calculate risk score
   */
  private calculateRiskScore(flags: {
    isFinancial: boolean;
    isSensitive: boolean;
    isLegal: boolean;
    isMedical: boolean;
  }): number {
    let score = 0;

    // Financial = high risk
    if (flags.isFinancial) score += 0.5;

    // Sensitive = critical risk
    if (flags.isSensitive) score += 0.7;

    // Legal = high risk
    if (flags.isLegal) score += 0.4;

    // Medical = critical risk (HIPAA compliance)
    if (flags.isMedical) score += 0.6;

    // Cap at 1.0
    return Math.min(score, 1.0);
  }

  /**
   * Determine risk level from score
   */
  private determineRiskLevel(score: number): 'none' | 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 0.9) return 'critical';
    if (score >= 0.7) return 'high';
    if (score >= 0.4) return 'medium';
    if (score >= 0.2) return 'low';
    return 'none';
  }

  /**
   * Calculate confidence in analysis
   */
  private calculateConfidence(text: string, categories: string[]): number {
    if (categories.length === 0) {
      return 0.9; // High confidence it's NOT risky
    }

    // More categories = higher confidence
    const categoryConfidence = Math.min(categories.length * 0.25, 0.7);

    // Longer text = more context = higher confidence
    const lengthConfidence = Math.min(text.length / 200, 0.3);

    return Math.min(categoryConfidence + lengthConfidence, 1.0);
  }

  /**
   * Generate human-readable reasoning
   */
  private generateReasoning(analysis: {
    riskLevel: string;
    detectedCategories: string[];
    requiresPremium: boolean;
  }): string {
    if (analysis.detectedCategories.length === 0) {
      return 'No financial or sensitive content detected';
    }

    const categoryText = analysis.detectedCategories.join(', ');
    const riskText = `${analysis.riskLevel} risk`;
    const premiumText = analysis.requiresPremium
      ? 'Premium AI required for accuracy and compliance'
      : 'Standard AI acceptable';

    return `Detected ${categoryText} content (${riskText}). ${premiumText}.`;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<RiskDetectorConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

// Export singleton instance
let riskDetector: FinancialRiskDetector | null = null;

/**
 * Get or create risk detector instance
 */
export function getRiskDetector(config?: Partial<RiskDetectorConfig>): FinancialRiskDetector {
  if (!riskDetector) {
    riskDetector = new FinancialRiskDetector(config);
  } else if (config) {
    riskDetector.updateConfig(config);
  }
  return riskDetector;
}

export default FinancialRiskDetector;
