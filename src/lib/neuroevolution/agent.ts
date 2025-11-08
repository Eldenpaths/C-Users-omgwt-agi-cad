/**
 * Neuroevolution — Agent primitive
 *
 * A minimal agent representation with basic parameters and a
 * simple fitness function, aligned with the Python outline.
 */

export interface Agent {
  speed: number
  accuracy: number
  /** optional cached fitness for tracking across generations */
  fitness?: number
}

/** Multi-objective agent variant including energy efficiency. */
export interface MultiObjectiveAgent extends Agent {
  efficiency: number
}

/**
 * Create a shallow copy of an Agent.
 */
export function cloneAgent(a: Agent): Agent {
  return { speed: a.speed, accuracy: a.accuracy }
}

/**
 * Evaluate fitness for an agent given task complexity.
 * Fitness = (speed * accuracy) / taskComplexity
 */
export function evaluateFitness(agent: Agent, taskComplexity: number): number {
  const tc = Math.max(1e-6, taskComplexity)
  return (agent.speed * agent.accuracy) / tc
}

/**
 * Multi-objective fitness with weighted factors for speed, accuracy, and efficiency.
 * Defaults: speed 0.4, accuracy 0.4, efficiency 0.2
 */
export function evaluateMultiObjectiveFitness(
  agent: MultiObjectiveAgent,
  taskComplexity: number,
  weights: { speed: number; accuracy: number; efficiency: number } = { speed: 0.4, accuracy: 0.4, efficiency: 0.2 }
): number {
  const tc = Math.max(1e-6, taskComplexity)
  const score = weights.speed * agent.speed + weights.accuracy * agent.accuracy + weights.efficiency * agent.efficiency
  return score / tc
}
