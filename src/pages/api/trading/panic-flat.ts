import type { NextApiRequest, NextApiResponse } from 'next';
import { Telemetry } from '@/lib/learning/telemetry';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const token = req.headers['x-mission-control-key'] || '';
  const expected = process.env.MISSION_CONTROL_KEY || '';
  if (!expected || token !== expected) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const reason = (req.body && typeof req.body === 'object') ? (req.body as any).reason : undefined;
    // TODO: integrate with real trading orchestrator to flatten positions
    await Telemetry.logEvent({
      userId: 'system',
      event: 'panic_flat_requested',
      meta: { source: 'mission_control', reason },
      timestamp: Date.now(),
    });
    return res.status(200).json({ ok: true });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'panic flat failed' });
  }
}
