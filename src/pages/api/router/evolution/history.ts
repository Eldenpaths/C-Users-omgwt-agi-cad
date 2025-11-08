import type { NextApiRequest, NextApiResponse } from 'next';
import { getEvolutionHistory } from '@/lib/router/evolutionHistory';

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  const data = getEvolutionHistory();
  return res.status(200).json({ ok: true, history: data });
}

