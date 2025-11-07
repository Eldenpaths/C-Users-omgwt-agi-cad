import type { NextApiRequest, NextApiResponse } from 'next'
import { AGI_Router } from '@/core/router/IntelligenceRouter'
import { loadWeights } from '@/core/router/routerWeights'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      return res.status(200).json({ weights: loadWeights() })
    }
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'GET, POST')
      return res.status(405).json({ error: 'Method Not Allowed' })
    }
    const body = (req.body && typeof req.body === 'object') ? req.body as any : {}
    const goal = body.goal || ''
    const context = body.context || ''
    const result = await AGI_Router.routeTask({ goal, context })
    const weights = loadWeights()
    return res.status(200).json({ ok: true, result, weights })
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'router failed' })
  }
}

