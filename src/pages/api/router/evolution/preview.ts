import type { NextApiRequest, NextApiResponse } from 'next';
import { EvolutionProcess } from '@/agents/evolutionProcess';

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  try {
    const process = new EvolutionProcess();
    const plan = process.preview();
    return res.status(200).json({ ok: true, updated: plan.updated });
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: e?.message || 'preview failed' });
  }
}

