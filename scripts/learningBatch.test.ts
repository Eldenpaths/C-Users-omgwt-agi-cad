/*
 Integration smoke test for LearningCore batch ingest.
 Usage:
   pnpm tsx scripts/learningBatch.test.ts --base http://localhost:3000 --count 1000 --lab plasma
*/

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
  switch (lab) {
    case 'plasma':
      return {
        userId: 'smoke-user',
        agentId: 'smoke-agent',
        runtimeMs: Math.floor(rand(250, 2000)),
        success: Math.random() > 0.15,
        parameters: { temperatureK: Math.round(rand(1.0e6, 2.0e7)), density: Number(rand(0.1, 1.5).toFixed(2)) },
        measurements: { confinementTimeMs: Math.round(rand(50, 400)), energyOutputJ: Number(rand(1, 20).toFixed(2)) },
      }
    case 'spectral':
      return {
        userId: 'smoke-user', agentId: 'smoke-agent', runtimeMs: Math.floor(rand(250, 2000)), success: Math.random() > 0.2,
        parameters: { wavelengthNm: Math.round(rand(300, 800)), exposureMs: Math.round(rand(10, 200)), sensorGain: Number(rand(0.5, 2.0).toFixed(2)) },
        measurements: { peakIntensity: Number(rand(0.1, 1.0).toFixed(3)), snr: Number(rand(5, 40).toFixed(2)) },
      }
    case 'chemistry':
      return {
        userId: 'smoke-user', agentId: 'smoke-agent', runtimeMs: Math.floor(rand(250, 2000)), success: Math.random() > 0.25,
        parameters: { reagentA: 'A', reagentB: 'B', temperatureC: Math.round(rand(10, 80)) },
        measurements: { yieldPercent: Number(rand(20, 95).toFixed(1)), purityPercent: Number(rand(60, 99).toFixed(1)) },
      }
    case 'crypto':
      return {
        userId: 'smoke-user', agentId: 'smoke-agent', runtimeMs: Math.floor(rand(50, 500)), success: Math.random() > 0.05,
        parameters: { algorithm: 'sha256', payloadSizeBytes: Math.round(rand(256, 8192)), iterations: Math.round(rand(1, 10)) },
        measurements: { throughputOps: Math.round(rand(1e3, 5e4)), latencyMs: Math.round(rand(1, 50)), errorRate: Number(rand(0, 0.05).toFixed(3)) },
      }
  }
}

async function main() {
  const { base, count, lab } = parseArgs()
  const url = `${base.replace(/\/$/, '')}/api/learning/ingest`
  const dataPoints = Array.from({ length: count }, () => ({ labType: lab, data: makeData(lab) }))
  const t0 = Date.now()
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ dataPoints }) })
  const json = await res.json().catch(() => ({}))
  const dt = Date.now() - t0
  if (!res.ok || !json?.ok) {
    console.error('Batch ingest failed:', json)
    process.exit(1)
  }
  console.log(`[BatchTest] posted=${count} total=${json.total} ok=${json.succeeded} failed=${json.failed} time=${dt}ms`)
}

main().catch((e) => { console.error(e); process.exit(1) })

