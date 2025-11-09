/*
 Integration smoke test for LearningCore batch ingest.
 Usage:
   pnpm tsx scripts/learningBatch.test.ts --base http://localhost:3000 --count 1000 --lab plasma
*/

// Load environment variables from .env.local
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

import { getAdminDb } from '../src/lib/server/firebaseAdmin.js';

type Args = { base: string; count: number; lab: 'plasma'|'spectral'|'chemistry'|'crypto' }

function parseArgs(): Args {
  const argv = process.argv.slice(2)
  const m = new Map<string,string>()
  for (let i = 0; i < argv.length; i += 2) {
    const k = argv[i]
    const v = argv[i+1]
    if (!k || !v) break
    m.set(k.replace(/^--/, ''), v)
  }
  const base = m.get('base') || 'http://localhost:3000'
  const count = Number(m.get('count') || '1000')
  const lab = (m.get('lab') as any) || 'plasma'
  return { base, count, lab }
}

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min
}

function makeData(lab: Args['lab']) {
  const baseData = {
    userId: 'smoke-user',
    agentId: 'smoke-agent',
    runId: `run-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    runtimeMs: Math.floor(rand(250, 2000)),
    success: Math.random() > 0.15,
  };

  switch (lab) {
    case 'plasma':
      return {
        ...baseData,
        parameters: { temperatureK: Math.round(rand(1.0e6, 2.0e7)), density: Number(rand(0.1, 1.5).toFixed(2)) },
        measurements: { confinementTimeMs: Math.round(rand(50, 400)), energyOutputJ: Number(rand(1, 20).toFixed(2)) },
      }
    case 'spectral':
      return {
        ...baseData,
        parameters: { wavelengthNm: Math.round(rand(300, 800)), exposureMs: Math.round(rand(10, 200)), sensorGain: Number(rand(0.5, 2.0).toFixed(2)) },
        measurements: { peakIntensity: Number(rand(0.1, 1.0).toFixed(3)), snr: Number(rand(5, 40).toFixed(2)) },
      }
    case 'chemistry':
      return {
        ...baseData,
        parameters: { reagentA: 'A', reagentB: 'B', temperatureC: Math.round(rand(10, 80)) },
        measurements: { yieldPercent: Number(rand(20, 95).toFixed(1)), purityPercent: Number(rand(60, 99).toFixed(1)) },
      }
    case 'crypto':
      return {
        ...baseData,
        parameters: { algorithm: 'sha256', payloadSizeBytes: Math.round(rand(256, 8192)), iterations: Math.round(rand(1, 10)) },
        measurements: { throughputOps: Math.round(rand(1e3, 5e4)), latencyMs: Math.round(rand(1, 50)), errorRate: Number(rand(0, 0.05).toFixed(3)) },
      }
  }
}

async function cleanupTelemetry() {
    const db = getAdminDb();
    const telemetryRef = db.collection('telemetry');
    const userSnapshot = await telemetryRef.where('userId', '==', 'smoke-user').get();
    const batchSnapshot = await telemetryRef.where('userId', '==', 'batch').get();
    
    if (userSnapshot.empty && batchSnapshot.empty) {
        return;
    }

    const batch = db.batch();
    userSnapshot.docs.forEach(doc => batch.delete(doc.ref));
    batchSnapshot.docs.forEach(doc => batch.delete(doc.ref));
    
    await batch.commit();
    const totalDeleted = userSnapshot.size + batchSnapshot.size;
    console.log(`[BatchTest] Cleaned up ${totalDeleted} old telemetry events.`);
}

async function testSingleWrite(url: string, lab: Args['lab']) {
    console.log('[SingleWriteTest] Running single write test...');
    const dataPoint = { labType: lab, data: makeData(lab) };
    const t0 = Date.now();
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dataPoint) });
    const json = await res.json().catch(() => ({}));
    const dt = Date.now() - t0;

    if (!res.ok || !json?.ok) {
        console.error('[SingleWriteTest] Single write failed:', json);
        process.exit(1);
    }
    console.log(`[SingleWriteTest] posted=1 time=${dt}ms`);

    // Verify telemetry
    const db = getAdminDb();
    const telemetryRef = db.collection('telemetry');
    const snapshot = await telemetryRef.where('userId', '==', 'smoke-user').where('event', '==', 'learning.write.single').get();
    if (snapshot.size === 1) {
        console.log('[SingleWriteTest] Telemetry check PASSED: Found 1 learning.write.single event.');
    } else {
        console.error(`[SingleWriteTest] Telemetry check FAILED: Expected 1 learning.write.single event, but found ${snapshot.size}.`);
        process.exit(1);
    }
}

async function main() {
  const { base, count, lab } = parseArgs()
  const url = `${base.replace(/\/$/, '')}/api/learning/ingest`

  await cleanupTelemetry();
  await testSingleWrite(url, lab);
  await cleanupTelemetry();

  console.log(`[BatchTest] Running batch write test with ${count} data points...`);
  const dataPoints = Array.from({ length: count }, () => ({ labType: lab, data: makeData(lab) }))
  const t0 = Date.now()
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ dataPoints }) })
  const json = await res.json().catch(() => ({}))
  const dt = Date.now() - t0
  if (!res.ok || !json?.ok) {
    console.error('[BatchTest] Batch ingest failed:', json)
    process.exit(1)
  }
  console.log(`[BatchTest] posted=${count} total=${json.total} ok=${json.succeeded} failed=${json.failed} time=${dt}ms`)

  // Verify telemetry
  const db = getAdminDb();
  const telemetryRef = db.collection('telemetry');
  const snapshot = await telemetryRef.where('userId', '==', 'batch').where('event', '==', 'learning.batch.commit').get();
  
  const expectedBatches = Math.ceil(count / 500);
  if (snapshot.size === expectedBatches) {
    console.log(`[BatchTest] Telemetry check PASSED: Found ${snapshot.size} learning.batch.commit events as expected.`);
  } else {
    console.error(`[BatchTest] Telemetry check FAILED: Expected ${expectedBatches} learning.batch.commit events, but found ${snapshot.size}.`);
    process.exit(1);
  }

  // Verify performance
  const latencies = snapshot.docs.map(doc => doc.data().meta.latencyMs);
  latencies.sort((a, b) => a - b);
  const p95Latency = latencies[Math.floor(latencies.length * 0.95) -1] || 0;
  if (p95Latency < 100) {
      console.log(`[BatchTest] Performance check PASSED: p95 latency is ${p95Latency}ms.`);
  } else {
      console.error(`[BatchTest] Performance check FAILED: p95 latency is ${p95Latency}ms, which is >= 100ms.`);
      process.exit(1);
  }

  await cleanupTelemetry();
}

main().catch((e) => { console.error(e); process.exit(1) })

