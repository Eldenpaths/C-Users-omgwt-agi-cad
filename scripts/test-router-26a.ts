/**
 * Phase 26A test harness — simulate policies and verify bias adjustments.
 */
import { computeRollingDelta, applyPolicyAdjustments } from '@/lib/routerProfiles/policyEngine'
import type { PolicyConfig } from '@/lib/routerProfiles/policyTypes'
import type { RewardRecord } from '@/lib/routerProfiles/profileTypes'

const rewards: RewardRecord[] = Array.from({ length: 50 }, (_, i) => ({
  taskId: 	_,
  agent: i % 2 === 0 ? 'EchoArchivist' : 'Fractalwright',
  delta: (Math.random() - 0.4) * 0.5,
  timestamp: Date.now() - i * 1000,
}))

const agents: Record<string, any> = {
  EchoArchivist: { bias: 0 },
  Fractalwright: { bias: 0 },
  Mathwright: { bias: 0 },
  Simwright: { bias: 0 },
}

function run(mode: PolicyConfig['mode']) {
  const cfg: PolicyConfig = { mode, window: 30, rebiasRate: 0.05 }
  const deltaAvg = computeRollingDelta(rewards, cfg.window)
  const adj = applyPolicyAdjustments({ ...agents }, deltaAvg, cfg)
  console.log(mode, '?avg =', deltaAvg, '? biases', Object.fromEntries(Object.entries(adj).map(([k,v])=>[k,(v as any).bias])))
}

run('balanced')
run('risk-seeking')
run('conservative')

