import type { NextApiRequest, NextApiResponse } from 'next';
import { getEvolutionHistory } from '@/lib/router/evolutionHistory';

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  // Try Firestore first
  try {
    const { getFirestoreInstance } = await import('@/lib/firebase/server');
    const db = getFirestoreInstance();
    const snap = await db.collection('router_evolution').orderBy('ts', 'desc').limit(20).get();
    const items = snap.docs.map((d: any) => d.data());
    return res.status(200).json({ ok: true, history: items });
  } catch {
    const data = getEvolutionHistory();
    return res.status(200).json({ ok: true, history: data });
  }
}
