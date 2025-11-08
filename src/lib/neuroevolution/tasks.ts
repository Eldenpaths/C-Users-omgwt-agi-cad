/**
 * Task descriptors and helpers for task-specific evolution strategies.
 */

export type TaskType = 'accuracy' | 'resource' | 'time'

export type TaskConstraints = {
  /** overall task complexity; higher usually harder */
  complexity: number
  /** optional time deadline in ms (lower => stricter) */
  timeDeadlineMs?: number
  /** optional energy consumption ceiling (lower => stricter) */
  energyLimit?: number
}

export type TaskContext = {
  type: TaskType
  constraints: TaskConstraints
  /** optional custom objective weights override */
  weights?: { speed: number; accuracy: number; efficiency: number }
}

/** Default weights per task type. */
export function defaultWeightsForTask(type: TaskType) {
  switch (type) {
    case 'accuracy':
      return { speed: 0.2, accuracy: 0.6, efficiency: 0.2 }
    case 'resource':
      return { speed: 0.2, accuracy: 0.2, efficiency: 0.6 }
    case 'time':
      return { speed: 0.6, accuracy: 0.2, efficiency: 0.2 }
  }
}

/**
 * Compute annealing parameters based on task complexity.
 * For higher complexity, we allow bigger early mutations and anneal faster.
 */
export function annealingSchedule(constraints: TaskConstraints) {
  const c = Math.max(1, constraints.complexity)
  const fast = c >= 50
  return {
    maxDrop: fast ? 0.7 : 0.4, // how low the factor can drop
    denom: fast ? 50 : 150, // bigger denom => slower anneal
  }
}

