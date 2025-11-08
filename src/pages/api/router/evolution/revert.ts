import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyFirebaseToken } from '@/lib/security/auth';
import { popLastStep } from '@/lib/router/evolutionHistory';
import { setAgentOverride, type AgentId } from '@/lib/routerWeights';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const auth = await verifyFirebaseToken(req);
  if (!auth.valid) return res.status(401).json({ ok: false, error: auth.error || 'Unauthorized' });

  const step = popLastStep();
  if (!step) return res.status(200).json({ ok: true, reverted: [] });
  const reverted: Array<{ agent: string; bias: number }> = [];
  for (const u of step.updates) {
    setAgentOverride(u.agent as AgentId, { bias: u.prevBias });
    reverted.push({ agent: u.agent, bias: u.prevBias });
  }
  return res.status(200).json({ ok: true, reverted });
}

