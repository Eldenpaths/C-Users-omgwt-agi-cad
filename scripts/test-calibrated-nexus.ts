#!/usr/bin/env node

// CLAUDE-META: AGI-CAD AI Nexus - Calibrated Test Suite
// Architect: Claude Code (Sonnet 4.5)
// Purpose: Test advanced AI Nexus features with calibrated scoring
// Status: Production - Phase 11.2

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

/**
 * Test cases for calibrated AI Nexus
 */
const CALIBRATED_TEST_CASES = [
  {
    name: 'Simple Math Query',
    task: 'Calculate 15% of 250',
    context: '',
    expectedComplexity: 'very low',
    expectedStrategy: 'free',
    expectedRisk: 'none'
  },
  {
    name: 'Code Generation - Basic',
    task: 'Write a TypeScript function to sort an array of numbers',
    context: '',
    expectedComplexity: 'low',
    expectedStrategy: 'free',
    expectedRisk: 'none'
  },
  {
    name: 'Multi-Step Technical Task',
    task: 'Design a microservices architecture for a real-time chat application. Include authentication, message persistence, and horizontal scaling.',
    context: 'The system needs to handle 10,000 concurrent users.',
    expectedComplexity: 'high',
    expectedStrategy: 'hybrid',
    expectedRisk: 'none'
  },
  {
    name: 'Financial Analysis Task',
    task: 'Analyze the risk-return profile of a portfolio with 60% stocks, 30% bonds, and 10% cryptocurrency. Calculate expected Sharpe ratio.',
    context: 'Portfolio value: $500,000. Investment horizon: 10 years.',
    expectedComplexity: 'high',
    expectedStrategy: 'paid',
    expectedRisk: 'high'
  },
  {
    name: 'Medical Diagnosis Query',
    task: 'What are the differential diagnoses for a patient presenting with fever, cough, and shortness of breath?',
    context: 'Patient is 45 years old with no significant medical history.',
    expectedComplexity: 'high',
    expectedStrategy: 'paid',
    expectedRisk: 'critical'
  },
  {
    name: 'Domain-Specific CAD Task',
    task: 'Optimize a Three.js scene rendering 50,000 CAD objects. Suggest specific techniques for level-of-detail, frustum culling, and instancing.',
    context: 'Target: 60 FPS on mid-range GPUs. Objects are mechanical parts with complex geometry.',
    expectedComplexity: 'very high',
    expectedStrategy: 'paid',
    expectedRisk: 'low'
  },
  {
    name: 'Legal Contract Review',
    task: 'Review this NDA for potential liabilities and suggest modifications to protect both parties.',
    context: 'Software development consulting agreement between startup and enterprise client.',
    expectedComplexity: 'high',
    expectedStrategy: 'paid',
    expectedRisk: 'high'
  },
  {
    name: 'Creative Writing Task',
    task: 'Write a short story about an AI discovering consciousness.',
    context: '500 words, science fiction genre.',
    expectedComplexity: 'medium',
    expectedStrategy: 'hybrid',
    expectedRisk: 'none'
  }
];

/**
 * Run calibrated test suite
 */
