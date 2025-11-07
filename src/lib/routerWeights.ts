// src/lib/routerWeights.ts
// Phase 24B — Adaptive router weights + route telemetry (EMA + UCB1 hybrid)

export type AgentId = 'EchoArchivist' | 'Fractalwright' | 'Mathwright' | 'Simwright'

export type RouteTask = {
  id: string
  kind: string
  payloadSize?: number
  difficulty?: number // 0..1 user-supplied difficulty estimate
  createdAt?: number
}

export type Outcome = {
  taskId: string
  agent: AgentId
  success: boolean
  latencyMs: number
  confidence?: number // optional 0..1, if your agent reports it
  at: number
}

export type AgentStats = {
  agent: AgentId
  calls: number
  successes: number
  emaSuccess: number
  emaLatency: number
  lastCalledAt?: number
  lastOutcomeAt?: number
  ucbScore: number
  bias?: number // manual operator bias, -0.5..+0.5
}

export type RouterSnapshot = {
  agents: Record<AgentId, AgentStats>
  recent: Outcome[]
  version: number
  updatedAt: number
}

type InternalState = {
  agents: Record<AgentId, AgentStats>
  recent: Outcome[]
  version: number
  updatedAt: number
  paused: boolean
}

const DEFAULT_AGENTS: AgentId[] = ['EchoArchivist', 'Fractalwright', 'Mathwright', 'Simwright']

const EMA_ALPHA_SUCCESS = 0.2
const EMA_ALPHA_LATENCY = 0.1
const RECENT_MAX = 250
const EXPLORATION_C = 1.25
const MIN_CALLS_FOR_CONF = 5

// keep hot-reload safe
const g = globalThis as unknown as { __router24B?: InternalState }

function initState(): InternalState {
  const agents = Object.fromEntries(
    DEFAULT_AGENTS.map((a) => [
      a,
      {
        agent: a,
        calls: 0,
        successes: 0,
        emaSuccess: 0.5,
        emaLatency: 2000, // 2s baseline
        lastCalledAt: undefined,
        lastOutcomeAt: undefined,
        ucbScore: 0,
        bias: 0,
      },
    ]),
  ) as Record<AgentId, AgentStats>

  return { agents, recent: [], version: 1, updatedAt: Date.now(), paused: false }
}

const state: InternalState = (g.__router24B ??= initState())

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x))
}

function now() {
  return Date.now()
}

// lightweight difficulty-normalized score
function expectedUtility(s: AgentStats, task?: RouteTask) {
  const diff = clamp01(task?.difficulty ?? 0.5)
  const succ = s.emaSuccess
  const speed = 1 / Math.max(200, s.emaLatency) // lower latency => higher speed
  const bias = typeof s.bias === 'number' ? s.bias : 0
  const utility = 0.75 * succ * (0.5 + diff) + 0.25 * speed + bias
  return utility
}

export function chooseAgent(task?: RouteTask): AgentId {
  // If paused, compute best without side-effects
  if (state.paused) {
    for (const a of Object.values(state.agents)) {
      a.ucbScore = expectedUtility(a, task)
    }
    let best: AgentStats | null = null
    for (const a of Object.values(state.agents)) {
      if (!best || a.ucbScore > best.ucbScore) best = a
    }
    return best!.agent
  }
  const totalCalls = Object.values(state.agents).reduce((n, a) => n + a.calls, 1)
  for (const a of Object.values(state.agents)) {
    const mean = expectedUtility(a, task)
    const bonus = a.calls < MIN_CALLS_FOR_CONF ? EXPLORATION_C : EXPLORATION_C * Math.sqrt(Math.log(totalCalls) / (a.calls || 1))
    a.ucbScore = mean + bonus
  }

  let best: AgentStats | null = null
  for (const a of Object.values(state.agents)) {
    if (!best || a.ucbScore > best.ucbScore) best = a
  }
  const picked = best!.agent
  state.agents[picked].calls += 1
  state.agents[picked].lastCalledAt = now()
  state.updatedAt = now()
  state.version += 1
  return picked
}

export function recordOutcome(out: Outcome) {
  const a = state.agents[out.agent]
  if (!a) return

  if (!state.paused) {
    a.emaSuccess = (1 - EMA_ALPHA_SUCCESS) * a.emaSuccess + EMA_ALPHA_SUCCESS * (out.success ? 1 : 0)
    a.emaLatency = (1 - EMA_ALPHA_LATENCY) * a.emaLatency + EMA_ALPHA_LATENCY * out.latencyMs
    if (out.success) a.successes += 1
    a.lastOutcomeAt = out.at
  }

  state.recent.push(out)
  if (state.recent.length > RECENT_MAX) state.recent.shift()

  state.updatedAt = now()
  state.version += 1
}

export function getSnapshot(): RouterSnapshot {
  return {
    agents: structuredClone(state.agents),
    recent: [...state.recent],
    version: state.version,
    updatedAt: state.updatedAt,
  }
}

// simple reset (for tests)
export function __resetForTests() {
  g.__router24B = initState()
}

// Control plane
export function pauseRouter() {
  state.paused = true
  state.updatedAt = now()
  state.version += 1
}

export function resumeRouter() {
  state.paused = false
  state.updatedAt = now()
  state.version += 1
}

export function getRouterStatus() {
  return { paused: state.paused, version: state.version, updatedAt: state.updatedAt }
}

export function setAgentOverride(agent: AgentId, override: Partial<Pick<AgentStats, 'emaSuccess' | 'emaLatency' | 'bias'>>) {
  const a = state.agents[agent]
  if (!a) return { ok: false }
  if (override.emaSuccess !== undefined) a.emaSuccess = clamp01(Number(override.emaSuccess))
  if (override.emaLatency !== undefined) a.emaLatency = Math.max(1, Number(override.emaLatency))
  if (override.bias !== undefined) a.bias = Math.max(-0.5, Math.min(0.5, Number(override.bias)))
  state.updatedAt = now()
  state.version += 1
  return { ok: true }
}
