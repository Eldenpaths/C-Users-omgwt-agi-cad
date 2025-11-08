/**
 * Neuroevolution — Core helpers (Phase 1)
 *
 * Implements population initialization, selection, crossover, and mutation
 * with a simple fitness metric.
 */

import type { Agent, MultiObjectiveAgent } from './agent'
import { evaluateFitness, evaluateMultiObjectiveFitness, cloneAgent } from './agent'

export type Population = Agent[]

/** Fitness record for tracking evolution across generations. */
export type FitnessRecord = { agent: Agent | MultiObjectiveAgent; fitness: number }

/**
 * Initialize a population with random speed/accuracy in [min,max].
 */
export function initializePopulation(size: number, opts?: { min?: number; max?: number }): Population {
  const min = opts?.min ?? 0.5
  const max = opts?.max ?? 1.5
  const pop: Population = []
  for (let i = 0; i < size; i++) {
    pop.push({
      speed: rand(min, max),
      accuracy: rand(min, max),
    })
  }
  return pop
}

/** Initialize a multi-objective population including efficiency. */
export function initializePopulationMulti(
  size: number,
  opts?: { min?: number; max?: number }
): MultiObjectiveAgent[] {
  const min = opts?.min ?? 0.5
  const max = opts?.max ?? 1.5
  const pop: MultiObjectiveAgent[] = []
  for (let i = 0; i < size; i++) {
    pop.push({
      speed: rand(min, max),
      accuracy: rand(min, max),
      efficiency: rand(min, max),
    })
  }
  return pop
}

/**
 * Select the top-N agents by fitness.
 */
export function selectTopAgents(population: Population, taskComplexity: number, topN = 2): Population {
  const scored = population
    .map((a) => ({ a, f: evaluateFitness(a, taskComplexity) }))
    .sort((x, y) => y.f - x.f)
  return scored.slice(0, Math.max(0, topN)).map((s) => s.a)
}

/**
 * Generic selector that supports multi-objective agents when efficiency is present.
 */
export function selectTopAgentsGeneric(population: Population, taskComplexity: number, topN = 2): Population {
  const scored = population
    .map((a) => ({ a, f: fitnessGeneric(a, taskComplexity) }))
    .sort((x, y) => y.f - x.f)
  return scored.slice(0, Math.max(0, topN)).map((s) => s.a)
}

/**
 * Crossover two parents to produce a new offspring agent.
 * Uses simple averaging, matching your outline.
 */
export function crossover(p1: Agent, p2: Agent): Agent {
  return {
    speed: (p1.speed + p2.speed) / 2,
    accuracy: (p1.accuracy + p2.accuracy) / 2,
  }
}

/**
 * Mutate an agent in place by applying a slight random factor.
 * Default factor sampled in [0.9, 1.1].
 */
export function mutate(agent: Agent, opts?: { minFactor?: number; maxFactor?: number }): Agent {
  const minF = opts?.minFactor ?? 0.9
  const maxF = opts?.maxFactor ?? 1.1
  const factor = rand(minF, maxF)
  agent.speed *= factor
  agent.accuracy *= factor
  return agent
}

/**
 * Adaptive mutation: adjust mutation factor based on success/non-improvement.
 * If current fitness <= last fitness, increase mutation (1.0–1.2).
 * Else reduce mutation magnitude slightly (0.9–1.1).
 */
export function adaptiveMutation(
  agent: Agent | MultiObjectiveAgent,
  taskComplexity: number,
  lastFitness: number,
  currentFitness: number
): Agent | MultiObjectiveAgent {
  let minF = 0.9
  let maxF = 1.1
  if (currentFitness <= lastFitness) {
    minF = 1.0
    maxF = 1.2
  }
  const factor = rand(minF, maxF)
  agent.speed *= factor
  agent.accuracy *= factor
  if (hasEfficiency(agent)) {
    // Mutate efficiency as well; you may invert or constrain as needed.
    ;(agent as MultiObjectiveAgent).efficiency *= factor
  }
  return agent
}

/**
 * Evolve one generation:
 *  1) Select parents (top 2 by default)
 *  2) Produce offspring via crossover + mutation
 *  3) Replace worst agents (elitism kept by default: keepTop)
 */
export function evolveOneGeneration(pop: Population, taskComplexity: number, opts?: {
  parents?: number
  offspring?: number
  keepTop?: number
}): Population {
  if (pop.length === 0) return pop
  const parentsCount = Math.max(2, opts?.parents ?? 2)
  const offspringCount = Math.max(1, opts?.offspring ?? 1)
  const keepTop = Math.max(0, Math.min(pop.length, opts?.keepTop ?? 2))

  const top = selectTopAgents(pop, taskComplexity, parentsCount)
  const next: Population = []

  // Elitism: carry forward the top keepTop agents (clone to avoid mutation side effects)
  next.push(...selectTopAgents(pop, taskComplexity, keepTop).map(cloneAgent))

  // Generate offspring from top parents
  for (let i = 0; i < offspringCount; i++) {
    const p1 = top[i % top.length]
    const p2 = top[(i + 1) % top.length]
    const child = crossover(p1, p2)
    mutate(child)
    next.push(child)
  }

  // Fill remaining with best of previous population to maintain size
  const needed = Math.max(0, pop.length - next.length)
  if (needed > 0) {
    const ranked = selectTopAgents(pop, taskComplexity, pop.length)
    let idx = 0
    while (next.length < pop.length && idx < ranked.length) {
      next.push(cloneAgent(ranked[idx++]))
    }
  }
  return next
}

