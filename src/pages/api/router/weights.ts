import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  try {
    const repoRoot = process.cwd();
    const candidates = [
      path.join(repoRoot, 'AGI-CAD-Core', 'vault', 'balance.yaml'),
      path.join(repoRoot, 'vault', 'balance.yaml'),
    ];
    const file = candidates.find((p) => fs.existsSync(p));
    if (!file) return res.status(404).json({ error: 'balance.yaml not found' });
    const text = fs.readFileSync(file, 'utf8');

    // Extract models and optional explicit weight: under each model
    const models: string[] = [];
    const modelWeights: Record<string, number> = {};
    const lines = text.split(/\r?\n/);
    let inModels = false;
    let current: string | null = null;
    for (const ln of lines) {
      if (/^\s*models:\s*$/.test(ln)) { inModels = true; continue; }
      if (inModels) {
        const m = ln.match(/^\s{2,}([a-zA-Z0-9_\-]+):\s*$/);
        if (m) { current = m[1]; models.push(current); continue; }
        if (/^\S/.test(ln)) { current = null; break; } // end of section
        // pick up explicit weight lines (e.g., `weight: 40` or `weight: 0.4`)
        const w = ln.match(/^\s{4,}weight:\s*([0-9]+(?:\.[0-9]+)?)\s*$/);
        if (current && w) {
          const val = parseFloat(w[1]);
          modelWeights[current] = val > 1 ? val : Math.round(val * 100);
        }
      }
    }
    const keys = ['gpt','claude','gemini','grok'];
    const present = keys.filter(k => models.some(m => m.toLowerCase().includes(k)));
    const use = present.length ? present : keys;

    // If explicit weights present for any, use them (normalize to 100)
    const explicit: Record<string, number> = {};
    let expSum = 0;
    for (const m of models) {
      const low = m.toLowerCase();
      const matched = keys.find(k => low.includes(k));
      if (!matched) continue;
      if (modelWeights[m] != null) {
        explicit[matched] = modelWeights[m];
        expSum += modelWeights[m];
      }
    }
    let weights: Record<string, number> = {};
    if (Object.keys(explicit).length) {
      // normalize
      for (const k of Object.keys(explicit)) {
        weights[k] = Math.round((explicit[k] / (expSum || 1)) * 100);
      }
    } else {
      const split = Math.round(100 / use.length);
      for (const k of use) weights[k] = split;
    }
    // Fix rounding residue to 100
    const sum = Object.values(weights).reduce((a,b)=>a+b,0) || 0;
    const firstKey = Object.keys(weights)[0] || 'gpt';
    if (sum !== 100) weights[firstKey] = (weights[firstKey] || 0) + (100 - sum);

    return res.status(200).json({ weights });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'failed to load weights' });
  }
}
