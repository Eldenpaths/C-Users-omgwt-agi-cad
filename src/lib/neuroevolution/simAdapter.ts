/**
 * Simulation Core Adapter:
 * Call this module after each simulation task completes to persist metrics,
 * update live feedback, and broadcast WS metrics. Designed to be lightweight
 * and easy to invoke from your simulation loop.
 */

import { recordSimulationFeedback } from './feedback'
import { recordTaskPerformance } from './metricsServer'
import { broadcastMetrics } from './wsServer'
import { taskFitness } from './strategies'
import type { TaskContext } from './tasks'
import type { MultiObjectiveAgent } from './agent'

export type TaskRunMetrics = { timeMs: number; accuracy: number; energy: number }

/**
 * Handle a completed task run for an agent. Computes fitness and publishes metrics.
 */
export async function handleTaskCompleted(params: {
  agentId: string
  task: TaskContext
  generation: number
  agent: MultiObjectiveAgent
  metrics: TaskRunMetrics
}) {
  const { agentId, task, generation, agent, metrics } = params

  // 1) Update local feedback cache
  recordSimulationFeedback(agentId, task.type, {
    timeMs: metrics.timeMs,
    accuracy: metrics.accuracy,
    energy: metrics.energy,
  })

  // 2) Compute fitness using current task constraints + real metrics
  const fitness = taskFitness(agent, task, task.constraints.complexity, {
    timeMs: metrics.timeMs,
    accuracy: metrics.accuracy,
    energy: metrics.energy,
  })

  // 3) Persist evolution metrics (Admin Firestore)
  await recordTaskPerformance({
    agentId,
    taskType: task.type,
    generation,
    speed: agent.speed,
    accuracy: agent.accuracy,
    efficiency: agent.efficiency,
    fitness,
  })

  // 4) Broadcast to WebSocket subscribers (topic: agent/{agentId}/metrics)
  broadcastMetrics({
    agentId,
    taskType: task.type,
    generation,
    metrics: { timeMs: metrics.timeMs, accuracy: metrics.accuracy, energy: metrics.energy },
    fitness,
  })

  return { fitness }
}

/**
 * Optionally expose a small helper that a simulation can call each tick or episode.
 */
export async function onSimulationTick(args: {
  done: boolean
  agentId: string
  task: TaskContext
  generation: number
  agent: MultiObjectiveAgent
  metrics: TaskRunMetrics
}) {
  if (!args.done) return
  return handleTaskCompleted(args)
}

