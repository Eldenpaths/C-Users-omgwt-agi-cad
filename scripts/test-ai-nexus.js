#!/usr/bin/env node

// CLAUDE-META: AGI-CAD AI Nexus - Test Script
// Architect: Claude Code (Sonnet 4.5)
// Purpose: Test and demonstrate AI Nexus routing functionality
// Status: Production - Phase 11 AI Nexus

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

/**
 * Test cases for AI Nexus routing
 */
const TEST_CASES = [
  {
    name: 'Simple Query',
    task: 'What is 2 + 2?',
    expectedStrategy: 'free',
  },
  {
    name: 'Moderate Complexity',
    task: 'Create a function to calculate fibonacci numbers',
    expectedStrategy: 'free or hybrid',
  },
  {
    name: 'High Complexity - Design',
    task: 'Design a comprehensive microservices architecture for a CAD system with real-time collaboration, version control, and AI-powered design suggestions. Include security considerations and scalability patterns.',
    expectedStrategy: 'paid',
  },
  {
    name: 'Reasoning Task',
    task: 'Explain why using async/await is better than callbacks in JavaScript. Compare the trade-offs and provide code examples.',
    expectedStrategy: 'hybrid',
  },
  {
    name: 'Creative Task',
    task: 'Design a unique logo concept for an AI-powered CAD tool called AGI-CAD. Describe the visual elements and their symbolic meaning.',
    expectedStrategy: 'hybrid or paid',
  },
  {
    name: 'Technical Analysis',
    task: 'Analyze the performance implications of using Three.js for rendering 10,000+ CAD objects. Suggest optimization strategies.',
    expectedStrategy: 'paid',
  },
  {
    name: 'Simple List',
    task: 'List the main features of TypeScript',
    expectedStrategy: 'free',
  },
];

/**
 * Run test suite
 */
