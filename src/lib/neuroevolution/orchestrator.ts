import { crossover } from './core'
import { taskSpecificMutation, taskFitness, type SimulationMetrics } from './strategies'
import { readSimulationFeedback } from './feedback'
import { getConstraints } from './constraints'
import type { Agent, MultiObjectiveAgent } from './agent'
import type { TaskContext } from './tasks'

export type EvolutionOptions = {
  parents?: number
  offspring?: number
  keepTop?: number
}

/**
 * Evolve across multiple task environments. For each task, generate offspring
 * from the top parents for that task, then merge with elites across tasks.
 */
export function evolveAcrossTasks(
  population: Array<Agent | MultiObjectiveAgent>,
  tasks: TaskContext[],
  generation: number,
  opts: EvolutionOptions = { parents: 2, offspring: 4, keepTop: 2 },
  agentIds?: string[]
): Array<Agent | MultiObjectiveAgent> {
  if (!population.length || !tasks.length) return population
  const parentsCount = Math.max(2, opts.parents ?? 2)
  const offspringPerTask = Math.max(1, Math.floor((opts.offspring ?? 4) / tasks.length))
  const elitesPerTask = Math.max(0, Math.floor((opts.keepTop ?? 2) / tasks.length))

  // Select elites per task and merge
  const elites: Array<Agent | MultiObjectiveAgent> = []
  for (const t of tasks) {
    const tc = resolveTask(t)
    const ranked = population
      .map((a, i) => {
        const id = agentIds?.[i]
        const m: SimulationMetrics | undefined = id ? readSimulationFeedback(id, t.type) : undefined
        return { a, f: taskFitness(a, tc, tc.constraints.complexity, m) }
      })
      .sort((x, y) => y.f - x.f)
    elites.push(...ranked.slice(0, elitesPerTask).map((r) => ({ ...r.a })))
  }

  const next: Array<Agent | MultiObjectiveAgent> = [...elites]

  // Generate offspring per task
  for (const t of tasks) {
    const tc = resolveTask(t)
    const ranked = population
      .map((a, i) => {
        const id = agentIds?.[i]
        const m: SimulationMetrics | undefined = id ? readSimulationFeedback(id, t.type) : undefined
        return { a, f: taskFitness(a, tc, tc.constraints.complexity, m) }
      })
      .sort((x, y) => y.f - x.f)
    const parents = ranked.slice(0, parentsCount).map((r) => r.a)

    let lastFitness = ranked[0]?.f ?? 0
    for (let i = 0; i < offspringPerTask; i++) {
      const p1 = parents[i % parents.length]
      const p2 = parents[(i + 1) % parents.length]
      const child: any = crossover(p1 as Agent, p2 as Agent)
      if ((p1 as any).efficiency || (p2 as any).efficiency) {
        child.efficiency = ((p1 as any).efficiency ?? 1 + (p2 as any).efficiency ?? 1) / 2
      }
      const metrics: SimulationMetrics | undefined = undefined
      const current = taskFitness(child, tc, tc.constraints.complexity, metrics)
      taskSpecificMutation(child, generation, tc, lastFitness, current, metrics)
      next.push(child)
      lastFitness = current
    }
  }

  // Fill to original size with global best if needed
  const needed = Math.max(0, population.length - next.length)
  if (needed > 0) {
    const globalRanked = tasks
      .flatMap((t) => population.map((a, i) => {
        const tc = resolveTask(t)
        const id = agentIds?.[i]
        const m: SimulationMetrics | undefined = id ? readSimulationFeedback(id, t.type) : undefined
        return { a, f: taskFitness(a, tc, tc.constraints.complexity, m) }
      }))
      .sort((x, y) => y.f - x.f)
    let idx = 0
    while (next.length < population.length && idx < globalRanked.length) {
      next.push({ ...(globalRanked[idx++].a as any) })
    }
  }

  return next
}

/**
 * Resolve a TaskContext with the latest live constraints (if available).
 */
function resolveTask(t: TaskContext): TaskContext {
  const live = getConstraints(t.type)
  if (!live) return t
  return { ...t, constraints: { ...t.constraints, ...live } }
}