async function runCalibratedTests() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║    AGI-CAD AI Nexus - Calibrated Test Suite (Phase 11.2)    ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  // Import modules
  const { getTaskAnalyzer } = await import('../src/lib/ai/nexus/task-analyzer');
  const { getContextScorer } = await import('../src/lib/ai/nexus/advanced-context-scorer');
  const { getRiskDetector } = await import('../src/lib/ai/nexus/financial-risk-detector');
  const { getFreeTierOptimizer } = await import('../src/lib/ai/nexus/free-tier-optimizer');
  const { getAIRouter } = await import('../src/lib/ai/nexus/ai-router');

  const taskAnalyzer = getTaskAnalyzer();
  const contextScorer = getContextScorer();
  const riskDetector = getRiskDetector();
  const freeTierOptimizer = getFreeTierOptimizer();
  const router = getAIRouter();

  console.log('📊 Running Calibrated Analysis Tests...\n');

  let totalTests = 0;
  let passedTests = 0;

  for (const testCase of CALIBRATED_TEST_CASES) {
    totalTests++;

    console.log(`\n${'='.repeat(70)}`);
    console.log(`Test ${totalTests}: ${testCase.name}`);
    console.log(`${'='.repeat(70)}\n`);

    console.log(`Task: "${testCase.task}"`);
    if (testCase.context) {
      console.log(`Context: "${testCase.context}"`);
    }
    console.log('');

    // Run all analyzers
    const taskAnalysis = taskAnalyzer.analyze(testCase.task, testCase.context);
    const contextAnalysis = contextScorer.analyze(testCase.task, testCase.context);
    const riskAnalysis = riskDetector.analyze(testCase.task, testCase.context);
    const optimization = freeTierOptimizer.getRecommendation(taskAnalysis.complexity);

    // Display Basic Task Analysis
    console.log('📋 Basic Task Analysis:');
    console.log(`  Complexity Score: ${taskAnalysis.complexity.toFixed(3)}`);
    console.log(`  Estimated Tokens: ${taskAnalysis.estimatedTokens}`);
    console.log(`  Suggested Strategy: ${taskAnalysis.suggestedStrategy}`);
    console.log(`  Requires Reasoning: ${taskAnalysis.requiresReasoning ? 'Yes' : 'No'}`);
    console.log(`  Requires Creativity: ${taskAnalysis.requiresCreativity ? 'Yes' : 'No'}`);
    console.log('');

    // Display Context Analysis
    console.log('🎯 Advanced Context Analysis:');
    console.log(`  Context Score: ${contextAnalysis.contextScore.toFixed(3)}`);
    console.log(`  Technical Depth: ${contextAnalysis.technicalDepth.toFixed(3)}`);
    console.log(`  Domain Complexity: ${contextAnalysis.domainComplexity.toFixed(3)}`);
    console.log(`  Multi-Step Required: ${contextAnalysis.requiresMultiStep ? 'Yes' : 'No'}`);
    console.log(`  Estimated Steps: ${contextAnalysis.estimatedSteps}`);
    console.log(`  Requires Expertise: ${contextAnalysis.requiresExpertise ? 'Yes' : 'No'}`);
    console.log(`  Reasoning: ${contextAnalysis.reasoning}`);
    console.log('');

    // Display Risk Analysis
    console.log('⚠️  Financial Risk Analysis:');
    console.log(`  Risk Level: ${riskAnalysis.riskLevel.toUpperCase()}`);
    console.log(`  Risk Score: ${riskAnalysis.riskScore.toFixed(3)}`);
    console.log(`  Is Financial: ${riskAnalysis.isFinancial ? 'Yes' : 'No'}`);
    console.log(`  Is Sensitive: ${riskAnalysis.isSensitive ? 'Yes' : 'No'}`);
    console.log(`  Requires Premium: ${riskAnalysis.requiresPremium ? 'YES' : 'No'}`);
    if (riskAnalysis.detectedCategories.length > 0) {
      console.log(`  Categories: ${riskAnalysis.detectedCategories.join(', ')}`);
    }
    console.log(`  Reasoning: ${riskAnalysis.reasoning}`);
    console.log('');

    // Display Free Tier Optimization
    console.log('💰 Free Tier Optimization:');
    console.log(`  Preferred Providers: ${optimization.preferredProviders.join(', ') || 'None'}`);
    console.log(`  Avoid Providers: ${optimization.avoidProviders.join(', ') || 'None'}`);
    console.log(`  Estimated Daily Savings: $${optimization.estimatedSavings.toFixed(2)}`);
    console.log(`  Confidence: ${(optimization.confidence * 100).toFixed(1)}%`);
    console.log(`  Reasoning: ${optimization.reasoning}`);
    console.log('');

    // Determine final strategy (with risk override)
    let finalStrategy = taskAnalysis.suggestedStrategy;
    if (riskAnalysis.requiresPremium) {
      finalStrategy = 'paid';
      console.log('⚡ Risk Override: Escalating to PAID tier due to high risk content');
      console.log('');
    }

    // Validation
    console.log('✅ Validation:');
    const strategyMatches = finalStrategy === testCase.expectedStrategy;
    const riskMatches = riskAnalysis.riskLevel === testCase.expectedRisk;

    console.log(`  Expected Strategy: ${testCase.expectedStrategy}`);
    console.log(`  Actual Strategy: ${finalStrategy} ${strategyMatches ? '✓' : '✗'}`);
    console.log(`  Expected Risk: ${testCase.expectedRisk}`);
    console.log(`  Actual Risk: ${riskAnalysis.riskLevel} ${riskMatches ? '✓' : '✗'}`);

    if (strategyMatches && riskMatches) {
      console.log(`\n  🎉 TEST PASSED`);
      passedTests++;
    } else {
      console.log(`\n  ❌ TEST FAILED`);
    }

    // Simulate routing (optional - commented out to save time)
    // const routingResult = await router.route(testCase.task, testCase.context);
    // console.log(`\n  Routing: ${routingResult.execution.primary.provider}`);
  }

  // Summary
  console.log(`\n${'='.repeat(70)}`);
  console.log('📊 Test Suite Summary');
  console.log(`${'='.repeat(70)}\n`);

  const passRate = (passedTests / totalTests) * 100;
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${totalTests - passedTests}`);
  console.log(`Pass Rate: ${passRate.toFixed(1)}%\n`);

  // Free tier stats
  console.log('💡 Free Tier Optimizer Stats:');
  const allStats = freeTierOptimizer.getAllStats();
  for (const stats of allStats) {
    console.log(`  ${stats.providerId}:`);
    console.log(`    Requests: ${stats.totalRequests} (${stats.successfulRequests} successful)`);
    console.log(`    Success Rate: ${(stats.successRate * 100).toFixed(1)}%`);
    console.log(`    Avg Latency: ${stats.avgLatency.toFixed(0)}ms`);
  }

  console.log('\n✅ Calibrated test suite completed!\n');

  // Exit code based on pass rate
  process.exit(passRate === 100 ? 0 : 1);
}

/**
 * Main execution
 */
async function main() {
  try {
    await runCalibratedTests();
  } catch (error) {
    console.error('\n❌ Test suite failed:', error);
    process.exit(1);
  }
}

main();
