// CLAUDE-META: Phase 9A Hybrid Patch - Drift/Entropy Monitor
// Architect: ChatGPT (GPT-5) Canonical Authority
// Purpose: Statistical drift detection with entropy analysis
// Status: Production - Hybrid Safe Mode Active

import { z } from "zod";

const stateSchema = z.array(z.number()); // simple vector; swap for your real state

export type DriftSample = { t: number; state: number[] };

export class DriftMonitor {
  private history: DriftSample[] = [];
  constructor(
    private window = 50,
    private stdDevThreshold = 2.0,   // tweak
    private entropyThreshold = 0.75, // 0..1 normalized proxy
  ) {}

  push(sample: DriftSample) {
    const parsed = stateSchema.parse(sample.state);
    this.history.push({ t: sample.t, state: parsed });
    if (this.history.length > this.window) this.history.shift();
  }

  private stdDev() {
    if (this.history.length === 0) return 0;
    const dim = this.history[0].state.length;
    let varSum = 0;
    for (let d = 0; d < dim; d++) {
      const vals = this.history.map(s => s.state[d]);
      const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
      const v = vals.reduce((a, b) => a + (b - mean) ** 2, 0) / vals.length;
      varSum += v;
    }
    return Math.sqrt(varSum / dim);
  }

  // very rough entropy proxy on histogram of first dim
  private entropyProxy(bins = 16) {
    if (this.history.length < 4) return 0;
    const vals = this.history.map(s => s.state[0]);
    const min = Math.min(...vals), max = Math.max(...vals);
    const step = (max - min || 1) / bins;
    const hist = new Array(bins).fill(0);
    vals.forEach(v => hist[Math.min(bins - 1, Math.floor((v - min) / step))]++);
    const total = vals.length;
    const p = hist.map(h => (h ? h / total : 0));
    const H = -p.reduce((acc, x) => (x ? acc + x * Math.log2(x) : acc), 0);
    return H / Math.log2(bins); // normalize 0..1
  }

  assess() {
    const s = this.stdDev();
    const h = this.entropyProxy();
    const drift = s > this.stdDevThreshold || h > this.entropyThreshold;
    return { stdDev: s, entropy: h, drift };
  }
}
