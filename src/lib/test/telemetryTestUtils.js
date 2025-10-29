// CLAUDE-META: Phase 10F Telemetry Testing - Event Generation Utilities
// Architect: Claude Code (Sonnet 4.5)
// Purpose: Generate test telemetry events for dashboard validation
// Status: Production - Phase 10F Active

import { getFusionBridge } from '../meta/fusion-bridge';
import { addMemory, addAgent, updateTask } from '../vault';

/**
 * Generate sample drift event
 */
export async function generateDriftEvent(agentId = 'agent-test', severity = 'low') {
  const bridge = getFusionBridge();

  const driftScores = {
    low: 0.02,
    medium: 0.08,
    high: 0.15,
  };

  const entropyScores = {
    low: 0.3,
    medium: 0.6,
    high: 0.9,
  };

  await bridge.logDrift({
    agentId,
    driftScore: driftScores[severity] || 0.05,
    entropyScore: entropyScores[severity] || 0.4,
    driftDetected: severity === 'high',
    entropyExceeded: severity === 'high',
    filePath: `src/test/${agentId}_${Date.now()}.js`,
    timestamp: new Date(),
  });

  console.log(`✅ Generated ${severity} drift event for ${agentId}`);
}

/**
 * Generate sample trust event
 */
export async function generateTrustEvent(agentId = 'agent-test', performance = 'good') {
  const bridge = getFusionBridge();

  const trustConfigs = {
    excellent: { success: 50, failure: 2, avgDrift: 0.01 },
    good: { success: 30, failure: 5, avgDrift: 0.03 },
    fair: { success: 20, failure: 10, avgDrift: 0.06 },
    poor: { success: 10, failure: 20, avgDrift: 0.12 },
  };

  const config = trustConfigs[performance] || trustConfigs.good;
  const alpha = config.success;
  const beta = config.failure;
  const trustScore = alpha / (alpha + beta);

  await bridge.logTrust({
    agentId,
    trustScore,
    successCount: config.success,
    failureCount: config.failure,
    avgDrift: config.avgDrift,
    alpha,
    beta,
    timestamp: new Date(),
  });

  console.log(`✅ Generated ${performance} trust event for ${agentId} (trust: ${trustScore.toFixed(3)})`);
}

/**
 * Generate sample rollback event
 */
export async function generateRollbackEvent(reason = 'High drift detected') {
  const bridge = getFusionBridge();

  await bridge.logRollback({
    modificationId: `mod-${Date.now()}`,
    reason,
    triggeredBy: 'DriftMonitor',
    rolledBackCount: Math.floor(Math.random() * 10) + 1,
    timestamp: new Date(),
  });

  console.log(`✅ Generated rollback event: ${reason}`);
}

/**
 * Generate sample modification event
 */
export async function generateModificationEvent(agentId = 'agent-test', approved = true) {
  const bridge = getFusionBridge();

  await bridge.logModification(
    agentId,
    `src/test/${agentId}_${Date.now()}.js`,
    approved,
    approved ? 0.2 : 0.8
  );

  console.log(`✅ Generated modification event: ${approved ? 'approved' : 'rejected'}`);
}

/**
 * Run comprehensive telemetry test
 */
export async function runTelemetryTest() {
  console.log('🧪 Starting telemetry test suite...\n');

  try {
    // Test 1: Drift events (various severities)
    console.log('Test 1: Drift events');
    await generateDriftEvent('agent-archivist', 'low');
    await delay(500);
    await generateDriftEvent('agent-forge', 'medium');
    await delay(500);
    await generateDriftEvent('agent-vault', 'high');
    console.log('');

    // Test 2: Trust events (various performances)
    console.log('Test 2: Trust events');
    await generateTrustEvent('agent-archivist', 'excellent');
    await delay(500);
    await generateTrustEvent('agent-forge', 'good');
    await delay(500);
    await generateTrustEvent('agent-vault', 'fair');
    console.log('');

    // Test 3: Rollback events
    console.log('Test 3: Rollback events');
    await generateRollbackEvent('High drift detected');
    await delay(500);
    await generateRollbackEvent('Manual rollback request');
    console.log('');

    // Test 4: Modification events
    console.log('Test 4: Modification events');
    await generateModificationEvent('agent-archivist', true);
    await delay(500);
    await generateModificationEvent('agent-forge', false);
    console.log('');

    console.log('✅ Telemetry test suite completed!\n');
    console.log('📊 Check dashboard at http://localhost:3006/dashboard\n');
  } catch (error) {
    console.error('❌ Telemetry test failed:', error);
  }
}

/**
 * Generate continuous telemetry stream (for testing)
 */
export async function startTelemetryStream(intervalMs = 5000) {
  console.log(`📡 Starting continuous telemetry stream (interval: ${intervalMs}ms)`);
  console.log('Press Ctrl+C to stop\n');

  const agents = ['agent-archivist', 'agent-forge', 'agent-vault', 'agent-explorer'];
  const severities = ['low', 'low', 'low', 'medium', 'high']; // Weighted toward low
  const performances = ['excellent', 'excellent', 'good', 'good', 'fair', 'poor'];

  const interval = setInterval(async () => {
    try {
      const agent = agents[Math.floor(Math.random() * agents.length)];
      const eventType = Math.random();

      if (eventType < 0.4) {
        // 40% drift events
        const severity = severities[Math.floor(Math.random() * severities.length)];
        await generateDriftEvent(agent, severity);
      } else if (eventType < 0.7) {
        // 30% trust events
        const performance = performances[Math.floor(Math.random() * performances.length)];
        await generateTrustEvent(agent, performance);
      } else if (eventType < 0.85) {
        // 15% modification events
        await generateModificationEvent(agent, Math.random() > 0.3);
      } else {
        // 15% rollback events
        await generateRollbackEvent('Automated drift threshold exceeded');
      }
    } catch (error) {
      console.error('❌ Stream error:', error);
    }
  }, intervalMs);

  return () => {
    clearInterval(interval);
    console.log('📡 Telemetry stream stopped');
  };
}

/**
 * Populate Vault with sample data
 */
export async function populateVaultSampleData() {
  console.log('🗄️ Populating Vault with sample data...\n');

  try {
    // Add sample memories
    await addMemory({
      content: 'Phase 10E: Implemented Vault Sync + Fusion Bridge',
      tags: ['phase-10e', 'vault', 'fusion-bridge'],
    });

    await addMemory({
      content: 'Firebase Firestore integration completed',
      tags: ['firebase', 'firestore', 'backend'],
    });

    await addMemory({
      content: 'Telemetry dashboard with real-time updates',
      tags: ['dashboard', 'telemetry', 'ui'],
    });

    console.log('✅ Added 3 sample memories');

    // Add sample agents
    await addAgent({
      id: 'agent-archivist',
      name: 'Archivist',
      role: 'Memory Management',
    });

    await addAgent({
      id: 'agent-forge',
      name: 'ForgeBuilder',
      role: 'CAD File Processing',
    });

    await addAgent({
      id: 'agent-vault',
      name: 'VaultKeeper',
      role: 'State Synchronization',
    });

    console.log('✅ Added 3 sample agents');

    console.log('\n✅ Vault sample data populated!\n');
  } catch (error) {
    console.error('❌ Failed to populate Vault:', error);
  }
}

/**
 * Helper: Delay function
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Export all utilities
export default {
  generateDriftEvent,
  generateTrustEvent,
  generateRollbackEvent,
  generateModificationEvent,
  runTelemetryTest,
  startTelemetryStream,
  populateVaultSampleData,
};
