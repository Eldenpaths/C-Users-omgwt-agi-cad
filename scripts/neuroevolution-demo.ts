/**
 * Neuroevolution Demo — Baseline vs Adaptive vs Annealed
 * Run with: pnpm exec tsx scripts/neuroevolution-demo.ts
 */

import {
  initializePopulationMulti,
  evolveOneGeneration,
  evolveOneGenerationWithAdaptiveMutation,
  evolveOneGenerationWithAnnealing,
  computePopulationFitness,
  summarizeFitness,
} from '@/lib/neuroevolution/core'
import { evaluateMultiObjectiveFitness, type MultiObjectiveAgent } from '@/lib/neuroevolution/agent'

async function main() {
  const populationSize = 10
  const taskComplexity = 10
  const generationCount = 5

  // Initialize multi-objective population (speed, accuracy, efficiency)
  let population = initializePopulationMulti(populationSize, { min: 0.5, max: 1.5 }) as MultiObjectiveAgent[]

  for (let generation = 0; generation < generationCount; generation++) {
    console.log(`Generation ${generation + 1}`)

    // Baseline: simple evolveOneGeneration (elitism + offspring)
    const baselinePopulation = evolveOneGeneration(population, taskComplexity, { parents: 2, offspring: 8, keepTop: 2 }) as MultiObjectiveAgent[]
    const bestBaseline = baselinePopulation[0]
    const baselineFitness = evaluateMultiObjectiveFitness(bestBaseline, taskComplexity)
    console.log(
      `Baseline Best — speed=${bestBaseline.speed.toFixed(2)} accuracy=${bestBaseline.accuracy.toFixed(2)} efficiency=${bestBaseline.efficiency.toFixed(2)} fitness=${baselineFitness.toFixed(4)}`
    )

    // Adaptive: success-based mutation
    const adaptivePopulation = evolveOneGenerationWithAdaptiveMutation(population, taskComplexity, {
      parents: 2,
      offspring: 8,
      keepTop: 2,
    }) as MultiObjectiveAgent[]
    const bestAdaptive = adaptivePopulation[0]
    const adaptiveFitness = evaluateMultiObjectiveFitness(bestAdaptive, taskComplexity)
    console.log(
      `Adaptive Best — speed=${bestAdaptive.speed.toFixed(2)} accuracy=${bestAdaptive.accuracy.toFixed(2)} efficiency=${bestAdaptive.efficiency.toFixed(2)} fitness=${adaptiveFitness.toFixed(4)}`
    )

    // Annealed: mutation range shrinks by generation
    const annealedPopulation = evolveOneGenerationWithAnnealing(population, taskComplexity, {
      parents: 2,
      offspring: 8,
      keepTop: 2,
    }, generation) as MultiObjectiveAgent[]
    const bestAnnealed = annealedPopulation[0]
    const annealedFitness = evaluateMultiObjectiveFitness(bestAnnealed, taskComplexity)
    console.log(
      `Annealed Best — speed=${bestAnnealed.speed.toFixed(2)} accuracy=${bestAnnealed.accuracy.toFixed(2)} efficiency=${bestAnnealed.efficiency.toFixed(2)} fitness=${annealedFitness.toFixed(4)}`
    )

    // Compare fitness stats (use annealed set for trend)
    const fitnessRecords = computePopulationFitness(annealedPopulation, taskComplexity)
    const fitnessStats = summarizeFitness(fitnessRecords)
    console.log(`Fitness Stats — Best: ${fitnessStats.best.toFixed(4)}, Avg: ${fitnessStats.avg.toFixed(4)}, Worst: ${fitnessStats.worst.toFixed(4)}`)

    console.log(`\n--- End of Generation ${generation + 1} ---\n`)

    // Advance population (choose annealed path as default)
    population = annealedPopulation
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
