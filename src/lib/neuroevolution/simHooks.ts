/**
 * Simulation Core Hooks adapter
 *
 * Binds to a generic event emitter-like Simulation Core object that emits
 * 'task:completed' events with payload: { agentId, task, generation, agent, metrics }
 * and calls handleTaskCompleted to feed the evolution feedback loop.
 */

import { handleTaskCompleted, onSimulationTick, type TaskRunMetrics } from './simAdapter'
import type { TaskContext } from './tasks'
import type { MultiObjectiveAgent } from './agent'

type CompletedPayload = {
  agentId: string
  task: TaskContext
  generation: number
  agent: MultiObjectiveAgent
  metrics: TaskRunMetrics
}

type OnLike = (event: string, handler: (payload: any) => void) => void
type OffLike = (event: string, handler: (payload: any) => void) => void

/**
 * Bind Simulation Core events:
 * - task:completed → handleTaskCompleted
 * - tick → onSimulationTick(done=true triggers handleTaskCompleted)
 * Returns an unbind function if simulation.off is provided; otherwise a no-op.
 */
export function bindSimulationHooks(simulation: { on: OnLike; off?: OffLike }) {
  const onCompleted = async (payload: CompletedPayload) => {
    try {
      await handleTaskCompleted(payload)
    } catch (e) {
      console.warn('[simHooks] handleTaskCompleted failed:', (e as Error).message)
    }
  }
  const onTick = async (payload: CompletedPayload & { done?: boolean }) => {
    if (!payload?.done) return
    try {
      await onSimulationTick({
        done: true,
        agentId: payload.agentId,
        task: payload.task,
        generation: payload.generation,
        agent: payload.agent,
        metrics: payload.metrics,
      })
    } catch (e) {
      console.warn('[simHooks] onSimulationTick failed:', (e as Error).message)
    }
  }

  simulation.on('task:completed', onCompleted)
  simulation.on('tick', onTick)

  return () => {
    if (typeof simulation.off === 'function') {
      try { simulation.off('task:completed', onCompleted) } catch {}
      try { simulation.off('tick', onTick) } catch {}
    }
  }
}
