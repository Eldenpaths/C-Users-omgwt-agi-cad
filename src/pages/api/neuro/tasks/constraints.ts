import type { NextApiRequest, NextApiResponse } from 'next'
import { getAdminDb } from '@/lib/server/firebaseAdmin'
import { setConstraints } from '@/lib/neuroevolution/constraints'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const db = getAdminDb()
  if (req.method === 'GET') {
    const snap = await db.collection('task_constraints').get()
    const data: Record<string, any> = {}
    snap.docs.forEach((d) => (data[d.id] = d.data()))
    return res.status(200).json({ ok: true, data })
  }
  if (req.method === 'POST') {
    try {
      const { type, constraints } = req.body || {}
      if (!type || !constraints) return res.status(400).json({ ok: false, error: 'type+constraints required' })
      await db.collection('task_constraints').doc(String(type)).set(constraints, { merge: true })
      // also update in-memory store for live processes
      setConstraints(String(type) as any, constraints)
      return res.status(200).json({ ok: true })
    } catch (e) {
      return res.status(500).json({ ok: false, error: (e as Error).message })
    }
  }
  return res.status(405).json({ ok: false, error: 'Method Not Allowed' })
}

