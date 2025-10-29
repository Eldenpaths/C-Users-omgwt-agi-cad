#!/usr/bin/env node

// CLAUDE-META: Phase 10F Telemetry Testing - CLI Test Script
// Architect: Claude Code (Sonnet 4.5)
// Purpose: Command-line telemetry testing and validation
// Status: Production - Phase 10F Active

/**
 * CLI Telemetry Test Script
 *
 * Usage:
 *   npx tsx scripts/test-telemetry.js [command]
 *
 * Commands:
 *   test        - Run full telemetry test suite
 *   drift       - Generate sample drift events
 *   trust       - Generate sample trust events
 *   rollback    - Generate sample rollback events
 *   stream      - Start continuous telemetry stream
 *   vault       - Populate Vault with sample data
 *   all         - Run everything
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

// Firebase configuration (from .env.local)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
let db;
if (!getApps().length) {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  console.log('✅ Firebase initialized:', firebaseConfig.projectId);
} else {
  db = getFirestore(getApps()[0]);
}

/**
 * Log drift event to Firestore
 */
async function logDrift(agentId, driftScore, entropyScore, driftDetected, filePath) {
  const telemetryDoc = doc(collection(db, 'telemetry'));
  await setDoc(telemetryDoc, {
    type: 'drift',
    agentId,
    driftScore,
    entropyScore,
    driftDetected,
    entropyExceeded: entropyScore > 0.5,
    filePath,
    timestamp: serverTimestamp(),
    createdAt: Timestamp.now(),
  });
}

/**
 * Log trust event to Firestore
 */
async function logTrust(agentId, trustScore, successCount, failureCount, avgDrift) {
  const telemetryDoc = doc(collection(db, 'telemetry'));
  await setDoc(telemetryDoc, {
    type: 'trust',
    agentId,
    trustScore,
    successCount,
    failureCount,
    avgDrift,
    alpha: successCount,
    beta: failureCount,
    timestamp: serverTimestamp(),
    createdAt: Timestamp.now(),
  });
}

/**
 * Log rollback event to Firestore
 */
async function logRollback(modificationId, reason, triggeredBy, rolledBackCount) {
  const telemetryDoc = doc(collection(db, 'telemetry'));
  await setDoc(telemetryDoc, {
    type: 'rollback',
    modificationId,
    reason,
    triggeredBy,
    rolledBackCount,
    timestamp: serverTimestamp(),
    createdAt: Timestamp.now(),
  });
}

/**
 * Log modification event to Firestore
 */
async function logModification(agentId, filePath, approved, riskScore) {
  const telemetryDoc = doc(collection(db, 'telemetry'));
  await setDoc(telemetryDoc, {
    type: 'modification',
    agentId,
    filePath,
    approved,
    riskScore,
    timestamp: serverTimestamp(),
    createdAt: Timestamp.now(),
  });
}

/**
 * Update Vault state
 */
