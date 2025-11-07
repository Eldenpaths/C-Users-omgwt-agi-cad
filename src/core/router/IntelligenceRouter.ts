import { EchoArchivistAgent } from '@/agents/archivistAgent'
import { FractalwrightAgent } from '@/agents/fractalwright'
import { MathwrightAgent } from '@/agents/mathwright'
import { SimwrightAgent } from '@/agents/simwright'
import { updateWeights } from './routerWeights'

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
      return result
    } catch (e) {
      const latency = Date.now() - start
      updateWeights(rt.agent, false, latency)
      throw e
    }
  }
}

export const intelligenceRouter = new IntelligenceRouter()
export const AGI_Router = intelligenceRouter
