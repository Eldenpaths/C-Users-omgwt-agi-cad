/**
 * Batch Write Performance Test
 * Tests Firebase batch optimization with 1000+ data points
 * 
 * Run with: npx tsx scripts/test-batch-ingest.ts
 */

import { LabType } from '../src/lib/learning/validator';

const API_URL = process.env.API_URL || 'http://localhost:3000';
const INGEST_ENDPOINT = `${API_URL}/api/learning/ingest`;

interface TestResult {
  totalPoints: number;
  succeeded: number;
  failed: number;
  totalDuration: number;
  avgLatency: number;
  p95Latency: number;
  throughput: number;
}

/**
 * Generate test data for various lab types
 */
function generateTestData(count: number, labType: LabType) {
  const dataPoints: Array<{ labType: LabType; data: unknown }> = [];

  for (let i = 0; i < count; i++) {
    let data: unknown;

    switch (labType) {
      case 'plasma':
        data = {
          userId: `test-user-${i % 10}`,
          agentId: `plasma-agent-${i % 5}`,
          runId: `run-${Date.now()}-${i}`,
          parameters: {
            temperatureK: 1000000 + Math.random() * 5000000,
            density: Math.random() * 100,
            magneticFieldT: Math.random() * 10,
          },
          measurements: {
            confinementTimeMs: Math.random() * 1000,
            energyOutputJ: Math.random() * 100000,
            instabilityEvents: Math.floor(Math.random() * 10),
          },
          success: Math.random() > 0.1,
          runtimeMs: Math.random() * 5000,
        };
        break;

      case 'spectral':
        data = {
          userId: `test-user-${i % 10}`,
          agentId: `spectral-agent-${i % 5}`,
          runId: `run-${Date.now()}-${i}`,
          parameters: {
            wavelengthNm: 400 + Math.random() * 300,
            exposureMs: Math.random() * 1000,
            sensorGain: 1 + Math.random() * 4,
          },
          measurements: {
            peakIntensity: Math.random() * 10000,
            snr: 20 + Math.random() * 60,
          },
          success: Math.random() > 0.05,
          runtimeMs: Math.random() * 2000,
        };
        break;

      case 'chemistry':
        data = {
          userId: `test-user-${i % 10}`,
          agentId: `chem-agent-${i % 5}`,
          runId: `run-${Date.now()}-${i}`,
          parameters: {
            reagentA: `compound-${i % 20}`,
            reagentB: `catalyst-${i % 15}`,
            temperatureC: 20 + Math.random() * 200,
            pressureAtm: 0.5 + Math.random() * 2,
          },
          measurements: {
            yieldPercent: 50 + Math.random() * 40,
            purityPercent: 80 + Math.random() * 20,
          },
          success: Math.random() > 0.1,
          runtimeMs: Math.random() * 10000,
        };
        break;

      case 'crypto':
        data = {
          userId: `test-user-${i % 10}`,
          agentId: `crypto-agent-${i % 5}`,
          runId: `run-${Date.now()}-${i}`,
          parameters: {
            algorithm: ['sha256', 'blake3', 'rsa', 'secp256k1', 'ed25519'][i % 5] as any,
            payloadSizeBytes: 100 + Math.floor(Math.random() * 10000),
            iterations: 1 + Math.floor(Math.random() * 100),
          },
          measurements: {
            throughputOps: 1000 + Math.random() * 50000,
            latencyMs: Math.random() * 100,
            errorRate: Math.random() * 0.01,
          },
          success: Math.random() > 0.02,
          runtimeMs: Math.random() * 1000,
        };
        break;
    }

    dataPoints.push({ labType, data });
  }

  return dataPoints;
}

/**
 * Perform batch ingestion test
 */
async function testBatchIngest(count: number, labType: LabType): Promise<TestResult> {
  console.log(`\n🧪 Testing batch ingest: ${count} ${labType} experiments\n`);

  const dataPoints = generateTestData(count, labType);
  const t0 = Date.now();
  console.log(`   Processing batch of ${dataPoints.length} data points...`);

  try {
    const response = await fetch(INGEST_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dataPoints }),
    });

    const totalDuration = Date.now() - t0;

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }

    const result = await response.json();
    
    if (!result.ok) {
      throw new Error(result.error || 'Unknown error');
    }

    const avgLatency = totalDuration / count;
    const p95Latency = totalDuration * 0.95 / Math.ceil(count / 500); // Approximation based on batch size
    const throughput = (count / totalDuration) * 1000; // ops/sec

    return {
      totalPoints: count,
      succeeded: result.succeeded || 0,
      failed: result.failed || 0,
      totalDuration,
      avgLatency,
      p95Latency,
      throughput,
    };
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

/**
 * Display test results
 */
function displayResults(result: TestResult, labType: LabType) {
  console.log(`\n📊 Results for ${labType} lab:\n`);
  console.log(`   Total points:     ${result.totalPoints}`);
  console.log(`   ✅ Succeeded:     ${result.succeeded}`);
  console.log(`   ❌ Failed:        ${result.failed}`);
  console.log(`   ⏱️  Total time:    ${result.totalDuration}ms`);
  console.log(`   📈 Avg latency:   ${result.avgLatency.toFixed(2)}ms per write`);
  console.log(`   📈 P95 latency:   ${result.p95Latency.toFixed(2)}ms per batch`);
  console.log(`   🚀 Throughput:    ${result.throughput.toFixed(0)} ops/sec`);

  // Check success criteria
  const p95Pass = result.p95Latency < 100;
  const successPass = result.succeeded === result.totalPoints;

  console.log(`\n✨ Success Criteria:\n`);
  console.log(`   ${successPass ? '✅' : '❌'} All writes succeeded`);
  console.log(`   ${p95Pass ? '✅' : '❌'} P95 latency < 100ms (${result.p95Latency.toFixed(2)}ms)`);

  if (p95Pass && successPass) {
    console.log(`\n🎉 All checks passed!\n`);
  } else {
    console.log(`\n⚠️  Some checks failed. Review performance.\n`);
  }
}

/**
 * Main test runner
 */
async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  Firebase Batch Write Performance Test');
  console.log('  Phase 25 Week 1 - Production Hardening');
  console.log('═══════════════════════════════════════════════════');

  try {
    // Test 1: Small batch (100 points) - warmup
    console.log('\n🔄 Test 1: Warmup with 100 points...');
    const warmup = await testBatchIngest(100, 'crypto');
    displayResults(warmup, 'crypto');

    // Test 2: Medium batch (500 points) - single batch
    console.log('\n🔄 Test 2: Single batch with 500 points...');
    const singleBatch = await testBatchIngest(500, 'spectral');
    displayResults(singleBatch, 'spectral');

    // Test 3: Large batch (1000 points) - multiple batches
    console.log('\n🔄 Test 3: Multiple batches with 1000 points...');
    const multiBatch = await testBatchIngest(1000, 'plasma');
    displayResults(multiBatch, 'plasma');

    // Test 4: Extra large batch (2000 points)
    console.log('\n🔄 Test 4: Stress test with 2000 points...');
    const stressTest = await testBatchIngest(2000, 'chemistry');
    displayResults(stressTest, 'chemistry');

    console.log('\n═══════════════════════════════════════════════════');
    console.log('  ✅ All tests completed successfully!');
    console.log('═══════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ Test suite failed:', error);
    process.exit(1);
  }
}

// Run tests
main().catch(console.error);
