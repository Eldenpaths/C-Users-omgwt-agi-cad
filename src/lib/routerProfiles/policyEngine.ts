import type { RewardRecord } from './profileTypes'
import type { PolicyConfig } from './policyTypes'

export function computeRollingDelta(rewards: RewardRecord[], window: number) {
  const last = (rewards || []).slice(-Math.max(1, window))
  const avg = last.reduce((s, r) => s + Number(r.delta || 0), 0) / Math.max(1, last.length)
  return Number(avg.toFixed(4))
}

export function applyPolicyAdjustments(agents: Record<string, any>, delta: number, cfg: PolicyConfig) {
  const adj = Math.sign(delta) * cfg.rebiasRate
  for (const a of Object.values(agents || {})) {
    switch (cfg.mode) {
      case 'risk-seeking':
        a.bias = (a.bias ?? 0) + adj
        break
      case 'conservative':
        a.bias = (a.bias ?? 0) - adj / 2
        break
      case 'balanced':
      default:
        a.bias = (a.bias ?? 0) + adj / 4
        break
    }
  }
  return agents
}
