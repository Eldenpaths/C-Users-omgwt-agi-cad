import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyFirebaseToken } from '@/lib/security/auth';
import { EvolutionProcess } from '@/agents/evolutionProcess';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const auth = await verifyFirebaseToken(req);
  if (!auth.valid) {
    return res.status(401).json({ ok: false, error: auth.error || 'Unauthorized' });
  }

  try {
    const process = new EvolutionProcess();
    const result = await process.step();
    return res.status(200).json({ ok: true, updated: result.updated });
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: e?.message || 'evolve failed' });
  }
}

