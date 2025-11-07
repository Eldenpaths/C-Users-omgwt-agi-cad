// Legacy routerWeights shim — delegates to adaptive store (src/lib/routerWeights)
import { getSnapshot, recordOutcome, type AgentId } from '@/lib/routerWeights'

export interface RouterWeight {
  agentId: 'echo' | 'fractal' | 'math' | 'sim'
  successRate: number // 0..1
  avgLatency: number // ms
  updatedAt: string // ISO
}

type WeightMap = Record<RouterWeight['agentId'], RouterWeight>

function mapKeyToAgentId(k: RouterWeight['agentId']): AgentId {
  switch (k) {
    case 'echo':
      return 'EchoArchivist'
    case 'fractal':
      return 'Fractalwright'
    case 'math':
      return 'Mathwright'
    case 'sim':
      return 'Simwright'
  }
}

function mapAgentToKey(a: AgentId): RouterWeight['agentId'] {
  switch (a) {
    case 'EchoArchivist':
      return 'echo'
    case 'Fractalwright':
      return 'fractal'
    case 'Mathwright':
      return 'math'
    case 'Simwright':
      return 'sim'
  }
}

export function loadWeights(): WeightMap {
  const snap = getSnapshot()
  const out: Partial<WeightMap> = {}
  for (const a of Object.values(snap.agents)) {
    const key = mapAgentToKey(a.agent)
    out[key] = {
      agentId: key,
      successRate: Number(a.emaSuccess.toFixed(4)),
      avgLatency: Math.round(a.emaLatency),
      updatedAt: new Date(snap.updatedAt || Date.now()).toISOString(),
    }
  }
  // Ensure all keys present
  return {
    echo: out.echo || { agentId: 'echo', successRate: 0.5, avgLatency: 2000, updatedAt: new Date(0).toISOString() },
    fractal: out.fractal || { agentId: 'fractal', successRate: 0.5, avgLatency: 2000, updatedAt: new Date(0).toISOString() },
    math: out.math || { agentId: 'math', successRate: 0.5, avgLatency: 2000, updatedAt: new Date(0).toISOString() },
    sim: out.sim || { agentId: 'sim', successRate: 0.5, avgLatency: 2000, updatedAt: new Date(0).toISOString() },
  }
}

export function saveWeights(_: WeightMap) {
  // No-op; adaptive store is the source of truth
}

export function updateWeights(agentId: RouterWeight['agentId'], success: boolean, latency: number) {
  const mapped = mapKeyToAgentId(agentId)
  recordOutcome({ taskId: `legacy_${Date.now()}`, agent: mapped, success, latencyMs: Math.max(0, latency), at: Date.now() })
  return loadWeights()
}