/**
 * Evolve one generation with adaptive mutation and optional multi-objective fitness.
 * Returns keepTop elites + offspring; population size may change based on options.
 */
export function evolveOneGenerationWithAdaptiveMutation(
  population: Population,
  taskComplexity: number,
  { parents, offspring, keepTop }: { parents: number; offspring: number; keepTop: number }
): Population {
  const parentCount = Math.max(2, parents)
  const topParents = selectTopAgentsGeneric(population, taskComplexity, parentCount)
  const elites = selectTopAgentsGeneric(population, taskComplexity, Math.max(0, keepTop))

  const newPopulation: Population = [...elites.map(cloneAgent)]

  // Seed lastFitness with best elite fitness
  let lastFitness = newPopulation.length
    ? fitnessGeneric(newPopulation[0], taskComplexity)
    : fitnessGeneric(topParents[0], taskComplexity)

  while (newPopulation.length - elites.length < offspring) {
    const p1 = topParents[0] || population[0]
    const p2 = topParents[1] || topParents[0] || population[0]
    const child = crossover(p1, p2)
    const current = fitnessGeneric(child, taskComplexity)
    adaptiveMutation(child, taskComplexity, lastFitness, current)
    newPopulation.push(child)
    lastFitness = fitnessGeneric(child, taskComplexity)
  }

  return newPopulation
}

/** Choose appropriate fitness depending on agent shape. */
function fitnessGeneric(agent: Agent | MultiObjectiveAgent, taskComplexity: number): number {
  if (hasEfficiency(agent)) {
    return evaluateMultiObjectiveFitness(agent as MultiObjectiveAgent, taskComplexity)
  }
  return evaluateFitness(agent as Agent, taskComplexity)
}

function hasEfficiency(agent: any): agent is MultiObjectiveAgent {
  return agent && typeof agent.efficiency === 'number'
}

/** Compute fitness for each agent (multi-objective aware). */
export function computePopulationFitness(
  population: Array<Agent | MultiObjectiveAgent>,
  taskComplexity: number
): FitnessRecord[] {
  return population.map((a) => ({ agent: a, fitness: fitnessGeneric(a, taskComplexity) }))
}

/** Summarize a set of fitness records. */
export function summarizeFitness(records: FitnessRecord[]) {
  if (!records.length) return { best: 0, avg: 0, worst: 0 }
  let best = -Infinity
  let worst = Infinity
  let sum = 0
  for (const r of records) {
    best = Math.max(best, r.fitness)
    worst = Math.min(worst, r.fitness)
    sum += r.fitness
  }
  return { best, avg: sum / records.length, worst }
}

/**
 * Annealing mutation: reduces mutation range over generations.
 * annealFactor = 1 - min(generation/100, 0.5) ⇒ shrinks to 0.5 at ≥ 50 gens.
 */
export function annealingMutation(
  agent: Agent | MultiObjectiveAgent,
  generation: number,
  minFactor = 0.9,
  maxFactor = 1.1
): Agent | MultiObjectiveAgent {
  const annealFactor = 1 - Math.min(generation / 100, 0.5)
  const mutationFactorMin = minFactor * annealFactor
  const mutationFactorMax = maxFactor * annealFactor
  const mutationFactor = rand(mutationFactorMin, mutationFactorMax)
  agent.speed *= mutationFactor
  agent.accuracy *= mutationFactor
  if (hasEfficiency(agent)) {
    ;(agent as MultiObjectiveAgent).efficiency *= mutationFactor
  }
  return agent
}

/**
 * Evolve one generation using annealing mutation.
 * Returns elites + offspring per generation (size may differ from original).
 */
export function evolveOneGenerationWithAnnealing(
  population: Population,
  taskComplexity: number,
  { parents, offspring, keepTop }: { parents: number; offspring: number; keepTop: number },
  generation: number
): Population {
  const parentCount = Math.max(2, parents)
  const elites = selectTopAgentsGeneric(population, taskComplexity, Math.max(0, keepTop))
  const topParents = selectTopAgentsGeneric(population, taskComplexity, parentCount)

  const newPopulation: Population = [...elites.map(cloneAgent)]

  // Seed lastFitness from best elite/parent (not strictly needed for annealing but useful context)
  let lastFitness = newPopulation.length
    ? fitnessGeneric(newPopulation[0], taskComplexity)
    : fitnessGeneric(topParents[0], taskComplexity)

  let i = 0
  while (newPopulation.length - elites.length < offspring) {
    const p1 = topParents[i % topParents.length] || population[0]
    const p2 = topParents[(i + 1) % topParents.length] || p1
    i++
    const child = crossover(p1, p2)
    annealingMutation(child, generation)
    newPopulation.push(child)
    lastFitness = fitnessGeneric(child, taskComplexity)
  }

  return newPopulation
}

/** Utility: random in [min, max]. */
function rand(min: number, max: number) {
  return min + Math.random() * (max - min)
}

export default {
  initializePopulation,
  selectTopAgents,
  crossover,
  mutate,
  evolveOneGeneration,
}
