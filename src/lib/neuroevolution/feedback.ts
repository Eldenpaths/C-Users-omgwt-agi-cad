/**
 * Simulation feedback adapter — stores recent task metrics per agent and task.
 * Can be used to adapt taskFitness and mutation strategies dynamically.
 */

import type { TaskContext } from './tasks'
import type { Agent, MultiObjectiveAgent } from './agent'
import { taskFitness, type SimulationMetrics } from './strategies'

type Key = string // `${agentId}:${task.type}`
const cache = new Map<Key, SimulationMetrics>()

export function cacheKey(agentId: string, taskType: string) {
  return `${agentId}:${taskType}`
}

export function recordSimulationFeedback(agentId: string, taskType: string, metrics: SimulationMetrics) {
  cache.set(cacheKey(agentId, taskType), metrics)
}

export function readSimulationFeedback(agentId: string, taskType: string): SimulationMetrics | undefined {
  return cache.get(cacheKey(agentId, taskType))
}

/** Compute fitness with cached metrics if present. */
export function fitnessWithFeedback(
  agent: Agent | MultiObjectiveAgent,
  task: TaskContext,
  taskComplexity: number,
  agentId?: string
) {
  const metrics = agentId ? readSimulationFeedback(agentId, task.type) : undefined
  return taskFitness(agent, task, taskComplexity, metrics)
}

