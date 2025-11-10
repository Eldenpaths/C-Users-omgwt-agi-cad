/**
 * @file src/scripts/simulations/phase30a_hive_evo.ts
 *
 * Simulates the Phase 30A Neuroevolution Hive.
 * - Generates 24 synthetic agents.
 * - Applies the FS-QMIX fitness formula with Governor veto logic.
 * - Runs 10 generations of elite selection and Gaussian mutation.
 *
 * To Run (requires ts-node):
 * pnpm ts-node src/scripts/simulations/phase30a_hive_evo.ts
 */

import { v4 as uuidv4 } from 'uuid'; // Requires `pnpm add uuid @types/uuid`

// --- 1. SIMULATION PARAMETERS ---

const POPULATION_SIZE = 24;
const GENERATIONS = 10;
const ELITE_RATIO = 0.2; // 20% of population (5 agents)
const MUTATION_SIGMA = 0.05; // 5% mutation volatility
const VETO_THRESHOLD = 0.7; // Governor vetoes agents below this fidelity

// Fitness formula: fitness = governorScore * (α·taskPerf – β·latencyMs + κ·fractalBonus)
const ALPHA = 1.0; // Weight for task performance
const BETA = 0.001; // Weight (penalty) for latency
const KAPPA = 0.2; // Weight (bonus) for fractal novelty

// --- 2. AGENT & EVOLUTION DEFINITIONS ---

interface Agent {
  id: string;
  taskPerf: number; // [0.0 - 1.0]
  latencyMs: number; // [50 - 250]
  d_var: number; // [0.8 - 1.4] (Used as fractalBonus)
  glyphIds: string[]; // Mock data
  fitness: number;
}

/**
 * Standard Normal (N(0,1)) random variable via Box-Muller transform.
 */
function randn_bm(): number {
  let u = 0,
    v = 0;
  while (u === 0) u = Math.random(); //Converting [0,1) to (0,1)
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

/**
 * Creates the initial random population of agents.
 */
function createInitialPopulation(size: number): Agent[] {
  return Array.from({ length: size }, () => ({
    id: uuidv4(),
    // High-performing but high-latency to start
    taskPerf: Math.random() * 0.5 + 0.3, // [0.3 - 0.8]
    latencyMs: Math.random() * 100 + 150, // [150 - 250]
    d_var: Math.random() * 0.6 + 0.8, // [0.8 - 1.4]
    glyphIds: [uuidv4().slice(0, 4)],
    fitness: 0,
  }));
}

/**
 * Applies the fitness formula and Governor's Veto logic.
 */
function calculateFitness(agent: Agent): { fitness: number; wasVetoed: boolean } {
  // 1. Governor generates a fidelity score for this agent
  const potentialGovernorScore = Math.random() * 0.4 + 0.6; // [0.6 - 1.0]

  // 2. Governor Veto Check
  if (potentialGovernorScore < VETO_THRESHOLD) {
    return { fitness: 0, wasVetoed: true };
  }

  // 3. Agent passes veto, calculate fitness
  const fractalBonus = agent.d_var;

  const basePerf =
    ALPHA * agent.taskPerf -
    BETA * agent.latencyMs +
    KAPPA * fractalBonus;

  // Final fitness is weighted by the Governor's (non-veto) score
  const finalFitness = potentialGovernorScore * basePerf;

  return { fitness: Math.max(0, finalFitness), wasVetoed: false };
}

/**
 * Applies Gaussian mutation to a value, clamping it within min/max.
 */
function mutateValue(
  value: number,
  sigma: number,
  min: number,
  max: number
): number {
  const newValue = value + randn_bm() * sigma;
  return Math.max(min, Math.min(max, newValue));
}

/**
 * Creates a new child agent by mutating a parent.
 */
function mutate(parent: Agent): Agent {
  return {
    id: uuidv4(),
    taskPerf: mutateValue(parent.taskPerf, MUTATION_SIGMA, 0.0, 1.0),
    latencyMs: mutateValue(parent.latencyMs, MUTATION_SIGMA * 100, 50, 250),
    d_var: mutateValue(parent.d_var, MUTATION_SIGMA, 0.8, 1.4),
    glyphIds: parent.glyphIds, // Glyphs are inherited, not mutated
    fitness: 0,
  };
}

/**
 * Creates the next generation from the current population.
 */
function evolvePopulation(population: Agent[]): Agent[] {
  const eliteCount = Math.ceil(POPULATION_SIZE * ELITE_RATIO); // 5 elites

  // Sort by fitness (descending)
  const sortedPop = [...population].sort((a, b) => b.fitness - a.fitness);

  // 1. Select Elites (survive unchanged)
  const elites = sortedPop.slice(0, eliteCount);

  // 2. Breed Children (from elites)
  const children: Agent[] = [];
  for (let i = 0; i < POPULATION_SIZE - eliteCount; i++) {
    // Select a random elite parent
    const parent = elites[Math.floor(Math.random() * eliteCount)];
    children.push(mutate(parent));
  }

  return [...elites, ...children];
}

// --- 3. MAIN SIMULATION SCRIPT ---

function runSimulation() {
  console.log('--- Running Phase 30A Neuroevolution Hive Simulation ---');
  console.log(
    `Population: ${POPULATION_SIZE} | Generations: ${GENERATIONS} | Elite Ratio: ${ELITE_RATIO}\n`
  );

  let population = createInitialPopulation(POPULATION_SIZE);
  const resultsTable: any[] = [];
  const dVarTrend: number[] = [];

  for (let gen = 1; gen <= GENERATIONS; gen++) {
    let vetoCount = 0;
    let totalFitness = 0;

    // 1. Evaluate Population
    for (const agent of population) {
      const { fitness, wasVetoed } = calculateFitness(agent);
      agent.fitness = fitness;
      if (wasVetoed) {
        vetoCount++;
      }
      totalFitness += fitness;
    }

    // 2. Analyze Generation
    const bestAgent = [...population].sort((a, b) => b.fitness - a.fitness)[0];
    const meanFitness = totalFitness / POPULATION_SIZE;

    resultsTable.push({
      Generation: gen,
      'Best Fitness': bestAgent.fitness.toFixed(3),
      'Mean Fitness': meanFitness.toFixed(3),
      'Veto Count': vetoCount,
    });
    dVarTrend.push(parseFloat(bestAgent.d_var.toFixed(2)));

    // 3. Evolve
    population = evolvePopulation(population);
  }

  // 4. Print Results
  console.log('--- Simulation Results ---');
  console.table(resultsTable);

  console.log('\n--- D_var (Fractal Bonus) Trend of Best Agent ---');
  console.log(JSON.stringify(dVarTrend));
}

// Run the simulation
runSimulation();