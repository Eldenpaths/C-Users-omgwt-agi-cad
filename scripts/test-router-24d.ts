/**
 * scripts/test-router-24d.ts
 * Lightweight checks for Phase 24D (pause/resume, overrides).
 * Run: pnpm exec tsx scripts/test-router-24d.ts
 */
import { chooseAgent, recordOutcome, pauseRouter, resumeRouter, getSnapshot, setAgentOverride } from '@/lib/routerWeights'

async function main() {
  console.log('--- Phase 24D Test Harness ---')

  // Baseline selection
  const a1 = chooseAgent({ id: 't0', kind: 'baseline', difficulty: 0.5 })
  console.log('chooseAgent baseline ->', a1)

  // Emit outcomes to move EMAs
  recordOutcome({ taskId: 't0', agent: a1, success: true, latencyMs: 800, at: Date.now() })
  recordOutcome({ taskId: 't1', agent: a1, success: false, latencyMs: 2200, at: Date.now() })
  console.log('after outcomes ->', JSON.stringify(getSnapshot().agents[a1], null, 2))

  // Pause: stats must not change
  pauseRouter()
  const before = JSON.stringify(getSnapshot().agents[a1])
  recordOutcome({ taskId: 't2', agent: a1, success: true, latencyMs: 100, at: Date.now() })
  const after = JSON.stringify(getSnapshot().agents[a1])
  console.log('paused stats unchanged ->', before === after)

  // Resume and override bias up
  resumeRouter()
  setAgentOverride(a1, { bias: 0.5 })
  const pick = chooseAgent({ id: 't3', kind: 'probe', difficulty: 0.6 })
  console.log('chooseAgent with bias ->', pick)

  console.log('--- 24D Test Done ---')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

