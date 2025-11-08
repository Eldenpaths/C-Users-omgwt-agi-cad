import type { NextApiRequest, NextApiResponse } from 'next'
import { broadcastMetrics } from '@/lib/neuroevolution/wsServer'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method Not Allowed' })
  try {
    const { agentId = 'demo-agent', count = 500, delayMs = 0 } = req.body || {}
    const n = Math.max(1, Math.min(10000, Number(count)))
    const delay = Math.max(0, Math.min(1000, Number(delayMs)))
    for (let i = 0; i < n; i++) {
      const t = Math.random()
      const timeMs = Math.round(2000 + 8000 * Math.random())
      const accuracy = Math.max(0, Math.min(1, 0.6 + 0.4 * Math.sin(6.2831 * t + i * 0.01)))
      const energy = Math.round(50 + 100 * Math.random())
      broadcastMetrics({
        agentId,
        taskType: 'time',
        generation: i,
        metrics: { timeMs, accuracy, energy },
        fitness: accuracy / (1 + energy * 0.01),
      })
      // optional delay to simulate streaming
      if (delay) await new Promise((r) => setTimeout(r, delay))
    }
    return res.status(200).json({ ok: true, sent: n })
  } catch (e) {
    return res.status(500).json({ ok: false, error: (e as Error).message })
  }
}

