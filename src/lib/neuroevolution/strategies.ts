import type { Agent, MultiObjectiveAgent } from './agent'
import { evaluateMultiObjectiveFitness } from './agent'
import { annealingMutation } from './core'
import { defaultWeightsForTask, annealingSchedule, type TaskContext } from './tasks'

function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)) }

/**
 * Compute attribute-specific mutation factors given task type and constraints.
 * Returns multiplicative ranges per attribute: [min, max].
 */
export function mutationRangesForTask(task: TaskContext, baseMin = 0.9, baseMax = 1.1) {
  const t = task.type
  const { energyLimit, timeDeadlineMs } = task.constraints
  let speed = { min: baseMin, max: baseMax }
  let accuracy = { min: baseMin, max: baseMax }
  let efficiency = { min: baseMin, max: baseMax }

  if (t === 'resource') {
    // Favor efficiency improvements; tighten speed changes.
    speed = { min: 0.95, max: 1.05 }
    efficiency = { min: 0.98, max: 1.15 }
  } else if (t === 'time') {
    // Favor speed increases; keep accuracy stable.
    speed = { min: 1.0, max: 1.2 }
    accuracy = { min: 0.95, max: 1.05 }
  } else if (t === 'accuracy') {
    // Favor accuracy; stability in speed, moderate efficiency.
    accuracy = { min: 1.0, max: 1.15 }
    speed = { min: 0.95, max: 1.05 }
  }

  // Apply constraints influence
  if (typeof energyLimit === 'number') {
    // Tight energy limit: push efficiency up, reduce speed growth
    efficiency.max = Math.max(efficiency.max, 1.15)
    speed.max = Math.min(speed.max, 1.05)
  }
  if (typeof timeDeadlineMs === 'number') {
    // Tight deadline: bias speed more
    speed.max = Math.max(speed.max, 1.2)
    accuracy.min = Math.max(accuracy.min, 0.95)
  }

  return { speed, accuracy, efficiency }
}

/**
 * Task-specific mutation combining adaptive behavior, per-attribute ranges, and annealing schedule.
 */
export type SimulationMetrics = { timeMs?: number; accuracy?: number; energy?: number }

export function taskSpecificMutation(
  agent: Agent | MultiObjectiveAgent,
  generation: number,
  task: TaskContext,
  lastFitness: number,
  currentFitness: number,
  metrics?: SimulationMetrics
) {
  const ranges = mutationRangesForTask(task)
  const sched = annealingSchedule(task.constraints)
  // Generate task-specific anneal factor
  const fast = task.constraints.complexity >= 50
  const denom = sched.denom
  const maxDrop = sched.maxDrop
  const annealFactor = 1 - Math.min(generation / denom, maxDrop)

  // Success-based adjustment
  const noImprove = currentFitness <= lastFitness
  const boost = noImprove ? 1.05 : 1.0

  // Sample attribute-specific factors
  // Adjust based on real task metrics if provided
  const m = metrics || {}
  const perfSlow = typeof m.timeMs === 'number' && typeof task.constraints.timeDeadlineMs === 'number'
    ? m.timeMs > task.constraints.timeDeadlineMs
    : false
  const perfInefficient = typeof m.energy === 'number' && typeof task.constraints.energyLimit === 'number'
    ? m.energy > task.constraints.energyLimit
    : false
  const perfInaccurate = typeof m.accuracy === 'number' ? m.accuracy < 0.9 : false

  // Live constraint deltas: if deadlines shrink or energy caps lower, bias shifts immediately
  const { speedBias, accBias, effBias } = liveConstraintBias(task)
  const fs = sample(ranges.speed.min * annealFactor, ranges.speed.max * annealFactor) * (perfSlow ? 1.08 : 1) * boost * speedBias
  const fa = sample(ranges.accuracy.min * annealFactor, ranges.accuracy.max * annealFactor) * (noImprove || perfInaccurate ? 1.04 : 1) * accBias
  const fe = sample(ranges.efficiency.min * annealFactor, ranges.efficiency.max * annealFactor) * ((task.type === 'resource' || perfInefficient) ? 1.05 : 1) * effBias

  agent.speed *= fs
  agent.accuracy *= fa
  if (hasEfficiency(agent)) agent.efficiency *= fe

  return agent
}

/** Evaluate multi-objective fitness using task weights (or defaults). */
export function taskFitness(
  agent: Agent | MultiObjectiveAgent,
  task: TaskContext,
  taskComplexity: number,
  metrics?: SimulationMetrics
) {
  const weights = metrics ? weightsFromMetrics(task, metrics) : (task.weights ?? defaultWeightsForTask(task.type))
  const withEff: MultiObjectiveAgent = hasEfficiency(agent)
    ? (agent as MultiObjectiveAgent)
    : ({ ...agent, efficiency: 1 } as MultiObjectiveAgent)
  return evaluateMultiObjectiveFitness(withEff, taskComplexity, weights)
}

function sample(min: number, max: number) { return min + Math.random() * (max - min) }
function hasEfficiency(a: any): a is MultiObjectiveAgent { return a && typeof a.efficiency === 'number' }

/**
 * Derive objective weights from real simulation metrics.
 * Penalize dimensions that underperform relative to task constraints.
 */
export function weightsFromMetrics(task: TaskContext, m: SimulationMetrics) {
  let w = task.weights ?? defaultWeightsForTask(task.type)
  w = { ...w }
  if (typeof m.timeMs === 'number' && typeof task.constraints.timeDeadlineMs === 'number') {
    if (m.timeMs > task.constraints.timeDeadlineMs) w.speed = Math.min(0.7, w.speed + 0.15)
  }
  if (typeof m.energy === 'number' && typeof task.constraints.energyLimit === 'number') {
    if (m.energy > task.constraints.energyLimit) w.efficiency = Math.min(0.7, w.efficiency + 0.2)
  }
  if (typeof m.accuracy === 'number') {
    if (m.accuracy < 0.9) w.accuracy = Math.min(0.7, w.accuracy + 0.15)
  }
  // Normalize weights to sum ~1
  const sum = w.speed + w.accuracy + w.efficiency
  return { speed: w.speed / sum, accuracy: w.accuracy / sum, efficiency: w.efficiency / sum }
}

/**
 * Bias multipliers derived from current constraints (can be extended to compare against a previous snapshot).
 * If deadline is tight, prioritize speed; if energy cap is tight, prioritize efficiency.
 */
export function liveConstraintBias(task: TaskContext) {
  let speedBias = 1, accBias = 1, effBias = 1
  const { timeDeadlineMs, energyLimit, complexity } = task.constraints
  if (typeof timeDeadlineMs === 'number' && timeDeadlineMs < 3000) speedBias *= 1.06
  if (typeof energyLimit === 'number' && energyLimit < 80) effBias *= 1.06
  if (complexity >= 70) {
    // hard tasks: slight accuracy emphasis
    accBias *= 1.03
  }
  return { speedBias, accBias, effBias }
}
