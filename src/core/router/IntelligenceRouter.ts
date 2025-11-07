import { EchoArchivistAgent } from '@/agents/archivistAgent'
import { FractalwrightAgent } from '@/agents/fractalwright'
import { MathwrightAgent } from '@/agents/mathwright'
import { SimwrightAgent } from '@/agents/simwright'
 { setAgentOverride } from '@/lib/routerWeights'
import { getSnapshot, expectedUtility } from '@/lib/routerWeights'
import { getFullProfile } from '@/lib/routerProfiles/profileStore'
import { getPolicy, setPolicy } from '@/lib/routerProfiles/policyStore'
import { computeRollingDelta, applyPolicyAdjustments } from '@/lib/routerProfiles/policyEngine'
import { getSnapshot } from '@/lib/routerWeights'
import { expectedUtility } from '@/lib/routerWeights'
import { updateProfile } from '@/lib/routerProfiles/profileStore'
import { recordOutcome } from '@/lib/routerWeights'

export type RouteKind = 'echo' | 'fractal' | 'math' | 'sim'

export interface RouteTask {
  agent: RouteKind
  payload: any
}

type AgentMap = Record<RouteKind, any>

export class IntelligenceRouter {
  private registry: AgentMap

  constructor() {
    this.registry = {
      echo: EchoArchivistAgent,
      fractal: FractalwrightAgent,
      math: MathwrightAgent,
      sim: SimwrightAgent,
    }
  }

  /**
   * Delegates a task to the correct agent based on the 'agent' key.
   */
  async routeTask(task: RouteTask | Record<string, any>): Promise<any> {
    if ((task as any).agent === undefined) {
      const t = task as any
      const text = `${t.goal || ''} ${t.context || ''}`.toLowerCase()
      let inferred: RouteKind = 'echo'
      if (/(plasma|lab|prototype|sim)/.test(text)) inferred = 'sim'
      else if (/(fractal|embedding|lacunarity|d_var)/.test(text)) inferred = 'fractal'
      else if (/(math|verify|equation|proof)/.test(text)) inferred = 'math'
      const payload = inferred === 'sim'
        ? { type: 'plasma_lab', target: 'stability_check' }
        : inferred === 'math'
          ? { equation: '1+1=2', kind: 'algebra' as const }
          : inferred === 'fractal'
            ? { embedding: Array.from({ length: 16 }, (_, i) => Math.sin(i) * 5 + Math.random()) }
            : { mode: 'auto' as const }
      return this.routeTask({ agent: inferred, payload })
    }

    const rt = task as RouteTask
    const agent = this.registry[rt.agent]
    if (!agent) throw new Error(`Unknown agent: ${rt.agent}`)

    const start = Date.now()
    const taskId = (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
      ? (crypto as any).randomUUID()
      : `rt_${start}_${Math.floor(Math.random()*1e6)}`
    try {
      let result: any
      switch (rt.agent) {
        case 'echo':
          result = await agent.deepScan(rt.payload); break
        case 'fractal':
          result = await agent.monitor(rt.payload); break
        case 'math':
          result = await agent.verify(rt.payload); break
        case 'sim':
          result = await agent.buildPrototype(rt.payload); break
        default:
          throw new Error(`No route for ${rt.agent}`)
      }
      const latency = Date.now() - start
      updateWeights(rt.agent, true, latency)
      try {
        recordOutcome({ taskId, agent: rt.agent.toString() as any, success: true, latencyMs: latency, at: Date.now() })
      } catch {}
      // Phase 25: operator profiles (optional uid on payload)
      try {
        const uid = (rt as any)?.payload?.uid || (rt as any)?.payload?.userId
        if (uid) {
          const snap = getSnapshot()
          const stats = snap.agents[rt.agent as any]
            try { const prof = await getFullProfile(String(uid)); const cfg = await getPolicy(String(uid)); const deltaAvg = computeRollingDelta(prof?.rewards || [], cfg.window); const snap2 = getSnapshot(); const adjusted = applyPolicyAdjustments({ ...snap2.agents }, deltaAvg, cfg); for (const key of Object.keys(adjusted)) { const bias = (adjusted as any)[key]?.bias; if (typeof bias === 'number') setAgentOverride(key as any, { bias }); } await setPolicy(String(uid), { lastAutoTune: Date.now() }); } catch {}\n        }
      } catch {}
      return result
    } catch (e) {
      const latency = Date.now() - start
      updateWeights(rt.agent, false, latency)
      try {
        recordOutcome({ taskId, agent: rt.agent.toString() as any, success: false, latencyMs: latency, at: Date.now() })
      } catch {}
      try {
        const uid = (rt as any)?.payload?.uid || (rt as any)?.payload?.userId
        if (uid) {
          const snap = getSnapshot()
          const stats = snap.agents[rt.agent as any]
            try { const prof = await getFullProfile(String(uid)); const cfg = await getPolicy(String(uid)); const deltaAvg = computeRollingDelta(prof?.rewards || [], cfg.window); const snap2 = getSnapshot(); const adjusted = applyPolicyAdjustments({ ...snap2.agents }, deltaAvg, cfg); for (const key of Object.keys(adjusted)) { const bias = (adjusted as any)[key]?.bias; if (typeof bias === 'number') setAgentOverride(key as any, { bias }); } await setPolicy(String(uid), { lastAutoTune: Date.now() }); } catch {}\n        }
      } catch {}
      throw e
    }
  }
}

export const intelligenceRouter = new IntelligenceRouter()
export const AGI_Router = intelligenceRouter



