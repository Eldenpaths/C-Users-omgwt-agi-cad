import type { NextApiRequest, NextApiResponse } from 'next'
import { getFirestoreInstance } from '@/lib/firebase/server'

type Resp = {
  dVar: number
  lacunarity: number
  activeAgents: number
  updatedAt?: string
}

export default async function handler(_req: NextApiRequest, res: NextApiResponse<Resp | { error: string }>) {
  try {
    const db = getFirestoreInstance()
    // Expect a single latest doc written by your pipeline
    const snap = await db.collection('metrics').doc('fsqmix_latest').get()
    if (!snap.exists) return res.status(404).json({ error: 'fsqmix metrics not found' })

    const data = snap.data() as any
    const updatedAt = (data?.updatedAt?.toDate?.() || data?.updatedAt || new Date()).toISOString()
    return res.status(200).json({
      dVar: Number(data?.dVar ?? data?.D_var ?? 0),
      lacunarity: Number(data?.lacunarity ?? 0),
      activeAgents: Number(data?.activeAgents ?? data?.agents ?? 0),
      updatedAt,
    })
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'failed to load fsqmix metrics' })
  }
}