async function runTests() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║      AGI-CAD AI Nexus - Routing Test Suite                  ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  // Import AI Nexus modules (dynamic import for ESM)
  const { getTaskAnalyzer } = await import('../src/lib/ai/nexus/task-analyzer.ts');
  const { getAIRouter } = await import('../src/lib/ai/nexus/ai-router.ts');

  const analyzer = getTaskAnalyzer();
  const router = getAIRouter();

  console.log('📊 Running Task Analysis Tests...\n');

  for (const testCase of TEST_CASES) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Test: ${testCase.name}`);
    console.log(`${'='.repeat(60)}\n`);

    console.log(`Task: "${testCase.task}"\n`);

    // Analyze task
    const analysis = analyzer.analyze(testCase.task);

    console.log('Analysis Results:');
    console.log(`  Complexity Score: ${analysis.complexity.toFixed(3)}`);
    console.log(`  Estimated Tokens: ${analysis.estimatedTokens}`);
    console.log(`  Suggested Strategy: ${analysis.suggestedStrategy}`);
    console.log(`  Confidence: ${analysis.confidence.toFixed(3)}`);
    console.log(`  Requires Reasoning: ${analysis.requiresReasoning ? 'Yes' : 'No'}`);
    console.log(`  Requires Creativity: ${analysis.requiresCreativity ? 'Yes' : 'No'}`);
    console.log(`  Requires Specialization: ${analysis.requiresSpecialization ? 'Yes' : 'No'}`);
    console.log(`\n  Metrics:`);
    console.log(`    Entropy Score: ${analysis.metrics.entropyScore.toFixed(3)}`);
    console.log(`    Keyword Complexity: ${analysis.metrics.keywordComplexity.toFixed(3)}`);
    console.log(`    Structural Complexity: ${analysis.metrics.structuralComplexity.toFixed(3)}`);
    console.log(`    Domain Specificity: ${analysis.metrics.domainSpecificity.toFixed(3)}`);
    console.log(`\n  Reasoning: ${analysis.reasoning}`);

    // Check if matches expected
    const matches = analysis.suggestedStrategy === testCase.expectedStrategy.split(' or ')[0];
    console.log(`\n  ✓ Expected: ${testCase.expectedStrategy}`);
    console.log(`  ${matches ? '✓' : '⚠️'} Result: ${analysis.suggestedStrategy}`);

    // Simulate routing (without actual API calls)
    console.log(`\n  🔀 Simulating routing with strategy: ${analysis.suggestedStrategy}...`);

    try {
      const routingResult = await router.route(testCase.task);

      console.log(`\n  Routing Result:`);
      console.log(`    Primary Provider: ${routingResult.execution.primary.provider}`);
      console.log(`    Success: ${routingResult.execution.primary.success ? 'Yes' : 'No'}`);
      console.log(`    Tokens Used: ${routingResult.execution.primary.tokensUsed}`);
      console.log(`    Cost: $${routingResult.execution.primary.cost.toFixed(6)}`);
      console.log(`    Latency: ${routingResult.execution.primary.latencyMs}ms`);

      if (routingResult.execution.fallbacks && routingResult.execution.fallbacks.length > 0) {
        console.log(`\n  Fallback Providers Used: ${routingResult.execution.fallbacks.length}`);
        for (const fallback of routingResult.execution.fallbacks) {
          console.log(`    - ${fallback.provider}: ${fallback.success ? 'Success' : 'Failed'}`);
        }
      }

      console.log(`\n  Cost Metrics:`);
      console.log(`    Total Cost: $${routingResult.metrics.totalCost.toFixed(6)}`);
      console.log(`    Cost Savings: $${routingResult.metrics.costSavings.toFixed(6)}`);
      console.log(`    Total Latency: ${routingResult.metrics.totalLatency}ms`);
      console.log(`    Providers Used: ${routingResult.metrics.providersUsed.join(', ')}`);
    } catch (error) {
      console.log(`\n  ❌ Routing Error: ${error.message}`);
    }
  }

  // Display cumulative cost savings
  console.log(`\n${'='.repeat(60)}`);
  console.log('Summary: Cost Savings Analysis');
  console.log(`${'='.repeat(60)}\n`);

  const costStats = router.getCostStats();

  console.log('Cumulative Statistics:');
  console.log(`  Total Executions: ${costStats.executionCount}`);
  console.log(`  Total Cost: $${costStats.totalCost.toFixed(6)}`);
  console.log(`  Total Savings: $${costStats.totalSavings.toFixed(6)}`);
  console.log(`  Average Cost per Execution: $${costStats.avgCost.toFixed(6)}`);
  console.log(`  Average Savings per Execution: $${costStats.avgSavings.toFixed(6)}`);

  if (costStats.totalSavings > 0) {
    const savingsPercent = (costStats.totalSavings / (costStats.totalCost + costStats.totalSavings)) * 100;
    console.log(`  Savings Rate: ${savingsPercent.toFixed(1)}%`);
  }

  console.log('\n✅ Test suite completed!\n');
}

/**
 * Run provider availability test
 */
async function testProviderAvailability() {
  console.log('\n📡 Testing Provider Availability...\n');

  const { getAIRouter } = await import('../src/lib/ai/nexus/ai-router.ts');
  const router = getAIRouter();

  const providers = router.getAllProviders();

  console.log('Available AI Providers:\n');

  for (const provider of providers) {
    const status = provider.available ? '✓' : '✗';
    const tier = provider.tier === 'free' ? '🆓' : '💰';

    console.log(`${status} ${tier} ${provider.name}`);
    console.log(`   Tier: ${provider.tier.toUpperCase()}`);
    console.log(`   Cost: $${provider.costPerToken}/1K tokens`);
    console.log(`   Max Tokens: ${provider.maxTokens.toLocaleString()}`);
    console.log(`   Capabilities:`);
    console.log(`     Reasoning: ${(provider.capabilities.reasoning * 100).toFixed(0)}%`);
    console.log(`     Creativity: ${(provider.capabilities.creativity * 100).toFixed(0)}%`);
    console.log(`     Code Generation: ${(provider.capabilities.codeGeneration * 100).toFixed(0)}%`);
    console.log(`     Analysis: ${(provider.capabilities.analysis * 100).toFixed(0)}%`);
    console.log(`     Speed: ${provider.capabilities.speed} req/s`);
    console.log('');
  }
}

/**
 * Main execution
 */
async function main() {
  const command = process.argv[2] || 'test';

  try {
    switch (command) {
      case 'test':
        await runTests();
        break;

      case 'providers':
        await testProviderAvailability();
        break;

      case 'help':
        console.log(`
AGI-CAD AI Nexus Test CLI

Usage:
  npx tsx scripts/test-ai-nexus.js [command]

Commands:
  test        Run full routing test suite
  providers   List all available AI providers
  help        Show this help message

Examples:
  npx tsx scripts/test-ai-nexus.js test
  npx tsx scripts/test-ai-nexus.js providers
`);
        break;

      default:
        console.log(`Unknown command: ${command}`);
        console.log('Run "npx tsx scripts/test-ai-nexus.js help" for usage information');
        process.exit(1);
    }

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test suite failed:', error);
    process.exit(1);
  }
}

main();
