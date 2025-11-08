type BiasUpdate = { agent: string; bias: number; prevBias: number };
type EvoStep = { ts: number; updates: BiasUpdate[] };

const g = globalThis as unknown as { __evoHistory?: EvoStep[] };
const store: EvoStep[] = (g.__evoHistory ??= []);

export function recordEvolutionStep(updates: BiasUpdate[]) {
  store.push({ ts: Date.now(), updates });
  if (store.length > 50) store.shift();
}

export function getEvolutionHistory(): EvoStep[] {
  return [...store].slice(-20);
}

export function popLastStep(): EvoStep | undefined {
  return store.pop();
}

export default { recordEvolutionStep, getEvolutionHistory, popLastStep };