async function updateVaultState(updates) {
  const docRef = doc(db, 'vaultState', 'current');
  await setDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

/**
 * Generate drift test events
 */
async function testDriftEvents() {
  console.log('\n📊 Testing drift events...');

  await logDrift('agent-archivist', 0.02, 0.3, false, 'src/agents/Archivist.js');
  console.log('  ✓ Low drift event');
  await delay(300);

  await logDrift('agent-forge', 0.08, 0.6, false, 'src/agents/ForgeBuilder.js');
  console.log('  ✓ Medium drift event');
  await delay(300);

  await logDrift('agent-vault', 0.15, 0.9, true, 'src/lib/vault.js');
  console.log('  ✓ High drift event (detected)');
}

/**
 * Generate trust test events
 */
async function testTrustEvents() {
  console.log('\n🛡️  Testing trust events...');

  await logTrust('agent-archivist', 0.962, 50, 2, 0.01);
  console.log('  ✓ Excellent trust (0.962)');
  await delay(300);

  await logTrust('agent-forge', 0.857, 30, 5, 0.03);
  console.log('  ✓ Good trust (0.857)');
  await delay(300);

  await logTrust('agent-vault', 0.667, 20, 10, 0.06);
  console.log('  ✓ Fair trust (0.667)');
  await delay(300);

  await logTrust('agent-explorer', 0.333, 10, 20, 0.12);
  console.log('  ✓ Poor trust (0.333)');
}

/**
 * Generate rollback test events
 */
async function testRollbackEvents() {
  console.log('\n↩️  Testing rollback events...');

  await logRollback(`mod-${Date.now()}`, 'High drift detected', 'DriftMonitor', 5);
  console.log('  ✓ Rollback: High drift');
  await delay(300);

  await logRollback(`mod-${Date.now()}`, 'Manual rollback request', 'User', 3);
  console.log('  ✓ Rollback: Manual');
  await delay(300);

  await logRollback(`mod-${Date.now()}`, 'Trust threshold exceeded', 'TrustGuard', 8);
  console.log('  ✓ Rollback: Trust threshold');
}

/**
 * Generate modification test events
 */
async function testModificationEvents() {
  console.log('\n📝 Testing modification events...');

  await logModification('agent-archivist', 'src/lib/vault.js', true, 0.2);
  console.log('  ✓ Modification approved (risk: 0.2)');
  await delay(300);

  await logModification('agent-forge', 'src/lib/firebase.js', false, 0.8);
  console.log('  ✓ Modification rejected (risk: 0.8)');
  await delay(300);

  await logModification('agent-vault', 'src/components/panels/FusionPanel.jsx', true, 0.3);
  console.log('  ✓ Modification approved (risk: 0.3)');
}

/**
 * Populate Vault with sample data
 */
async function populateVault() {
  console.log('\n🗄️  Populating Vault...');

  await updateVaultState({
    memories: [
      {
        id: `mem-${Date.now()}-1`,
        content: 'Phase 10E: Implemented Vault Sync + Fusion Bridge',
        tags: ['phase-10e', 'vault', 'fusion-bridge'],
        timestamp: new Date().toISOString(),
      },
      {
        id: `mem-${Date.now()}-2`,
        content: 'Phase 10F: Live telemetry testing and validation',
        tags: ['phase-10f', 'telemetry', 'testing'],
        timestamp: new Date().toISOString(),
      },
      {
        id: `mem-${Date.now()}-3`,
        content: 'Firebase Firestore integration completed',
        tags: ['firebase', 'firestore', 'backend'],
        timestamp: new Date().toISOString(),
      },
    ],
    agents: [
      {
        id: 'agent-archivist',
        name: 'Archivist',
        role: 'Memory Management',
        registeredAt: new Date().toISOString(),
        trustScore: 0.962,
      },
      {
        id: 'agent-forge',
        name: 'ForgeBuilder',
        role: 'CAD File Processing',
        registeredAt: new Date().toISOString(),
        trustScore: 0.857,
      },
      {
        id: 'agent-vault',
        name: 'VaultKeeper',
        role: 'State Synchronization',
        registeredAt: new Date().toISOString(),
        trustScore: 0.667,
      },
    ],
    tasks: [
      {
        id: 'task-001',
        description: 'Implement telemetry dashboard',
        status: 'completed',
        assignedTo: 'agent-forge',
      },
      {
        id: 'task-002',
        description: 'Validate Firestore persistence',
        status: 'in_progress',
        assignedTo: 'agent-vault',
      },
      {
        id: 'task-003',
        description: 'Generate Phase 10F report',
        status: 'pending',
        assignedTo: 'agent-archivist',
      },
    ],
  });

  console.log('  ✓ Added 3 memories');
  console.log('  ✓ Added 3 agents');
  console.log('  ✓ Added 3 tasks');
}

/**
 * Start continuous telemetry stream
 */
async function startStream(durationSec = 30) {
  console.log(`\n📡 Starting telemetry stream (${durationSec}s)...\n`);

  const agents = ['agent-archivist', 'agent-forge', 'agent-vault', 'agent-explorer'];
  const startTime = Date.now();
  let count = 0;

  const interval = setInterval(async () => {
    try {
      const elapsed = (Date.now() - startTime) / 1000;
      if (elapsed >= durationSec) {
        clearInterval(interval);
        console.log(`\n✅ Stream completed (${count} events generated)`);
        process.exit(0);
      }

      const agent = agents[Math.floor(Math.random() * agents.length)];
      const eventType = Math.random();

      if (eventType < 0.4) {
        // Drift event
        const score = Math.random() * 0.2;
        await logDrift(agent, score, score * 3, score > 0.1, `src/test/${agent}.js`);
        console.log(`  [${elapsed.toFixed(1)}s] 🌀 Drift: ${agent} (${score.toFixed(4)})`);
      } else if (eventType < 0.7) {
        // Trust event
        const success = Math.floor(Math.random() * 50) + 10;
        const failure = Math.floor(Math.random() * 10) + 1;
        const trust = success / (success + failure);
        await logTrust(agent, trust, success, failure, Math.random() * 0.1);
        console.log(`  [${elapsed.toFixed(1)}s] 🛡️  Trust: ${agent} (${trust.toFixed(3)})`);
      } else if (eventType < 0.85) {
        // Modification event
        const approved = Math.random() > 0.3;
        await logModification(agent, `src/test/${agent}.js`, approved, Math.random());
        console.log(`  [${elapsed.toFixed(1)}s] 📝 Mod: ${agent} (${approved ? 'approved' : 'rejected'})`);
      } else {
        // Rollback event
        await logRollback(`mod-${Date.now()}`, 'Automated test', 'TestScript', Math.floor(Math.random() * 10) + 1);
        console.log(`  [${elapsed.toFixed(1)}s] ↩️  Rollback: ${agent}`);
      }

      count++;
    } catch (error) {
      console.error('  ❌ Stream error:', error.message);
    }
  }, 2000); // Event every 2 seconds
}

/**
 * Run full test suite
 */
async function runFullTest() {
  console.log('\n🧪 AGI-CAD Phase 10F Telemetry Test Suite\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    await testDriftEvents();
    await delay(1000);

    await testTrustEvents();
    await delay(1000);

    await testRollbackEvents();
    await delay(1000);

    await testModificationEvents();
    await delay(1000);

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n✅ Full test suite completed!\n');
    console.log('📊 Check dashboard: http://localhost:3006/dashboard');
    console.log('🧪 Test interface: http://localhost:3006/telemetry-test\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test suite failed:', error);
    process.exit(1);
  }
}

/**
 * Helper: delay function
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// CLI command parsing
const command = process.argv[2] || 'help';

switch (command) {
  case 'test':
    runFullTest();
    break;

  case 'drift':
    testDriftEvents().then(() => {
      console.log('\n✅ Drift tests completed');
      process.exit(0);
    });
    break;

  case 'trust':
    testTrustEvents().then(() => {
      console.log('\n✅ Trust tests completed');
      process.exit(0);
    });
    break;

  case 'rollback':
    testRollbackEvents().then(() => {
      console.log('\n✅ Rollback tests completed');
      process.exit(0);
    });
    break;

  case 'stream':
    startStream(30);
    break;

  case 'vault':
    populateVault().then(() => {
      console.log('\n✅ Vault populated');
      process.exit(0);
    });
    break;

  case 'all':
    (async () => {
      await runFullTest();
      await delay(2000);
      await populateVault();
      console.log('\n✅ All tests completed');
      process.exit(0);
    })();
    break;

  case 'help':
  default:
    console.log(`
AGI-CAD Phase 10F Telemetry Test CLI

Usage:
  npx tsx scripts/test-telemetry.js [command]

Commands:
  test        Run full telemetry test suite
  drift       Generate sample drift events
  trust       Generate sample trust events
  rollback    Generate sample rollback events
  stream      Start continuous telemetry stream (30s)
  vault       Populate Vault with sample data
  all         Run everything (test + vault)
  help        Show this help message

Examples:
  npx tsx scripts/test-telemetry.js test
  npx tsx scripts/test-telemetry.js stream
  npx tsx scripts/test-telemetry.js all
`);
    process.exit(0);
}
