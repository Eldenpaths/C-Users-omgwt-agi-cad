import fs from 'fs'
import path from 'path'

export interface RouterWeight {
  agentId: 'echo' | 'fractal' | 'math' | 'sim'
  successRate: number // 0..1
  avgLatency: number // ms
  updatedAt: string // ISO
}

type WeightMap = Record<RouterWeight['agentId'], RouterWeight>

function resolveWeightsPath(): string {
  const root = process.cwd()
  const candidates = [
    path.join(root, 'AGI-CAD-Core', 'vault', 'routerWeights.json'),
    path.join(root, 'vault', 'routerWeights.json'),
    path.join(root, '.next', 'routerWeights.json'), // fallback in build env
  ]
  for (const p of candidates) {
    try {
      const dir = path.dirname(p)
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
      return p
    } catch {}
  }
  return path.join(root, 'routerWeights.json')
}

const DEFAULTS: WeightMap = {
  echo: { agentId: 'echo', successRate: 0.95, avgLatency: 50, updatedAt: new Date(0).toISOString() },
  fractal: { agentId: 'fractal', successRate: 0.9, avgLatency: 60, updatedAt: new Date(0).toISOString() },
  math: { agentId: 'math', successRate: 0.92, avgLatency: 55, updatedAt: new Date(0).toISOString() },
  sim: { agentId: 'sim', successRate: 0.93, avgLatency: 70, updatedAt: new Date(0).toISOString() },
}

export function loadWeights(): WeightMap {
  const file = resolveWeightsPath()
  try {
    if (fs.existsSync(file)) {
      const data = JSON.parse(fs.readFileSync(file, 'utf8')) as WeightMap
      return { ...DEFAULTS, ...data }
    }
  } catch {}
  return { ...DEFAULTS }
}

export function saveWeights(map: WeightMap) {
  const file = resolveWeightsPath()
  try {
    fs.writeFileSync(file, JSON.stringify(map, null, 2), 'utf8')
  } catch {}
}

/**
 * Online update of router weights based on success signal and latency. 
 * Exponential moving average for successRate and avgLatency.
 */
export function updateWeights(agentId: RouterWeight['agentId'], success: boolean, latency: number) {
  const alpha = 0.2
  const map = loadWeights()
  const cur = map[agentId] || { agentId, successRate: 0.9, avgLatency: 60, updatedAt: new Date(0).toISOString() }
  const nextSuccess = (1 - alpha) * cur.successRate + alpha * (success ? 1 : 0)
  const nextLatency = (1 - alpha) * cur.avgLatency + alpha * Math.max(0, latency)
  map[agentId] = {
    agentId,
    successRate: Number(nextSuccess.toFixed(4)),
    avgLatency: Math.round(nextLatency),
    updatedAt: new Date().toISOString(),
  }
  saveWeights(map)
  return map
}

