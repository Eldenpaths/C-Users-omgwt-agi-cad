import type { NextApiRequest, NextApiResponse } from 'next'
import { getFirestoreInstance } from '@/lib/firebase/server'

type Resp = {
  pnl: number
  winRate: number
  openPositions: number
  updatedAt?: string
}

export default async function handler(_req: NextApiRequest, res: NextApiResponse<Resp | { error: string }>) {
  try {
    const db = getFirestoreInstance()
    const snap = await db.collection('metrics').doc('trading_latest').get()
    if (!snap.exists) return res.status(404).json({ error: 'trading metrics not found' })

    const data = snap.data() as any
    const updatedAt = (data?.updatedAt?.toDate?.() || data?.updatedAt || new Date()).toISOString()
    return res.status(200).json({
      pnl: Number(data?.pnl ?? 0),
      winRate: Number(data?.winRate ?? 0),
      openPositions: Number(data?.openPositions ?? data?.positions ?? 0),
      updatedAt,
    })
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'failed to load trading metrics' })
  }
}

