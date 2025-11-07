import type { NextApiRequest, NextApiResponse } from 'next'
import { getFirestoreInstance } from '@/lib/firebase/server'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  const token = req.headers['x-mission-control-key'] || ''
  const expected = process.env.MISSION_CONTROL_KEY || ''
  if (!expected || token !== expected) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const body = (req.body && typeof req.body === 'object') ? req.body as any : {}
    const settings = body.settings || {}
    const meta = {
      userAgent: req.headers['user-agent'] || '',
      ip: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '',
    }
    const db = getFirestoreInstance()
    const doc = await db.collection('hud_settings').add({
      settings,
      meta,
      createdAt: (await import('firebase-admin/firestore')).FieldValue.serverTimestamp(),
    })
    return res.status(200).json({ ok: true, id: doc.id })
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'failed to persist settings' })
  }
}

