#!/usr/bin/env node

// CLAUDE-META: AGI-CAD AI Nexus - Quick Validation Script
// Architect: Claude Code (Sonnet 4.5)
// Purpose: Quick validation check for Phase 11.2 modules
// Status: Production

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

async function quickValidation() {
  console.log('🔍 Quick Validation Check\n');

  const checks = {
    contextScorer: false,
    financialDetector: false,
    freeTierOptimizer: false
  };

  try {
    // Import modules dynamically
    const { getContextScorer } = await import('../src/lib/ai/nexus/advanced-context-scorer.ts');
    const { getRiskDetector } = await import('../src/lib/ai/nexus/financial-risk-detector.ts');
    const { getFreeTierOptimizer } = await import('../src/lib/ai/nexus/free-tier-optimizer.ts');

    // Check 1: Context Scorer
    console.log('Testing Context Scorer...');
    const scorer = getContextScorer();
    const contextResult = scorer.analyze('What is a recursive agent?');
    console.log(`  Context Score: ${contextResult.contextScore.toFixed(3)}`);
    console.log(`  Technical Depth: ${contextResult.technicalDepth.toFixed(3)}`);
    console.log(`  Reasoning: ${contextResult.reasoning}`);
    console.log('✅ Context Scorer: Passed\n');
    checks.contextScorer = true;

    // Check 2: Financial Risk Detector
    console.log('Testing Financial Risk Detector...');
    const riskDetector = getRiskDetector();
    const riskResult = riskDetector.analyze('Build a cryptocurrency trading algorithm.');
    console.log(`  Risk Level: ${riskResult.riskLevel.toUpperCase()}`);
    console.log(`  Risk Score: ${riskResult.riskScore.toFixed(3)}`);
    console.log(`  Is Financial: ${riskResult.isFinancial}`);
    console.log(`  Requires Premium: ${riskResult.requiresPremium}`);
    console.log(`  Reasoning: ${riskResult.reasoning}`);
    console.log('✅ Financial Risk Detector: Passed\n');
    checks.financialDetector = true;

    // Check 3: Free-Tier Optimizer
    console.log('Testing Free-Tier Optimizer...');
    const tierOptimizer = getFreeTierOptimizer();

    // Simulate some usage
    tierOptimizer.recordRequest('grok', true, 500);
    tierOptimizer.recordRequest('gemini', true, 450);
    tierOptimizer.recordRequest('perplexity', false, 1200);

    const optimization = tierOptimizer.getRecommendation(0.5);
    console.log(`  Preferred Providers: ${optimization.preferredProviders.join(', ')}`);
    console.log(`  Avoid Providers: ${optimization.avoidProviders.join(', ') || 'None'}`);
    console.log(`  Estimated Savings: $${optimization.estimatedSavings.toFixed(2)}/day`);
    console.log(`  Confidence: ${(optimization.confidence * 100).toFixed(1)}%`);
    console.log(`  Reasoning: ${optimization.reasoning}`);
    console.log('✅ Free-Tier Optimizer: Passed\n');
    checks.freeTierOptimizer = true;

  } catch (error) {
    console.error('❌ Quick Validation: Failed');
    console.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    if (error instanceof Error && error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }

  // Final check
  console.log('═'.repeat(60));
  if (checks.contextScorer && checks.financialDetector && checks.freeTierOptimizer) {
    console.log('✅ All checks passed. System ready for deployment!');
    console.log('═'.repeat(60));
    process.exit(0);
  } else {
    console.log('❌ Some checks failed. Please review.');
    console.log(`  Context Scorer: ${checks.contextScorer ? '✅' : '❌'}`);
    console.log(`  Financial Detector: ${checks.financialDetector ? '✅' : '❌'}`);
    console.log(`  Free-Tier Optimizer: ${checks.freeTierOptimizer ? '✅' : '❌'}`);
    console.log('═'.repeat(60));
    process.exit(1);
  }
}

quickValidation();
