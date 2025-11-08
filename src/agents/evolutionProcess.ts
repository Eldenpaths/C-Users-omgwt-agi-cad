/**
 * EvolutionProcess — simple evolutionary adjustment over router agent biases.
 *
 * This MVP uses RouterWeights snapshot statistics to nudge agent bias toward
 * higher EMA success and lower latency. It is safe and bounded.
 */

import { getSnapshot, setAgentOverride, type AgentId } from '@/lib/routerWeights';

export type EvolutionConfig = {
  biasStep?: number; // amount to nudge bias per iteration
  maxAbsBias?: number; // clamp range
};

export class EvolutionProcess {
  private cfg: Required<EvolutionConfig>;

  constructor(cfg: EvolutionConfig = {}) {
    this.cfg = {
      biasStep: cfg.biasStep ?? 0.02,
      maxAbsBias: cfg.maxAbsBias ?? 0.5,
    };
  }

  /**
   * Single evolutionary step. Computes a simple fitness for each agent and nudges bias.
   * Fitness = emaSuccess * 0.8 + (1/emaLatency) * 0.2 (normalized)
   */
  async step(): Promise<{ updated: Array<{ agent: AgentId; bias: number }> }> {
    const snap = getSnapshot();
    const agents = Object.values(snap.agents);
    if (agents.length === 0) return { updated: [] };

    // Compute fitness
    const fitness = agents.map((a) => ({
      id: a.agent,
      fit: 0.8 * a.emaSuccess + 0.2 * (1 / Math.max(200, a.emaLatency)),
    }));
    const maxF = Math.max(...fitness.map((f) => f.fit));
    const minF = Math.min(...fitness.map((f) => f.fit));
    const span = Math.max(1e-6, maxF - minF);

    const updated: Array<{ agent: AgentId; bias: number }> = [];
    for (const f of fitness) {
      const score = (f.fit - minF) / span; // 0..1
      const delta = (score - 0.5) * 2 * this.cfg.biasStep; // -step..+step
      const current = snap.agents[f.id].bias ?? 0;
      const next = clamp(current + delta, -this.cfg.maxAbsBias, this.cfg.maxAbsBias);
      setAgentOverride(f.id as AgentId, { bias: next });
      updated.push({ agent: f.id as AgentId, bias: next });
    }
    return { updated };
  }
}

function clamp(x: number, lo: number, hi: number): number { return Math.max(lo, Math.min(hi, x)); }

export default EvolutionProcess;

